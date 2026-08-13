# Handoff — menu principal complet

## Statut validé

Le 13 août 2026, l'utilisateur a validé officiellement le menu principal
desktop complet : navigation à gauche et suivi du Donjon à droite. Cette
validation visuelle a été réalisée par l'utilisateur dans son navigateur ;
Codex n'a pas ouvert ni inspecté l'application avec un navigateur.

Le seul sous-lot explicitement différé est la création et l'intégration des
insignes des classes T1 et suivantes. L'insigne Novice T0 est terminé et sert de
contrat visuel et technique.

## Navigation principale

La partie gauche contient quatre boutons jointifs de `124 x 105 px` : Cité,
Aventuriers, Donjon et Coffre. Les fonds normal et sélectionné, les quatre
icônes et les ornements de jonction sont des images décoratives ; libellés,
verrouillages et interactions restent en DOM.

La production, les dimensions exactes et les réglages finaux sont détaillés
dans `docs/development/2026-08-13-primary-navigation-buttons-handoff.md`.

## Suivi du Donjon

La partie droite est affichée sur toutes les pages authentifiées, y compris le
Donjon. Sa grille desktop est figée en trois zones :

- état du Donjon à gauche : étage, salle, état du groupe et auto-run ;
- quatre emplacements de héros au centre ;
- commande contextuelle pause/reprise à droite.

La commande réutilise les fonds des boutons du menu. Reprendre utilise le fond
or et l'icône play dorée ; Pause utilise le fond sombre et l'icône pause grisée.
Elle est désactivée sans groupe actif et pendant une rencontre non mutable.

Chaque emplacement garde une géométrie fixe afin que l'ajout d'un héros ne
décale ni les textes ni les autres médaillons. Un emplacement vide montre le
médaillon en bois sombre. Un emplacement occupé superpose, du fond vers
l'avant : l'insigne de classe, le cadre transparent du médaillon, puis le nom ;
les barres PV et mana passent derrière le médaillon.

Couleurs finales des jauges :

- PV : vert émeraude `#009605` ;
- mana : bleu saphir `#001e96` ;
- PV critiques : rouge `#960011`.

## Insigne Novice T0

L'insigne Novice est une rose des vents à huit branches, gravée dans une plaque
de cuivre. Le runtime `dungeon-class-plaque-novice-v2.png` est un disque opaque
de rayon `70 px` dans un canevas transparent de `192 x 192 px`.

Le cadre `dungeon-party-class-medallion-ring-v3.png` possède un centre réellement
transparent. Il commence à recouvrir l'insigne vers `66 px` de rayon : le
chevauchement caché d'environ `4 px` empêche tout jour transparent autour du
disque tout en conservant le cercle doré et ses rivets devant l'insigne.

## Assets runtime finaux

- `primary-navigation-button-normal-v2.png`
- `primary-navigation-button-selected-v2.png`
- `primary-navigation-city-v2.png`
- `primary-navigation-heroes-v2.png`
- `primary-navigation-dungeon-v1.png`
- `primary-navigation-storage-v1.png`
- `primary-navigation-junction-upper-v2.png`
- `primary-navigation-junction-lower-v2.png`
- `dungeon-party-class-medallion-v1.png`
- `dungeon-party-class-medallion-ring-v3.png`
- `dungeon-class-plaque-novice-v2.png`
- `dungeon-party-vital-bar-frame-v1.png`
- `dungeon-auto-play-v1.png`
- `dungeon-auto-pause-v1.png`

Ils résident sous
`src/assets/images/ui/secondary-navigation-rail/`. Le manifeste versionné
`assets/design/cdi-069/manifest.json` consigne dimensions, empreintes SHA-256,
scripts de préparation et invariants.

Les sources ImageGen et previews sous `assets/design/cdi-069/sources/`,
`assets/design/cdi-069/previews/` et `tmp/` restent locales et ignorées ou hors
commit. Les variantes `dungeon-party-class-medallion-ring-v2.png` et
`dungeon-class-plaque-novice-v1.png` sont supersédées et ne font pas partie du
périmètre publié.

## Code et responsabilités

- `DungeonProgressBanner.tsx` ne porte que le rendu, les interactions locales
  et les couches visuelles.
- `createDungeonProgressBannerView` prépare hors React les quatre emplacements,
  pourcentages, états et données de classe.
- `App.tsx` fournit la vue canonique et le callback existant de pause/reprise.
- `AppShell.tsx` place les deux parties dans le bandeau desktop.
- Les fixtures du catalogue couvrent les états rempli et vide avec des classes
  explicites.

## Sous-lot différé — insignes T1+

Implications : une classe T1 affiche actuellement le cadre occupé sans plaque
spécifique. Cela ne bloque ni les interactions, ni les jauges, ni le suivi du
groupe, mais l'identité visuelle de sa classe reste absente.

Dépendances : définir la hiérarchie de matériaux par tier et créer un insigne
cohérent pour chaque classe, puis associer `Hero["classType"]` à son asset dans
un modèle de présentation hors React.

Critères de clôture :

1. chaque classe concernée possède un asset circulaire transparent à
   l'extérieur, compatible avec le chevauchement sous le cadre V3 ;
2. la hiérarchie de matériaux T1+ est validée visuellement ;
3. le mapping exhaustif est testé sans logique métier ajoutée au composant ;
4. les assets et leurs empreintes sont ajoutés au manifeste CDI-069.

## Validations

Après l'intégration finale de l'insigne Novice :

- tests ciblés `AppShell`, `DungeonProgressBanner` et présentation Donjon :
  `15/15` réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint` : réussi ;
- validation visuelle finale : rapportée par l'utilisateur.

Aucun test navigateur n'a été exécuté par Codex. Les validations complètes de
pré-publication et l'état Git publié doivent être consignés dans le compte rendu
de publication, pas anticipés dans ce handoff.

## Reprise

Lire `AGENTS.md`, ce document, puis le handoff des boutons si leurs réglages
doivent être compris. Ne pas retoucher le menu officiellement validé lors du
sous-lot T1+ : seules les plaques placées sous le cadre V3 et leur mapping sont
dans le périmètre.
