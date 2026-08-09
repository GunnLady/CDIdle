import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CanonicalHero } from '../../shared/contracts/authoritative';
import type { GameApplicationPorts } from '../application/gameApplicationPorts';
import type { StartingFounderChoice } from '../domain/onboardingPresentation';
import type { DispatchAuthoritativeCommand } from './useAuthoritativeCommandDispatch';
import type { GameLogChannel } from './useGameLog';
import type { BattleLogEntry } from '../types';

type AddGameLog = (
  message: string,
  type?: BattleLogEntry['type'],
  channel?: GameLogChannel,
) => void;

export interface EntryLifecycleActionDependencies {
  addLog: AddGameLog;
  canonicalPendingRecruit: CanonicalHero | null;
  dispatchAuthoritativeCommand: DispatchAuthoritativeCommand;
  pendingOnboardingCityName: string;
  ports: Pick<GameApplicationPorts, 'signInWithGoogle' | 'signOut'>;
}

export function useEntryLifecycleActions(
  dependencies: EntryLifecycleActionDependencies,
) {
  const {
    addLog,
    canonicalPendingRecruit,
    dispatchAuthoritativeCommand,
    pendingOnboardingCityName,
    ports,
  } = dependencies;
  const [pendingRecruitName, setPendingRecruitName] = useState<string | null>(null);
  const [isRecruitConfirmationPending, setIsRecruitConfirmationPending] = useState(false);

  useEffect(() => {
    setPendingRecruitName(canonicalPendingRecruit?.name ?? null);
  }, [canonicalPendingRecruit?.id, canonicalPendingRecruit?.name]);

  const pendingRecruit = useMemo(() => (
    canonicalPendingRecruit
      ? {
        ...canonicalPendingRecruit,
        name: pendingRecruitName ?? canonicalPendingRecruit.name,
      }
      : null
  ), [canonicalPendingRecruit, pendingRecruitName]);

  const handleConfirmRecruit = useCallback(() => {
    if (!pendingRecruit || isRecruitConfirmationPending) return;
    setIsRecruitConfirmationPending(true);
    void dispatchAuthoritativeCommand({
      type: 'hero.recruit_confirm',
      name: pendingRecruit.name,
    }).finally(() => setIsRecruitConfirmationPending(false));
  }, [dispatchAuthoritativeCommand, isRecruitConfirmationPending, pendingRecruit]);

  const handleCancelRecruit = useCallback(() => {
    if (isRecruitConfirmationPending) return;
    void dispatchAuthoritativeCommand({ type: 'hero.recruit_cancel' });
  }, [dispatchAuthoritativeCommand, isRecruitConfirmationPending]);

  const handleUpdatePendingName = useCallback((name: string) => {
    if (!canonicalPendingRecruit) return;
    setPendingRecruitName(name);
  }, [canonicalPendingRecruit]);

  const handleAccountAuthenticate = useCallback(async () => {
    try {
      await ports.signInWithGoogle();
      addLog('Authentification Google demandée.', 'info');
    } catch (error) {
      addLog('Échec de la demande d’authentification Google.', 'defeat');
      throw error;
    }
  }, [addLog, ports]);

  const handleRequestStartingCandidates = useCallback((name: string) => (
    dispatchAuthoritativeCommand({ type: 'onboarding.offer', cityName: name })
  ), [dispatchAuthoritativeCommand]);

  const handleConfirmStartingFounders = useCallback(async (founders: StartingFounderChoice[]) => {
    const completed = await dispatchAuthoritativeCommand({
      type: 'onboarding.start',
      cityName: pendingOnboardingCityName,
      starterHeroes: founders,
    });
    if (completed) {
      addLog(
        '🏰 Cité de ' + pendingOnboardingCityName + ' ralliée sous vos bannières !',
        'victory',
        'colony',
      );
      addLog(
        '🤝 ' + founders.map((founder) => founder.name).join(' et ')
          + ' intègrent l’escouade du domaine.',
        'victory',
        'colony',
      );
    }
    return completed;
  }, [addLog, dispatchAuthoritativeCommand, pendingOnboardingCityName]);

  const handleAccountSignOut = useCallback(async () => {
    const result = await ports.signOut();
    if (result.error) {
      addLog('Échec de la fermeture de la session.', 'defeat');
      throw result.error;
    }
    addLog('Session fermée. Cache local conservé.', 'info');
  }, [addLog, ports]);

  return {
    handleAccountAuthenticate,
    handleAccountSignOut,
    handleCancelRecruit,
    handleConfirmRecruit,
    handleConfirmStartingFounders,
    handleRequestStartingCandidates,
    handleUpdatePendingName,
    isRecruitConfirmationPending,
    pendingRecruit,
  };
}
