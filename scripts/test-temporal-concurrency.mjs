import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import {
  createLocalTestToken,
  LOCAL_TEST_USER_ID,
  parseEnvironment,
  readLocalSupabaseEnvironment,
} from './local-supabase-test-runtime.mjs';

const localEnvironment = readLocalSupabaseEnvironment();
const functionEnvironment = parseEnvironment(readFileSync(
  new URL('../supabase/functions/.env', import.meta.url),
  'utf8',
));
const apiUrl = String(localEnvironment.API_URL ?? '').replace(/\/$/, '');
const jwtSecret = functionEnvironment.GAME_API_JWT_SECRET ?? localEnvironment.JWT_SECRET;
const serviceRoleKey = localEnvironment.SERVICE_ROLE_KEY;
if (!apiUrl || !jwtSecret || !serviceRoleKey) throw new Error('local Supabase API_URL, JWT_SECRET or SERVICE_ROLE_KEY is unavailable');
const hostname = new URL(apiUrl).hostname;
if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  throw new Error('test:integration refuses to run against a non-local Supabase project');
}
const baseUrl = `${apiUrl}/functions/v1/game-api`;
const expectedIssuer = functionEnvironment.GAME_API_EXPECTED_ISSUER ?? `${apiUrl}/auth/v1`;
const token = createLocalTestToken(jwtSecret, expectedIssuer);
let committedCommandCount = 0;

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

async function adminRequest(path, init = {}) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function resetGame() {
  const reset = await request('/reset');
  if (reset.status !== 200 || !Number.isInteger(reset.body?.revision)) {
    throw new Error(`reset failed: HTTP ${reset.status} ${JSON.stringify(reset.body)}`);
  }
  return reset.body;
}

async function sendCommand(revision, command) {
  const result = await request('/commands', envelope(crypto.randomUUID(), revision, command));
  if (result.status === 200 && result.body?.ok === true && result.body?.replayed === false) {
    committedCommandCount += 1;
  }
  return result;
}

async function prepareCheckpointState(checkpointFloor = 5) {
  let snapshot = await resetGame();
  const offered = await sendCommand(snapshot.revision, {
    type: 'onboarding.offer',
    cityName: 'Cité intégration jalon',
  });
  if (offered.status !== 200 || offered.body?.ok !== true) {
    throw new Error(`checkpoint onboarding offer failed: ${JSON.stringify(offered)}`);
  }
  const candidates = offered.body.state?.onboardingCandidates;
  if (!Array.isArray(candidates) || candidates.length < 2) {
    throw new Error('checkpoint onboarding candidates are unavailable');
  }
  const started = await sendCommand(offered.body.revision, {
    type: 'onboarding.start',
    cityName: 'Cité intégration jalon',
    starterHeroes: candidates.slice(0, 2).map((hero, index) => ({
      id: hero.id,
      name: `Jalon ${index + 1}`,
    })),
  });
  if (started.status !== 200 || started.body?.ok !== true) {
    throw new Error(`checkpoint onboarding start failed: ${JSON.stringify(started)}`);
  }
  snapshot = started.body;
  const state = structuredClone(snapshot.state);
  state.heroes = state.heroes.map((hero) => ({ ...hero, isActive: true, status: 'idle' }));
  const heroIds = state.heroes.map((hero) => hero.id);
  for (const heroId of heroIds) {
    state.dungeonProgress.heroes[heroId] = {
      ...(state.dungeonProgress.heroes[heroId] ?? { fixedVictoryIds: [] }),
      completedFloor: checkpointFloor,
    };
  }
  const nextFloor = Math.min(50, checkpointFloor + 1);
  state.highestFloorReached = Math.max(state.highestFloorReached, nextFloor);
  state.activeDungeonFloor = nextFloor;
  state.activeDungeonRoom = 1;
  state.currentEncounter = null;
  state.autoExplore = false;
  state.encounterHistory = [
    {
      encounterId: `legacy-record-${checkpointFloor}`,
      dungeonId: 'undercity',
      kind: 'rest',
      floor: checkpointFloor,
      room: 1,
      outcome: 'victory',
      roundCount: 0,
      enemy: null,
      transcript: [],
      rewards: { gold: 0, loot: [] },
    },
    {
      encounterId: `structured-trace-${checkpointFloor}`,
      dungeonId: 'undercity',
      kind: 'fight',
      floor: checkpointFloor,
      room: 2,
      outcome: 'victory',
      roundCount: 1,
      enemy: { id: 'trace-enemy', name: 'Rat témoin', hp: 0, maxHp: 10 },
      enemies: [{ id: 'trace-enemy', name: 'Rat témoin', hp: 0, maxHp: 10 }],
      transcript: [{
        sequence: 0,
        type: 'hero.skill.damage',
        heroId: heroIds[0],
        monsterId: 'trace-enemy',
        damage: 10,
        enemyHp: 0,
        enemyMaxHp: 10,
        sourceMana: [10, 4, 10],
        targets: ['e', 0],
        hitResults: [{ hit: 1, critical: false, damage: 10 }],
      }],
      rewards: { gold: 0, loot: [] },
    },
  ];
  state.dungeonProgress.expedition = {
    ...state.dungeonProgress.expedition,
    mode: 'progression',
    zoneId: null,
    floor: nextFloor,
    room: 1,
    halted: false,
    haltReason: null,
    phase: 'checkpoint_decision',
    segmentHeroIds: heroIds,
    knockedOutHeroIds: [],
    checkpointFloor,
    autoExploreBeforeCheckpoint: true,
  };
  const persisted = await adminRequest('rpc/reset_game', {
    method: 'POST',
    body: JSON.stringify({ p_user_id: LOCAL_TEST_USER_ID, p_state: state }),
  });
  if (persisted.status !== 200) {
    throw new Error(`checkpoint fixture persistence failed: HTTP ${persisted.status} ${JSON.stringify(persisted.body)}`);
  }
  const prepared = await request('/bootstrap');
  if (prepared.status !== 200 || !Number.isInteger(prepared.body?.revision)) {
    throw new Error(`checkpoint fixture bootstrap failed: HTTP ${prepared.status} ${JSON.stringify(prepared.body)}`);
  }
  const legacyRecord = prepared.body.state?.encounterHistory?.[0];
  if (legacyRecord?.encounterId !== `legacy-record-${checkpointFloor}` || legacyRecord.initialActors !== undefined) {
    throw new Error(`legacy encounter compatibility failed: ${JSON.stringify(legacyRecord)}`);
  }
  return { revision: prepared.body.revision, state: prepared.body.state };
}

const checkpoint = await prepareCheckpointState(5);
const checkpointCommandId = crypto.randomUUID();
const checkpointPayload = envelope(
  checkpointCommandId,
  checkpoint.revision,
  { type: 'dungeon.checkpoint_decide', decision: 'continue' },
);
const firstCheckpointDecision = await request('/commands', checkpointPayload);
const replayedCheckpointDecision = await request('/commands', checkpointPayload);
const replayedStructuredTrace = replayedCheckpointDecision.body?.state?.encounterHistory
  ?.find((record) => record.encounterId === 'structured-trace-5')
  ?.transcript?.[0];
if (firstCheckpointDecision.status !== 200 || firstCheckpointDecision.body?.replayed !== false
  || replayedCheckpointDecision.status !== 200 || replayedCheckpointDecision.body?.replayed !== true
  || firstCheckpointDecision.body?.revision !== replayedCheckpointDecision.body?.revision
  || replayedCheckpointDecision.body?.state?.dungeonProgress?.expedition?.floor !== 6
  || !isDeepStrictEqual(replayedStructuredTrace?.sourceMana, [10, 4, 10])
  || !isDeepStrictEqual(replayedStructuredTrace?.targets, ['e', 0])
  || !isDeepStrictEqual(replayedStructuredTrace?.hitResults, [{ hit: 1, critical: false, damage: 10 }])) {
  throw new Error(`checkpoint replay failed: ${JSON.stringify([firstCheckpointDecision, replayedCheckpointDecision])}`);
}
committedCommandCount += 1;
const persistedCheckpointCommands = await adminRequest(
  `game_commands?select=command_id&user_id=eq.${LOCAL_TEST_USER_ID}&command_id=eq.${checkpointCommandId}`,
  { method: 'GET' },
);
if (persistedCheckpointCommands.status !== 200 || persistedCheckpointCommands.body?.length !== 1) {
  throw new Error(`checkpoint replay persisted more than once: ${JSON.stringify(persistedCheckpointCommands)}`);
}

const actorCommandId = crypto.randomUUID();
const actorPayload = envelope(
  actorCommandId,
  replayedCheckpointDecision.body.revision,
  { type: 'dungeon.auto_advance', floor: 6 },
);
const firstActorEncounter = await request('/commands', actorPayload);
const replayedActorEncounter = await request('/commands', actorPayload);
const actorRecord = firstActorEncounter.body?.state?.encounterHistory?.at(-1);
const actorEvent = firstActorEncounter.body?.events
  ?.find((event) => event.type === 'dungeon.encounter_resolved');
if (firstActorEncounter.status !== 200 || firstActorEncounter.body?.replayed !== false
  || replayedActorEncounter.status !== 200 || replayedActorEncounter.body?.replayed !== true
  || firstActorEncounter.body?.revision !== replayedActorEncounter.body?.revision
  || actorRecord?.initialActors?.v !== 1
  || actorRecord.initialActors.h?.length !== 2
  || actorEvent?.encounterId !== actorRecord.encounterId
  || Object.hasOwn(actorEvent ?? {}, 'encounter')
  || !isDeepStrictEqual(
    replayedActorEncounter.body?.state?.encounterHistory?.at(-1)?.initialActors,
    actorRecord.initialActors,
  )) {
  throw new Error(`initial actor replay failed: ${JSON.stringify([firstActorEncounter, replayedActorEncounter])}`);
}
committedCommandCount += 1;
const persistedActors = await request('/bootstrap');
const persistedStructuredTrace = persistedActors.body?.state?.encounterHistory
  ?.find((record) => record.encounterId === 'structured-trace-5')
  ?.transcript?.[0];
if (persistedActors.status !== 200
  || !isDeepStrictEqual(
    persistedActors.body?.state?.encounterHistory?.at(-1)?.initialActors,
    actorRecord.initialActors,
  )
  || !isDeepStrictEqual(persistedStructuredTrace?.sourceMana, [10, 4, 10])
  || !isDeepStrictEqual(persistedStructuredTrace?.targets, ['e', 0])
  || !isDeepStrictEqual(persistedStructuredTrace?.hitResults, [{ hit: 1, critical: false, damage: 10 }])) {
  throw new Error(`initial actor persistence/bootstrap failed: ${JSON.stringify(persistedActors)}`);
}
const persistedActorCommands = await adminRequest(
  `game_commands?select=command_id&user_id=eq.${LOCAL_TEST_USER_ID}&command_id=eq.${actorCommandId}`,
  { method: 'GET' },
);
if (persistedActorCommands.status !== 200 || persistedActorCommands.body?.length !== 1) {
  throw new Error(`initial actor command persisted more than once: ${JSON.stringify(persistedActorCommands)}`);
}

const competingCheckpoint = await prepareCheckpointState(10);
const competingCheckpointResults = await Promise.all([
  request('/commands', envelope(crypto.randomUUID(), competingCheckpoint.revision, {
    type: 'dungeon.checkpoint_decide', decision: 'continue',
  })),
  request('/commands', envelope(crypto.randomUUID(), competingCheckpoint.revision, {
    type: 'dungeon.checkpoint_decide', decision: 'return_to_town',
  })),
]);
const checkpointWinners = competingCheckpointResults.filter(
  (result) => result.status === 200 && result.body?.ok === true,
);
const checkpointConflicts = competingCheckpointResults.filter(
  (result) => result.status === 409 && result.body?.error?.code === 'REVISION_CONFLICT',
);
if (checkpointWinners.length !== 1 || checkpointConflicts.length !== 1) {
  throw new Error(`checkpoint decision concurrency failed: ${JSON.stringify(competingCheckpointResults)}`);
}
committedCommandCount += checkpointWinners.length;

await resetGame();

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
committedCommandCount += committedDuplicates.length;

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
committedCommandCount += winners.length;

let rateRevision = (await request('/bootstrap')).body?.revision;
if (!Number.isInteger(rateRevision)) throw new Error('rate-limit bootstrap failed');
const commandsBeforeBoundary = 59 - committedCommandCount;
if (commandsBeforeBoundary < 0) throw new Error(`rate-limit setup already committed ${committedCommandCount} commands`);
for (let index = 0; index < commandsBeforeBoundary; index += 1) {
  const result = await request('/commands', envelope(crypto.randomUUID(), rateRevision, {
    type: 'dungeon.auto_explore', enabled: false,
  }));
  if (result.status !== 200 || result.body?.ok !== true) {
    throw new Error(`rate-limit preparation failed at ${index + 1}: ${JSON.stringify(result)}`);
  }
  rateRevision = result.body.revision;
  committedCommandCount += 1;
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

console.log('Temporal concurrency OK: checkpoint replay/race, duplicate, snapshot race and concurrent 60/min boundary.');
