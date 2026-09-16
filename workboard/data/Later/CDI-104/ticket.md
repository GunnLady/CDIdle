---
id: CDI-104
title: Consolider la recette et préparer la livraison des rencontres 2D
status: Later
area: quality
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - recadrage selon le plan amélioré
depends_on: ["CDI-116"]
blocks: []
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","docs/development/supabase-egress-budget.md","docs/development/ci-quality.md","scripts/check-bundle-budget.mjs","scripts/test-temporal-concurrency.mjs","tests/browser/canonicalPipeline.browser.spec.ts","tests/browser/dungeonPage.responsive.browser.spec.ts","AGENTS.md","docs/development/dungeon-2d-action-production-plan.md"]
---

# CDI-104 — Consolider la recette et préparer la livraison des rencontres 2D

## Objectif

Consolider la recette du remplacement complet et préparer une livraison sans écart réel non corrigé.

## Resultat utilisateur

Les neuf types de rencontre sont lisibles, fidèles, accessibles et robustes sur tout le contenu actuel, avec gestes simples et seules poses utiles. Les 36 compétences et toutes les bases sont couvertes, sans exiger 400 animations dessinées.

## Contexte

M consolide les preuves produites ticket par ticket et les mesures CDI-116. Il ne reporte pas ici l'implémentation ou les tests propres aux autres lots.

Périmètre révisé le 13 septembre selon dungeon-2d-action-production-plan.md ; l’ancien découpage reste historique. La convergence des familles CDI-118–128 et des retouches A1/A2 est prouvée par CDI-135 ; les huit non-combats par 102/115/129–134.

## Perimetre autorise

Consolider les preuves V01–V18 déjà obtenues au fil des tickets, leur date,
environnement et limite ; effectuer une régression ciblée du produit complet
et réunir le verdict visuel final. Contrôler neuf types intégrés, toutes zones,
actions, ancien/nouveau contrat, accessibilité, documentation et audit pré-push.
Vérifier l'intégration Supabase/concurrence sur la version complète et utiliser
les mesures 116 ; aucune mesure simulée ne vaut un FPS réel. Ne pas transformer
ce ticket en réservoir d'implémentations oubliées : rouvrir/tracer chez le
propriétaire et ne pas clôturer avec un écart réel non corrigé. Publication
éventuelle et CI restent distinctes, soumises aux confirmations du projet.

## Hors perimetre

- Créer les fonctionnalités oubliées dans une recette fourre-tout : attribuer les écarts à leur propriétaire et les corriger avant clôture.
- Déduire FPS/egress d'une simulation, relever silencieusement les budgets ou présumer une validation visuelle ancienne acquise.
- Commit, push, CI distante et déploiement hors séquence explicitement autorisée.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Autonomie technique/Git limitée au chantier selon AGENTS.md ; aucun déploiement sans contre-ordre explicite.

## Contrat d'implementation

- Relier V01–V18 à une preuve datée, son environnement, sa provenance Codex/utilisateur et sa limite.
- Contrôler tous les tickets source terminés via CDI-116 ; les replis intermédiaires du pilote doivent avoir été remplacés par la couverture promise.
- Les fallbacks historiques/ressources défaillantes restent légitimes, mais ne remplacent pas le rendu complet des neuf types actuels.
- Auditer omissions, régressions, compatibilité front et code mort sans refactor collatéral ; présenter les écarts avant correction selon AGENTS.md.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-116 : Mesurer et stabiliser les performances des scènes complètes.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Le graphe révisé est terminé : CDI-135 pour le combat, CDI-129–134 pour les autres scènes et tous les tickets artistiques ajoutés après CDI-117 ; aucune retouche réelle non tracée ou non validée.
- [ ] V01–V18 sont tous reliés à des preuves suffisantes et actuelles ; aucun écart réel non corrigé ne reste ouvert sous couvert d'un test vert.
- [ ] Neuf types intégrés, huit non-combats avec branches applicables, 200 identités visuelles et les 400 clés historiques compatibles, trente blueprints et cinq ambiances sont effectivement couverts.
- [ ] Quatre héros/trois ennemis, compétences, Roi/gardes, repos/réanimation et épreuves sont validés visuellement par l'utilisateur à 1024/1280/1440 px et au zoom 200 %.
- [ ] Le pipeline Supabase local sur version complète prouve contrats ancien/nouveau, persistance, replay et concurrence sans double progression.
- [ ] Les mesures CDI-116 respectent les budgets ou une révision explicite documentée est acceptée ; aucun FPS réel n'est présenté comme mesuré par une simulation.
- [ ] Documentation, handoff et audit pré-push sont complets ; validation fonctionnelle, commit, push, CI et déploiement restent distingués.

## Tests

- npm.cmd run check:determinism
- npm.cmd test -- --run
- npm.cmd run test:egress-budget
- npm.cmd run test:integration (Supabase local requis).
- npm.cmd run test:db (si contrat/migration DB concerné).
- npm.cmd run test:layout-browser et npm.cmd run test:browser selon l'autorisation navigateur du projet.
- npm.cmd run build
- npm.cmd run check:bundle
- git diff --check
- Régression ciblée sur le produit complet, en réutilisant les preuves des tickets et les mesures CDI-116.
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Réunir le verdict visuel final de l'utilisateur et les contrôles interactifs requis. Pour une capacité indisponible, fournir terminal PowerShell, commande, URL, objectif et preuve attendue ; ne pas remplacer cette preuve par une supposition.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Autonomie technique/Git du chantier selon AGENTS.md ; contrôles visuels par l’utilisateur ; zéro déploiement sans contre-ordre explicite.

## Risques

- Une checklist complète sans environnement/date ne prouve pas le résultat livré.
- Des assertions héritées du transcript peuvent rester vertes sans vérifier la scène.

## Handoff

Actualiser plan et matrice V01–V18 avec preuves, métriques, verdict utilisateur et procédure de repli. Décrire distinctement toute publication autorisée et utiliser cdidle-ci-monitor si une CI distante doit alors être suivie.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
