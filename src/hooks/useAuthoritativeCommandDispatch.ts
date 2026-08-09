import { useCallback, useRef, type MutableRefObject } from "react";
import type { CanonicalGameState, CanonicalDungeonEncounterRecord } from "../../shared/contracts/authoritative";
import type { GameApplicationPorts } from "../application/gameApplicationPorts";
import type { BattleLogEntry } from "../types";
import type { CanonicalStateFailure } from "../domain/canonicalStateFailure";
import { createCommandEnvelope } from "../domain/commandEnvelope";
import type {
  AuthoritativeCommandSuccess,
  AuthoritativeGameEnvelope,
  GameCommand,
} from "../domain/commands";
import { formatCanonicalTownEvent } from "../domain/townEventLog";
import {
  applyAuthoritativeCommandSuccess,
  getAuthoritativeFailurePresentation,
  type AuthoritativeDispatchOptions,
} from "../lib/authoritativeCommandDispatch";
import type {
  CanonicalOperationContext,
  CanonicalOperationQueue,
} from "../lib/canonicalOperationQueue";
import { shouldRetryOptimisticConflict } from "../lib/optimisticCommandBuffer";
import {
  canonicalStateFailure,
  GameApiError,
} from "../lib/supabase";
import type { GameLogChannel } from "./useGameLog";

type AddGameLog = (
  message: string,
  type?: BattleLogEntry["type"],
  channel?: GameLogChannel,
) => void;

type AuthoritativeSnapshotEnvelope = {
  revision: number;
  state: CanonicalGameState;
  serverTime: string;
  lastProcessedAt: string;
};

type CommandRunResult = {
  ok: boolean;
  playback?: Promise<void>;
};

export type DispatchAuthoritativeCommand = (
  command: GameCommand,
  options?: AuthoritativeDispatchOptions,
) => Promise<boolean>;

export interface AuthoritativeCommandDispatchDependencies {
  addLog: AddGameLog;
  applyAuthoritativeState(
    state: CanonicalGameState,
    revision?: number,
    cacheUserId?: string,
    serverTime?: unknown,
    lastProcessedAt?: unknown,
  ): Promise<boolean>;
  canonicalQueue: CanonicalOperationQueue;
  canonicalStateFailureDetails: CanonicalStateFailure | null;
  currentUserId: string | null;
  enqueueInteractiveOperation<T>(
    run: (context: CanonicalOperationContext) => Promise<T>,
    syncing?: boolean,
    label?: string,
  ): Promise<T> | null;
  isAutomationLeaderRef: MutableRefObject<boolean>;
  isOnline: boolean;
  playEncounterTranscript(encounter: CanonicalDungeonEncounterRecord): Promise<void>;
  ports: Pick<GameApplicationPorts, "requestBootstrap" | "sendCommand">;
  publishAuthoritativeSnapshot(envelope: AuthoritativeSnapshotEnvelope): void;
  revisionRef: MutableRefObject<number>;
  setApiAvailable(available: boolean): void;
  setCanonicalStateFailureDetails(failure: CanonicalStateFailure | null): void;
  showNotice(message: string): void;
}

export function useAuthoritativeCommandDispatch(
  dependencies: AuthoritativeCommandDispatchDependencies,
): DispatchAuthoritativeCommand {
  const dependenciesRef = useRef(dependencies);
  dependenciesRef.current = dependencies;

  return useCallback((
    command: GameCommand,
    options: AuthoritativeDispatchOptions = {},
  ): Promise<boolean> => {
    const current = dependenciesRef.current;
    const interactive = options.interactive ?? true;
    if (current.canonicalStateFailureDetails) {
      current.addLog("Sauvegarde canonique incompatible : mutation verrouillée.", "defeat");
      return Promise.resolve(false);
    }
    if (!current.currentUserId || !current.isOnline) {
      current.addLog("📡 Mode hors connexion : mutation verrouillée.", "info");
      return Promise.resolve(false);
    }
    if (!current.isAutomationLeaderRef.current) {
      current.showNotice("Mode observateur : prenez le contrôle pour agir.");
      return Promise.resolve(false);
    }

    const userId = current.currentUserId;
    const runCommand = async ({
      measureNetwork,
      measureApplication,
    }: CanonicalOperationContext): Promise<CommandRunResult> => {
      try {
        const commandId = crypto.randomUUID();
        const envelope = createCommandEnvelope(commandId, current.revisionRef.current, command);
        const result = await measureNetwork<AuthoritativeCommandSuccess>(
          () => current.ports.sendCommand(envelope),
        );
        current.setCanonicalStateFailureDetails(null);
        const resolvedEncounter = (result.events ?? [])
          .find((event) => event.type === "dungeon.encounter_resolved")
          ?.encounter as CanonicalDungeonEncounterRecord | undefined;
        await applyAuthoritativeCommandSuccess(
          result,
          options.beforeApplyAuthoritativeState,
          () => measureApplication(() => current.applyAuthoritativeState(
            result.state,
            result.revision,
            userId,
            result.serverTime,
            result.lastProcessedAt,
          )),
        );
        current.publishAuthoritativeSnapshot(result);
        for (const event of result.events ?? []) {
          const townLog = formatCanonicalTownEvent(event);
          if (townLog && !options.silentSuccess) current.addLog(townLog.message, townLog.type, "colony");
          if (event.type === "dungeon.encounter_started") {
            current.addLog("⚔️ Une rencontre autoritaire a commencé.", "info", "dungeon");
          }
          if (event.type === "dungeon.retreat") {
            current.addLog("🏕️ Repli tactique : l’escouade regagne le campement.", "info", "dungeon");
          }
        }
        const playback = resolvedEncounter
          ? current.playEncounterTranscript(resolvedEncounter)
          : undefined;
        return { ok: true, ...(playback ? { playback } : {}) };
      } catch (error) {
        if (error instanceof GameApiError && error.status === 409) {
          const commandInProgress = error.code === "COMMAND_IN_PROGRESS";
          let reloadSucceeded = false;
          try {
            const canonical = await measureNetwork<AuthoritativeGameEnvelope>(
              () => current.ports.requestBootstrap("conflict"),
            );
            await measureApplication(() => current.applyAuthoritativeState(
              canonical.state,
              canonical.revision,
              userId,
              canonical.serverTime,
              canonical.lastProcessedAt,
            ));
            current.publishAuthoritativeSnapshot(canonical);
            current.setApiAvailable(true);
            current.setCanonicalStateFailureDetails(null);
            reloadSucceeded = true;
          } catch (reloadError) {
            const stateFailure = canonicalStateFailure(reloadError);
            if (stateFailure) {
              current.setCanonicalStateFailureDetails(stateFailure);
              current.setApiAvailable(true);
            } else if (!(reloadError instanceof GameApiError) || reloadError.status >= 500) {
              current.setApiAvailable(false);
            }
            current.addLog(
              commandInProgress
                ? "Échec de la synchronisation de la commande déjà en cours."
                : "Échec du rechargement canonique après conflit.",
              "defeat",
            );
          }
          if (reloadSucceeded && !options.silentConflict) {
            current.addLog(
              commandInProgress
                ? "⏳ Commande identique déjà en cours : synchronisation canonique."
                : "⚔️ Conflit de révision : rechargement de l’état canonique.",
              "info",
            );
            current.showNotice(
              commandInProgress
                ? "Une commande identique est déjà traitée dans une autre session. État resynchronisé."
                : "Action annulée : une autre session avait déjà modifié la partie. État resynchronisé.",
            );
          } else if (!reloadSucceeded) {
            current.showNotice("Conflit détecté, mais la resynchronisation a échoué. Réessayez dans quelques secondes.");
          }
          if (reloadSucceeded && shouldRetryOptimisticConflict(error.code)) {
            options.onConflictResolved?.();
          }
        } else {
          const stateFailure = canonicalStateFailure(error);
          if (stateFailure) {
            current.setCanonicalStateFailureDetails(stateFailure);
            current.setApiAvailable(true);
          } else if (!(error instanceof GameApiError) || error.status >= 500) {
            current.setApiAvailable(false);
          }
          const presentation = getAuthoritativeFailurePresentation({
            isBusinessRefusal: error instanceof GameApiError && error.status < 500,
            ...(error instanceof GameApiError ? { message: error.message } : {}),
          });
          current.addLog(presentation.logMessage, "defeat");
          current.showNotice(presentation.notice);
        }
        return { ok: false };
      }
    };

    const operation = interactive
      ? current.enqueueInteractiveOperation(runCommand, false, "command:" + command.type)
      : current.canonicalQueue.enqueueUser(runCommand, "command:" + command.type);
    if (!operation) return Promise.resolve(false);
    return operation.then(async ({ ok, playback }) => {
      if (playback) await playback;
      return ok;
    });
  }, []);
}
