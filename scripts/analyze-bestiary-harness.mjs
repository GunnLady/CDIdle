import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const directory=resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Provide a bestiary campaign directory');
const runs=JSON.parse(await readFile(join(directory,'reports.json'),'utf8'));
const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
const stats=(values) => {
 if(!values.length) return null;
 const s=[...values].sort((a,b)=>a-b);
 return {n:s.length,min:s[0],median:(s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2,p90:s[Math.ceil(s.length*.9)-1],max:s.at(-1),mean:s.reduce((a,b)=>a+b,0)/s.length};
};
const complete=r=>r.journey?r.journeyComplete===true:manifest.stage==='undercity'?r.dungeonCleared===true:r.levels.length===4&&r.levels.every(l=>l>=40);
const baseline=new Map(runs.filter(r=>r.profile==='baseline').map(r=>[r.seed,r]));
assert.equal(baseline.size,manifest.seeds);
const result={experiment:manifest.experiment,profiles:{},checks:[],limits:[
 'Time is simulated from the authoritative campaign, not real player time.',
 'Teams are recruited and evolved by the existing policy; this is not an exhaustive matrix of fixed builds.',
 'Signature counters are opportunities only: no new item power, drop chance or reward is evaluated.',
 'Bestiary discoveries are a sidecar; no UI, permanent bonus or persistent save is modified.',
 'Exceptional rooms label existing noncombat encounters; no new wave, status-effect or room engine.',
 'Regions-only keeps legacy combat parameters to isolate naming/structure; roles add bounded stat and elemental changes.',
 'After floor 50, ordinary regions cycle; canonical bosses remain unchanged.',
 'Undercity uses collective HP, not multiple targets; floor placement is provisional and repeats after 40 for the campaign.',
],scope:'harness-only experiment'};
if(manifest.profiles.some(p=>p.startsWith('bestiaryUndercity'))){
 result.limits=result.limits.filter(x=>!x.startsWith('After floor 50')&&!x.startsWith('Regions-only')&&!x.startsWith('Undercity uses'));
 result.limits.push(manifest.stage==='undercity'?'Five subzones; stop on verified final-room victory at floor 50. Canonical XP, no floor-51 encounter.':'Historical four-subzone campaign, repeated after 40 for the level-40 driver.');
 result.limits.push('Collective profile uses one HP pool. Group profiles use individual targets, HP and effects; canonical loot tables remain attached to the encounter.');
 result.limits.push('Group damage and armor are nonlinear; equal total base attack and HP do not imply equal encounter difficulty.');
 result.limits.push('Group tactics account for area damage and summed incoming threat; other historical heuristics are not globally optimized for groups.');
 if(manifest.profiles.some(p=>p.startsWith('bestiaryUndercityJourney'))){
  result.limits=result.limits.filter(x=>!x.startsWith('Signature counters are opportunities'));
  result.limits.push('Journey profiles apply harness-only signature items, blueprints, Marks and crafting to real simulated inventory.');
 }
}
for(const profile of manifest.profiles) {
 const rows=runs.filter(r=>r.profile===profile);
 assert.equal(rows.length,manifest.seeds);
 assert.equal(new Set(rows.map(r=>r.seed)).size,manifest.seeds);
 const regions={};
 for(const r of rows) {
  assert(r.bestiary);
  assert.equal(r.goldConservationError,0);
  if(r.journey){
    const j=r.journey;
    assert.equal(new Set(j.grants.map(g=>g.heroId+':'+g.fixed)).size,j.grants.length,'Unique personal rewards');
    assert.equal(r.journeyMetrics.personalLots,j.grants.length);
    assert.equal(r.journeyMetrics.personalItems,j.grants.filter(g=>g.kind==='boss').length,'One ordinary item per personal first boss');
    assert(r.journeyMetrics.manualRestarts<=j.restarts,'Manual resume accounting');
    const signatures=r.journeyMetrics.signatures;
    assert(signatures.kingVictories>=1);assert(signatures.marksEarned>=signatures.kingVictories&&signatures.marksEarned<=signatures.kingVictories*2);
    assert(signatures.blueprints<=Math.min(3,signatures.kingVictories));assert(signatures.directDrops<=signatures.kingVictories);
    assert.equal(signatures.marksSpent,signatures.crafted*6);assert.equal(signatures.epic+signatures.legendary,signatures.directDrops+signatures.crafted);
    assert(r.journeyMetrics.themedItems>0,'Thematic item modifiers observed');
    if(complete(r)){
      assert.equal(j.expedition.mode,'farm');assert.equal(j.expedition.loops,r.journeyMetrics.targetFarmLoops??2);
      assert(j.group.ids.every(id=>j.heroes[id].completedFloor===50&&j.heroes[id].claims.includes('undercity:boss:50')));
      assert.equal(j.grants.length,j.group.ids.length*10);
      assert(r.journeyMetrics.farmEncounters>0);
    }
  }
  if(r.bestiary.groups){
    const g=r.bestiary.groups;
    assert.equal(g.fights,r.bestiary.fights);
    if(manifest.stage==='undercity'){
      assert.equal(g.soloFights+g.duoFights+g.trioFights,g.fights);
      if(complete(r)){assert.equal(Object.keys(g.zones).length,5);for(const z of Object.values(g.zones))assert(z.solo>0&&z.duo+z.trio>0);}
    }
    assert(g.kills<=g.enemies);
    assert.equal(Object.values(g.zones).reduce((s,z)=>s+z.fights,0),g.fights);
    if(profile==='bestiaryUndercityGroupsSingle') assert.equal(g.multipleTargetCasts,0);
  }
  if(manifest.stage==='undercity'&&complete(r)){assert.equal(r.finalBoss.floor,50);assert.equal(r.finalBoss.outcome,'victory');assert(r.passes.every(p=>p.floor<=50));}
  const totals=Object.values(r.bestiary.regions);
  assert.equal(totals.reduce((s,v)=>s+v.encounters,0),r.final.explorations);
  assert.equal(totals.reduce((s,v)=>s+v.fights,0),r.bestiary.fights);
  assert(Math.abs(totals.reduce((s,v)=>s+v.seconds,0)-r.simulatedSeconds)<1e-6);
  assert(Math.abs(totals.reduce((s,v)=>s+v.recoverySeconds,0)-r.recoveryWaitSeconds)<1e-6);
  if(['bestiaryRegions','bestiaryUndercityNames'].includes(profile)) {
   const control=baseline.get(r.seed);
   for(const key of ['simulatedSeconds','recoveryWaitSeconds','defeats','highestFloor','items']) assert.equal(r[key],control[key], 'names-only isolation: '+key);
   assert.deepEqual(r.final,control.final,'names-only economy isolation');
  }
  if(profile==='bestiaryRares') {
   const roles=runs.find(x=>x.profile==='bestiaryRoles' && x.seed===r.seed);
   if(roles) for(const key of ['simulatedSeconds','recoveryWaitSeconds','defeats','highestFloor','items']) assert.equal(r[key],roles[key],'rare combat/economy budget: '+key);
  }
  for(const [id,v] of Object.entries(r.bestiary.regions)) {
   const dst=regions[id]??={runs:0,encounters:0,fights:0,victories:0,defeats:0,rares:0,transitions:0,rounds:0,seconds:0,recoverySeconds:0,gold:0,items:0,roles:{}};
   dst.runs++;
   for(const key of ['encounters','fights','victories','defeats','rares','transitions','rounds','seconds','recoverySeconds','gold','items']) dst[key]+=v[key];
   for(const [key,n] of Object.entries(v.roles)) dst.roles[key]=(dst.roles[key]??0)+n;
  }
 }
 const paired=rows.filter(r=>!r.journey&&complete(r)&&complete(baseline.get(r.seed)));
 result.profiles[profile]={
  finished:rows.filter(complete).length,total:rows.length,
  hoursAllRuns:stats(rows.map(r=>r.simulatedSeconds/3600)),
  hoursCompleted:stats(rows.filter(complete).map(r=>r.simulatedSeconds/3600)),
  pairedDurationPercent:stats(paired.map(r=>100*(r.simulatedSeconds/baseline.get(r.seed).simulatedSeconds-1))),
  recoveryHours:stats(rows.map(r=>r.recoveryWaitSeconds/3600)),defeats:stats(rows.map(r=>r.defeats)),
  combatDefeats:stats(rows.map(r=>Object.values(r.bestiary.regions).reduce((s,v)=>s+v.defeats,0))),
  maxDryMinutes:stats(rows.map(r=>r.maxDrySeconds/60)),
  usefulCrafts:stats(rows.map(r=>r.final.usefulCrafts)),
  uniqueEquippedCrafts:stats(rows.map(r=>r.final.uniqueEquippedCrafts)),
  floors:stats(rows.map(r=>r.highestFloor)),items:stats(rows.map(r=>r.items)),
  discoveredSpecies:stats(rows.map(r=>Object.keys(r.bestiary.discoveries).length)),
  signatureOpportunities:stats(rows.map(r=>Object.values(r.bestiary.signatureOpportunities).reduce((s,n)=>s+n,0))),
  journey:rows.some(r=>r.journey)?{
    comparability:'Includes progression plus the configured farm loops; duration is not directly comparable with floor-50-only controls.',
    firstLots:stats(rows.map(r=>r.journeyMetrics.personalLots)),
    firstItems:stats(rows.map(r=>r.journeyMetrics.personalItems)),
    firstXp:stats(rows.map(r=>r.journeyMetrics.personalXp)),
    manualRestarts:stats(rows.map(r=>r.journeyMetrics.manualRestarts)),
    themedItems:stats(rows.map(r=>r.journeyMetrics.themedItems)),
    kingVictories:stats(rows.map(r=>r.journeyMetrics.signatures.kingVictories)),
    kingMarks:stats(rows.map(r=>r.journeyMetrics.signatures.marksEarned)),
    signatureBlueprints:stats(rows.map(r=>r.journeyMetrics.signatures.blueprints)),
    signatureDrops:stats(rows.map(r=>r.journeyMetrics.signatures.directDrops)),
    signatureCrafts:stats(rows.map(r=>r.journeyMetrics.signatures.crafted)),
    firstBlueprintExploration:stats(rows.flatMap(r=>r.journeyMetrics.signatures.firstBlueprintExploration==null?[]:[r.journeyMetrics.signatures.firstBlueprintExploration])),
    firstDropExploration:stats(rows.flatMap(r=>r.journeyMetrics.signatures.firstDropExploration==null?[]:[r.journeyMetrics.signatures.firstDropExploration])),
    firstCraftExploration:stats(rows.flatMap(r=>r.journeyMetrics.signatures.firstCraftExploration==null?[]:[r.journeyMetrics.signatures.firstCraftExploration])),
    farmLoops:stats(rows.map(r=>r.journey.expedition.loops)),
    farmEncounters:stats(rows.map(r=>r.journeyMetrics.farmEncounters)),
    farmItems:stats(rows.map(r=>r.journeyMetrics.farmItems)),
    farmMaterials:stats(rows.map(r=>r.journeyMetrics.farmMaterials)),
    restarts:stats(rows.map(r=>r.journey.restarts)),
    inventory:rows.every(r=>r.inventory)?{
      maxBeforeRecycle:stats(rows.map(r=>r.inventory.maxBeforeRecycle)),
      maxAfterManagement:stats(rows.map(r=>r.inventory.maxAfterManagement)),
      finalStoredItems:stats(rows.map(r=>r.inventory.finalStoredItems)),
      finalFutureItems:stats(rows.map(r=>r.inventory.finalFutureItems)),
      recycled:stats(rows.map(r=>r.recycled))
    }:null,
    selectedZones:rows.map(r=>({seed:r.seed,zone:r.journey.expedition.zone}))
  }:null,
  groups:rows.some(r=>r.bestiary.groups)?{
    soloFights:stats(rows.map(r=>r.bestiary.groups.soloFights??0)),
    duoFights:stats(rows.map(r=>r.bestiary.groups.duoFights??0)),
    trioFights:stats(rows.map(r=>r.bestiary.groups.trioFights??0)),
    heals:stats(rows.map(r=>r.bestiary.groups.heals??0)),
    areaCasts:stats(rows.map(r=>r.bestiary.groups.areaCasts)),
    multipleTargetCasts:stats(rows.map(r=>r.bestiary.groups.multipleTargetCasts)),
    enemies:stats(rows.map(r=>r.bestiary.groups.enemies)),
    phases:rows.reduce((acc,r)=>{for(const [p,n]of Object.entries(r.bestiary.groups.phases))acc[p]=(acc[p]??0)+n;return acc;},{})
  }:null,
  phases:rows.reduce((acc,r)=>{for(const [phase,count] of Object.entries(r.bestiary.phases??{})) acc[phase]=(acc[phase]??0)+count;return acc;},{}),
  compositions:[...new Set(rows.map(r=>r.bestiary.classes.join('/')))],
  blocked:rows.filter(r=>!complete(r)).map(r=>({seed:r.seed,reason:r.blockedReason,levels:r.levels})),regions,
 };
}
if(['bestiaryStats','bestiaryElements','bestiaryRoles'].every(p=>manifest.profiles.includes(p))) {
 const pairs=[...baseline.values()].map(b=>{
  const get=p=>runs.find(r=>r.seed===b.seed&&r.profile===p);
  const stat=get('bestiaryStats'),element=get('bestiaryElements'),both=get('bestiaryRoles');
  return {seed:b.seed,complete:[b,stat,element,both].every(complete),
   interactionMinutes:(both.simulatedSeconds-stat.simulatedSeconds-element.simulatedSeconds+b.simulatedSeconds)/60};
 });
 result.factorial={paired: pairs,interactionMinutesCompleted:stats(pairs.filter(p=>p.complete).map(p=>p.interactionMinutes)),
  interpretation:'Total policy response, including recruitment and equipment feedback; not a fixed-team combat effect.'};
}
if(manifest.profiles.includes('bestiaryUndercityGroups')&&manifest.profiles.includes('bestiaryUndercityGroupsSingle')){
 const pairs=runs.filter(r=>r.profile==='bestiaryUndercityGroups').map(r=>{
 const single=runs.find(x=>x.profile==='bestiaryUndercityGroupsSingle'&&x.seed===r.seed);
 return {seed:r.seed,complete:[r,single].every(complete),durationPercent:100*(r.simulatedSeconds/single.simulatedSeconds-1),
  recoveryMinutes:(r.recoveryWaitSeconds-single.recoveryWaitSeconds)/60};
 });
 result.groupComparison={pairs,pairedDurationPercent:stats(pairs.filter(p=>p.complete).map(p=>p.durationPercent)),pairedRecoveryMinutes:stats(pairs.filter(p=>p.complete).map(p=>p.recoveryMinutes))};
 result.groupComparison.coverage={
  runsWithMultipleTargets:runs.filter(r=>r.profile==='bestiaryUndercityGroups'&&r.bestiary.groups.multipleTargetCasts>0).length,
  total:runs.filter(r=>r.profile==='bestiaryUndercityGroups').length,
  skillsSeen:runs.filter(r=>r.profile==='bestiaryUndercityGroups').map(r=>({seed:r.seed,skills:Object.keys(r.bestiary.skillsSeen??{})}))
 };
 result.groupComparison.coverageStatus=result.groupComparison.coverage.runsWithMultipleTargets>0?'observed':'not-observed';

}
result.checks=['unique paired seeds','gold conservation','encounter and time accounting'];
if(manifest.profiles.some(p=>['bestiaryRegions','bestiaryUndercityNames'].includes(p))) result.checks.push('regions-only behavior equals baseline');
if(manifest.profiles.includes('bestiaryRares') && manifest.profiles.includes('bestiaryRoles')) result.checks.push('rares behavior equals roles');
await writeFile(join(directory,'bestiary-analysis.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({checks:result.checks,profiles:Object.fromEntries(Object.entries(result.profiles).map(([k,v])=>[k,{finished:v.finished,total:v.total,hours:v.hoursCompleted,pairedDurationPercent:v.pairedDurationPercent,defeats:v.defeats,combatDefeats:v.combatDefeats,recoveryHours:v.recoveryHours,floors:v.floors,compositions:v.compositions.length,signatures:v.journey?{drops:v.journey.signatureDrops,crafts:v.journey.signatureCrafts,blueprints:v.journey.signatureBlueprints}:v.signatureOpportunities}]))},null,2));
