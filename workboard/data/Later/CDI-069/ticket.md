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
blocks: ["CDI-076"]
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "src/App.tsx", "src/index.css", "src/components"]
---

# CDI-069 - Auditer et cadrer la refonte UI UX de l alpha

## Objectif

Auditer l experience, l architecture frontend et le systeme visuel actuels de
l alpha, puis definir une direction UI/UX coherente avant toute modification
structurelle ou migration d ecran.

## Resultat utilisateur

Le jeu devient plus lisible, plus pratique et visuellement coherent, avec une
navigation et des actions dont la priorite est evidente sur ordinateur comme
sur mobile.

## Contexte

L alpha est deployee et fonctionnelle, mais le retour utilisateur confirme
que son interface est peu lisible, peu pratique et visuellement insuffisante.
Le frontend doit faire l objet d un refactor visuel et structurel important,
en faisant emerger une bibliotheque propre a CDIdle depuis les besoins reels.
La refonte doit partir des parcours existants plutot que d une reecriture
globale ou d une bibliotheque generique deconnectee du jeu.

## Perimetre autorise

- Auditer navigation, architecture de l information, hierarchie visuelle,
  densite, lisibilite et retours d action.
- Documenter la technologie, la structure frontend et les frontieres entre
  orchestration, ecrans, composants, domaine et styles.
- Cartographier l organisation du CSS, les conventions de classes, les styles
  repetes et les composants existants.
- Auditer ville, aventuriers, donjon, coffre, forge et compte.
- Identifier les frictions des parcours principaux de l alpha.
- Identifier les principales dettes visuelles et structurelles sans modifier
  les fichiers audites.
- Examiner responsive, clavier, contrastes et accessibilite utile.
- Proposer les fondations visuelles initiales : couleurs, typographies,
  espacements, bordures, ombres et animations.
- Identifier les premiers composants communs : boutons, champs, cartes,
  panneaux, menus, modales, infobulles, alertes, progressions, ressources et
  ameliorations.
- Definir les variantes actives, verrouillees, desactivees et en chargement.
- Proposer des regles de mise en page et une architecture CSS cible.
- Produire des wireframes ou maquettes des ecrans prioritaires.
- Decouper la mise en oeuvre en lots progressifs ordonnes et testables.
- Identifier et proposer la suppression du code UI devenu mort ou redondant.

## Hors perimetre

- Reecrire tout le frontend dans ce ticket.
- Modifier le CSS, les composants ou les ecrans pendant l audit.
- Modifier les regles de jeu pour masquer un probleme d ergonomie.
- Ajouter des animations ou effets sans objectif fonctionnel valide.
- Choisir une direction finale sans validation utilisateur.

## Contrat d'implementation

- L audit precede toute modification structurelle de l interface.
- Les faits observes, hypotheses et recommandations sont distingues.
- Chaque recommandation est reliee a une friction ou un objectif observable.
- Les propositions reutilisent le domaine et les contrats serveur existants.
- La bibliotheque cible reste interne a CDIdle et emerge des ecrans reels.
- La migration cible est progressive et maintient le jeu fonctionnel apres
  chaque lot.
- Les maquettes sont validees avant le decoupage final de l implementation.

## Dependances

Le cadrage commence apres CDI-068 afin d integrer les parcours T1 et leur
equipement dans l architecture cible.

## Criteres d'acceptation

- [ ] Les parcours principaux et leurs frictions sont inventories et classes.
- [ ] La technologie et la structure frontend actuelles sont documentees.
- [ ] Le CSS et les composants existants sont cartographies.
- [ ] Les repetitions, incoherences et composants reutilisables sont listes.
- [ ] Les dettes visuelles et structurelles sont classees par impact et risque.
- [ ] Les problemes sont relies a des preuves visuelles ou fonctionnelles.
- [ ] Une architecture de navigation cible est proposee.
- [ ] Une direction visuelle, des fondations et les premiers composants sont
      proposes.
- [ ] Les ecrans prioritaires possedent des wireframes ou maquettes validables.
- [ ] Responsive et accessibilite possedent des criteres explicites.
- [ ] La refonte est decoupee entre fondations, catalogue et migration par lots.
- [ ] Aucun chantier d implementation massif n est lance avant validation.

## Tests

- Verification desktop et mobile des propositions prioritaires.
- Inventaire des composants existants a conserver, fusionner ou supprimer.
- Releve des tailles, duplications CSS et structures d ecrans sans mutation.
- `npm.cmd run board:validate`

## Validation manuelle

Faire relire l audit concis, les parcours, les fondations proposees, la
navigation cible et les maquettes par l utilisateur, puis consigner les choix
valides avant CDI-076.

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

Fournir les faits observes, hypotheses et recommandations, l audit classe,
les parcours cibles, les maquettes validees, les fondations proposees, la
liste des composants a conserver ou supprimer et l ordre des lots de mise en
oeuvre.
