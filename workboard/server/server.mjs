import http from "node:http";
import { promises as fs, readFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import {
  createTicket,
  deleteTicket,
  findTicket,
  loadBoard,
  moveTicket,
  previewTicket,
  saveTicketMarkdown,
  validateBoard,
  workboardRoot,
} from "../lib/board.mjs";

const port = Number(process.argv[2] || process.env.PORT || 4173);
const config = JSON.parse(readFileSync(path.join(workboardRoot, "config.json"), "utf8"));
const localStatePath = path.resolve(workboardRoot, "..", ".workboard.local.json");
const instanceId = crypto.randomUUID();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      await sendFile(response, path.join(workboardRoot, "index.html"), "text/html; charset=utf-8");
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/board") {
      const [columns, validation] = await Promise.all([loadBoard(), validateBoard()]);
      sendJson(response, { columns, validation: publicValidation(validation) });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/validate") {
      sendJson(response, publicValidation(await validateBoard()));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/tickets") {
      const body = await readJsonBody(request);
      sendJson(response, { ticket: await createTicket(body.markdown ?? body.ticket ?? body) }, 201);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/tickets/preview") {
      const body = await readJsonBody(request);
      const preview = await previewTicket(body.markdown ?? body.ticket ?? body);
      sendJson(response, { preview });
      return;
    }
    const ticketMatch = url.pathname.match(/^\/api\/tickets\/([^/]+)$/);
    if (request.method === "GET" && ticketMatch) {
      const ticket = await findTicket(decodeURIComponent(ticketMatch[1]));
      if (!ticket) throw httpError(404, "Ticket introuvable");
      sendJson(response, { ticket });
      return;
    }
    if (request.method === "PUT" && ticketMatch) {
      const body = await readJsonBody(request);
      sendJson(response, { ticket: await saveTicketMarkdown(decodeURIComponent(ticketMatch[1]), body.markdown) });
      return;
    }
    if (request.method === "DELETE" && ticketMatch) {
      sendJson(response, { ticket: await deleteTicket(decodeURIComponent(ticketMatch[1])) });
      return;
    }
    const moveMatch = url.pathname.match(/^\/api\/tickets\/([^/]+)\/move$/);
    if (request.method === "POST" && moveMatch) {
      const body = await readJsonBody(request);
      sendJson(response, { ticket: await moveTicket(decodeURIComponent(moveMatch[1]), body.status) });
      return;
    }
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, { ok: true, projectId: config.projectId, instanceId, pid: process.pid, port });
      return;
    }
    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    sendJson(response, { error: error.message }, Number.isInteger(error.status) ? error.status : 500);
  }
});

server.listen(port, "127.0.0.1", async () => {
  await fs.writeFile(localStatePath, JSON.stringify({ projectId: config.projectId, instanceId, pid: process.pid, port }, null, 2) + "\n", "utf8");
  console.log(`CDIdle Workboard: http://127.0.0.1:${port}/`);
});

function publicValidation(validation) {
  const { columns: _columns, ...result } = validation;
  return result;
}

async function sendFile(response, filePath, contentType) {
  const content = await fs.readFile(filePath);
  response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
  response.end(content);
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 256 * 1024) {
        reject(httpError(413, "Corps de requete trop volumineux"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(httpError(400, "JSON invalide")); }
    });
    request.on("error", reject);
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
