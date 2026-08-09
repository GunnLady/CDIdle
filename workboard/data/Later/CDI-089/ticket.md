---
id: CDI-089
title: Extraire les cas d usage applicatifs restants de App
status: Later
area: frontend
priority: P2
size: L
risk: high
source: Audit fonctionnel et architectural pré-push de CDI-069 du 2026-08-09
depends_on: ["CDI-069", "CDI-081"]
blocks: []
github_issue: null
related_docs: ["src/App.tsx", "src/hooks/useCanonicalOperations.ts", "src/hooks/useCanonicalSessionBootstrap.ts", "src/hooks/useAutomationLeadership.ts", "src/lib/authoritativeCommandDispatch.ts", "workboard/data/Done/CDI-069/ticket.md", "workboard/data/Done/CDI-081/ticket.md", "workboard/data/Later/CDI-077/ticket.md", "docs/architecture/cdi-069-interface-architecture.md"]
---

# CDI-089 - Extraire les cas d usage applicatifs restants de App

## Objectif

Réduire `App.tsx` à la composition des runtimes, à la navigation et au branchement
des pages en extrayant progressivement les cas d usage applicatifs qui y restent
assemblés, sans déplacer l autorité serveur ni recréer un store concurrent.

## Resultat utilisateur

Les parcours de connexion, synchronisation, onboarding, commandes de jeu,
récupération du compte et navigation conservent exactement leur comportement,
tandis que leurs évolutions deviennent plus faciles à isoler, tester et relire.

## Contexte

CDI-081 a extrait les runtimes techniques de session, snapshot, opérations,
optimisme, leadership, multi-onglets, automation et transcript. CDI-069 a ensuite
sorti les écrans, modèles de présentation et modales de la racine.

`App.tsx` reste néanmoins un orchestrateur de plus de 1 200 lignes. Il contient
encore plusieurs cas d usage indépendants : dispatch canonique et traitement des
conflits, réconciliation temporelle, actions d onboarding, cycle de vie du
compte, reset/suppression et composition détaillée des routes et modales. Cette
dette est explicitement hors périmètre de CDI-069 et n est pas contractualisée
par le ticket visuel CDI-077.

La taille du fichier est un indicateur, pas le critère de réussite. Le problème
à résoudre est le nombre de responsabilités et de dépendances applicatives
assemblées dans une même fonction React.

## Perimetre autorise

- Cartographier les responsabilités résiduelles de `App.tsx`, leurs entrées,
  sorties, effets, erreurs et dépendances canoniques.
- Extraire par lots limités les cas d usage suivants :
  - dispatch des commandes autoritaires, conflit, rejeu et présentation des
    erreurs ;
  - réconciliation de la Cité, immigration et heartbeat ;
  - authentification, onboarding, fondation et recrutement ;
  - actualisation manuelle, reset, suppression du compte et nettoyage local ;
  - composition des destinations, prompts et dialogues globaux.
- Introduire des hooks ou contrôleurs applicatifs ciblés avec dépendances
  explicites et callbacks typés.
- Conserver `App.tsx` comme composition root des runtimes et de la navigation.
- Réutiliser les hooks, files, adaptateurs et domaines issus de CDI-081.
- Ajouter des tests unitaires aux frontières extraites et des tests d intégration
  sur leurs branchements dans `App`.
- Supprimer chaque ancien bloc seulement après branchement et preuve de son
  remplacement.
- Mesurer après chaque lot les responsabilités restantes, les dépendances et la
  taille de `App.tsx` sans imposer un seuil arbitraire.

## Hors perimetre

- Réécrire `App.tsx` en une seule livraison.
- Modifier le gameplay, les contrats de commandes ou les handlers serveur.
- Déplacer une règle métier dans un hook frontend.
- Introduire Redux, Zustand ou un autre store global sans besoin démontré.
- Refaire le design system ou l habillage des écrans de CDI-076 et CDI-077.
- Modifier la stratégie Supabase, IndexedDB, multi-onglets ou de déploiement.
- Optimiser le bundle par des changements sans rapport avec les extractions.
- Dupliquer temporairement une source d état canonique au-delà du lot qui la
  remplace et la supprime.

## Contrat d'implementation

- `App.tsx` reste l unique composition root React de l application.
- Les hooks extraits orchestrent des dépendances injectées ; ils ne deviennent
  ni des services globaux cachés ni des sources d état concurrentes.
- Le snapshot confirmé, la projection optimiste, la révision et le leadership
  restent détenus par les runtimes de CDI-081.
- Toute mutation passe par la même enveloppe, la même file et le même chemin de
  restauration qu avant extraction.
- Les règles métier restent dans `shared/domain` et les projections visuelles
  dans `src/domain`.
- Les composants reçoivent uniquement des vues, états d interaction et callbacks
  typés ; ils n importent pas Supabase.
- Chaque lot conserve une suite complète passante avant le lot suivant.
- Une extraction sans réduction nette de responsabilités ou de couplage est
  refusée, même si elle réduit le nombre de lignes de `App.tsx`.

## Dependances

- CDI-081 fournit les runtimes canoniques déjà extraits et leurs tests.
- CDI-069 fournit les pages, modèles de présentation et callbacks désormais
  séparés de la racine.

Le ticket ne bloque pas CDI-076. Son ordonnancement doit être arbitré avant les
lots lourds de CDI-077 afin que la migration visuelle ne renforce pas les cas d
usage encore assemblés dans `App.tsx`.

## Criteres d'acceptation

- [ ] Une cartographie initiale inventorie chaque responsabilité résiduelle de
      `App.tsx` et sa frontière cible.
- [ ] Le dispatch canonique et ses chemins conflit, rejeu, échec et restauration
      sont testables hors de la fonction `App`.
- [ ] La réconciliation temporelle et ses conditions de déclenchement sont
      isolées sans nouvelle minuterie concurrente.
- [ ] Les actions d authentification, onboarding et recrutement sont regroupées
      derrière des callbacks applicatifs typés.
- [ ] Reset, suppression du compte, cache et fermeture de session conservent
      leur ordre de sécurité et leurs messages d erreur.
- [ ] La composition des cinq destinations et des dialogues globaux est lisible
      sans réintroduire de logique métier dans les composants.
- [ ] Aucun hook extrait ne possède une copie du snapshot ou de la révision.
- [ ] Optimisme, rollback, conflit, mode observateur et reprise de leadership
      restent conformes.
- [ ] Aucun appel Supabase n est ajouté dans les composants ou projections.
- [ ] Chaque ancien bloc est supprimé après preuve que son remplacement est le
      seul consommateur actif.
- [ ] `App.tsx` ne conserve que la composition, la navigation et les adaptations
      minces nécessaires entre runtimes et pages.
- [ ] Les changements de taille et de dépendances sont documentés sans seuil
      artificiel de lignes.
- [ ] Aucun changement visible ou de gameplay non prévu n est introduit.

## Tests

- Tests unitaires de chaque hook ou contrôleur applicatif extrait.
- Tests de dispatch réussi, refusé, conflictuel, rejoué et en cours.
- Tests de réconciliation, reconnexion et absence de concurrence avec une
  commande utilisateur.
- Tests onboarding, recrutement, reset et suppression avec échec intermédiaire.
- Tests mode observateur, transfert de contrôle et sauvegarde incompatible.
- Recherche des anciens consommateurs et des imports de transport dans les
  composants avec `rg`.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`
- `git diff --check`

## Validation manuelle

Après les simulations automatisées, faire vérifier par l utilisateur un parcours
court sur le frontend local : connexion, chargement d une partie, commande
optimiste, passage observateur/contrôle, onboarding si disponible, actualisation
Compte et confirmation que reset/suppression restent correctement protégés.

Les commandes, le terminal et l objectif exact de chaque contrôle seront fournis
au moment du test. Aucun navigateur ne sera ouvert ou piloté par Codex sans
autorisation explicite.

## Preservation

- Préserver l autorité serveur, l idempotence, la révision et le RNG canonique.
- Préserver la priorité des commandes utilisateur et la coalescence de fond.
- Préserver le cache IndexedDB en lecture seule hors connexion.
- Préserver la diffusion multi-onglets et la propriété unique de l automation.
- Préserver les messages utiles, la restauration après erreur et les preuves de
  récupération d une sauvegarde incompatible.
- Préserver tous les écrans et modèles de présentation issus de CDI-069.
- Ne pas écraser les modifications utilisateur présentes dans le worktree.

## Risques

- Une extraction trop large peut casser l ordre d effets React ou la file
  canonique malgré une interface inchangée.
- Un hook trop général peut seulement déplacer la monolithie hors de `App.tsx`.
- Des dépendances implicites capturées par fermeture peuvent devenir obsolètes
  après extraction.
- Reset et suppression combinent serveur, cache et session ; modifier leur ordre
  peut rendre une récupération impossible ou effacer trop tôt l état local.
- Les chemins conflit, reconnexion et leadership sont moins visibles qu un clic
  nominal et exigent des simulations dédiées.

## Handoff

Fournir la cartographie avant/après, les lots réellement extraits, les ports
typés de chaque contrôleur, les dépendances supprimées de `App.tsx`, les preuves
de non-duplication de l état canonique, les tests de panne/conflit/multi-onglets,
la taille et les responsabilités finales de la racine, les validations
automatisées et le résultat du contrôle utilisateur.
