---
id: CDI-068
title: Finaliser l equipement iconique des classes T1
status: Doing
area: domain
priority: P1
size: M
risk: medium
source: Decision produit du 2026-07-30 apres deploiement de l alpha
depends_on: []
blocks: ["CDI-069"]
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "docs/architecture/novice-convergence.md", "docs/architecture/inventory-domain.md", "src/data/heroes.ts", "src/data/items_weapons_tier1.ts", "src/data/items_accessories_tier1.ts", "src/types.ts"]
---

# CDI-068 - Finaliser l equipement iconique des classes T1

## Objectif

Choisir dans le catalogue existant une arme et un accessoire iconiques pour
chacune des neuf classes Tier 1, puis raccorder leur attribution au passage de
vocation sans creer de nouvel objet.

## Resultat utilisateur

Lorsqu un heros devient Guerrier, Voleur, Archer, Mage, Acolyte, Aede, Druide,
Artificier ou Pugiliste, il recoit un equipement coherent avec son identite de
classe, persistant et clairement identifiable.

## Contexte

Les vocations et competences Tier 1 existent deja. Les armes et accessoires
necessaires existent egalement dans le catalogue, mais aucune selection
iconique complete ni attribution de classe n est encore contractualisee.

## Perimetre autorise

- Documenter la matrice des neuf classes avec une arme et un accessoire deja
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

- La matrice des dix-huit associations est validee avant integration.
- Chaque attribution cree une instance d objet distincte avec un `instanceId`.
- Une meme transition de vocation rejouee ne cree aucun doublon.
- Les restrictions de classe sont identiques dans l UI et l autorite serveur.
- Aucun objet hors catalogue existant n est ajoute.

## Dependances

Le choix des objets peut commencer immediatement. Leur integration autoritaire
doit rester coherente avec la source canonique produite par CDI-060. CDI-069
attend la finalisation de ce socle fonctionnel avant de cadrer la refonte UI/UX.

## Criteres d'acceptation

- [ ] Les neuf classes possedent chacune une arme et un accessoire existants
      explicitement selectionnes.
- [ ] Les dix-huit associations sont documentees et validees.
- [ ] Le passage T1 attribue exactement les objets attendus sous forme d
      instances uniques.
- [ ] Les objets peuvent etre equipes, stockes et recycles selon les regles
      retenues.
- [ ] Les restrictions de classe sont refusees proprement par le serveur.
- [ ] Coffre plein, possession prealable et replay ont un comportement defini
      et teste.
- [ ] F5 conserve vocation, equipement, coffre et identifiants d instance.
- [ ] Les neuf classes sont couvertes sans duplication d attribution.

## Tests

- Tests de la matrice classe, arme et accessoire.
- Tests de vocation pour les neuf classes.
- Tests de restriction de classe et de stockage.
- Tests de coffre plein, doublon, idempotence et replay.
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
