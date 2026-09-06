import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { missingForgeMaterials, recyclingScrapSupplement, createBudgetForgePolicy, searchForgeWeights } from './helpers/loot-idle-budget.mjs';
import { createLootTownPolicy } from './helpers/loot-town-policy.mjs';

const bundled = await build({ stdin: { resolveDir: process.cwd(), loader:'ts', contents: `
  export { FORGE_CRAFT_COST, FORGE_RARITY_WEIGHTS, FORGE_RECYCLE_REWARDS, getForgeUpgradeCost, scaleForgeMaterialsForItemLevel } from './shared/domain/forge-economy.ts';
  export { applyTownCommand, initialTownState } from './supabase/functions/game-api/town-authority.ts';
  export { getBuildingUpgradeCost, checkBuildingUnlocked } from './shared/data/buildings.ts';
  export { recruitmentCost } from './shared/domain/hero.ts';
  export { ITEM_LIBRARY } from './shared/domain/items/items.ts';
` }, bundle:true, write:false, platform:'node', format:'esm' });
const lib = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
for (const mode of ['moderate','scarce','idleRhythm']) for (let level=1;level<=8;level++) {
  const original = lib.FORGE_RARITY_WEIGHTS[level];
  const weights = searchForgeWeights(original,level,mode);
  assert(Math.abs(weights.reduce((s,[,w])=>s+w,0)-100)<1e-9);
  assert(weights.every(([,w],i)=>w>=0 && (original[i][1]>0 || w===0)),'must preserve impossible rarities');
  assert(weights[0][1]>0,'ordinary outcomes remain possible');
  if(level===1) assert.deepEqual(weights,original,'initial probabilities must be unchanged');
}
assert.deepEqual(missingForgeMaterials([{materialId:'refined_metal',count:100}],lib.FORGE_CRAFT_COST),['metal_scrap']);
assert.deepEqual(missingForgeMaterials([],lib.FORGE_CRAFT_COST),['metal_scrap','refined_metal']);
assert.deepEqual(missingForgeMaterials(lib.FORGE_CRAFT_COST,lib.FORGE_CRAFT_COST),[]);
let cases = 0;
let minScrapLoss = Infinity;
for (let band=1;band<=8;band++) for (const rarity of ['common','uncommon','rare','epic','legendary']) for (const efficient of [false,true]) {
  const item = {powerModelId:'level-bands-v1',itemLevel:band*5-4,rarity};
  const rate = efficient ? .1+.2*(band-1)/7 : 0;
  const scrap = (stacks) => stacks.find((m) => m.materialId==='metal_scrap')?.count??0;
  const start = scrap(lib.scaleForgeMaterialsForItemLevel(lib.FORGE_CRAFT_COST,item.itemLevel));
  const upgrade = scrap(lib.getForgeUpgradeCost(rarity,item.itemLevel));
  const returned = scrap(lib.scaleForgeMaterialsForItemLevel(lib.FORGE_RECYCLE_REWARDS[rarity],item.itemLevel))+recyclingScrapSupplement(lib,item);
  const loss = start-Math.floor(start*rate)+upgrade-Math.floor(upgrade*rate)-returned;
  assert(loss>0,`free scrap cycle: ${band}/${rarity}/${efficient}`);
  if (['common','uncommon','rare'].includes(rarity)) assert.equal(recyclingScrapSupplement(lib,item),0);
  minScrapLoss=Math.min(minScrapLoss,loss); cases++;
}
assert.equal(recyclingScrapSupplement(lib,{powerModelId:'legacy-fixed-v1',itemLevel:40,rarity:'legendary'}),0);
const initial = createLootTownPolicy(lib,3).prepare();
const recipe = lib.ITEM_LIBRARY.find((i) => i.catalogStatus==='active' && i.powerModelId==='level-bands-v1' && i.blueprintAvailable && i.provenances.includes('forge'));
const item = {instanceId:'test-budget-recycle',itemId:recipe.id,powerModelId:recipe.powerModelId,itemLevel:1,rarity:'epic'};
const source = {...initial,buildings:{...initial.buildings,forge:1},storedItems:[item]};
const sourceCopy = JSON.stringify(source);
const run = {seed:3,materialsGross:{},currentExploration:10};
const policy = createBudgetForgePolicy(lib,{recycleBase:true},run);
policy.initialize(source);
const recycled = policy.command(source,{type:'inventory.recycle',instanceId:item.instanceId});
assert.equal(JSON.stringify(source),sourceCopy,'candidate must not mutate the source');
assert.equal(policy.ledger.recycleSupplement.metal_scrap,2);
policy.capture(recycled);
assert(Object.values(policy.ledger.conservationError).every((n) => n===0),'supplement must be counted exactly once');
const poor = {...source,forgeMaterials:[{materialId:'refined_metal',rarity:'uncommon',count:100}]};
const poorPolicy = createBudgetForgePolicy(lib,{},run); poorPolicy.initialize(poor);
poorPolicy.craft(poor,{},10,()=>{throw new Error('unfunded craft must not probe recipes');});
assert.equal(poorPolicy.ledger.bands['1-5'].materialBlockedById.metal_scrap,1);
assert.equal(poorPolicy.ledger.bands['1-5'].materialBlockedById.refined_metal,undefined);
console.log(`PASS: exact missing-material diagnostics; ${cases} craft/recycle outcomes consume scraps strictly (minimum ${minScrapLoss}); legacy and lower rarity returns unchanged`);
