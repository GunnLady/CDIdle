# GameStateV1

`src/domain/gameState.ts` définit le contrat canonique de l'état de jeu.

- `createInitialGameState()` produit un état initial neuf et isolé.
- `resetGameState()` fournit le même reset pur, sans effet de bord.
- `validateGameState()` retourne des erreurs déterministes avec le chemin du champ invalide.
- `splitGameState()` sépare les données persistantes des données de session (`combatTimer`, `battleLogs`, `currentMonster`, `autoExplore`).

Les hooks React restent les propriétaires de leurs mutations pour ce ticket. Leur migration vers ce contrat est volontairement laissée aux tickets dépendants.
