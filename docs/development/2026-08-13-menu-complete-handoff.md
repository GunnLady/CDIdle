# Handoff — menu principal complet

## Statut validé

Le 13 août 2026, l'utilisateur a validé officiellement le menu principal
desktop complet : navigation à gauche et suivi du Donjon à droite. Cette
validation visuelle a été réalisée par l'utilisateur dans son navigateur ;
Codex n'a pas ouvert ni inspecté l'application avec un navigateur.

L'insigne Novice T0 est terminé et sert de contrat visuel et technique. Les
neuf insignes T1 ont ensuite été intégrés et validés visuellement par
l'utilisateur le 14 août 2026.

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
Sur desktop, son réglage final est `122 x 103 px`, déplacé de `x -10 px` et
`y +2 px`. L'icône play reçoit seule une compensation de `x +5 px`; l'icône
pause reste centrée.

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

L'insigne Novice est une rose des vents à huit branches peinte en cuivre NMM
sur une plaque illustrée. Le runtime `dungeon-class-plaque-novice-v3.png` est un
disque opaque de rayon `70 px` dans un canevas transparent de `192 x 192 px`.
La V3 remplace la texture métallique réaliste de la V2 par des valeurs peintes
plus graphiques, un relief cuivré en larges facettes, quelques griffures et une
oxydation retenue. Le contraste du symbole est renforcé sans modifier ses
proportions ni le chevauchement sous le cadre.

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
- `dungeon-class-plaque-novice-v3.png`
- `dungeon-class-plaque-guerrier-v1.png`
- `dungeon-class-plaque-voleur-v1.png`
- `dungeon-class-plaque-archer-v1.png`
- `dungeon-class-plaque-mage-v1.png`
- `dungeon-class-plaque-acolyte-v1.png`
- `dungeon-class-plaque-aede-v1.png`
- `dungeon-class-plaque-druide-v1.png`
- `dungeon-class-plaque-artificier-v1.png`
- `dungeon-class-plaque-pugiliste-v1.png`
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
- `dungeonClassPlaquePresentation.ts` associe exhaustivement chaque
  `Hero["classType"]` à son asset runtime hors React.
- `App.tsx` fournit la vue canonique et le callback existant de pause/reprise.
- `AppShell.tsx` place les deux parties dans le bandeau desktop.
- Les fixtures privées du catalogue couvrent les états rempli et vide, ainsi
  que neuf aventuriers T1 locaux de niveau 10 répartis sur trois bannières.

## Insignes T1 — intégrés et validés

Les neuf classes T1 possèdent désormais une plaque argent NMM spécifique :
Guerrier, Voleur, Archer, Mage, Acolyte, Aède, Druide, Artificier et Pugiliste.
Le cadrage de chaque source est réglé indépendamment pour centrer au mieux son
symbole sous le cadre V3. Le centrage suit les marges de la boîte visible du
symbole plutôt que le milieu géométrique du canevas. Le Voleur utilise une
capuche sans visage ; l'orbe, le soleil, la lyre, l'engrenage et le poing ont
été réduits après la première intégration.

Le catalogue privé `?ui-catalog=1` sert de triche locale déterministe pour les
comparer ensemble. Il ne crée aucune donnée Supabase et ne modifie ni la partie
canonique ni une sauvegarde joueur.

Critères de clôture :

1. chaque classe concernée possède un asset circulaire transparent à
   l'extérieur, compatible avec le chevauchement sous le cadre V3 ;
2. le rendu argent NMM et les centrages sont validés visuellement par
   l'utilisateur ;
3. le mapping exhaustif est testé sans logique métier ajoutée au composant ;
4. les assets et leurs empreintes sont ajoutés au manifeste CDI-069.

Les quatre critères sont couverts. La validation visuelle finale a été
rapportée par l'utilisateur après les derniers ajustements de taille et de
position.

## Insigne de race Humain — différé à la fiche héros

Une source détourée d'insigne Humain a été validée visuellement : bouclier vert
forêt, lion doré, couronne, gemme violette et lierre, dans la DA du header. Elle
est documentée dans
`assets/design/cdi-069/dungeon-human-insignia-v1.prompt.md`.

Cet insigne n'est pas un asset de classe et ne doit pas apparaître dans le
bandeau Donjon. Son intégration runtime est différée au sous-lot de la fiche
héros, avec mapping de `Humain` et `Humaine` hors React, validation responsive
et ajout au manifeste.

## Validations

Audit pré-publication du 14 août 2026 :

- suite Vitest complète : `109` fichiers et `784/784` tests réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint -- --quiet` : réussi ;
- `npm.cmd run build` : réussi ;
- manifeste CDI-069 : les `10` plaques intégrées existent et leurs empreintes
  SHA-256 correspondent ;
- validation visuelle finale du bouton, du Novice et des neuf T1 : rapportée
  par l'utilisateur.

Aucun test navigateur n'a été exécuté par Codex. Les validations complètes de
pré-publication et l'état Git publié doivent être consignés dans le compte rendu
de publication, pas anticipés dans ce handoff.

## Reprise

Lire `AGENTS.md`, ce document, puis le handoff des boutons si leurs réglages
doivent être compris. Le menu et les plaques T1 sont officiellement validés et
ne doivent pas être retouchés lors du futur sous-lot de la fiche héros.
