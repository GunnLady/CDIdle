---
id: CDI-152
title: Produire et intégrer les poses de combat Mage
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validation utilisateur du 15 septembre 2026 - séparer pose neutre, pose de combat et poses d’action
depends_on: ["CDI-140","CDI-148"]
blocks: ["CDI-122","CDI-123","CDI-128","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-combat-idle-sprite-workflow.md","src/assets/heroSpriteSheets.ts","src/domain/dungeonCombatScene.ts","src/components/dungeon/CurrentEncounterPanel.tsx","AGENTS.md"]
---

# CDI-152 — Produire et intégrer les poses de combat Mage

## Objectif

Produire pour les dix hommes et dix femmes Mage une pose de combat en garde, cohérente avec leur base neutre, puis l’utiliser comme attente pendant les affrontements du cinéma.

## Resultat utilisateur

Chaque Mage conserve exactement son identité et son équipement visuel entre la pose neutre et la garde. Dans le cinéma, le héros passe de la pose neutre à la garde au début de l’affrontement, revient en garde après chaque action et quitte la garde à la fin du combat.

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

- CDI-140 : vingt bases neutres Mage validées.
- CDI-148 : standard de pose de combat et intégration cinéma validé sur les Novices.

## Criteres d'acceptation

- [x] Un pilote contrasté est validé visuellement avant la production en série : M06 au bâton et F06 au grimoire ouvert, verdict utilisateur du 24 septembre 2026.
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

L’utilisateur a validé le pilote, les vingt correspondances neutral/combat et les cinq écrans `mage-cinema=1..5` du harness le 24 septembre 2026, après réglage des échelles par identité. Le détourage alpha de M05 est inclus dans la validation de l’écran 3.

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

Les vingt sources approuvées, les exports PNG alpha, les WebP runtime et leurs empreintes SHA-256 sont liés par `assets/design/hero-sprites/cdi-152/manifest.json`. M05 conserve sa source approuvée à fond peint ; `alpha-source-v1/` contient son détourage utilisé par l’export. Les scripts `prepare-cdi152-mage-combat.ps1` et `encode-cdi152-mage-webp.mjs` reproduisent les exports. Les prompts ImageGen exacts ne sont pas archivés ; une future régénération devra repartir de la source validée et recevoir un nouveau verdict visuel.

Preuves : 72 tests ciblés, cinq vues Playwright, `check:dungeon-visuals`, `typecheck`, `lint -- --quiet`, `build`, `check:bundle` et `board:validate` réussis. Les vingt WebP totalisent 1 908 302 octets ; les quatre plus lourds 497 812 octets sur un budget de 2 097 152. Mesure locale du build : 1 914 302 octets transférés à froid, 0 au rechargement avec cache immuable, 47 552 960 octets RGBA décodés pour les vingt fichiers. Aucune pose d’action, réaction ou KO ni aucun déploiement ne sont livrés.

## Registre de production — matrice validée

Les armes ci-dessous sont des choix **visuels fixes par identité**, sans lien avec
l'équipement réellement porté. Elles appartiennent aux trois familles Mage T1 du
domaine partagé : `staff` (deux mains), `wand` (une main) et `spellbook` (une
main). Les vêtements et accessoires des bases neutres sont conservés. Aucune
incantation, projectile, aura ou cercle actif dans `combat_idle`.

Pilote : M06 au bâton et F06 au grimoire, deux silhouettes contrastées qui
servent aussi de gabarits de proportions. Matrice et pilote validés par
l'utilisateur le 24 septembre 2026 ; chaque sprite reste à valider séparément.

| Identité | Source neutre CDI-140 | Arme et garde proposées | Références | Prompt | Candidat | Contrôle | Verdict utilisateur | Livraison |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M01 | `validated-male-v1/mage-male-01-v1.png` | Baguette basse en main droite, gauche ouverte ; grimoire de ceinture conservé | Pose Hogwarts Legacy ; baguette Sketchfab | Relu | `validated-male-v1/mage-male-01-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; pan de cape ajouté retiré | Manifest SHA-256 |
| M02 | `validated-male-v1/mage-male-02-v1.png` | Bâton diagonal à deux mains, appui arrière ; sacoche et bourse conservées | Pose Dragon’s Crown ; bâton argenté UE | Relu | `validated-male-v1/mage-male-02-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| M03 | `validated-male-v1/mage-male-03-v1.png` | Grimoire fermé en main gauche contre les côtes, droite libre en garde | Pose Fire Emblem Heroes ; grimoire The Alexandrian | Relu | `validated-male-v1/mage-male-03-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| M04 | `validated-male-v1/mage-male-04-v1.png` | Bâton tenu verticalement à deux mains, garde protectrice | Pose Frieren/Fern ; bâton Guild Wars 2 puis variante approuvée | Relu | `validated-male-v1/mage-male-04-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; recréé de zéro avec bâton ajusté | Manifest SHA-256 |
| M05 | `validated-male-v1/mage-male-05-v1.png` | Baguette de côté, main gauche à hauteur de poitrine | Pose de duel Sebastian ; baguette Petrified Ivy Sprig | Relu | `validated-male-v1/mage-male-05-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; baguette remplacée | Manifest SHA-256 |
| M06 | `validated-male-v1/mage-male-06-v1.png` | Bâton de Mage à tête de focalisation, garde expressive ; pilote | Pose Fire Emblem Brady ; bâton Evertale | Relu | `validated-male-v1/mage-male-06-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; bâton entièrement refait | Manifest SHA-256 |
| M07 | `validated-male-v1/mage-male-07-v1.png` | Baguette courte en main droite, gauche ouverte, appui souple | Pose Granblue/Negi ; baguette Wand of Secrets | Relu | `validated-male-v1/mage-male-07-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| M08 | `validated-male-v1/mage-male-08-v1.png` | Grimoire fermé en main gauche, main droite prête à tracer | Pose Fire Emblem/Soren ; grimoire bleu Diablo | Relu | `validated-male-v1/mage-male-08-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| M09 | `validated-male-v1/mage-male-09-v1.png` | Bâton diagonal en main droite, main gauche libre, sans sort | Pose RED STONE ; bâton violet Meshy | Relu | `validated-male-v1/mage-male-09-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; baguette rejetée puis bâton validé | Manifest SHA-256 |
| M10 | `validated-male-v1/mage-male-10-v1.png` | Bâton vertical à deux mains, base proche du pied arrière | Prise de mage Frieren/Fern ; bâton à croissant turquoise | Relu | `validated-male-v1/mage-male-10-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; tresse unique restaurée derrière le bâton | Manifest SHA-256 |
| F01 | `validated-female-v1/mage-female-01-v1.png` | Baguette en main droite, gauche près de l'étui à parchemins | Pose Granblue Therese ; baguette torsadée turquoise | Relu | `validated-female-v1/mage-female-01-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; orientation vers la droite corrigée | Manifest SHA-256 |
| F02 | `validated-female-v1/mage-female-02-v1.png` | Bâton fin à deux mains, carnet et pochette conservés | Pose Fern ; bâton fin à cristal violet Fab | Relu | `validated-female-v1/mage-female-02-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; alpha du PNG d'origine vérifié | Manifest SHA-256 |
| F03 | `validated-female-v1/mage-female-03-v1.png` | Baguette à hauteur de taille, main gauche ouverte | Pose Hermione ; baguette sculptée en bois sombre | Relu | `validated-female-v1/mage-female-03-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; baguette remplacée | Manifest SHA-256 |
| F04 | `validated-female-v1/mage-female-04-v1.png` | Grimoire fermé en main gauche, droite en garde devant | Pose Soren Fire Emblem Heroes ; grimoire Creed | Relu | `validated-female-v1/mage-female-04-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| F05 | `validated-female-v1/mage-female-05-v1.png` | Baguette basse en main droite, gauche ouverte, appuis décalés | Pose Harry Potter ; baguette sculptée à pommeau vert | Relu | `validated-female-v1/mage-female-05-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| F06 | `validated-female-v1/mage-female-06-v1.png` | Grimoire ouvert en main gauche, pages tournées vers elle ; pilote | Pose Fire Emblem Miranda ; prise à une main de moa810 | Relu | `validated-female-v1/mage-female-06-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; version finale regénérée depuis trois références | Manifest SHA-256 |
| F07 | `validated-female-v1/mage-female-07-v1.png` | Bâton à deux mains, diagonale ascendante, jupe dégagée | Pose Mage RED STONE ; Majestic Royal Pole Granblue | Relu | `validated-female-v1/mage-female-07-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; première pose et premier bâton rejetés | Manifest SHA-256 |
| F08 | `validated-female-v1/mage-female-08-v1.png` | Baguette à mi-hauteur, main gauche libre et visible | Pose Negi Granblue ; baguette Enchanter à pommeau rouge | Relu | `validated-female-v1/mage-female-08-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| F09 | `validated-female-v1/mage-female-09-v1.png` | Bâton à deux mains en travers du corps, appui ferme | Pose Hakuryuu Magi ; bâton Aetherwing bleu et or | Relu | `validated-female-v1/mage-female-09-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 | Manifest SHA-256 |
| F10 | `validated-female-v1/mage-female-10-v1.png` | Grimoire ouvert en main gauche, pages tournées vers elle ; main droite ouverte devant | Pose Griss FEH ; grimoire rouge et or Sketchfab ; prise du pilote F06 | Relu | `validated-female-v1/mage-female-10-combat-idle-v1.png` | Alpha/cadre OK | Validé visuellement le 24 septembre 2026 ; grimoire ouvert à la demande utilisateur | Manifest SHA-256 |
