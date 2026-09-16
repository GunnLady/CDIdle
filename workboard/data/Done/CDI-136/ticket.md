---
id: CDI-136
title: Refaire les bases Novice selon l’étalon CDIdle
status: Done
area: ui
priority: P1
size: L
risk: medium
source: Validations utilisateur des 13 et 15 septembre 2026
depends_on: ["CDI-117"]
blocks: ["CDI-113","CDI-118","CDI-125","CDI-134","CDI-135","CDI-137","CDI-138","CDI-139","CDI-140","CDI-141","CDI-142","CDI-143","CDI-144","CDI-145","CDI-148"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-action-production-plan.md","docs/development/dungeon-2d-sprite-audit.md","docs/development/session-2026-09-13-cdi-136-novice-male-handoff.md","docs/development/session-2026-09-15-cdi-136-completion.md","scripts/prepare-cdi-136-novice-assets.ps1","scripts/measure-cdi-136-novice-cache.mjs","src/assets/noviceCdi136Portraits.ts","src/assets/heroPortraitAssets.ts","AGENTS.md"]
---

# CDI-136 — Refaire les bases Novice selon l’étalon CDIdle

## Objectif

Remplacer les anciennes planches Novice par vingt personnages détourés et
normalisés : dix hommes et dix femmes cohérents avec l’étalon humanoïde CDIdle.

## Resultat utilisateur

Les Novices utilisent les vingt personnages validés dans le recrutement, les
écrans aventuriers, le stockage et le cinéma. Les sauvegardes existantes
reçoivent une nouvelle variante parmi les dix du genre correspondant.

## Contexte

CDI-117 classe les dix classes historiques à refaire. Les cinq références
humanoïdes confirmées sont l’étalon initial. Ce ticket reste borné à la classe
Novice et ne couvre aucune pose d’action complexe.

Ressources historiques : `src/assets/images/human-novice-male.jpg` et `src/assets/images/human-novice-female.jpg`.

## Décisions de portée

- La portée initiale de vingt hommes et vingt femmes est remplacée par dix
  hommes et dix femmes, tous validés individuellement.
- Il n’existe plus de contrat de correspondance individuelle avec les quarante
  anciennes cases : les anciennes identités visuelles sont remplacées.
- Les Novices nouveaux utilisent les index 0–9. La décision utilisateur
  postérieure du 15 septembre 2026 applique aussi dix hommes et dix femmes aux
  neuf autres classes T1 ; elle est portée par CDI-137 à CDI-145.
- La migration canonique v6→v7 réattribue chaque Novice existant, candidat
  d’onboarding ou recrutement en attente à un index 0–9 pseudo-aléatoire dérivé
  de son identifiant. Le résultat reste stable entre les chargements.
- Les armes et accessoires restent propres aux sprites et ne reflètent jamais
  l’équipement réel.

## Perimetre autorise

- Dix sources masculines et dix sources féminines validées.
- Détourage hors runtime, normalisation, planches 5 × 2 et aperçus clair/sombre.
- Chargement canonique des PNG alpha dans toutes les surfaces de portrait et
  dans le cinéma.
- Pop-up de recrutement agrandie de 15 %.
- Scène standard ajustée selon le verdict utilisateur : Milo +4 % vers le bas,
  Céleste +2 % vers le bas et Abel 1 % vers la gauche.
- Migration des Novices existants et tirage des nouveaux recrutements sur dix
  variantes.

## Hors perimetre

- Déclinaison selon l’arme réellement équipée.
- Cycle de marche, animation complexe ou poses de compétences.
- Refonte d’une autre classe ou d’un monstre.
- Déploiement frontend ou backend.

## Contrat d'implementation

- Sources finales : `assets/design/hero-sprites/cdi-136/validated-male-v1/`
  et `assets/design/hero-sprites/cdi-136/validated-female-v1/`.
- Exports runtime :
  `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/male/` et
  `assets/design/hero-sprites/cdi-136/normalized-alpha-v1/female/`.
- Production déterministe : `scripts/prepare-cdi-136-novice-assets.ps1`.

## Dependances

- CDI-117 : étalon, verdict et inventaire.

## Criteres d'acceptation

- [x] Le pilote, les vingt personnages individuels et les deux planches finales
  sont validés par l’utilisateur.
- [x] La portée finale est fixée à dix hommes et dix femmes, sans correspondance
  requise avec les quarante anciennes identités.
- [x] Qualité, proportions, détails, contours, matières, diversité et lumière
  correspondent aux références selon le verdict utilisateur.
- [x] Les vingt exports ont un alpha réel, un seul composant visible, des pieds
  alignés à `y = 673` et aucun faux fond ou résidu chroma clair détecté.
- [x] Les sprites passent par le chargement canonique sur les écrans concernés ;
  les anciennes planches JPG ne sont plus émises dans le build.
- [x] Les Novices existants sont réattribués de façon pseudo-aléatoire stable
  dans 0–9 et les nouveaux recrutements tirent directement dans 0–9.
- [x] L’utilisateur valide le recrutement et le cinéma sur les cinq zones de
  l’UnderCity.
- [x] Poids froid, cache chaud et empreinte décodée sont quantifiés et restent
  compatibles avec les budgets actuels.

## Mesures

- 20 PNG runtime de 341 × 692 px : 5 259 608 octets.
- Pire groupe de quatre : 1 181 073 octets.
- Chargement à froid : 5 265 608 octets transférés, en-têtes compris.
- Second chargement : 0 octet transféré avec cache
  `public, max-age=31536000, immutable`.
- Empreinte RGBA : 943 888 octets par sprite, 3 775 552 octets pour quatre et
  18 877 760 octets pour les vingt. C’est le calcul exact
  `largeur × hauteur × 4`, pas une télémétrie mémoire du navigateur.
- JavaScript gzip : 253 448 octets ; plus gros chunk : 118 347 octets.

## Tests

- Préparation alpha : 20/20 exports acceptés.
- Vitest ciblé : 45/45, puis 35/35 après retrait des anciennes planches.
- Suite Vitest complète : 1 124/1 124.
- Playwright cinéma : 6/6, dont le chargement CDI-136 par le pipeline de
  production.
- `npm.cmd run check:dungeon-visuals` : OK, 20 sprites alpha et 400 clés héros.
- `npm.cmd run typecheck` : OK.
- `npm.cmd run lint -- --quiet` : OK.
- `npm.cmd run build` : OK.
- `npm.cmd run check:bundle` : OK.
- `node scripts/measure-cdi-136-novice-cache.mjs` : OK.
- `npm.cmd run check:migrations`, `check:secrets` et `check:logs` : OK.

## Validation manuelle

L’utilisateur a validé les vingt personnages, les deux planches, la pop-up de
recrutement et le cinéma sur les cinq zones de l’UnderCity.

## Preservation

- Les anciennes clés restent compatibles, mais les classes T1 seront ramenées
  à dix variantes par genre par CDI-137 à CDI-145.
- Les images ne déduisent aucune classe, statistique ou pièce d’équipement.
- Autorité, progression, ressources et cadence de jeu restent inchangées.
- Aucun déploiement n’est autorisé par ce ticket.

## Risques

- Les vingt PNG représentent 5,016 Mio si tous sont téléchargés ; le cache
  chaud évite leur retransfert sous une politique `immutable`.
- La migration v7 doit être publiée avec le backend pour réattribuer les
  Novices des sauvegardes existantes.
- Les poses d’action restent hors du lot.

## Handoff

Les sources, mesures, décisions, validations et limites sont détaillées dans
`docs/development/session-2026-09-15-cdi-136-completion.md`. La migration des
sauvegardes prendra effet après publication du backend v7 ; aucun déploiement
n’est inclus ni autorisé par ce ticket.
