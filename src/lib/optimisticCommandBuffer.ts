import {
  type OptimisticCommandType,
  type OptimisticGameCommand,
} from "../domain/optimisticStateProjection";

export type OptimisticMerge = (
  current: OptimisticGameCommand,
  incoming: OptimisticGameCommand,
) => OptimisticGameCommand | null;

interface PendingBatch {
  command: OptimisticGameCommand;
  timer: ReturnType<typeof setTimeout> | null;
}

interface OptimisticCommandBufferOptions {
  send: (command: OptimisticGameCommand, acknowledge: () => void) => Promise<boolean>;
  onChange: (commands: OptimisticGameCommand[]) => void;
  debounceMs?: number;
  maxClicksPerSecond?: number;
  now?: () => number;
}

/**
 * Collects deterministic UI mutations without allowing an unbounded request
 * backlog. Each key owns at most one request in flight and one next batch.
 */
export class OptimisticCommandBuffer {
  private disposed = false;
  private readonly drafts = new Map<string, PendingBatch>();
  private readonly inFlight = new Map<string, OptimisticGameCommand>();
  private readonly clickHistory = new Map<string, number[]>();
  private readonly debounceMs: number;
  private readonly maxClicksPerSecond: number;
  private readonly now: () => number;

  constructor(private readonly options: OptimisticCommandBufferOptions) {
    this.debounceMs = options.debounceMs ?? 400;
    this.maxClicksPerSecond = options.maxClicksPerSecond ?? 5;
    this.now = options.now ?? Date.now;
  }

  get commands(): OptimisticGameCommand[] {
    return [...this.inFlight.values(), ...[...this.drafts.values()].map((entry) => entry.command)];
  }

  get pendingCount(): number {
    return this.inFlight.size + this.drafts.size;
  }

  enqueue(key: string, command: OptimisticGameCommand): boolean {
    if (this.disposed) return false;
    const now = this.now();
    const recent = (this.clickHistory.get(key) ?? []).filter((timestamp) => now - timestamp < 1_000);
    if (recent.length >= this.maxClicksPerSecond) {
      this.clickHistory.set(key, recent);
      return false;
    }
    recent.push(now);
    this.clickHistory.set(key, recent);

    const current = this.drafts.get(key);
    const merged = current ? mergeOptimisticCommands(current.command, command) : command;
    // A merge function may return the existing object to reject a click that
    // would overflow the current batch. Keep its original flush deadline.
    if (current && merged === current.command) return false;
    if (current?.timer) clearTimeout(current.timer);
    if (!merged) {
      this.drafts.delete(key);
      this.emit();
      return true;
    }
    const draft: PendingBatch = { command: merged, timer: null };
    this.drafts.set(key, draft);
    draft.timer = setTimeout(() => void this.flush(key), this.debounceMs);
    this.emit();
    return true;
  }

  dispose(): void {
    this.disposed = true;
    for (const draft of this.drafts.values()) if (draft.timer) clearTimeout(draft.timer);
    this.drafts.clear();
    this.inFlight.clear();
    this.clickHistory.clear();
  }

  private async flush(key: string): Promise<void> {
    if (this.disposed) return;
    if (this.inFlight.has(key)) return;
    const draft = this.drafts.get(key);
    if (!draft) return;
    if (draft.timer) clearTimeout(draft.timer);
    this.drafts.delete(key);
    this.inFlight.set(key, draft.command);
    this.emit();

    let acknowledged = false;
    const acknowledge = () => {
      if (acknowledged) return;
      acknowledged = true;
      this.inFlight.delete(key);
      this.emit();
    };
    try {
      await this.options.send(draft.command, acknowledge);
    } finally {
      acknowledge();
      const next = this.drafts.get(key);
      if (next) {
        if (next.timer) clearTimeout(next.timer);
        next.timer = setTimeout(() => void this.flush(key), 0);
      }
    }
  }

  private emit(): void {
    if (this.disposed) return;
    this.options.onChange(this.commands);
  }
}

export const mergeSummedAmount: OptimisticMerge = (current, incoming) => {
  if (current.type !== "citizens.allocate" || incoming.type !== "citizens.allocate") return incoming;
  const amount = current.amount + incoming.amount;
  return amount === 0 ? null : { ...incoming, amount };
};

export const mergeBuildingLevels: OptimisticMerge = (current, incoming) => {
  if (current.type !== "building.upgrade" || incoming.type !== "building.upgrade") return incoming;
  const levels = (current.levels ?? 1) + (incoming.levels ?? 1);
  return levels > 5 ? current : { ...incoming, levels };
};

export const keepLatestCommand: OptimisticMerge = (_current, incoming) => incoming;

export const OPTIMISTIC_MERGE_STRATEGIES = {
  "citizens.allocate": mergeSummedAmount,
  "building.upgrade": mergeBuildingLevels,
  "hero.activity": keepLatestCommand,
  "hero.equip": keepLatestCommand,
  "hero.unequip": keepLatestCommand,
  "dungeon.select_floor": keepLatestCommand,
  "dungeon.auto_explore": keepLatestCommand,
} satisfies Record<OptimisticCommandType, OptimisticMerge>;

export function mergeOptimisticCommands(
  current: OptimisticGameCommand,
  incoming: OptimisticGameCommand,
): OptimisticGameCommand | null {
  return OPTIMISTIC_MERGE_STRATEGIES[incoming.type](current, incoming);
}

export function shouldRetryOptimisticConflict(code: string | undefined): boolean {
  return code === "REVISION_CONFLICT";
}
