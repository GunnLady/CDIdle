import {describe, expect, it} from 'vitest';
import {ALPHA_SUPABASE_URL, validateAlphaPublicEnv} from '../scripts/alpha-public-env';

describe('alpha build configuration', () => {
  it('accepts the expected remote project and a publishable key', () => {
    expect(() => validateAlphaPublicEnv({
      VITE_SUPABASE_URL: ALPHA_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_alpha-test_123',
    })).not.toThrow();
  });

  it('rejects another Supabase project', () => {
    expect(() => validateAlphaPublicEnv({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_alpha-test_123',
    })).toThrow(/VITE_SUPABASE_URL/);
  });

  it('rejects legacy and privileged keys', () => {
    expect(() => validateAlphaPublicEnv({
      VITE_SUPABASE_URL: ALPHA_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: 'legacy-anon-key',
    })).toThrow(/publishable key/);
    expect(() => validateAlphaPublicEnv({
      VITE_SUPABASE_URL: ALPHA_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: 'sb_secret_forbidden',
    })).toThrow(/publishable key/);
  });
});
