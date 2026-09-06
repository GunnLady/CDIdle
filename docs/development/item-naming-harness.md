# Harness de nommage des objets

## État et objectif

Moteur `item-naming-v1`, 5 septembre 2026, promu depuis le candidat V2 après
validation utilisateur. Le harness importe désormais le même moteur que le
jeu. Les [règles d’intégration](../architecture/item-naming.md) complètent le
[plan de nommage](item-naming-plan.md). Aucun champ de sauvegarde ni backfill SQL.

## Fonctionnement

- `shared/data/item-naming-v1.ts` : 48 familles, genre/nombre explicites,
  finitions et 37 thèmes (9 de bonus, 14 résistances, 14 dégâts élémentaires).
  Les trois familles organiques n’utilisent pas les finitions d’objets usinés.
- `shared/domain/items/naming.ts` : résolution des statistiques par
  `resolveItemInstance`, sélection conditionnelle du thème, hash cosmétique
  dédié, composition française et forme courte sémantique. Pas de RNG du jeu.
- Le poids des thèmes vaut 3 pour offense/mobilité sur une arme contre 1 pour
  les autres ; sur armure/main gauche, défense 3, ressource 2, autres 1 ; sur
  accessoires, poids égal. Les valeurs de stats d’unités différentes ne sont
  jamais comparées. Les bonus positifs sont agrégés par statistique/type.
- Commune : famille seule. Inhabituelle : thème réel. Rare/épique : finition
  accordée et thème. Légendaire : famille et titre évocateur. Pas d’affixe
  spécial dérivé du tier du héros, ni d’effet produit par le nom.
- Les instances historiques restent nommées par leur base. Données inconnues,
  futures ou incomplètes : fallback explicite, pas d’effet inventé.
- `scripts/run-item-naming-harness.mjs` : campagne manuelle, métriques, corpus
  CSV et échantillon Markdown/JSON. Les sorties sont limitées au répertoire
  généré `test-results/item-naming/`, ignoré par Git.

## Commandes PowerShell

Depuis `D:\codex\CDIdle`, dépendances npm installées, Node du projet :

```powershell
# Régressions courtes : aucun Docker ou navigateur requis.
npm.cmd exec --offline -- vitest run tests/itemNaming.test.ts tests/itemNamingIntegration.test.tsx

# Corpus complet, commande dédiée hors CI qualité automatique.
npm.cmd run test:item-naming

# Autres identifiants déterministes, même taille de corpus.
npm.cmd run test:item-naming -- --seeds=100 --seed-offset=100
```

`--seeds` vaut 100 par défaut (1–1000 autorisé), `--seed-offset` vaut 0.
Chaque commande remplace uniquement les rapports générés de ce harness.
La graine d’un nom est dérivée de son identifiant complet, qui contient famille,
tranche, rareté et numéro de seed : les 192 000 identifiants sont distincts.

## Corpus et portée de la preuve

48 familles × 8 tranches × 5 raretés × 100 identifiants = 192 000 instances
résolues avec les règles d’objets réelles. Le niveau exact alterne sur les
cinq niveaux de chaque tranche : chacun des 40 niveaux a 4 800 cas.
Les bonus sont ceux du résolveur canonique, pas des stats inventées par le moteur.

Cette matrice est volontairement équilibrée en rareté. Elle teste les noms
possibles, pas les fréquences réelles de loot ni une progression de héros.
Les 37 tests courts couvrent en complément les vrais chemins d’attribution :

- 20 recrutements avec `generateAuthoritativeNovice` ;
- les neuf transitions T1 avec `applyTier1ClassTransition` ;
- 100 démarrages de forge avec seeds canoniques dispersées, les cinq qualités
  proposées couvertes, refus/acceptation, infusion, relecture JSON et équipement ;
- neuf paliers de coffre et les cinq boss actuels via l’autorité de donjon ;
- comparaison des états/récompenses avant/après nommage, répétition depuis le
  même état initial, compteur RNG et tirage suivant inchangés ;
- 9 600 combinaisons famille × 40 niveaux × rareté, conventions d’accord,
  propriétés persistées, ordre des bonus, valeurs nulles/négatives, noms longs,
  formes légendaires, fallback et 131 noms legacy.

Les fixtures de boss garantissent une victoire et les coffres utilisent des
tirages dirigés pour atteindre le chemin de récompense voulu. Ce sont des tests
de contrat, pas une mesure de difficulté ou de taux de réussite.
Les boss tardifs peuvent fournir du legacy : le test exige la conservation
de leurs noms, pas une conversion forcée en objets évolutifs.

## Résultats mesurés

Deux passages complets du candidat V2 puis le moteur intégré V1 donnent le
même SHA-256 du corpus (espace de hash interne conservé volontairement) :
`3d525332ec2b7c060d498a40bbc138616cbc1576a4eb3c2a8be620f34913c215`.
Environ 6 secondes par passage sur l’environnement local ; 192 000 lignes,
240 exemples et 131 bases historiques vérifiés. Aucune anomalie détectée
par les contrôles de stabilité, longueur, présence de famille, compatibilité
du thème, fragments invalides, mutation d’entrée et collision entre familles.

Contrôle indépendant des fichiers produits : 192 000 identifiants distincts
dans le CSV et 240 couples famille/rareté distincts dans l’échantillon.
Validation après intégration : 37 tests de moteur/autorités et 9 tests de
surfaces, soit 46 tests ciblés réussis ; suite qualité avec couverture,
115 fichiers / 901 tests réussis. Seuils de couverture, sécurité des logs,
TypeScript, ESLint, garde de déterminisme,
build et budget bundle réussis. Les tests et le runtime utilisent le même
moteur partagé ; aucune ancienne copie du candidat conservée.

| Rareté | Instances | Noms distincts | Longueur max. | P95 longueur | Formes raccourcies |
|---|---:|---:|---:|---:|---:|
| Commune | 38 400 | 48 | 23 | 18 | 0 |
| Inhabituelle | 38 400 | 1 365 | 51 | 40 | 0 |
| Rare | 38 400 | 4 141 | 60 | 51 | 36 |
| Épique | 38 400 | 5 473 | 60 | 50 | 15 |
| Légendaire | 38 400 | 2 065 | 59 | 45 | 0 |

Les doublons sont attendus : un nom n’est pas un identifiant. Le commun
reste volontairement sobre. La légendaire a moins de variantes que l’épique
avec ce premier lexique ; l’identité des titres et leur diversité restent
à apprécier dans l’échantillon avant élargissement éventuel du vocabulaire.

## Ajustements issus du premier passage

Le candidat V1 avait zéro anomalie selon les premiers contrôles mais sa lecture
a mis en évidence des titres à plusieurs tirets et 805 raccourcissements.
La V2 retire les doubles séparateurs, propose davantage de titres élémentaires,
raccourcit les formulations de résistance et préserve d’abord la finition lors
d’une réduction de longueur. Il reste 51 raccourcissements sémantiques, sans
troncature de la famille ou du thème. « Force vive » est remplacé par « frappe »
pour éviter une confusion avec l’attribut Force.
La version de hash a également changé : la comparaison mesure deux candidats,
pas l’effet isolé de chacun des changements de vocabulaire.

Exemples réellement présents dans le corpus V2 :

- Épée de puissance — inhabituelle, niveau 6 ;
- Épée raffinée de frappe — rare, niveau 11 ;
- Épée — Destin tranché — légendaire, niveau 21 ;
- Épées jumelles souveraines de célérité — épique, niveau 1 ;
- Branche vivante resplendissante de protection — rare, niveau 6.

## Rapports et limites

- `test-results/item-naming/summary.json` : métriques et empreinte du corpus.
- `test-results/item-naming/corpus.csv` : tous les noms avec identifiants,
  niveaux, raretés et modificateurs réels pour audit.
- `test-results/item-naming/samples.md` et `samples.json` : 240 objets à relire.
- `test-results/item-naming/anomalies.json` : premiers exemples d’anomalies
  (100 maximum ; tous les totaux restent comptabilisés).

Le corpus complet reste dans une commande indépendante. Les 46 régressions
courtes sont incluses dans la CI qualité ordinaire ; aucune nouvelle simulation
de combat longue ou dépendance n’est introduite.

Le harness valide les règles de composition, pas la beauté des noms ni tous
les détails idiomatiques du français. Le style a été accepté par l’utilisateur ;
le rendu visuel sur petit écran reste à vérifier. L’intégration multisurface
et les noms dérivés des objets évolutifs possédés sont raccordés et testés.
Les noms capturés sont vérifiés sur coffres/boss, forge acceptée/refusée,
infusion, équipement/retrait/recyclage et récompenses T1 ; noms visibles
comparés entre modèles et composants DOM. Pas de preuve DB/API réelle ou
de rendu navigateur revendiquée par ces tests.
