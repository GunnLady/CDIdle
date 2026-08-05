# Sélection tactique autoritaire des actions

## Responsabilités

- `src/domain/combatTactics.ts` construit et classe les actions légales. La
  fonction est pure, ne mute aucun état et ne consomme aucun RNG.
- `src/domain/combatEffects.ts` calcule les statistiques temporaires et gère le
  rafraîchissement puis l'expiration des effets.
- `src/domain/authoritativeDungeon.ts` reste l'unique orchestrateur autoritaire :
  il exécute l'action choisie, consomme le mana, pose le cooldown, applique les
  mutations et écrit le transcript.
- Les effets temporaires restent locaux à une rencontre et ne sont jamais
  persistés dans la sauvegarde.

## Ordre de décision

Toutes les compétences actives légales et l'attaque normale sont comparées.
Les actions sont classées par :

1. priorité tactique ;
2. valeur nette effectivement utile ;
3. efficacité par point de mana ;
4. cooldown ;
5. identifiant de compétence ;
6. identifiant de cible.

Les priorités absolues sont le soin évitant probablement une mort et l'attaque
qui tue avant la prochaine action ennemie. Une compétence offensive ordinaire
est rejetée lorsqu'elle n'apporte pas un gain mesurable sur l'attaque gratuite.
Une raison stable (`decisionReason`) est ajoutée à chaque action exécutée.

| Priorité | Actions |
| --- | --- |
| 5 | Soin ou protection qui empêche probablement une mort |
| 4 | Attaque qui supprime une action ennemie en tuant la cible |
| 3 | Soin individuel ou collectif de stabilisation |
| 2 | Action utile dans la salle du boss |
| 1 | Attaque normale, dégât rentable, buff ou debuff rentable |

À priorité identique, toutes les actions sont comparées dans une unité commune :
le nombre attendu de PV ennemis retirés, de PV alliés restaurés ou de dégâts
alliés évités. Le coût en mana ne constitue jamais une valeur en PV et n'est
donc pas soustrait ou comparé directement à ce score. Il intervient seulement
dans l'éligibilité par la réserve et, après la valeur, dans le départage par
efficacité.

## Dégâts, soins et menace

- Les dégâts sont estimés après défense, résistance, type élémentaire et nombre
  d'impacts.
- Un impact physique soustrait `monster.def`. Pour un impact non physique,
  `monster.magicDef` constitue la résistance élémentaire de base ; l'affinité
  de l'élément augmente ou réduit cette défense, puis cette valeur unique est
  soustraite aux dégâts. Le résultat final conserve un minimum de 1 dégât.
- La même règle vaut dans l'autre sens. Un héros reçoit les dégâts non physiques
  après soustraction de sa résistance calculée pour l'élément concerné. Un buff
  temporaire de `magicDefense` fait varier toutes ces résistances pendant le
  combat sans effacer leurs bonus ou malus élémentaires propres.
- Lorsqu'une même frappe porte plusieurs types, ses dégâts sont répartis entre
  eux. Une défense est partagée entre les composantes de sa famille afin qu'un
  second type élémentaire n'applique pas une seconde fois toute la
  `magicDef` ; une frappe hybride physique/magique rencontre en revanche les
  deux défenses correspondantes.
- Chaque impact d'une compétence offensive possède son propre jet critique.
  Un impact critique applique le multiplicateur canonique de 1,5 avant la
  mitigation, y compris pour les compétences multi-frappes.
- L'attaque normale utilise les dégâts et la vitesse effectifs du héros ainsi
  que la moyenne de son arme.
- Les soins utilisent uniquement les PV réellement rendus. Une blessure mineure
  ou un sursoin important est refusé. La priorité vitale exige que la cible
  survive réellement aux dégâts attendus après le soin.
- Les modificateurs passifs `healingPower` sont additionnés sur une base de
  100 % puis appliqués au soin théorique avant la limitation aux PV manquants.
- `single_ally` compare tous les membres vivants, lanceur inclus.
- Les soins de groupe additionnent le soin effectif et les alliés menacés.
- La menace tient compte du nombre attendu de frappes, de leur répartition
  entre les cibles disponibles et de l'esquive de chaque héros.

## Réserve de mana

La réserve est dérivée des compétences possédées, sans table de classes. Elle
correspond au coût de l'action de soin ou de protection prioritaire la moins
chère : soin, hausse de défense ou d'esquive, provocation, baisse des dégâts
ennemis. Elle reste donc exprimée en mana et ne dépend plus d'un pourcentage de
progression arbitraire dans l'étage.

Lorsqu'un buff ou debuff de protection est lui-même évalué, il n'est pas
réservé contre lui-même ; une autre action prioritaire connue reste toutefois
protégée. Un soin non urgent conserve la possibilité d'un soin futur. La
réserve vaut zéro dans la salle du boss afin que le mana préparé soit dépensé.
Le comportement équilibré est l'unique stratégie autoritaire pour le moment ;
aucun profil n'est persisté.

Un soin vital ou une action offensive empêchant une attaque ennemie peut
consommer la réserve.

## Effets temporaires

- Une nouvelle application du même `skillId` sur la même cible remplace la
  précédente et rafraîchit sa durée, même si le lanceur diffère.
- Deux compétences différentes peuvent agir sur la même statistique. Leurs
  pourcentages sont additionnés sur la valeur de base, puis les bonus plats sont
  ajoutés ; ils ne se multiplient pas entre eux.
- Un effet lancé pour deux tours agit immédiatement, reste actif au tour
  suivant, puis expire à la fin de ce tour.
- Les buffs `all_allies` ciblent chaque allié vivant. Les buffs `single_ally`
  choisissent le membre offrant la meilleure valeur tactique, lanceur inclus.
- Les buffs et debuffs sont évalués par la différence réelle entre le combat
  avant et après leur application : dégâts gagnés par le groupe et dégâts
  ennemis évités. Un modificateur sans incidence dans le contexte courant est
  ignoré.
- Le score tient compte du coût d'opportunité du lancement : pendant le tour
  courant, seuls les héros placés après le lanceur profitent encore d'un gain
  offensif. Les tours futurs utiles comptent le groupe entier et la réduction
  des dégâts ennemis compte chaque tour où l'effet reste actif.
- Un combat estimé à un seul tour rejette les supports. À priorité identique,
  un support n'est choisi que si son gain de PV projeté dépasse l'attaque
  abandonnée. Le même effet encore actif sur la même cible n'est pas relancé.
- `Provocation` est un buff personnel. Tant qu'il est actif, le tirage de cible
  ennemi est limité aux provocateurs vivants. Le tirage canonique habituel est
  conservé ; plusieurs provocateurs actifs se partagent donc les frappes.
- L'IA ne provoque que pour protéger un allié menacé et si le lanceur peut
  survivre à la séquence attendue.
- Les modificateurs inconnus sont ignorés par le calcul des statistiques plutôt
  que copiés aveuglément dans `CalculatedStats`.
- Les debuffs du catalogue n'utilisent que les statistiques autoritaires des
  monstres : dégâts physiques ou magiques et défenses physique ou magique.
  `Poudre aveuglante`, `Tir handicapant`, `Étreinte de ronces` et `Piège
  statique` ont été réalignés sur ce contrat afin qu'aucun lancement ne consomme
  du mana pour une statistique inexistante.

## Déterminisme et replay

Le sélecteur ne reçoit aucun RNG. Le choix est stable pour un contexte identique
et indépendant de l'ordre de stockage de `activeSkills`. Le moteur conserve un
seul tirage de cible ennemi, y compris lorsqu'une provocation restreint les
cibles admissibles. Les changements de résultat des anciens golden offensifs correspondent
au refus volontaire d'un sort lorsque l'attaque normale est déjà létale ; leurs
fixtures ont été renforcés pour continuer à prouver le transcript multi-impact
sans réintroduire ce gaspillage.

## Moteur de simulation tactique

`tests/combatTacticsSimulation.test.ts` complète les cas unitaires sans appeler
de service externe. Sa matrice principale couvre les neuf classes Tier 1, trois
niveaux de mana, trois niveaux de PV, trois positions dans l'étage et deux
profils de monstre. Chaque décision utilise un groupe complet de quatre héros ;
le second profil est un combat ordinaire volontairement long et dangereux afin
de rendre mesurable la valeur des supports sans lui donner le statut de boss.

La matrice exécute 486 décisions et verrouille les fréquences brutes de support
actuelles : Aède 4, Druide 6, Acolyte 18 et Artificier 18. Ces valeurs brutes ne
sont pas des taux d'équilibrage : elles incluent les cas sans mana, les combats
trop courts et les soins prioritaires.

L'entonnoir conditionnel montre 36 occasions lançables pour l'Aède, dont 12
buffs ou debuffs légaux : 8 sont correctement précédés par `soothing_song` et
les 4 occasions restantes choisissent `inspiring_song`. Pour le Druide, 36
occasions sont lançables et 18 légales : 12 sont précédées par
`wild_regrowth`, puis les 6 restantes choisissent `thorn_grasp`. Le taux de
sélection hors soin prioritaire est donc de 100 % pour ces deux classes dans la
matrice, avec un seuil de non-régression fixé à 60 %.

Un second jeu de scénarios isole chaque buff et debuff de l'Aède et du Druide :
`inspiring_song`, `discordant_chord`, `thorn_grasp` et `barkskin` doivent tous
être sélectionnés dans au moins une situation ordinaire viable. Il couvre aussi
un buff représentatif de l'Acolyte et de l'Artificier. Chaque sélection doit
rester déterministe et accompagnée de sa raison stable. Les combats trop courts,
les effets actifs, le mana insuffisant et les incompatibilités entre
modificateur et cible restent couverts par les tests unitaires.

Enfin, 216 résolutions autoritaires rejouent plusieurs groupes, étages et seeds
pour comparer l'état, le transcript, le mana, les cooldowns et la séquence RNG.
Cette simulation mesure une politique tactique ; elle ne modifie ni les
sauvegardes ni les valeurs du catalogue.

### Matrice des chargements réellement attribuables

La matrice exhaustive ne donne pas arbitrairement tout le catalogue au héros.
Elle reproduit les 44 chargements que l'autorité peut réellement créer : une
compétence pour le Novice et les classes Tier 1 ordinaires, toutes les paires
distinctes du Mage, et `minor_heal` accompagné de chacune des quatre
compétences possibles de l'Acolyte. Chaque chargement traverse 48 contextes
combinant mana, position dans l'étage, groupe blessé ou intact, menace physique
ou magique, armure, résistances élémentaires et allié fragile.

Les valeurs suivantes sont `actions légales / actions sélectionnées`. Elles ne
constituent pas des taux d'utilisation en partie réelle : les compétences du
Mage et `minor_heal` apparaissent dans plusieurs chargements.

| Classe | Compétences actives : légales / sélectionnées |
| --- | --- |
| Novice | `heavy_blow` 40/40 ; `guard_stance` 16/8 |
| Guerrier | `cleaving_strike` 0/0 ; `weakening_shout` 16/8 ; `provocation` 4/4 |
| Voleur | `quick_shiv` 4/4 ; `double_cut` 36/36 ; `blinding_dust` 44/12 |
| Archer | `precise_shot` 36/36 ; `piercing_arrow` 44/44 ; `crippling_shot` 44/8 |
| Mage | `fire_bolt` 220/136 ; `ice_shard` 220/144 ; `water_lance` 220/52 ; `stone_spike` 220/108 ; `wind_blade` 200/0 ; `lightning_bolt` 220/220 |
| Acolyte | `minor_heal` 32/32 ; `holy_smite` 8/4 ; `sacred_barrier` 44/4 ; `holy_mark` 36/0 ; `benediction` 44/32 |
| Aède | `inspiring_song` 44/44 ; `discordant_chord` 44/12 ; `soothing_song` 7/7 |
| Druide | `thorn_grasp` 44/12 ; `wild_regrowth` 8/8 ; `barkskin` 44/8 |
| Artificier | `flame_thrower` 8/8 ; `lightning_arc` 40/40 ; `overcharged_core` 44/36 ; `static_trap` 36/2 |
| Pugiliste | `earthen_fist` 40/40 ; `zephyr_strike` 44/44 ; `rapid_combo` 40/40 ; `battle_focus` 44/8 |

La matrice instantanée conserve trois signaux visibles au premier tour :

- `cleaving_strike` n'est jamais légal. Son coefficient physique de 1,0 ne
  dépasse pas l'attaque normale avec arme, et sa cible `all_enemies` n'apporte
  aucun avantage dans un moteur qui ne résout qu'un monstre à la fois.
- `holy_mark` est légal dans 36 contextes mais n'est jamais sélectionné à cet
  instant :
  son gain collectif reste inférieur à l'attaque normale ou à un soin
  prioritaire dans les chargements autoritaires testés.
- `wind_blade` est légal dans 200 contextes mais n'est jamais sélectionné tant
  que les deux sorts du Mage sont simultanément disponibles : l'autre option
  équipée obtient toujours une meilleure valeur immédiate.

`static_trap` est désormais légal dans 36 contextes et sélectionné dans 2. Sa
baisse de `magicDefense` contribue au score offensif, en plus de la baisse de
15 % des dégâts magiques du monstre.

Tous les autres actifs sont sélectionnés au moins une fois. Une faible fréquence
ne suffit donc pas à conclure à une domination stricte : `provocation`, les
soins et les protections sont volontairement contextuels, tandis que les sorts
du Mage changent de rang selon les résistances élémentaires.

### Vérification sur des rotations complètes

Une matrice complémentaire résout 176 combats autoritaires complets : les 44
chargements réellement attribuables sont associés à un groupe physique puis à
un groupe magique, chacun rejoué avec deux seeds contre le boss de l'étage 30.
Les héros sont rendus assez résistants et disposent d'assez de mana pour que la
rotation, les cooldowns, la durée des effets et les choix des tours suivants
soient réellement observables. Les événements sont lus depuis le transcript
autoritaire, sans reproduire le moteur dans le test.

Les trois dominations apparentes du premier tour ne se confirment pas sur le
combat complet :

| Compétence | Combats équipés | Combats avec utilisation | Utilisations | Dernier tour observé |
| --- | ---: | ---: | ---: | ---: |
| `wind_blade` | 20 | 10 | 20 | 4 |
| `holy_mark` | 4 | 2 | 4 | 4 |
| `static_trap` | 4 | 2 | 2 | 1 |

`wind_blade` remplit donc bien son rôle de relais quand le sort plus puissant
est en cooldown. `holy_mark` est lancé puis relancé dans les groupes magiques,
et `static_trap` reste un outil de niche sélectionné dans les contextes qui
valorisent ses effets. Ces résultats ne justifient pas à eux seuls une
modification de leurs valeurs de catalogue.
