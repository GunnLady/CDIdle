# CDI-154 — intégration locale des gardes Aède

26 septembre 2026. Vingt sources validées individuellement, archivées sans redessin et intégrées localement. Les cinq écrans cinéma ont ensuite été validés explicitement par utilisateur ; voir la clôture ci-dessous.

## Livraison

`src/assets/aedeCdi154CombatPoses.ts` associe les vingt clés genre/index aux WebP avec échelle et pivot horizontal individuels. Réglages initiaux issus de comparaison visuelle neutre/garde, pas de mesure anatomique exacte ; recette visuelle requise. `encounterVisuals.ts` raccorde les clés `Aède_*@combat_idle`. Les neutres restent CDI-142. Le lecteur existant conserve neutre → garde → action → garde → neutre. Aucun domaine métier ou composant React modifié.

`assets/design/hero-sprites/cdi-154/manifest.json` lie neutres, sources validées, PNG normalisés et WebP : SHA-256, dimensions, poids. Le contrôle d'assets vérifie les vingt correspondances et empreintes.

Reproduction : `node scripts/encode-cdi154-aede-webp.mjs`, depuis PowerShell à la racine. Dépendances : Playwright/Chromium local, vingt sources et vingt PNG normalisés. Canvas Chromium encode en WebP qualité 0,88 et recrée le manifeste. Il ne modifie pas les sources approuvées. Une réexécution actualise exports et empreintes : lancer ensuite `npm.cmd run check:dungeon-visuals`.

Les imports explicites Mage/Acolyte/Aède remplacent leurs tables de recherche par chemins pour respecter le budget JS. Mêmes fichiers et réglages Mage/Acolyte, vingt correspondances testées pour chaque classe et cinq pages navigateur revérifiées. Les imports exposent des URL ; ils ne téléchargent pas toute la classe.

## Preuves

- 20 WebP : 2 074 362 octets ; plus gros fichier 175 080 octets (<300 Kio).
- Quatre gardes les plus lourdes : 547 516 octets. Quatre plus grandes images décodées : 13 292 160 octets de mémoire, distincts du poids réseau.
- PNG : hauteur 920, largeur 454–1090, coins transparents et bas visible y=900. Le centre de boîte alpha n'est pas le pivot d'appui ; les réglages du catalogue le distinguent.
- Build réussi. JS gzip : 261 962 / 262 144 octets, marge 182 ; plus gros chunk 118 347 / 307 200. Dépassement initial de 294 octets corrigé sans changer le seuil.
- Vitest ciblé `tests/encounterVisuals.test.ts tests/dungeonCombatScene.test.ts` : 3 fichiers, 74 tests réussis, y compris le fichier de compatibilité ajouté par la configuration.
- Typecheck, lint silencieux et `check:dungeon-visuals` réussis.
- Playwright : cinq pages Aède, vingt identités, seulement quatre images chargées par page. Acteurs et images entières restent dans la scène à 1440, 1280, 1024 et 512 px CSS (équivalent 1024 px à zoom 200 %).
- Régression navigateur cinq pages Mage et cinq pages Acolyte réussie. Harness déterministe utilisant le vrai composant, sans backend ni compte utilisateur ; ce n'est pas un verdict visuel.

Mesures Vite local : seuls les téléchargements d'images sont comptés, pas les modules JS URL. Le cache chaud est un rechargement de chaque page : 1 200 octets de revalidation HTTP pour quatre images, pas zéro requête. Les en-têtes CDN de production ne sont pas couverts.

| Page | Corps image froid | Transfert froid | Transfert chaud | Mémoire décodée |
| --- | ---: | ---: | ---: | ---: |
| 1 | 422114 | 423314 | 1200 | 8861440 |
| 2 | 427308 | 428508 | 1200 | 9700480 |
| 3 | 488790 | 489990 | 1200 | 10819200 |
| 4 | 372606 | 373806 | 1200 | 8302080 |
| 5 | 363544 | 364744 | 1200 | 10083200 |

## Recette restante

Captures locales : `.tmp/cdi154-cinema/aede-page-1.png` à `aede-page-5.png` ; mesures brutes `aede-page-N-network.json`. Chaque page présente F/M des deux index successifs : 01–02, 03–04, 05–06, 07–08, 09–10. Le test recrée ces captures dans `test-results`.

À valider dans les cinq écrans : taille, pieds, armes, superpositions. Vérifier aussi la continuité visuelle neutre/garde en lecture avant clôture : captures fixes et tests de sélection ne la prouvent pas.

Réserves historiques du ticket conservées : prompt/références exacts M09 non établis ; association appel interrompu/fichier F04 non établie ; second sifflet F08 signalé avant son verdict, présent dans le fichier exact approuvé. Ne pas modifier silencieusement ces sources. Résoudre ou accepter explicitement la limite documentaire avant clôture ; préciser le maintien du second sifflet. Identifiants et empreintes des fichiers validés sont vérifiés.

Aucun commit, push ou déploiement. Changements préexistants sans rapport préservés.
## Clôture après réglages utilisateur

Le 26 septembre 2026, verdict explicite « cinéma validé » sur les cinq écrans après réglages. Valeurs finales et preuves de régression dans CDI-154. 74 tests ciblés et cinq pages navigateur aux quatre largeurs repassés avec ces valeurs. Budget JS final : 261 955 octets gzip, marge 189 octets. Le build passe.

Les réserves historiques de la section précédente sont levées : les appels ImageGen completed M09 et F04 ont été retrouvés dans les journaux, avec prompt et références (`assets/design/hero-sprites/cdi-154/recovered-generation-provenance.json`). F08 reste le visuel exact validé avec second sifflet signalé. Le verdict cinéma apporte la preuve utilisateur ; les tests n'en tiennent pas lieu. Clôture locale, sans commit/push/déploiement.