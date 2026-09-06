// Read-only campaign verification; writes only a derived analysis beside reports.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const directory = resolve(process.argv[2] ?? 'test-results/loot-economy/full/idle-study-v1/baseline-idleControl-idleEfficient-idleQuality-idleTargeted-idlePlans-idleCombined-city');
const runs = JSON.parse(await readFile(join(directory, 'reports.json'), 'utf8'));
const summary = JSON.parse(await readFile(join(directory, 'summary.json'), 'utf8'));
const values = (rows) => {
  if (!rows.length) return null;
  const s = [...rows].sort((a,b) => a-b);
  return { count: s.length, min: s[0], median: (s[Math.floor((s.length-1)/2)] + s[Math.ceil((s.length-1)/2)])/2, max: s.at(-1), mean: rows.reduce((a,b) => a+b,0)/rows.length };
};
const sumLedger = (rows, field) => rows.reduce((totals,r) => {
  for (const [id,n] of Object.entries(r.idleForge[field])) totals[id] = (totals[id] ?? 0)+n;
  return totals;
}, {});
const expectedProfiles = Object.keys(summary.profiles);
assert.equal(runs.length, summary.seeds * expectedProfiles.length);
for (const r of runs) {
  assert.equal(r.goldConservationError,0, `gold ${r.profile}/${r.seed}`);
  assert(Object.values(r.idleForge.conservationError).every((n) => n === 0));
  assert.equal(r.items, r.passes.reduce((n,p) => n+p.items,0));
  assert.equal(r.final.explorations, r.passes.reduce((n,p) => n+p.encounters,0));
  assert.equal(r.idleForge.crafts.length, r.final.crafts);
  assert.equal(new Set(r.idleForge.crafts.map((c) => c.id)).size, r.final.crafts);
  const equipped = r.idleForge.crafts.filter((c) => c.equippedAt !== undefined);
  assert(equipped.every((c) => c.equippedAt >= c.exploration && c.gain > 0.01));
  assert.equal(r.final.uniqueEquippedCrafts, equipped.length);
  assert.equal(r.final.equippedLaterCrafts, equipped.filter((c) => c.equippedAt > c.exploration).length);
  if (r.idleForge.recycleSupplement) {
    for (const [id,n] of Object.entries(r.idleForge.recycleSupplement)) assert(n>=0 && n<=(r.idleForge.recycled[id]??0),'recycle supplement must already belong to recycled totals');
    assert(equipped.every((c) => c.relativeEquipmentGain === null || Number.isFinite(c.relativeEquipmentGain) && c.relativeEquipmentGain > 0),'real relative equipment gain');
  }
  if (r.timing) {
    const timeRows = Object.values(r.timing.bands);
    assert(Math.abs(timeRows.reduce((s,b) => s+b.seconds,0)-r.simulatedSeconds) < 1e-6, 'elapsed time conservation');
    assert(Math.abs(timeRows.reduce((s,b) => s+b.recoverySeconds,0)-r.recoveryWaitSeconds) < 1e-6, 'recovery time conservation');
    assert(timeRows.every((b) => b.seconds >= 0 && b.recoverySeconds >= 0 && b.encounterSeconds >= -1e-6 && Math.abs(b.seconds-b.recoverySeconds-b.encounterSeconds) < 1e-6));
    const checkpoints = Object.values(r.timing.milestones);
    assert(checkpoints.every((m,i) => m.seconds <= r.simulatedSeconds && (!i || m.seconds >= checkpoints[i-1].seconds)), 'ordered four-hero milestones');
  }
  for (const [band,row] of Object.entries(r.idleForge.bands)) {
    assert.equal(row.crafts, r.idleForge.crafts.filter((c) => c.heroBand === band).length);
    assert.equal(row.equipped, equipped.filter((c) => c.equippedBand === band).length);
    assert.equal(row.fourHeroEquipped, equipped.filter((c) => c.equippedBand === band && c.heroCountAtEquip === 4).length);
    assert(row.fourHeroExplorations <= row.explorations);
    if (r.idleForge.recycleSupplement && row.materialBlocked > 0) {
      const counts = Object.values(row.materialBlockedById ?? {});
      assert(counts.length > 0 && counts.every((n) => Number.isInteger(n) && n>0 && n<=row.materialBlocked));
      assert(counts.reduce((s,n) => s+n,0)>=row.materialBlocked,'every blocked check must identify a missing material');
    }
  }
  for (const p of r.passes) assert(p.encounters >= p.lastRoom-p.startRoom+1, 'rooms missing in a passage');
}
const isComplete = r => r.journey ? r.journeyComplete === true : summary.stage === 'undercity' ? r.dungeonCleared === true : r.levels.length === 4 && r.levels.every(l => l >= 40);
const baseline = new Map(runs.filter((r) => r.profile === 'baseline').map((r) => [r.seed,r]));
const analysis = { experiment: summary.experiment, seeds: summary.seeds, lootCriterion: 'All arbitrary targets retired; describe flow, gains, dry time and funding', completed: runs.filter(isComplete).length, total: runs.length, profiles: {} };
for (const profile of expectedProfiles) {
  const rows = runs.filter((r) => r.profile === profile);
  assert.equal(rows.length, summary.seeds);
  assert.equal(new Set(rows.map((r) => r.seed)).size, summary.seeds);
  assert.deepEqual([...rows.map((r) => r.seed)].sort(), [...baseline.keys()].sort());
  const complete = rows.filter(isComplete);
  const paired = complete.filter((r) => isComplete(baseline.get(r.seed)));
  const passes = rows.flatMap((r) => r.passes);
  const fullPasses = passes.filter((p) => p.completed && p.startRoom === 1);
  const bandResults = Object.fromEntries(Array.from({length:8},(_,i) => {
    const name = `${i*5+1}-${i*5+5}`;
    const bandRows = rows.flatMap((r) => r.idleForge.bands[name] ? [r.idleForge.bands[name]] : []);
    const group = bandRows.filter((r) => r.fourHeroExplorations > 0);
    return [name, { observed:bandRows.length, groupOfFour:group.length, crafts:values(bandRows.map((r) => r.crafts)), equippedByFour:values(group.map((r) => r.fourHeroEquipped)), startBlocked:bandRows.reduce((s,r) => s+r.materialBlocked,0), noAffordableGain:bandRows.reduce((s,r) => s+r.recipeBlocked,0), upgradeBlocked:bandRows.reduce((s,r) => s+r.upgradeBlocked,0), cooldownBlocked:bandRows.reduce((s,r) => s+r.cooldownBlocked,0) }];
  }));
  const perFloor = rows.flatMap((r) => [...new Set(r.passes.map((p) => p.floor))].map((floor) => r.passes.filter((p) => p.floor===floor).reduce((s,p) => s+p.items,0)));
  analysis.profiles[profile] = {
    completed:complete.length, hours:values(complete.map((r) => r.simulatedSeconds/3600)), pairedDurationPercent:values(paired.map((r) => 100*(r.simulatedSeconds/baseline.get(r.seed).simulatedSeconds-1))),
    fullPasses:fullPasses.length, repeatFullPasses:fullPasses.filter((p) => p.repeat).length, partialPasses:passes.length-fullPasses.length,
    itemsPerFullPass:values(fullPasses.map((p) => p.items)), descriptiveOneToThreePercent:100*fullPasses.filter((p) => p.items>=1 && p.items<=3).length/fullPasses.length,
    itemsPerFloorIncludingRepeats:values(perFloor), maxDryMinutes:values(rows.map((r) => r.maxDrySeconds/60)),
    crafts:values(rows.map((r) => r.final.crafts)), equipped:values(rows.map((r) => r.final.uniqueEquippedCrafts)), laterEquipped:values(rows.map((r) => r.final.equippedLaterCrafts)),
    rarityOffers:Object.fromEntries(['common','uncommon','rare','epic','legendary'].map((rarity) => [rarity, rows.flatMap((r) => r.idleForge.crafts).filter((c) => c.offered===rarity).length])),
    refusedByRarity:Object.fromEntries(['uncommon','rare','epic','legendary'].map((rarity) => [rarity, rows.flatMap((r) => r.idleForge.crafts).filter((c) => c.offered===rarity && !c.accepted).length])),
    equippedByRarity:Object.fromEntries(['common','uncommon','rare','epic','legendary'].map((rarity) => [rarity, rows.flatMap((r) => r.idleForge.crafts).filter((c) => c.rarity===rarity && c.equippedAt!==undefined && c.heroCountAtEquip===4).length])),
    offersRefused:rows.reduce((s,r) => s+r.forge.rejectedRarityOffers,0), plansGranted:values(rows.map((r) => r.idleForge.plansGranted.length)),
    materials:Object.fromEntries(['startCosts','upgradeCosts','recycled','refunded'].map((field) => [field,sumLedger(rows,field)])), bands:bandResults,
    timing: {
      recoveryHours:values(complete.filter((r) => r.timing).map((r) => r.recoveryWaitSeconds/3600)),
      encounterHours:values(complete.filter((r) => r.timing).map((r) => (r.simulatedSeconds-r.recoveryWaitSeconds)/3600)),
      milestones:Object.fromEntries([5,10,15,20,25,30,35,40].map((level) => [level, values(complete.flatMap((r) => r.timing?.milestones[level] ? [r.timing.milestones[level].seconds/3600] : []))])),
      bands:Object.fromEntries(Array.from({length:8},(_,i) => {
        const name = `${i*5+1}-${i*5+5}`;
        return [name, { hours:values(complete.flatMap((r) => r.timing?.bands[name] ? [r.timing.bands[name].seconds/3600] : [])), recoveryHours:values(complete.flatMap((r) => r.timing?.bands[name] ? [r.timing.bands[name].recoverySeconds/3600] : [])) }];
      })),
    },
    incomplete:rows.filter((r) => !complete.includes(r)).map((r) => ({seed:r.seed,levels:r.levels,reason:r.blockedReason})),
  };
}
await writeFile(join(directory,'analysis.json'),JSON.stringify(analysis,null,2));
console.log(JSON.stringify({ completed:analysis.completed,total:analysis.total,profiles:Object.fromEntries(Object.entries(analysis.profiles).map(([id,p]) => [id,{ completed:p.completed,hours:p.hours,pairedDurationPercent:p.pairedDurationPercent,loot:p.itemsPerFullPass,crafts:p.crafts,bandMeanEquips:Object.values(p.bands).map((b) => b.equippedByFour?.mean) }])) },null,2));
