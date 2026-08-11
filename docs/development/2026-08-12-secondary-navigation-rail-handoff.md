# Handoff — bandeau de navigation secondaire desktop

## Nature du document

Ce fichier est le contexte de reprise de la session du 12 août 2026. Il décrit
le bandeau placé sous le header, les décisions visuelles validées et l’état
technique exact du dépôt. Le travail reste volontairement limité au desktop ;
la tablette et le mobile sont différés.

## État validé en fin de session

L’utilisateur a validé visuellement le rendu final dans l’application après les
derniers ajustements de position et de scroll.

- Le bandeau mesure `1440 x 173 px`.
- Il est affiché uniquement à partir de `1440 px`.
- Il n’est pas sticky et défile normalement avec la page.
- Le raccord principal se situe à `632 px`, soit environ `44/56`.
- La fenêtre transparente gauche mesure `492 x 103 px` et commence à
  `[115, 35]` dans le bandeau runtime.
- Les quatre boutons restent rendus en DOM sous le décor raster.
- Le panneau Donjon reste opaque et son contenu fonctionnel est rendu en DOM.
- La barre conserve une gemme violette compacte au raccord, quatre petites
  gemmes ambrées aux extrémités et aucun rivet.
- Le métal froid, l’or vieilli et les ornements végétaux sont alignés sur la
  direction artistique du lion du header.
- Une réserve verticale totale de `178 px` est conservée pour le bandeau de
  `173 px`, soit `5 px` supplémentaires sous l’image.

Asset runtime canonique :

`src/assets/images/ui/secondary-navigation-rail/secondary-navigation-rail-background-v5.png`

SHA-256 :

`4493bc98cd166831160992085b2e8df360a22c98e1fc73bc7fd09da5130dcb2b`

Le manifeste classe désormais cette V5 comme `integrated`, à la suite de la
validation visuelle utilisateur en contexte.

## Détourage et source locale

La génération finale a d’abord produit une version à fond cyan uniforme. Le
cyan a ensuite été converti en alpha par séparation de teinte, avec restitution
des couleurs de bord pour éviter le halo cyan observé lors du premier essai.

- Source cyan locale ignorée par Git :
  `assets/design/cdi-069/sources/secondary-navigation-rail-background-v5-cyan-source.png`.
- Preview alpha locale ignorée par Git :
  `assets/design/cdi-069/previews/secondary-navigation-rail-background-v5-alpha.png`.
- Source ImageGen : `2172 x 724 px`.
- Sujet recadré : `[24, 235, 2123, 255]`.
- Production runtime : `1440 x 173 px`.
- Contrôles alpha réalisés : extérieur transparent, fenêtre gauche
  transparente, panneau droit opaque, aucun RGB caché dans les pixels
  totalement transparents.

Le prompt et le procédé de chroma key sont consignés dans
`assets/design/cdi-069/secondary-navigation-rail-background-v5.prompt.md`.

## Structure frontend actuelle

`src/components/app-shell/SecondaryNavigationRailFrame.tsx` charge uniquement
la V5 et place le décor au-dessus des boutons avec `pointer-events: none`.

Dans `src/components/app-shell/AppShell.tsx` :

- conteneur du bandeau : `1440 x 178 px`, `z-30`, non sticky ;
- compensation haute : `margin-top: -10px`, exactement égale au padding haut
  desktop du viewport ; elle ne franchit plus la limite du `<main>` ;
- navigation : `[left: 115, top: 35, width: 492, height: 103]` ;
- suivi Donjon : `[left: 645, top: 35, width: 600, height: 102]` ;
- le `<main>` pleine largeur porte `overflow-y-auto` et
  `overflow-x-hidden` ;
- son enveloppe intérieure reste centrée et limitée à `1440 px` ;
- le menu fait donc partie de la zone scrollable et ne reste pas fixe ;
- la scrollbar verticale est repoussée au bord du `<main>` plutôt que sur le
  bandeau centré ; la fausse scrollbar horizontale est supprimée.

La tentative consistant à rendre uniquement le contenu sous le bandeau
scrollable a été rejetée, car elle rendait le menu sticky de fait. Ne pas la
réintroduire.

## Fichiers principaux du sous-lot

- `src/components/app-shell/AppShell.tsx`
- `src/components/app-shell/SecondaryNavigationRailFrame.tsx`
- `src/components/app-shell/PrimaryNavigation.tsx`
- `src/components/app-shell/DungeonProgressBanner.tsx`
- `src/ui/patterns/NavigationTabs.tsx`
- `tests/AppShell.test.tsx`
- `assets/design/cdi-069/manifest.json`
- `assets/design/cdi-069/secondary-navigation-rail-background-v5.prompt.md`
- `src/assets/images/ui/secondary-navigation-rail/secondary-navigation-rail-background-v5.png`

`ResourceHeader.tsx` contient également des ajustements précédents du header.
Le changement déjà présent dans `AGENTS.md` appartient à l’utilisateur et doit
être préservé ; ne pas l’inclure automatiquement dans un commit UI.

## Anciens essais à auditer avant commit

Le dossier runtime et le dossier de design contiennent encore plusieurs essais
non suivis issus de l’ancienne stratégie de découpage :

- `left-cap.png`, `right-cap.png`, `navigation-active.png`,
  `navigation-inactive.png`, `junction-gem.png`, `dungeon-panel.png` ;
- `secondary-navigation-rail-background-146.png` ;
- `secondary-navigation-rail-background-185.png` ;
- `secondary-navigation-rail-background-v4.png` ;
- prompts V2 et V4 ;
- `scripts/prepare-secondary-navigation-rail.ps1`.

Ils ne sont pas utilisés par le frontend final. Leurs entrées historiques ont
été retirées du manifeste avant la préparation Git. Ces fichiers restent
locaux, non indexés et explicitement ignorés dans `.gitignore`. La V5 validée
reste versionnée normalement.

## Validations réalisées

Après la dernière modification structurelle du scroll :

- `npm.cmd test -- --run tests/AppShell.test.tsx` : `6/6` réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint` : réussi.

Le build de production final a réussi après la dernière restructuration du
scroll et a bien émis `secondary-navigation-rail-background-v5` (`342,99 kB`).
Une élévation ciblée était nécessaire pour permettre à Vite de nettoyer puis
recréer `dist`.

Codex n’a pas ouvert ni inspecté le navigateur, conformément aux règles du
projet. Les validations visuelles mentionnées ici ont été réalisées et
rapportées par l’utilisateur.

## Reprise recommandée demain

1. Lire ce document et `AGENTS.md`.
2. Relancer le frontend et le backend locaux si nécessaire.
3. Vérifier rapidement que le menu défile bien avec la page, sans scrollbar
   horizontale et sans scrollbar verticale superposée au bandeau.
4. Vérifier que les anciens essais restent hors de tout futur commit.
5. Reprendre ensuite la création des quatre boutons de navigation, élément par
   élément, sans modifier le fond V5 validé.

Commandes connues depuis PowerShell dans `D:\codex\CDIdle` :

```powershell
npm.cmd run dev
npm.cmd exec --offline -- supabase start
npm.cmd exec --offline -- supabase functions serve game-api --env-file supabase/functions/.env
```

Le commit, le push et les déploiements n’ont pas été demandés et n’ont pas été
effectués.
