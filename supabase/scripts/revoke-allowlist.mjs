const email = String(process.argv[2] ?? '').trim().toLowerCase();
const url = String(process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error('Usage: node supabase/scripts/revoke-allowlist.mjs email@example.com');
}
if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const response = await fetch(`${url}/rest/v1/rpc/revoke_allowlisted_email`, {
  method: 'POST',
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_email: email }),
});

if (!response.ok) {
  throw new Error(`Supabase revoke failed (${response.status}): ${await response.text()}`);
}

const changed = await response.json();
console.log(changed ? `Revoked ${email}` : `No allowlist entry changed for ${email}`);
