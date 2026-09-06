# Catalogue autoritaire et progression des objets

## Modèle retenu

La source exécutable unique reste `shared/domain/items`. Le catalogue contient
**179 modèles** :

- **131 modèles historiques** conservés sans altération de puissance ;
- **48 bases actives réutilisables** : 25 armes, 5 armures, 12 objets de main
  secondaire et 6 accessoires ;
- parmi les 131 modèles historiques, les signatures épiques et légendaires de
  haut niveau restent actives à niveau fixe ; les autres sont `legacy` et ne
  sont plus sélectionnés directement par les nouveaux jets génériques.

Chaque modèle historique est relié exhaustivement à la base évolutive de son
archétype. Les identités historiques restent autoritaires pour les instances
déjà créées et les cadeaux explicites ; un ancien plan connu est converti vers
le plan de sa famille, et les nouveaux crafts utilisent uniquement cette base
`level-bands-v1`.

Une instance persistée porte `instanceId`, `itemId`, `itemLevel`,
`powerModelId`, `rarity` et, si nécessaire, ses modificateurs résolus. Le
modèle `legacy-fixed-v1` conserve exactement la puissance et le niveau requis
historiques. Le modèle `level-bands-v1` résout une base entre les niveaux 1 et
40, puis applique la rareté en dernier.

Le [moteur de nommage V1](item-naming.md) produit désormais le nom d’affichage
depuis l’instance et ses propriétés résolues, sans modifier `itemId`,
`instanceId`, les sauvegardes, la puissance ni les règles de loot. Les bases
historiques gardent leur nom ; les instances évolutives déjà possédées utilisent
le nom dérivé. Recettes et plans conservent leurs noms de catalogue.

## Courbe de niveau et rareté

Les ancres de puissance de niveau sont `1 / 1,3 / 1,75 / 2,4 / 3,3 / 4,7 /
6,2 / 8 / 10` aux niveaux `1 / 5 / 10 / 15 / 20 / 25 / 30 / 35 / 40`.
L'interpolation est linéaire entre deux ancres. Les bases issues du catalogue
historique sont recalibrées par leur `powerReferenceLevel`, afin qu'une base
T1 réutilisée au niveau 1 ne garde pas sa puissance de niveau 10.

La rareté conserve le caractère explosif attendu d'un idle game :

| Rareté | Dégâts | Bonus plats | Bonus % | Nombre de bonus cible |
|---|---:|---:|---:|---:|
| Commune | ×1 | ×1 | ×1 | 1 |
| Inhabituelle | ×1,5 | ×1,5 | ×1,25 | 2 |
| Rare | ×2,25 | ×2,5 | ×1,75 | 3 |
| Épique | ×3,5 | ×4 | ×2,5 | 4 |
| Légendaire | ×5 | ×6 | ×3,5 | 5 |

Les affixes supplémentaires sont déterministes à partir de l'identité de
l'instance, du niveau et de la rareté. Les modificateurs identiques d'une base
sont fusionnés avant scaling. La matrice générée
`docs/architecture/item-catalog-matrix.md` donne chaque base, chaque tranche de
cinq niveaux et les puissances résolues par rareté.

## Loot et niveaux 1–40

Le serveur tire d'abord la rareté, sélectionne une base active compatible,
puis tire et persiste le niveau exact dans la fenêtre de l'étage. L'objet reçu
ne change donc jamais de niveau après le commit.

| Étages | Niveau d'objet | Commun | Inhabituel | Rare | Épique | Légendaire |
|---|---:|---:|---:|---:|---:|---:|
| 1–2 | 1 | 78 % | 19 % | 3 % | 0 % | 0 % |
| 3–7 | 1–5 | 72 % | 23 % | 5 % | 0 % | 0 % |
| 8–10 | 6–10 | 62 % | 29 % | 8 % | 1 % | 0 % |
| 11–17 | 11–15 | 50 % | 34 % | 13 % | 3 % | 0 % |
| 18–25 | 16–20 | 38 % | 38 % | 19 % | 5 % | 0 % |
| 26–35 | 21–25 | 28 % | 38 % | 26 % | 7 % | 1 % |
| 36–48 | 26–30 | 18 % | 34 % | 35 % | 11 % | 2 % |
| 49–61 | 31–35 | 10 % | 27 % | 40 % | 19 % | 4 % |
| 62+ | 36–40 | 5 % | 20 % | 40 % | 28 % | 7 % |

Après la fenêtre d'introduction des étages 1–2, ces fenêtres suivent les huit
tranches disjointes de cinq niveaux du catalogue et de la forge. Boss, coffres
et plans filtrent sur la provenance, le statut actif, la plage
de niveau et la rareté minimale. Les plans utilisent aussi une politique
`none`, `initial` ou `random-drop`, avec sources, bornes d’étage, poids et boss
optionnels indépendants de `levelRange`. Chaque choix et chaque niveau aléatoire
des lignes natives consomment le RNG canonique et sont persistés dans la
transition autoritaire. Les récompenses idle supplémentaires utilisent le
sous-flux décrit ci-dessous.

La cadence idle des objets est définie dans
`shared/domain/dungeon-loot-policy.ts`. Un coffre ou une salle finale fournit
un objet lorsqu'aucune autre ligne d'objet n'a réussi. Une victoire de combat
ordinaire a une chance de 5 % dans la première tranche de héros, puis gagne un
point par tranche de cinq niveaux jusqu'à 12 %. La tranche est celle du héros
le moins avancé du groupe ; le nombre d'objets déjà reçu dans un étage ou un
passage n'intervient jamais.

Les objets supplémentaires utilisent les mêmes fenêtres de niveau, poids de
rareté et filtres de provenance que le catalogue. Leur sous-flux RNG est dérivé
de l'entropie déjà consommée pour l'encounter ainsi que de l'étage et de la
salle. Il est donc déterministe au replay sans décaler les tirages de combat,
de matériaux, de plans ou de progression. Le résolveur autoritaire reste seul
responsable du stockage, de l'identité d'instance et du transcript.

## Équipement, recrutement et rank-up

L'équipement n'impose aucune classe. L'autorité vérifie le modèle, le
`itemLevel` de l'instance, le niveau du héros, le slot et le maniement.

Le recrutement et l'onboarding continuent de créer les starters historiques
au niveau 1 avec `legacy-fixed-v1`. Le rank-up Novice vers une vocation T1
continue d'attribuer une arme et un accessoire issus des pools historiques,
communs, au niveau fixe du modèle — niveau 10 pour les récompenses actuelles.
Le nombre et l'ordre des tirages RNG de ces deux parcours ne changent pas.
Ces cadeaux restent des règles d'attribution, jamais des restrictions
d'équipement.

## Compatibilité

L'état canonique v3 enrichit coffre, équipements, onboarding, recrutement en
attente, forge en attente et historique de loot avec `itemLevel` et
`powerModelId`. La migration TypeScript `v2 -> v3` est pure, déterministe,
conserve les identités et ne consomme aucun RNG. Un snapshot déclaré v3 mais
incomplet est refusé ; il n'est pas réparé silencieusement.

Les objets historiques gardent leur niveau et leur puissance. Une référence
inconnue est conservée pendant la migration puis rejetée explicitement par la
validation du catalogue, afin d'éviter toute perte silencieuse.

L’état v4 remplace le proc de preview historique par la rareté finale proposée
et convertit tous les plans historiques connus vers leurs 48 bases évolutives.
Cette migration
ne transforme ni les starters de recrutement, ni les cadeaux de rank-up, ni
aucun objet déjà stocké ou équipé.
