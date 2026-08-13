# Handoff — boutons et ornements de navigation principale

## Nature du document

Ce fichier prépare la reprise du 13 août 2026. Il complète le handoff du
bandeau secondaire du 12 août et consigne la version visuellement validée des
quatre boutons de navigation ainsi que de leurs trois raccords internes.

## État visuel validé

L'utilisateur a validé le rendu final en contexte dans son navigateur.

- La navigation desktop contient exactement quatre boutons de même taille.
- Les boutons sont jointifs, sans espace transparent visible entre eux.
- Chaque bouton occupe `124 x 105 px` dans un panneau de `496 x 105 px`.
- L'image de fond déborde verticalement de `2 px` en haut, soit un affichage
  effectif de `124 x 107 px`, afin de supprimer le filet transparent sous la
  barre supérieure.
- L'état normal utilise un métal sombre cohérent avec le bandeau.
- L'état sélectionné utilise le bouton doré.
- Les icônes, libellés, états désactivés et interactions restent rendus en DOM.
- Les images décoratives restent limitées au desktop à partir de `1440 px`.

L'utilisateur a également validé visuellement la famille finale des quatre
icônes en contexte. Elles proviennent d'une même planche 2 × 2, détourée en
quatre cellules identiques sans remise à l'échelle individuelle du sujet.

Assets des icônes :

- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-city-v2.png`
- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-heroes-v2.png`
- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-dungeon-v1.png`
- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-storage-v1.png`

Réglages desktop finaux validés :

- Cité : `60 x 55 px`, `x: -2 px`, `y: -4 px`, libellé `y: -4 px` ;
- Aventuriers : `64 x 64 px`, `x: +3 px`, `y: -9 px`, libellé `y: -7 px` ;
- Donjon : `64 x 64 px`, `x: -2 px`, `y: +3 px`, libellé `y: -7 px` ;
- Coffre : `64 x 64 px`, `x: +3 px`, `y: +1 px`, libellé `y: -7 px`.

Le format compact conserve des boîtes `20 x 20 px` sans les ajustements
desktop. Les cadenas historiques restent affichés lorsque la navigation est
verrouillée.

Assets des boutons :

- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-button-normal-v2.png`
- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-button-selected-v2.png`

Le panneau gauche est positionné dans `AppShell` à
`[left: 113, top: 36, width: 496, height: 105]`.

## Ornements de raccord validés

Six images sont rendues : un ornement supérieur et un ornement inférieur sur
chacune des trois jonctions internes situées à `25 %`, `50 %` et `75 %` du
panneau. Aucun ornement n'est placé aux extrémités gauche et droite.

- Taille réelle et taille CSS : `38 x 25 px`.
- Ornement supérieur : gemme violette visible, position `top: -6 px`.
- Ornement inférieur : sans gemme, position `bottom: -3 px`.
- Les ornements supérieurs passent devant les boutons et devant le rail.
- Les ornements inférieurs passent derrière les boutons.
- Les ornements sont centrés horizontalement sur chaque jonction.
- La couche décorative ignore les événements pointeur.

Assets runtime :

- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-junction-upper-v2.png`
- `src/assets/images/ui/secondary-navigation-rail/primary-navigation-junction-lower-v2.png`

Les premiers essais à `21 x 14 px` étaient trop petits. Le passage à
`42 x 28 px` rendait le raccord lisible mais trop imposant. La taille finale
validée est une réduction d'environ 10 %, produite depuis les sources
détaillées plutôt que par agrandissement CSS.

## Production et traçabilité des images

Les images ont été générées avec l'outil ImageGen intégré, sans clé API. Les
fonds chroma ont été détourés localement et les assets finaux redimensionnés de
manière déterministe.

- Prompt boutons :
  `assets/design/cdi-069/primary-navigation-buttons-v1.prompt.md`.
- Prompt ornements :
  `assets/design/cdi-069/primary-navigation-junction-ornaments-v2.prompt.md`.
- Préparation boutons : `scripts/prepare-primary-navigation-buttons.ps1`.
- Extraction des ornements :
  `scripts/prepare-primary-navigation-junction-ornaments.ps1`.
- Redimensionnement exact :
  `scripts/resize-navigation-junction-ornaments.ps1`.
- Prompt de la planche commune des icônes :
  `assets/design/cdi-069/primary-navigation-icon-sheet-v2.prompt.md`.
- Extraction commune des quatre cellules :
  `scripts/prepare-primary-navigation-icon-sheet.ps1`.
- Manifeste : `assets/design/cdi-069/manifest.json`.

Les sources et previews sous `assets/design/cdi-069/sources/` et
`assets/design/cdi-069/previews/` sont locales et ignorées par Git. Les quatre
PNG runtime, les prompts et les scripts de production doivent être conservés.

## Structure frontend

- `PrimaryNavigation.tsx` fournit les fonds normal/sélectionné et les deux
  ornements à `NavigationTabs`.
- `NavigationTabs.tsx` conserve les boutons comme éléments interactifs DOM et
  ajoute une couche décorative desktop pour les raccords.
- La liste des boutons est en `z-10`.
- Les ornements supérieurs sont en `z-20`.
- Les ornements inférieurs sont en `z-0`.
- Le `primary-navigation-slot` ne crée plus son ancien contexte `z-10`, ce qui
  permet aux seuls ornements supérieurs de passer devant le rail.

Fichiers principaux :

- `src/components/app-shell/AppShell.tsx`
- `src/components/app-shell/PrimaryNavigation.tsx`
- `src/ui/patterns/NavigationTabs.tsx`
- `tests/AppShell.test.tsx`

## Décisions et limites à préserver

- Ne pas remplir le fond transparent du panneau pour masquer les raccords.
- Ne pas réintroduire d'espace entre les quatre boutons.
- Ne pas placer d'ornement sur les deux bords extérieurs.
- Ne pas agrandir un petit raster avec CSS : repartir des sources détaillées
  pour toute nouvelle taille.
- Ne pas modifier le bandeau V5 validé sans demande explicite.
- L'utilisateur assure la validation visuelle ; Codex n'a pas ouvert ni
  inspecté le navigateur.
- Le skill projet `.agents/skills/cdidle-visual-production` a été supprimé
  explicitement à la demande de l'utilisateur et ne doit pas être restauré.

## Validations réalisées

Après la dernière modification de taille :

- `npm.cmd test -- --run tests/AppShell.test.tsx` : `6/6` réussis ;
- `npm.cmd run typecheck` : réussi.

Après la modification finale d'empilement :

- `npm.cmd test -- --run tests/AppShell.test.tsx` : `6/6` réussis.
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint -- --quiet` : réussi.

Après l'intégration et les ajustements finaux des quatre icônes :

- `npm.cmd test -- --run tests/AppShell.test.tsx` : `6/6` réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint -- --quiet` : réussi ;
- validation visuelle finale du menu : réalisée et rapportée par l'utilisateur.

Aucun test navigateur n'a été exécuté par Codex.

## État local au moment du handoff

Les ports connus ne sont plus en écoute au moment de la rédaction :

- frontend Vite `3000` : arrêté ;
- Supabase API `54321` : arrêtée ;
- Supabase Studio `54323` : arrêté.

Commandes de reprise depuis PowerShell dans `D:\codex\CDIdle` :

```powershell
npm.cmd run dev
npm.cmd exec --offline -- supabase start
npm.cmd exec --offline -- supabase functions serve game-api --env-file supabase/functions/.env
```

## Reprise recommandée demain

1. Lire `AGENTS.md`, ce document et
   `docs/development/2026-08-12-secondary-navigation-rail-handoff.md`.
2. Relancer le frontend et Supabase si une validation interactive est utile.
3. Recharger le frontend à `1440 px` ou plus et contrôler brièvement la version
   validée : quatre boutons jointifs, trois raccords, gemmes supérieures devant
   la barre, ornements inférieurs sous les boutons.
4. Décider du prochain élément d'habillage sans retoucher cette navigation
   validée.
5. Avant tout commit, auditer le statut et le diff pour séparer les changements
   utilisateur sans rapport, notamment `AGENTS.md`.

La clôture complète du menu et de son suivi de groupe est consignée dans
`docs/development/2026-08-13-menu-complete-handoff.md`. Ce document reste la
référence détaillée pour la production des quatre boutons de gauche.
