// Harness-only persistent personal progression. No game imports.
export const JOURNEY_REWARDS={eliteXpFactor:.5,bossXpFactor:1,materialPerBand:1,farmLoops:2};
export const fixedVictoryId=(floor,room,roomCount)=>room===roomCount&&floor%5===0
 ? 'undercity:'+(floor%10===0?'boss':'elite')+':'+String(floor).padStart(2,'0'):null;
export function createJourney(saved){
 const data=saved?structuredClone(saved):{version:1,heroes:{},group:{ids:[]},expedition:{mode:'progression',zone:0,floor:1,room:1,loops:0,halted:false,haltReason:null},receipts:{},grants:[],restarts:0,firstClear:false};
 if(data.version!==1)throw Error('Unsupported journey version');
 data.expedition.halted??=false;data.expedition.haltReason??=null;
 let pending=null;
 const hero=id=>data.heroes[id]??={completedFloor:0,claims:[]};
 const canFarm=()=>data.group.ids.length>0&&data.group.ids.every(id=>hero(id).completedFloor===50&&hero(id).claims.includes('undercity:boss:50'));
 const checkpoint=()=>data.group.ids.length?Math.min(...data.group.ids.map(id=>Math.floor(hero(id).completedFloor/5)*5)):0;
 function restart(){
  if(pending)throw Error('Cannot retreat during combat');
  const e=data.expedition;e.floor=e.mode==='farm'?e.zone*10+1:Math.min(50,checkpoint()+1);e.room=1;e.halted=false;e.haltReason=null;data.restarts++;return position();
 }
 function position(){return {activeDungeonFloor:data.expedition.floor,activeDungeonRoom:data.expedition.room};}
 function select(ids){
  if(pending)throw Error('Cannot change group during combat');
  if(!ids.length||ids.length>4||new Set(ids).size!==ids.length)throw Error('Invalid group');
  if(JSON.stringify(ids)===JSON.stringify(data.group.ids))return position();
  data.group.ids=[...ids];ids.forEach(hero);
  if(!canFarm())data.expedition.mode='progression';
  return restart();
 }
 function farm(zone){
  if(pending)throw Error('Cannot change expedition during combat');
  if(!Number.isInteger(zone)||zone<0||zone>4||!canFarm())throw Error('Farm locked for this group');
  data.expedition={mode:'farm',zone,floor:zone*10+1,room:1,loops:0,halted:false,haltReason:null};return position();
 }
 function begin({id,floor,room,roomCount,participants}){
  if(data.receipts[id])return {replay:true,awards:[]};
  if(pending)throw Error('Encounter already active');
  if(floor<1||floor>50||!Number.isInteger(room)||room<1||room>roomCount)throw Error('Invalid encounter position');
  if(data.expedition.mode==='farm'){
   if(!canFarm()||floor<data.expedition.zone*10+1||floor>data.expedition.zone*10+10)throw Error('Invalid farm route');
  }else if(floor>Math.min(...data.group.ids.map(id=>hero(id).completedFloor))+1)throw Error('Skipped personal progression');
  if(participants.some(id=>!data.group.ids.includes(id))||new Set(participants).size!==participants.length)throw Error('Invalid participants');
  const fixed=fixedVictoryId(floor,room,roomCount);
  pending={id,floor,room,roomCount,participants:[...participants],fixed,
   awards:fixed?participants.filter(id=>!hero(id).claims.includes(fixed)).map(heroId=>({heroId,fixed,floor,kind:floor%10===0?'boss':'elite'})):[]};
  return structuredClone(pending);
 }
 function settle({id,victory,wipe=false,advance=false}){
  if(data.receipts[id])return {replay:true,awards:[],...position()};
  if(!pending||pending.id!==id)throw Error('No matching encounter');
  const encounter=pending;pending=null;const e=data.expedition;
  const awards=victory?encounter.awards:[];
  for(const award of awards){hero(award.heroId).claims.push(award.fixed);data.grants.push({...award,encounterId:id});}
  if(victory&&encounter.room===encounter.roomCount){
   for(const id of encounter.participants){const h=hero(id);if(h.completedFloor===encounter.floor-1)h.completedFloor=encounter.floor;}
  }
  data.receipts[id]={victory,awardKeys:awards.map(a=>a.heroId+':'+a.fixed)};
  if(wipe){e.halted=true;e.haltReason='wipe';return {awards,...position(),halted:true};}
  if(victory||advance){
   if(encounter.room<encounter.roomCount){e.floor=encounter.floor;e.room=encounter.room+1;}
   else if(e.mode==='farm'&&encounter.floor===(e.zone+1)*10){e.floor=e.zone*10+1;e.room=1;e.loops++;}
   else if(encounter.floor===50){e.floor=50;e.room=1;if(canFarm())data.firstClear=true;}
   else {e.floor=encounter.floor+1;e.room=1;}
  }else{e.floor=encounter.floor;e.room=encounter.room;}
  if(e.mode==='progression'){const ceiling=Math.min(...data.group.ids.map(id=>hero(id).completedFloor))+1;if(e.floor>ceiling){e.floor=ceiling;e.room=1;}}
  return {awards,...position()};
 }
 function cancel(){pending=null;data.expedition.halted=true;data.expedition.haltReason='retreat';return {...position(),halted:true};}
 return {data,select,farm,begin,settle,restart,cancel,position,canFarm,checkpoint,
  pending:()=>pending?structuredClone(pending):null,
  save:()=>{if(pending)throw Error('Cannot snapshot an unresolved combat');return structuredClone(data);}};
}
