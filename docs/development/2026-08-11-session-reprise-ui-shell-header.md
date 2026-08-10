# Reprise de session UI — shell, background et header

## Nature du document

Ce fichier est un contexte de reprise de session, pas un ticket. Il rassemble
les décisions prises les 10 et 11 août 2026 afin de reprendre le travail sans
redécouvrir les choix visuels ni régénérer des assets déjà validés.

## Périmètre travaillé

- background décoratif du shell desktop ;
- panneau bois du header et ornements latéraux ;
- typographie et placement du nom de cité ;
- rendus raster des cinq ressources ;
- séparateurs entre ressources ;
- bouton Compte personnalisé ;
- comportement responsive existant du header.

La production n'a volontairement pas utilisé le skill
`cdidle-visual-production`, car son influence pixel/HD avait été écartée pour
ce lot. Les générations raster ont été confirmées une par une avec
l'utilisateur avant envoi.

## État visuel validé

### Background du shell

- Asset runtime :
  `src/assets/images/backgrounds/app-shell-background-v3-main-safe.jpg`.
- Master : `3440 x 1440`, prévu pour les écrans `3440 x 1440` et
  `1920 x 1080` sans zoom navigateur volontaire.
- Le `main` central de `1440 px` masque une vallée calme ; la ville et le
  donjon restent dans les gouttières latérales.
- Affichage uniquement à partir de `1280 px`, avec `cover`, centré en haut.
- Le background peut passer sous le header.

### Structure du header desktop

- Largeur maximale : `1440 px`, identique au `main`.
- Ornement gauche validé : lion, couronne, armes et feuillages.
- Ornement droit validé : `header-menu-ornament-right-v3.png` ; ne plus le
  régénérer ni le modifier sans nouvelle demande explicite.
- Le bois s'arrête sous les ornements, sans dépasser leurs extrémités.
- Aucune ombre basse ne sépare le header du `main`.
- Le panneau central actuel est
  `src/assets/images/ui/header-menu-bar-v2-center.png` (`1024 x 912`).
  Le bois est un noyer sombre vieilli. Les contours ont été refroidis et
  désaturés après génération pour éviter un rendu olive trop propre une fois
  affiché. Cette correction a été explicitement validée visuellement.

### Ressources desktop

Les valeurs et taux restent en DOM. Les illustrations raster ne sont affichées
qu'à partir du breakpoint `xl`; les icônes compactes historiques restent
actives sous ce breakpoint.

| Ressource | Runtime | Taille CSS desktop | État |
| --- | --- | ---: | --- |
| Or | `resource-gold-v1.png` | `44 px` | validé, lion sur la pièce principale |
| Nourriture | `resource-food-v1.png` | `40 px` | validé, gros cuissot rôti |
| Bois | `resource-wood-v1.png` | `40 px` | accepté avec réserve visuelle explicite |
| Pierre | `resource-stone-v1.png` | `40 px` | validé |
| Minerai | `resource-ore-v1.png` | `44 px` | validé |

Le bloc est positionné à gauche, à l'ancien emplacement du nom de cité, et
décalé de `40 px` supplémentaires vers la gauche et de `5 px` vers le bas sur
desktop. Les séparateurs sont des losanges CSS de `8 px` en acier, avec un
retrait cumulé de `4 px` à droite.

La gemme raster créée comme séparateur a été rejetée : elle ressemblait à une
sixième ressource et ses marges transparentes perturbaient l'espacement. Sa
source reste archivée et marquée `rejected` dans le manifeste.

### Nom de cité

- Police : `Metamorphous`, en capitales, caractères spéciaux conservés.
- Le mot « Domaine » a été supprimé.
- Sur desktop, le nom est placé à gauche du bouton Compte.
- Décalage local : `3 px` vers la gauche.
- Couleur : dégradé doré discret, dérivé du lion, sans ancien effet graphique.
- L'ellipsis est désactivé sur desktop.

### Bouton Compte

- Runtime : `src/assets/images/ui/account-button-v2.png`.
- Forme : carré en fer aux angles fortement biseautés.
- Emblème : silhouette continue avec cape et couronne à trois pointes.
- Fer recoloré avec l'ornement au lion fourni directement comme référence
  ImageGen ; forme, relief et icône conservés.
- Taille : `41 x 41 px` sur desktop, `44 x 44 px` sur formats compacts.
- Placement desktop : `40 px` vers la gauche et `5 px` vers le bas.
- Aucun label visible ; `aria-label="Ouvrir le compte"` reste présent.
- Hover validé : bouton fixe, lumière ambre/or dominante et aura verte plus
  diffuse. Aucun mouvement au survol.

## Responsive

- Mobile `< 640 px` : panneau complet `mobile-header-panel-v1.png` ; icône de
  château masquée ; ressources sans cadre ni fond.
- Tablette : comportement structurel jugé correct avant le recentrage du lot
  sur desktop ; les nouvelles illustrations de ressources restent masquées.
- Desktop `xl` : composition finale décrite ci-dessus.

À la reprise, contrôler en priorité les formats `360 x 800`, `390 x 844` et une
tablette réelle ou simulée. Les dernières modifications de composition sont
limitées à `xl`, sauf le nouvel asset du bouton Compte qui est aussi visible en
compact.

## Fichiers principaux

- `src/components/app-shell/AppShell.tsx`
- `src/components/app-shell/ResourceHeader.tsx`
- `src/index.css`
- `src/ui/foundations/tokens.css`
- `tests/AppShell.test.tsx`
- `tests/browser/appShell.responsive.browser.spec.ts`
- `assets/design/cdi-069/manifest.json`
- `assets/design/cdi-069/*.prompt.md`
- `assets/design/cdi-069/sources/*`
- `src/assets/images/backgrounds/*`
- `src/assets/images/ui/*`

Le changement déjà présent dans `AGENTS.md` est indépendant du lot UI. Il doit
rester préservé et ne pas être inclus dans le commit de ce lot sauf demande
explicite.

## Sources, versions et poids Git

- Git contient uniquement les assets runtime validés, les prompts finaux et le
  manifeste de publication.
- Les masters, sorties ImageGen, versions rejetées et previews restent dans les
  dossiers locaux ignorés `assets/design/cdi-069/sources/` et `previews/`.
- Les onze assets runtime publiés représentent environ `3,43 Mo` au total.
- Les icônes et ornements ont été réduits à environ quatre fois leur taille
  d'affichage pour préserver les écrans haute densité sans publier les PNG
  `1254 px` utilisés à seulement `40–44 px`.
- Le background `3440 x 1440` et le panneau central haute définition restent
  inchangés, car leur définition répond directement au contrat d'affichage.

## Validations et limites connues

- Validation visuelle desktop : réalisée par l'utilisateur pendant la session.
- Contrôle navigateur par Codex : indisponible, car le connecteur Chrome local
  n'était pas installé/configuré ; ne pas reboucler dessus sans changement.
- Test Playwright responsive final rapporté par l'utilisateur après les
  derniers ajustements du header : `2 passed (3.2s)`.
- Le build standard vers `dist` peut échouer si `dist/assets` est verrouillé par
  le serveur local. Le build isolé suivant est la preuve de remplacement :

  ```powershell
  npm.cmd run build -- --outDir .codex-build-check
  ```

  Supprimer ensuite uniquement ce dossier temporaire vérifié.

## Commandes locales utiles

Depuis PowerShell dans `D:\codex\CDIdle` :

```powershell
npm.cmd run dev
npm.cmd exec --offline -- supabase start
npm.cmd exec --offline -- supabase functions serve game-api --env-file supabase/functions/.env
```

La première commande lance le frontend. Les deux suivantes démarrent le socle
Supabase local puis servent explicitement `game-api` si l'Edge Function n'est
pas déjà disponible.

## Reprise recommandée demain

1. Relire ce document et ouvrir le frontend local.
2. Vérifier visuellement le header sur les deux écrans desktop réels.
3. Vérifier mobile et tablette, notamment le bouton Compte compact et les noms
   de cité longs.
4. Exécuter le test Playwright responsive avec le service local disponible.
5. Poursuivre l'habillage des autres éléments de l'application en réutilisant
   le lion comme référence directe pour les métaux.

## État Git et déploiement au moment de la rédaction

Le commit, le push et les déploiements sont volontairement différés jusqu'à la
confirmation explicite immédiatement préalable exigée par `AGENTS.md`. Le
frontend doit être déclenché manuellement après le push ; le backend `game-api`
ne nécessite un redéploiement que si son code ou sa configuration font partie
du commit publié.
