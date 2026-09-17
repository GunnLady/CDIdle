# Handoff — CDI-141 Acolytes

Date : 17 septembre 2026
État : terminé et validé
Ticket : `workboard/data/Done/CDI-141/ticket.md`

## Décisions visuelles validées

- Vingt identités : dix hommes et dix femmes.
- Institution religieuse commune, avec plusieurs ordres reconnaissables par
  leurs palettes et leurs variantes d’un soleil fictif non lumineux.
- Deux familles principales : cléricale et martiale. La famille martiale vise
  surtout le Templier/Inquisiteur occidental ; un courant monastique asiatique
  reste une variation minoritaire valide.
- Standing institutionnel T1, sans silhouette de mage vagabond, de pèlerin ou
  de coureur des grands chemins.
- Tuniques pour les deux sexes ; robes et jupes réservées aux femmes ; pantalon
  droit pour les deux sexes quand la tenue l’emploie.
- Une tenue jumelée partage ordre, palette et marqueurs sans devenir une tenue
  mixte identique. Les jumelages peuvent croiser les numéros.
- Jumelages finaux : M01/F01, M02/F02, M03/F03, M05/F05, M07/F06,
  M04/F07, M08/F04, M06/F08, M09/F09 et M10/F10.

La bible détaillée et les verdicts individuels sont dans
`assets/design/hero-sprites/cdi-141/acolyte-identities-and-inspirations.md`.

## Assets

- Sources validées :
  - `assets/design/hero-sprites/cdi-141/validated-male-v1/`
  - `assets/design/hero-sprites/cdi-141/validated-female-v1/`
- Exports runtime :
  - `assets/design/hero-sprites/cdi-141/normalized-alpha-v1/male/`
  - `assets/design/hero-sprites/cdi-141/normalized-alpha-v1/female/`
- Planches de contrôle validées :
  - `assets/design/hero-sprites/cdi-141/normalized-alpha-v1/previews/`
- Script reproductible : `scripts/prepare-cdi-141-acolyte-assets.ps1`

Les exports runtime sont vingt PNG alpha de `341 × 692`. Les quatre planches de
contrôle, hommes/femmes sur fonds clair/sombre, ont été validées par
l’utilisateur le 17 septembre 2026.

## Contrat runtime

- `src/assets/acolyteCdi141Portraits.ts` découvre les vingt PNG et expose dix
  variantes par genre.
- Une clé historique `0–19` devient `clé modulo 10` pour le même genre.
- `src/assets/heroPortraitAssets.ts` utilise ces exports pour la classe
  `Acolyte`; les autres classes conservent leur pipeline actuel.
- `src/assets/encounterVisuals.ts` expose la provenance
  `CDI-141 validated Acolyte alpha sprites`.
- Le visuel ne dépend jamais de l’arme réellement équipée et ne porte aucune
  règle métier.

## Mesures et validations acquises

- `npm.cmd run check:dungeon-visuals` : réussi.
  - poids froid total : `5 356 017 octets` ;
  - quatre héros les plus lourds : `1 176 549 octets` ;
  - mémoire décodée : `943 888 octets` par sprite et `3 775 552 octets` pour
    quatre sprites.
- `npm.cmd test -- --run tests/heroPortrait.test.ts tests/encounterVisuals.test.ts` :
  `29/29` tests réussis.
- `npm.cmd run typecheck` : réussi.
- `npm.cmd run lint -- --quiet` : réussi.
- `npm.cmd run build` : réussi.
- `npm.cmd run check:bundle` : réussi, `256 788 octets` gzip JS au total,
  plus gros chunk `118 347 octets`; aucun relèvement de budget.
- Scénario Playwright PC ciblé : réussi (`1/1`) ; les vingt sprites sont chargés
  sur les cinq pages `acolyte-cinema=1..5`, aux dimensions `341 × 692`, sans
  débordement de la scène.
- Validation visuelle utilisateur en scène PC : acquise le 17 septembre 2026.

Les premiers lancements de Vitest et du build ont été bloqués avant exécution
par le `spawn EPERM` connu du sandbox Windows. Leurs relances ciblées hors
sandbox ont réussi ; ce n’était pas un échec du projet.

## Clôture

Tous les critères de CDI-141 sont couverts. Le ticket peut être déplacé vers
`Done`. Les éventuelles poses de combat ou d’action relèvent de tickets
ultérieurs et ne remettent pas en cause cette validation des bases neutres.

Les poses de combat ou d’action ne sont pas couvertes par CDI-141. Aucun
déploiement n’est autorisé ni nécessaire pour cette clôture.
