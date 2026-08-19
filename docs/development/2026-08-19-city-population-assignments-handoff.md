# Handoff — population et affectations de production

## Statut

Le 19 août 2026, le panneau Affectations de la Cité adopte les cartes raster
validées dans le catalogue puis intégrées au runtime. La synthèse de population,
la progression d'immigration et les quatre métiers de production partagent
désormais la direction artistique bois, métal et illustrations des bâtiments.

Les contrôles structurels et techniques ont été réalisés par Codex. Codex n'a
pas ouvert ni piloté le navigateur. Les proportions, cadrages, alignements,
couleurs et tailles ont été contrôlés visuellement par l'utilisateur dans le
catalogue local `?ui-catalog=1`.

## Synthèse de population

`PopulationSummaryBar` remplace l'ancienne juxtaposition d'une jauge et d'une
alerte. Il affiche dans un cadre raster transparent :

- le nombre de citoyens disponibles ;
- la capacité de population, sans notation `X/Y` ;
- une barre d'immigration compacte et accessible.

Le cadre runtime est
`src/assets/images/ui/population-summary-frame-v12.png`. Les textes Disponibles
et Population sont centrés dans leurs zones par mesure des distances aux bords,
puis descendus de `3 px`. Les compteurs partagent la teinte `#f0d58d`.

## Cartes d'affectation

`AssignmentJobCard` rend les quatre métiers à partir des données réelles de
`CityDashboardView` : bâtiment, niveau, profession, production par seconde,
nombre affecté et disponibilité des actions `+` et `-`.

Les taux de production calculés par l'application sont transmis depuis `App`
jusqu'au modèle de présentation de la Cité. Si le bâtiment n'est pas construit,
la carte affiche explicitement `Bâtiment non construit`.

Chaque métier emploie une carte raster complète :

- `assignment-production-farm-v4.png` ;
- `assignment-production-woodcutters-v4.png` ;
- `assignment-production-quarry-v4.png` ;
- `assignment-production-mine-v4.png`.

Les PNG mesurent `1024 x 364 px`. Leur fond noir extérieur a été détouré en
alpha sans retirer les noirs internes. Les quatre silhouettes visibles ont été
normalisées sur le gabarit de la ferme : `1012 x 351 px`, aux coordonnées
`(6,5)-(1017,355)`.

Le bloc Affectés est décalé de `6 px` vers la gauche et de `3 px` vers le bas.
Les boutons sont à `90,25 %` de leur taille d'origine après deux réductions
successives de 5 %. La production utilise l'or clair `#f0d58d` pour conserver
un contraste lisible sur le bois.

## Catalogue et runtime

Le catalogue expose une composition interactive dédiée dans le panneau
`Population et affectations`. Le runtime emploie les mêmes assets finaux et les
mêmes mesures. Les actions du catalogue restent locales ; celles de la Cité
appellent le callback d'affectation réel.

## Validation et périmètre Git

Validation technique effectuée pendant l'intégration :

- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint` : réussi ;
- `npm.cmd test -- --run tests/CityDashboard.test.tsx` : `16/16` tests réussis ;
- `npm.cmd run build -- --outDir tmp/codex-city-assignments-build` : réussi,
  `1971` modules transformés ;
- présence et imports des quatre cartes `v4` : vérifiés ;
- emprise alpha des quatre cartes : identique, `1012 x 351 px` ;
- validation visuelle : rapportée par l'utilisateur dans le catalogue local.

Le premier passage du test Cité a détecté que le nouveau compteur exposait
seulement sa valeur numérique au lecteur d'écran. `PopulationSummaryBar`
annonce désormais explicitement le nombre de citoyens disponibles ; le rendu
visuel reste inchangé et le test ciblé repasse.

Les variantes raster intermédiaires `v1` à `v3`, les surfaces de travail, les
illustrations isolées et `tmp/` ne font pas partie du lot Git. Les deux assets
non liés du rail de navigation secondaire restent également hors périmètre.

Le lot ne modifie ni backend, ni schéma Supabase, ni règle métier. Après le
push sur `main`, publier le frontend avec le workflow manuel
`.github/workflows/deploy-frontend.yml`, puis faire confirmer visuellement le
panneau Affectations sur l'application déployée.

À la reprise, lire `AGENTS.md`, ce handoff et
`docs/development/2026-08-18-city-building-details-handoff.md`.
