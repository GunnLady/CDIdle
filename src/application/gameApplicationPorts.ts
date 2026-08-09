import type { CanonicalBootstrapReason } from '../domain/bootstrapPolicy';
import type {
  AuthoritativeCommandSuccess,
  AuthoritativeGameEnvelope,
  CommandEnvelope,
} from '../domain/commands';
import { requestCanonicalBootstrap } from '../lib/canonicalBootstrap';
import { deleteGameCache, purgeLegacyGameCache } from '../lib/gameCache';
import { callGameApi, signInWithGoogle, signOut } from '../lib/supabase';

export interface GameApplicationPorts {
  deleteAccount(): Promise<void>;
  deleteGameCache(userId: string): Promise<void>;
  purgeLegacyGameCache(): Promise<void>;
  requestBootstrap(reason: CanonicalBootstrapReason): Promise<AuthoritativeGameEnvelope>;
  resetGame(): Promise<AuthoritativeGameEnvelope>;
  sendCommand(envelope: CommandEnvelope): Promise<AuthoritativeCommandSuccess>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<{ error: unknown | null }>;
}

export const gameApplicationPorts: GameApplicationPorts = {
  async deleteAccount() {
    await callGameApi('/account', { method: 'DELETE' });
  },
  deleteGameCache,
  purgeLegacyGameCache,
  requestBootstrap: requestCanonicalBootstrap,
  resetGame: () => callGameApi<AuthoritativeGameEnvelope>(
    '/reset',
    { method: 'POST' },
  ),
  sendCommand: (envelope) => callGameApi<AuthoritativeCommandSuccess>(
    '/commands',
    {
      method: 'POST',
      body: JSON.stringify(envelope),
    },
  ),
  async signInWithGoogle() {
    await signInWithGoogle();
  },
  async signOut() {
    const result = await signOut();
    return { error: result.error };
  },
};
