# CDI-089 — Extraction des cas d’usage applicatifs de `App`

## Objectif et méthode

CDI-089 réduit `App.tsx` à la composition des runtimes, à la navigation, aux
adaptations minces entre hooks et aux branchements des pages. La taille du
fichier reste un indicateur secondaire : chaque extraction doit surtout retirer
une responsabilité et rendre ses pannes testables sans créer de nouvel état
canonique.

La référence avant extraction comptait 1 234 lignes. Après les lots CDI-089,
`App.tsx` en compte 720, soit 514 lignes de moins. Cette baisse ne constitue pas
à elle seule une preuve de réussite ; la cartographie ci-dessous décrit les
frontières réellement déplacées.

## Cartographie avant/après

| Responsabilité auparavant assemblée dans `App` | Frontière cible | État détenu |
| --- | --- | --- |
| Dispatch autoritaire, conflits, rejeu, restauration et événements | `useAuthoritativeCommandDispatch` | Aucun snapshot ni révision ; getters et callbacks injectés |
| Heartbeat, immigration et réconciliation temporelle | `useTownAuthorityReconciliation` | Un unique intervalle de 30 s ; aucune minuterie concurrente |
| Authentification, onboarding, fondation et recrutement | `useEntryLifecycleActions` | Nom de recrue édité et indicateur local de confirmation uniquement |
| Actualisation manuelle de l’état serveur | `useManualCanonicalRefresh` | Aucun état ; file coalescée injectée |
| Reset et suppression du compte | `useAccountRecoveryActions` | Aucun état ; ordre serveur/cache/session explicite |
| Snapshot et suppression propagés entre onglets | `useCrossTabGameSynchronization` | Aucun état canonique ; pont de CDI-081 réutilisé |
| Commandes de triche de développement | `useDeveloperCheatActions` | Texte du champ développeur uniquement |
| Actions de page du donjon : exploration, étage, retraite, héros et reset | `useDungeonPageActions` | Aucun état ; automation, optimisme et dispatch injectés |

Les accès réseau, cache et session de ces contrôleurs passent par
`GameApplicationPorts`, assemblé une seule fois dans la composition root. Les
contrôleurs ne choisissent donc plus eux-mêmes leurs adaptateurs d'infrastructure.

## Responsabilités conservées dans `App`

`App.tsx` reste la composition root React. Il conserve :

- la préférence et la navigation entre les cinq destinations ;
- l’assemblage des runtimes de snapshot, session, file, optimisme, leadership,
  automation, donjon et ville ;
- les adaptations minces de publication de snapshot, rafraîchissement après
  acquisition du leadership et remise à zéro coordonnée des runtimes ;
- les effets navigateur de connexion, préférence d’onglet, expiration des
  notices, purge du cache historique et redirection vers Compte ;
- le branchement des pages, panneaux, prompts et dialogues globaux.

Les composants et projections n’appellent ni `callGameApi` ni
`requestCanonicalBootstrap`. `CanonicalStatusLayer` importe
`CanonicalStateFailure` depuis le domaine neutre, sans dépendance Supabase.

## Invariants préservés

- Le snapshot confirmé, la projection optimiste et la révision restent détenus
  par `useCanonicalSnapshot`.
- La sérialisation et les priorités restent détenues par
  `CanonicalOperationQueue` et `useCanonicalOperations`.
- Toutes les mutations utilisent la même enveloppe, le même endpoint et le
  même chemin d’application autoritaire.
- Un conflit 409 recharge le snapshot avant d’autoriser un rejeu optimiste.
- L’immigration abandonne une génération devenue obsolète et le heartbeat
  réutilise la file coalescée.
- Le reset applique d’abord la réponse serveur, neutralise l’ancien cache,
  publie le snapshot puis nettoie l’interface.
- La suppression attend la confirmation serveur avant de marquer l’utilisateur
  supprimé, invalider le bootstrap, publier l’événement, purger les caches,
  vider les runtimes et fermer la session.
- Une suppression propagée invalide et vide immédiatement le runtime local,
  puis rapporte séparément les pannes de cache et de fermeture de session.

## Couverture ajoutée

Chaque frontière possède un test de hook dédié :

- accès hors ligne ou observateur ;
- succès, rejeu idempotent, commande déjà en cours, refus métier, panne
  transport, conflit et resynchronisation ;
- génération temporelle obsolète et unicité du heartbeat ;
- onboarding, recrutement, authentification et fermeture de session ;
- actualisation manuelle et publication du snapshot ;
- ordre du reset et de la suppression, y compris les pannes intermédiaires ;
- réception inter-onglets, rencontre nouvelle, abonnement obsolète et nettoyage
  de compte propagé ;
- parsing et dispatch des commandes développeur.
- exploration, changement d’étage, reset et activation des héros du donjon.

Les validations globales doivent rester vertes avant chaque lot suivant :
typecheck, lint, tests unitaires, déterminisme, build et budget bundle.

## Limites et suite

La composition des destinations reste volontairement explicite dans `App`.
La déplacer sans réduction de responsabilité ne ferait que masquer le câblage
de la composition root. Les futures migrations visuelles de CDI-077 peuvent
désormais modifier les pages sans renforcer les anciens cas d’usage
applicatifs.
