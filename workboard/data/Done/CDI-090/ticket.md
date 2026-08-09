---
id: CDI-090
title: Migrer l ecran Cite vers le design system
status: Done
area: frontend
priority: P1
size: M
risk: medium
source: Decoupage incremental de CDI-077
depends_on: ["CDI-076", "CDI-089"]
blocks: []
github_issue: null
related_docs: ["workboard/data/Doing/CDI-077/ticket.md", "workboard/data/Done/CDI-076/ticket.md", "workboard/data/Done/CDI-089/ticket.md", "docs/development/design-system.md", "docs/architecture/cdi-069-interface-architecture.md", "src/components/city", "src/ui"]
---

# CDI-090 - Migrer l ecran Cite vers le design system

## Objectif

Migrer la Cite, premier lot ordonne de CDI-077, vers les composants valides du
design system CDIdle sans modifier sa composition, ses commandes ni son etat
canonique.

## Resultat utilisateur

La Cite conserve exactement ses parcours de selection, amelioration,
affectation et forge, avec des panneaux et controles plus coherents avec les
autres ecrans et des etats accessibles uniformes.

## Contexte

CDI-076 fournit les fondations et composants v0.1. Compte, Aventuriers, Coffre
et Donjon deleguent deja leurs cadres principaux a `Panel`, tandis que les
quatre cadres de la Cite dupliquent encore fonds, bordures, rayons, titres et
ombres. Les actions et la progression locale recodent egalement des primitives
deja disponibles.

Ce sous-lot reste limite a l adoption prouvee sur la Cite. Il ne generalise pas
les compositions metier et n ajoute aucune variante au catalogue sans besoin
reel constate pendant la migration.

## Perimetre autorise

- Remplacer les cadres de Batiment selectionne, Batiments, Affectations et
  Forge par `Panel` directement ou par un adaptateur mince propre a la Cite.
- Migrer les actions d amelioration, d affectation et de Forge vers `Button`
  ou `IconButton` lorsque leur contrat couvre le besoin existant.
- Utiliser `Progress` et `Alert` pour l immigration et les etats metier qui
  correspondent a leurs intentions documentees.
- Preserver les ordres desktop/mobile, dimensions, zones scrollables et
  selection locale.
- Preserver les commandes canoniques, l optimisme, les erreurs, les etats
  verrouille, desactive et chargement.
- Mesurer avant/apres l adoption, les exceptions et les styles locaux restants.
- Ajouter ou ajuster les tests structurels et d interaction de la Cite.
- Produire les preuves responsive desktop/mobile et le controle clavier du lot.

## Hors perimetre

- Migrer Aventuriers, Donjon, Coffre, Compte ou les ecrans d entree.
- Modifier le gameplay, les couts, prerequis, commandes ou contrats serveur.
- Recomposer l architecture a trois zones de la Cite.
- Refaire la Forge ou son flux sequentiel.
- Creer un composant metier partage sans second usage prouve.
- Ajouter une variante au catalogue uniquement pour supprimer une classe locale.
- Supprimer des styles hors Cite.

## Contrat d'implementation

- `CityDashboard` conserve uniquement sa selection locale et son assemblage de
  page.
- Les projections restent dans `cityPresentation` et
  `forgePresentation`.
- Les primitives et composants du design system restent sans logique metier.
- Les libelles accessibles, tailles tactiles, focus, etats desactives et
  annonces existantes sont preserves ou ameliores.
- Une exception au design system reste locale, explicite et documentee si le
  composant partage ne couvre pas le besoin sans deformation.
- Toute nouvelle variante partagee est ajoutee au catalogue et testee.

## Dependances

- CDI-076 fournit les fondations, composants v0.1 et le catalogue prive.
- CDI-089 garantit que les cas d usage applicatifs de la Cite ne restent pas
  assembles dans `App.tsx`.
- CDI-077 porte l ordre global des migrations et recevra le bilan de ce lot.

## Criteres d'acceptation

- [x] Les quatre cadres principaux de la Cite utilisent `Panel` ou un
      adaptateur mince documente.
- [x] Les actions couvertes utilisent `Button` ou `IconButton` sans perte de
      semantique ni d etat.
- [x] Immigration et alertes utilisent les composants partages lorsqu ils
      correspondent au besoin.
- [x] Selection de batiment, amelioration, affectation et Forge conservent leur
      comportement.
- [x] Les etats verrouille, desactive, chargement, erreur et observateur restent
      comprehensibles.
- [x] La structure desktop et l ordre mobile valides par CDI-069 sont preserves.
- [x] Le clavier, le focus et les tailles tactiles restent conformes.
- [x] Les tests de rendu et d interaction de la Cite passent.
- [x] L adoption avant/apres, les exceptions et les styles restants sont
      documentes.
- [x] Toute variante partagee ajoutee apparait dans le catalogue.
- [x] Les preuves desktop et mobile sont produites et validees.
- [x] Aucun changement de gameplay ou de contrat canonique n est introduit.
- [x] Build et budget bundle restent conformes.

## Tests

- Tests de `CityDashboard`, selection, amelioration, affectation et Forge.
- Tests des etats verrouille, desactive, erreur et observateur.
- Recherche des cadres, boutons et styles locaux restants dans
  `src/components/city`.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run test:e2e`
- `npm.cmd run test:layout-browser`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`
- `git diff --check`

## Preuves techniques du 2026-08-09

- La navigation clavier des cartes de batiments est couverte par un test qui
  verifie la tabulation, l activation avec Entree, l etat `aria-pressed` et
  l absence de commande metier lors de la selection locale.
- Les controles partages et les cartes de batiments conservent une cible
  minimale de 44 px et un focus visible.
- `tests/CityDashboard.test.tsx` et `tests/uiComponents.test.tsx` : 27 tests
  passes.
- `npm.cmd run typecheck` et `npm.cmd run lint` : passes.
- `npm.cmd run build` : passe, 1902 modules transformes.
- `npm.cmd run check:bundle` : passe, 217371 octets gzip JavaScript et plus
  gros chunk de 121477 octets.

## Validation manuelle

Sur le frontend local, comparer la Cite avant/apres sur desktop et mobile,
verifier la selection de chaque batiment, les actions d amelioration et
d affectation, le flux Forge disponible, les etats observateur et verrouille,
le parcours clavier et l absence de debordement horizontal.

## Preservation

- Preserver la composition a trois zones et l historique de la Cite.
- Preserver toutes les informations, couts, prerequis et raisons de blocage.
- Preserver l autorite serveur, la projection optimiste et la restauration
  apres erreur.
- Preserver les surfaces hors Cite jusqu a leur propre lot CDI-077.

## Risques

- Une abstraction trop large pourrait masquer les besoins propres a la Forge.
- Le remplacement des elements racine peut modifier l ordre responsive ou les
  hauteurs alignees.
- Une variante visuelle partagee ajoutee trop vite pourrait contraindre les
  prochains ecrans.

## Handoff

Fournir les composants adoptes, les exceptions conservees, la mesure
avant/apres, les styles supprimes, les tests fonctionnels, les preuves
responsive et clavier, le budget bundle et la recommandation du prochain lot
CDI-077.
