# Essais de rythme idle — 6 septembre 2026

La dernière décision utilisateur retire toutes les anciennes directions et
cibles arbitraires : quota de loot 1–3, forge 1–2 améliorations par tranche,
hausse obligatoire des tentatives et durée/ralentissement imposés.
Les jugements historiques « trop généreux » ne valent plus comme critères.
Le rendu idle devient l'objet de comparaison, sans prétendre le valider avec
un unique chiffre. Ce document prime sur les conclusions produit v1 à v3.

## Comparaison

100 seeds appariées par profil, dix processus de simulation, dix seeds par
processus et par profil : 400 campagnes. Ville progressive, horizon technique
de quatre héros au niveau 40, 48 recettes actives et compatibilité legacy.

- baseline : référence inchangée.
- budgetRecycle : flux de loot et recyclage v3, probabilités natives.
- idleRhythm : même économie, progression des offres de rareté vers
  30/40/22/7/1 % (commun à légendaire) à la forge 8.
- idleRhythmEfficient : même courbe, avec préservation de scraps 10–30 %.

La courbe part des probabilités initiales et respecte les raretés accessibles.
Ces paramètres sont des hypothèses expérimentales, pas une norme du genre.
La puissance des objets reste identique dans cette comparaison pour isoler
fréquence et financement ; ce n'est plus une contrainte produit intangible.

## Lecture des résultats

Comparer régularité du loot, tentatives, temps sans craft et sans amélioration
forgée équipée, distribution des gains de score d'équipement, offres de rareté
acceptées/refusées, matériaux manquants, progression des héros et récupération.
Les temps sont simulés ; les intervalles de forge incluent les bords de campagne.
Le score d'équipement ne mesure pas directement le DPS.
Aucune durée cible, aucun quota d'améliorations, aucun ralentissement obligatoire.

Vérifier d'abord les invariants techniques : conservation des ressources,
équipements uniques, probabilités normalisées, versions homogènes et campagnes
complètes. Examiner ensuite les écarts entre seeds et les périodes de stagnation
avant de choisir une variante. Le ressenti en session et hors ligne demandera
une validation dans le jeu ; le harness seul ne le démontre pas.

## Exécution

État vérifié le 6 septembre 2026 : tests town-policy, idle-experiments et
idle-budget réussis ; pilote 4/4 terminé, audit et analyse de cadence réussis.
Les deux témoins reproduisent leurs résultats métier v3 sur la même seed.
Lot complet lancé à 11:03:43 (Paris) et terminé à 11:42:28 : 400/400 campagnes
complètes, 100 par profil, audit réussi. Aucun profil n'est déclaré « gagnant »
pour la forge ; le comportement loot commun aux trois variantes est retenu.

| Profil | Durée moyenne | Objets/passage | Plus long creux moyen | Crafts | Objets forgés équipés |
|---|---:|---:|---:|---:|---:|
| baseline | 9,15 h | 1,08 | 37,50 min | 155,78 | 55,28 |
| budgetRecycle | 6,82 h | 5,51 | 6,00 min | 451,38 | 74,55 |
| idleRhythm | 7,40 h | 5,51 | 6,55 min | 439,60 | 55,65 |
| idleRhythmEfficient | 7,23 h | 5,51 | 6,29 min | 677,82 | 64,27 |

Le gain démontré pour ce sous-lot est la régularité du loot : le plus long
creux moyen tombe d'environ 37,5 à 6–6,6 minutes sur 300 campagnes idle. La
durée baisse de 17,8 à 24,3 % selon les autres leviers actifs ; c'est un effet
observé, pas une cible. Les différences de crafts et d'équipements viennent du
recyclage, des probabilités de forge et de la préservation, qui sont différés.

## Implémentation loot

La règle retenue est portée dans le domaine partagé :

- coffre et salle finale : ajouter un objet seulement si aucune ligne d'objet
  n'a déjà réussi ;
- combat ordinaire victorieux : chance de 5 à 12 %, par tranche de cinq
  niveaux du héros le moins avancé ;
- sélection : fenêtres, raretés et provenances existantes du catalogue ;
- RNG : sous-flux déterministe propre aux objets, sans décaler combat,
  matériaux, plans ou progression ;
- autorité : le résolveur crée l'instance, la stocke et écrit le transcript.

Cette modification ne change ni contrat réseau, ni version d'état, ni migration,
ni frontend. Les probabilités de forge `idleRhythm`, le recyclage renforcé et
la préservation de scraps restent expérimentaux et hors de ce sous-lot.
Les profils de budget du harness portent désormais `canonicalLoot: true` : les
relancer après cette intégration ne double donc pas les objets de production.
Les anciens rapports restent liés à leur code et à leur hash sauvegardés.

Validation post-intégration complète : `canonical-idle-loot-v1` a terminé
100/100 campagnes sur dix workers et passé l'audit. Il mesure 7,00 h, 5,37
objets par passage, un plus long creux moyen de 6,01 minutes, 387,74 crafts et
67,82 objets forgés équipés. Les 100/100 intervalles 35–40 sont plus longs que
les intervalles 5–10 ; cette observation n'est pas un critère de succès.

Traçabilité du lot canonique :

- politique : `idle-source-flow-v1` ;
- seeds : 100, appariées, dix workers de dix seeds ;
- début : `2026-09-06T10:31:45.363Z` ;
- fin : `2026-09-06T10:41:58.436Z` ;
- `policyHash` : `b22b91d8c176e2e612de320e4daacc16a6de618c48c1f88d63062babfa166f04` ;
- audit : `passed`, 100 rapports complets, stderr vide.

Le pilote précédent `canonical-idle-loot-pilot-v1` reste un smoke de dix seeds.
Le lot de 100 campagnes constitue désormais la preuve directe du portage ; les
300 campagnes idle v4 restent la comparaison des variantes expérimentales.

Pilote : même commande avec 1 seed et 1 worker, identifiant distinct.
Lot expérimental historique :

```powershell
node scripts/run-loot-economy-harness.mjs --stage=full --seeds=100 --workers=10 --profiles=baseline,budgetRecycle,idleRhythm,idleRhythmEfficient --town=progressive --experiment=idle-rhythm-v4
```

Sorties : test-results/loot-economy/full/idle-rhythm-v4/
baseline-budgetRecycle-idleRhythm-idleRhythmEfficient-city.
Checkpoints atomiques par seed, audit automatique et analyse de cadence en fin
de lot. Contrôler manifest.json, stderr.log, completed.json et cadence-analysis.json.
Le comportement loot retenu est maintenant intégré au domaine partagé. Aucun
déploiement n'est inclus dans ce sous-lot.
