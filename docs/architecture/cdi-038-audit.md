# Audit détaillé CDI-038

## Contrôles sans écart

- formule documentée : `55/6` au niveau 10, `45/4` au niveau 11, `30/2` au
  niveau 12, choix forcé au niveau 13 ;
- absence de classe admissible conservée en attente ;
- ordre de départage déterministe conservé ;
- tests `tests/utils.test.ts` : 51/51 réussis ;
- `npm run typecheck` : réussi ;
- `npm run check:determinism` : réussi ;
- aucun changement de classes, bâtiments ou statistiques de base.

## Écarts réels

Aucun.

## Sujets prévus ailleurs

Aucun écart reporté pour CDI-038. Les migrations d’autorité serveur des choix
de classe restent dans les tickets verticaux concernés et ne changent pas la
formule locale déterministe.

## Décision

CDI-038 peut être marqué `Done`.
