# Handoff — surfaces 9-slice bois et ardoise

## État final

La reprise du panneau Héros est intégrée. Les surfaces bois et ardoise utilisent
désormais le même cadre transparent 9-slice, sans masque ni `clip-path`. Le fond
est peint jusqu'au bord de la boîte et les angles sont arrondis pour ne pas
déborder derrière les coins transparents du cadre.

Codex n'a pas inspecté l'application dans un navigateur. Les validations
visuelles ont été effectuées par l'utilisateur pendant l'intégration.

## Assets runtime

- `src/assets/images/ui/panels/panel-background-tile-v2.png` : fond bois ;
- `src/assets/images/ui/panels/panel-background-slate-tile-v1.png` : fond
  ardoise ;
- `src/assets/images/ui/panels/panel-frame-9slice-v1.png` : cadre transparent
  partagé ;
- `src/assets/images/ui/panels/panel-title-separator-v1.png` : séparateur de
  titre partagé.

Les anciens `panel-background-tile-v1.png` et `panel-frame-v1.png` ne sont plus
utilisés et ont été supprimés du runtime.

## Architecture retenue

`src/index.css` porte une seule stratégie de surface commune pour :

- `.ui-panel-skin` ;
- `.ui-hero-presentation-panel` ;
- `.ui-catalog-panel-surface` ;
- `.ui-hero-equipment-dialog`.

Le cadre est appliqué avec `border-image`, tandis que le matériau est choisi par
le fond bois ou ardoise. Les panneaux imbriqués du workspace Héros restent
transparents afin de ne pas empiler plusieurs cadres.

`HeroDetailFrame` réutilise le même asset avec une bordure plus fine pour les
cartes internes des statistiques, compétences et équipements. La structure du
workspace Héros reste répartie entre présentation, équipement et compétences ;
les modèles de présentation sont préparés dans le domaine partagé.

## Catalogue et validation

Le catalogue privé présente les deux matériaux avec les composants de
production, sans prototypes superposés ni fixtures produit devenues inutiles.
Les contrôles visuels à conserver lors d'une évolution sont :

- absence de marge entre le fond et le cadre ;
- absence de fuite du fond dans les angles ;
- cadre identique sur les variantes bois et ardoise ;
- raccords propres aux formats compacts et étendus ;
- lisibilité du panneau Héros et du dialogue de changement d'équipement.

Les tests automatisés couvrent les composants, les modèles de présentation et
les contrats responsive. La validation visuelle finale reste une preuve
utilisateur conformément aux règles du projet.
