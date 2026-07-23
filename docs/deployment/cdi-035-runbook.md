# CDI-035 — Runbook staging, production et exploitation

## Environnements

Le dépôt travaille sur `main`. Staging et production sont des environnements
GitHub distincts, avec approbation obligatoire pour `production`.

Secrets attendus hors dépôt :

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`
- `GAME_API_BASE_URL`
- `GAME_API_TOKEN` (compte synthétique staging uniquement)

## Promotion staging

1. Exécuter la CI complète sur le commit `main`.
2. Créer une sauvegarde chiffrée hors Git de la base staging.
3. Exécuter `npm run check:migrations`, puis déployer les migrations additives et `game-api`.
4. Déployer `dist/` sur Cloudflare Pages staging.
5. Exécuter `npm run smoke:game-api` avec un compte synthétique.
6. Observer les logs pendant 48 h avec au moins deux comptes et deux appareils.

## Promotion production

Production exige l’environnement GitHub protégé et une approbation humaine.
Répéter la sauvegarde, le déploiement additif et le smoke avant d’ouvrir le
trafic.

## Rollback

Le rollback redéploie l’artefact web et l’Edge Function précédents. Les
migrations ne sont jamais annulées destructivement : une migration additive de
compensation est requise.

## Sauvegarde et journaux

Les sauvegardes sont chiffrées, stockées hors dépôt et supprimables pour
staging. Les logs ne doivent contenir ni JWT, ni clé, ni email, ni payload de
jeu ; seuls code d’erreur, statut et `x-request-id` sont conservés.

L’exécution réelle de ce runbook est bloquée tant que les projets Supabase,
Cloudflare et leurs secrets ne sont pas fournis dans les environnements GitHub.
