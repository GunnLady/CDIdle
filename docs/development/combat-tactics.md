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

## Dégâts, soins et menace

- Les dégâts sont estimés après défense, résistance, type élémentaire et nombre
  d'impacts.
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

La réserve est dérivée des compétences possédées, sans table de classes : coût
du meilleur soin, sinon du soutien principal, sinon de l'attaque forte.

Avant la dernière salle, elle progresse linéairement de 50 % à 100 % de cette
base à mesure que le groupe approche du boss. Elle vaut zéro dans la salle du
boss afin que le mana préparé soit dépensé. Le comportement équilibré est
l'unique stratégie autoritaire pour le moment ; aucun profil n'est persisté.

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
