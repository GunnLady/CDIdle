# Audit du client Supabase — CDI-023

## Périmètre vérifié

Le client navigateur utilise désormais `@supabase/supabase-js` pour Google,
email, session et appels vers l'Edge Function `game-api`. Les parcours de
chargement, sauvegarde et reset passent par l'API autoritaire. La sauvegarde
locale actuelle est conservée uniquement comme compatibilité transitoire
jusqu'à l'implémentation du cache de lecture seule prévue par CDI-024/CDI-025.

## Contrôles

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Références Firebase dans le code applicatif | Contrôle sans écart | `rg` ne trouve plus de référence dans `src`, `package.json` ou `.env.example` |
| Client Supabase et contrats d'authentification | Contrôle sans écart | `tests/supabaseClient.test.ts`, typecheck |
| Chargement/sauvegarde/reset cloud | Contrôle sans écart côté client | `App.tsx` appelle `/bootstrap`, `/commands` et `/reset` avec le bearer Supabase |
| TypeScript | Contrôle sans écart | `npm run typecheck` passe |
| Lint | Contrôle sans écart bloquant | `npm run lint` passe, avertissements historiques uniquement |
| Workboard | Contrôle sans écart | `npm run board:validate` : 38 tickets, 0 erreur |
| Tests Vitest | Contrôle sans écart | `npm test -- --run` : 7 fichiers, 61 tests réussis |
| Build Vite | Contrôle sans écart bloquant | `npm run build` passe ; avertissement de taille de bundle uniquement |
| Services Supabase de production | Écart déjà prévu dans un ticket futur | Suivi d'architecture, validation finale CDI-035 |
| Vérification JWT cryptographique et allowlist runtime | Écart déjà prévu dans un ticket futur | Hardening CDI-034 et intégration de production CDI-035 |
| Cache local de lecture seule / suppression du fallback prototype | Contrat CDI-024 livré ; intégration des mutations autoritaires restante | Cache IndexedDB livré par CDI-024 ; mutations ville prévues dans CDI-025 |
| CI distante via connecteur GitHub | Statut inconnu | Le connecteur n'a retourné aucun statut exploitable pour le commit audité ; aucune CI verte n'est affirmée |

## Conclusion

Le périmètre client de CDI-023 est implémenté et toutes les validations locales
reproductibles passent. Les services Edge de production, la vérification JWT
cryptographique, le cache de lecture seule et les tests d'intégration staging
restent explicitement hors de ce changement ; chacun est classé ci-dessus comme
écart déjà prévu avec son ticket de suivi. Ce document ne contient plus de
résultat de validation obsolète.
