# Audit du rebase du snapshot `zero`

## Périmètre et base de comparaison

- Base autoritaire : `main` à `9a241f3` (tickets CDI-001 à CDI-014 terminés,
  CDI-015 en cours).
- Snapshot analysé : `fa31762`, dont le parent est `eef93e8`.
- Intégration : le seul commit du snapshot est rejoué localement au-dessus de
  `main`. Les documents, le Workboard, les domaines purs et les tests de
  `main` sont conservés.

Le snapshot est un export complet de prototype plutôt qu'une évolution fondée
sur `main`. Rejoué sans résolution, il supprimait les documents d'architecture,
le Workboard, le harnais Vitest, la CI et les domaines CDI déjà validés. Ces
suppressions ne sont pas intégrées.

## Apports retenus

| Apport `zero` | Décision locale | Vigilance / ticket |
| --- | --- | --- |
| Catalogues d'objets, compétences, monstres, armes doubles et modificateurs | Intégrés sans remplacer les domaines CDI | Tests de données et équilibre à compléter dans CDI-015 / CDI-027 |
| Portraits de héros et sprites | Intégrés côté affichage ; l'index de repli est dérivé de façon stable de l'identifiant | Le choix persistant doit venir de l'état autoritaire, CDI-026 |
| Blocage d'équipement selon le niveau | Intégré dans l'UI et le helper d'équipement | Ajouter la matrice de tests d'intégrité à CDI-027 |
| Plans débloqués visibles dans la forge | Intégré dans l'UI de forge | La finalisation reste non autoritaire, CDI-028 |
| Dégâts multi-éléments | Intégrés dans le helper partagé du prototype | Définir le calcul et les arrondis dans le transcript CDI-015 |
| Multi-frappe héroïque | Intégrée dans le hook du prototype, plafonnée à 3 coups | Voir écarts bloquants CDI-015 / CDI-037 ci-dessous |

## Nouveaux problèmes, omissions et collisions

| Sujet | Constat après rebase | Rattachement |
| --- | --- | --- |
| Firebase et clé publique | `zero` ajoutait `firebase-applet-config.json`, `firebase-blueprint.json`, une clé publique en dur et une configuration Firestore spécifique. Les fichiers ont été retirés et `main` conserve seulement son adaptateur prototype configuré par variables d'environnement. Firebase ne devient pas une architecture autoritaire. | CDI-023 |
| Régression d'outillage | Le `package.json` du snapshot retirait les scripts `typecheck`, `test`, `board:validate` et ESLint, ainsi que leurs dépendances. La configuration de `main` est conservée. | Régression résolue, aucune dette nouvelle |
| Régression CDI-005 rejetée | `zero` réintroduisait le `case "guilde"` dupliqué dans `getBuildingMaxLevel`. La résolution garde la correction CDI-005 de `main`. | Régression résolue ; CDI-005 reste Done |
| Régression CDI-006 rejetée | `zero` remettait une présentation locale des stats d'encounter dans `DungeonPanel`, sans `getEncounterDetails` / `getEncounterStatPresentation`. La résolution garde la source canonique issue de CDI-006 et CDI-014. | Régression résolue ; CDI-006 reste Done |
| Régression du socle CDI | Le snapshot ne contenait pas les domaines, audits, tests et Workboard récents. Ces fichiers et contrats CDI-007 à CDI-014 sont conservés. | Régression résolue |
| Multi-frappe non déterministe | La règle reprend `Math.random` pour le jet de coup supplémentaire et les critiques dans `useDungeonSystem`. Formule importée : `max(0, (attackSpeed - 1) * 100 + speed)`, avec plafond de trois frappes. `attackSpeed` est aussi affiché comme une durée dans l'UI : son unité et sa sémantique doivent être décidées avant le domaine canonique. | CDI-015, CDI-037 |
| Transcript incomplet | La multi-frappe produit des logs mais ni des actions atomiques, ni le jet, ni la formule, ni les dégâts par type dans un transcript rejouable. | CDI-015 |
| Multi-élément sans preuve | Les dégâts sont répartis entre les types avant résistance puis arrondis. Aucun test ne fixe encore les cas de résistances mixtes, dégâts minimaux, critiques ou armes doubles. | CDI-015, CDI-037 |
| Tables de loot de boss | `bossLootTables.ts` est apporté par le snapshot mais n'est pas branché à une mutation autoritaire. Son raccordement direct au hook est volontairement différé pour éviter de multiplier les tirages client. | CDI-029, CDI-037 |
| Plans de boss non forgeables | `TownPanel` affiche un plan débloqué de `ITEM_LIBRARY`, alors que `startBasicForgeCraftFromBlueprint` n'accepte que `NOVICE_BASIC_ITEM_LIST`. Un plan de boss peut donc être visible et sélectionnable, puis refusé par le helper. | CDI-028 |
| Plans et niveaux | Les nouveaux objets élargissent les niveaux requis ; le refus d'équipement est désormais appliqué dans le helper et les deux points d'entrée UI. Les tests de refus non-mutant, de piles et de compatibilité restent à écrire. | CDI-027 |
| Balance sans décision | Le snapshot modifie plusieurs rendements d'XP et d'or des monstres et bosses, sans décision produit, contrat ni test de non-régression. | CDI-015 |
| Auto-exploration côté client | `autoExplore` exécute `runCombatTick` par `setInterval` dès qu'un utilisateur est chargé. Aucun verrouillage hors ligne, commande idempotente ou replay canonique n'est apporté. | CDI-029, CDI-031 |
| Portraits | `spriteIndex` est un champ d'affichage optionnel. En l'absence de valeur persistée, le repli est déterministe par identifiant afin de ne pas réintroduire un choix client aléatoire. | CDI-026 |
| Budget client | Les deux planches de portraits ajoutent environ 474 Ko d'assets bruts et font passer le bundle JavaScript de 351,29 à 360,45 Ko gzip. Le budget de 250 Ko gzip était déjà dépassé ; le rebase accroît l'écart. | CDI-034 |
| Rendu des portraits | Le composant lance un `Promise.all` pour traiter deux planches entières au canvas, puis conserve des data URLs en mémoire. Il n'a pas encore de test de rendu, de mesure de coût ni d'interface de repli autre qu'un emoji en cas d'échec. | CDI-034 |

## Comparaison avec les audits existants

Les écarts déjà listés restent valides : tirages de donjon et loot non injectés
(CDI-037), combat et transcript non canoniques (CDI-015), intégration verticale
de l'inventaire/forge/donjon non autoritaire (CDI-027 à CDI-029). Le snapshot
ne les résout pas ; il étend au contraire la surface à migrer. Aucun ticket
`Done` n'est modifié ni rouvert.

## Tests à ajouter avant promotion

- même graine, même arme et même état : nombre de frappes, critiques et dégâts
  multi-éléments identiques dans le futur transcript ;
- plafonnement à trois frappes pour les cas où la formule dépasse 200 ;
- convention explicite de `attackSpeed` et de son interaction avec `speed` ;
- refus d'équipement de niveau insuffisant sans mutation du héros ni du stock ;
- dommages multi-éléments avec résistance, vulnérabilité et minimum de dégâts.
