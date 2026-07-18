# Audit du client Supabase — CDI-023

## Périmètre vérifié

Le client navigateur utilise désormais `@supabase/supabase-js` pour Google,
email, session et appels vers l'Edge Function `game-api`. Les parcours de
chargement, sauvegarde et reset passent par l'API autoritaire ; la sauvegarde
locale reste disponible comme repli hors connexion.

## Contrôles

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Références Firebase dans le code applicatif | Contrôle sans écart | `rg` ne trouve plus de référence dans `src`, `package.json` ou `.env.example` |
| Client Supabase et contrats d'authentification | Contrôle sans écart | `tests/supabaseClient.test.ts`, typecheck |
| Chargement/sauvegarde/reset cloud | Contrôle sans écart côté client | `App.tsx` appelle `/bootstrap`, `/commands` et `/reset` avec le bearer Supabase |
| TypeScript | Contrôle sans écart | `npm run typecheck` passe |
| Lint | Contrôle sans écart bloquant | `npm run lint` passe, avertissements historiques uniquement |
| Workboard | Contrôle sans écart | `npm run board:validate` : 38 tickets, 0 erreur |
| Tests Vitest et build | Vérification bloquée par l'environnement | `EPERM` lors de l'écriture de `node_modules/.vite-temp` |
| Services Supabase de production et vérification JWT réelle | Écart déjà prévu | CDI-022, suivi dans `docs/architecture/game-api-followups.md` et tickets dépendants |

## Conclusion

Le périmètre client de CDI-023 est implémenté. Les services Edge de production,
la vérification JWT cryptographique et les tests d'intégration Supabase restent
explicitement hors de ce changement et sont déjà tracés dans les suivis
d'architecture concernés.
