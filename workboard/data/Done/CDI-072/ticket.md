---
id: CDI-072
title: Garantir et arbitrer la vocation T1 au niveau 10
status: Done
area: fullstack
priority: P1
size: L
risk: high
source: Retours alpha et decision produit du 2026-07-31
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "docs/architecture/novice-convergence.md", "docs/architecture/tier1-class-equipment.md", "shared/contracts/authoritative.ts", "src/domain/classTransition.ts", "src/domain/heroProgression.ts", "src/domain/authoritativeDungeon.ts", "supabase/functions/game-api/town-authority.ts", "src/App.tsx"]
---

# CDI-072 - Garantir et arbitrer la vocation T1 au niveau 10

## Objectif

Garantir l acces a une classe T1 des le niveau 10 tout en preservant
l orientation produite par les caracteristiques du heros et les batiments de
classe construits.

## Resultat utilisateur

Au niveau 10, un Novice ayant une vocation nettement dominante change
automatiquement de classe. Lorsque plusieurs vocations sont presque
equivalentes, le heros adresse une priere aux dieux et le joueur choisit parmi
les seules vocations compatibles avec son profil.

## Contexte

La convergence actuelle utilise des seuils absolus et des ecarts minimaux qui
peuvent repousser la vocation jusqu au niveau 13. Une simulation fixe de
10 000 Novices avec tous les batiments n a produit que 35,21 % de vocations au
niveau 10. Le couple Guerrier/Pugiliste converge egalement autour de 30/70.

La calibration finale par classe avec une fenetre relative de 1 % produit sur
le meme protocole un ecart maximal de 2,77 points, 83,56 % de vocations
automatiques et 16,44 % de prieres. Dans 99,74 % des cas, une des trois
meilleures affinites naturelles reste proposee.

## Perimetre autorise

- Normaliser puis calibrer l affinite des classes T1 a partir de leurs
  caracteristiques principales ordonnees et de leurs statistiques derivees.
- Filtrer les vocations selon les batiments de classe disponibles.
- Selectionner les classes situees dans une fenetre de 1 % du meilleur score.
- Appliquer automatiquement une vocation lorsqu une seule classe reste.
- Persister une priere lorsque plusieurs classes restent et laisser le joueur
  choisir uniquement parmi elles.
- Ajouter une commande canonique `hero.choose_vocation`.
- Suspendre l auto-donjon apres le combat qui declenche une priere.
- Empecher le heros en attente de repartir au donjon sans bloquer la ville ni
  les autres heros.
- Gerer plusieurs prieres de heros simultanement.
- Recuperer les Novices deja niveau 10 ou plus sans perte, reroll d XP ni
  duplication d equipement.
- Rendre le mecanisme de transition reutilisable pour les tiers T2 a T4.
- Documenter le remplacement de la convergence historique niveau 10 a 13.

## Hors perimetre

- Permettre un choix libre hors de la liste calculee.
- Ajouter les classes ou contenus T2, T3 et T4.
- Reequilibrer les objets attribues par CDI-068.
- Refaire l interface generale, traitee par CDI-069.
- Modifier les tables de butin de CDI-060.

## Contrat d'implementation

- L etat canonique contient une collection `pendingClassTransitions` capable
  de representer plusieurs heros et plusieurs tiers.
- Chaque attente persiste le heros, les tiers source et cible, la classe
  source, les candidats exacts et leur affinite. La liste ne doit pas etre
  recalculee au moment du choix.
- Le choix de classe ne consomme aucun tirage aleatoire.
- Pour une vocation automatique, l ordre RNG reste progression, competences,
  arme puis accessoire.
- Pour une priere, la progression est validee par la commande de donjon puis
  la commande de choix consomme les tirages competences, arme et accessoire.
- Le serveur valide l utilisateur, le heros, l attente, le tier cible et la
  presence de la classe choisie dans les candidats persistants.
- Classe, competences, equipement, retour des anciens objets au coffre,
  restauration et suppression de l attente sont appliques atomiquement.
- F5, multi-onglets, revision, idempotence et replay conservent le meme etat.
- Les Novices deja niveau 10 ou plus sont reconcilies en attente canonique
  sans modifier silencieusement leur classe ni consommer le RNG au bootstrap.

## Criteres d'acceptation

- [x] Tout Novice eligible recoit une vocation ou une priere des le niveau 10.
- [x] Sur le scenario fixe de 10 000 Novices avec tous les batiments, l ecart
      maximal entre classes ne depasse pas 3 points.
- [x] Au moins 80 % des transitions du scenario fixe sont automatiques.
- [x] Au moins 98 % des listes contiennent une des trois meilleures affinites
      naturelles.
- [x] Guerrier et Pugiliste restent tous deux accessibles sans domination
      structurelle de type 30/70.
- [x] Les batiments partiels ne proposent que les classes debloquees.
- [x] Une priere survit a F5 et reste identique dans plusieurs onglets.
- [x] Une commande rejouee ne duplique ni transition ni equipement.
- [x] Plusieurs heros en attente peuvent etre resolus independamment.
- [x] Un heros en attente ne repart pas au donjon ; les autres activites
      continuent.
- [x] Les Novices deja niveau 10 ou plus sont recuperes sans perte.
- [x] Le transcript distingue vocation automatique et priere aux dieux.

## Tests

- Simulation deterministe de 10 000 Novices avec tous les batiments.
- Scenarios Guerrier/Pugiliste et batiments partiels.
- Tests de transition automatique, priere simple et prieres multiples.
- Tests de validation et d idempotence de `hero.choose_vocation`.
- Tests F5, multi-onglets, replay et absence de duplication d instances.
- Test de reconciliation d un Novice existant niveau 10 ou plus.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Faire atteindre le niveau 10 a des Novices dans les cas vocation unique et
priere. Verifier la suspension du donjon, le choix, les competences et objets
attribues, puis confirmer le meme etat apres F5, second onglet et replay
autoritaire. Verifier aussi un Novice niveau 10 ou plus cree avant CDI-072.

Validation finale realisee : vocation dominante automatique, priere
Guerrier/Pugiliste, report et rappel, deux heros en attente, F5, affichage
multi-onglets en lecture seule, reprise du controle, choix atomique et replay
autoritaire sans duplication. Build valide par l utilisateur.

## Preservation

- Preserver les changements non commites de CDI-068.
- Preserver les identifiants d instance, le coffre et les restrictions de
  classe deja valides.
- Preserver l autorite serveur, l atomicite, la revision et le RNG canonique.
- Ne pas imposer une architecture purement fonctionnelle aux modules sans
  benefice concret.

## Dependances

Le ticket est techniquement autonome pour respecter les regles de flux du
board, mais il doit preserver et reutiliser le registre de transition et les
recompenses T1 en cours dans CDI-068. CDI-069 ne doit pas figer l interface de
vocation avant stabilisation de ce contrat.

## Risques

- Recalculer les candidats apres la priere rendrait le choix instable.
- Consommer le RNG pendant un bootstrap casserait le replay deterministe.
- Une migration incomplete laisserait les testeurs niveau 10 ou plus bloques.
- Une attente globale unique perdrait une transition lorsque plusieurs heros
  montent de niveau pendant le meme combat.

## Handoff

Fournir la formule calibree, les mesures statistiques, le contrat canonique de
priere, les preuves pour les sauvegardes existantes, F5, multi-onglets et
replay, ainsi que l ordre RNG final.

Cloture : formule, calibration et contrat documentes dans
`docs/architecture/novice-convergence.md`; tests globaux `390/390`, ecart
maximal `2,77 %`, transitions automatiques `83,56 %`, orientation naturelle
conservee `99,74 %` et preuves manuelles completes.
