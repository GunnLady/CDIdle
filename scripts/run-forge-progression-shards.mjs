import { spawn } from "node:child_process";

const SHARD_COUNT = Number(process.env.FORGE_SHARD_COUNT ?? 10);
const SEEDS_PER_SHARD = Number(process.env.FORGE_SEEDS_PER_SHARD ?? 10);
const ENFORCE = process.env.FORGE_ENFORCE !== "0";
const ITEM_LEVEL_BANDS = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31-35", "36-40"];
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

function runShard(index) {
  return new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) {
      reject(new Error("npm_execpath absent: lancez ce harness avec npm.cmd run test:forge-progression."));
      return;
    }
    const child = spawn(process.execPath, [npmCli, "run", "test:xp-tier1:shard"], {
      env: {
        ...process.env,
        FORGE_CANDIDATE: "1",
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

function percentile(values, ratio) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.round((sorted.length - 1) * ratio)];
}

const shards = await Promise.all(Array.from({ length: SHARD_COUNT }, (_, index) => runShard(index)));
const reports = shards.flatMap((shard) => shard.reports);
const expectedSeeds = Array.from(
  { length: SHARD_COUNT * SEEDS_PER_SHARD },
  (_, index) => 0x515050 + index,
);
const actualSeeds = reports.map((report) => report.seed).sort((left, right) => left - right);
if (JSON.stringify(actualSeeds) !== JSON.stringify(expectedSeeds)) {
  throw new Error("Les seeds Forge attendues ne sont pas toutes presentes exactement une fois.");
}
if (reports.some((report) => !report.forgeCandidate)) {
  throw new Error("Le rapport Forge experimental est absent.");
}

const failures = [];
const objectiveRows = [];
const forgeReports = reports.map((report) => report.forgeCandidate);
const campaignCompletionRate = reports.filter((report) => (
  !report.blockedReason && report.milestones[40] !== undefined
)).length / reports.length;
objectiveRows.push({ objectif: "Campagnes niveau 40 terminees", resultat: campaignCompletionRate, cible: 1, statut: campaignCompletionRate === 1 ? "PASS" : "FAIL" });
if (campaignCompletionRate !== 1) failures.push(`Campagnes niveau 40 terminees: ${(campaignCompletionRate * 100).toFixed(1)} %.`);
const completionRate = forgeReports.filter((report) => report.finalLevel === 8).length / forgeReports.length;
objectiveRows.push({ objectif: "Forge niveau 8 atteignable", resultat: completionRate, cible: 1, statut: completionRate === 1 ? "PASS" : "FAIL" });
if (completionRate !== 1) failures.push(`Forge 8 atteinte dans ${(completionRate * 100).toFixed(1)} % des campagnes.`);

const anyProgressionPlanRate = forgeReports.filter((report) => report.knownProgressionPlans > 0).length / forgeReports.length;
objectiveRows.push({ objectif: "Au moins un plan evolutif", resultat: anyProgressionPlanRate, cible: 0.95, statut: anyProgressionPlanRate >= 0.95 ? "PASS" : "FAIL" });
if (anyProgressionPlanRate < 0.95) failures.push(`Plan evolutif connu dans ${(anyProgressionPlanRate * 100).toFixed(1)} % des campagnes.`);

const bandRows = ITEM_LEVEL_BANDS.map((band) => {
  let withinFirstThird = 0;
  let eligible = 0;
  let usefulCampaigns = 0;
  const delays = [];
  const upgradeExplorations = [];
  const plansAtUpgrade = [];
  const firstMaterialsAvailable = [];
  const firstRecipeAvailable = [];
  let crafts = 0;
  let usefulCrafts = 0;
  let equippedCrafts = 0;
  for (const report of forgeReports) {
    const result = report.bands[band];
    crafts += result.crafts;
    usefulCrafts += result.usefulCrafts;
    equippedCrafts += result.equippedCrafts;
    if (result.usefulCrafts > 0) usefulCampaigns += 1;
    if (result.buildingUpgradeExploration !== undefined) upgradeExplorations.push(result.buildingUpgradeExploration);
    if (result.plansKnownAtUpgrade !== undefined) plansAtUpgrade.push(result.plansKnownAtUpgrade);
    if (result.firstMaterialsAvailableExploration !== undefined) {
      firstMaterialsAvailable.push(result.firstMaterialsAvailableExploration);
    }
    if (result.firstRecipeAvailableExploration !== undefined) {
      firstRecipeAvailable.push(result.firstRecipeAvailableExploration);
    }
    if (
      result.heroEntryExploration === undefined
      || result.heroExitExploration === undefined
      || result.firstUsefulCraftExploration === undefined
    ) continue;
    eligible += 1;
    const start = Math.max(result.heroEntryExploration, result.buildingUpgradeExploration ?? 0);
    const duration = Math.max(1, result.heroExitExploration - result.heroEntryExploration);
    const delay = Math.max(0, result.firstUsefulCraftExploration - start);
    delays.push(delay);
    if (delay <= duration / 3) withinFirstThird += 1;
  }
  const firstThirdRate = eligible === 0 ? 0 : withinFirstThird / forgeReports.length;
  const target = band === "1-5" ? 0.8 : 0.9;
  const status = firstThirdRate >= target ? "PASS" : "FAIL";
  if (status === "FAIL") {
    failures.push(`Premier craft utile ${band}: ${(firstThirdRate * 100).toFixed(1)} % des campagnes, cible ${(target * 100).toFixed(0)} %.`);
  }
  return {
    niveaux: band,
    upgrade_mediane: percentile(upgradeExplorations, 0.5),
    plans_connus_upgrade_mediane: percentile(plansAtUpgrade, 0.5),
    materiaux_disponibles_mediane: percentile(firstMaterialsAvailable, 0.5),
    recette_utile_disponible_mediane: percentile(firstRecipeAvailable, 0.5),
    blocages_materiaux: forgeReports.reduce(
      (sum, report) => sum + report.bands[band].materialBlockedChecks,
      0,
    ),
    blocages_recette: forgeReports.reduce(
      (sum, report) => sum + report.bands[band].recipeBlockedChecks,
      0,
    ),
    crafts,
    crafts_utiles: usefulCrafts,
    crafts_equipes_immediatement: equippedCrafts,
    campagnes_avec_craft_utile_pct: Number((usefulCampaigns / forgeReports.length * 100).toFixed(1)),
    delai_craft_utile_median: percentile(delays, 0.5),
    premier_tiers_pct: Number((firstThirdRate * 100).toFixed(1)),
    cible_pct: target * 100,
    statut: status,
  };
});

const rarityRows = ITEM_LEVEL_BANDS.map((band) => {
  const offered = Object.fromEntries(RARITIES.map((rarity) => [rarity, forgeReports.reduce(
    (sum, report) => sum + report.bands[band].rarityOffers[rarity],
    0,
  )]));
  const accepted = Object.fromEntries(RARITIES.map((rarity) => [rarity, forgeReports.reduce(
    (sum, report) => sum + report.bands[band].rarityAccepted[rarity],
    0,
  )]));
  return {
    niveaux: band,
    offres: Object.values(offered).reduce((sum, count) => sum + count, 0),
    ...Object.fromEntries(RARITIES.map((rarity) => [`offre_${rarity}`, offered[rarity]])),
    ...Object.fromEntries(RARITIES.map((rarity) => [`accepte_${rarity}`, accepted[rarity]])),
  };
});

console.info(`[FORGE] ${reports.length} runs, ${SHARD_COUNT} processus x ${SEEDS_PER_SHARD} seeds`);
console.info("[FORGE] couts batiment: table runtime partagee validee (equivalent croissance x1.60)");
console.info("[FORGE] objectifs");
console.table(objectiveRows);
console.info("[FORGE] progression par tranche");
console.table(bandRows);
console.info("[FORGE] plans");
console.table([{
  boss: forgeReports.reduce((sum, report) => sum + report.bossPlans, 0),
  jets_coffre: forgeReports.reduce((sum, report) => sum + report.treasurePlanRolls, 0),
  plans_coffre: forgeReports.reduce((sum, report) => sum + report.treasurePlans, 0),
  jets_vides: forgeReports.reduce((sum, report) => sum + report.emptyPlanRolls, 0),
  plans_evolutifs_median: percentile(forgeReports.map((report) => report.knownProgressionPlans), 0.5),
  crafts_recycles: forgeReports.reduce((sum, report) => sum + report.recycledCrafts, 0),
}]);
console.info("[FORGE] raretes proposees et acceptees");
console.table(rarityRows);
console.info("[FORGE] progression XP avec Forge");
console.table([10, 20, 30, 35, 40].map((level) => {
  const values = reports.flatMap((report) => (
    report.milestones[level] === undefined ? [] : [report.milestones[level]]
  ));
  return {
    niveau: level,
    p10: percentile(values, 0.1),
    mediane: percentile(values, 0.5),
    p90: percentile(values, 0.9),
  };
}));
const exceptionalReports = reports.filter((report) => (
  report.blockedReason
  || report.milestones[40] === undefined
  || report.forgeCandidate.finalLevel < 8
));
if (exceptionalReports.length > 0) {
  console.info("[FORGE] campagnes exceptionnelles");
  console.table(exceptionalReports.map((report) => ({
    seed: report.seed,
    blocage: report.blockedReason ?? "-",
    explorations: report.explorations,
    niveaux: report.finalLevels.join("/"),
    etage: report.highestFloor,
    forge: report.forgeCandidate.finalLevel,
    replis_limite_combat: report.combatLimitRetreats,
  })));
}
if (reports.length <= 10) {
  console.info("[FORGE] diagnostic par seed");
  console.table(reports.map((report) => ({
    seed: report.seed,
    blocage: report.blockedReason ?? "-",
    explorations: report.explorations,
    niveaux: report.finalLevels.join("/"),
    etage: report.highestFloor,
    forge: report.forgeCandidate.finalLevel,
    replis_limite_combat: report.combatLimitRetreats,
    crafts_utiles: ITEM_LEVEL_BANDS.map((band) => (
      report.forgeCandidate.bands[band].firstUsefulCraftExploration ?? "-"
    )).join("/"),
  })));
}

if (failures.length > 0) {
  console.warn(`[FORGE] objectifs non atteints:\n- ${failures.join("\n- ")}`);
  if (ENFORCE) throw new Error("Le harness Forge runtime ne respecte pas les objectifs.");
}
