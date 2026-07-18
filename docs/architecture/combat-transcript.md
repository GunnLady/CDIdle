# Combat engine and transcript (CDI-015)

The combat domain is a pure state transition. `resolveCombatRound` receives a
combat state and an injected `Rng`, then returns a new state; it never mutates
its input. Every hit or skill effect is appended to a contiguous transcript
sequence, so the result can be replayed with the same seed and initial state.

`attackSpeed` is a cadence multiplier: `1` is one hit per tick, values below
one are slower and values above one are faster. The additional-hit chance is
`max(0, (attackSpeed - 1) * 100 + speed)` and is capped at three strikes.

Buffs and debuffs are stored on each combatant with their source skill and a
positive `remainingRounds` count. They are applied immutably to the supported
combat stats (`attack`, `physicalDamage`, `speed`, and `physicalDefense`) and
decremented after a resolved round. Once the count reaches zero, the modifier
is removed. Skill application emits a `modifier` transcript event.

The server-authoritative migration and removal of remaining `Math.random`
callers are tracked separately by CDI-029 and CDI-037.
