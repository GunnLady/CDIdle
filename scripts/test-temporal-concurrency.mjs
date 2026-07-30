import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TEST_USER_ID = '46464646-4646-4646-8646-464646464646';

function parseEnvironment(output) {
  return Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z0-9_]+)=(?:"(.*)"|'(.*)'|(.*))$/.exec(line.trim());
    return match ? [[match[1], match[2] ?? match[3] ?? match[4] ?? '']] : [];
  }));
}

function readLocalSupabaseEnvironment() {
  let output;
  try {
    const executable = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
    const args = process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npm.cmd exec --offline -- supabase status -o env']
      : ['exec', '--offline', '--', 'supabase', 'status', '-o', 'env'];
    output = execFileSync(executable, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error('local Supabase status unavailable; start Supabase before running test:integration');
  }
  return parseEnvironment(output);
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function createLocalTestToken(jwtSecret, expectedIssuer) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: TEST_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    iss: expectedIssuer,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
  }));
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const localEnvironment = readLocalSupabaseEnvironment();
const functionEnvironment = parseEnvironment(readFileSync(
  new URL('../supabase/functions/.env', import.meta.url),
  'utf8',
));
const apiUrl = String(localEnvironment.API_URL ?? '').replace(/\/$/, '');
const jwtSecret = functionEnvironment.GAME_API_JWT_SECRET ?? localEnvironment.JWT_SECRET;
if (!apiUrl || !jwtSecret) throw new Error('local Supabase API_URL or JWT_SECRET is unavailable');
const hostname = new URL(apiUrl).hostname;
if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  throw new Error('test:integration refuses to run against a non-local Supabase project');
}
const baseUrl = `${apiUrl}/functions/v1/game-api`;
const expectedIssuer = functionEnvironment.GAME_API_EXPECTED_ISSUER ?? `${apiUrl}/auth/v1`;
const token = createLocalTestToken(jwtSecret, expectedIssuer);

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

function envelope(commandId, revision, command) {
  return {
    commandId,
    idempotencyKey: commandId,
    clientVersion: 'integration-local',
    expectedRevision: revision,
    command,
  };
}

const bootstrap = await request('/bootstrap');
if (bootstrap.status !== 200 || !Number.isInteger(bootstrap.body?.revision)) {
  throw new Error(`bootstrap failed: HTTP ${bootstrap.status} ${JSON.stringify(bootstrap.body)}`);
}

const duplicateId = crypto.randomUUID();
const duplicatePayload = envelope(
  duplicateId,
  bootstrap.body.revision,
  { type: 'dungeon.auto_explore', enabled: false },
);
const duplicateResults = await Promise.all([
  request('/commands', duplicatePayload),
  request('/commands', duplicatePayload),
]);
const committedDuplicates = duplicateResults.filter(
  (result) => result.status === 200 && result.body?.ok === true && result.body?.replayed === false,
);
const safelyDeduplicated = duplicateResults.filter(
  (result) => (result.status === 200 && result.body?.replayed === true)
    || (result.status === 409 && result.body?.error?.code === 'COMMAND_IN_PROGRESS'),
);
if (committedDuplicates.length !== 1 || safelyDeduplicated.length !== 1) {
  throw new Error(`duplicate concurrency failed: ${JSON.stringify(duplicateResults)}`);
}

const refreshed = await request('/bootstrap');
if (refreshed.status !== 200 || !Number.isInteger(refreshed.body?.revision)) {
  throw new Error(`refresh failed: HTTP ${refreshed.status}`);
}

const competingResults = await Promise.all([
  request('/commands', envelope(crypto.randomUUID(), refreshed.body.revision, {
    type: 'dungeon.auto_explore', enabled: false,
  })),
  request('/commands', envelope(crypto.randomUUID(), refreshed.body.revision, {
    type: 'dungeon.auto_explore', enabled: false,
  })),
]);
const winners = competingResults.filter((result) => result.status === 200 && result.body?.ok === true);
const conflicts = competingResults.filter(
  (result) => result.status === 409 && result.body?.error?.code === 'REVISION_CONFLICT',
);
if (winners.length !== 1 || conflicts.length !== 1) {
  throw new Error(`snapshot concurrency failed: ${JSON.stringify(competingResults)}`);
}

let rateRevision = (await request('/bootstrap')).body?.revision;
if (!Number.isInteger(rateRevision)) throw new Error('rate-limit bootstrap failed');
for (let index = 0; index < 57; index += 1) {
  const result = await request('/commands', envelope(crypto.randomUUID(), rateRevision, {
    type: 'dungeon.auto_explore', enabled: false,
  }));
  if (result.status !== 200 || result.body?.ok !== true) {
    throw new Error(`rate-limit preparation failed at ${index + 1}: ${JSON.stringify(result)}`);
  }
  rateRevision = result.body.revision;
}

const boundaryResults = await Promise.all([
  request('/commands', envelope(crypto.randomUUID(), rateRevision, {
    type: 'dungeon.auto_explore', enabled: false,
  })),
  request('/commands', envelope(crypto.randomUUID(), rateRevision, {
    type: 'dungeon.auto_explore', enabled: false,
  })),
]);
const boundaryWinners = boundaryResults.filter(
  (result) => result.status === 200 && result.body?.ok === true,
);
const rateLimited = boundaryResults.filter(
  (result) => result.status === 429 && result.body?.error?.code === 'RATE_LIMITED',
);
if (boundaryWinners.length !== 1 || rateLimited.length !== 1) {
  throw new Error(`concurrent rate-limit failed: ${JSON.stringify(boundaryResults)}`);
}

console.log('Temporal concurrency OK: duplicate, snapshot race and concurrent 60/min boundary.');
