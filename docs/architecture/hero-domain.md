# Domaine héros

`src/domain/hero.ts` centralise les règles déterministes de recrutement et de progression :

- `recruitmentCost` calcule le coût selon le nombre de héros présents ;
- `growHeroStats` reçoit un `Rng` injecté et ne dépend pas de `Math.random` ;
- `addHeroExperience` applique les niveaux multiples, récupère 20 % des PV max et rafraîchit les stats dérivées ;
- `chooseAutomaticClass` expose la décision de classe sans effet de bord.

Lorsqu’un Novice atteint le niveau 10, `addHeroExperience` applique aussi le changement automatique si un bâtiment de métier admissible est présent ; après évolution, les PV et la mana sont restaurés au maximum.

La génération complète d’un candidat et l’orchestration UI restent dans les hooks jusqu’aux tickets d’intégration autoritaire.
