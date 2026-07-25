# Audit détaillé CDI-025

## Périmètre

Audit de clôture de l’implémentation locale « Ville autoritaire » après
recentrage du ticket. La preuve Edge → Supabase réelle est volontairement
différée vers CDI-041 et `game-api-followups.md`.

## Contrôles historiques

- applicateur serveur pour `building.upgrade`, `citizens.allocate` et
  `district.unlock` ;
- coûts, prérequis de bâtiments, niveaux maximum et allocations atomiques ;
- état initial Ville et événements de transition ;
- `commandId` UUID aligné sur `game_commands.command_id` ;
- tests ciblés : 10/10 réussis ;
- `npm run typecheck` : réussi ;
- `npm run lint` : 0 erreur, warnings historiques uniquement ;
- `npm run build` : réussi ;
- Workboard : 41 tickets, 0 erreur, 0 warning ;
- aucun secret ajouté et aucun fichier utilisateur non suivi modifié.

## Écarts réels

Aucun écart réel restant dans le périmètre local clôturé.

## Sujets prévus dans un autre ticket

- Smoke HTTP Edge authentifié avec RLS/RPC/transaction atomique : CDI-041,
  validation différée en staging/production ;
- diagnostic de la connectivité Edge locale vers Kong/PostgREST : blocage
  d’infrastructure déjà tracé dans CDI-041 ;
- hardening et exploitation distante : tickets CDI-034/CDI-035.

## Décision

CDI-025 peut être marqué `Done` pour son périmètre d’implémentation locale.
La validation distante n’est pas présentée comme acquise et reste référencée
dans `docs/architecture/game-api-followups.md`.

## Rectification du 2026-07-25

Un audit fonctionnel plus large, comparé à `640f89f`, a invalidé la mention
« sans écart » pour trois points : rôle `unassigned`, prérequis d'étage et
districts. CDI-057 porte les corrections. Les districts sont désormais
explicitement désactivés jusqu'à leur refonte, plutôt que présentés comme
fonctionnels. Voir `town-authoritative-parity-audit.md`.
