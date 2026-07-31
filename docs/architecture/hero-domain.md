# Domaine héros

`src/domain/hero.ts` centralise les règles déterministes de recrutement et de progression :

- `recruitmentCost` calcule le coût selon le nombre de héros présents ;
- `growHeroStats` reçoit un `Rng` injecté et ne dépend pas de `Math.random` ;
- `applyHeroExperienceLevels` applique les niveaux multiples, récupère une
  seule fois 20 % des PV max et 30 % des PM max, puis rafraîchit les stats
  dérivées ;
- `applyHeroProgression` orchestre ensuite une éventuelle transition de classe
  et ses récompenses ;
- `resolveClassTransition` expose la décision de transition sans effet de bord.

Le calcul d XP ne change jamais directement la classe. Lorsqu un niveau est
gagné, `applyHeroProgression` demande à `resolveClassTransition` si une
transition est admissible, puis la fait appliquer par la politique enregistrée
pour les tiers concernés. La politique `0->1` couvre actuellement le passage
Novice vers T1. Les futures politiques `1->2`, `2->3` et `3->4` pourront être
ajoutées sans modifier le donjon ni le calcul des niveaux.

Un simple gain d XP sans level-up conserve les `calculatedStats` persistées.
Les statistiques dérivées sont recalculées lors d un level-up, d une vocation,
de l équipement ou du déséquipement d un objet. La récupération 20 % PV / 30 %
PM est appliquée une fois par récompense, même si elle provoque plusieurs
niveaux.

La formule du seuil suivant est
`ceil(100 * 1.5^(niveau cible - 2) * multiplicateur de tier)`, avec un
multiplicateur de `1` pour T0 et `1.25` pour T1. `xpNeeded` est une valeur
dérivée : les anciennes valeurs sont normalisées sans RNG au chargement. Un
reliquat `xp >= xpNeeded`, qui nécessiterait une croissance aléatoire pour être
réparé, est refusé comme état canonique invalide.

Pour un Novice, les statistiques prioritaires sont les trois `baseStats` les
plus élevées au début de chaque niveau. Equipement, passifs et statistiques
dérivées n interviennent pas. Les égalités suivent l ordre historique
`str, agi, end, int, wiz, dex, luk`. Chaque point consomme un roll pour choisir
le groupe prioritaire 80 % / secondaire 20 %, puis un roll pour choisir la
statistique dans ce groupe : cinq points consomment donc dix rolls. Une classe
T1 gagne huit points et consomme seize rolls selon ses `mainStats` de classe.
Une classe T1 sans `mainStats` est refusée avant tout roll.

Le passage T0 vers T1 applique les compétences et les récompenses d équipement
avec le même `Rng` injecté. L actif Novice est retiré et son passif Novice est
conservé :

- Mage : deux sorts élémentaires distincts, puis un passif Mage ;
- Acolyte : `minor_heal` garanti, un autre actif Acolyte, puis un passif
  Acolyte ;
- autres classes T1 : un actif puis un passif de la classe.

Cette attribution de compétences est une décision produit postérieure à la
référence `640f89f`, qui changeait la classe sans attribuer les compétences T1.

Les cooldowns sont réinitialisés lors du changement de vocation. Les pools
proviennent du catalogue de classe et chaque identifiant doit correspondre à
une compétence existante du bon type.

La transition T1 attribue ensuite une arme et un accessoire selon
`docs/architecture/tier1-class-equipment.md`. Classe, compétences, équipement,
coffre et restauration complète des PV/PM sont renvoyés dans un seul résultat
de progression et persistés par la même commande canonique.

Cette attribution intervient uniquement lors de la vocation. Un héros déjà T1
dans une sauvegarde existante n'est pas rerollé silencieusement : une éventuelle
migration devra être explicite, versionnée et définir son impact sur le RNG
canonique.

## Arbitrage de vocation

`src/domain/classAffinity.ts` calcule et calibre les affinités T1. La
contribution des statistiques dérivées est moyennée afin que le nombre de
champs déclarés ne donne pas un avantage structurel. Une fenêtre relative de
1 % autour du meilleur indice détermine si la transition est automatique ou
si elle produit une prière.

Une prière est un résultat explicite de `resolveClassTransition`, persisté
dans `pendingClassTransitions`. Elle suspend uniquement le héros concerné et
ne consomme pas les tirages réservés à la transition. La politique de tier est
appliquée après `hero.choose_vocation`, à partir des candidats persistés. Le
registre de résolveurs et de politiques permet d'ajouter les transitions
`1->2`, `2->3` et `3->4` sans déplacer la progression dans le donjon ni imposer
une réécriture purement fonctionnelle des modules existants.

La génération complète des candidats reste dans l'autorité serveur. Le
frontend ne reçoit que l'attente canonique et envoie le choix explicite du
joueur.
