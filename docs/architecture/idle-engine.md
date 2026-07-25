# Idle engine (CDI-016)

`applyIdleAuthority` is the unique pure, idempotent idle transition. It
receives persisted state and the authoritative current timestamp, then returns
a new state and an `IdleReport`.

Only city production, citizen immigration and resting-hero HP/mana recovery
are applied. The elapsed interval is capped at 24 hours; excess time is
reported as discarded and never replayed. `lastProcessedAt` advances to the
authoritative timestamp, so repeating the same timestamp cannot duplicate
resources, citizens or recovery.

A resting hero becomes `idle` once both HP and mana reach their persisted
calculated maxima. The report distinguishes heroes whose gauges progressed
(`heroesRecovered`) from heroes that completed recovery
(`heroesFullyRecovered`). The active UI only requests a new canonical
snapshot when production, viable immigration or hero recovery can change the
state.

Rest recovery is uniform for the currently supported races: 2% of persisted
maximum HP and 2% of persisted maximum mana per second. The former hard-coded
Lizardfolk bonus is intentionally removed until that race and its bonuses are
designed and enabled.

The deterministic implementation is exposed by
`supabase/functions/game-api/idle-authority.ts`. The former client duplicate
`src/domain/idle.ts` was removed after the authoritative integration because
no runtime called it. Its HTTP/RPC persistence
wiring is owned by CDI-040 and runtime proof by CDI-041; CDI-030 remains
testable without a local smoke dependency.
