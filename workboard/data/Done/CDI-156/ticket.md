---
id: CDI-156
title: Produire et intégrer les poses de combat Artificier
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-144","CDI-148"]
blocks: ["CDI-123","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-combat-idle-sprite-workflow.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-156 — Produire et intégrer les poses de combat Artificier

## Objectif

Produire pour les dix hommes et dix femmes Artificier une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Artificier conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

## Contexte

La base neutre reste destinée au recrutement, au catalogue, au stockage et aux scènes hors combat. La pose de combat est un second asset persistant pendant l’affrontement ; elle n’est ni la compétence guard_stance, ni une pose d’attaque. Ce lot réutilise le standard validé par CDI-148 sans modifier le contrat de scène.

## Perimetre autorise

- Produire vingt poses de combat : dix hommes et dix femmes, index 0–9.
- Conserver pour chaque index le visage, la carnation, la coiffure, les couleurs, la tenue, l’arme ou l’accessoire de la base neutre.
- Garder dimensions, boîte alpha, pieds, pivot, direction et échelle compatibles avec la base neutre.
- Intégrer la sélection neutre/combat dans le catalogue de présentation et dans le vrai lecteur du cinéma.
- Utiliser la garde comme attente pendant un affrontement et comme état de retour après une action.

## Hors perimetre

- Pose d’attaque, de tir, de sort, de soin, de chant, de réaction ou de KO.
- Cycle de marche ou animation complexe.
- Modification de gameplay, de compétence, d’équipement réel ou de résultat autoritaire.
- Remplacement de la pose neutre dans le recrutement, le catalogue, le stockage ou les scènes hors combat.
- Déploiement frontend ou backend.

## Contrat d'implementation

- Commencer par un petit pilote contrasté et obtenir le verdict utilisateur avant la série complète.
- Une clé de pose explicite distingue neutral et combat_idle ; aucun choix ne dépend du texte traduit ou de l’équipement réel.
- La même clé d’identité et le même index sélectionnent les deux poses ; aucun visage générique ne remplace une variante.
- Le lecteur suit neutre → garde → action → garde → neutre en fin d’affrontement. Une pose d’action manquante retombe sur la garde, jamais sur une autre identité.
- La compétence guard_stance ajoute son geste ou son effet propre sans redéfinir la garde persistante.
- Charger uniquement les assets utiles à la scène et mesurer poids froid, cache chaud et mémoire décodée.

## Dependances

- CDI-144 : vingt bases neutres Artificier validées.
- CDI-148 : standard de pose de combat et intégration cinéma validé sur les Novices.

## Criteres d'acceptation

- [x] Un pilote contrasté est validé visuellement avant la production en série.
- [x] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [x] Identité, équipement visuel, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses.
- [x] Le cinéma affiche la garde pendant l’affrontement, revient en garde après chaque action et n’utilise la pose neutre qu’hors combat.
- [x] Recrutement, catalogue, stockage et autres scènes hors combat conservent la pose neutre.
- [x] La pose de combat ne remplace aucune pose d’action et ne modifie aucun résultat métier.
- [x] Alpha, chargement, cache, mémoire et budget de scène sont vérifiés ; le rendu est validé dans les écrans cinéma représentatifs.

## Tests

- Contrôler dimensions, alpha, boîte visible, pieds, pivots et correspondance stricte neutral/combat par clé.
- Tester la sélection de pose à l’entrée du combat, pendant l’attente, après une action et à la sortie de l’affrontement.
- Vérifier le repli sur la garde si une pose d’action manque et sur la pose neutre seulement hors combat.
- Exécuter les tests ciblés, npm.cmd run check:dungeon-visuals, npm.cmd run typecheck, npm.cmd run lint -- --quiet, npm.cmd run build, npm.cmd run check:bundle et npm.cmd run board:validate.

## Validation manuelle

L’utilisateur valide d’abord le pilote, puis les vingt correspondances neutral/combat et enfin le rendu dans les écrans du cinéma. Les tests complets et la documentation de livraison viennent après le verdict visuel.

## Preservation

- Conserver les vingt identités validées et leur équipement dessiné.
- Conserver compositions, placements, échelle et lisibilité des écrans cinéma.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Aucun déploiement n’est autorisé par ce ticket.

## Risques

- Dérive de visage, tenue, arme ou proportions entre la base et la garde.
- Saut visible de pivot ou d’échelle lors du changement de pose.
- Chargement des quarante images neutral/combat d’une classe alors que seules les identités présentes sont nécessaires.
- Confusion entre garde persistante, compétence guard_stance et vraie pose d’action.

## Validation locale — 27 septembre 2026

- Verdict utilisateur : « écran validé », après ajustement des tailles dans
  les cinq pages du harness cinéma Artificier. Il s'agit d'une validation
  visuelle utilisateur, pas d'une mesure réseau réalisée par Codex.
- Les vingt sources approuvées, PNG normalisés et WebP runtime sont reliés
  par genre/index et SHA-256 dans
  `assets/design/hero-sprites/cdi-156/manifest.json`.
- Les coefficients finaux sont dans `src/assets/artificerCdi156CombatPoses.ts`,
  avec les mêmes tableaux et accesseurs que les autres classes. Le relevé
  `assets/design/hero-sprites/cdi-156/face-calibration.json` distingue les
  estimations anatomiques initiales des corrections visuelles utilisateur.
- `scripts/review-cdi156-face-calibration.ps1` contrôle la concordance entre
  ce relevé, les coefficients runtime et les empreintes des images.
- Contrôles déterministes des assets réussis : vingt identités, alpha,
  dimensions, pieds à y=900 et hashes. WebP total : 1 973 354 octets ; quatre
  plus gros fichiers : 504 840 octets ; borne RGBA des quatre plus grandes
  images : 13 998 720 octets. Cette borne n'est pas la mémoire navigateur mesurée.
- Tests ciblés : 102 réussis dans `encounterVisuals`, `dungeonCombatScene`,
  `heroPortrait`, `heroPortraitFraming` et le contrôle de compatibilité inclus.
  Les vingt échelles attendues viennent du relevé approuvé, pas de la fonction
  testée. Le scénario existant entrée/garde/action/repli/sortie couvre aussi
  `Artificier_Male_9` et `Artificier_Female_0`.
- Typecheck, lint et build réussis. Budget JavaScript : 262 100 / 262 144 octets
  gzip, plus gros chunk 118 347 octets. Les imports explicites des neutres
  Artificier et Pugiliste remplacent les tables de chemins ; les mêmes images
  et leurs correspondances sont conservées et testées. Le résolveur partagé
  et le plafond du budget sont inchangés.
- Revue du test navigateur CDI-156 : attente du décodage réel, contrôle des
  quatre images utiles sans neutres parasites, budget froid et comparaison
  des transferts chaud/froid. Les limites visibles sont calculées depuis
  l'alpha (>32), sans confondre contenu et marges transparentes du fichier.

### Contrôle navigateur autorisé et exécuté

Autorisation utilisateur : « bas vas y », après explication du contrôle.
Chromium Playwright : un test réussi, couvrant les cinq pages, les vingt
identités et 1440/1280/1024/512 px (512 représente ici le contrôle étroit du
zoom PC 200 %, pas une promesse de support mobile).

Le premier passage a détecté 21,87 px de fusil M02 rognés à 512 px. Correction
dans le modèle de présentation : position horizontale plafonnée à 81 % dans
la disposition zoomée pour M02, indices persistés 1 et 11. Les trois autres
slots, l'échelle et les positions PC standard restent identiques, vérifiés
par deux cas unitaires. Le passage final ne détecte aucun contenu visible
hors scène sur les vingt combinaisons page/largeur.

| Page | Transfert froid, octets | Transfert chaud, octets | Surface RGBA calculée, octets |
| --- | ---: | ---: | ---: |
| 1 | 398 278 | 1 200 | 10 944 320 |
| 2 | 397 986 | 1 200 | 10 414 400 |
| 3 | 367 620 | 1 200 | 8 787 840 |
| 4 | 442 168 | 1 200 | 10 561 600 |
| 5 | 373 302 | 1 200 | 8 633 280 |

Mesures Resource Timing réelles sur le serveur Vite local ; la surface RGBA
est calculée depuis les dimensions effectivement décodées, pas une mesure
de mémoire totale Chromium/GPU. Ces résultats ne démontrent pas le cache
HTTP de production. Captures et relevés détaillés : `.tmp/cdi156-browser-final/`.
La configuration Playwright permet de conserver le harness par opt-in local
`CDIDLE_REUSE_LAYOUT_SERVER=1` ; la CI conserve son serveur isolé.

Aucun commit, push ou déploiement n'est inclus dans cette validation locale.

## Clôture — 29 septembre 2026

Ticket clos et tous les critères cochés sur décision explicite de l’utilisateur.
La reconstitution des traces documentaires du pilote n’est pas requise pour
cette clôture. Les validations locales ci-dessus conservent leur portée.

## Handoff

Fournir références et prompts versionnés, table neutral/combat par genre et index, sources/exports, mesures, tests et verdicts utilisateur. Aucune pose d’action, réaction ou KO n’est déclarée livrée par ce lot.
