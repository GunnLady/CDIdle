export const ALPHA_SUPABASE_URL = 'https://tohujvjxcfarciotsnbp.supabase.co';

export function validateAlphaPublicEnv(env: Record<string, string | undefined>) {
  if (env.VITE_SUPABASE_URL !== ALPHA_SUPABASE_URL) {
    throw new Error(`alpha build requires VITE_SUPABASE_URL=${ALPHA_SUPABASE_URL}`);
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.VITE_SUPABASE_ANON_KEY ?? '')) {
    throw new Error('alpha build requires a Supabase publishable key');
  }
}
