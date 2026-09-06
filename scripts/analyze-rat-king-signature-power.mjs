import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {
 RAT_KING_SIGNATURE_IDS,makeSignatureInstance,patchSignatureCatalog,
} from './helpers/undercity-signatures.mjs';

const compiled=await build({stdin:{contents:`
 export {ITEM_LIBRARY,getItemById} from './shared/domain/items/items.ts';
 export {resolveItemInstance} from './shared/domain/items/scaling.ts';
 export {refreshHeroCombatStats} from './shared/domain/game-calculations.ts';
 export {applyInventoryCommand} from './supabase/functions/game-api/inventory-authority.ts';
 export {initialTownState} from './supabase/functions/game-api/town-state.ts';
 export {makeHero} from './tests/fixtures/game.ts';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{
 name:'rat-king-catalogue',setup(builder){builder.onLoad({filter:/items\.ts$/},async({path})=>({
  contents:patchSignatureCatalog((await readFile(path,'utf8')).replaceAll('\r\n','\n')),loader:'ts',
 }));},
}]});
const lib=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const hero=lib.refreshHeroCombatStats(lib.makeHero({
 id:'signature-power-hero',classType:'Voleur',level:35,currentHp:500,currentMana:200,
 baseStats:{str:28,agi:48,end:38,int:24,wiz:24,dex:42,luk:32},
 equipment:{mainHand:null,offHand:null,armor:null,accessory:null},
}));
const specialtyScore=(current,itemId)=>{
 const stats=current.calculatedStats;
 if(itemId==='rat_king_fang')return stats.estimatedDps*12+stats.speed*2+stats.criticalChance*3;
 if(itemId==='outcasts_mantle')return stats.maxHp*1.5+stats.physicalDefense*6+stats.magicDefense*4+
  Object.values(stats.resistances).reduce((sum,value)=>sum+value,0);
 return stats.maxHp*1.5+stats.speed*2+stats.dodgeChance*3+stats.maxMana*.25+stats.resistances.poison;
};
function contribution(instance,signatureId){
 const state={...lib.initialTownState(1),heroes:[structuredClone(hero)],storedItems:[instance]};
 const equipped=lib.applyInventoryCommand(state,{type:'hero.equip',heroId:hero.id,instanceId:instance.instanceId}).state.heroes[0];
 return specialtyScore(equipped,signatureId)-specialtyScore(hero,signatureId);
}
function ordinaryCandidates(signatureId,rarity){
 const signature=lib.getItemById(signatureId);
 const relevant=item=>item.catalogStatus==='active'&&item.powerModelId==='level-bands-v1'&&
  item.levelRange.min<=35&&item.levelRange.max>=35&&(
   signature.itemType==='weapon'?item.itemType==='weapon'&&item.weaponTypeId===signature.weaponTypeId:
   signature.itemType==='armor'?item.itemType==='armor'&&item.armorTypeId===signature.armorTypeId:
   item.itemType==='accessory'
  );
 const scores=[];
 for(const item of lib.ITEM_LIBRARY.filter(relevant))for(let sample=0;sample<100;sample++){
  const instanceId=`ordinary:${item.id}:${rarity}:${sample}`;
  const resolved=lib.resolveItemInstance(item,{instanceId,itemLevel:35,powerModelId:item.powerModelId,rarity});
  const instance={instanceId,itemId:item.id,itemLevel:35,powerModelId:item.powerModelId,rarity,modifiers:resolved.modifiers};
  try{scores.push({itemId:item.id,score:contribution(instance,signatureId),damageRange:resolved.damageRange,modifiers:resolved.modifiers});}catch{}
 }
 return scores.sort((a,b)=>a.score-b.score);
}
const report=[];
for(const itemId of RAT_KING_SIGNATURE_IDS)for(const rarity of ['epic','legendary']){
 const signatureScore=contribution(makeSignatureInstance(itemId,rarity,`signature:${itemId}:${rarity}`),itemId);
 const ordinary=ordinaryCandidates(itemId,rarity);
 assert(ordinary.length>0,`No ordinary comparison for ${itemId} ${rarity}`);
 const maximum=ordinary.at(-1);
  const median=ordinary[Math.floor(ordinary.length/2)];
  const p90=ordinary[Math.floor((ordinary.length-1)*.9)];
 const percentile=ordinary.filter(candidate=>candidate.score<=signatureScore).length/ordinary.length;
 report.push({itemId,rarity,signatureScore,ordinarySamples:ordinary.length,
  ordinaryMedian:median.score,ordinaryP90:p90.score,ordinaryP90ItemId:p90.itemId,
  ordinaryP90DamageRange:p90.damageRange,ordinaryP90Modifiers:p90.modifiers,
  ordinaryMaximum:maximum.score,ordinaryMaximumItemId:maximum.itemId,
  versusMedianPercent:(signatureScore/median.score-1)*100,
  versusMaximumPercent:(signatureScore/maximum.score-1)*100,percentile});
}
console.log(JSON.stringify({scope:'level-35 representative Voleur; identity-specific combat score; 100 deterministic affix samples per comparable base',threshold:'signature at or above ordinary p90 in its intended role',report},null,2));
assert.deepEqual(report.filter(result=>result.percentile<.9).map(result=>`${result.itemId}:${result.rarity}`),[],
 'Rat King signatures below the powerful-item threshold');
