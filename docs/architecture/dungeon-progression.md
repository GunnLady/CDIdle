# Progression du donjon

`src/domain/dungeonProgression.ts` formalise la progression canonique : 50
salles par étage, passage salle 50 → étage suivant/salle 1, record monotone et
navigation limitée aux étages déjà atteints.

Le combat, les rencontres et la retraite tactique restent dans CDI-015.
