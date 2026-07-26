---
id: CDI-060
title: Catalogue autoritaire et butin de boss
status: Later
area: domain
priority: P1
size: L
risk: high
source: Audit fonctionnel forge, craft, scrap et objets du 2026-07-26
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/zero-rebase-audit.md", "docs/architecture/inventory-domain.md", "docs/architecture/forge-domain.md", "src/data/items.ts", "src/data/bossLootTables.ts", "src/domain/authoritativeDungeon.ts", "supabase/functions/game-api/inventory-authority.ts"]
---

# CDI-060 - Catalogue autoritaire et butin de boss

## Objectif

Definir puis implementer un catalogue autoritaire unique pour tous les objets
et raccorder ensuite les tables de butin de boss et l acquisition de plans au
RNG canonique. Definir aussi les tables de butin des coffres ordinaires afin
que la qualite et le niveau des objets obtenables evoluent avec les etages.

## Resultat utilisateur

Chaque objet obtenu peut etre affiche, equipe, applique au combat, recycle ou
forge selon des regles explicites. Les boss attribuent des recompenses et des
plans coherents avec leur palier, persistants et rejouables. Les coffres
ordinaires proposent des objets et des qualites adaptes a l ascension, sans
conserver indefiniment les objets devenus trop faibles.

## Contexte

Le catalogue client contient 131 objets tandis que le serveur d equipement n
en reconnait que sept. Les coffres peuvent attribuer les 131 objets, mais 124
d entre eux sont refuses a l equipement autoritaire. Les classes Tier 1 ne
recalculent pas leurs statistiques lors des mutations d equipement et les
raretes ou modificateurs persistants ne sont pas appliques par le calcul
novice. Les tables de boss existent mais ne sont appelees par aucun moteur.
Le chemin autoritaire des coffres ordinaires choisit actuellement un objet
parmi les 131 references sans filtrage de niveau, puis force sa rarete a
`rare`. Il ne realise donc ni tirage de qualite ni progression du pool avec
les etages.

Ce chantier est autonome par rapport a la remise en etat immediate de la
forge novice. Sa phase de definition doit etre validee avant implementation.

## Perimetre autorise

- Etablir une source canonique unique partagee par les autorites et l UI.
- Inventorier et statuer sur les 131 objets existants.
- Definir identite, slot, niveau, classe, mains, rarete, modificateurs,
  statistiques, types de degats et provenance de chaque objet.
- Definir la semantique de rarete : fixe, mise a l echelle, generee ou
  persistante.
- Definir les contraintes de forgeabilite et de plans avances.
- Definir la migration des objets deja stockes ou equipes.
- Implementer le catalogue valide dans l autorite inventaire/equipement.
- Recalculer les statistiques de toutes les classes depuis les objets,
  raretes et modificateurs canoniques.
- Brancher les tables de boss au moteur de donjon et au RNG canonique.
- Filtrer les recompenses selon boss, etage, niveau et rarete decides.
- Definir des bandes d etages et une courbe de rarete evolutive pour les
  coffres ordinaires.
- Definir pour chaque bande une fenetre de niveaux d objet eligibles, excluant
  les objets trop puissants en debut d ascension puis les objets devenus trop
  faibles aux etages superieurs.
- Remplacer la rarete `rare` codee en dur des coffres par un tirage canonique
  et documenter le comportement de repli si aucun objet n est eligible.
- Attribuer et persister les plans par mutation serveur idempotente.
- Ajouter la matrice complete de tests catalogue, equipement, combat, loot,
  plans et replay.

## Hors perimetre

- Corriger la faille `inventory.add` et la forge novice, traitees par CDI-059.
- Ajouter de nouveaux objets avant validation des 131 objets existants.
- Reequilibrer globalement combat, progression ou economie hors consequences
  directes du catalogue valide.
- Implementer la phase de code avant validation explicite de la specification.

## Contrat d'implementation

- La phase E produit d abord une matrice objet/provenance/equipement et une
  decision d architecture approuvees.
- Aucun identifiant ou modificateur n est defini deux fois entre client et
  serveur.
- Toute mutation d equipement recalcule les statistiques canoniques de toutes
  les classes concernees.
- Les raretes et modificateurs affiches sont exactement ceux utilises par le
  combat autoritaire.
- La phase F ne commence qu apres validation et integration du catalogue.
- Un loot de boss consomme uniquement le RNG canonique, persiste son resultat
  et reste identique au replay.
- Pour un coffre ordinaire, le pool eligible est determine avant le tirage de
  l objet. Le tirage de qualite consomme uniquement le RNG canonique et aucune
  rarete n est forcee dans le moteur.
- Les seuils d etage, fenetres de niveau et poids de rarete sont portes par
  des donnees explicites, valides avant implementation, avec des limites et
  un comportement de pool vide documentes.
- Un plan obtenu est ajoute une fois et produit les memes autorisations UI et
  serveur.

## Dependances

Le chantier de definition du catalogue est autonome. Dans le ticket, la phase
F de loot de boss depend obligatoirement de la validation puis de l
implementation de la phase E.

## Criteres d'acceptation

- [ ] Une matrice des 131 objets et de leurs provenances est documentee et
      validee avant implementation.
- [ ] Le catalogue autoritaire possede une source unique sans duplication
      client/serveur.
- [ ] Chaque objet possede slot, contraintes et effets canoniques valides.
- [ ] Tous les objets obtenables sont equipables ou explicitement marques non
      equipables avec une raison produit.
- [ ] Les classes Novice et Tier 1 recalculent leurs statistiques apres
      equipement et desequipement.
- [ ] Raretes et modificateurs influencent affichage et combat de facon
      identique.
- [ ] Les sauvegardes existantes sont migrees ou refusees explicitement sans
      perte silencieuse.
- [ ] Chaque boss utilise sa table validee pour objets, materiaux et plans.
- [ ] Les coffres ordinaires utilisent une courbe de rarete evoluant avec les
      etages et un pool d objets filtre par niveau.
- [ ] Une epee de depart peut apparaitre en qualite commune, inhabituelle ou
      rare dans les premieres bandes, puis disparait du pool quand son niveau
      devient trop faible pour l etage.
- [ ] Les objets de niveau trop eleve ne peuvent pas apparaitre prematurement
      et le comportement sans objet eligible est explicite et teste.
- [ ] Loot, plans, RNG, F5 et replay sont couverts sans duplication.

## Tests

- Validation structurelle et unicite des 131 objets.
- Matrice niveau, classe, slot, mains, rarete et modificateurs.
- Tests equipement/desequipement et statistiques pour chaque famille.
- Tests de combat prouvant l effet des objets, raretes et modificateurs.
- Golden tests de loot pour chaque boss et chaque bande de rarete.
- Golden tests des coffres ordinaires aux limites de chaque bande d etages :
  pool eligible, exclusion bas/haut niveau, qualite et pool vide.
- Tests statistiques des poids de rarete valides, sans remplacer les golden
  tests deterministes du RNG canonique.
- Tests de migration, idempotence, F5 et replay.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Sur une sauvegarde controlee, obtenir et equiper un objet de chaque famille et
palier, comparer les statistiques avant/apres et le combat, vaincre chaque boss
representatif, relever objets, materiaux, plans et `rngState`, puis confirmer
la persistance apres F5 et le replay exact. Ouvrir aussi des coffres dans
chaque bande d etages et verifier l evolution des qualites ainsi que la
disparition progressive des objets de niveau trop faible.

## Preservation

- Preserver tous les identifiants persistants valides ou fournir une migration
  explicite.
- Preserver revision, atomicite, idempotence et RNG canonique.
- Preserver les comportements novice confirmes par CDI-059.
- Ne pas transformer les tables de donnees historiques en decisions produit
  implicites.

## Risques

- Le catalogue touche equipement, statistiques, combat, loot, forge,
  recyclage, sauvegardes et affichage.
- Une modification d identifiant peut rendre un objet persiste introuvable.
- Une double application de rarete ou de modificateurs fausserait fortement
  les statistiques.
- Le branchement des tables de boss peut modifier l economie et la sequence
  RNG de toutes les rencontres suivantes.
- Le filtrage par niveau et les courbes de rarete des coffres peuvent creer
  des pools vides, accelerer la puissance ou rendre certains objets
  inaccessibles si leurs seuils ne sont pas couverts.

## Handoff

Fournir la matrice validee, la decision d architecture, la strategie de
migration, la liste des objets actifs, les golden tests catalogue/boss, les
preuves de statistiques et combat, les etats RNG avant/apres, les validations
F5/replay et l audit fonctionnel pre-push.
