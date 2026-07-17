import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STATUSES = ["ToDo", "Doing", "Later", "Paused", "Done"];
export const REQUIRED_FIELDS = [
  "id",
  "title",
  "status",
  "area",
  "priority",
  "size",
  "risk",
  "source",
  "depends_on",
  "blocks",
  "github_issue",
  "related_docs",
];
export const REQUIRED_SECTIONS = [
  "Objectif",
  "Resultat utilisateur",
  "Contexte",
  "Perimetre autorise",
  "Hors perimetre",
  "Contrat d'implementation",
  "Dependances",
  "Criteres d'acceptation",
  "Tests",
  "Validation manuelle",
  "Preservation",
  "Risques",
  "Handoff",
];

const libDir = path.dirname(fileURLToPath(import.meta.url));
export const workboardRoot = path.resolve(libDir, "..");
export const dataRoot = path.join(workboardRoot, "data");

export async function ensureColumns() {
  await fs.mkdir(dataRoot, { recursive: true });
  await Promise.all(STATUSES.map((status) => fs.mkdir(path.join(dataRoot, status), { recursive: true })));
}

export function parseTicket(markdown, status, folder) {
  const frontmatterMatch = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!frontmatterMatch) {
    return { markdown, status, folder, metadata: {}, sections: {}, parseError: "frontmatter manquant" };
  }

  const metadata = {};
  for (const line of frontmatterMatch[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    metadata[key] = parseScalar(line.slice(separator + 1).trim());
  }

  const sections = {};
  for (const section of REQUIRED_SECTIONS) {
    sections[section] = readSection(markdown, section);
  }

  return {
    id: String(metadata.id ?? folder),
    title: String(metadata.title ?? readHeading(markdown) ?? folder),
    status,
    folder,
    metadata,
    sections,
    markdown,
    relativePath: path.posix.join("workboard", "data", status, folder, "ticket.md"),
  };
}

export async function loadBoard() {
  await ensureColumns();
  const columns = [];
  for (const status of STATUSES) {
    const statusPath = path.join(dataRoot, status);
    const entries = await fs.readdir(statusPath, { withFileTypes: true });
    const tickets = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const ticketPath = path.join(statusPath, entry.name, "ticket.md");
      try {
        const markdown = await fs.readFile(ticketPath, "utf8");
        tickets.push(parseTicket(markdown, status, entry.name));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    tickets.sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }));
    columns.push({ name: status, tickets });
  }
  return columns;
}

export async function findTicket(id) {
  const columns = await loadBoard();
  for (const column of columns) {
    const ticket = column.tickets.find((candidate) => candidate.id === id || candidate.folder === id);
    if (ticket) return ticket;
  }
  return null;
}

export async function validateBoard() {
  const columns = await loadBoard();
  const tickets = columns.flatMap((column) => column.tickets);
  const errors = [];
  const warnings = [];
  const byId = new Map();

  for (const ticket of tickets) {
    if (byId.has(ticket.id)) errors.push(`${ticket.id}: identifiant duplique`);
    byId.set(ticket.id, ticket);
    errors.push(...validateTicket(ticket));
  }

  for (const ticket of tickets) {
    const dependencies = arrayField(ticket, "depends_on", errors);
    const blocks = arrayField(ticket, "blocks", errors);
    for (const dependencyId of dependencies) {
      const dependency = byId.get(dependencyId);
      if (!dependency) {
        errors.push(`${ticket.id}: dependance inconnue ${dependencyId}`);
        continue;
      }
      if (dependencyId === ticket.id) errors.push(`${ticket.id}: auto-dependance interdite`);
      const reverseBlocks = Array.isArray(dependency.metadata.blocks) ? dependency.metadata.blocks : [];
      if (!reverseBlocks.includes(ticket.id)) {
        errors.push(`${ticket.id}: ${dependencyId}.blocks doit contenir ${ticket.id}`);
      }
      if (["ToDo", "Doing"].includes(ticket.status) && dependency.status !== "Done") {
        errors.push(`${ticket.id}: ${dependencyId} doit etre Done avant ${ticket.status}`);
      }
    }
    for (const blockedId of blocks) {
      const blocked = byId.get(blockedId);
      if (!blocked) {
        errors.push(`${ticket.id}: ticket bloque inconnu ${blockedId}`);
        continue;
      }
      const blockedDependencies = Array.isArray(blocked.metadata.depends_on) ? blocked.metadata.depends_on : [];
      if (!blockedDependencies.includes(ticket.id)) {
        errors.push(`${ticket.id}: ${blockedId}.depends_on doit contenir ${ticket.id}`);
      }
    }
  }

  detectCycles(tickets, byId, errors);
  const doingCount = columns.find((column) => column.name === "Doing")?.tickets.length ?? 0;
  if (doingCount > 3) errors.push(`Doing: limite WIP depassee (${doingCount}/3)`);
  if (tickets.length === 0) warnings.push("Le Workboard ne contient aucun ticket.");

  return { ok: errors.length === 0, errors, warnings, ticketCount: tickets.length, columns };
}

export async function saveTicketMarkdown(id, markdown) {
  if (typeof markdown !== "string") throw boardError(400, "markdown doit etre une chaine");
  const current = await findTicket(id);
  if (!current) throw boardError(404, `Ticket introuvable: ${id}`);
  const normalized = normalizeStatus(markdown, current.status);
  const parsed = parseTicket(normalized, current.status, current.folder);
  if (parsed.id !== current.id) throw boardError(400, "L'identifiant du ticket ne peut pas etre modifie");

  const ticketPath = absoluteTicketPath(current);
  const previous = await fs.readFile(ticketPath, "utf8");
  await fs.writeFile(ticketPath, normalized, "utf8");
  const validation = await validateBoard();
  if (!validation.ok) {
    await fs.writeFile(ticketPath, previous, "utf8");
    throw boardError(400, validation.errors.join("\n"));
  }
  return findTicket(id);
}

export async function createTicket(input) {
  const markdown = typeof input === "string" ? input : structuredTicketMarkdown(input);
  const preview = parseTicket(markdown, "Later", "preview");
  const id = preview.metadata.id;
  const status = preview.metadata.status;
  if (!/^CDI-\d{3}$/.test(String(id ?? ""))) throw boardError(400, "id doit respecter CDI-###");
  if (!STATUSES.includes(status)) throw boardError(400, "status invalide");
  if (await findTicket(id)) throw boardError(409, `Ticket deja present: ${id}`);

  const folderPath = safeFolder(status, id);
  await fs.mkdir(folderPath, { recursive: false });
  await fs.writeFile(path.join(folderPath, "ticket.md"), normalizeStatus(markdown, status), "utf8");
  const validation = await validateBoard();
  if (!validation.ok) {
    await fs.rm(folderPath, { recursive: true, force: true });
    throw boardError(400, validation.errors.join("\n"));
  }
  return findTicket(id);
}

function structuredTicketMarkdown(ticket) {
  if (!ticket || typeof ticket !== "object") throw boardError(400, "ticket doit etre un objet ou un markdown");
  const required = ["id", "title", "status", "area", "priority", "size", "risk", "source"];
  const missing = required.filter((field) => !String(ticket[field] ?? "").trim());
  if (missing.length) throw boardError(400, `champs manquants: ${missing.join(", ")}`);
  const list = (value) => Array.isArray(value) ? value : [];
  const sections = ticket.sections && typeof ticket.sections === "object" ? ticket.sections : {};
  const defaults = {
    "Objectif": "A definir.",
    "Resultat utilisateur": "A definir.",
    "Contexte": "A definir.",
    "Perimetre autorise": "- A definir.",
    "Hors perimetre": "- A definir.",
    "Contrat d'implementation": "- A definir.",
    "Dependances": list(ticket.depends_on).length ? list(ticket.depends_on).map((id) => `- ${id}`).join("\\n") : "Aucune.",
    "Criteres d'acceptation": "- [ ] A definir.",
    "Tests": "- npm test -- --run\\n- npm run board:validate",
    "Validation manuelle": "A definir.",
    "Preservation": "- A definir.",
    "Risques": "- A definir.",
    "Handoff": "Fournir les fichiers modifies, les commandes executees et leurs resultats.",
  };
  const metadata = [
    ["id", ticket.id], ["title", ticket.title], ["status", ticket.status],
    ["area", ticket.area], ["priority", ticket.priority], ["size", ticket.size],
    ["risk", ticket.risk], ["source", ticket.source],
    ["depends_on", list(ticket.depends_on)], ["blocks", list(ticket.blocks)],
    ["github_issue", ticket.github_issue ?? null], ["related_docs", list(ticket.related_docs)],
  ];
  const scalar = (value) => typeof value === "string" ? value.replace(/\n/g, " ") : JSON.stringify(value);
  const frontmatter = metadata.map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : scalar(value)}`).join("\\n");
  const body = REQUIRED_SECTIONS.map((name) => `## ${name}\\n\\n${String(sections[name] ?? defaults[name]).trim()}`).join("\\n\\n");
  return `---\\n${frontmatter}\\n---\\n\\n# ${ticket.id} — ${ticket.title}\\n\\n${body}\\n`;
}

export async function moveTicket(id, targetStatus) {
  if (!STATUSES.includes(targetStatus)) throw boardError(400, "status cible invalide");
  const current = await findTicket(id);
  if (!current) throw boardError(404, `Ticket introuvable: ${id}`);
  if (current.status === targetStatus) return current;

  const sourcePath = safeFolder(current.status, current.folder);
  const targetPath = safeFolder(targetStatus, current.folder);
  const ticketPath = path.join(sourcePath, "ticket.md");
  const previous = await fs.readFile(ticketPath, "utf8");
  await fs.rename(sourcePath, targetPath);
  await fs.writeFile(path.join(targetPath, "ticket.md"), normalizeStatus(previous, targetStatus), "utf8");
  const validation = await validateBoard();
  if (!validation.ok) {
    await fs.writeFile(path.join(targetPath, "ticket.md"), previous, "utf8");
    await fs.rename(targetPath, sourcePath);
    throw boardError(400, validation.errors.join("\n"));
  }
  return findTicket(id);
}

export async function deleteTicket(id) {
  const current = await findTicket(id);
  if (!current) throw boardError(404, `Ticket introuvable: ${id}`);
  const columns = await loadBoard();
  const dependent = columns.flatMap((column) => column.tickets).find((ticket) =>
    Array.isArray(ticket.metadata.depends_on) && ticket.metadata.depends_on.includes(current.id));
  if (dependent) throw boardError(409, `${current.id} est requis par ${dependent.id}`);
  await fs.rm(safeFolder(current.status, current.folder), { recursive: true, force: false });
  return current;
}

export async function updateTicketField(ticket, field, value) {
  const ticketPath = absoluteTicketPath(ticket);
  const markdown = await fs.readFile(ticketPath, "utf8");
  const serialized = serializeScalar(value);
  const pattern = new RegExp(`^${escapeRegExp(field)}:\\s*.*$`, "m");
  if (!pattern.test(markdown)) throw boardError(400, `Champ absent: ${field}`);
  await fs.writeFile(ticketPath, markdown.replace(pattern, `${field}: ${serialized}`), "utf8");
}

export function issueBody(ticket) {
  const content = ticket.markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, "").trim();
  return `> Source de verite: \`${ticket.relativePath}\`\n\n${content}`;
}

function validateTicket(ticket) {
  const errors = [];
  if (ticket.parseError) return [`${ticket.folder}: ${ticket.parseError}`];
  for (const field of REQUIRED_FIELDS) {
    if (!(field in ticket.metadata)) errors.push(`${ticket.id}: champ manquant ${field}`);
  }
  if (!/^CDI-\d{3}$/.test(ticket.id)) errors.push(`${ticket.id}: format d'identifiant invalide`);
  if (ticket.folder !== ticket.id) errors.push(`${ticket.id}: le dossier doit porter exactement l'identifiant`);
  if (ticket.metadata.status !== ticket.status) errors.push(`${ticket.id}: status ne correspond pas au dossier ${ticket.status}`);
  if (!STATUSES.includes(ticket.metadata.status)) errors.push(`${ticket.id}: status invalide`);
  if (!String(ticket.metadata.title ?? "").trim()) errors.push(`${ticket.id}: titre vide`);
  if (!String(ticket.metadata.area ?? "").trim()) errors.push(`${ticket.id}: area vide`);
  if (!String(ticket.metadata.source ?? "").trim()) errors.push(`${ticket.id}: source vide`);
  if (!["P0", "P1", "P2", "P3"].includes(ticket.metadata.priority)) errors.push(`${ticket.id}: priority invalide`);
  if (!["S", "M", "L"].includes(ticket.metadata.size)) errors.push(`${ticket.id}: size invalide`);
  if (!["low", "medium", "high"].includes(ticket.metadata.risk)) errors.push(`${ticket.id}: risk invalide`);
  for (const field of ["depends_on", "blocks", "related_docs"]) arrayField(ticket, field, errors);
  const issue = ticket.metadata.github_issue;
  if (issue !== null && !/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(String(issue))) {
    errors.push(`${ticket.id}: github_issue doit etre null ou une URL d'Issue GitHub`);
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!ticket.sections[section]?.trim()) errors.push(`${ticket.id}: section vide ou absente ${section}`);
  }
  return errors;
}

function detectCycles(tickets, byId, errors) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(ticket) {
    if (visiting.has(ticket.id)) {
      const start = stack.indexOf(ticket.id);
      errors.push(`Cycle de dependances: ${[...stack.slice(start), ticket.id].join(" -> ")}`);
      return;
    }
    if (visited.has(ticket.id)) return;
    visiting.add(ticket.id);
    stack.push(ticket.id);
    const dependencies = Array.isArray(ticket.metadata.depends_on) ? ticket.metadata.depends_on : [];
    for (const id of dependencies) {
      const dependency = byId.get(id);
      if (dependency) visit(dependency);
    }
    stack.pop();
    visiting.delete(ticket.id);
    visited.add(ticket.id);
  }
  for (const ticket of tickets) visit(ticket);
}

function arrayField(ticket, field, errors) {
  const value = ticket.metadata[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    errors.push(`${ticket.id}: ${field} doit etre un tableau JSON de chaines`);
    return [];
  }
  return value;
}

function readHeading(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function readSection(markdown, heading) {
  const pattern = new RegExp(`(?:^|\\r?\\n)##\\s+${escapeRegExp(heading)}\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n##\\s+|\\s*$)`);
  return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function parseScalar(raw) {
  if (raw === "null" || raw === "~") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

function serializeScalar(value) {
  if (value === null) return "null";
  if (Array.isArray(value) || typeof value === "string" && /[:#\[\]"]/.test(value)) return JSON.stringify(value);
  return String(value);
}

function normalizeStatus(markdown, status) {
  return markdown.replace(/^status:\s*.*$/m, `status: ${status}`);
}

function safeFolder(status, folder) {
  if (!STATUSES.includes(status) || !/^CDI-\d{3}$/.test(folder)) throw boardError(400, "Chemin de ticket invalide");
  const statusRoot = path.resolve(dataRoot, status);
  const folderPath = path.resolve(statusRoot, folder);
  if (!folderPath.startsWith(`${statusRoot}${path.sep}`)) throw boardError(400, "Chemin hors Workboard");
  return folderPath;
}

function absoluteTicketPath(ticket) {
  return path.join(safeFolder(ticket.status, ticket.folder), "ticket.md");
}

function boardError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
