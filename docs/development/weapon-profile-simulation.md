# Simulation automatisée des profils d’armes

## Objectif

La simulation remplace le contrôle manuel local des profils d’armes. Elle
valide en une seule commande les règles d’équipement, la résolution des frappes
et la projection des statistiques dans l’interface, sans démarrer Vite ni
Supabase.

Commande PowerShell :

```powershell
Set-Location D:\codex\CDIdle
npm.cmd run test:weapon-simulation
```

Le résultat attendu est `3 passed`. Tout échec rend la commande non nulle et
indique le scénario ainsi que l’assertion en cause.

## Moteur utilisé

La simulation est exécutée par Vitest dans `jsdom`. Elle ne possède pas de
moteur de combat ou d’équipement alternatif :

- `applyTownCommand` exécute les vraies commandes autoritaires
  `hero.equip` et `hero.unequip` ;
- `getHeroStats` vérifie le recalcul client des statistiques dérivées contre
  l’état produit par l’autorité ;
- `resolveAuthoritativeDungeonEncounter` résout le vrai combat de donjon ;
- `HeroPanel` est rendu avec Testing Library, puis rerendu avec l’état produit
  par la commande autoritaire.

Une régression dans le domaine, l’autorité serveur ou le front provoque donc
un échec de la simulation au lieu d’être masquée par une copie de la logique.

## Scénarios couverts

### Équipement

Le même héros de niveau 10 traverse successivement trois configurations :

1. épée une main et bouclier : les deux objets restent équipés ;
2. lance deux mains : le bouclier retourne automatiquement au stockage ;
3. gantelets jumelés : le bouclier retourne également au stockage.

Après chaque transition, les statistiques persistées sont comparées à un
recalcul complet. Ce contrôle couvre notamment `physicalDamage`,
`magicDamage`, `estimatedDps`, les défenses, la vitesse et le critique.

### Combat jumelé

Une bande RNG fixe force exactement :

- une première frappe normale ;
- une seconde frappe critique ;
- aucun événement aléatoire parasite.

La simulation exige deux événements structurés avec `strikeCount: 2`, le
marqueur `[Seconde arme]` sur le second et une réduction par la défense sur
chaque frappe. Le nombre de tirages RNG est également contrôlé afin de détecter
un changement silencieux de l’ordre des jets.

### Interface

Le panneau Héros est d’abord rendu sans arme, puis rerendu avec les gantelets
équipés par l’autorité. La simulation vérifie que :

- la valeur de DPS affichée devient celle du nouvel état ;
- le DPS a effectivement changé ;
- le profil `2 coups × 65 % de puissance` est visible ;
- le scaling `Puissance (FOR)` est visible.

## Déterminisme

Les commandes d’équipement ne consomment aucun hasard. Le combat utilise une
bande de nombres explicite et échoue avec `RNG_TAPE_EXHAUSTED` si le moteur
demande un tirage imprévu. La simulation produit donc le même résultat à chaque
exécution.

## Limites

Cette simulation valide les contrats fonctionnels et le contenu rendu dans le
DOM. Elle ne vérifie pas la mise en page visuelle au pixel, le comportement d’un
navigateur réel, les animations ni une session Supabase distante. Ces aspects
restent couverts séparément par le build, les tests d’interface et les tests
d’intégration du projet lorsqu’ils sont nécessaires.

## Maintenance

Le scénario se trouve dans `tests/weaponProfilesSimulation.test.tsx`. Une
nouvelle règle de profil doit être ajoutée à cette simulation seulement si elle
représente un parcours joueur complet. Les formules unitaires et les cas de
bord restent dans les tests de domaine spécialisés afin de garder la simulation
courte et lisible.
