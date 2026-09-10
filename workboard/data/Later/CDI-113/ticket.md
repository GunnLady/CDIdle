---
id: CDI-113
title: Animer les compétences, projectiles et soins du combat
status: Later
area: ui
priority: P1
size: M
risk: medium
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-103","CDI-106"]
blocks: ["CDI-114"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/components/dungeon/CurrentEncounterPanel.tsx","shared/domain/undercity-combat.ts","src/ui/foundations/tokens.css","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/components/HeroPortrait.tsx","shared/domain/undercity.ts","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md"]
---

# CDI-113 — Animer les compétences, projectiles et soins du combat

## Objectif

Enrichir le combat déjà intégré avec compétences, projectiles, soins et impacts multiples fidèles.

## Resultat utilisateur

Le joueur distingue tir, magie, soin et multi-frappe sur les bonnes cibles.

## Contexte

M réutilise le lecteur et le combat CDI-103, ainsi que les données CDI-106. Ce ticket ne reconstruit ni le moteur ni les statuts.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Étendre le combat déjà intégré : tir, sort offensif, soin allié/soutien ennemi,
multi-frappe et dégâts multicibles, avec les effets génériques nécessaires.
Profils tirés de l'action reçue, bons auteurs/cibles, nombres/jauges au même
instant ; coûts de mana exacts et pas d'impacts inventés. Inclure provenance/
poids des effets, plafonds de rendu, mouvements réduits et vérification visuelle
sur le vrai Donjon. S'appuyer sur 106 ; ne pas reconstituer les statuts non
tracés, qui appartiennent à 114.

## Hors perimetre

- Scène de base : CDI-101 ; statuts/intentions/protection : CDI-114.
- Nouvelle compétence, probabilité, coût de mana ou cible inventée.
- Refonte des héros ou dépendance à toute la bibliothèque ennemie.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Choisir les profils à partir de l'action structurée, pas d'un nom français ou d'une classe supposée.
- Synchroniser projectiles, impacts, PV/PM et nombres à partir de la même chronologie ; préserver l'ordre des multi-frappes.
- Les effets génériques ajoutés sont documentés en provenance/poids, avec ancrages, fallback et nettoyage.
- Garder 16 effets temporaires maximum, commandes dégagées, informations HTML et reduced-motion.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-103 : Intégrer le premier combat et sécuriser son cycle de lecture.
- CDI-106 : Compléter les traces et projections de ressources et de cibles.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Tir, sort offensif, soin allié, soutien ennemi, multi-frappe et dégâts multicibles sont intégrés au vrai Donjon.
- [ ] Chaque action vise le bon acteur, affiche mana et valeurs exactes et n'invente aucun impact supplémentaire.
- [ ] La compétence létale garde la cible touchée même avec un survivant suivant.
- [ ] Les profils restent lisibles à quatre héros/trois ennemis ; nombres/jauges/impacts sont synchronisés.
- [ ] Effets bornés, actifs seulement en vue, nettoyés et accessibles en mouvements réduits ; poids/provenance documentés.
- [ ] L'utilisateur valide un combat mêlant les familles avancées, sans masquer commandes ou résultat.

## Tests

- Tests de mapping action/profil et composants sur cibles, ordre/instants des impacts et ressources.
- Fixtures de CDI-106 : soins, multi-frappes, mana, multicibles et compétence létale.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Dans le vrai Donjon, l'utilisateur valide tir/magie/soin, soutien ennemi, multi-frappe et attaque multicible ; relever rythme et lisibilité.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une explosion décorative supplémentaire peut faire croire à des dégâts non reçus.
- Superposition de nombres qui empêche d'identifier la cible.

## Handoff

Fournir profils intégrés, catalogue des effets/provenance, preuves de cibles/valeurs et avis utilisateur. V02/V03/V04/V14/V18. CDI-114 ajoute ensuite les statuts persistants.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
