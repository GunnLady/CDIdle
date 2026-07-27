const baseUrl = String(process.env.GAME_API_BASE_URL ?? '').replace(/\/$/, '');
const token = process.env.GAME_API_TOKEN;

if (!baseUrl || !token) {
  console.error('GAME_API_BASE_URL and GAME_API_TOKEN are required outside the repository');
  process.exit(2);
}

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
    clientVersion: 'cdi-061',
    expectedRevision: revision,
    command,
  };
}

const bootstrap = await request('/bootstrap');
if (bootstrap.status !== 200 || !Number.isInteger(bootstrap.body?.revision)) {
  throw new Error(`bootstrap failed: HTTP ${bootstrap.status}`);
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
