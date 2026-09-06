// Manual calibration only: bundle the existing campaign with checked, in-memory
// probes and candidate rules. Never write shared/ or mutate a saved game.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createEnemyGroup, chooseEnemy, prepareEnemyRound, performEnemySupport, primaryEnemy, livingEnemies, damageEnemy, resolveGroupSkill, summarizeGroup, isGroupProfile } from './helpers/undercity-groups.mjs';
import { patchUndercityGroups, patchGroupTactics } from './helpers/undercity-group-patch.mjs';
import { createJourneyDriver } from './helpers/undercity-journey-driver.mjs';
import { patchJourney } from './helpers/undercity-journey-patch.mjs';
import { patchSignatureCatalog } from './helpers/undercity-signatures.mjs';
import { undercityRound } from './helpers/undercity-experiment.mjs';
import { experimentMonster, createBestiaryLedger, observeBestiary, regionAt } from './helpers/bestiary-experiments.mjs';
import { createLootTownPolicy } from './helpers/loot-town-policy.mjs';
import { IDLE_VARIANTS, createIdleForgePolicy, qualityWeights, heroBand, bandName, flowItemChance } from './helpers/loot-idle-experiments.mjs';
import { createBudgetForgePolicy, searchForgeWeights } from './helpers/loot-idle-budget.mjs';

// Data-URL modules have enormous stack traces; retain the actionable failure.
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({ error: error.message, code: error.code, reason: error.reason }));
  process.exit(1);
});

const root = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = /^--(stage|seeds|workers|worker|profiles|town|experiment|resume)=(.+)$/.exec(arg);
  if (!match) throw new Error(`Unknown option: ${arg}`);
  return [match[1], match[2]];
}));
const stage = args.stage ?? 'early';
const town = args.town ?? 'prepared';
const seeds = Number(args.seeds ?? 100);
const workers = Number(args.workers ?? 10);
const profiles = (args.profiles ?? 'baseline,steady,generous').split(',');
const resume = args.resume === 'true';
const canonicalLootPolicy = 'idle-source-flow-v1';
if (args.resume !== undefined && !['true', 'false'].includes(args.resume)) throw new Error('Invalid resume option');
const variants = {
  bestiaryUndercityJourney: { journey:true, canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryUndercityJourneyCourt20: { journey:true, journeyOptions:{farmLoops:20,farmZone:4,maxExplorations:25000}, canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryUndercityGroups: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryUndercityGroupsSingle: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryUndercityNames: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryUndercityCombat: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryRegions: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryStats: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryElements: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryRoles: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  bestiaryRares: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  idleRhythm: { canonicalLoot: true, budgetProbe: true, recycleBase: true, searchRolls: 'idleRhythm', scrapPerWin: 0, goldMultiplier: 1 },
  idleRhythmEfficient: { canonicalLoot: true, budgetProbe: true, recycleBase: true, searchRolls: 'idleRhythm', efficient: true, scrapPerWin: 0, goldMultiplier: 1 },
  budgetControl: { canonicalLoot: true, budgetProbe: true, scrapPerWin: 0, goldMultiplier: 1 },
  budgetRecycle: { canonicalLoot: true, budgetProbe: true, recycleBase: true, scrapPerWin: 0, goldMultiplier: 1 },
  budgetSearchModerate: { canonicalLoot: true, budgetProbe: true, recycleBase: true, searchRolls: 'moderate', scrapPerWin: 0, goldMultiplier: 1 },
  budgetSearchScarce: { canonicalLoot: true, budgetProbe: true, recycleBase: true, searchRolls: 'scarce', scrapPerWin: 0, goldMultiplier: 1 },
  flowLoot: { flow: true, scrapPerWin: 0, goldMultiplier: 1 },
  flowEfficient: { flow: true, efficient: true, scrapPerWin: 0, goldMultiplier: 1 },
  flowPlans: { flow: true, plans: true, scrapPerWin: 0, goldMultiplier: 1 },
  ...Object.fromEntries(Object.entries(IDLE_VARIANTS).map(([id, options]) => [id, { idle: true, ...options }])),
  baseline: { canonicalLoot: true, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  steady: { regularItemChance: 0.20, scrapPerWin: 1, goldMultiplier: 1, scrapOnlyCraft: true },
  generous: { regularItemChance: 0.35, scrapPerWin: 2, goldMultiplier: 1.25, scrapOnlyCraft: true },
  balanced: { regularItemChance: 0.20, scrapPerWin: 0, scrapPerElite: 3, goldMultiplier: 1, scrapOnlyCraft: true },
  lootOnly: { regularItemChance: 0.20, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  loot10: { regularItemChance: 0.10, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
  loot15: { regularItemChance: 0.15, scrapPerWin: 0, goldMultiplier: 1, scrapOnlyCraft: false },
};
if (!['prepared', 'progressive'].includes(town) || !['early', 'full', 'undercity'].includes(stage) || !Number.isInteger(seeds) || seeds < 1 || seeds > 1000
  || !Number.isInteger(workers) || workers < 1 || workers > 10 || profiles.some((id) => !variants[id])) throw new Error('Invalid calibration options');
if(stage!=='undercity'&&profiles.some(p=>p.startsWith('bestiaryUndercity'))) throw Error('Undercity now requires --stage=undercity (50-floor clear)');
const experiment = args.experiment ?? 'idle-v1';
if (!/^[a-zA-Z0-9_-]+$/.test(experiment)) throw new Error('Invalid experiment ID');
const output = join(root, 'test-results', 'loot-economy', stage, experiment, profiles.join('-') + (town === 'progressive' ? '-city' : ''));
const policyDigest = createHash('sha256').update(await readFile(join(root, 'scripts/helpers/loot-idle-experiments.mjs')));
policyDigest.update(await readFile(join(root, 'shared/domain/dungeon-loot-policy.ts')));
policyDigest.update(await readFile(join(root, 'shared/domain/authoritative-dungeon.ts')));
policyDigest.update(await readFile(join(root, 'scripts/helpers/bestiary-experiments.mjs')));
policyDigest.update(await readFile(join(root, 'scripts/helpers/undercity-experiment.mjs')));
for(const path of ['undercity-groups.mjs','undercity-group-patch.mjs','undercity-journey.mjs','undercity-journey-patch.mjs','undercity-journey-driver.mjs','undercity-signatures.mjs']) policyDigest.update(await readFile(join(root,'scripts/helpers',path)));
policyDigest.update(await readFile(fileURLToPath(import.meta.url)));
if (profiles.some((p) => variants[p].budgetProbe)) {
  policyDigest.update(await readFile(join(root, 'scripts/helpers/loot-idle-budget.mjs')));
  policyDigest.update(await readFile(join(root, 'scripts/helpers/loot-town-policy.mjs')));
}
const policyHash = policyDigest.digest('hex');
const profileSettings = Object.fromEntries(profiles.map((p) => [p,variants[p]]));
if (args.worker === undefined) {
  await mkdir(join(root, 'test-results', 'loot-economy', stage, experiment), { recursive: true });
  if (resume) {
    const original = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
    if (original.stage !== stage || original.town !== town || original.seeds !== seeds || original.policyHash !== policyHash || original.canonicalLootPolicy !== canonicalLootPolicy || JSON.stringify(original.profiles) !== JSON.stringify(profiles)) throw new Error('Incompatible resume manifest');
    if (original.profileSettings && JSON.stringify(original.profileSettings) !== JSON.stringify(profileSettings)) throw new Error('Incompatible resume profile settings');
    for (const pid of [original.pid, ...original.workers.map((w) => w.pid)]) {
      let alive = false;
      try { process.kill(pid, 0); alive = true; } catch (error) { if (error.code !== 'ESRCH') throw error; }
      if (alive) throw new Error(`Previous process ${pid} is still active; refusing concurrent resume`);
    }
    await writeFile(join(output, `manifest-before-resume-${Date.now()}.json`), JSON.stringify(original, null, 2), { flag: 'wx' });
  } else await mkdir(output); // Refuse overwrite without an explicit compatible resume.
}

async function checkedBuild(options) {
  // One bounded retry for the observed Windows file-read failure only.
  try { return await build(options); } catch (error) {
    if (!error.errors?.some((e) => e.text.includes('Cannot read file') && e.text.includes('The parameter is incorrect'))) throw error;
    console.error('[loot] Transient Windows read failure; retrying compilation once.');
    return await build(options);
  }
}

function stats(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const p = (q) => sorted[Math.round((sorted.length - 1) * q)];
  return { min: sorted[0], p10: p(.1), median: p(.5), p90: p(.9), max: sorted.at(-1), mean: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3) };
}

if (args.worker === undefined) {
  const startedAt = new Date().toISOString();
  const workerManifest = [];
  const children = Array.from({ length: Math.min(workers, seeds) }, (_, index) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), `--stage=${stage}`, `--seeds=${seeds}`, `--workers=${workers}`, `--worker=${index}`, `--profiles=${profiles.join(',')}`, `--town=${town}`, `--experiment=${experiment}`, `--resume=${resume}`], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    workerManifest.push({ worker: index, pid: child.pid, seedIndices: Array.from({ length: seeds }, (_, i) => i).filter((i) => i % workers === index) });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Worker ${index}: exit ${code}`)));
  }));
  await writeFile(join(output, 'manifest.json'), JSON.stringify({ startedAt, pid: process.pid, experiment, stage, town, seeds, profiles, profileSettings, workers: workerManifest, policyHash, canonicalLootPolicy, lootCriterion: 'idle rhythm; arbitrary loot, forge and duration targets retired 2026-09-06' }, null, 2));
  const settled = await Promise.allSettled(children);
  const failures = settled.filter((r) => r.status === 'rejected');
  if (failures.length) {
    await writeFile(join(output, 'failed.json'), JSON.stringify({ failedAt: new Date().toISOString(), errors: failures.map((r) => r.reason.message) }, null, 2));
    throw new Error(failures.map((r) => r.reason.message).join('; '));
  }
  const reports = (await Promise.all(Array.from({ length: Math.min(workers, seeds) }, (_, index) => readFile(join(output, `worker-${index}.json`), 'utf8').then(JSON.parse)))).flat();
  const summary = { stage, seeds, town, experiment, canonicalLootPolicy, recipeAuditVersion: 'active-level-bands-v2', variants, management: 'affordable-rarity-expectation; no-craft-cap; cooldown-8-to-1-by-hero-band; unique-real-equips', profiles: {} };
  const metrics = ['explorations', 'items', 'maxDrySpell', 'scrapGross', 'refinedGross', 'scrapStock', 'refinedStock', 'goldGross', 'goldLost', 'goldForgeSpent', 'goldStock', 'crafts', 'usefulCrafts', 'equippedCrafts', 'uniqueEquippedCrafts', 'equippedLaterCrafts', 'baseCraftBudget', 'forgeLevel', 'heroUpgradeMin', 'heroesUpgraded', 'recycled', 'materialBlockedChecks'];
  const aggregate = (rows) => ({ count: rows.length,
    ...Object.fromEntries(metrics.map((key) => [key, stats(rows.map((row) => row[key]))])),
    atMostOneItem: rows.filter((r) => r.items <= 1).length,
    noBaseCraftBudget: rows.filter((r) => r.baseCraftBudget === 0).length,
    allHeroesUpgraded: rows.filter((r) => r.heroesUpgraded === 4).length,
  });
  for (const profile of profiles) {
    const runs = reports.filter((r) => r.profile === profile);
    if (runs.length !== seeds || new Set(runs.map((r) => r.seed)).size !== seeds) throw new Error(`Missing/duplicate seeds: ${profile}`);
    if (new Set(runs.map((r) => r.bundleHash)).size !== 1 || runs.some((r) => r.policyHash !== policyHash)) throw new Error(`Mixed code versions: ${profile}`);
    if (runs.some((r) => r.goldConservationError !== 0)) throw new Error(`Gold conservation failed: ${profile}`);
    const checkpoints = {};
    for (const key of ['floor3', 'floor6', 'floor8', 'floor10', 'floor20', 'floor30', 'floor40', 'floor62', 'level5', 'level10', 'level20', 'level30', 'level40']) {
      checkpoints[key] = aggregate(runs.flatMap((r) => r.checkpoints[key] ? [r.checkpoints[key]] : []));
    }
    const completedPasses = runs.flatMap((r) => r.passes.filter((p) => p.completed && p.startRoom === 1));
    const bands = Object.fromEntries(Array.from({ length: 8 }, (_, i) => {
      const name = `${i * 5 + 1}-${i * 5 + 5}`;
      const rows = runs.flatMap((r) => r.idleForge.bands[name] ? [r.idleForge.bands[name]] : []);
      return [name, { count: rows.length, crafts: stats(rows.map((r) => r.crafts)), equipped: stats(rows.map((r) => r.equipped)), fourHeroEquipped: stats(rows.map((r) => r.fourHeroEquipped)), equippedLater: stats(rows.map((r) => r.equippedLater)), cooldownBlocked: rows.reduce((s,r) => s+r.cooldownBlocked,0), recipeBlocked: rows.reduce((s,r) => s+r.recipeBlocked,0), materialBlocked: rows.reduce((s,r) => s+r.materialBlocked,0), upgradeBlocked: rows.reduce((s,r) => s+r.upgradeBlocked,0) }];
    }));
    summary.profiles[profile] = { bands, completedPasses: completedPasses.length, itemsPerCompletedPass: stats(completedPasses.map((p) => p.items)), descriptivePassesWithOneToThreeItems: completedPasses.filter((p) => p.items >= 1 && p.items <= 3).length, repeatPasses: completedPasses.filter((p) => p.repeat).length, maxDrySeconds: stats(runs.map((r) => r.maxDrySeconds)), finished: runs.filter((r) => r.journey ? r.journeyComplete===true : stage === 'undercity' ? r.dungeonCleared === true : stage === 'early' ? r.highestFloor >= 8 : r.levels.length === 4 && r.levels.every((level) => level >= 40)).length,
      final: aggregate(runs.map((r) => r.final)), checkpoints,
      explorations: stats(runs.map((r) => r.final.explorations)), simulatedHours: stats(runs.map((r) => r.simulatedSeconds / 3600)),
      defeats: stats(runs.map((r) => r.defeats)), finalLevels: stats(runs.flatMap((r) => r.levels)),
      goldPerSource: runs.reduce((acc, r) => { for (const [key, value] of Object.entries(r.goldPerSource)) acc[key] = (acc[key] ?? 0) + value; return acc; }, {}),
      bySource: runs.reduce((acc, r) => { for (const [key, value] of Object.entries(r.bySource)) { const row = acc[key] ??= { encounters: 0, items: 0, materials: 0 }; for (const field of Object.keys(row)) row[field] += value[field]; } return acc; }, {}),
      blocked: runs.filter((r) => r.blockedReason).map((r) => ({ seed: r.seed, reason: r.blockedReason })),
    };
  }
  const journeyAudit=reports.filter(run=>run.journey).map(run=>({
    profile:run.profile,seed:run.seed,complete:run.journeyComplete,claims:run.journey.grants.length,
    uniqueClaims:new Set(run.journey.grants.map(grant=>grant.heroId+':'+grant.fixed)).size,
    personalItems:run.journeyMetrics.personalItems,manualRestarts:run.journeyMetrics.manualRestarts,
    themedItems:run.journeyMetrics.themedItems,signatures:run.journeyMetrics.signatures,inventory:run.inventory,
    materialConservation:run.idleForge.conservationError,
  }));
  if(journeyAudit.length)await writeFile(join(output,'journey-audit.json'),JSON.stringify({parameters:{
    signatureDropChance:.15,blueprintChance:.20,marksPerVictory:[1,2],marksPerRecipe:6,
  },runs:journeyAudit},null,2));
  await writeFile(join(output, 'reports.json'), JSON.stringify(reports, null, 2));
  await writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2));
  await new Promise((resolve, reject) => {
    const audit = spawn(process.execPath, [join(root, 'scripts/audit-loot-idle-results.mjs'), output], { cwd: root, stdio: 'inherit' });
    audit.on('error', reject);
    audit.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Audit exit ${code}`)));
  });
  await writeFile(join(output, 'completed.json'), JSON.stringify({ completedAt: new Date().toISOString(), reports: reports.length, audit: 'passed', finished: Object.fromEntries(profiles.map((p) => [p, summary.profiles[p].finished])) }, null, 2));
  if (stage === 'full' && profiles.every((p) => summary.profiles[p].finished === seeds)) await new Promise((resolve, reject) => {
    const cadence = spawn(process.execPath, [join(root, 'scripts/analyze-loot-idle-cadence.mjs'), output], { cwd: root, stdio: 'inherit' });
    cadence.on('error', reject);
    cadence.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Cadence analysis exit ${code}`)));
  });
  console.log(JSON.stringify({ stage, seeds, summary: join(output, 'summary.json'), results: Object.fromEntries(profiles.map((p) => [p, { finished: summary.profiles[p].finished, explorations: summary.profiles[p].explorations, itemsAtFloor6: summary.profiles[p].checkpoints.floor6.items, finalGold: summary.profiles[p].final.goldStock }])) }, null, 2));
} else {
  const worker = Number(args.worker);
  if (!Number.isInteger(worker) || worker < 0 || worker >= workers) throw new Error('Invalid worker');
  process.env.FORGE_CANDIDATE = '1';
  process.env.XP_SEED_COUNT = String(Math.max(100, seeds));
  const reports = [];
  const compiledProfiles = new Map();
  for (const profile of profiles) {
    const variant = variants[profile];
    const explorationLimit=variant.journeyOptions?.maxExplorations??12000;
    const compiled = await checkedBuild({
      stdin: { resolveDir: root, loader: 'ts', contents: `
        export { runLevel40Campaign, CANONICAL_PROFILE, optimizeEquipment } from './tests/helpers/heroXpTier1Campaign.ts';
        export { chooseManagedRecipe } from './tests/helpers/forgeProgressionCandidate.ts';
        export { ITEM_LIBRARY } from './shared/domain/items/items.ts';
        export { getItemById, getItemSlot, getChestLootBand, resolveEligibleCatalogDrop, rollWeightedRarity } from './shared/domain/items/items.ts';
        export { resolveItemInstance } from './shared/domain/items/scaling.ts';
        export { initialCanonicalRngState, restoreCanonicalRng } from './supabase/functions/game-api/authoritative-rng.ts';
        export { applyForgeCommand } from './supabase/functions/game-api/forge-authority.ts';
        export { getForgeMaterialMultiplier } from './shared/domain/forge-economy.ts';
        export { FORGE_CRAFT_COST, FORGE_RARITY_WEIGHTS, FORGE_RECYCLE_REWARDS, getForgeUpgradeCost, scaleForgeMaterialsForItemLevel } from './shared/domain/forge-economy.ts';
        export { rarityRank } from './shared/domain/items/items.ts';
        export { getDungeonRoomCount } from './shared/domain/dungeon-progression.ts';
        export { getDungeonGoldReward } from './shared/domain/dungeon-progression.ts';
        export { applyLootModifiers } from './shared/domain/dungeon-helpers.ts';
        export { getBuildingUpgradeCost, checkBuildingUnlocked } from './shared/data/buildings.ts';
        export { applyTownCommand, initialTownState } from './supabase/functions/game-api/town-authority.ts';
        export { recruitmentCost } from './shared/domain/hero.ts';
      ` }, bundle: true, write: false, platform: 'node', format: 'esm',
      plugins: [{ name: 'checked-calibration-probes', setup(builder) {
        builder.onLoad({ filter: /(?:heroXpTier1Campaign|forgeProgressionCandidate|forge-economy|authoritative-dungeon|combat-tactics|items)\.ts$/ }, async ({ path }) => {
          let source = (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
          const replace = (before, after) => {
            if (source.split(before).length !== 2) throw new Error(`Calibration anchor changed: ${path}: ${before}`);
            source = source.replace(before, after);
          };
          if (path.endsWith('combat-tactics.ts')) {
            if(profiles.some(isGroupProfile)) source=patchGroupTactics(source);
            return {contents:source,loader:'ts'};
          }
          if (path.endsWith('items.ts')) {
            if(profiles.some(p=>variants[p].journey)) source=patchSignatureCatalog(source);
            return {contents:source,loader:'ts'};
          }
          if (path.endsWith('authoritative-dungeon.ts')) {
            if (profiles.some((p) => p.startsWith('bestiary'))) replace('return { monster, itemRewardEntropy };', 'return { monster: globalThis.__bestiaryMonster(monster, floor, room, itemRewardEntropy), itemRewardEntropy };');
            if (profiles.some(p => p.startsWith('bestiaryUndercity'))) {
              replace('    round += 1;', '    round += 1; monster = globalThis.__undercityRound(monster, round);');
              replace('BOSS_LOOT_TABLES_REGISTRY[monster.name]', 'BOSS_LOOT_TABLES_REGISTRY[monster.__canonicalName ?? monster.name]');
            }
            if(profiles.some(isGroupProfile)) source = patchUndercityGroups(source);
            if(profiles.some(p=>variants[p].journey)) source=patchJourney(source);
            return { contents: source, loader: 'ts' };
          }
          if (path.endsWith('heroXpTier1Campaign.ts')) {
            if(profiles.some(p=>variants[p].journey)){
              replace('    const floor = state.activeDungeonFloor;', '    state = globalThis.__journeySync(state); const floor = state.activeDungeonFloor;');
              replace('function selectPreviousFloor(state: AuthoritativeDungeonState): AuthoritativeDungeonState {',
                'function selectPreviousFloor(state: AuthoritativeDungeonState): AuthoritativeDungeonState { if(globalThis.__journeyEnabled) return globalThis.__journeyRetreat(state);');
            }
            if(stage==='undercity') replace('import { HARMONIZED_HERO_XP_CURVE } from "../fixtures/xpProgression";',
              'import { CURRENT_XP_PROGRESSION_CURVE as HARMONIZED_HERO_XP_CURVE } from "../../shared/domain/game-calculations.ts";');
            replace('let state = initialState(seed);', 'let state = initialState(seed); state = globalThis.__lootPrepare(state); globalThis.__lootStart(state); let diagnosticIterations = 0;');
            replace('    if (!best) continue;', variant.budgetProbe ? '    if (!best) continue; globalThis.__lootEquipped(candidate, best.state, best.gain, best.previousScore);' : '    if (!best) continue; globalThis.__lootEquipped(candidate, best.state, best.gain);');
            if (town === 'progressive') {
              replace('if (forgeContext) state = prepareForgeCandidateTown(state) as AuthoritativeDungeonState;', '// Progressive city: no free buildings.');
              replace('state = allocateForgeCandidateWorkers(state, forgeContext) as AuthoritativeDungeonState;', 'state = globalThis.__lootTownStep(state, report.explorations);');
            }
            replace('while (!allHeroesReached(state, TARGET_LEVEL) && report.explorations < MAX_EXPLORATIONS) {', `while (${stage === 'undercity' ? '!globalThis.__lootDungeonComplete()' : '!allHeroesReached(state, TARGET_LEVEL)'} && report.explorations < ${explorationLimit} && ++diagnosticIterations <= ${explorationLimit+3000} ${stage === 'early' ? '&& state.highestFloorReached < 8' : ''}) {`);
            replace('const encounter = resolution.encounter;', 'resolution = globalThis.__lootAdjust(resolution, state, seed, report.explorations); const encounter = resolution.encounter;');
            replace('    if (forgeContext) {\n      state = advanceForgeCandidate(', '    if (forgeContext) {\n      state = globalThis.__lootUnlock(state, encounter);\n      state = globalThis.__lootRecycle(state);\n      state = advanceForgeCandidate(');
            replace('report.explorations += 1;', 'report.explorations += 1; globalThis.__lootCapture(state, encounter, report, forgeContext);');
          } else if (path.endsWith('forgeProgressionCandidate.ts')) {
            if (town === 'progressive') replace('if (state.highestFloorReached < definition.requiredFloor) break;', 'if (state.highestFloorReached < definition.requiredFloor || !globalThis.__lootCanForge(state, targetLevel)) break;');
            const begin = source.indexOf('function chooseManagedRecipe(');
            const end = source.indexOf('export function advanceForgeCandidate(');
            if (begin < 0 || end <= begin) throw new Error('Forge driver anchors changed');
            source = source.slice(0, begin) + `export function chooseManagedRecipe(state, level, optimize) { return globalThis.__lootChoose(state, level, optimize); }\nfunction attemptManagedCraft(state, context, exploration, optimize) { return globalThis.__lootCraft(state, context, exploration, optimize); }\n` + source.slice(end);
          } else if (variant.scrapOnlyCraft) {
            replace('  { materialId: "refined_metal", rarity: "uncommon", count: 1 },\n', '');
          }
          if (path.endsWith('forge-economy.ts') && variant.quality) source += `\nfor (const level of Object.keys(FORGE_RARITY_WEIGHTS)) FORGE_RARITY_WEIGHTS[level] = (${qualityWeights.toString()})(FORGE_RARITY_WEIGHTS[level]);\n`;
          if (path.endsWith('forge-economy.ts') && variant.searchRolls) source += `\nfor (const level of Object.keys(FORGE_RARITY_WEIGHTS)) FORGE_RARITY_WEIGHTS[level] = (${searchForgeWeights.toString()})(FORGE_RARITY_WEIGHTS[level], Number(level), '${variant.searchRolls}');\n`;
          return { contents: source, loader: 'ts' };
        });
      }}],
    });
    compiledProfiles.set(profile, compiled);
  }
  // Compile all variants before expensive campaigns, avoiding late file reads.
  for (const profile of profiles) {
    const variant = variants[profile];
    const compiled = compiledProfiles.get(profile);
    const lib = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text + `\n// profile:${profile}`).toString('base64'));
    let run;
    let journeyDriver;
    globalThis.__journeyEnabled = !!variant.journey;
    globalThis.__journeyBegin = (state,id,floor,room) => journeyDriver?.begin(state,id,floor,room);
    globalThis.__journeyAwards = xp => journeyDriver?.awards(xp)??[];
    globalThis.__journeySync = state => journeyDriver?.sync(state)??state;
    globalThis.__journeyRetreat = state => journeyDriver?.retreat(state)??state;
    let monsterMetadata;
    globalThis.__undercityRound = (monster, round) => {
      if(isGroupProfile(profile)) return monster;
      const result=undercityRound(monster,round);
      if(result.phase && run.bestiary) run.bestiary.phases[result.phase]=(run.bestiary.phases[result.phase]??0)+1;
      return result.monster;
    };
    globalThis.__bestiaryMonster = (monster, floor, room, entropy) => {
      const transformed = experimentMonster(monster, floor, room, entropy, profile);
      monsterMetadata = transformed.metadata;
      return transformed.monster;
    };
    globalThis.__groupCreate = monster => createEnemyGroup(monster,profile);
    globalThis.__groupRound = prepareEnemyRound;
    globalThis.__groupSupport = performEnemySupport;
    globalThis.__lootDungeonComplete = () => journeyDriver?journeyDriver.complete():run.dungeonCleared === true;
    globalThis.__groupPrimary = primaryEnemy;
    globalThis.__groupChoose = chooseEnemy;
    globalThis.__groupLiving = livingEnemies;
    globalThis.__groupDamage = damageEnemy;
    globalThis.__groupSkill = resolveGroupSkill;
    globalThis.__groupSummary = summarizeGroup;
    globalThis.__groupFinish = group => {
      const row = run.bestiary.groups ??= {fights:0,enemies:0,kills:0,areaCasts:0,multipleTargetCasts:0,singleSkillCasts:0,heals:0,healing:0,soloFights:0,duoFights:0,trioFights:0,phases:{},zones:{}};
      row.fights++; row.enemies+=group.members.length;
      row[group.members.length===1?'soloFights':group.members.length===2?'duoFights':'trioFights']++;
      row.kills+=group.members.filter(m=>m.hp===0).length;
      const zone=row.zones[monsterMetadata.region]??={fights:0,victories:0,enemies:0,solo:0,duo:0,trio:0};
      zone[group.members.length===1?'solo':group.members.length===2?'duo':'trio']++;
      zone.fights++;zone.enemies+=group.members.length;zone.victories+=Number(group.members.every(m=>m.hp===0));
      for(const e of group.events){
        if(e.type==='enemy.heal'){ row.heals++; row.healing+=e.healing; }
        if(e.type==='enemy.phase') row.phases[e.phase]=(row.phases[e.phase]??0)+1;
        if(e.type==='hero.groupSkill'){
          if(e.targetMode==='all_enemies') row.areaCasts++; else row.singleSkillCasts++;
          if(e.targets.length>1) row.multipleTargetCasts++;
        }
      }
      if(group.members.some(m=>m.hp<0||m.hp>m.maxHp)||group.members.reduce((s,m)=>s+m.maxHp,0)!==group.original.maxHp) throw Error('Invalid group HP accounting');
    };
    let cityPolicy;
    let forgePolicy;
    globalThis.__lootPrepare = (state) => {
      cityPolicy = town === 'progressive' ? createLootTownPolicy(lib, run.seed) : null;
      journeyDriver=variant.journey?createJourneyDriver(lib,run.seed,variant.journeyOptions):null;
      if(journeyDriver){run.journey=journeyDriver.journey.data;run.journeyMetrics=journeyDriver.metrics;}
      const prepared=cityPolicy ? cityPolicy.prepare() : state;
      return journeyDriver?journeyDriver.sync(prepared):prepared;
    };
    globalThis.__lootTownStep = (state, exploration) => cityPolicy.step(state, exploration);
    globalThis.__lootCanForge = (state, target) => cityPolicy.canForge(state, target);
    globalThis.__lootChoose = (state, level, optimize) => forgePolicy.choose(state, level, optimize, false);
    globalThis.__lootCraft = (state, context, exploration, optimize) => journeyDriver?.reserveSignatureMaterials(state)?state:forgePolicy.craft(state, context, exploration, optimize);
    globalThis.__lootEquipped = (item, state, gain, previousScore) => forgePolicy.equipped(item, state, gain, previousScore);
    globalThis.__lootUnlock = (state, encounter) => forgePolicy.unlock(state, encounter);
    let previousEquipment;
    let previousForge;
    const materialCount = (state, id) => state.forgeMaterials.find((entry) => entry.materialId === id)?.count ?? 0;
    globalThis.__lootStart = (state) => {
      run.initialGold = state.resources.gold;
      forgePolicy = (variant.budgetProbe ? createBudgetForgePolicy : createIdleForgePolicy)(lib, variant, run);
      forgePolicy.initialize(state);
      run.idleForge = forgePolicy.ledger;
      previousForge = 0;
      run.timing = { bands: {}, milestones: {}, lastSeconds: 0, lastRecovery: 0, band: bandName(heroBand(state)), heroCount: state.heroes.length };
      previousEquipment = Object.fromEntries(state.heroes.map((hero) => [hero.id, Object.fromEntries(Object.entries(hero.equipment ?? {}).map(([slot, item]) => [slot, item?.instanceId]))]));
      run.heroUpgrades = Object.fromEntries(state.heroes.map((hero) => [hero.id, 0]));
    };
    globalThis.__lootAdjust = (resolution, before, seed, exploration) => {
      if(journeyDriver){
        resolution=journeyDriver.settle(resolution,before,exploration);
        for(const cost of journeyDriver.drainCraftCosts()){
          forgePolicy.ledger.startCosts[cost.materialId]=(forgePolicy.ledger.startCosts[cost.materialId]??0)+cost.count;
        }
      }
      const { state, encounter } = resolution;
      run.inventory.maxBeforeRecycle=Math.max(run.inventory.maxBeforeRecycle,state.storedItems.length);
      const kind = encounter.kind;
      if(stage==='undercity'){
        if(encounter.floor>50) throw Error('Encounter beyond dungeon end');
        run.dungeonCleared ||= encounter.floor===50 && encounter.room===lib.getDungeonRoomCount(50) && kind==='fight' && encounter.outcome==='victory';
        if(encounter.floor===50 && encounter.room===lib.getDungeonRoomCount(50) && kind==='fight' && encounter.outcome==='victory') run.finalBoss={floor:50,room:encounter.room,name:encounter.enemy.name,outcome:encounter.outcome};
      }
      if (run.bestiary) {
        observeBestiary(run.bestiary, encounter, monsterMetadata);
        const seen=run.bestiary.skillsSeen??={};
        for(const hero of before.heroes) for(const skill of hero.activeSkills) seen[skill]=(seen[skill]??0)+1;
      }
      const isBoss = kind === 'fight' && encounter.enemy?.isBoss;
      const source = kind === 'fight' ? isBoss ? encounter.floor % 10 === 0 ? 'boss' : 'elite' : 'fight' : kind;
      run.currentExploration = exploration;
      if (variant.idle) {
        // Expected two items per victorious complete passage, without a hard cap.
        const removed = new Set(encounter.rewards.loot.filter((l) => l.type === 'item').map((l) => l.instanceId));
        state.storedItems = state.storedItems.filter((i) => !removed.has(i.instanceId));
        encounter.rewards.loot = encounter.rewards.loot.filter((l) => l.type !== 'item');
        encounter.transcript = encounter.transcript.filter((e) => !['reward.item', 'reward.item.none'].includes(e.type));
        const rng = lib.restoreCanonicalRng(lib.initialCanonicalRngState((seed ^ Math.imul(exploration + 1, 0x9e3779b1) ^ 0x4c4f4f54) >>> 0));
        const chance = before.activeDungeonRoom === lib.getDungeonRoomCount(encounter.floor) ? 1 : 1 / Math.max(1, lib.getDungeonRoomCount(encounter.floor) - 1);
        if (encounter.outcome === 'victory' && rng.next() < chance) {
          const band = lib.getChestLootBand(encounter.floor);
          const drop = lib.resolveEligibleCatalogDrop({ rarity: lib.rollWeightedRarity(band.weights, rng.next()), levelMin: band.levelMin, levelMax: band.levelMax, provenance: isBoss ? 'boss' : 'chest' });
          if (!drop) throw new Error('Idle loot pool empty');
          const model = drop.candidates[rng.nextInt(drop.candidates.length)];
          const min = Math.max(model.levelRange.min, band.levelMin), max = Math.min(model.levelRange.max, band.levelMax);
          const item = { instanceId: `idle-loot:${seed}:${exploration}`, itemId: model.id, itemLevel: min + rng.nextInt(max - min + 1), powerModelId: model.powerModelId, rarity: drop.rarity };
          state.storedItems.push(item); encounter.rewards.loot.push({ type: 'item', ...item, count: 1 });
          encounter.transcript.push({ type: 'reward.item', category: 'loot', message: 'Idle candidate', ...item, count: 1 });
        }
        encounter.transcript.forEach((e, i) => { e.sequence = i; });
      }
      if (!variant.idle && !variant.canonicalLoot && profile !== 'baseline' && encounter.outcome === 'victory') {
        // Dedicated counterfactual stream: paired candidates share loot rolls;
        // canonical combat/challenge randomness itself is never mocked.
        const rng = lib.restoreCanonicalRng(lib.initialCanonicalRngState((seed ^ Math.imul(exploration + 1, 0x9e3779b1) ^ 0x4c4f4f54) >>> 0));
        const band = lib.getChestLootBand(encounter.floor);
        const existingItems = encounter.rewards.loot.filter((entry) => entry.type === 'item').length;
        const itemChance = rng.next();
        const addItem = (kind === 'treasure' || isBoss) ? existingItems === 0 : kind === 'fight' && itemChance < (variant.flow ? flowItemChance(heroBand(before)) : variant.regularItemChance);
        if (addItem) {
          const rarity = lib.rollWeightedRarity(band.weights, rng.next());
          const drop = lib.resolveEligibleCatalogDrop({ rarity, levelMin: band.levelMin, levelMax: band.levelMax, provenance: variant.flow && isBoss ? 'boss' : 'chest' });
          if (!drop) throw new Error('Candidate loot pool empty');
          const base = drop.candidates[rng.nextInt(drop.candidates.length)];
          const min = Math.max(base.levelRange.min, band.levelMin);
          const max = Math.min(base.levelRange.max, band.levelMax);
          const item = { instanceId: `loot-calibration:${seed}:${exploration}`, itemId: base.id, itemLevel: min + rng.nextInt(max - min + 1), powerModelId: base.powerModelId, rarity: drop.rarity };
          state.storedItems.push(item);
          encounter.rewards.loot.push({ type: 'item', ...item, count: 1 });
          encounter.transcript.push({ sequence: encounter.transcript.length, type: 'reward.item', category: 'loot', message: 'Objet candidat', ...item, count: 1 });
        }
        if (kind === 'fight' && (variant.scrapPerWin > 0 || (isBoss && variant.scrapPerElite > 0))) {
          const count = (variant.scrapPerWin || variant.scrapPerElite) * lib.getForgeMaterialMultiplier(band.levelMin);
          const material = { materialId: 'metal_scrap', rarity: 'common', count };
          const stack = state.forgeMaterials.find((entry) => entry.materialId === material.materialId);
          if (stack) stack.count += count; else state.forgeMaterials.push({ ...material });
          encounter.rewards.loot.push({ type: 'material', ...material, name: 'Débris métalliques' });
          encounter.transcript.push({ sequence: encounter.transcript.length, type: 'reward.material', category: 'loot', message: 'Scraps candidats', ...material });
        }
        const repeatGold = encounter.transcript.filter((event) => event.type === 'reward.gold').reduce((sum, event) => sum + Number(event.gold ?? 0), 0);
        const chestGold = !variant.flow && kind === 'treasure' && repeatGold === 0 ? lib.applyLootModifiers('goldGain', lib.getDungeonGoldReward(encounter.floor, 'treasure'), state.heroes) : 0;
        const extraGold = Math.floor((repeatGold + chestGold) * variant.goldMultiplier) - repeatGold;
        if (extraGold > 0) {
          state.resources.gold += extraGold;
          encounter.rewards.gold += extraGold;
          encounter.transcript.push({ sequence: encounter.transcript.length, type: 'reward.gold', category: 'loot', message: 'Or candidat', gold: extraGold });
        }
      }
      run.goldGross += encounter.rewards.gold;
      run.goldPerSource[source] = (run.goldPerSource[source] ?? 0) + encounter.rewards.gold;
      const firstClear = encounter.transcript.filter((event) => event.type === 'reward.floor_first_clear').reduce((sum, event) => sum + Number(event.gold ?? 0), 0);
      run.goldPerSource.firstClear = (run.goldPerSource.firstClear ?? 0) + firstClear;
      run.goldPerSource[source] -= firstClear;
      run.goldLost += Math.max(0, before.resources.gold - state.resources.gold);
      const counter = run.bySource[source] ??= { encounters: 0, items: 0, materials: 0 };
      counter.encounters++;
      let items = 0;
      for (const loot of encounter.rewards.loot) {
        if (loot.type === 'item') { run.items++; items++; counter.items++; }
        if (loot.type === 'material') {
          counter.materials++;
          run.materialsGross[loot.materialId] = (run.materialsGross[loot.materialId] ?? 0) + loot.count;
        }
      }
      run.drySpell = items ? 0 : run.drySpell + 1;
      run.maxDrySpell = Math.max(run.maxDrySpell, run.drySpell);
      let pass = run.passes.at(-1);
      if (!pass || pass.completed || pass.floor !== encounter.floor || before.activeDungeonRoom < pass.lastRoom) {
        pass = { floor: encounter.floor, startRoom: before.activeDungeonRoom, lastRoom: 0, items: 0, encounters: 0, repeat: run.passes.some((p) => p.floor === encounter.floor), completed: false };
        run.passes.push(pass);
      }
      pass.items += items; pass.encounters++; pass.lastRoom = before.activeDungeonRoom;
      pass.completed = before.activeDungeonRoom === lib.getDungeonRoomCount(encounter.floor) && encounter.outcome === 'victory';
      return resolution;
    };
    globalThis.__lootRecycle = (source) => {
      if (source.buildings.forge < 1) return source;
      let state = source;
      const minLevel = Math.min(...state.heroes.map((hero) => hero.level));
      // Existing optimizer has already equipped positive immediate improvements.
      // Keep future-level items; recycle the remaining currently usable surplus.
      for (const item of [...state.storedItems]) {
        if (item.itemLevel > minLevel) continue;
        const before = Object.fromEntries(state.forgeMaterials.map((m) => [m.materialId, m.count]));
        state = forgePolicy.command(state, { type: 'inventory.recycle', instanceId: item.instanceId });
        run.recycled++;
        for (const m of state.forgeMaterials) run.materialsRecycled[m.materialId] = (run.materialsRecycled[m.materialId] ?? 0) + m.count - (before[m.materialId] ?? 0);
      }
      return state;
    };
    globalThis.__lootCapture = (state, encounter, report, forgeContext) => {
      forgePolicy.capture(state, report);
      run.inventory.maxAfterManagement=Math.max(run.inventory.maxAfterManagement,state.storedItems.length);
      run.inventory.finalStoredItems=state.storedItems.length;
      const minimumHeroLevel=Math.min(...state.heroes.map(hero=>hero.level));
      run.inventory.finalFutureItems=state.storedItems.filter(item=>item.itemLevel>minimumHeroLevel).length;
      const timing = run.timing;
      const elapsed = report.simulatedSeconds - timing.lastSeconds;
      const recovery = report.recoveryWaitSeconds - timing.lastRecovery;
      if (run.bestiary) {
        const location = regionAt(encounter.floor, profile);
        const row = run.bestiary.regions[location.region.id + ':cycle' + location.cycle];
        row.seconds += elapsed; row.recoverySeconds += recovery;
      }
      const timeRow = timing.bands[timing.band] ??= { seconds: 0, recoverySeconds: 0, encounterSeconds: 0, fourHeroSeconds: 0, explorations: 0 };
      timeRow.seconds += elapsed; timeRow.recoverySeconds += recovery; timeRow.encounterSeconds += elapsed - recovery; timeRow.explorations++;
      if (timing.heroCount === 4) timeRow.fourHeroSeconds += elapsed;
      timing.lastSeconds = report.simulatedSeconds; timing.lastRecovery = report.recoveryWaitSeconds;
      timing.band = bandName(heroBand(state)); timing.heroCount = state.heroes.length;
      const seconds = report.simulatedSeconds - run.lastSeconds;
      run.drySeconds += seconds;
      run.maxDrySeconds = Math.max(run.maxDrySeconds, run.drySeconds); run.lastSeconds = report.simulatedSeconds;
      if (encounter.rewards.loot.some((l) => l.type === 'item')) run.drySeconds = 0;
      for (const hero of state.heroes) for (const [slot, item] of Object.entries(hero.equipment ?? {})) {
        if (!previousEquipment[hero.id]) { previousEquipment[hero.id] = Object.fromEntries(Object.entries(hero.equipment ?? {}).map(([key, value]) => [key, value?.instanceId])); run.heroUpgrades[hero.id] = 0; }
        if (item && previousEquipment[hero.id][slot] !== item.instanceId && !item.instanceId.includes(':tier1:')) run.heroUpgrades[hero.id]++;
        previousEquipment[hero.id][slot] = item?.instanceId;
      }
      for (let level = previousForge; level < state.buildings.forge; level++) run.goldForgeSpent += lib.getBuildingUpgradeCost('forge', level).gold;
      previousForge = state.buildings.forge;
      const scrap = materialCount(state, 'metal_scrap');
      const refined = materialCount(state, 'refined_metal');
      const partyLevel = Math.min(...state.heroes.map((hero) => hero.level));
      for (const level of [5, 10, 15, 20, 25, 30, 35, 40]) if (state.heroes.length === 4 && partyLevel >= level) timing.milestones[level] ??= { seconds: report.simulatedSeconds, recoverySeconds: report.recoveryWaitSeconds, explorations: report.explorations };
      const craftLevel = Math.min(Math.max(1, state.buildings.forge), Math.floor((partyLevel - 1) / 5) + 1);
      const multiplier = lib.getForgeMaterialMultiplier((craftLevel - 1) * 5 + 1);
      const snapshot = { explorations: report.explorations, heroCount: state.heroes.length, goldCitySpent: cityPolicy?.ledger.goldSpent ?? 0, items: run.items, maxDrySpell: run.maxDrySpell,
        scrapGross: run.materialsGross.metal_scrap ?? 0, refinedGross: run.materialsGross.refined_metal ?? 0,
        scrapStock: scrap, refinedStock: refined, goldGross: run.goldGross, goldLost: run.goldLost, goldForgeSpent: run.goldForgeSpent, goldStock: state.resources.gold,
        crafts: forgeContext.report.crafts, usefulCrafts: forgeContext.report.usefulCrafts, equippedCrafts: forgeContext.report.equippedCrafts,
        uniqueEquippedCrafts: forgePolicy.ledger.crafts.filter((c) => c.equippedAt !== undefined).length,
        equippedLaterCrafts: forgePolicy.ledger.crafts.filter((c) => c.equippedAt !== undefined && c.equippedAt !== c.exploration).length,
        baseCraftBudget: Math.min(Math.floor(scrap / (6 * multiplier)), variant.scrapOnlyCraft ? Infinity : Math.floor(refined / multiplier)),
        forgeLevel: state.buildings.forge, heroUpgradeMin: Math.min(...Object.values(run.heroUpgrades)), heroesUpgraded: Object.values(run.heroUpgrades).filter((count) => count > 0).length,
        recycled: run.recycled, materialBlockedChecks: Object.values(forgePolicy.ledger.bands).reduce((sum, band) => sum + band.materialBlocked, 0) };
      for (const level of [5, 10, 15, 20, 25, 30, 35, 40]) if (state.heroes.length === 4 && partyLevel >= level && !run.recipeAudits[level]) {
        const audit = (candidateState) => {
          let bestGain = 0;
          const recipe = lib.chooseManagedRecipe(candidateState, craftLevel, (s, ids) => {
            const result = lib.optimizeEquipment(s, ids, true);
            bestGain = Math.max(bestGain, result.gains.reduce((sum, gain) => sum + gain.absolute, 0));
            return result;
          });
          return { recipe, bestGain };
        };
        const known = audit(state);
        const allPlans = audit({ ...state, itemBlueprints: lib.ITEM_LIBRARY.filter((item) => item.catalogStatus === 'active' && item.powerModelId === 'level-bands-v1' && item.blueprintAvailable && item.provenances.includes('forge')).map((item) => ({ itemId: item.id, unlocked: true })) });
        for (const result of [known, allPlans]) if (result.recipe) {
          const item = lib.getItemById(result.recipe);
          if (item.catalogStatus !== 'active' || item.powerModelId !== 'level-bands-v1') throw new Error(`Non-craftable recipe in audit: ${result.recipe}`);
        }
        run.recipeAudits[level] = { explorations: report.explorations, forgeLevel: state.buildings.forge, craftLevel, knownPlans: state.itemBlueprints.filter((p) => p.unlocked).length, known, allPlans };
      }
      for (const floor of [3, 6, 8, 10, 20, 30, 40, 62]) if (state.highestFloorReached >= floor) run.checkpoints[`floor${floor}`] ??= { ...snapshot };
      for (const level of [5, 10, 20, 30, 40]) if (state.heroes.length === 4 && partyLevel >= level) run.checkpoints[`level${level}`] ??= { ...snapshot };
      run.final = snapshot;
      run.city = cityPolicy ? { ...cityPolicy.ledger, buildings: { ...state.buildings }, resources: { ...state.resources } } : null;
      run.goldConservationError = run.initialGold + run.goldGross - run.goldLost - run.goldForgeSpent - (run.city?.goldSpent ?? 0) - state.resources.gold;
    };
    for (let index = worker; index < seeds; index += workers) {
      if (resume) {
        let existing;
        try { existing = JSON.parse(await readFile(join(output, `run-${profile}-${index}.json`), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        if (existing) {
          const bundleHash = createHash('sha256').update(compiled.outputFiles[0].text).digest('hex');
          if (existing.profile !== profile || existing.seed !== 0x515050 + index || existing.policyHash !== policyHash || existing.bundleHash !== bundleHash) throw new Error(`Incompatible checkpoint: ${profile}/${index}`);
          reports.push(existing);
          console.log(`[loot:${stage}:${worker}] reused ${profile} seed ${index + 1}/${seeds}`);
          continue;
        }
      }
      run = { profile, seed: 0x515050 + index, items: 0, drySpell: 0, maxDrySpell: 0, drySeconds: 0, maxDrySeconds: 0, lastSeconds: 0, passes: [], goldGross: 0, goldLost: 0, goldForgeSpent: 0, goldPerSource: {}, materialsGross: {}, materialsRecycled: {}, bySource: {}, recycled: 0, inventory:{maxBeforeRecycle:0,maxAfterManagement:0,finalStoredItems:0,finalFutureItems:0}, checkpoints: {}, recipeAudits: {} };
      if (profiles.some((p) => p.startsWith('bestiary'))) run.bestiary = createBestiaryLedger(profile);
      const result = lib.runLevel40Campaign(lib.CANONICAL_PROFILE, run.seed);
      if (run.bestiary) run.bestiary.classes = result.finalClasses;
      run.bundleHash = createHash('sha256').update(compiled.outputFiles[0].text).digest('hex'); run.policyHash = policyHash;
      Object.assign(run, { highestFloor: result.highestFloor, levels: result.finalLevels, simulatedSeconds: result.simulatedSeconds, recoveryWaitSeconds: result.recoveryWaitSeconds, defeats: result.defeats, blockedReason: result.blockedReason, forge: result.forgeCandidate });
      if(journeyDriver)run.journeyComplete=journeyDriver.complete();
      const reachedTarget = journeyDriver?run.journeyComplete:stage === 'undercity' ? run.dungeonCleared === true : stage === 'early' ? run.highestFloor >= 8 : run.levels.length === 4 && run.levels.every((level) => level >= 40);
      if (!reachedTarget && !run.blockedReason) run.blockedReason = 'Calibration stopped before the target (safety limit or incomplete roster)';
      reports.push(run);
      const checkpoint = join(output, `run-${profile}-${index}.json`);
      await writeFile(checkpoint + '.tmp', JSON.stringify(run));
      await rename(checkpoint + '.tmp', checkpoint);
      console.log(`[loot:${stage}:${worker}] ${profile} seed ${index + 1}/${seeds}: ${result.explorations} explorations, floor ${result.highestFloor}, levels ${result.finalLevels.join('/')}`);
    }
  }
  await writeFile(join(output, `worker-${worker}.json`), JSON.stringify(reports));
}
