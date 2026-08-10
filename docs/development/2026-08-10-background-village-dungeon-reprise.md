# Background du shell CDIdle — état et reprise

## Objectif

Utiliser un panorama fantasy comme fond décoratif du shell authentifié de
CDIdle, derrière les pages Cité, Aventuriers, Donjon, Coffre et Compte.
L'image ne porte aucune information fonctionnelle et ne pilote aucune
interaction : les panneaux, valeurs, actions et états restent rendus en DOM.

## Direction visuelle validée

- ville fortifiée à gauche et donjon monumental à droite ;
- vallée centrale, rivière, pont et route reliant les deux zones ;
- matte painting fantasy réaliste, lisse, sombre mais lisible ;
- ville aérée avec des bâtiments structurellement plausibles ;
- maison du chef, église, caserne, scierie, forge et ferme reconnaissables par
  leur architecture, sans texte ni marqueur ;
- portail du donjon et quatre balises violettes comme seules sources magiques
  principales ;
- aucun personnage, animal, monstre, combat, logo, texte ou élément UI dans le
  bitmap.

Les références UI et pixel-art initiales ont été retirées de la génération
finale, car elles influençaient trop fortement le rendu. Le prompt consolidé est
conservé dans les prompts versionnés, dont
[`assets/design/cdi-069/app-shell-background-v3-main-safe.prompt.md`](../../assets/design/cdi-069/app-shell-background-v3-main-safe.prompt.md).

## Asset actuel

| Rôle | Chemin | Dimensions | Poids | État |
| --- | --- | ---: | ---: | --- |
| Source v1 PNG | `assets/design/cdi-069/sources/app-shell-background-v1.png` | 1672×941 | 2,44 Mo | composition de référence conservée |
| Sortie ImageGen v2 | `assets/design/cdi-069/sources/app-shell-background-v2-ultrawide.png` | 1938×811 | 2,41 Mo | source brute au ratio 43:18 |
| Master v2 PNG | `assets/design/cdi-069/sources/app-shell-background-v2-ultrawide-3440x1440.png` | 3440×1440 | 8,69 Mo | master préparé pour les deux écrans |
| Runtime v2 JPEG | `src/assets/images/backgrounds/app-shell-background-v2-ultrawide.jpg` | 3440×1440 | 726 Ko | `rejected` : focales masquées par le main |
| Sortie ImageGen v3 | `assets/design/cdi-069/sources/app-shell-background-v3-main-safe-generated.png` | 1939×811 | 2,38 Mo | source brute au ratio ultrawide |
| Master v3 PNG | `assets/design/cdi-069/sources/app-shell-background-v3-main-safe-3440x1440.png` | 3440×1440 | 8,50 Mo | zone centrale adaptée au main |
| Runtime v3 JPEG | `src/assets/images/backgrounds/app-shell-background-v3-main-safe.jpg` | 3440×1440 | 710 Ko | `processed` |

L'entrée `app-shell-background-v3-main-safe` du manifeste
[`assets/design/cdi-069/manifest.json`](../../assets/design/cdi-069/manifest.json)
est passée à l'état `context-approved` après intégration et validation visuelle
pendant la session des 10 et 11 août 2026.

## Intégration actuelle

- `AppShell.tsx` porte la classe `app-shell-background`.
- `src/index.css` n'affiche aucune image sous `1280px` : le portable conserve le
  fond sombre uniforme.
- En desktop, la v3 utilise `background-position: center top` et
  `background-size: cover`.
- Aucun voile sombre supplémentaire n'est appliqué : l'image est déjà assez
  sombre et le filtre testé rendait l'ensemble trop obscur.

Le panorama reste absent sous `1280px`.

## Header et barre de menu

La référence utilisateur `D:\idle\heeader clear.png` est identique par SHA-256
à `assets/design/cdi-069/references/header-reference.png`.

Une barre vide a été générée avec ImageGen, sans icône, texte, valeur ou action
fonctionnelle dans le bitmap. Elle est préparée en trois tranches transparentes :

- gauche fixe avec blason : `520×228` ;
- centre bois extensible : `256×228` ;
- droite fixe avec gemme : `212×228`.

`ResourceHeader.tsx` superpose les éléments DOM à ces tranches. En desktop, les
deux caps restent visibles et le centre occupe la largeur restante. Sous le
breakpoint `lg`, les caps raster sont masqués, le centre couvre le header et le
petit `CrestBadge` DOM reste affiché. Le nom de la cité, les ressources, les
taux et le compte restent accessibles et interactifs.

L'asset `header-menu-bar-v1` reste `processed` jusqu'à validation visuelle sur
les deux écrans desktop et sur portable.

## Contrainte de cadrage traitée

Les écrans Windows détectés sont :

- écran principal : `3440×1440`, zone de travail `3440×1392`, échelle 100 % ;
- écran secondaire : `1920×1080`, zone de travail `1920×1032`, échelle 100 %.

Le master 43:18 s'affiche à taille native sur le 3440×1440. Sur le 1920×1080,
`cover` le réduit et rogne uniquement les extensions latérales. Sa zone centrale
Le `main` mesure au maximum `1440 px`. Sur l'écran principal, sa zone
`x=1000–2440` contient uniquement la vallée peu contrastée. La ville est placée
dans la gouttière gauche `x=120–940` et le donjon dans la gouttière droite
`x=2500–3320`. Le navigateur n'a pas à agrandir le bitmap sur ces deux écrans.

Éviter simultanément agrandissement, rognage et bandes sur deux ratios différents
est impossible avec un seul bitmap. Le compromis retenu conserve toute la
hauteur et limite le rognage 16:9 au décor latéral.

## Master produit

- canevas préparé : **3440×1440 px**, ratio **43:18** ;
- format source : PNG ;
- runtime : JPEG qualité 90 ;
- réserver les `1440 px` centraux au décor calme sous le `main` ;
- placer les silhouettes importantes dans les deux gouttières visibles ;
- laisser suffisamment de ciel au-dessus des deux monuments : aucun sommet ne
  doit toucher les 8 % supérieurs ;
- conserver la vallée et la zone de lecture centrale autour de `42–58 %` ;
- ne pas ajouter de détail fonctionnel, personnage ou nouvelle magie ;
- préserver le style, la structure de la ville et le donjon de la source actuelle.

Cette composition utilise :

```css
background-position: center top;
background-size: cover;
```

sans couper les monuments sur les formats desktop courants.

## Essais déjà rejetés

- carte ou village isométrique très détaillé ;
- rendu pixel-art ou pseudo-pixel-art ;
- références UI utilisées directement pour le style ;
- ville trop dense avec des toits fusionnés ;
- arbres, rivière, routes ou escaliers placés sans logique ;
- effets magiques violets aléatoires sur le donjon ;
- voile sombre CSS superposé à l'image ;
- panorama derrière le header et les menus sur portable ;
- `background-size: contain` comme solution permanente.
- v2 ultrawide : ville et escalier du donjon masqués par le `main` central.

## Fichiers actuellement concernés

- `src/components/app-shell/AppShell.tsx` ;
- `src/index.css` ;
- `tests/AppShell.test.tsx` ;
- `tests/browser/appShell.responsive.browser.spec.ts` ;
- `assets/design/cdi-069/manifest.json` ;
- `assets/design/cdi-069/app-shell-background-v1.prompt.md` ;
- `assets/design/cdi-069/app-shell-background-v3-main-safe.prompt.md` ;
- `assets/design/cdi-069/sources/app-shell-background-v1.png` ;
- `assets/design/cdi-069/sources/app-shell-background-v3-main-safe-3440x1440.png` ;
- `src/assets/images/backgrounds/app-shell-background-v3-main-safe.jpg` ;
- `src/components/app-shell/ResourceHeader.tsx` ;
- `src/assets/images/ui/header-menu-bar-v1-left.png` ;
- `src/assets/images/ui/header-menu-bar-v1-center.png` ;
- `src/assets/images/ui/header-menu-bar-v1-right.png` ;
- `assets/design/cdi-069/header-menu-bar-v1.prompt.md`.

Le changement déjà présent dans `AGENTS.md` est indépendant de ce lot et doit
rester préservé.

## Validation déjà réalisée

- test unitaire `AppShell` : 5 tests passés ;
- typecheck : passé ;
- lint : passé ;
- build Vite : passé ;
- budget bundle : passé ;
- source, runtime, dimensions et hachages du manifeste : contrôlés.

Le test Playwright responsive de la v2 a été rapporté par l'utilisateur avec
`2 passed (4.5s)`. Il doit être réexécuté pour le nouveau chemin v3, puis la
composition v3 doit être validée visuellement dans l'application réelle.

## Reprise recommandée

1. Exécuter le test Playwright responsive interactif.
2. Faire contrôler visuellement par l'utilisateur sur les écrans réels
   3440×1440 et 1920×1080, en vérifiant l'absence d'agrandissement perceptible,
   le cadrage des deux monuments et la lisibilité des panneaux.
3. Vérifier en 360×800 et 390×844 que le panorama reste absent et qu'aucun
   débordement n'est introduit.
4. Conserver l'état `context-approved` tant qu'aucun nouveau cadrage ou asset ne
   remplace la v3 validée.

## Commandes de validation

Depuis PowerShell, à la racine `D:\codex\CDIdle` :

```powershell
npm.cmd test -- --run tests/AppShell.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:layout-browser -- tests/browser/appShell.responsive.browser.spec.ts
npm.cmd run build
npm.cmd run check:bundle
```

Le test navigateur est interactif dans ce workflow : l'utilisateur l'exécute et
rapporte son résultat. Aucun commit, push ou déploiement n'a été réalisé pour ce
lot de background.
