import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { calculateXpNeeded } from "../shared/domain/hero-xp.ts";

const SHARD_COUNT = Number(process.env.XP_SHARD_COUNT ?? 10);
const SEEDS_PER_SHARD = Number(process.env.XP_SEEDS_PER_SHARD ?? 10);
const SEED_STRIDE = Number(process.env.XP_SEED_STRIDE ?? 1);
const TARGET = 2 / 3;
const CHALLENGE_LEVEL_BANDS = ["1-9", "10-19", "20-29", "30-34", "35-40"];
const ITEM_LEVEL_BANDS = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31-35", "36-40"];
const CHALLENGE_KINDS = ["trap", "enigma", "ambush", "ritual", "obstacle", "negotiation"];
const MILESTONES = [10, 20, 30, 35, 40];
const PROFILE_IDS = ["optimized", "average"];
const OUTPUT_DIRECTORY = resolve(process.env.XP_OUTPUT_DIRECTORY ?? join("test-results", "xp-tier1"));
const RUN_ID = new Date().toISOString().replaceAll(":", "-");

async function persistResult(result) {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  const serialized = `${JSON.stringify({
    schemaVersion: 1,
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
    ...result,
  }, null, 2)}\n`;
  const runPath = join(OUTPUT_DIRECTORY, `${RUN_ID}.json`);
  const latestPath = join(OUTPUT_DIRECTORY, "latest.json");
  await Promise.all([
    writeFile(runPath, serialized, "utf8"),
    writeFile(latestPath, serialized, "utf8"),
  ]);
  console.info(`[XPT1] artefact: ${runPath}`);
}

function runShard(index) {
  return new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) {
      reject(new Error("npm_execpath absent: lancez ce harness avec npm.cmd run test:xp-tier1."));
      return;
    }
    const child = spawn(process.execPath, [npmCli, "run", "test:xp-tier1:shard"], {
      env: {
        ...process.env,
        XP_SEED_COUNT: String(SEEDS_PER_SHARD),
        XP_SEED_OFFSET: String(index * SEEDS_PER_SHARD),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Shard ${index} en echec (${code}).\n${stdout}\n${stderr}`));
        return;
      }
      const match = stdout.match(/\[XPT1_RESULT_B64\]([A-Za-z0-9+/=]+)/);
      if (!match) {
        reject(new Error(`Resultat machine absent pour le shard ${index}.\n${stdout}\n${stderr}`));
        return;
      }
      resolve(JSON.parse(Buffer.from(match[1], "base64").toString("utf8")));
    });
  });
}

function addCounters(target, source) {
  for (const key of Object.keys(target)) target[key] += source[key];
}

function percentile(values, ratio) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.round((sorted.length - 1) * ratio)];
}

const violations = [];

function assertBetween(value, low, high, label) {
  if (!(value >= low && value <= high)) {
    violations.push(`${label}: ${value.toFixed(4)} hors [${low.toFixed(4)}, ${high.toFixed(4)}]`);
  }
}

let shards;
try {
  shards = await Promise.all(Array.from({ length: SHARD_COUNT }, (_, index) => runShard(index)));
} catch (error) {
  await persistResult({
    status: "error",
    phase: "shards",
    configuration: {
      shardCount: SHARD_COUNT,
      seedsPerShard: SEEDS_PER_SHARD,
      seedStride: SEED_STRIDE,
      profileIds: PROFILE_IDS,
      diagnostics: process.env.XP_DIAGNOSTICS === "1",
    },
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
  throw error;
}
const allReports = shards.flatMap((shard) => shard.reports);
const expectedSeeds = Array.from(
  { length: SHARD_COUNT * SEEDS_PER_SHARD },
  (_, index) => 0x515050 + index * SEED_STRIDE,
);
const expectedRuns = PROFILE_IDS.flatMap((profile) => expectedSeeds.map((seed) => `${profile}:${seed}`)).sort();
const actualRuns = allReports.map((report) => `${report.profile}:${report.seed}`).sort();
if (JSON.stringify(actualRuns) !== JSON.stringify(expectedRuns)) {
  throw new Error("Les seeds attendues ne sont pas toutes presentes exactement une fois par profil.");
}
const reports = allReports.filter((report) => report.profile === "optimized");

function aggregateProfile(profile) {
  const xpByHeroLevel = Object.fromEntries(Array.from({ length: 39 }, (_, index) => [index + 1, { xp: 0, exposures: 0 }]));
  const xpBySource = Object.fromEntries(Object.keys(shards[0].xpBySource).map((source) => [source, 0]));
  const challengeByLevelBand = Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]));
  const challengeByKindAndLevelBand = Object.fromEntries(CHALLENGE_KINDS.map((kind) => [kind,
    Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]))
  ]));
  const challengeByFloorAndKind = {};
  const challengeCandidateHistogram = {};
  const itemByLevelBand = Object.fromEntries(ITEM_LEVEL_BANDS.map((band) => [band, {
    drops: 0,
    immediatelyLevelUsable: 0,
    futureLevelLocked: 0,
    requiredLevelSum: 0,
    rarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
  }]));
  const equipmentByLevelBand = Object.fromEntries(ITEM_LEVEL_BANDS.map((band) => [band, {
    changes: 0,
    absoluteGain: 0,
    relativeGain: 0,
    maxRelativeGain: 0,
    maxRareOrBetterRelativeGain: 0,
    partyEquipmentScoreSum: 0,
    exposures: 0,
  }]));

  for (const shard of shards) {
    const profileShard = shard.profiles[profile];
    for (let level = 1; level < 40; level += 1) addCounters(xpByHeroLevel[level], profileShard.xpByHeroLevel[level]);
    addCounters(xpBySource, profileShard.xpBySource);
    for (const band of CHALLENGE_LEVEL_BANDS) addCounters(challengeByLevelBand[band], profileShard.challengeByLevelBand[band]);
    for (const kind of CHALLENGE_KINDS) {
      for (const band of CHALLENGE_LEVEL_BANDS) {
        addCounters(challengeByKindAndLevelBand[kind][band], profileShard.challengeByKindAndLevelBand[kind][band]);
      }
    }
    for (const [key, result] of Object.entries(profileShard.challengeByFloorAndKind)) {
      const target = challengeByFloorAndKind[key] ??= {
        attempts: 0,
        successes: 0,
        zeroChance: 0,
        partyLevelSum: 0,
        difficultySum: 0,
        probabilitySum: 0,
      };
      addCounters(target, result);
    }
    for (const [key, count] of Object.entries(profileShard.challengeCandidateHistogram)) {
      challengeCandidateHistogram[key] = (challengeCandidateHistogram[key] ?? 0) + count;
    }
    for (const band of ITEM_LEVEL_BANDS) {
      const itemTarget = itemByLevelBand[band];
      const itemSource = profileShard.itemByLevelBand[band];
      for (const field of [
        "drops", "immediatelyLevelUsable", "futureLevelLocked", "requiredLevelSum",
      ]) itemTarget[field] += itemSource[field];
      addCounters(itemTarget.rarity, itemSource.rarity);

      const equipmentTarget = equipmentByLevelBand[band];
      const equipmentSource = profileShard.equipmentByLevelBand[band];
      for (const field of [
        "changes", "absoluteGain", "relativeGain", "partyEquipmentScoreSum", "exposures",
      ]) equipmentTarget[field] += equipmentSource[field];
      equipmentTarget.maxRelativeGain = Math.max(equipmentTarget.maxRelativeGain, equipmentSource.maxRelativeGain);
      equipmentTarget.maxRareOrBetterRelativeGain = Math.max(
        equipmentTarget.maxRareOrBetterRelativeGain,
        equipmentSource.maxRareOrBetterRelativeGain,
      );
    }
  }
  return {
    xpByHeroLevel,
    xpBySource,
    challengeByLevelBand,
    challengeByKindAndLevelBand,
    challengeByFloorAndKind,
    challengeCandidateHistogram,
    itemByLevelBand,
    equipmentByLevelBand,
  };
}

const profileMetrics = Object.fromEntries(PROFILE_IDS.map((profile) => [profile, aggregateProfile(profile)]));
const {
  xpByHeroLevel,
  xpBySource,
  challengeByFloorAndKind,
} = profileMetrics.optimized;
const challengeCandidateHistogram = {};
const challengeByLevelBand = Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]));
const challengeByKindAndLevelBand = Object.fromEntries(CHALLENGE_KINDS.map((kind) => [kind,
  Object.fromEntries(CHALLENGE_LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]))
]));
for (const metrics of Object.values(profileMetrics)) {
  for (const [key, count] of Object.entries(metrics.challengeCandidateHistogram)) {
    challengeCandidateHistogram[key] = (challengeCandidateHistogram[key] ?? 0) + count;
  }
  for (const band of CHALLENGE_LEVEL_BANDS) addCounters(challengeByLevelBand[band], metrics.challengeByLevelBand[band]);
  for (const kind of CHALLENGE_KINDS) {
    for (const band of CHALLENGE_LEVEL_BANDS) {
      addCounters(challengeByKindAndLevelBand[kind][band], metrics.challengeByKindAndLevelBand[kind][band]);
    }
  }
}

function candidateProbability(score, luck, difficulty) {
  const minimumSuccessfulRoll = Math.ceil(difficulty - score);
  if (minimumSuccessfulRoll <= 1) return 1;
  if (minimumSuccessfulRoll > luck) return 0;
  return (luck - minimumSuccessfulRoll + 1) / luck;
}

function isotonicTargets(kind) {
  const samplesByFloor = {};
  for (const [key, count] of Object.entries(challengeCandidateHistogram)) {
    const [floorText, sampleKind, scoreText, luckText] = key.split(":");
    if (sampleKind !== kind) continue;
    const floor = Number(floorText);
    (samplesByFloor[floor] ??= []).push({ score: Number(scoreText), luck: Number(luckText), count });
  }
  const raw = Object.entries(samplesByFloor).map(([floorText, samples]) => {
    const attempts = samples.reduce((sum, sample) => sum + sample.count, 0);
    let bestDifficulty = 1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let difficulty = 1; difficulty <= 400; difficulty += 1) {
      const probability = samples.reduce((sum, sample) => (
        sum + candidateProbability(sample.score, sample.luck, difficulty) * sample.count
      ), 0) / attempts;
      const distance = Math.abs(probability - TARGET);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDifficulty = difficulty;
      }
    }
    return { floor: Number(floorText), difficulty: bestDifficulty, attempts };
  }).sort((left, right) => left.floor - right.floor);
  const blocks = [];
  for (const point of raw) {
    blocks.push({ start: point.floor, end: point.floor, weight: point.attempts, weighted: point.difficulty * point.attempts });
    while (blocks.length >= 2) {
      const previous = blocks.at(-2);
      const current = blocks.at(-1);
      if (previous.weighted / previous.weight <= current.weighted / current.weight) break;
      blocks.splice(-2, 2, {
        start: previous.start,
        end: current.end,
        weight: previous.weight + current.weight,
        weighted: previous.weighted + current.weighted,
      });
    }
  }
  return blocks.map((block) => ({
    etages: block.start === block.end ? String(block.start) : `${block.start}-${block.end}`,
    difficulte_cible: Number((block.weighted / block.weight).toFixed(1)),
    tentatives: block.weight,
  }));
}

const totalAttempts = Object.values(challengeByLevelBand).reduce((sum, result) => sum + result.attempts, 0);
const totalSuccesses = Object.values(challengeByLevelBand).reduce((sum, result) => sum + result.successes, 0);
assertBetween(totalSuccesses / totalAttempts, TARGET - 0.02, TARGET + 0.02, "Taux global des defis");
for (const band of CHALLENGE_LEVEL_BANDS) {
  const result = challengeByLevelBand[band];
  assertBetween(result.successes / result.attempts, 0.55, 0.80, `Defis ${band}`);
}
for (const kind of CHALLENGE_KINDS) {
  const attempts = CHALLENGE_LEVEL_BANDS.reduce(
    (sum, band) => sum + challengeByKindAndLevelBand[kind][band].attempts,
    0,
  );
  const successes = CHALLENGE_LEVEL_BANDS.reduce(
    (sum, band) => sum + challengeByKindAndLevelBand[kind][band].successes,
    0,
  );
  assertBetween(successes / attempts, 0.4, 0.95, `Defi global ${kind}`);
}
const firstBandRate = challengeByLevelBand["1-9"].successes / challengeByLevelBand["1-9"].attempts;
const finalBandRate = challengeByLevelBand["35-40"].successes / challengeByLevelBand["35-40"].attempts;
if (finalBandRate > firstBandRate - 0.02) {
  violations.push(`Les defis ne deviennent pas plus difficiles: ${(firstBandRate * 100).toFixed(2)} % -> ${(finalBandRate * 100).toFixed(2)} %.`);
}

const milestoneMedian = Object.fromEntries(MILESTONES.map((level) => [level,
  percentile(reports.map((report) => report.milestones[level]), 0.5)
]));
const profileSummaries = PROFILE_IDS.map((profile) => {
  const profileReports = allReports.filter((report) => report.profile === profile);
  const completed = profileReports.filter((report) => (
    !report.blockedReason
    && report.finalLevels.every((level) => level >= 40)
    && report.highestFloor <= 50
    && report.personalFirstRewards === 40
    && report.farmLoops > 0
  ));
  if (completed.length !== profileReports.length) {
    violations.push(`${profile}: ${completed.length}/${profileReports.length} campagnes produit terminees.`);
  }
  const level40Hours = profileReports.map((report) => report.milestoneSeconds[40] / 3600);
  const medianHours = percentile(level40Hours, 0.5);
  assertBetween(medianHours, 12, 13, `Temps median niveau 40 ${profile}`);
  return {
    profile,
    runs: profileReports.length,
    completed: completed.length,
    level40HoursP10: percentile(level40Hours, 0.1),
    level40HoursMedian: medianHours,
    level40HoursP90: percentile(level40Hours, 0.9),
    explorationsMedian: percentile(profileReports.map((report) => report.milestones[40]), 0.5),
    encounterHoursMedian: percentile(profileReports.map((report) => report.encounterSeconds / 3600), 0.5),
    recoveryHoursMedian: percentile(profileReports.map((report) => report.recoveryWaitSeconds / 3600), 0.5),
    personalXpMedian: percentile(profileReports.map((report) => report.personalXp), 0.5),
    farmLoopsMedian: percentile(profileReports.map((report) => report.farmLoops), 0.5),
  };
});
const minimumUsableRates = {
    "1-5": 0.5,
    "6-10": 0.5,
    "11-15": 0.55,
    "16-20": 0.6,
    "21-25": 0.65,
    "26-30": 0.7,
    "31-35": 0.75,
    "36-40": 0.8,
};
for (const profile of PROFILE_IDS) {
  const { itemByLevelBand, equipmentByLevelBand } = profileMetrics[profile];
  let previousPartyEquipmentScore = 0;
  for (const band of ITEM_LEVEL_BANDS) {
    const item = itemByLevelBand[band];
    const equipment = equipmentByLevelBand[band];
    const usableRate = item.immediatelyLevelUsable / item.drops;
    if (usableRate < minimumUsableRates[band]) {
      violations.push(`Objets utilisables ${band}: ${usableRate.toFixed(4)} sous ${minimumUsableRates[band].toFixed(4)}`);
    }
    if (equipment.changes === 0 || equipment.relativeGain <= 0) {
      violations.push(`Aucune amelioration equipee mesurable pour ${profile} ${band}.`);
    }
    const averagePartyEquipmentScore = equipment.partyEquipmentScoreSum / equipment.exposures;
    if (averagePartyEquipmentScore <= previousPartyEquipmentScore) {
      violations.push(`La puissance equipee ${profile} ne progresse pas dans la bande ${band}.`);
    }
    previousPartyEquipmentScore = averagePartyEquipmentScore;
    if (band !== "1-5" && band !== "6-10") {
      const representedRarities = Object.values(item.rarity).filter((count) => count > 0).length;
      const rareOrBetter = item.rarity.rare + item.rarity.epic + item.rarity.legendary;
      if (representedRarities < 3 || rareOrBetter / item.drops < 0.1) {
        violations.push(`Distribution de rarete insuffisante pour ${profile} ${band}.`);
      }
    }
  }
  if (Math.max(...ITEM_LEVEL_BANDS.slice(2).map((band) => (
    equipmentByLevelBand[band].maxRareOrBetterRelativeGain
  ))) <= 1) {
    violations.push(`La rarete explosive ne produit aucun upgrade jackpot superieur a 100 % pour ${profile}.`);
  }
}
const medianVisibleSecondsPerExploration = percentile(
  reports.map((report) => report.simulatedSeconds / report.explorations),
  0.5,
);
const phaseCosts = [
  milestoneMedian[10] / 9,
  (milestoneMedian[20] - milestoneMedian[10]) / 10,
  (milestoneMedian[30] - milestoneMedian[20]) / 10,
  (milestoneMedian[35] - milestoneMedian[30]) / 5,
  (milestoneMedian[40] - milestoneMedian[35]) / 5,
];
for (let index = 1; index < phaseCosts.length; index += 1) {
  if (phaseCosts[index] <= phaseCosts[index - 1]) {
    violations.push(`La progression ne ralentit pas entre les phases ${index} et ${index + 1}.`);
  }
}

console.info(
  `[XPT1] ${allReports.length} campagnes (${expectedSeeds.length} seeds x ${PROFILE_IDS.length} profils), `
  + `${SHARD_COUNT} processus x ${SEEDS_PER_SHARD} seeds`,
);
console.info("[XPT1] comparaison des profils produit");
console.table(profileSummaries.map((summary) => ({
  profil: summary.profile,
  runs: summary.runs,
  termines: summary.completed,
  heures_niveau_40_p10: Number(summary.level40HoursP10.toFixed(2)),
  heures_niveau_40_mediane: Number(summary.level40HoursMedian.toFixed(2)),
  heures_niveau_40_p90: Number(summary.level40HoursP90.toFixed(2)),
  explorations_niveau_40_mediane: summary.explorationsMedian,
  heures_rencontres_mediane: Number(summary.encounterHoursMedian.toFixed(2)),
  heures_recuperation_mediane: Number(summary.recoveryHoursMedian.toFixed(2)),
  xp_personnelle_mediane: summary.personalXpMedian,
  boucles_cour_mediane: summary.farmLoopsMedian,
})));
console.info("[XPT1] objets: catalogue canonique level-bands-v1, rarete explosive");
console.info(`[XPT1] secondes visibles medianes par exploration: ${medianVisibleSecondsPerExploration.toFixed(3)}`);
console.table(MILESTONES.map((level) => {
  const values = reports.map((report) => report.milestones[level]);
  return { niveau: level, p10: percentile(values, 0.1), mediane: percentile(values, 0.5), p90: percentile(values, 0.9) };
}));
console.table(CHALLENGE_LEVEL_BANDS.map((band) => {
  const result = challengeByLevelBand[band];
  return {
    niveaux: band,
    tentatives: result.attempts,
    taux_reussite: Number((result.successes / result.attempts).toFixed(4)),
    taux_chance_nulle: Number((result.zeroChance / result.attempts).toFixed(4)),
  };
}));
console.info("[XPT1] defis par type et bande");
console.table(CHALLENGE_LEVEL_BANDS.flatMap((band) => CHALLENGE_KINDS.map((kind) => {
  const result = challengeByKindAndLevelBand[kind][band];
  return {
    niveaux: band,
    defi: kind,
    tentatives: result.attempts,
    taux_reussite: Number((result.successes / result.attempts).toFixed(4)),
    taux_chance_nulle: Number((result.zeroChance / result.attempts).toFixed(4)),
  };
})));
console.info(`[XPT1] taux global des defis: ${(totalSuccesses / totalAttempts * 100).toFixed(2)} %`);
console.info("[XPT1] progression des objets par profil et niveau reel du groupe");
console.table(PROFILE_IDS.flatMap((profile) => ITEM_LEVEL_BANDS.map((band) => {
  const item = profileMetrics[profile].itemByLevelBand[band];
  const equipment = profileMetrics[profile].equipmentByLevelBand[band];
  return {
    profil: profile,
    niveaux: band,
    objets: item.drops,
    utilisables_niveau_pct: item.drops === 0
      ? 0
      : Number((item.immediatelyLevelUsable / item.drops * 100).toFixed(1)),
    niveau_requis_moyen: item.drops === 0 ? 0 : Number((item.requiredLevelSum / item.drops).toFixed(1)),
    changements: equipment.changes,
    gain_relatif_moyen_pct: equipment.changes === 0
      ? 0
      : Number((equipment.relativeGain / equipment.changes * 100).toFixed(2)),
    gain_relatif_max_pct: Number((equipment.maxRelativeGain * 100).toFixed(2)),
    gain_rare_plus_max_pct: Number((equipment.maxRareOrBetterRelativeGain * 100).toFixed(2)),
    puissance_equipement_groupe_moyenne: equipment.exposures === 0
      ? 0
      : Number((equipment.partyEquipmentScoreSum / equipment.exposures).toFixed(1)),
  };
})));
console.info("[XPT1] raretes des objets par profil et niveau reel du groupe");
console.table(PROFILE_IDS.flatMap((profile) => ITEM_LEVEL_BANDS.map((band) => ({
  profil: profile,
  niveaux: band,
  ...profileMetrics[profile].itemByLevelBand[band].rarity,
}))));
if (process.env.XP_DIAGNOSTICS === "1") {
  console.info("[XPT1] diagnostic des defis par etage et type");
  for (const kind of CHALLENGE_KINDS) {
    console.info(`[XPT1] seuils isotones cibles: ${kind}`);
    console.table(isotonicTargets(kind));
  }
}
console.info("[XPT1] courbes XP gagnee / XP necessaire");
console.table(Array.from({ length: 39 }, (_, index) => {
  const level = index + 1;
  const destination = level + 1;
  const xpNeeded = calculateXpNeeded(destination, "Novice");
  const gain = xpByHeroLevel[level].xp / xpByHeroLevel[level].exposures;
  return {
    niveau_depart: level,
    xp_necessaire: xpNeeded,
    xp_gagnee_moyenne: Number(gain.toFixed(2)),
    explorations_equivalentes: Number((xpNeeded / gain).toFixed(1)),
  };
}));
const totalXp = Object.values(xpBySource).reduce((sum, xp) => sum + xp, 0);
console.info("[XPT1] XP gagnee par source");
console.table(Object.entries(xpBySource).map(([source, xp]) => ({
  source,
  xp,
  part: Number((xp / totalXp).toFixed(4)),
})));
await persistResult({
  status: violations.length === 0 ? "passed" : "failed",
  configuration: {
    shardCount: SHARD_COUNT,
    seedsPerShard: SEEDS_PER_SHARD,
    seedStride: SEED_STRIDE,
    seedCount: expectedSeeds.length,
    profileIds: PROFILE_IDS,
    diagnostics: process.env.XP_DIAGNOSTICS === "1",
  },
  summary: {
    campaignCount: allReports.length,
    profileSummaries,
    milestoneMedian,
    medianVisibleSecondsPerExploration,
    challenges: {
      targetSuccessRate: TARGET,
      totalAttempts,
      totalSuccesses,
      globalSuccessRate: totalSuccesses / totalAttempts,
      firstBandRate,
      finalBandRate,
      byLevelBand: challengeByLevelBand,
      byKindAndLevelBand: challengeByKindAndLevelBand,
    },
    xpBySource,
  },
  reports: allReports,
  profileMetrics,
  violations,
});
if (violations.length > 0) {
  throw new Error(`Echecs de calibration:\n- ${violations.join("\n- ")}`);
}
