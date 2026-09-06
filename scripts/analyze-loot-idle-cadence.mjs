// Post-campaign analysis only. Never changes seeds, policies or saved runs.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const directory = resolve(process.argv[2] ?? 'test-results/loot-economy/full/idle-flow-v2/baseline-flowLoot-flowEfficient-flowPlans-city');
const read = async (name) => JSON.parse(await readFile(join(directory, name), 'utf8'));
const [completion, analysis, runs] = await Promise.all([read('completed.json'), read('analysis.json'), read('reports.json')]);
assert.equal(completion.audit, 'passed');
assert.equal(analysis.completed, analysis.total, 'cadence requires complete four-hero level-40 campaigns');
assert.equal(runs.length, analysis.total);
const stats = (values) => {
  assert(values.every(Number.isFinite), 'non-finite cadence measurement');
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b);
  const percentile = (p) => sorted[Math.round((sorted.length-1)*p)];
  return { count: values.length, mean: values.reduce((s,x) => s+x,0)/values.length, median: (sorted[Math.floor((sorted.length-1)/2)] + sorted[Math.ceil((sorted.length-1)/2)])/2, p10: percentile(.1), p90: percentile(.9), min: sorted[0], max: sorted.at(-1) };
};
const profiles = [...new Set(runs.map((r) => r.profile))];
const index = Object.fromEntries(profiles.map((p) => [p, new Map(runs.filter((r) => r.profile === p).map((r) => [r.seed, r]))]));
const result = { experiment: analysis.experiment, seeds: analysis.seeds, profiles: {}, limits: ['simulated transcript-based time, not client or calendar time', 'band rates include the partial roster; fourHeroEquipped remains separate', 'terminal stocks do not identify the material blocking an earlier craft'] };
for (const p of profiles) {
  const rows = [...index[p].values()];
  assert.equal(rows.length, analysis.seeds);
  const pairs = Object.fromEntries(['baseline', 'flowLoot', 'budgetControl', 'budgetRecycle'].filter((ref) => index[ref]).map((ref) => {
    assert(rows.every((r) => index[ref].has(r.seed)));
    return [ref, stats(rows.map((r) => 100*(r.simulatedSeconds/index[ref].get(r.seed).simulatedSeconds-1)))];
  }));
  const intervals = Object.fromEntries([5,10,15,20,25,30,35].map((from) => [`${from}-${from+5}`, {
    minutes: stats(rows.map((r) => (r.timing.milestones[from+5].seconds-r.timing.milestones[from].seconds)/60)),
    recoveryMinutes: stats(rows.map((r) => (r.timing.milestones[from+5].recoverySeconds-r.timing.milestones[from].recoverySeconds)/60)),
  }]));
  const bandRates = Object.fromEntries(Array.from({length:8}, (_,i) => {
    const band = `${i*5+1}-${i*5+5}`;
    return [band, {
      crafts: stats(rows.map((r) => r.idleForge.bands[band]?.crafts ?? 0)),
      craftsPerHour: stats(rows.map((r) => { const n = r.idleForge.bands[band]?.crafts ?? 0; const seconds = r.timing.bands[band]?.seconds ?? 0; return seconds ? 3600*n/seconds : 0; })),
      craftsPer100Explorations: stats(rows.map((r) => { const b = r.idleForge.bands[band]; return b?.explorations ? 100*b.crafts/b.explorations : 0; })),
      fourHeroEquipped: stats(rows.map((r) => r.idleForge.bands[band]?.fourHeroEquipped ?? 0)),
    }];
  }));
  const materialStock = Object.fromEntries(['metal_scrap','refined_metal','enchanted_fragment','arcane_core','legendary_essence'].map((id) => [id, stats(rows.map((r) => {
    const l = r.idleForge;
    return (l.initial[id]??0)+(r.materialsGross[id]??0)+(l.recycled[id]??0)+(l.refunded[id]??0)-(l.startCosts[id]??0)-(l.upgradeCosts[id]??0);
  }))]));
  const clocked = rows.every((r) => r.idleForge.crafts.every((c) => Number.isFinite(c.craftedSeconds)));
  if (clocked) for (const r of rows) for (const c of r.idleForge.crafts) {
    assert(c.craftedSeconds >= 0 && c.craftedSeconds <= r.simulatedSeconds);
    if (c.equippedAt !== undefined) assert(Number.isFinite(c.equippedSeconds) && c.equippedSeconds >= c.craftedSeconds && c.equippedSeconds <= r.simulatedSeconds, 'missing or invalid real equipment timestamp');
  }
  const gaps = (r, key) => {
    const events = r.idleForge.crafts.map((c) => c[key]).filter(Number.isFinite).sort((a,b) => a-b);
    assert(events.every((t) => t >= 0 && t <= r.simulatedSeconds));
    const bounds = [0,...events,r.simulatedSeconds];
    return bounds.slice(1).map((t,i) => (t-bounds[i])/60);
  };
  const forgeRhythm = clocked ? {
    maxCraftGapMinutesIncludingEdges: stats(rows.map((r) => Math.max(...gaps(r,'craftedSeconds')))),
    maxEquippedGainGapMinutesIncludingEdges: stats(rows.map((r) => Math.max(...gaps(r,'equippedSeconds')))),
    relativeEquipmentGain: stats(rows.flatMap((r) => r.idleForge.crafts.map((c) => c.relativeEquipmentGain).filter(Number.isFinite))),
    limits: 'Forge only; gaps include campaign edges; relative gain is equipment score, not combat DPS. No product pass/fail threshold.'
  } : null;
  result.profiles[p] = { forgeRhythm, hours:stats(rows.map((r) => r.simulatedSeconds/3600)), pairedDurationPercent:pairs, recoveryHours:stats(rows.map((r) => r.recoveryWaitSeconds/3600)), intervals, bandRates, materialStock,
    lateToEarlyIntervalRatio:stats(rows.map((r) => (r.timing.milestones[40].seconds-r.timing.milestones[35].seconds)/(r.timing.milestones[10].seconds-r.timing.milestones[5].seconds))),
    lateIntervalLongerThanEarly:rows.filter((r) => r.timing.milestones[40].seconds-r.timing.milestones[35].seconds > r.timing.milestones[10].seconds-r.timing.milestones[5].seconds).length,
  };
}
await writeFile(join(directory, 'cadence-analysis.json'), JSON.stringify(result,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(result.profiles).map(([p,r]) => [p, { n:r.hours.count, hours:r.hours, pairedDurationPercent:r.pairedDurationPercent, intervalMeanMinutes:Object.fromEntries(Object.entries(r.intervals).map(([b,v]) => [b,v.minutes.mean])), lateIntervalLongerThanEarly:r.lateIntervalLongerThanEarly, lateToEarlyIntervalRatio:r.lateToEarlyIntervalRatio, bandCraftMean:Object.values(r.bandRates).map((b) => b.crafts.mean), bandCraftsPerHourMean:Object.values(r.bandRates).map((b) => b.craftsPerHour.mean) }])),null,2));
