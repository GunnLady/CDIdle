# Audit du bootstrap et du cache local — CDI-024

## Contrôles

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Cache isolé par utilisateur | Contrôle sans écart | `src/lib/gameCache.ts` utilise une clé IndexedDB par `userId` |
| Lecture hors connexion | Contrôle sans écart côté client | `App.tsx` recharge le snapshot IndexedDB lorsque `/bootstrap` est indisponible |
| Cache en lecture seule hors connexion | Contrôle sans écart de périmètre | aucune mutation de gameplay n'est déclenchée par le cache ; il hydrate l'état local |
| Purge du cache historique | Contrôle sans écart | `purgeLegacyGameCache()` supprime `colonie_donjon_idle_save_v3` |
| Contrats cache | Contrôle sans écart | test Vitest dédié ; 62 tests passent au total |
| TypeScript, build et workboard | Contrôle sans écart | typecheck, build et `board:validate` passent |
| Docker / `test:db` | Contrôle sans écart | Docker `29.6.1` actif ; `npm run test:db` : 35 tests SQL réussis |

## Conclusion

Le bootstrap conserve l'état canonique Supabase et le client dispose désormais
d'un cache IndexedDB cloisonné par utilisateur pour la reprise en lecture seule.
Le `localStorage` historique est purgé. Les tests de base de données locaux
passent également maintenant que Docker est disponible.
