---
id: CDI-148
title: Produire et intégrer les poses de combat Novice
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-136"]
blocks: ["CDI-113","CDI-118","CDI-125","CDI-128","CDI-135","CDI-149","CDI-150","CDI-151","CDI-152","CDI-153","CDI-154","CDI-155","CDI-156","CDI-157"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/session-2026-09-15-cdi-148-combat-poses-handoff.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-148 — Produire et intégrer les poses de combat Novice

## Objectif

Produire pour les dix hommes et dix femmes Novice une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Novice conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

## Contexte

La base neutre reste destinée au recrutement, au catalogue, au stockage et aux scènes hors combat. La pose de combat est un second asset persistant pendant l’affrontement ; elle n’est ni la compétence guard_stance, ni une pose d’attaque. Ce lot fixe le standard réutilisable par les neuf autres classes T1.

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

- CDI-136 : vingt bases neutres Novice validées.

## Criteres d'acceptation

- [x] Un pilote contrasté est validé visuellement avant la production en série.
- [x] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [x] Identité, équipement visuel, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses.
- [x] Le cinéma affiche la garde pendant l’affrontement, revient en garde après chaque action et n’utilise la pose neutre qu’hors combat.
- [x] Recrutement, catalogue, stockage et autres scènes hors combat conservent la pose neutre.
- [x] La pose de combat ne remplace aucune pose d’action et ne modifie aucun résultat métier.
- [x] Alpha, chargement, cache, mémoire et budget de scène sont vérifiés ; le rendu est validé dans les écrans cinéma représentatifs.

## Preuves de cloture — 16 septembre 2026

- Les dix hommes et dix femmes ont été validés individuellement par
  l’utilisateur, puis contrôlés après détourage sur fonds clair et sombre.
- L’utilisateur a validé la composition représentative du cinéma, ses gardes,
  échelles, pieds, placements et transitions.
- Les vingt exports runtime mesurent `341 × 692`, partagent la ligne de pieds
  `y = 673`, restent centrés et ne contiennent ni coin opaque ni résidu chroma
  clair détecté.
- Poids runtime : `5 274 533` octets pour les vingt poses ; pire groupe de
  quatre : `1 204 652` octets, sous le budget artistique de 2 Mio.
- Cache navigateur mesuré : `5 280 533` octets à froid et `0` octet au second
  chargement avec la politique `immutable`.
- Mémoire RGBA théorique : `943 888` octets par pose et `3 775 552` octets pour
  quatre héros.
- Validations réussies : 65 tests Vitest ciblés, 7 tests Playwright du vrai
  lecteur, `check:dungeon-visuals`, typecheck, lint, build et budget du bundle.
- La pose de victoire évoquée après validation est différée et tracée dans le
  handoff ; elle ne bloque pas ce ticket.

## Tests

- Contrôler dimensions, alpha, boîte visible, pieds, pivots et correspondance stricte neutral/combat par clé.
- Tester la sélection de pose à l’entrée du combat, pendant l’attente, après une action et à la sortie de l’affrontement.
- Vérifier le repli sur la garde si une pose d’action manque et sur la pose neutre seulement hors combat.
- Exécuter les tests ciblés, npm.cmd run check:dungeon-visuals, npm.cmd run typecheck, npm.cmd run lint -- --quiet, npm.cmd run build, npm.cmd run check:bundle et npm.cmd run board:validate.

## Validation manuelle

L’utilisateur a validé le pilote, les vingt correspondances neutral/combat et
le rendu représentatif dans le cinéma le 16 septembre 2026.

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

## Handoff

Le protocole de reprise est fixé dans `docs/development/session-2026-09-15-cdi-148-combat-poses-handoff.md`. Fournir références et prompts versionnés, table neutral/combat par genre et index, sources/exports, mesures, tests et verdicts utilisateur. Aucune pose d’action, réaction ou KO n’est déclarée livrée par ce lot.
