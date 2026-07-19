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

## Audit post-push détaillé

### Contrôles sans écart

- le code et les contrats forge/recyclage sont présents dans les commits
  `6cdc8ec` et `b917c87` ;
- test manuel utilisateur : 6/6 ;
- workboard : aucune erreur ni avertissement de validation ;
- CI distante : aucun workflow retourné par le connecteur pour `b917c87`, donc
  résultat inconnu.

### Écarts réels à corriger ou tracer

- le catalogue serveur ne couvre actuellement que la recette `starter_sword` ;
- `chosenModifierStat` n'est pas encore validé par une matrice de compatibilité
  serveur ;
- la matrice complète des tables de récompense et des finalisations proc/non-proc
  reste à couvrir.

### Écarts déjà prévus dans un autre ticket

- proc RNG et probabilités : CDI-037 ;
- validation HTTP Edge/Supabase/RLS/RPC : CDI-041/staging ;
- consommation dans donjon/combat : CDI-029.

## Décision

CDI-028 est `Paused` tant que les trois écarts réels ci-dessus ne sont pas
corrigés ou tracés dans un ticket de suivi dédié.
