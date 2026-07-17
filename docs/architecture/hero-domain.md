# Domaine héros

`src/domain/hero.ts` centralise les règles déterministes de recrutement et de progression :

- `recruitmentCost` calcule le coût selon le nombre de héros présents ;
- `growHeroStats` reçoit un `Rng` injecté et ne dépend pas de `Math.random` ;
- `addHeroExperience` applique les niveaux multiples et rafraîchit les stats dérivées ;
- `chooseAutomaticClass` expose la décision de classe sans effet de bord.

La génération complète d’un candidat et l’orchestration UI restent dans les hooks jusqu’aux tickets d’intégration autoritaire.
