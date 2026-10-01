---
id: CDI-147
title: Refaire la sentinelle et la patrouille du Bastion
status: Done
area: ui
priority: P1
size: M
risk: medium
source: Verdict utilisateur du 13 septembre 2026 - reprendre trois sprites précis du Bastion
depends_on: ["CDI-117"]
blocks: ["CDI-118","CDI-121","CDI-126","CDI-135"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-sprite-audit.md","src/assets/undercityBastionVisualManifest.ts","src/assets/encounterVisuals.ts","src/domain/dungeonCombatScene.ts","AGENTS.md"]
---

# CDI-147 — Refaire la sentinelle et la patrouille du Bastion

## Objectif

Refaire trois humanoïdes ciblés du Bastion des Exclus selon l’étalon CDIdle, sans modifier les sept autres sprites validés de la zone.

## Resultat utilisateur

Le Veilleur sans-bannière et les deux membres de la Patrouille des exilés rejoignent la qualité et les proportions des humanoïdes validés, tout en conservant leur rôle, leur identité et leur composition de combat.

## Contexte

Le tri CDI-117 demande uniquement la reprise de `banished-sentinel-v1.png`, `palisade-lookout-v1.png` et `exile-blackshot-v1.png`. Les deux écrans concernés sont regroupés dans ce ticket, avec un verdict visuel distinct pour chacun.

## Perimetre autorise

- Refaire `banished-sentinel-v1.png` pour l’écran Veilleur sans-bannière.
- Refaire `palisade-lookout-v1.png` et `exile-blackshot-v1.png` pour l’écran Patrouille des exilés.
- Préserver identité, diversité, tenue, arme de référence, orientation et rôle lisible de chacun.
- Produire avec alpha natif, selon le workflow validé dans CDI-146, ou sur fond monochrome à détourer hors runtime ; livrer un alpha réel propre.
- Ajuster seulement échelle, pivot et placement rendus nécessaires par les nouvelles boîtes visibles, sans recomposer les scènes validées.

## Hors perimetre

- Modification de `banished-bulwark-v1.png`, `barricade-blade-v1.png`, `barricade-colossus-v1.png`, `barricade-warden-v1.png`, `outcast-standard-bearer-v1.png`, `outcast-surgeon-v1.png` ou `rampart-eye-v1.png`.
- Refonte de `bastion-exiles-stage-v1.jpg`.
- Pose d’action complexe, cycle image par image, autre zone, gameplay, déploiement ou refactor collatéral.

## Contrat d'implementation

- Utiliser les cinq références humanoïdes de CDI-117, dont `barricade-blade-v1.png` et `outcast-standard-bearer-v1.png` issues du Bastion.
- Conserver une lumière venant de la gauche, des silhouettes lisibles et un niveau de détail cohérent sans rendu réaliste ou trop HD.
- Contrôler alpha réel, franges, faux fond, transparence du corps, membres/armes coupés, fragments isolés et sens de l’éclairage.
- Comparer la boîte alpha visible et non la toile carrée ; garder pieds, profondeur, jauges et proportions cohérentes face aux héros.
- Conserver les clés visuelles actuelles et valider séparément Veilleur sans-bannière puis Patrouille des exilés.

## Dependances

- CDI-117 : étalon et tri de la zone.

## Criteres d'acceptation

- [x] Les trois fichiers ciblés sont remplacés et les sept autres sprites du Bastion restent inchangés.
- [x] Les personnages conservent leur identité, rôle, équipement de référence, diversité et silhouette propre.
- [x] Alpha, éclairage gauche, membres, armes, contours et matières sont propres et cohérents avec l’étalon.
- [x] Taille visible, pivots, pieds, orientations, jauges et superpositions fonctionnent dans les deux compositions existantes.
- [x] L’utilisateur valide séparément l’écran Veilleur sans-bannière et l’écran Patrouille des exilés.
- [x] Les clés historiques chargent les nouveaux fichiers sans repli ni modification métier.
- [x] Dimensions, poids et mémoire décodée sont contrôlés dans le budget artistique.

## Tests

- Contrôler manifeste, dimensions, alpha, boîte visible, fragments et budget sur les trois exports modifiés et les sept ressources préservées.
- Après validation des deux écrans : tests ciblés des visuels/projections, `npm.cmd run check:dungeon-visuals`, `npm.cmd run typecheck`, `npm.cmd run lint -- --quiet`, `npm.cmd run build`, `npm.cmd run check:bundle` et `npm.cmd run board:validate`.
- Exécuter la suite navigateur PC ciblée seulement après les validations visuelles.

## Validation manuelle

L’utilisateur valide Veilleur sans-bannière puis Patrouille des exilés dans leur décor PC. Une validation ne vaut pas automatiquement pour l’autre écran.

## Preservation

- Conserver les sept autres sprites, le fond, les compositions et les positions déjà validés hors correction de pivot strictement nécessaire.
- Conserver identité CDIdle, diversité et armes propres aux sprites.
- Autorité serveur, RNG, progression, ressources et cadence inchangées.
- Autonomie technique/Git selon AGENTS.md ; validation visuelle par l’utilisateur. Zéro déploiement sans contre-ordre explicite.

## Risques

- Une nouvelle boîte alpha peut casser proportions, placement ou jauges.
- Une reprise trop large peut altérer des sprites explicitement validés.

## Handoff

Fournir références et prompts versionnés, trois remplacements, preuves alpha/poids, tests et deux verdicts visuels. Les sept ressources conservées doivent être contrôlées comme inchangées.

### Démarrage — 1er octobre 2026

CDI-146 est publié dans `f6c3a1cc6a89380a93415b0c10da60e059fd56a9` ; CI
vérifiée réussie par Codex : https://github.com/GunnLady/CDIdle/actions/runs/36885348695.
Reprendre ses proportions approuvées : tête modérée, buste développé, chibi léger.
Ordre : Veilleur sans-bannière puis les deux membres de la Patrouille.
Conserver la garde existante du Veilleur et l’alignement mécanique de sa lance.

### Veilleur sans-bannière — 1er octobre 2026

Nouvelle version explicitement choisie et validée : « la nouvelle version est
mieu on la valide ». Source `exec-57415a15-4563-484e-9a76-16be23e8d91d.png`,
copie `assets/design/dungeon-2d/cdi-147/banished-sentinel-v3-approved.png`.
Proportions légèrement moins chibi que le premier candidat ; capuche/tête
réduites et buste développé. Références et prompts dans
`assets/design/dungeon-2d/cdi-147/sentinel.prompt.md`.
Ancien sprite sauvegardé dans `originals/banished-sentinel-v1.png`.
Export 384 × 384, 115 470 octets, `-MatchReferenceHeight` ; hauteur et pieds
alignés sur l’original, proportions conservées. Échelle 1,584 et pivot 0,93
inchangés. Écran dans le décor validé explicitement par l’utilisateur le
1er octobre 2026 (« validé »), après contrôle de la taille et du placement.
Contrôles des assets et Workboard réussis (157 tickets, zéro erreur).
La Patrouille a ensuite reçu son propre verdict utilisateur, consigné ci-dessous.

### Guetteur mobile — 1er octobre 2026

Source finale explicitement retenue : `exec-98e73dfc-48c4-4434-8256-968ec85db589.png`.
Copie exacte `assets/design/dungeon-2d/cdi-147/palisade-lookout-v5-approved.png` ;
hash source/copie identique, consigné avec les prompts dans
`assets/design/dungeon-2d/cdi-147/lookout.prompt.md`.
Proportions moins chibi, dague en prise classique basse et raccord lame/manche
corrigé. Les variantes de lancer sont abandonnées par décision utilisateur.
Export 384 × 384, 111 701 octets, `-MatchReferenceHeight` ; original sauvegardé.
Échelle 1,42 et pivot 0,93 conservés. Écran Patrouille validé avec les deux
remplacements, selon le verdict ci-dessous.

### Trait-noir — 1er octobre 2026

Nouvelle génération depuis l’original, validée explicitement après reprise
du foulard en une pièce continue autour du visage et de la nuque :
`exec-d178ed0a-4f47-4fdd-8cc6-804edfe598d7.png`.
Copie exacte `assets/design/dungeon-2d/cdi-147/exile-blackshot-v4-approved.png` ;
hash source/copie identique, références et prompt dans
`assets/design/dungeon-2d/cdi-147/blackshot.prompt.md`.
Les deux candidats antérieurs ne sont pas intégrés : validation du premier
retirée pour le raccord du masque, puis retouche locale rejetée.
Export 384 × 384, 114 002 octets, `-MatchReferenceHeight` ; original sauvegardé.
Échelle 1,48 et pivot 0,93 conservés. Les trois remplacements sont intégrés ;
écran Patrouille validé, vérifications finales réussies ci-dessous.

Contrôle technique après intégration : Guetteur et Trait-noir en 384 × 384,
hauteur alpha 288 px et bord inférieur à y=349 comme leurs originaux ;
une seule composante visible chacun (seuil alpha 4), coin transparent.
Contrôleur d’assets réussi, pack Bastion à 1 270 281 octets ; Workboard valide
(157 tickets, zéro erreur), `git diff --check` réussi. Seuls les trois sprites
autorisés du Bastion apparaissent modifiés ; les sept autres et le fond sont
inchangés.

### Validation de la Patrouille — 1er octobre 2026

Verdict utilisateur explicite « validé » après présentation de la scène
`exile-patrol` intégrée, animations désactivées, pour contrôler taille et
placement des deux personnages. Les deux écrans exigés ont ainsi reçu des
validations distinctes.

### Vérifications finales et audit prépublication — 1er octobre 2026

- Tests ciblés `encounterVisuals`, `dungeonCombatScene` et
  `dungeonPresentation` : 4 fichiers, 97 tests réussis (le filtre Windows
  inclut également `DungeonCombatScene.test.tsx`).
- Suite `dungeonCombatScene.responsive.browser.spec.ts` : 18 tests réussis
  en 44,4 s, comprenant PC, équivalent zoom 200 % et mouvement réduit.
- `typecheck`, `lint -- --quiet`, `build`, `check:bundle`, contrôleur des
  assets, `board:validate` et `git diff --check` réussis.
- Bundle JS : 261 410 octets gzip au total, plus gros fragment 118 106 octets,
  budget respecté. Aucun refactor ou changement métier.
- Les trois exports font 384 × 384 et possèdent un alpha réel, une seule
  composante visible (seuil alpha 4), une marge autour des armes et pieds.
  Boîtes alpha (seuil 32) : Veilleur `(25,63,333,286)`, Guetteur
  `(60,61,263,288)`, Trait-noir `(41,61,301,288)`.
  Mémoire RGBA théorique : 589 824 octets par export, 1 769 472 pour les trois.
- Vérification Chromium ponctuelle des deux blueprints à 1024, 1280 et
  1440 px : 6 passages réussis, aucune ressource manquante ou au repli,
  aucun acteur hors scène et aucun débordement horizontal. URLs des trois
  fichiers historiques et décodage des images vérifiés.
- Poids des images réellement chargées, quatre gardes héros et décor inclus :
  Veilleur 1 231 296 octets ; Patrouille 1 341 529 octets, chacun sous 2 Mio.
  Mémoire RGBA théorique correspondante : 14 594 176 et 15 184 000 octets.
  Il s’agit d’une estimation par dimensions, pas d’une mesure GPU/processus.
  Les poids concernent les identités fixes du harness, pas toutes les
  combinaisons de héros ; la campagne globale reste dans CDI-116.
- Préservation : seuls les trois PNG autorisés apparaissent dans le diff du
  dossier Bastion ; sept autres PNG, décor, clés, pivots, échelles et
  compositions inchangés.
- Écart documentaire P2 corrigé : mentions « à produire »/« à valider » et
  statuts synchronisés dans le ticket, les prompts, les plans et l’audit
  des sprites. Preuves : verdicts distincts ci-dessus et contrôles réussis.

Clôture locale autorisée par le chantier Donjon 2D. Publication Git et CI
font l’objet d’un contrôle séparé ; aucun déploiement n’est inclus.
