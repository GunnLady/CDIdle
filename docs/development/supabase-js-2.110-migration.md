# Migration Supabase JS 2.53.0 vers 2.110.8

Date d'inventaire : 2026-07-30.

## Décision

CDIdle épingle `@supabase/supabase-js` à `2.110.8`. Tous les sous-clients
Supabase installés sont ainsi alignés sur la même version. L'application reste
sur son client navigateur unique dans `src/lib/supabase.ts` et conserve son
transport `fetch` explicite vers `game-api`.

Sources officielles :

- [release 2.110.8](https://github.com/supabase/supabase-js/releases/tag/v2.110.8) ;
- [changelog Supabase JS au tag 2.110.8](https://github.com/supabase/supabase-js/blob/v2.110.8/CHANGELOG.md) ;
- [politique de support runtime](https://github.com/supabase/supabase-js#support-policy).

## Matrice des impacts applicables

| Zone | Changements entre 2.53.0 et 2.110.8 | Impact CDIdle | Preuve attendue |
| --- | --- | --- | --- |
| Runtime | Node 18 retiré en 2.79.0, Node 20 retiré en 2.110.0 ; le paquet 2.110.8 exige Node >=22 | Compatible avec Node 24 utilisé par le projet | `node --version`, typecheck et tests |
| Auth/session | corrections PKCE, restauration lors d'échecs transitoires, nettoyage au sign-out et initialisation ordonnée | Parcours Google, F5, déconnexion et reconnexion à contrôler | tests Auth + parcours navigateur |
| Verrou Auth | timeouts de verrou ajoutés puis retrait du mutex `navigator.locks` en 2.107.0 au profit d'un commit guard | Zone sensible pour les onglets concurrents ; aucun verrou applicatif ajouté | singleton testé + parcours multi-onglet |
| `onAuthStateChange` | avertissement contre les callbacks asynchrones depuis 2.74.0 | Le wrapper CDIdle appelle un callback synchrone ; le travail asynchrone est lancé avec `void` dans `App` | test du callback et typecheck |
| Erreurs Auth/fetch | erreurs réseau mieux classées ; échecs aborted/transient journalisés en warning en 2.110.8 | Une panne réseau ne doit pas devenir un état canonique invalide | tests fetch transitoire et abort |
| Functions | timeout/abort normalisés, sérialisation d'erreur, Content-Type insensible à la casse, nettoyage des listeners en 2.110.8 | CDIdle n'utilise pas `supabase.functions.invoke`; son `fetch` explicite conserve JWT, codes, `requestId` et timeout | tests `callGameApi` et smoke authentifié |
| PostgREST | fetch natif, propagation des causes et retries transitoires ajoutés | Aucun appel PostgREST direct dans le client CDIdle | inventaire statique et tests serveur inchangés |
| Realtime | nouveau serializer et nombreuses corrections de connexion/auth | Aucun channel Realtime créé par CDIdle | inventaire statique ; aucun comportement à migrer |
| Storage | API enrichie et types/erreurs ajustés | Aucun appel Storage direct ; impact limité au bundle transitif | inventaire et budget bundle |

## Diff des dépendances

- `@supabase/supabase-js` : `2.53.0` -> `2.110.8`, sans plage flottante ;
- `auth-js`, `functions-js`, `postgrest-js`, `realtime-js` et `storage-js` :
  alignés en `2.110.8` ;
- suppression des transitifs historiques `@supabase/node-fetch`, `ws`,
  `isows`, `@types/ws` et `@types/phoenix` ;
- ajout de `@supabase/phoenix@0.4.5` et utilisation de `tslib@2.8.1` ;
- aucune autre dépendance directe de CDIdle modifiée.

## Invariants préservés

- un seul appel `createClient` dans l'application ;
- OAuth Google redirige vers `window.location.origin` ;
- la session restaurée fournit toujours `session` et `user` ;
- `callGameApi` envoie le Bearer JWT sans le journaliser ;
- codes HTTP, codes structurés et `requestId` restent accessibles ;
- timeout, abort utilisateur, panne réseau et `INVALID_GAME_STATE` restent
  distinguables ;
- cache hors ligne et autorité serveur ne dépendent pas du SDK pour leurs
  calculs.

## Validation manuelle

Avec le frontend connecté au Supabase local ou distant configuré :

1. connexion Google puis F5 : la session revient sans faux mode hors ligne ;
2. mutation `game-api` : réponse 200 et révision incrémentée ;
3. deux onglets : un maître, un observateur, transfert de contrôle sans client
   Auth concurrent ni boucle réseau ;
4. passage offline puis online : cache en lecture seule, reprise et révision
   cohérentes ;
5. déconnexion, reconnexion, reset, suppression puis recréation du compte ;
6. console et Network : aucun token journalisé, erreurs réseau et conflits de
   révision correctement distingués.

## Rollback

Si une régression SDK est confirmée avant publication :

```powershell
npm.cmd install --save-exact @supabase/supabase-js@2.53.0
```

Restaurer ensuite les versions de `package.json` et `package-lock.json` du
commit précédent, relancer les tests ciblés et documenter la régression qui a
motivé le rollback. Aucun changement de schéma Supabase n'est nécessaire.
