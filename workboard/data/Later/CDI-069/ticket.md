---
id: CDI-069
title: Auditer et cadrer la refonte UI UX de l alpha
status: Later
area: frontend
priority: P1
size: L
risk: medium
source: Retour utilisateur du 2026-07-30 apres deploiement de l alpha
depends_on: ["CDI-068"]
blocks: []
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "src/App.tsx", "src/index.css", "src/components"]
---

# CDI-069 - Auditer et cadrer la refonte UI UX de l alpha

## Objectif

Auditer l experience actuelle de l alpha et definir une direction UI/UX
coherente avant de decouper la refonte en tickets d implementation.

## Resultat utilisateur

Le jeu devient plus lisible, plus pratique et visuellement coherent, avec une
navigation et des actions dont la priorite est evidente sur ordinateur comme
sur mobile.

## Contexte

L alpha est deployee et fonctionnelle, mais le retour utilisateur confirme
que son interface est peu lisible, peu pratique et visuellement insuffisante.
La refonte doit partir des parcours reels plutot que d une reecriture globale.

## Perimetre autorise

- Auditer navigation, architecture de l information, hierarchie visuelle,
  densite, lisibilite et retours d action.
- Auditer ville, aventuriers, donjon, coffre, forge et compte.
- Identifier les frictions des parcours principaux de l alpha.
- Examiner responsive, clavier, contrastes et accessibilite utile.
- Definir une direction visuelle, des composants communs et des regles de
  mise en page.
- Produire des wireframes ou maquettes des ecrans prioritaires.
- Decouper la mise en oeuvre en tickets ordonnes et testables.
- Identifier et proposer la suppression du code UI devenu mort ou redondant.

## Hors perimetre

- Reecrire tout le frontend dans ce ticket.
- Modifier les regles de jeu pour masquer un probleme d ergonomie.
- Ajouter des animations ou effets sans objectif fonctionnel valide.
- Choisir une direction finale sans validation utilisateur.

## Contrat d'implementation

- L audit precede toute modification structurelle de l interface.
- Chaque recommandation est reliee a une friction ou un objectif observable.
- Les propositions reutilisent le domaine et les contrats serveur existants.
- Les maquettes sont validees avant le decoupage final de l implementation.

## Dependances

Le cadrage commence apres CDI-068 afin d integrer les parcours T1 et leur
equipement dans l architecture cible.

## Criteres d'acceptation

- [ ] Les parcours principaux et leurs frictions sont inventories et classes.
- [ ] Les problemes sont relies a des preuves visuelles ou fonctionnelles.
- [ ] Une architecture de navigation cible est proposee.
- [ ] Une direction visuelle et un socle de composants sont proposes.
- [ ] Les ecrans prioritaires possedent des wireframes ou maquettes validables.
- [ ] Responsive et accessibilite possedent des criteres explicites.
- [ ] La refonte est decoupee en tickets avec ordre, dependances et criteres.
- [ ] Aucun chantier d implementation massif n est lance avant validation.

## Tests

- Verification desktop et mobile des propositions prioritaires.
- Inventaire des composants existants a conserver, fusionner ou supprimer.
- `npm.cmd run board:validate`

## Validation manuelle

Faire relire les parcours, la navigation cible et les maquettes par l
utilisateur, puis consigner les choix valides avant de creer les tickets d
implementation.

## Preservation

- Preserver les comportements fonctionnels et l autorite serveur valides.
- Preserver les informations indispensables des ecrans actuels.
- Ne pas coupler la direction visuelle a une technologie non decidee.

## Risques

- Une refonte sans priorisation peut produire beaucoup de code sans gain
  fonctionnel.
- Une direction uniquement esthetique peut conserver les frictions actuelles.
- Un remplacement global peut introduire des regressions difficiles a isoler.

## Handoff

Fournir l audit classe, les parcours cibles, les maquettes validees, la liste
des composants a conserver ou supprimer et le plan de tickets de mise en
oeuvre.
