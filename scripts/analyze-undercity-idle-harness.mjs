import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const directory=resolve(process.argv[2]??'');
if(!process.argv[2])throw Error('Provide an undercity campaign directory');
const runs=JSON.parse(await readFile(join(directory,'reports.json'),'utf8')).filter(run=>run.journey);
assert(runs.length>0,'No Journey reports');
assert(runs.every(run=>run.journeyComplete),'Incomplete Journey report');

const stats=values=>{
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return {count:sorted.length,min:sorted[0],median:(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.ceil((sorted.length-1)/2)])/2,max:sorted.at(-1),mean:values.reduce((sum,value)=>sum+value,0)/values.length};
};
const cadences=[{id:'30m',seconds:1800},{id:'2h',seconds:7200},{id:'8h',seconds:28800}];
const checkins=Object.fromEntries(cadences.map(cadence=>{
 const rows=runs.map(run=>{
  const activeSeconds=run.simulatedSeconds;
  const interruptions=run.journeyMetrics.manualRestarts;
  const expectedBlockedSeconds=interruptions*cadence.seconds/2;
  const worstBlockedSeconds=interruptions*cadence.seconds;
  return {seed:run.seed,interruptions,activeHours:activeSeconds/3600,
   expectedBlockedHours:expectedBlockedSeconds/3600,worstBlockedHours:worstBlockedSeconds/3600,
   expectedCalendarHours:(activeSeconds+expectedBlockedSeconds)/3600,
   expectedBlockedShare:expectedBlockedSeconds/(activeSeconds+expectedBlockedSeconds),
   interventionsPerActiveDay:interruptions/(activeSeconds/86400)};
 });
 return [cadence.id,{assumption:'Fixed player check-ins; interruption uniformly distributed inside the interval, so expected wait is half the cadence.',
  activeHours:stats(rows.map(row=>row.activeHours)),interruptions:stats(rows.map(row=>row.interruptions)),
  expectedBlockedHours:stats(rows.map(row=>row.expectedBlockedHours)),worstBlockedHours:stats(rows.map(row=>row.worstBlockedHours)),
  expectedCalendarHours:stats(rows.map(row=>row.expectedCalendarHours)),expectedBlockedShare:stats(rows.map(row=>row.expectedBlockedShare)),
  interventionsPerActiveDay:stats(rows.map(row=>row.interventionsPerActiveDay))}];
}));

const signatureTotals=runs.reduce((totals,run)=>{
 const signature=run.journeyMetrics.signatures;
 for(const key of ['kingVictories','marksEarned','marksSpent','blueprints','directDrops','crafted','epic','legendary'])totals[key]+=signature[key];
 return totals;
},{kingVictories:0,marksEarned:0,marksSpent:0,blueprints:0,directDrops:0,crafted:0,epic:0,legendary:0});
const firstEvent=key=>stats(runs.flatMap(run=>{
 const exploration=run.journeyMetrics.signatures[key];
 return exploration==null?[]:[exploration];
}));
const firstCraftAfterClear=stats(runs.flatMap(run=>{
 const craft=run.journeyMetrics.signatures.firstCraftExploration;
 const clear=run.journeyMetrics.firstClearExploration;
 return craft==null||clear==null?[]:[craft-clear];
}));
const inventoryRuns=runs.filter(run=>run.inventory);
const inventory=inventoryRuns.length?{
 maxBeforeRecycle:stats(inventoryRuns.map(run=>run.inventory.maxBeforeRecycle)),
 maxAfterManagement:stats(inventoryRuns.map(run=>run.inventory.maxAfterManagement)),
 finalStoredItems:stats(inventoryRuns.map(run=>run.inventory.finalStoredItems)),
 finalFutureItems:stats(inventoryRuns.map(run=>run.inventory.finalFutureItems)),
 recycled:stats(inventoryRuns.map(run=>run.recycled)),
 automaticRecycleShare:stats(inventoryRuns.map(run=>run.recycled/Math.max(1,run.items+run.forge.crafts)))
}:null;

const result={scope:'harness-only idle interpretation',runs:runs.length,
 limitations:[
  'Check-in delay is a calendar-time projection; combat and recovery are not rerun during the blocked period.',
  'The harness has no finite inventory capacity. Counts measure pressure before and after automatic management, not a production overflow rule.',
  'Signature rates are observations from these deterministic seeds, not probability guarantees.'
 ],checkins,signatures:{totals:signatureTotals,firstBlueprintExploration:firstEvent('firstBlueprintExploration'),
  firstDropExploration:firstEvent('firstDropExploration'),firstCraftExploration:firstEvent('firstCraftExploration'),firstCraftAfterClearExplorations:firstCraftAfterClear},
 inventory};
await writeFile(join(directory,'idle-analysis.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
