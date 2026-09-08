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

Un échec ne donne aucune XP et laisse avancer la salle. Les conséquences sont
centralisées et non létales : piège et embuscade retirent 5 % des PV actuels
du groupe, obstacle 3 %, énigme et rituel 10 % du mana actuel du héros choisi,
et négociation 3 % de l'or courant avec un plafond égal à trois gains de combat
ordinaire du même étage.

## Courbe canonique du runtime

Le runtime et la simulation dédiée appliquent la courbe versionnée
`undercity-two-profiles-v3`, calibrée par type sur un groupe réel de quatre
héros. Les valeurs intermédiaires sont interpolées et arrondies ; chaque
courbe reste monotone, y compris après la dernière ancre. Le seuil effectif
ajoute ensuite un décalage global de `+1`.

| Défi | Ancres `étage:difficulté` |
|---|---|
| Piège | `1:12, 10:29, 20:72, 25:80, 30:93, 40:110, 50:119, 60:133, 65:140, 99:140` |
| Énigme | `1:11, 10:29, 20:58, 25:70, 30:82, 40:100, 50:113, 60:125, 65:130, 70:133, 99:133` |
| Embuscade | `1:12, 10:30, 20:53, 25:66, 30:77, 40:92, 50:106, 60:113, 99:113` |
| Rituel | `1:11, 10:28, 20:59, 25:70, 30:80, 40:97, 50:112, 60:126, 70:131, 99:131` |
| Obstacle | `1:12, 10:30, 20:58, 25:73, 30:81, 40:102, 50:116, 60:128, 70:142, 80:145, 99:145` |
| Négociation | `1:11, 10:29, 20:50, 25:53, 30:62, 40:66, 99:66` |

La salle ne modifie pas la difficulté : le seuil reste lisible pendant un
étage. En progression, la courbe est portée par les paliers d'étage. En farm,
elle ajoute `2` points par niveau entier du groupe au-dessus du niveau 20 afin
que la Cour ne devienne pas progressivement triviale.

## Scénarios simulés

La simulation couvre :

- les six couples d'attributs ;
- les neuf classes Tier 1 ;
- un groupe équilibré de quatre spécialistes ;
- les étages 10, 20, 30, 40 et 50 avec un niveau adapté proche de la moitié de
  l'étage ;
- un groupe cinq niveaux en retard, adapté et cinq niveaux en avance ;
- la sélection par probabilité face à la sélection historique par score brut ;
- les seuils impossibles et garantis ;
- l'interpolation, l'extrapolation et un unique jet RNG.

Les profils cinq niveaux en retard et en avance encadrent ce ratio observé. Le
harness 100 seeds reste la preuve statistique principale de la relation réelle
entre étage, équipement et niveau du groupe.

## Résultat attendu

La commande doit finir avec un code nul et un résumé Vitest concis. Une
modification des ancres, des couples, de la croissance, de la sélection ou du
nombre de jets provoque un échec explicite.

La simulation valide le domaine. Le transcript et les conséquences réelles
restent couverts par les golden tests du moteur autoritaire, et l'affichage par
les tests de `DungeonPanel` ainsi que le build de production.

Le harness de campagne `npm.cmd run test:xp-tier1` complète cette preuve avec
100 seeds distinctes, chacune rejouée sous les profils optimisé et moyen. Sa
cible est `66,7 %` de réussite globale, avec une enveloppe explicite par bande
et par type, et une dernière bande au moins deux points plus difficile que la
première. La validation complète du 8 septembre 2026 sur 100 seeds par profil
donne `66,10 %` global ; les bandes de niveaux 1–9, 10–19, 20–29, 30–34 et
35–40 donnent respectivement `63,96 %`, `70,83 %`, `74,05 %`, `72,40 %` et
`58,69 %`. La dernière bande est ainsi `5,27` points plus difficile que la
première.

Le choix du candidat et la résolution conservent exactement un tirage RNG par
tentative. La calibration modifie uniquement le seuil effectif ; elle n'ajoute
aucun tirage et ne garantit pas chaque défi isolé.
