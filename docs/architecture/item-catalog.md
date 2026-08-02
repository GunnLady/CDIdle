# Catalogue autoritaire d'objets

## Décision validée

La spécification a été validée le 2 août 2026 avant l'implémentation de
CDI-060. La source exécutable se trouve dans `shared/domain/items`. Les anciens
modules `src/data` sont des compatibilités temporaires à retirer avec le
chantier de frontières architecturales CDI-079.

Le catalogue contient 131 modèles. Une instance persistée reste identifiée par
`instanceId`, référence un modèle par `itemId`, puis porte sa rareté effective
et ses éventuels modificateurs persistés.

## Équipement

L'équipement n'impose aucune classe. Un Mage peut manier une épée à deux mains.
L'autorité contrôle seulement l'existence du modèle, le niveau requis,
l'emplacement et le maniement. Les pools de vocation T1 déterminent uniquement
les cadeaux reçus lors du changement de vocation.

## Rareté

`minimumRarity` est la rareté minimale du modèle. La rareté effective appartient
à l'instance. Un modèle commun peut donc être obtenu dans une rareté supérieure,
alors qu'un modèle épique ne peut jamais produire une instance commune, peu
commune ou rare.

Le tirage d'un coffre commence par la courbe de sa bande. Si aucun modèle de la
fenêtre ne supporte cette rareté, elle est promue vers la première rareté
admissible. Ce repli est déterministe et empêche un coffre vide sans violer la
rareté minimale. Aux étages 31+, les modèles de niveaux 24 à 33 sont actuellement
tous épiques ou légendaires : les tirages inférieurs sont donc promus.

| Étages | Niveaux | Commun | Peu commun | Rare | Épique | Légendaire |
|---|---:|---:|---:|---:|---:|---:|
| 1–5 | 1–10 | 65 % | 28 % | 6 % | 1 % | 0 % |
| 6–10 | 10–20 | 45 % | 38 % | 14 % | 3 % | 0 % |
| 11–20 | 10–25 | 25 % | 40 % | 27 % | 7 % | 1 % |
| 21–30 | 20–33 | 10 % | 28 % | 40 % | 18 % | 4 % |
| 31+ | 24–33 | 0 % | 15 % | 42 % | 33 % | 10 % |

## Boss et plans

Chaque boss utilise la table portant exactement son nom. L'or, les matériaux,
chaque ligne d'objet et chaque ligne de plan sont des jets indépendants. Les
objets respectent plage de niveau, provenance et rareté minimale. Les plans ne
ciblent que des modèles forgeables encore verrouillés. Tous les choix consomment
le RNG canonique et sont persistés dans la mutation de la rencontre.
Lorsqu'une ligne de boss demande une rareté inférieure à tous les modèles de sa
plage, le même mécanisme de promotion déterministe est appliqué.

## Migration

La migration `20260802010000_cdi060_item_state_migration.sql` conserve les
identifiants d'instance. Elle promeut uniquement les anciennes raretés situées
sous le minimum désormais déclaré et remplace le modificateur persisté
`physicalResistance` par `physicalDefense`, dans le coffre comme dans les
équipements. Un objet ou un plan référençant un modèle inconnu reste intact et
provoque une erreur de validation explicite au chargement ; aucune référence
n'est supprimée silencieusement.

La validation refuse également une rareté inférieure au minimum du modèle, un
objet équipé dans un slot incompatible, un équipement au-dessus du niveau du
héros, une combinaison arme à deux mains/off-hand et un plan dupliqué. Le
runtime ne conserve pas d'alias historique après la migration.

La matrice exhaustive générée est disponible dans
`docs/architecture/item-catalog-matrix.md`.
