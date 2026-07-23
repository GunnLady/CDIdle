import { readFile } from "node:fs/promises";

const summaryPath = new URL("../coverage/coverage-summary.json", import.meta.url);
const summary = JSON.parse(await readFile(summaryPath, "utf8"));

const groups = [
  {
    name: "domain",
    match: /[/\\]src[/\\](domain|dispatch|repositories)[/\\]/,
    minimum: { statements: 78, branches: 70, functions: 85, lines: 88 },
  },
  {
    name: "game-api",
    match: /[/\\]supabase[/\\]functions[/\\]game-api[/\\]/,
    minimum: { statements: 75, branches: 58, functions: 80, lines: 83 },
  },
];

const metrics = ["statements", "branches", "functions", "lines"];

function aggregate(group) {
  const totals = Object.fromEntries(metrics.map((metric) => [metric, { total: 0, covered: 0 }]));
  for (const [file, report] of Object.entries(summary)) {
    if (file === "total" || !group.match.test(file)) continue;
    for (const metric of metrics) {
      totals[metric].total += report[metric].total;
      totals[metric].covered += report[metric].covered;
    }
  }
  return Object.fromEntries(metrics.map((metric) => [metric, (totals[metric].covered / totals[metric].total) * 100]));
}

let failed = false;
for (const group of groups) {
  const actual = aggregate(group);
  const output = metrics.map((metric) => `${metric}=${actual[metric].toFixed(2)}% (min ${group.minimum[metric]}%)`).join(", ");
  console.log(`${group.name}: ${output}`);
  for (const metric of metrics) {
    if (actual[metric] < group.minimum[metric]) failed = true;
  }
}

if (failed) {
  console.error("Coverage thresholds failed.");
  process.exitCode = 1;
} else {
  console.log("Coverage thresholds OK.");
}
