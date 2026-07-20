# Idle engine (CDI-016)

`applyIdle` is a pure, idempotent state transition. It receives persisted
state and the authoritative current timestamp, then returns a new state and an
`IdleReport`.

Only city production, citizen immigration and resting-hero HP/mana recovery
are applied. The elapsed interval is capped at 24 hours; excess time is
reported as discarded and never replayed. `lastProcessedAt` advances to the
authoritative timestamp, so repeating the same timestamp cannot duplicate
resources, citizens or recovery.

The Edge-facing deterministic implementation is exposed by
`supabase/functions/game-api/idle-authority.ts`. Its HTTP/RPC persistence
wiring is owned by CDI-040 and runtime proof by CDI-041; CDI-030 remains
testable without a local smoke dependency.
