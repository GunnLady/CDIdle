import {createJourney,JOURNEY_REWARDS} from './undercity-journey.mjs';
import {applyThemedLoot,applyRatKingLoot,craftRatKingSignature,RAT_KING_MARK_ID,RAT_KING_PARAMETERS,RAT_KING_SIGNATURE_IDS} from './undercity-signatures.mjs';
export function createJourneyDriver(lib,seed,options={}){
 const journey=createJourney();
 const targetFarmLoops=options.farmLoops??JOURNEY_REWARDS.farmLoops;
 const targetFarmZone=options.farmZone??seed%5;
 if(!Number.isInteger(targetFarmLoops)||targetFarmLoops<1||!Number.isInteger(targetFarmZone)||targetFarmZone<0||targetFarmZone>4)throw Error('Invalid journey driver options');
 const metrics={personalXp:0,personalLots:0,personalItems:0,manualRestarts:0,firstClearExploration:null,
  targetFarmLoops,targetFarmZone,
  farmEncounters:0,farmItems:0,farmMaterials:0,themedItems:0,
  signatures:{kingVictories:0,marksEarned:0,marksSpent:0,blueprints:0,directDrops:0,crafted:0,epic:0,legendary:0,
   firstBlueprintExploration:null,firstDropExploration:null,firstCraftExploration:null,craftCosts:{}}};
 let participantLevels=new Map(),craftIndex=0,pendingCraftCosts=[];
 function sync(state){
  const ids=state.heroes.map(h=>h.id);
  if(JSON.stringify(ids)!==JSON.stringify(journey.data.group.ids))return {...state,...journey.select(ids)};
  if(journey.data.expedition.halted){metrics.manualRestarts++;return {...state,...journey.restart()};}
  return state;
 }
 function begin(state,id,floor,room){
  if(journey.pending())throw Error('Unresolved personal encounter');
  const participants=state.heroes.filter(h=>h.isActive&&h.currentHp>0);
  participantLevels=new Map(participants.map(h=>[h.id,h.level]));
  journey.begin({id,floor,room,roomCount:lib.getDungeonRoomCount(floor),participants:participants.map(h=>h.id)});
 }
 function awards(xp){
  return (journey.pending()?.awards??[]).map(a=>({...a,
   xp:Math.max(1,Math.floor(xp*(a.kind==='boss'?JOURNEY_REWARDS.bossXpFactor:JOURNEY_REWARDS.eliteXpFactor))),
   materialId:a.kind==='boss'?'refined_metal':'metal_scrap',
   rarity:a.kind==='boss'?'uncommon':'common',count:Math.ceil(a.floor/10)*JOURNEY_REWARDS.materialPerBand,
   ...(a.kind==='boss'?{item:{
    instanceId:`personal-item:${a.fixed}:${a.heroId}`,
    itemId:['progression_ring','progression_amulet','progression_bracelet','progression_belt','progression_cloak','progression_charm'][(a.floor/10-1)%6],
    itemLevel:Math.max(1,Math.min(participantLevels.get(a.heroId)??1,lib.getChestLootBand(a.floor).levelMax)),
    powerModelId:'level-bands-v1',rarity:'rare',
   }}:{})}));
 }
 function settle(resolution,before,exploration){
  const {encounter:e,state}=resolution;
  if(!journey.pending())begin(before,e.encounterId,e.floor,e.room);
  const farming=journey.data.expedition.mode==='farm';
  const result=journey.settle({id:e.encounterId,victory:e.outcome==='victory',wipe:e.outcome==='defeat'&&e.kind==='fight',advance:e.kind!=='fight'});
  const actual=e.transcript.filter(e=>e.type==='reward.personal_first');
  if(actual.length!==result.awards.length)throw Error('Personal award ledger mismatch');
  metrics.personalLots+=actual.length;metrics.personalXp+=actual.reduce((s,a)=>s+a.xp,0);
  const personalItems=e.transcript.filter(event=>event.type==='reward.personal_first_item');
  const expectedItems=result.awards.filter(award=>award.kind==='boss').length;
  if(personalItems.length!==expectedItems)throw Error('Personal item ledger mismatch');
  metrics.personalItems+=personalItems.length;
  if(!result.replay){
   metrics.themedItems+=applyThemedLoot(lib,state,e);
   const blueprintsBefore=metrics.signatures.blueprints,dropsBefore=metrics.signatures.directDrops;
   applyRatKingLoot(state,e,{seed,exploration,metrics:metrics.signatures});
   if(metrics.signatures.blueprints>blueprintsBefore&&metrics.signatures.firstBlueprintExploration===null)metrics.signatures.firstBlueprintExploration=exploration;
   if(metrics.signatures.directDrops>dropsBefore&&metrics.signatures.firstDropExploration===null)metrics.signatures.firstDropExploration=exploration;
  }
  const known=RAT_KING_SIGNATURE_IDS.filter(itemId=>(state.itemBlueprints??[]).some(plan=>plan.itemId===itemId&&plan.unlocked));
  if(!result.replay&&known.length){
   const itemId=known[craftIndex%known.length];
   const crafted=craftRatKingSignature(state,itemId,{seed,craftIndex});
   if(crafted.crafted){
    craftIndex++;metrics.signatures.crafted++;metrics.signatures[crafted.crafted.rarity]++;
    metrics.signatures.firstCraftExploration??=exploration;
    e.rewards.loot.push({type:'item',...crafted.crafted,count:1,source:'rat_king_craft'});
    e.transcript.push({sequence:e.transcript.length,type:'reward.rat_king_craft',category:'loot',message:'Fabrication signature du Roi',itemId,instanceId:crafted.crafted.instanceId,rarity:crafted.crafted.rarity});
    pendingCraftCosts.push(...crafted.costs);
    for(const cost of crafted.costs){
     metrics.signatures.craftCosts[cost.materialId]=(metrics.signatures.craftCosts[cost.materialId]??0)+cost.count;
     if(cost.materialId==='rat_king_mark')metrics.signatures.marksSpent+=cost.count;
    }
   }
  }
  if(farming){metrics.farmEncounters++;metrics.farmItems+=e.rewards.loot.filter(l=>l.type==='item').length;metrics.farmMaterials+=e.rewards.loot.filter(l=>l.type==='material').reduce((s,l)=>s+l.count,0);}
  if(journey.data.firstClear&&metrics.firstClearExploration===null)metrics.firstClearExploration=exploration;
  let route=result;
  if(journey.canFarm()&&journey.data.expedition.mode==='progression')route=journey.farm(targetFarmZone);
  return {...resolution,state:{...state,activeDungeonFloor:route.activeDungeonFloor,activeDungeonRoom:route.activeDungeonRoom}};
 }
 return {journey,metrics,sync,begin,awards,settle,
  retreat:state=>({...state,...journey.cancel()}),
  reserveSignatureMaterials:state=>RAT_KING_SIGNATURE_IDS.some(itemId=>(state.itemBlueprints??[]).some(plan=>plan.itemId===itemId&&plan.unlocked))
   &&(state.forgeMaterials.find(material=>material.materialId===RAT_KING_MARK_ID)?.count??0)>=RAT_KING_PARAMETERS.recipeCosts.find(cost=>cost.materialId===RAT_KING_MARK_ID).count,
  drainCraftCosts:()=>{const costs=pendingCraftCosts;pendingCraftCosts=[];return costs;},
  complete:()=>journey.data.expedition.mode==='farm'&&journey.data.expedition.loops>=targetFarmLoops};
}
