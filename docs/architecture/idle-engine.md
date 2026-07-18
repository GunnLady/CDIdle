# Idle engine (CDI-016)

`applyIdle` is a pure, idempotent state transition. It receives persisted
state and the authoritative current timestamp, then returns a new state and an
`IdleReport`.

Only city production, citizen immigration and resting-hero HP/mana recovery
are applied. The elapsed interval is capped at 24 hours; excess time is
reported as discarded and never replayed. `lastProcessedAt` advances to the
authoritative timestamp, so repeating the same timestamp cannot duplicate
resources, citizens or recovery.
