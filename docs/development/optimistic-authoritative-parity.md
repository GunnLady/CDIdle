# Parité optimiste et autoritaire

Le frontend ne projette que les mutations nécessaires à un retour visuel
immédiat. Le snapshot renvoyé par `game-api` reste toujours autoritaire et
remplace la projection après confirmation, replay ou resynchronisation.

## Matrice des commandes projetées

| Commande | Champs visibles projetés | Fusion des clics |
| --- | --- | --- |
| `citizens.allocate` | `citizens` | somme par rôle, annulation si la somme vaut zéro |
| `building.upgrade` | `resources`, `buildings` | somme des niveaux, maximum cinq par lot |
| `hero.activity` | `heroes[].isActive`, `heroes[].status` | dernière intention |
| `hero.equip` | héros ciblé, `storedItems` | dernière intention par héros |
| `hero.unequip` | héros ciblé, `storedItems` | dernière intention par héros et slot |
| `dungeon.select_floor` | étage, salle, auto-exploration | dernier étage |
| `dungeon.auto_explore` | `autoExplore` | dernière intention |

`OPTIMISTIC_COMMAND_TYPES`, `OPTIMISTIC_PROJECTED_FIELDS`, le registre de
projecteurs et `OPTIMISTIC_MERGE_STRATEGIES` sont typés ensemble. Le buffer
n'accepte qu'un `OptimisticGameCommand` et sélectionne lui-même sa fusion : un
composant ne peut pas associer accidentellement une commande à une autre
stratégie. Ajouter un type projeté sans projecteur, déclaration de champs,
fusion ou scénario de parité fait donc échouer la compilation ou le test de
matrice.

## Champs volontairement non projetés

- Une amélioration de bâtiment ne projette pas la réconciliation des vocations,
  des héros ou des prières : ces effets dépendent de règles autoritaires.
- L'équipement projette les statistiques dérivées nécessaires à l'affichage et
  conserve le ratio PV/mana grâce au helper partagé avec le backend. Les
  événements d'équipement restent serveur.
- Le changement d'étage ne génère ni rencontre ni récompense.
- L'auto-exploration ne résout aucun combat côté client.
- Révision, RNG, événements, temps serveur, idle report et champs de persistance
  ne sont jamais fabriqués par une projection.

## Commandes non optimistes

Onboarding, recrutement, vocation, renvoi, forge, recyclage, cheats, déblocage
de district, exploration, résolution et retraite de donjon restent
autoritaires. Elles impliquent au moins une validation métier importante, du
RNG, une récompense, un combat, une destruction ou une transition modale pour
laquelle une anticipation locale serait trompeuse.

## Confirmation et erreurs

- Succès ou replay : la commande est acquittée avant l'application du snapshot
  confirmé ; aucune projection résiduelle n'est rejouée. Les deux réponses
  traversent la même frontière testée, tout en conservant leur qualification
  `committed` ou `replayed`.
- Refus métier : le lot est retiré et le dernier snapshot confirmé réapparaît.
- Conflit de révision : le canonique est rechargé, les autres commandes encore
  valides sont reprojetées, puis la commande en conflit est retentée une fois.
- `COMMAND_IN_PROGRESS` : resynchronisation sans second envoi.
- Panne ou timeout : aucun retry optimiste automatique ; le dernier snapshot
  confirmé est restauré et un message d'indisponibilité testé reste affiché.

Les tests de parité comparent uniquement les champs déclarés ci-dessus. Cette
frontière évite de recopier le moteur autoritaire dans le frontend tout en
détectant les sauts réellement visibles lors de la confirmation.
