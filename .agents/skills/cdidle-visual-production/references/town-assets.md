# Assets du village

## Sources de vérité

- Lire `shared/data/buildings.ts` avant toute production ou intégration.
- Utiliser `assets/design/cdi-069/manifest.json` pour l’état des fichiers.
- Utiliser `assets/design/cdi-069/references/city-dashboard-reference.png`
  comme référence de composition UI.
- Utiliser `assets/design/cdi-069/references/village-complete-reference.png`
  seulement comme référence artistique secondaire.
- Ne pas recopier les coûts ou prérequis de gameplay dans les assets.

## Catalogue canonique

| Identifiant | Nom | Niveau initial | Niveau maximal |
| --- | --- | ---: | ---: |
| `habitation` | Cabane | 1 | 10 |
| `ferme` | Ferme | 0 | 10 |
| `scierie` | Maison de bûcheron | 0 | 10 |
| `carriere` | Carrière | 0 | 10 |
| `mine` | Mine | 0 | 10 |
| `maison_chef` | Maison du chef | 0 | 5 |
| `guilde` | Campement | 0 | 5 |
| `temple` | Église | 0 | 1 |
| `caserne` | Caserne | 0 | 1 |
| `poste_chasse` | Poste de chasse | 0 | 1 |
| `academie` | Atelier d'arcane | 0 | 1 |
| `cercle` | Cercle druidique | 0 | 1 |
| `lair` | Repaire discret | 0 | 1 |
| `forge` | Forge rustique | 0 | 1 |

Le Donjon n’appartient pas au catalogue des bâtiments de la Cité.

## Architecture validée

La Cité est un tableau de bord à trois zones persistantes : bâtiment
sélectionné, affectations et bâtiments.

- chaque bâtiment est une ligne ou carte DOM sélectionnable ;
- l'état canonique pilote niveau, verrouillage, coût et disponibilité ;
- la sélection ouvre le détail sans commande réseau ;
- la Forge devient le contenu contextuel du bâtiment `forge` ;
- la ville complète n'est ni affichée comme carte obligatoire, ni découpée ;
- aucun masque, détourage ou hit-test bitmap n'est produit ;
- les miniatures restent décoratives et peuvent être rectangulaires.

Ne plus générer de sprite H1–H4, route conditionnelle, terrain vierge, variante
par niveau ou masque de bâtiment pour CDI-069.
