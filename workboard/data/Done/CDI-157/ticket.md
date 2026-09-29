---
id: CDI-157
title: Produire et intégrer les poses de combat Pugiliste
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-145","CDI-148"]
blocks: ["CDI-119","CDI-125","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-combat-idle-sprite-workflow.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-157 — Produire et intégrer les poses de combat Pugiliste

## Objectif

Produire pour les dix hommes et dix femmes Pugiliste une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Pugiliste conserve son identité et sa tenue entre la pose neutre et la garde. Les armes visibles des gardes peuvent varier selon la décision utilisateur du 27 septembre 2026 ; les poses neutres restent inchangées. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

## Contexte

La base neutre reste destinée au recrutement, au catalogue, au stockage et aux scènes hors combat. La pose de combat est un second asset persistant pendant l’affrontement ; elle n’est ni la compétence guard_stance, ni une pose d’attaque. Ce lot réutilise le standard validé par CDI-148 sans modifier le contrat de scène.

## Perimetre autorise

- Produire vingt poses de combat : dix hommes et dix femmes, index 0–9.
- Conserver pour chaque index le visage, la carnation, la coiffure, les couleurs et la tenue de la base neutre ; les armes des gardes suivent la décision ci-dessous.
- Garder dimensions, boîte alpha, pieds, pivot, direction et échelle compatibles avec la base neutre.
- Décision utilisateur du 27 septembre 2026 (« fait un mixte ») : varier mains
  nues, gantelets renforcés et bô uniquement dans les gardes de combat.
  Précision utilisateur après M03 : abandonner les poings renforcés séparés
  au profit de gantelets renforcés, assortis aux couleurs et motifs des tenues.
  Les poses neutres restent inchangées. L'adaptation des neutres était une
  interprétation erronée de Codex, retirée après le retour utilisateur.
  La variation visuelle ne change pas l'équipement métier ni la sélection
  selon l'équipement réel.
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

- CDI-145 : vingt bases neutres Pugiliste validées.
- CDI-148 : standard de pose de combat et intégration cinéma validé sur les Novices.

## Criteres d'acceptation

- [x] Un pilote contrasté est validé visuellement avant la production en série.
- [x] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [x] Identité, tenue, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses ; seules les armes des gardes peuvent varier selon la décision utilisateur.
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

- Conserver les vingt identités validées et leurs tenues ; les armes des gardes peuvent varier selon la décision utilisateur du 27 septembre, sans modifier les bases neutres ni l’équipement métier.
- Conserver compositions, placements, échelle et lisibilité des écrans cinéma.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Aucun déploiement n’est autorisé par ce ticket.

## Risques

- Dérive de visage, tenue, arme ou proportions entre la base et la garde.
- Saut visible de pivot ou d’échelle lors du changement de pose.
- Chargement des quarante images neutral/combat d’une classe alors que seules les identités présentes sont nécessaires.
- Confusion entre garde persistante, compétence guard_stance et vraie pose d’action.

## Livraison validée

- Les vingt gardes et les cinq écrans cinéma sont validés par l’utilisateur,
  avec les échelles finales ci-dessous. Les vingt versions retenues, chemins
  neutre/source/PNG normalisé/WebP et empreintes SHA-256 sont dans
  assets/design/hero-sprites/cdi-157/manifest.json.
- Sources retenues : M01 v2, M03 v3, M04 v2, M05 v2 et F01 v2 ; v1 pour
  les quinze autres identités. Seules ces versions font partie de la livraison.
- Armes validées : mains nues pour M01, M02, M06, M09, F01, F04, F07 et F10 ;
  gantelets assortis aux tenues pour M03, M05, M08, F03, F06 et F09 ;
  bô pour M04, M07, M10, F02, F05 et F08. Aucun changement d’équipement métier.
- M06 : neutre corrigé puis garde reconstruite sur cette base, tous deux
  validés après correction des couches du torse. F08 : bâton redressé et main
  à droite corrigée (quatre doigts et pouce sous le bâton). M10 : bâton redressé.
- Branchement local des vingt gardes réalisé. Les cinq écrans cinéma et leurs
  échelles finales sont validés par l’utilisateur (« validé tu peux reprendre »),
  y compris M09 à 0,73.
  Le neutre M06 corrigé est conservé pour les contextes hors combat.
- Contrôles locaux : alpha, dimensions, correspondances et SHA-256 réussis ;
  112 cas ciblés couverts avec succès, dont les deux régressions ajoutées sur
  le retour de M10 au placement neutre ; dernier recontrôle : 87 tests réussis.
  Typecheck et lint réussis. WebP : 2 132 020 octets
  pour la série, 609 452 octets pour les quatre plus lourds, 15 301 440 octets
  de mémoire décodée pour les quatre canevas les plus grands.
- Build et budget JavaScript réussis : 261 381 / 262 144 octets gzip,
  plus gros chunk 118 106 octets. Deux passes de compression Terser permettent
  de respecter le plafond inchangé. Le build contient exactement vingt WebP
  de garde Pugiliste ; aucune source ou candidate rejetée de ce lot.
- Test Playwright CDI-157 réussi sur les cinq pages et les largeurs 1440,
  1280, 1024 et 512 px. Seulement quatre images de héros chargées par scène.
  Transfert froid par page : 414 336, 373 152, 367 918, 514 798 et 467 816
  octets ; transfert chaud : 1 200 octets par page (revalidations HTTP).
  Mémoire décodée par page : 9 818 240, 8 743 680, 8 589 120, 11 569 920 et
  12 055 680 octets. Les mesures sont produites par le test dans
  `test-results/layout-browser/`, sans nouveau document de suivi.
- Écart technique corrigé : le bâton de M10 dépassait de 13 px à droite au
  format PC zoom 200 %. Son placement en garde est plafonné à x=81 % dans ce
  seul format ; échelle validée, placement desktop et pose neutre préservés.
  Preuves : test navigateur réussi et tests des identités index 9 et 19.
- Validation visuelle : utilisateur. Contrôles techniques : Codex.
  Ticket clos à la demande de l’utilisateur. Commit/push autorisés par l’utilisateur ;
  aucun déploiement.

## Handoff

- Revue cinéma, écran 1 : réglages demandés par l’utilisateur appliqués :
  F01 0,74 ; F02 0,72 ; M01 0,80 ; M02 0,81. Rendu cinéma validé par l’utilisateur.
- Revue cinéma, écran 2 : réglages demandés par l’utilisateur appliqués :
  F03 0,78 ; F04 0,78 ; M03 0,76 ; M04 0,83. Rendu cinéma validé par l’utilisateur.

- Revue cinéma, écran 3 : réglages demandés par l’utilisateur appliqués :
  F05 0,79 ; F06 0,77 ; M05 0,74 ; M06 0,77. Rendu cinéma validé par l’utilisateur.

- Revue cinéma, écran 4 : réglages demandés par l’utilisateur appliqués :
  F07 0,77 ; F08 0,69 ; M07 0,67 ; M08 0,79. Rendu cinéma validé par l’utilisateur.

- Revue cinéma, écran 5 : réglages demandés par l’utilisateur appliqués :
  F09 0,74 ; F10 0,68 ; M09 0,73 ; M10 0,70. Rendu cinéma validé par l’utilisateur.

Les gardes sont livrées localement. Les poses d’action, de réaction et de KO
restent hors de ce lot.
