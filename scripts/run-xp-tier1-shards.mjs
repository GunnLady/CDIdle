import { spawn } from "node:child_process";
import { calculateXpNeeded } from "../shared/domain/hero-xp.ts";

const SHARD_COUNT = Number(process.env.XP_SHARD_COUNT ?? 10);
const SEEDS_PER_SHARD = Number(process.env.XP_SEEDS_PER_SHARD ?? 10);
const TARGET = 2 / 3;
const LEVEL_BANDS = ["1-9", "10-19", "20-29", "30-34", "35-40"];
const CHALLENGE_KINDS = ["trap", "enigma", "ambush", "ritual", "obstacle", "negotiation"];
const MILESTONES = [10, 20, 30, 35, 40];

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

const shards = await Promise.all(Array.from({ length: SHARD_COUNT }, (_, index) => runShard(index)));
const reports = shards.flatMap((shard) => shard.reports);
const expectedSeeds = Array.from({ length: SHARD_COUNT * SEEDS_PER_SHARD }, (_, index) => 0x515050 + index);
const actualSeeds = reports.map((report) => report.seed).sort((left, right) => left - right);
if (JSON.stringify(actualSeeds) !== JSON.stringify(expectedSeeds)) {
  throw new Error("Les 100 seeds attendues ne sont pas toutes presentes exactement une fois.");
}

const xpByHeroLevel = Object.fromEntries(Array.from({ length: 39 }, (_, index) => [index + 1, { xp: 0, exposures: 0 }]));
const xpBySource = Object.fromEntries(Object.keys(shards[0].xpBySource).map((source) => [source, 0]));
const challengeByLevelBand = Object.fromEntries(LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]));
const challengeByKindAndLevelBand = Object.fromEntries(CHALLENGE_KINDS.map((kind) => [kind,
  Object.fromEntries(LEVEL_BANDS.map((band) => [band, { attempts: 0, successes: 0, zeroChance: 0 }]))
]));
const challengeByFloorAndKind = {};
const challengeCandidateHistogram = {};

for (const shard of shards) {
  for (let level = 1; level < 40; level += 1) addCounters(xpByHeroLevel[level], shard.xpByHeroLevel[level]);
  addCounters(xpBySource, shard.xpBySource);
  for (const band of LEVEL_BANDS) addCounters(challengeByLevelBand[band], shard.challengeByLevelBand[band]);
  for (const kind of CHALLENGE_KINDS) {
    for (const band of LEVEL_BANDS) {
      addCounters(challengeByKindAndLevelBand[kind][band], shard.challengeByKindAndLevelBand[kind][band]);
    }
  }
  for (const [key, result] of Object.entries(shard.challengeByFloorAndKind)) {
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
  for (const [key, count] of Object.entries(shard.challengeCandidateHistogram)) {
    challengeCandidateHistogram[key] = (challengeCandidateHistogram[key] ?? 0) + count;
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
for (const band of LEVEL_BANDS) {
  const result = challengeByLevelBand[band];
  assertBetween(result.successes / result.attempts, TARGET - 0.04, TARGET + 0.04, `Defis ${band}`);
}
for (const kind of CHALLENGE_KINDS) {
  for (const band of LEVEL_BANDS) {
    const result = challengeByKindAndLevelBand[kind][band];
    assertBetween(result.successes / result.attempts, TARGET - 0.075, TARGET + 0.075, `${kind} ${band}`);
  }
}

const milestoneMedian = Object.fromEntries(MILESTONES.map((level) => [level,
  percentile(reports.map((report) => report.milestones[level]), 0.5)
]));
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

console.info(`[XPT1] ${reports.length} runs, ${SHARD_COUNT} processus x ${SEEDS_PER_SHARD} seeds`);
console.info(`[XPT1] secondes visibles medianes par exploration: ${medianVisibleSecondsPerExploration.toFixed(3)}`);
console.table(MILESTONES.map((level) => {
  const values = reports.map((report) => report.milestones[level]);
  return { niveau: level, p10: percentile(values, 0.1), mediane: percentile(values, 0.5), p90: percentile(values, 0.9) };
}));
console.table(LEVEL_BANDS.map((band) => {
  const result = challengeByLevelBand[band];
  return {
    niveaux: band,
    tentatives: result.attempts,
    taux_reussite: Number((result.successes / result.attempts).toFixed(4)),
    taux_chance_nulle: Number((result.zeroChance / result.attempts).toFixed(4)),
  };
}));
console.info("[XPT1] defis par type et bande");
console.table(LEVEL_BANDS.flatMap((band) => CHALLENGE_KINDS.map((kind) => {
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
if (violations.length > 0) {
  throw new Error(`Echecs de calibration:\n- ${violations.join("\n- ")}`);
}
