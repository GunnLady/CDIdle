# Simulation des épreuves non-combat

## Objectif

Cette simulation vérifie la courbe de difficulté, la probabilité exacte et la
sélection du héros pour les six épreuves non-combat du donjon.

```powershell
Set-Location D:\codex\CDIdle
npm.cmd run test:dungeon-challenge-simulation
```

Elle ne démarre ni Vite, ni Supabase, ni Docker et ne nécessite aucun compte.

## Moteur utilisé

Les tests importent directement `shared/domain/dungeon-challenges.ts`, qui est
également utilisé par le moteur autoritaire. Ils ne copient donc ni la formule,
ni les couples d'attributs, ni la courbe de difficulté.

La génération des profils utilise les vraies règles du jeu :

- génération autoritaire des statistiques de Novice ;
- croissance Novice jusqu'au niveau 10 inclus ;
- croissance de la classe Tier 1 à partir du niveau 11 ;
- huit points par niveau Tier 1 avec la répartition canonique 80/20 ;
- source RNG déterministe injectée.

## Règle validée

```text
score = attribut A + attribut B
jet = entier uniforme entre 1 et LUK
réussite si score + jet >= difficulté
```

Pour Embuscade et Négociation, `LUK` participe volontairement au score et au
jet. Le héros choisi est celui qui maximise la probabilité exacte de réussite.
Les égalités sont départagées par score, puis par LUK, puis par l'ordre stable
du groupe.

## Courbe de difficulté

Jusqu'à l'étage 10, toutes les épreuves conservent `10 + étage × 2`.
Au-delà, les valeurs sont interpolées entre les paliers suivants :

| Étage | Couple standard | Couple contenant LUK |
|---:|---:|---:|
| 10 | 30 | 30 |
| 20 | 90 | 65 |
| 30 | 155 | 103 |
| 40 | 220 | 141 |
| 50 | 285 | 180 |

Deux profils sont nécessaires parce qu'aucune classe Tier 1 ne possède `LUK`
comme statistique principale. Les couples standards peuvent progresser sur
deux statistiques principales, tandis qu'un couple contenant `LUK` progresse
structurellement moins vite.

Le profil est déclaré explicitement par chaque rencontre dans le catalogue de
domaine ; il n'est pas déduit dynamiquement de ses attributs.

La salle ne modifie pas la difficulté : le seuil reste lisible pendant un
étage et la progression est portée uniquement par les paliers d'étage.

## Scénarios simulés

La simulation couvre :

- les six couples d'attributs ;
- les neuf classes Tier 1 ;
- un groupe équilibré de quatre spécialistes ;
- les étages et niveaux 10, 20, 30, 40 et 50 ;
- un groupe cinq niveaux en retard, adapté et cinq niveaux en avance ;
- la sélection par probabilité face à la sélection historique par score brut ;
- les seuils impossibles et garantis ;
- l'interpolation, l'extrapolation et un unique jet RNG.

Le niveau égal à l'étage est un profil d'équilibrage représentatif, pas une
prédiction du niveau exact d'une sauvegarde réelle. Les profils en retard et
en avance encadrent cette hypothèse.

## Résultat attendu

La commande doit finir avec un code nul et un résumé Vitest concis. Une
modification des paliers, des couples, de la croissance, de la sélection ou du
nombre de jets provoque un échec explicite.

La simulation valide le domaine. Le transcript et les conséquences réelles
restent couverts par les golden tests du moteur autoritaire, et l'affichage par
les tests de `DungeonPanel` ainsi que le build de production.
