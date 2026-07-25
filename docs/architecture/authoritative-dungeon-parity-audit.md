# Audit de parite du donjon autoritaire — CDI-054

Date : 24 juillet 2026.

## Decision

Le commit `640f89f` sert de trace du dernier comportement fonctionnel complet,
pas de second moteur à maintenir. CDI-054 restaure ces règles dans un unique
moteur de donjon autoritaire. Les fixtures golden figent les comportements,
les mutations et l'ordre des rolls attendus sans dupliquer une implémentation
exécutable dite « historique ».

## Mise en oeuvre CDI-054

Le 25 juillet 2026, le moteur simplifie de
`supabase/functions/game-api/dungeon-authority.ts` a ete retire du parcours
actif. La resolution autoritaire appelle desormais le domaine pur
`src/domain/authoritativeDungeon.ts`.

Le moteur autoritaire porte :

- le tirage pondere des neuf encounters, avec un total historique de 149 ;
- le combat force de boss en salle 50, sans roll d encounter ni de monstre ;
- les pools de monstres, le scaling et le roll cosmetique historique de l ID ;
- les tours dans l ordre des heros, les cooldowns, competences, mana,
  attaques de base, critiques, multi-frappes, ciblage et esquive ;
- le comportement historique surprenant des buffs/debuffs : mana et cooldown
  sont consommes, le message est emis, mais aucun modificateur transitoire
  n etait effectivement applique par l ancien hook ;
- la mort, le repos force, l arret de l auto-exploration et la progression ;
- les bonus d or, materiaux, objets, XP, niveaux et changements de classe ;
- les branches tresor, repos et tests de statistiques avec leurs mutations ;
- un transcript structure contenant aussi un message affichable, afin que le
  client temporise le resultat sans recalculer le combat.

Le contrat partage accepte les anciens transcripts `hero.hit` / `enemy.hit`
sans message pendant la migration, mais chaque nouvelle resolution CDI-054
produit `message`, `category` et les donnees fonctionnelles detaillees.

Depuis l'audit du 25 juillet, le chargement canonique valide aussi chaque héros
avant toute commande : identité, état actif, statut, progression, statistiques
de base, `calculatedStats`, PV/PM, compétences, résistances et cooldowns. Le
moteur ne remplace plus une statistique absente par `1`, `0` ou une autre
valeur implicite ; un état incomplet est refusé avec `INVALID_GAME_STATE`.

Règles d'autorité restaurées le 25 juillet :

- le donjon consomme exclusivement `hero.calculatedStats` persisté pendant une
  rencontre ; il ne recalcule jamais les statistiques ;
- l'XP sans level-up ne recalcule pas les statistiques ;
- le level-up et l'évolution de classe délèguent leur recalcul au domaine
  héros `src/domain/hero.ts` ;
- une erreur du RNG injecté remonte jusqu'à la commande et ne peut plus être
  convertie silencieusement en rencontre `fight` ;
- chaque rencontre non-combat produit les étapes de découverte, sélection,
  tentative, résultat, conséquence, récompense et progression nécessaires à
  sa restitution ;
- `useDungeonSystem` ne contient plus de moteur, de RNG ou de mutation de
  gameplay locale : il projette uniquement l'état canonique dans l'interface.

Les golden tests de `tests/authoritativeDungeonGolden.test.ts` caractérisent
notamment :

- combat ordinaire : encounter, monstre, ID, critique et drop dans l ordre ;
- boss : absence des deux rolls interdits avant le roll d ID ;
- competence : aucune consommation RNG cachee ;
- tresor : branche, materiau et nombre exact de rolls ;
- echec de test de statistique : mutation et absence de rolls de recompense.

Les preuves automatisées précédentes sont devenues obsolètes après la
restauration fonctionnelle du 25 juillet. La matrice complète sera rejouée
seulement lorsque le moteur, le transcript et les fixtures seront stabilisés.

Restent avant cloture :

- compiler et servir reellement l Edge Function locale avec Supabase ;
- verifier le transcript progressif complet dans le navigateur puis apres F5 ;
- compléter les fixtures de caractérisation de chaque branche ;
- exécuter toute la matrice automatisée ;
- mettre a jour les preuves et cases du ticket seulement apres ces validations.

## Reference historique

La trace de référence est le commit Git `640f89f`, dernière version dans laquelle le
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

## Matrice des écarts observés avant CDI-054

Cette table décrit la résolution simplifiée présente après `f47993e`. Elle
constitue la cause de CDI-054, pas l'état du backend après restauration.

| Domaine | Trace `640f89f` | Résolution simplifiée avant CDI-054 |
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

Une compétence utilisée ne consommait aucun roll dans le comportement
caractérisé depuis `640f89f`.

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

Si ce level-up déclenche une vocation T0 vers T1, les rolls de compétences
suivent immédiatement la croissance :

- classe ordinaire : un actif et un passif de classe, deux rolls ;
- Mage : deux sorts élémentaires distincts puis un passif Mage, trois rolls ;
- Acolyte : `minor_heal` garanti sans roll, puis un autre actif et un passif,
  deux rolls.

Le passif Novice est conservé, l’actif Novice est retiré et les cooldowns sont
réinitialisés. Le transcript `hero.class_changed` transporte les listes
résultantes sans recalcul client.

## RNG de la résolution simplifiée remplacée

La résolution remplacée consommait :

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

## Écarts d'état fermés par CDI-054

- Mana et cooldowns sont persistés ; les buffs/debuffs conservent le
  comportement caractérisé de journalisation sans modificateur transitoire.
- Un héros à zéro PV devient inactif et `resting`.
- La défaite totale arrête l'auto-exploration.
- XP, niveaux et changement de classe sont restaurés.
- Le changement T0 vers T1 attribue les compétences de classe avec le RNG
  autoritaire, y compris les particularités Mage et Acolyte.
- Les bonus de race, bâtiment et passifs de loot sont appliqués.
- Les matériaux ordinaires sont distribués.
- Les neuf types de rencontres sont restaurés.

## Strategie de preuve

1. Utiliser `640f89f` comme trace Git, sans conserver un second moteur.
2. Injecter le même contrat `Rng` dans chaque branche aléatoire.
3. Figer index, valeur et usage des rolls dans des golden tests.
4. Comparer encounter, monstre, actions, transcript et état final aux
   comportements caractérisés.
5. Couvrir combats, boss, compétences, soins, critiques, esquives, mort,
   limite de rounds, progression, loot et chaque rencontre non-combat.
6. Refuser les héros canoniques incomplets et vérifier l'atomicité des rejets.
7. Vérifier replay, conflit, bootstrap et reconnexion.

## Condition de deblocage

CDI-051 reprend lorsque :

- les fixtures golden de toutes les branches sont vertes ;
- CDI-050 garantit la persistance atomique du RNG ;
- le transcript complet est conserve dans les quinze derniers encounters ;
- le navigateur rejoue toutes les actions sans recalculer ;
- un `F5` restitue le meme etat et le meme historique.

## Validation finale CDI-054

La condition de déblocage a été satisfaite localement le 25 juillet 2026 :
combat et piège résolus automatiquement, transcript progressif, historique
persistant après `F5`, replay idempotent et vocation T1 autoritaire persistée.

La comparaison « même graine sur une seconde partie » est remplacée par un
reset du même compte de test ou une fixture contrôlée. La graine canonique
étant dérivée du `userId`, deux comptes distincts ne doivent pas partager la
même graine.

Le chargement réel de l'Edge Function a également révélé des imports relatifs
sans extension dans le nouveau graphe partagé. Tous les imports Edge
atteignables utilisent désormais une extension `.ts`, avec un test récursif
anti-régression.
