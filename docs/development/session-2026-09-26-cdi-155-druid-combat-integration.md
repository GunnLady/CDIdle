# CDI-155 — intégration locale des gardes Druide

Les vingt illustrations approuvées sont intégrées au cinéma local. L'utilisateur a validé explicitement le cinéma Druide après calibration des cinq écrans. Les preuves finales sont consignées ci-dessous.

## Fichiers et sélection

`src/assets/druidCdi155CombatPoses.ts` associe explicitement les vingt identités aux WebP. `encounterVisuals.ts` utilise ces gardes pour les clés Druide de combat ; les portraits neutres CDI-143 restent séparés. Aucun changement métier ou composant React.

M03 utilise exclusivement sa v2 approuvée. La v1 historique demeure dans les archives et les PNG normalisés, mais n'est ni exportée ni importée au runtime. M07 conserve le bâton demandé par l'utilisateur.

`node scripts/encode-cdi155-druid-webp.mjs` recrée les vingt WebP qualité 0,88 et `assets/design/hero-sprites/cdi-155/manifest.json`. Dépendances : Playwright/Chromium local et les PNG validés/normalisés. Les sources approuvées restent intactes. Le manifeste relie chaque identité à son neutre, sa source, son PNG normalisé et son WebP avec empreintes SHA-256.

## Contrôles réalisés

- 25 tests `tests/encounterVisuals.test.ts` réussis : correspondances, version M03 et séparation des neutres.
- TypeScript réussi.
- `check:dungeon-visuals` réussi : vingt exports, empreintes, dimensions, alpha et bas visible y=900.
- Test Playwright CDI-155 réussi : les cinq pages chargent les vingt gardes, quatre par page, à 1440×1000 ; contrôle structurel, sans verdict esthétique.
- WebP cumulés : 2 410 730 octets. Quatre plus lourds : 642 510 octets, sous le budget de 2 Mio. Quatre plus grands décodés : 16 920 640 octets RGBA. Dimensions : largeur 438–1380, hauteur 920.

## Suite et clôture

Cinéma : `http://127.0.0.1:3001/tests/browser/fixtures/dungeon-harness.html?druid-cinema=1`, pages 1 à 5. Chaque page présente F/M des deux index successifs : 01–02, 03–04, 05–06, 07–08, 09–10.

## Clôture — 27 septembre 2026

Verdict utilisateur : « cinéma druide valide continue », puis demande d'arrêt après clôture et Git. Aucune génération Artificier lancée.

Échelles F01–F10 : `0.75, 0.75, 0.75, 0.7, 0.83, 0.75, 0.83, 0.8, 0.75, 0.75`.
Échelles M01–M10 : `0.8, 0.8, 0.85, 0.85, 0.75, 0.8, 0.83, 0.75, 0.7, 0.83`.

Écart responsive détecté après le verdict : les cadres de F04/F06 dépassaient à gauche de 4/18 px à 1024 px. Correction technique annoncée : pivots F04=0,47 et F06=0,4 ; autres pivots=0,5, échelles intactes. Les cinq pages passent ensuite aux largeurs 1440/1280/1024/512 px, images entières contenues. Le verdict artistique est celui de l'utilisateur ; cette correction de placement est vérifiée techniquement par Codex.

Les imports explicites des neutres Druide et Aède remplacent leurs tables de recherche de chemins ; mêmes vingt fichiers par classe, correspondances testées exhaustivement. Cette réduction corrige le dépassement initial de 203 octets sans relever le budget. Build final : 261 981 / 262 144 octets gzip JavaScript ; plus gros chunk 118 347 octets.

Contrôles finaux : 75 tests ciblés, TypeScript, lint, alpha/empreintes/budget d'assets réussis. Cinéma Aède et Acolyte revérifié avec succès. Les tests de lecteur couvrent garde, repli d'action et sortie hors combat ; aucun contrat de scène ni résultat métier modifié. Planches neutre/garde clair et sombre disponibles sous `assets/design/hero-sprites/cdi-155/review`, reproductibles par `node scripts/review-cdi155-druid-combat.mjs` ; elles ne remplacent pas le verdict cinéma.

Mesures réseau Vite local : quatre images de garde par page, aucune précharge de toute la classe. Cache chaud : revalidation HTTP, pas zéro requête. Aucun résultat CDN de production revendiqué.

| Page | Corps froid | Transfert froid | Transfert chaud | RGBA décodé |
| --- | ---: | ---: | ---: | ---: |
| 1 | 436618 | 437818 | 1200 | 8935040 |
| 2 | 457944 | 459144 | 1200 | 11452160 |
| 3 | 452048 | 453248 | 1200 | 11047360 |
| 4 | 530406 | 531606 | 1200 | 10458560 |
| 5 | 533714 | 534914 | 1200 | 10613120 |

Clôture fonctionnelle locale de CDI-155. Publication Git demandée, avec CDI-154 déjà validé et sa dépendance locale aux tables compactes Mage/Acolyte ; fichiers de déploiement et essais sans rapport exclus. Aucun déploiement autorisé ni effectué. Les poses d'action restent dans leurs tickets dédiés.
