# Audit détaillé CDI-028

## Contrôles sans écart

- démarrage de forge atomique avec forge déverrouillée et coût de matériaux ;
- aperçu persistant avec `previewId`, finalisation unique et annulation ;
- recyclage atomique d'un objet et attribution des récompenses par rareté ;
- commandes `forge.start`, `forge.finalize`, `forge.cancel` et
  `inventory.recycle` raccordées au dispatcher Edge ;
- `npm run typecheck` : réussi ;
- `npm run check:determinism` : réussi.
- test manuel rapporté par l'utilisateur : `tests/townAuthority.test.ts`, 6/6.

## Écarts réels

Aucun écart local identifié dans le périmètre implémenté.

## Sujets prévus dans un autre ticket

- proc de qualité RNG et probabilités : CDI-037 ;
- validation HTTP Edge/Supabase/RLS/RPC : CDI-041/staging ;
- recettes et catalogue complets : tranche de données future à tracer avant
  hardening ;
- forge/recyclage consommés par donjon/combat : CDI-029.

## Décision

Le périmètre local CDI-028 est implémenté. Le test ciblé utilisateur est vert.
