# Forge : interface de l’atelier

## Périmètre — 5 septembre 2026

Refonte frontend uniquement : aucune migration, aucun changement des courbes
XP/objets, des noms, des plans connus, des coûts ou du RNG. Le catalogue
conserve ses 48 familles et les previews historiques restent finalisables.

## Parcours

- Illustration de forge existante, niveau et prochaine tranche en en-tête.
  L’amélioration payante du bâtiment reste distincte de la fabrication.
- Réserve compacte puis livre de plans : recherche insensible aux accents,
  filtres par famille et plans connus uniquement par défaut. Les plans inconnus
  sont consultables en désactivant ce filtre ; ils ne peuvent pas être forgés.
- Fiche de fabrication : plan, qualité minimale, tranche ouverte, aperçu et
  matériaux possédés/requis avec manque explicite. Le bouton envoie toujours
  l’identifiant du plan et la tranche sélectionnée à `forge.start`.
- Résultat : niveau exact, qualité finale de base, offre supérieure distincte,
  coût supplémentaire et choix d’infusion. Sans acceptation, `forge.finalize`
  récupère la qualité minimale, pas la rareté proposée.
- Abandon : confirmation explicite de la perte de l’objet et du non-remboursement.
  Aucune mutation tant que la confirmation n’est pas donnée.
- Lecture seule : navigation et inspection disponibles, mutations désactivées.
  Les matériaux sont revalidés à chaque rendu, même après avoir coché une offre.
  Une nouvelle preview réinitialise les choix d’amélioration et d’abandon.

## Architecture et limites

`forgePresentation.ts` prépare les catégories, filtres, sources de plans et coûts
à partir du catalogue et de l’économie partagés. Il utilise les fonctions
existantes de scaling pour les deux bornes de la tranche, à la rareté minimale.
L’aperçu n’invente ni niveau exact ni bonus aléatoires : ceux-ci dépendent du
résultat final. Les libellés d’infusion désignent la statistique sans réutiliser
les anciennes valeurs fixes, trompeuses pour les objets évolutifs.

`ForgeWorkspace` orchestre la sélection et les callbacks ; `ForgeCatalog`,
`ForgeCosts` et `ForgeResult` gèrent leurs affichages et interactions locales.
Les anciens libellés concaténés de coût, devenus inutilisés, sont supprimés.
Les primitives du design system sont réutilisées, sans nouveau thème ni asset.

La disposition est empilée sur petit écran et en deux colonnes à partir du
breakpoint `2xl`, afin de tenir compte de la colonne Bâtiments de la Cité.
Les cartes ont une sélection `aria-pressed`, la recherche et les champs ont
leurs libellés, les contrôles gardent le focus visible et les cibles de 44 px.

## Validation

Commandes PowerShell, depuis la racine du projet :

```powershell
npm.cmd exec --offline -- vitest run tests/forgePresentation.test.ts tests/CityDashboard.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run check:bundle
```

Les tests ciblés couvrent recherche, filtres, clavier, plans verrouillés,
coûts/manques, tranches, lecture seule, rareté finale, offre non finançable,
changement de ressources, nouvelle preview, abandon confirmé/révoqué, plafond
du bâtiment et compatibilité historique. Les aperçus d’armes sont comparés
au scaling partagé pour les huit tranches et toutes les familles concernées.

Ces tests DOM ne prouvent pas le rendu visuel ou l’absence de débordement réel.
Validation technique du 5 septembre 2026 : 34 tests ciblés réussis ; suite
rapide complète, 113 fichiers / 855 tests réussis ; TypeScript, ESLint, build,
budget bundle et contrôle du diff réussis. Les simulations longues et les
tests DB ne sont pas relancés pour ce lot exclusivement frontend.

Validation visuelle par l’utilisateur sur `http://127.0.0.1:3000` : Cité → Forge,
grand écran puis fenêtre étroite, liste complète de plans, coûts insuffisants
et résultat avec/sans amélioration. Aucun navigateur piloté par Codex pour ce lot.

## Lot suivant : moteur de nommage intégré

Le moteur était exclu de la refonte visuelle initiale. Après validation du
harness et demande d’intégration, le [nommage V1](../architecture/item-naming.md)
est raccordé aux objets et récompenses. Le [plan](item-naming-plan.md) conserve
les décisions. Les recettes/offres restent au nom de famille ; le nom définitif
apparaît après finalisation. La revue visuelle utilisateur reste à effectuer.
