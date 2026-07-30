# Alignement Supabase alpha — CDI-066

Date de l audit : 2026-07-30.

## Environnement identifié

- Projet Supabase alpha : `tohujvjxcfarciotsnbp` (`CDIdle`).
- Branche de dépôt : `main`.
- Dernier backend distant vérifié avant correction locale : commit publié
  `f2fc4de31d7ec9a8eaae85164ca1897882b90a49`.
- Edge Function observée : `game-api`, active, version distante 2, vérification
  JWT de gateway activée.

Le redéploiement du correctif ES256 doit être effectué depuis le prochain
commit validé ; le commit ci-dessus ne constitue donc pas la preuve finale de
CDI-066.

## Matrice distante vérifiée

| Surface | Résultat |
| --- | --- |
| Migrations | 11 migrations locales présentes à distance, mêmes versions |
| Schéma public | Aligné ; seuls trois privilèges par défaut de séquences propres au socle local diffèrent, sans objet CDIdle exposé |
| RLS, fonctions, grants | Alignés avec les migrations applicatives |
| Google OAuth | Activé |
| Fournisseur Email | Désactivé pendant CDI-066 |
| Autres fournisseurs visibles | Désactivés |
| Hook avant création | `public.before_user_created`, activé pendant CDI-066 |
| Allowlist runtime | Recontrôlée par `game-api` sur chaque requête authentifiée |
| Cheats | Aucun secret d activation distant ; désactivés par défaut |
| `service_role` | Présente uniquement dans le runtime Supabase et absente du client |
| CORS avant Cloudflare | `http://127.0.0.1:3000` et `http://localhost:3000` |

L origine Cloudflare n existe pas encore. CDI-062 doit créer l URL, ajouter
son origine exacte à `GAME_API_ALLOWED_ORIGINS`, redéployer `game-api` puis
prouver le smoke positif et le refus d une origine inconnue.

## Corrections locales

- `SUPABASE_JWT_SECRET` devient optionnel pour les JWT ES256 modernes : leur
  authenticité est validée par `/auth/v1/user`. HS256 reste accepté uniquement
  lorsqu un secret legacy est explicitement fourni.
- Les anciens domaines, repository et dispatcher client absents des entrées de
  production ont été retirés avec leurs tests spécifiques et `zod`.
- Les exports, constantes de forge, interfaces, dépendances et asset devenus
  sans consommateur ont été retirés. Les tables de loot de boss réservées à
  CDI-060 sont conservées.
- TypeScript contrôle désormais `noUnusedLocals` et `noUnusedParameters`.

## Reproduire la configuration Auth alpha

Dans le Dashboard du projet `tohujvjxcfarciotsnbp` :

1. Ouvrir **Authentication > Sign In / Providers** ; conserver Google activé,
   désactiver Email et tous les autres fournisseurs.
2. Ouvrir **Authentication > Auth Hooks** ; ajouter ou modifier le hook
   **Before User Created**, choisir **Postgres**, schéma `public`, fonction
   `before_user_created`, puis l'activer.
3. Vérifier que la fonction et ses droits proviennent toujours des migrations
   versionnées avant de modifier la configuration distante.

Cette procédure ne nécessite ni copie ni stockage d'un secret dans le dépôt.

## Preuves acquises

- Typecheck : réussi.
- ESLint : réussi sans erreur ni avertissement.
- Vitest : 38 fichiers, 308 tests réussis.
- Couverture : seuils globaux et seuils du domaine `game-api` respectés.
- Garde de déterminisme : réussie.
- Audits secrets, logs et migrations : réussis.
- Workboard : 67 tickets, 0 erreur.
- Build Vite : réussi, preuve utilisateur.
- pgTAP : 7 fichiers, 112 tests réussis, preuve utilisateur.
- Intégration temporelle : duplicate, snapshot race et limite concurrente
  60/min validés, preuve utilisateur.

## Preuves restant à produire

- Commit publié puis redéploiement explicite de `game-api` depuis ce commit.
- Smoke distant sans JWT, authentifié, mutation persistée, idempotence,
  concurrence, limite, rapport d erreur et contrôles destructifs uniquement
  sur un compte alpha dédié.
