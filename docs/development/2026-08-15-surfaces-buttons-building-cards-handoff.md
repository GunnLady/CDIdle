# Handoff — surfaces, boutons et cartes Bâtiments

## Statut

Le 15 août 2026, le lot réunit trois évolutions visuelles liées : habillage
universel des panneaux, peaux chêne des boutons et cartes illustrées du menu
Bâtiments. Le cadre final des cartes, les trois premières illustrations et la
direction générale ont été validés explicitement par l'utilisateur. Les onze
autres illustrations ont été générées et intégrées sur sa demande avant la
publication de ce lot.

Codex n'a pas ouvert ni inspecté l'application dans un navigateur. Les
contrôles visuels ont été réalisés par l'utilisateur ou via les rendus ImageGen
affichés dans la conversation. Une vérification visuelle du menu complet après
déploiement reste donc une validation utilisateur, pas une preuve Codex.

## Panneaux universels

`Panel` applique `ui-panel-skin` à toutes ses variantes. Une texture bois sombre
répétable constitue le fond et un cadre alpha nine-slice reste indépendant du
contenu DOM. `ActivityLog` réutilise le même habillage pour les historiques de
la Cité, du Donjon et du système. Le panneau interne d'`EntryScreen` emploie la
variante `strong` pour connexion, chargement et erreur.

Assets :

- `src/assets/images/ui/panels/panel-background-tile-v1.png` ;
- `src/assets/images/ui/panels/panel-frame-v1.png`.

## Boutons chêne

`Button` et `IconButton` partagent `ui-button-skin`. Quatre assets nine-slice
portent les variantes sans texte intégré : chêne clair pour `primary`, chêne
fumé pour `secondary`, chêne oxblood pour `danger` et centre transparent pour
`ghost`. Les états `disabled` et `loading` dérivent de la variante demandée.

Assets : `src/assets/images/ui/buttons/button-*-oak-v1.png`.

Les contrôles spécialisés qui ne reposent pas sur `Button` restent hors de
cette migration ; aucune recoloration CSS locale ne doit simuler une variante.

## Cartes Bâtiments

Les quatorze identifiants de `BUILDINGS_LIST` possèdent une illustration
runtime dédiée, associée hors du JSX par `buildingCardImages` dans
`BuildingListPanel.tsx`. Chaque carte mesure `156 px` de haut. L'illustration
plein cadre est découpée uniquement sur la silhouette extérieure et passe sous
le cadre transparent. Le texte, le niveau et le prérequis restent en DOM.

Le cadre est un overlay absolu et ne réduit pas la zone de l'image. Son centre
est transparent ; ses angles utilisent des chanfreins longs et discrets. Le
hover ne redimensionne jamais l'illustration : il ajoute un voile chaud de 6 %
et remonte la carte d'un pixel, afin d'éviter tout rééchantillonnage flou.

| Identifiant | Libellé | Asset |
| --- | --- | --- |
| `habitation` | Cabane | `building-card-habitation-v1.jpg` |
| `ferme` | Ferme | `building-card-ferme-v1.jpg` |
| `scierie` | Maison de bûcheron | `building-card-scierie-v1.jpg` |
| `carriere` | Carrière | `building-card-carriere-v1.jpg` |
| `mine` | Mine | `building-card-mine-v1.jpg` |
| `maison_chef` | Maison du chef | `building-card-maison-chef-v1.jpg` |
| `guilde` | Campement | `building-card-guilde-v1.jpg` |
| `temple` | Église | `building-card-temple-v1.jpg` |
| `caserne` | Caserne | `building-card-caserne-v1.jpg` |
| `poste_chasse` | Poste de chasse | `building-card-poste-chasse-v1.jpg` |
| `academie` | Atelier d'arcane | `building-card-academie-v1.jpg` |
| `cercle` | Cercle druidique | `building-card-cercle-v1.jpg` |
| `lair` | Repaire discret | `building-card-lair-v1.jpg` |
| `forge` | Forge rustique | `building-card-forge-v1.jpg` |

Le cadre commun est `building-card-frame-v1.png`. Les quatorze JPEG mesurent
`1024 x 448 px`, qualité 88 ; le cadre mesure `1024 x 328 px`. Leur poids total
runtime est de `1 607 957 octets`, contre environ 30 Mo pour les masters PNG.

## Catalogue

Le catalogue privé `?ui-catalog=1` expose les variantes de boutons en
production et trois cartes représentatives : Cabane sélectionnée, Ferme
disponible et Forge verrouillée. Les prototypes utilisent les mêmes assets et
classes que le runtime ; aucun doublon d'image n'est versionné sous
`src/assets/images/ui/catalog/`.

## Sources et scripts

- `assets/design/cdi-069/panel-skin-v1.prompt.md` ;
- `assets/design/cdi-069/button-skins-v1.prompt.md` ;
- `assets/design/cdi-069/building-cards-v1.prompt.md` ;
- `scripts/prepare-panel-skin.ps1` ;
- `scripts/prepare-button-prototype.ps1` ;
- `scripts/prepare-button-skin.ps1` ;
- `scripts/prepare-building-card-assets.ps1`.

## Validation et reprise

Audit pré-publication du 15 août 2026 :

- suite Vitest complète : `109` fichiers et `785/785` tests réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint -- --quiet` : réussi ;
- `npm.cmd run build` : réussi après élévation ciblée, le premier essai ayant
  rencontré `EPERM` pendant le nettoyage de `dist/assets` ;
- manifeste CDI-069 : JSON valide, `14` chemins d'illustration et le cadre
  présents, toutes les empreintes SHA-256 conformes ;
- build : les JPEG Bâtiments sont émis entre `65,76` et `163,34 Ko`, le cadre
  alpha à `242,04 Ko`.

Les tests ciblés `CityDashboard`, composants UI, catalogue, authentification
et récupération canonique couvrent les contrats modifiés. Aucun test navigateur
n'a été exécuté par Codex.

À la reprise, lire `AGENTS.md`, ce document et
`docs/development/design-system.md`. Ne pas réintroduire les PNG masters dans le
runtime et ne pas appliquer de zoom ou de filtre de luminosité aux
illustrations au hover.
