const baseUrl = String(process.env.GAME_API_BASE_URL ?? '').replace(/\/$/, '');
const token = process.env.GAME_API_TOKEN;
if (!baseUrl || !token) {
  console.error('GAME_API_BASE_URL and GAME_API_TOKEN are required outside the repository');
  process.exit(2);
}
const response = await fetch(`${baseUrl}/bootstrap`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
});
if (response.status !== 200) {
  console.error(`game-api smoke failed: HTTP ${response.status}`);
  process.exit(1);
}
const body = await response.json();
if (!body || typeof body.revision !== 'number' || !body.state) {
  console.error('game-api smoke failed: invalid bootstrap envelope');
  process.exit(1);
}
console.log(`game-api smoke OK: revision ${body.revision}`);
