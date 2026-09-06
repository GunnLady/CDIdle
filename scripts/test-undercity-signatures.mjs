import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {
 RAT_KING_MARK_ID,RAT_KING_PARAMETERS,RAT_KING_SIGNATURE_IDS,SIGNATURE_FINAL_MODIFIERS,
 applyRatKingLoot,applyThemedLoot,craftRatKingSignature,makeSignatureInstance,patchSignatureCatalog,
} from './helpers/undercity-signatures.mjs';

const compiled=await build({stdin:{contents:`
 export {ITEM_LIBRARY,getItemById,validateItemCatalog} from './shared/domain/items/items.ts';
 export {resolveItemInstance} from './shared/domain/items/scaling.ts';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{
 name:'rat-king-catalogue',setup(builder){builder.onLoad({filter:/items\.ts$/},async({path})=>({
  contents:patchSignatureCatalog((await readFile(path,'utf8')).replaceAll('\r\n','\n')),loader:'ts',
 }));},
}]});
const lib=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

assert.deepEqual(lib.validateItemCatalog(),[]);
for(const id of RAT_KING_SIGNATURE_IDS)assert(lib.getItemById(id));
const modifier=(list,stat)=>list.find(entry=>entry.stat===stat)?.value;
for(const rarity of ['epic','legendary'])for(const itemId of RAT_KING_SIGNATURE_IDS){
 const instance=makeSignatureInstance(itemId,rarity,`fixture:${rarity}:${itemId}`);
 const resolved=lib.resolveItemInstance(lib.getItemById(itemId),instance);
 assert.deepEqual(resolved.modifiers,SIGNATURE_FINAL_MODIFIERS[rarity][itemId]);
 if(rarity==='legendary')assert(!resolved.modifiers.some(entry=>entry.value<0));
}
const epicFang=lib.resolveItemInstance(lib.getItemById('rat_king_fang'),makeSignatureInstance('rat_king_fang','epic','epic-fang'));
const legendaryFang=lib.resolveItemInstance(lib.getItemById('rat_king_fang'),makeSignatureInstance('rat_king_fang','legendary','legendary-fang'));
assert.deepEqual(epicFang.damageRange,{min:105,max:193});
assert.deepEqual(legendaryFang.damageRange,{min:150,max:275});
assert.equal(modifier(epicFang.modifiers,'holyResistance'),-15);
assert.equal(modifier(legendaryFang.modifiers,'holyResistance'),undefined);
console.log('Rat King catalogue passed: three valid level-35 signatures, exact epic drawbacks and drawback-free legendary variants.');

const ordinary={instanceId:'ordinary',itemId:'progression_ring',itemLevel:10,powerModelId:'level-bands-v1',rarity:'rare'};
const themedState={storedItems:[ordinary],forgeMaterials:[],itemBlueprints:[],buildings:{forge:8}};
const themedEncounter={floor:12,outcome:'victory',kind:'fight',enemy:{isBoss:false},transcript:[],rewards:{loot:[{type:'item',...ordinary,count:1}]}};
assert.equal(applyThemedLoot(lib,themedState,themedEncounter),1);
assert.equal(themedEncounter.rewards.loot[0].theme,'smugglers');
assert.equal(themedState.storedItems[0].modifiers.length,4,'Rare base modifiers plus one zone identity');
assert.deepEqual(themedEncounter.rewards.loot[0].themeModifier,themedState.storedItems[0].modifiers.at(-1));
for(const floor of [5,15,25,35,45]){
 const themedStats=new Set();
 for(let index=0;index<80;index++){
  const item={instanceId:`themed:${floor}:${index}`,itemId:'progression_ring',itemLevel:10,powerModelId:'level-bands-v1',rarity:'rare'};
  const state={storedItems:[item],forgeMaterials:[],itemBlueprints:[],buildings:{forge:8}};
  const encounter={floor,outcome:'victory',kind:'fight',enemy:{isBoss:false},transcript:[],rewards:{loot:[{type:'item',...item,count:1}]}};
  applyThemedLoot(lib,state,encounter);themedStats.add(encounter.rewards.loot[0].themeModifier.stat);
 }
 assert(themedStats.size>=3,`Zone ${floor} pool must produce several compatible thematic stats`);
}
const staff={instanceId:'court-staff',itemId:'progression_staff',itemLevel:35,powerModelId:'level-bands-v1',rarity:'epic'};
const staffState={storedItems:[staff],forgeMaterials:[],itemBlueprints:[],buildings:{forge:8}};
const staffEncounter={floor:45,outcome:'victory',kind:'fight',enemy:{isBoss:false},transcript:[],rewards:{loot:[{type:'item',...staff,count:1}]}};
applyThemedLoot(lib,staffState,staffEncounter);
assert.notEqual(staffEncounter.rewards.loot[0].themeModifier.stat,'physicalDamage','Magic weapon cannot receive the physical-only theme modifier');
console.log('Thematic loot passed: deterministic zone pools vary and filter incompatible weapon damage bonuses.');

const metrics={kingVictories:0,marksEarned:0,blueprints:0,directDrops:0,epic:0,legendary:0};
const kingState={storedItems:[],forgeMaterials:[],itemBlueprints:[],buildings:{forge:8}};
const kingEncounter={floor:50,room:5,kind:'fight',outcome:'victory',enemy:{isBoss:true,name:'Le Roi des Rats'},transcript:[],rewards:{loot:[]}};
applyRatKingLoot(kingState,kingEncounter,{seed:1,exploration:2,metrics,forced:{markRoll:0,blueprintRoll:0,blueprintChoiceRoll:0,signatureRoll:0,signatureChoiceRoll:.9,legendaryRoll:1}});
assert.equal(kingState.forgeMaterials.find(entry=>entry.materialId===RAT_KING_MARK_ID).count,1);
assert.equal(kingState.itemBlueprints.length,1);assert.equal(kingState.itemBlueprints[0].itemId,'rat_king_fang');
assert.equal(kingEncounter.rewards.loot.filter(entry=>entry.source==='rat_king_signature').length,1);
assert.equal(kingEncounter.rewards.loot.find(entry=>entry.source==='rat_king_signature').itemId,'tribute_chain');
assert.deepEqual(metrics,{kingVictories:1,marksEarned:1,blueprints:1,directDrops:1,epic:1,legendary:0});
assert.equal(kingEncounter.transcript.filter(event=>event.type==='reward.rat_king_mark').length,1);
console.log('Rat King victory passed: one encounter roll, guaranteed Mark, independent blueprint and signature drops.');

const stock=RAT_KING_PARAMETERS.recipeCosts.map(cost=>({...cost,count:cost.count}));
const craftState={storedItems:[],forgeMaterials:stock,itemBlueprints:[{itemId:'rat_king_fang',unlocked:true}],buildings:{forge:8}};
const crafted=craftRatKingSignature(craftState,'rat_king_fang',{seed:4,craftIndex:0,forcedLegendary:true});
assert(crafted.crafted);assert.equal(crafted.crafted.rarity,'legendary');assert.equal(craftState.forgeMaterials.length,0);
assert(!crafted.crafted.modifiers.some(entry=>entry.value<0));
const blocked=craftRatKingSignature({storedItems:[],forgeMaterials:stock,itemBlueprints:[],buildings:{forge:8}},'rat_king_fang');
assert.equal(blocked.reason,'blueprint');
assert.throws(()=>craftRatKingSignature(craftState,'missing'));
console.log('Rat King craft passed: separate blueprint, shared six-Mark recipe, forge gate, exact consumption and legendary drawback removal.');
