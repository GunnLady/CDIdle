# CDI-090 — Migration de la Cité vers le design system

## Périmètre

Ce lot migre uniquement les quatre panneaux de src/components/city sans
modifier les commandes, le gameplay, les projections de présentation ni la
composition responsive de la Cité.

## Mesure avant/après

| Élément | Avant | Après |
| --- | ---: | ---: |
| Cadres principaux utilisant Panel | 0 / 4 | 4 / 4 |
| Sites d'action couverts par Button ou IconButton | 0 / 7 | 6 / 7 |
| Contrôles de Forge couverts par Select ou Checkbox | 0 / 3 | 3 / 3 |
| États métier couverts par Alert | 0 | 3 |
| Progression d'immigration couverte par Progress | 0 | 1 |

Les quatre cadres concernés sont Bâtiment sélectionné, Bâtiments,
Affectations et Forge. Les six actions migrées sont l'amélioration ou la
construction, les deux contrôles d'affectation et les trois actions de Forge.

Les alertes partagées couvrent le bâtiment verrouillé, le niveau maximal et
l'absence de citoyen disponible. La progression partagée représente
l'immigration. Après validation de ces primitives dans le catalogue, les deux
listes de la Forge et l'acceptation de l'amélioration utilisent désormais
`Select` et `Checkbox`.

## Exceptions conservées

- Les cartes de sélection de bâtiment restent des éléments utton locaux.
  Card est une surface non interactive et ne couvre pas leur contrat de
  sélection sans perdre la sémantique native.
- Les illustrations, coûts, matériaux et détails métier gardent leurs styles
  locaux. Ils décrivent le contenu propre à la Cité et ne constituent pas des
  primitives partagées.
- CityIcon conserve sa couleur locale, liée à la représentation du bâtiment.

Aucune nouvelle variante partagée n'est nécessaire et le catalogue ne change
donc pas dans ce lot.

## Comportements préservés

- sélection locale du bâtiment et ordre des trois zones ;
- construction, amélioration et raisons de blocage ;
- affectation et retrait de citoyens, y compris les états désactivés ;
- flux séquentiel de Forge, abandon et finalisation ;
- état observateur et commandes canoniques ;
- projection optimiste et restauration après erreur.

## Preuves

Les tests automatisés couvrent la structure accessible des panneaux, les
états des boutons, l'immigration et les interactions existantes. Le 2026-08-09,
l'utilisateur a rapporté la Cité conforme après le contrôle responsive dédié
desktop/mobile. Cette preuve visuelle et responsive est rapportée par
l'utilisateur; le parcours clavier et le budget bundle restent à valider avant
la clôture du ticket.
