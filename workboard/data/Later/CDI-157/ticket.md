---
id: CDI-157
title: Produire et intégrer les poses de combat Pugiliste
status: Later
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
- [ ] Les vingt poses de combat correspondent une à une aux vingt bases neutres par genre et index 0–9.
- [ ] Identité, tenue, proportions, direction, lumière, pieds et pivot restent cohérents entre les deux poses ; seules les armes des gardes peuvent varier selon la décision utilisateur.
- [ ] Le cinéma affiche la garde pendant l’affrontement, revient en garde après chaque action et n’utilise la pose neutre qu’hors combat.
- [ ] Recrutement, catalogue, stockage et autres scènes hors combat conservent la pose neutre.
- [ ] La pose de combat ne remplace aucune pose d’action et ne modifie aucun résultat métier.
- [ ] Alpha, chargement, cache, mémoire et budget de scène sont vérifiés ; le rendu est validé dans les écrans cinéma représentatifs.

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

## Avancement — 27 septembre 2026

- M01 (index 0) : candidat de garde validé visuellement par l'utilisateur
  (« valdié »). Source archivée sans modification dans
  `assets/design/hero-sprites/cdi-157/validated-male-v1/pugilist-male-01-combat-idle-v1.png` ;
  égalité SHA-256 vérifiée avec le fichier généré.
- Les trois références exactes, le prompt et les contrôles sont conservés dans
  `assets/design/hero-sprites/cdi-157/references/m01/generation.json`.
- Contrôles source : PNG 1024 × 1536, 1 861 037 octets, boîte visible alpha >32
  `(62,34)–(984,1479)`, aucun pixel non transparent sur le bord du canevas.
  Le fond est transparent ; le personnage utilise principalement un alpha 253
  et aucun pixel 255. Cet alpha proche de l'opacité est préservé dans l'archive.
- Retouche M01 « battle ready » validée par l'utilisateur (« validé ») : la
  source retenue devient `validated-male-v1/pugilist-male-01-combat-idle-v2.png`
  sous le même dossier CDI-157. La v1 reste conservée. Références, prompt,
  empreinte et contrôles : `references/m01/expression-v2.json`. PNG 1024 × 1536,
  1 852 397 octets, boîte alpha >32 `(61,34)–(986,1480)`, alpha maximal 254,
  aucun pixel non transparent sur le bord ; copie SHA-256 identique.
- F01 : première garde validée (« valdié »), puis retouche du regard et du
  visage « battle ready » validée (« validé »). Source retenue :
  `validated-female-v1/pugilist-female-01-combat-idle-v2.png`, sous le même
  dossier CDI-157 ; v1 conservée. Références, prompts, empreintes et contrôles :
  `references/f01/generation.json` et `references/f01/expression-v2.json`.
  V2 : PNG 1024 × 1536, 1 878 412 octets, boîte alpha >32
  `(53,67)–(990,1430)`, alpha maximal 254, aucun pixel non transparent sur
  le bord ; copie SHA-256 identique.
- Pilote contrasté M01/F01 validé visuellement par l'utilisateur avant la
  production en série. Les deux expressions retouchées v2 sont retenues.
- M02 (index 1) : garde et visage prêts au combat validés (« validé »).
  Source `validated-male-v1/pugilist-male-02-combat-idle-v1.png` archivée sans
  modification, SHA-256 vérifié. Références, prompt et mesures dans
  `references/m02/generation.json`, sous le même dossier CDI-157.
  PNG 1024 × 1536, 2 136 182 octets ; boîte alpha >32 `(28,34)–(1019,1499)`.
  Résidu de bord : 33 pixels d'alpha maximal 2/255 ; aucune silhouette visible
  au seuil 32 ne touche le bord. À la normalisation, ajouter les marges
  transparentes prévues et vérifier les limites visibles avant intégration.
- F02 (index 1) : garde au bô validée (« validé ») après la demande de varier
  les armes. Source `validated-female-v1/pugilist-female-02-combat-idle-v1.png`
  archivée à l'identique ; références, prompt et SHA-256 dans
  `references/f02/generation.json`, sous le même dossier CDI-157.
  PNG 1221 × 1289, 1 300 073 octets ; boîte alpha >32 `(46,66)–(1196,1239)`,
  alpha maximal 255, aucun pixel non transparent sur le bord du canevas.
- F02 : la garde au bô reste approuvée. La candidate neutre au bô générée
  hors périmètre n'est ni retenue ni intégrée ; la base CDI-145 reste intacte.
  Normalisation et intégration de la garde restent à faire.
- M03 (index 2) : version avec gantelets renforcés assortis à la tenue validée
  (« validé »). Source retenue :
  `validated-male-v1/pugilist-male-03-combat-idle-v3.png`, sous CDI-157.
  Les poings renforcés séparés et les gantelets bruns intermédiaires ne sont
  pas retenus. Références exactes et prompt : `references/m03/generation.json`.
  Copie SHA-256 identique ; PNG 1024 × 1536, 1 989 649 octets ; boîte alpha >32
  `(45,73)–(993,1493)`, alpha maximal 254, aucun pixel non transparent au bord.
- F03 (index 2) : garde aux gantelets assortis validée (« validé »).
  Source `validated-female-v1/pugilist-female-03-combat-idle-v1.png` archivée
  à l'identique ; références, prompt et SHA-256 dans
  `references/f03/generation.json`, sous CDI-157.
  PNG 1024 × 1536, 2 136 436 octets ; boîte alpha >32 `(69,6)–(994,1512)`.
  Silhouette entière ; marge haute de 6 px et 81 pixels de bord d'alpha maximal
  6/255. À la normalisation, ajouter les marges transparentes prévues et
  vérifier les limites visibles avant intégration. Base neutre inchangée.
- M04 (index 3) : garde haute au bô sans tissu validée (« validé »), après
  acceptation de la taille du bâton et demande de retirer ses bandes textiles.
  Source retenue `validated-male-v1/pugilist-male-04-combat-idle-v2.png`, sous
  CDI-157 ; références et prompt dans `references/m04/generation.json`.
  Copie SHA-256 identique ; PNG 1024 × 1536, 1 981 523 octets ; boîte alpha >32
  `(49,66)–(1007,1501)`. Silhouette et bâton entiers ; 13 pixels de bord
  d'alpha maximal 1/255, à prendre en compte dans le contrôle des marges
  transparentes à la normalisation. Base neutre inchangée.
- F04 (index 3) : garde à mains nues validée (« validé »).
  Source `validated-female-v1/pugilist-female-04-combat-idle-v1.png` archivée
  à l'identique ; références, prompt et SHA-256 dans
  `references/f04/generation.json`, sous CDI-157.
  PNG 1024 × 1536, 2 152 799 octets ; boîte alpha >32 `(46,77)–(1015,1476)`.
  Silhouette entière ; six pixels de bord d'alpha maximal 1/255, à prendre
  en compte dans le contrôle des marges à la normalisation. Neutre inchangée.
- M05 (index 4) : garde avec gantelets aux couleurs de la tenue, sans plaques
  métalliques, validée (« validé »). Source retenue
  `validated-male-v1/pugilist-male-05-combat-idle-v2.png`, sous CDI-157 ;
  références exactes, prompt et SHA-256 dans `references/m05/generation.json`.
  Copie SHA-256 identique ; PNG 1038 × 1516, 1 383 003 octets ; boîte alpha >32
  `(41,23)–(1023,1494)`, alpha maximal 255, aucun pixel non transparent au bord.
  La candidate avec plaques métalliques est conservée seulement comme référence
  de retouche. Base neutre inchangée.
- Neuf gardes validées ; les onze autres restent à produire et valider.
- Arrêt demandé par l'utilisateur après M05 ; prochaine identité : F05.
- Normalisation, calibration tête/visage, pivots, WebP et intégration cinéma
  restent à faire ; aucune échelle runtime n'est encore attribuée aux pilotes.

## Handoff

Fournir références et prompts versionnés, table neutral/combat par genre et index, sources/exports, mesures, tests et verdicts utilisateur. Aucune pose d’action, réaction ou KO n’est déclarée livrée par ce lot.
