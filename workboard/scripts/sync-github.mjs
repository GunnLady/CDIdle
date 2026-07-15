import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { issueBody, loadBoard, updateTicketField, validateBoard } from "../lib/board.mjs";

const apply = process.argv.includes("--apply");
const repoArg = process.argv.find((argument) => argument.startsWith("--repo="));
const repository = repoArg?.slice("--repo=".length) || process.env.GITHUB_REPOSITORY || detectRepository();

if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
  console.error("Depot GitHub introuvable. Utiliser --repo=owner/name.");
  process.exit(1);
}

const validation = await validateBoard();
if (!validation.ok) {
  for (const error of validation.errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

const tickets = (await loadBoard()).flatMap((column) => column.tickets);
console.log(`${apply ? "Synchronisation" : "Simulation"}: ${tickets.length} ticket(s) vers ${repository}`);

if (!apply) {
  for (const ticket of tickets) {
    console.log(`- ${ticket.id}: ${ticket.metadata.github_issue ? "mise a jour" : "creation"} [${labelsFor(ticket).join(", ")}]`);
  }
  console.log("Aucune ecriture. Relancer avec --apply pour synchroniser.");
  process.exit(0);
}

runGh(["auth", "status", "--hostname", "github.com"]);
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cdidle-workboard-"));
try {
  const allLabels = new Set(tickets.flatMap(labelsFor));
  for (const label of allLabels) {
    runGh(["label", "create", label, "--repo", repository, "--color", labelColor(label), "--force"]);
  }

  for (const ticket of tickets) {
    const title = `[${ticket.id}] ${ticket.title}`;
    const body = issueBody(ticket);
    const labels = labelsFor(ticket);
    const desiredState = ticket.status === "Done" ? "closed" : "open";
    let issueUrl = ticket.metadata.github_issue;

    if (!issueUrl) {
      const bodyPath = path.join(tempRoot, `${ticket.id}.md`);
      await writeFile(bodyPath, body, "utf8");
      const output = runGh([
        "issue", "create", "--repo", repository, "--title", title,
        "--body-file", bodyPath, ...labels.flatMap((label) => ["--label", label]),
      ]);
      issueUrl = output.trim().split(/\r?\n/).at(-1);
      if (!/^https:\/\/github\.com\//.test(issueUrl)) throw new Error(`URL d'Issue invalide pour ${ticket.id}: ${issueUrl}`);
      await updateTicketField(ticket, "github_issue", issueUrl);
      console.log(`Cree ${ticket.id}: ${issueUrl}`);
    } else {
      const number = issueUrl.match(/\/issues\/(\d+)$/)?.[1];
      if (!number) throw new Error(`URL d'Issue invalide pour ${ticket.id}`);
      const payloadPath = path.join(tempRoot, `${ticket.id}.json`);
      await writeFile(payloadPath, JSON.stringify({ title, body, labels, state: desiredState }), "utf8");
      runGh(["api", `repos/${repository}/issues/${number}`, "--method", "PATCH", "--input", payloadPath]);
      console.log(`Mis a jour ${ticket.id}: ${issueUrl}`);
    }
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

const finalValidation = await validateBoard();
if (!finalValidation.ok) {
  for (const error of finalValidation.errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log("Synchronisation terminee et Workboard valide.");

function labelsFor(ticket) {
  return [
    `status:${ticket.status.toLowerCase()}`,
    `area:${slug(ticket.metadata.area)}`,
    `priority:${String(ticket.metadata.priority).toLowerCase()}`,
    `size:${String(ticket.metadata.size).toLowerCase()}`,
  ];
}

function labelColor(label) {
  if (label.startsWith("status:")) return "1f6feb";
  if (label.startsWith("priority:p0")) return "b60205";
  if (label.startsWith("priority:p1")) return "d93f0b";
  if (label.startsWith("priority:")) return "fbca04";
  if (label.startsWith("area:")) return "5319e7";
  return "bfdadc";
}

function slug(value) {
  return String(value).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function detectRepository() {
  return runGh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], false).trim();
}

function runGh(args, fail = true) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_PAGER: "cat" },
    windowsHide: true,
  });
  if (result.status !== 0 && fail) {
    throw new Error(result.stderr.trim() || `gh ${args[0]} a echoue`);
  }
  return result.stdout || "";
}
