# Progression du donjon

`supabase/functions/game-api/dungeon-authority.ts` porte la progression
canonique : 50 salles par étage, passage salle 50 → étage suivant/salle 1,
record monotone et navigation limitée aux étages déjà atteints. L ancienne
copie cliente a été supprimée par CDI-066.

Le combat, les rencontres et la retraite tactique sont également autoritaires.
