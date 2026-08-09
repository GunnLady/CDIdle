---
id: CDI-076
title: Etablir le design system interne et le catalogue UI CDIdle
status: Later
area: frontend
priority: P1
size: L
risk: medium
source: Cadrage du refactor visuel CDIdle du 2026-08-01
depends_on: ["CDI-069"]
blocks: ["CDI-077"]
github_issue: null
related_docs: ["workboard/data/Doing/CDI-069/ticket.md", "src/index.css", "src/App.tsx", "src/components"]
---

# CDI-076 - Etablir le design system interne et le catalogue UI CDIdle

## Objectif

Mettre en place la version v0.1 du design system interne valide par CDI-069 :
principes applicables, fondations visuelles, composants essentiels,
documentation legere et catalogue executable, sans migrer massivement les
ecrans.

## Resultat utilisateur

L interface repose sur une identite coherente et les futures evolutions
utilisent des regles communes plutot que de nouveaux styles ponctuels.

## Contexte

Le refactor ne vise pas une bibliotheque generique separee. Les tokens et
premiers composants doivent emerger des besoins reels inventories dans
CDI-069. Une page catalogue est necessaire pour comparer les variantes,
tester les etats et valider la direction avant la migration des ecrans.
Le design system reste propre a CDIdle et code-first. Carbon et les design
systems publics inspirent son organisation, mais aucune dependance Carbon,
publication de package ou organisation multi-produits n est recherchee.

## Perimetre autorise

- Definir les tokens de couleurs, typographies, espacements, dimensions,
  bordures, rayons, ombres, couches et animations.
- Definir une architecture CSS explicite et une convention de nommage.
- Centraliser les fondations sans dupliquer une seconde source de verite.
- Materialiser les principes et le vocabulaire semantique valides par CDI-069.
- Organiser clairement tokens, primitives, composants, patterns et catalogue
  dans le frontend.
- Construire les premiers composants confirmes par l audit, notamment
  boutons, champs, cartes, panneaux, alertes et barres de progression.
- Construire uniquement les premieres compositions ou patterns necessaires
  pour prouver que les composants fonctionnent ensemble.
- Couvrir les etats normal, survol, focus, actif, verrouille, desactive,
  chargement, succes et erreur selon les besoins du composant.
- Ajouter une page catalogue accessible uniquement selon la strategie de
  build ou de navigation validee.
- Documenter l usage, les variantes et les limites des fondations.
- Documenter pour chaque composant son intention, ses usages, ses anti-usages,
  ses etats, son accessibilite et sa strategie de depreciation.
- Ajouter une gouvernance legere pour proposer, modifier, valider ou retirer
  un token, composant ou pattern.
- Integrer clavier, contrastes, reduction des animations et responsive.

## Hors perimetre

- Migrer tous les ecrans dans ce ticket.
- Construire des composants sans usage identifie dans CDIdle.
- Introduire une bibliotheque externe lourde sans decision explicite.
- Installer ou recopier Carbon, publier un package UI ou separer le design
  system dans un autre depot.
- Construire une gouvernance communautaire, multi-equipes ou multi-frameworks.
- Imposer Storybook, Figma ou un autre outil si le catalogue code repond au
  besoin reel.
- Modifier les regles de jeu ou les contrats autoritaires.
- Refaire simultanement la navigation et tous les parcours.

## Contrat d'implementation

- Les choix implementes proviennent des decisions validees dans CDI-069.
- La version v0.1 est un design system interne au produit, pas une bibliotheque
  generique destinee a etre distribuee.
- Les tokens sont semantiques et ne dependent pas d un seul ecran.
- Les composants exposent des variantes explicites et testables.
- Les primitives restent sans connaissance metier ; les patterns peuvent
  exprimer une composition propre au jeu sans copier de regle autoritaire.
- Le catalogue reutilise exactement les composants de production.
- Aucun composant ne copie une logique metier ou un contrat serveur.
- Le catalogue ne doit pas etre expose involontairement dans l alpha publique.
- Les fondations restent compatibles avec une migration ecran par ecran.

## Dependances

CDI-069 doit fournir l audit, les fondations proposees et la validation de la
direction visuelle avant implementation.

## Criteres d'acceptation

- [ ] Les tokens valides possedent une source unique et documentee.
- [ ] Les principes CDIdle et le vocabulaire semantique sont relies aux tokens
      et composants implementes.
- [ ] L architecture CSS cible est appliquee aux fondations sans duplication.
- [ ] Les premiers composants issus de l audit sont disponibles.
- [ ] L organisation distingue clairement primitives, composants et patterns.
- [ ] Chaque composant couvre ses etats fonctionnels pertinents.
- [ ] Chaque composant documente intention, usages, anti-usages et
      depreciation.
- [ ] La gouvernance legere du design system est disponible dans le depot.
- [ ] Focus clavier, contrastes et reduction des animations sont verifies.
- [ ] Les composants fonctionnent sur les largeurs cibles validees.
- [ ] Le catalogue affiche les variantes avec des donnees representatives.
- [ ] Le catalogue reutilise les composants reels et reste absent de l alpha
      publique selon la decision de build retenue.
- [ ] Aucun comportement de jeu ne change.

## Tests

- Tests de rendu et d interaction des composants initiaux.
- Tests des etats desactive, verrouille, chargement, erreur et focus.
- Verification des contrastes et de la navigation clavier utile.
- Verification visuelle desktop et mobile du catalogue.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`

## Validation manuelle

Ouvrir le catalogue sur desktop et mobile, parcourir toutes les variantes au
clavier et a la souris, comparer les fondations a la direction validee, puis
confirmer que le build alpha n expose pas une surface non prevue.

## Preservation

- Preserver les comportements fonctionnels et l autorite serveur.
- Preserver les informations indispensables des ecrans actuels.
- Preserver le budget de bundle ou documenter tout ecart rentable.
- Ne pas supprimer un style existant avant la migration de ses consommateurs.

## Risques

- Des tokens trop abstraits peuvent compliquer les usages simples.
- Un catalogue different de la production creerait une fausse preuve.
- Une fondation trop large avant migration produirait du code inutilise.
- Une exposition publique du catalogue augmenterait la surface de l alpha.

## Handoff

Fournir la version v0.1 du design system : principes appliques, tokens,
conventions CSS, organisation primitives/composants/patterns, composants
initiaux, documentation, gouvernance legere, variantes, tests, captures
desktop et mobile, mode d acces au catalogue et liste des ecrans prets pour
CDI-077.
