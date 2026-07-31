---
id: CDI-068
title: Finaliser les recompenses d equipement des classes T1
status: Done
area: domain
priority: P1
size: M
risk: medium
source: Decision produit du 2026-07-30 apres deploiement de l alpha
depends_on: []
blocks: ["CDI-069"]
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "docs/architecture/novice-convergence.md", "docs/architecture/inventory-domain.md", "docs/architecture/tier1-class-equipment.md", "src/data/heroes.ts", "src/data/items_weapons_tier1.ts", "src/data/items_accessories_tier1.ts", "src/data/tier1ClassEquipment.ts", "src/domain/heroProgression.ts", "src/domain/classTransition.ts", "src/types.ts"]
---

# CDI-068 - Finaliser l equipement iconique des classes T1

## Objectif

Definir dans le catalogue existant des pools d armes et d accessoires coherents
pour chacune des neuf classes Tier 1, puis tirer et attribuer une recompense au
passage de vocation sans creer de nouvel objet.

## Resultat utilisateur

Lorsqu un heros devient Guerrier, Voleur, Archer, Mage, Acolyte, Aede, Druide,
Artificier ou Pugiliste, il recoit une arme et un accessoire tires dans les
pools de sa classe, persistants et clairement identifiables.

## Contexte

Les vocations et competences Tier 1 existent deja. Les armes et accessoires
necessaires existent egalement dans le catalogue, mais aucune selection
iconique complete ni attribution de classe n est encore contractualisee.

## Pools valides

- Guerrier : armes `basic_sword`, `basic_axe`, `basic_mace`, `basic_spear` ;
  accessoires `sturdy_travel_belt`, `patched_field_belt`,
  `knotted_leather_bracelet`.
- Voleur : armes `basic_dagger`, `basic_saber` ; accessoires
  `dusty_travel_cloak`, `ashwood_bracelet`, `cracked_coin_charm`.
- Archer : armes `basic_shortbow`, `basic_longbow`, `basic_crossbow` ;
  accessoires `knotted_leather_bracelet`, `ashwood_bracelet`,
  `windworn_cloak`.
- Mage : armes `basic_wand`, `basic_staff`, `basic_spellbook` ; accessoires
  `silver_ring`, `copper_focus_ring`, `warm_ember_amulet`.
- Acolyte : armes `basic_mace`, `basic_staff`, `basic_spellbook` ; accessoires
  `silver_ring`, `warm_ember_amulet`, `riverstone_amulet`.
- Aede : arme `basic_lute` ; accessoires `silver_ring`, `lucky_charm`,
  `windworn_cloak`.
- Druide : arme `basic_staff` ; accessoires `riverstone_amulet`,
  `ashwood_bracelet`, `windworn_cloak`.
- Artificier : armes `basic_gear_cannon`, `basic_rifle`, `basic_crossbow` ;
  accessoires `copper_focus_ring`, `warm_ember_amulet`,
  `cracked_coin_charm`.
- Pugiliste : armes `basic_knuckles`, `basic_gauntlets`, `basic_bo` ;
  accessoires `ashwood_bracelet`, `knotted_leather_bracelet`,
  `sturdy_travel_belt`.

## Perimetre autorise

- Documenter les pools des neuf classes avec des armes et accessoires deja
  presents dans le catalogue.
- Valider niveau requis, statistiques, rarete et identite produit de chaque
  association.
- Definir et appliquer les restrictions de classe necessaires.
- Attribuer des instances uniques lors de la vocation T1.
- Definir le comportement si le coffre est plein ou si le heros possede deja
  l objet attendu.
- Raccorder equipement du heros, coffre, forge, recyclage et affichage aux
  memes identifiants canoniques.
- Garantir idempotence, replay, F5 et absence de double attribution.
- Couvrir les neuf classes par des tests.
- Coordonner les donnees retenues avec le catalogue autoritaire de CDI-060.

## Hors perimetre

- Creer de nouveaux objets.
- Reequilibrer tout le catalogue ou l economie generale.
- Refaire l interface d equipement, traite dans le chantier UI/UX ulterieur.
- Implementer les courbes de butin et tables de boss de CDI-060.

## Contrat d'implementation

- Les pools valides sont la source unique partagee par le frontend et le
  serveur.
- Toute source d XP utilise `applyHeroProgression`. Le calcul des niveaux, la
  resolution de transition et la politique de recompense restent separes.
- La politique `0->1` est la premiere implementation d un registre extensible
  aux transitions de tiers futures.
- Chaque vocation consomme apres les rolls de competences un roll d arme puis
  un roll d accessoire, y compris pour un pool d arme singleton.
- Chaque attribution cree une instance d objet distincte avec un `instanceId`.
- Une meme transition de vocation rejouee ne cree aucun doublon.
- Les restrictions de classe sont identiques dans l UI et l autorite serveur.
- Aucun objet hors catalogue existant n est ajoute.
- Le coffre est sans capacite maximale : les anciens objets y retournent sans
  pouvoir bloquer la vocation.
- Une possession du meme modele avec un autre `instanceId` est conservee et n
  annule pas la recompense de vocation.

## Dependances

Le choix des objets peut commencer immediatement. Leur integration autoritaire
doit rester coherente avec la source canonique produite par CDI-060. CDI-069
attend la finalisation de ce socle fonctionnel avant de cadrer la refonte UI/UX.

## Criteres d'acceptation

- [x] Les neuf classes possedent chacune des pools d armes et d accessoires
      existants explicitement selectionnes.
- [x] Aede utilise uniquement `basic_lute` et Druide uniquement `basic_staff` ;
      les sept autres classes possedent au moins deux armes possibles.
- [x] Chaque vocation tire exactement une arme et un accessoire dans les pools
      de sa classe apres les rolls de competences.
- [x] Le passage T1 attribue exactement les objets attendus sous forme d
      instances uniques.
- [x] Les objets peuvent etre equipes, stockes et recycles selon les regles
      retenues.
- [x] Les restrictions de classe sont refusees proprement par le serveur.
- [x] L absence de capacite du coffre, la possession prealable et le replay ont
      un comportement defini et teste.
- [x] F5 conserve vocation, equipement, coffre et identifiants d instance.
- [x] Les neuf classes sont couvertes sans duplication d attribution.

## Tests

- Tests des pools de classe, armes et accessoires.
- Tests de vocation pour les neuf classes.
- Tests de restriction de classe et de stockage.
- Tests d absence de capacite, doublon, idempotence et replay.
- Tests de persistance apres F5.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Faire evoluer un heros de chaque classe T1, verifier les deux objets attribues,
leurs identifiants d instance, leur equipement ou stockage, puis confirmer le
meme etat apres F5 et replay.

Validation finale : les neuf classes sont couvertes par les tests deterministes.
Les parcours manuels Mage et Pugiliste ont confirme attribution, equipement,
F5 et replay. Le replay Pugiliste conserve une ligne de commande et une seule
occurrence de chaque instance d arme et d accessoire (`1/1/1`).

## Preservation

- Preserver les identifiants des objets existants.
- Preserver revision, atomicite, idempotence et RNG canonique.
- Preserver les vocations et competences T1 deja validees.

## Risques

- Une attribution non idempotente dupliquerait des objets au replay.
- Une restriction uniquement cote client permettrait un equipement invalide.
- Un objet choisi mais absent du catalogue serveur bloquerait l attribution.

## Handoff

Fournir la matrice validee, les decisions de doublon et coffre plein, les
preuves des neuf classes, les identifiants d instance et les validations F5 et
replay.

Cloture : matrice et decisions documentees dans
`docs/architecture/tier1-class-equipment.md`; tests globaux `390/390`, build
utilisateur valide, replay et absence de duplication verifies manuellement.
