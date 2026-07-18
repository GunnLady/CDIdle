# Audit progression de donjon

Cet audit conserve les écarts observés après CDI-014 et indique le ticket qui
les prend en charge. CDI-014 couvre uniquement le socle de progression :
étages, salles, record et navigation bornée.

| Écart restant | Ticket cible | État |
| --- | --- | --- |
| Contrat des encounters et transcript déterministe absent du domaine | CDI-015 | À faire |
| Retraite encore implémentée dans le hook React, sans traitement autoritaire | CDI-029 | À faire |
| Récompenses/loot encore calculés dans le hook, sans mutation idempotente | CDI-029 | À faire |
| Auto-exploration et verrouillage hors ligne non intégrés au flux canonique | CDI-029 | À faire |
| `dungeonProgression` non branché à `GameStateV1` et au hook : double source de vérité | CDI-029 | À faire |
| Tirages d'encounter et de loot non injectés via `Rng` | CDI-037 | À faire |
| Tests de non-mutation, replay/idempotence et transitions encounter/retraite/récompenses manquants | CDI-015, CDI-029, CDI-037 | À faire |

## Décision de rattachement

- CDI-015 porte les règles d'encounter et le transcript reproductible.
- CDI-029 porte l'intégration verticale, la retraite, les récompenses, le
  verrouillage hors ligne et l'auto-exploration.
- CDI-037 porte la migration des accès directs à `Math.random` vers `Rng`.

Il n'y a pas d'écart orphelin : chaque sujet identifié est désormais rattaché
à un ticket futur. Aucun de ces éléments ne doit être ajouté rétroactivement à
CDI-014, déjà validé comme fondation.
