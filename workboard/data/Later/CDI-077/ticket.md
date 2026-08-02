---
id: CDI-077
title: Migrer les ecrans et faire murir le design system CDIdle
status: Later
area: frontend
priority: P1
size: L
risk: high
source: Cadrage du refactor visuel CDIdle du 2026-08-01
depends_on: ["CDI-076", "CDI-081"]
blocks: []
github_issue: null
related_docs: ["workboard/data/Later/CDI-069/ticket.md", "workboard/data/Later/CDI-076/ticket.md", "src/App.tsx", "src/components", "src/index.css"]
---

# CDI-077 - Migrer les ecrans et faire murir le design system CDIdle

## Objectif

Migrer les ecrans CDIdle par lots limites et validables vers les fondations et
composants internes, faire emerger les patterns metier eprouves et mesurer l
adoption du design system, tout en conservant le fonctionnement du jeu a
chaque etape.

## Resultat utilisateur

Les ecrans deviennent progressivement plus coherents, lisibles, pratiques et
accessibles sans interruption globale ni regression des actions du jeu.

## Contexte

CDI-069 definit les parcours et l ordre de priorite. CDI-076 fournit les
fondations, la version v0.1 du design system et le catalogue. La migration ne
doit pas devenir une reecriture simultanee de tout le frontend : chaque lot
doit apporter un gain visible, rester testable, enrichir le systeme seulement
par les besoins prouves du jeu et pouvoir etre audite avant de poursuivre.

## Perimetre autorise

- Decouper la migration selon l ordre d ecrans valide dans CDI-069.
- Creer des sous-tickets par lot ou ecran lorsque le perimetre depasse une
  livraison auditable.
- Remplacer progressivement styles et structures dupliques par les composants
  de CDI-076.
- Completer la bibliotheque uniquement lorsqu un besoin reel apparait.
- Recolter les compositions repetees et eprouvees comme patterns metier
  documentes : amelioration, affectation, equipement, recompense, action
  optimiste ou mode observateur selon les besoins constates.
- Mesurer apres chaque lot les composants adoptes, les exceptions restantes
  et les styles encore hors systeme.
- Justifier toute exception au design system et decider si elle doit rester
  locale ou faire evoluer le systeme.
- Migrer boutons, champs, cartes, panneaux, menus, modales, infobulles,
  alertes, progressions, ressources et ameliorations selon leurs usages.
- Preserver les etats actifs, verrouilles, desactives, chargement et erreur.
- Ameliorer responsive, clavier, semantique et accessibilite dans chaque lot.
- Supprimer le code UI mort seulement apres preuve qu aucun consommateur ne
  subsiste.

## Hors perimetre

- Reecrire tous les ecrans en une seule livraison.
- Modifier le gameplay, les commandes ou l autorite serveur.
- Introduire des variantes non presentes dans les parcours valides.
- Transformer une exception unique en composant partage sans preuve de
  reutilisation.
- Supprimer des styles par recherche textuelle sans preuve de non-utilisation.
- Melanger un refactor visuel avec un chantier domaine sans ticket explicite.

## Contrat d'implementation

- Chaque lot possede un perimetre, des captures avant/apres et des criteres
  fonctionnels explicites.
- Le jeu reste utilisable et constructible apres chaque lot.
- Les composants partages restent sans logique metier autoritaire.
- Les ecrans conservent leurs donnees, commandes, erreurs et etats canoniques.
- Le responsive et l accessibilite sont testes pendant la migration, pas a la
  fin du chantier.
- Le code mort est retire uniquement dans le lot qui supprime son dernier
  consommateur.
- Toute extension des fondations est ajoutee au catalogue.
- Un pattern entre dans le design system seulement apres un usage reel et une
  preuve de reutilisation ou de valeur transversale.
- La maturite v0.2 correspond aux premiers patterns metier valides ; la v1
  correspond aux ecrans principaux migres et a une documentation fiable.
- Le taux d adoption sert a guider le nettoyage, pas a forcer artificiellement
  tous les ecrans dans une abstraction commune.

## Dependances

CDI-076 doit fournir des fondations validees, un catalogue utilisable et la
liste des premiers ecrans eligibles. CDI-081 doit avoir extrait le runtime
canonique de `App.tsx` afin que la migration visuelle ne renforce pas son
orchestration monolithique. L ordre exact des lots depend des conclusions de
CDI-069.

## Criteres d'acceptation

- [ ] La migration est decoupee en lots ordonnes et de taille auditable.
- [ ] Chaque lot conserve les comportements et contrats existants.
- [ ] Les composants reutilisables remplacent les duplications confirmees.
- [ ] Toute nouvelle variante apparait aussi dans le catalogue.
- [ ] Les patterns metier issus des ecrans migres sont documentes avec leurs
      usages et limites.
- [ ] Chaque lot fournit son adoption, ses exceptions et les styles restants.
- [ ] Les exceptions locales sont justifiees plutot que masquees.
- [ ] Les etats actifs, verrouilles, desactives, chargement et erreur restent
      comprehensibles.
- [ ] Desktop, mobile et clavier sont verifies apres chaque lot.
- [ ] Les regressions visuelles ou fonctionnelles bloquent le lot suivant.
- [ ] Les styles et composants morts sont retires avec une preuve de
      non-utilisation.
- [ ] Le bundle et les performances restent dans les budgets valides.
- [ ] Aucun changement de gameplay n est introduit pour compenser l UI.
- [ ] Le passage v0.2 puis v1 repose sur des criteres mesurables et non sur la
      seule quantite de composants disponibles.

## Tests

- Tests de rendu et d interaction des ecrans migres.
- Tests des commandes optimistes, erreurs, chargements et mode observateur.
- Captures comparatives desktop et mobile pour chaque lot.
- Verification clavier, focus, semantique et contrastes utiles.
- Recherche des derniers consommateurs avant chaque suppression.
- Controle de l adoption et des exceptions apres chaque lot.
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run test:e2e`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`

## Validation manuelle

Pour chaque lot, rejouer les parcours concernes sur desktop et mobile,
comparer avant/apres, tester clavier, chargement, erreurs et mode observateur,
puis confirmer le lot avant de migrer l ecran suivant.

## Preservation

- Preserver toutes les commandes, informations et erreurs utilisateur utiles.
- Preserver l autorite serveur, l optimisme UI et la synchronisation multi
  onglets.
- Preserver les surfaces non migrees jusqu a leur propre lot.
- Ne pas supprimer une compatibilite sans preuve et decision explicite.

## Risques

- Un lot trop large rendrait les regressions difficiles a isoler.
- Des composants trop generiques pourraient masquer les besoins metier.
- Une suppression prematuree peut casser un ecran rarement visite.
- Les changements de structure DOM peuvent degrader focus et tests existants.

## Handoff

Pour chaque lot, fournir perimetre, captures avant/apres, composants et
patterns ajoutes ou reutilises, taux d adoption, exceptions, styles supprimes,
preuves fonctionnelles, responsive et accessibilite, budget bundle, niveau de
maturite atteint et prochain lot recommande.
