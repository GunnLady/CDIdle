# Audit de parite du donjon autoritaire — CDI-054

Date : 24 juillet 2026.

## Decision

Le moteur de donjon serveur actuel n est pas un port du moteur historique.
C est une implementation simplifiee et independante. La parite fonctionnelle
et RNG est bloquante pour CDI-051 et les validations finales.

Le suivi correctif est CDI-054.

## Reference historique

La reference est le commit Git `640f89f`, derniere version dans laquelle le
moteur local et son timer etaient encore actifs. Le commit `f47993e` a retire
le timer de `src/hooks/useDungeonSystem.ts` sans porter les regles historiques
cote serveur.

Fichiers de reference :

- `src/hooks/useDungeonSystem.ts`
- `src/utils/dungeonHelpers.ts`
- `src/utils/gameCalculations.ts`
- `src/data/monsters.ts`
- `src/data/gameData.ts`

Implementation comparee :

- `supabase/functions/game-api/dungeon-authority.ts`

## Matrice des ecarts

| Domaine | Reference historique | Backend actuel |
|---|---|---|
| Type d encounter | Tirage pondere de neuf types | Toujours `fight` |
| Monstre | Catalogue par profondeur | Ennemi anonyme |
| Boss | Catalogue dedie en salle 50 | Ennemi generique |
| PV ennemi | `atk * 13 * scaling`, boss `atk * 24 * scaling` | `8 + floor * 2 + roll(0..4)` |
| Attaque heros | Stats, arme, type et resistance | `physicalDamage + roll(0..1)` |
| Competences | Degat, soin, buff, debuff | Absentes |
| Mana/cooldowns | Consommes et persistants | Ignores |
| Critique | Roll et multiplicateur `1.5` | Absent |
| Multi-frappe | `attackSpeed + speed`, maximum trois | Absente |
| Cible ennemie | Heros vivant aleatoire | Premier heros vivant |
| Degat ennemi | `max(1, atk - defense)` | `1 + roll(0..1)` |
| Esquive | Roll selon `dodgeChance` | Absente |
| Mort | PV 0, inactif, `resting` | PV 0 seulement |
| Defaite totale | Arret de l auto-exploration | Auto potentiellement conservee |
| Or | Monstre, Gobelin, Maison du chef, passifs | `5 + floor` |
| Materiaux | Drop 35 %, type et quantite tires | Fixe, salle 50 seulement |
| XP/niveaux/classes | Complets | Absents |
| Transcript | Tous les evenements fonctionnels | `hero.hit`, `enemy.hit` |

## Selection historique des encounters

Pour une salle ordinaire :

| Type | Poids |
|---|---:|
| fight | 85 |
| trap | 10 |
| enigma | 10 |
| ambush | 10 |
| ritual | 6 |
| obstacle | 10 |
| negotiation | 6 |
| treasure | 6 |
| rest | 6 |

Le total vaut 149. Le poids `fight: 85` represente donc environ 57,05 % des
encounters, pas 85 %. Ce comportement doit etre preserve tant qu un
reequilibrage distinct n est pas approuve.

La salle 50 force un combat de boss et ne consomme pas ce roll.

## Monstres, boss et scaling

Pools ordinaires :

- etages 1 a 5 : indices 0 a 3 ;
- etages 6 a 15 : indices 2 a 7 ;
- etages 16 a 29 : indices 6 a 11 ;
- etages 30 et plus : indices 10 a la fin.

Un roll choisit le monstre dans le sous-catalogue. L ordre du tableau est donc
fonctionnel.

```text
scaleMultiplier = 1 + (floor - 1) * 0.18
normal.maxHp = floor(monster.atk * 13 * scaleMultiplier)
boss.maxHp = floor(monster.atk * 24 * scaleMultiplier)
atk = floor(monster.atk * scaleMultiplier)
def = floor(monster.def * scaleMultiplier)
magicDef = floor(monster.magicDef * scaleMultiplier)
```

Les resistances positives sont multipliees par le scaling puis plafonnees a
90. Les faiblesses negatives restent inchangees.

La salle 50 choisit sans roll :

- etage `<= 5` : boss 0 ;
- etage `<= 10` : boss 1 ;
- etage `<= 20` : boss 2 ;
- etage `<= 30` : boss 3 ;
- au-dela : boss 4.

## Deroule historique d un round

1. Les cooldowns des heros actifs vivants diminuent au debut du round.
2. Chaque heros actif vivant agit dans l ordre du tableau canonique.
3. Le heros examine ses competences actives dans leur ordre.
4. La premiere competence utilisable et jugee utile est executee.
5. Sans competence, le heros effectue une attaque de base.
6. Apres le dernier heros, le monstre riposte.
7. Le tour reprend au premier heros tant qu un camp survit.

Competences :

- `damage` : statistique, puissance, type et nombre de touches ;
- `heal` : cible unique ou groupe selon les PV manquants ;
- `buff` et `debuff` : utilises selon boss, attaque, PV et duree attendue ;
- mana deduit et cooldown applique apres utilisation.

Attaque de base :

```text
multiStrikeChance = max(0, (attackSpeed - 1) * 100 + speed)
rawDamage = physicalDamage + weaponDamageRoll
critical = roll < criticalChance / 100
criticalDamage = floor(rawDamage * 1.5)
```

Le nombre de frappes est limite a trois. Les tranches completes de 100 % sont
garanties ; la tranche residuelle consomme un roll. Le degat final utilise la
defense physique ou les resistances des types elementaires de l arme.

Riposte :

- boss avant etage 10 : deux attaques ;
- boss etages 10 a 29 : deux ou trois, trois si roll `< 0.4` ;
- boss etage 30 et plus : trois ;
- monstre ordinaire : une ou deux, chance
  `min(0.5, (floor - 1) * 0.015)`.

Chaque attaque tire une cible puis une esquive. Les degats valent
`max(1, monster.atk - heroDefense)`. A zero PV, le heros devient inactif et
`resting`.

## Registre exact des rolls

### Avant le combat

1. Type d encounter, sauf salle 50.
2. Monstre ordinaire, sauf boss.
3. ID visuel du monstre via `Math.random().toString()`.

Le roll d ID est cosmétique mais decale historiquement toute la suite. Une
parite absolue doit le consommer ou faire approuver une nouvelle convention.

### Tour d un heros sans competence

1. Roll residuel de multi-frappe si necessaire.
2. Pour chaque frappe, roll de degats de l arme si elle a une plage.
3. Pour chaque frappe, roll critique.

Une competence utilisee ne consomme aucun roll dans le moteur historique.

### Riposte

1. Roll du nombre d attaques lorsque la branche le requiert.
2. Pour chaque attaque, roll de cible.
3. Pour chaque attaque, roll d esquive.

Le monstre ordinaire consomme le roll de multi-attaque meme a l etage 1, ou la
chance vaut zero.

### Apres victoire

1. Roll de drop materiau `< 0.35`.
2. Si drop, roll de type/rarete.
3. Si drop, roll de quantite.
4. Pour chaque niveau, rolls de croissance.

Croissance :

- Novice : cinq points, deux rolls par point, soit dix rolls ;
- classe superieure : huit points, deux rolls par point, soit seize rolls ;
- fallback sans statistiques principales : huit rolls.

## RNG du backend actuel

Le backend consomme :

1. un `nextInt(5)` pour les PV ennemis ;
2. un `nextInt(2)` par attaque de heros ;
3. un `nextInt(2)` par attaque ennemie.

La divergence commence au premier roll.

Le seed est derive de `commandId:floor:room`. Le `commandId` est un UUID client
different a chaque exploration. Deux parties identiques ne garantissent donc
pas les memes rolls. CDI-050 doit persister et avancer le RNG avec l etat
canonique.

Les anciens combats deja executes ne sont pas reproductibles exactement :
`Math.random` n etait ni seede, ni persiste, ni enregistre.

## Catalogue des logs historiques

Le transcript doit transporter toutes les donnees necessaires, sans recalcul
client.

### Entree

```text
Vos heros entrent dans la chambre {room} et font face a {monster.name}.
```

Donnees : etage, salle, ID, nom, boss, PV, attaque, defenses, type et
resistances.

### Competences

```text
[Competence] {hero} declenche {skill}.
{hitCount} touche(s), {damage} degats {damageType}.

[Competence] {hero} soigne {target} de +{healing} PV.
{targetHp}/{targetMaxHp} PV.

[Competence] {hero} applique {buff|debuff} pendant {duration} rounds.
```

### Attaques

```text
{hero} attaque {monster} pour {damage} degats.
[Coup critique] {hero} inflige {damage} degats.
[Frappe agile {index}/{count}] {hero} inflige {damage} degats.
{enemyHp}/{enemyMaxHp} PV ennemis restants.
```

Donnees : roll arme, roll critique, types, degat brut, mitigation et degat
final.

### Riposte

```text
{monster} inflige {damage} degats a {hero}.
{heroHp}/{heroMaxHp} PV restants.
{hero} esquive l attaque de {monster}.
{hero} s ecroule et retourne aux dortoirs.
```

Donnees : index de frappe, cible, defense, roll esquive, PV, activation et
statut.

### Resolution et progression

```text
Victoire : {monster} est terrasse.
Tous les aventuriers ont ete decimes. L escouade se replie.
+{gold} or.
Materiau : +{count} {materialName} ({rarity}).
Aucun materiau exploitable.
{hero} gagne +{xp} XP.
{hero} passe niveau {level}.
{hero} evolue vers {className}.
Etage {floor} securise, etage {nextFloor} debloque.
```

Le texte visuel peut evoluer, mais aucune donnee fonctionnelle ne doit
disparaitre.

## Ecarts d etat critiques

- Mana, cooldowns, buffs et debuffs ne sont pas appliques.
- Un heros a zero PV n est pas force inactif et `resting`.
- La defaite totale ne garantit pas l arret auto.
- XP, niveaux et changement de classe sont absents.
- Bonus de race, batiment et passifs sur le loot sont ignores.
- Les materiaux ordinaires ne sont plus distribues.
- Toutes les salles deviennent des combats.

## Strategie de preuve

1. Figer la reference historique sous forme pure.
2. Remplacer chaque `Math.random` par le meme `Rng` injecte.
3. Instrumenter index, valeur et usage de chaque roll.
4. Executer reference et backend avec la meme bande.
5. Comparer rolls, encounter, monstre, actions, transcript et etat final.
6. Ajouter des fixtures ordinaires, boss, critique, esquive, competence, mort,
   level-up, loot et encounter non-combat.
7. Verifier replay, conflit, bootstrap et reconnexion.

## Condition de deblocage

CDI-051 reprend lorsque :

- les golden tests reference/backend sont verts ;
- CDI-050 garantit la persistance atomique du RNG ;
- le transcript complet est conserve dans les quinze derniers encounters ;
- le navigateur rejoue toutes les actions sans recalculer ;
- un `F5` restitue le meme etat et le meme historique.
