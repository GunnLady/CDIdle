# Handoff — UnderCity, progression T0/T1 et calibration idle

Date d'arrêt : 8 septembre 2026.

## But de la reprise

Terminer le sous-lot local non publié autour d'UnderCity, puis reconstruire la
preuve de progression Novice/T1 sur le donjon réellement joué. La calibration
doit respecter les décisions produit ci-dessous sans annuler arbitrairement les
choix des derniers commits.

Ce handoff distingue :

- les décisions validées avec l'utilisateur ;
- ce qui est déjà modifié dans le worktree ;
- les diagnostics encore exploratoires ;
- les prochaines actions recommandées.

## État Git et publication

- Branche : `main`.
- Commit fonctionnel publié : `eeb1da5f4725bdc0a236d3d7d377d03f308d111a`
  (`fix: stabilize undercity encounter flow`).
- Le workflow CI GitHub de ce commit a réussi : run `34167400468`, vérifié
  `completed / success` par Codex.
- La version publiée de ce handoff confirme la formule d'or validée ; son commit
  documentaire postérieur à `eeb1da5` est identifiable dans l'historique Git.
- Aucun déploiement n'a été autorisé ni lancé.

Fichiers modifiés au moment de l'arrêt :

- `docs/development/undercity-harness.md`
- `scripts/helpers/undercity-experiment.mjs`
- `scripts/helpers/undercity-groups.mjs`
- `shared/domain/undercity.ts`
- `src/domain/dungeonPresentation.ts`
- `src/domain/encounterPlayback.ts`
- `supabase/functions/game-api/dungeon-authority.ts`
- `tests/DungeonPanel.test.tsx`
- `tests/dungeonAuthority.test.ts`
- `tests/dungeonPresentation.test.ts`
- `tests/encounterPlayback.test.ts`
- `tests/helpers/heroXpTier1Campaign.ts`
- `tests/heroXpTier1Simulation.test.ts`
- `docs/development/session-2026-09-08-undercity-progression-calibration-handoff.md`

Le dossier temporaire `.audit/xp-669f722` et sa jonction `node_modules`,
créés pour comparer le jalon vert, ont été supprimés après autorisation
explicite. Leur absence a été vérifiée.

## Corrections réalisées et publiées dans `eeb1da5`

Ces corrections précèdent la calibration interrompue et doivent être
préservées :

1. La barre de PV ennemie suit désormais progressivement le transcript au lieu
   de passer immédiatement à zéro.
2. Le transcript ne duplique plus une attaque de monstre avec une deuxième
   ligne d'intention redondante.
3. L'échec d'une rencontre non-combat n'est plus interprété comme un wipe tant
   que des héros possèdent encore des PV.
4. Le bestiaire UnderCity a été renommé dans un registre plus naturel. Les
   anglicismes de fantasy courants sont autorisés : `Slime des égouts` et
   `Slime des eaux mortes` remplacent notamment les formulations « Gelée ».
   Les noms volontairement artificiels comme `Ratifère`,
   `Agrippe-vanne`, `Ravaude-chair` et `Trait royal` ont été remplacés.
5. La campagne T0/T1 compte maintenant séparément les choix explicites de
   vocation et les transitions automatiques. Elle exige que leur total couvre
   tous les héros et que chaque classe finale soit réellement T1.

Les noms ont été synchronisés dans le domaine partagé, le harness historique,
son fallback de groupes et la documentation.

## Décisions produit validées

### Progression idle

- CDIdle reste un idle game à courbes de progression fortes.
- La référence ressentie pour atteindre le niveau 40 est une médiane de
  **12 à 13 heures de temps simulé pur**.
- Ce temps comprend les rencontres, le transcript et la récupération idle du
  moteur. Aucun bonus offline supplémentaire n'est supposé.
- Le nombre d'explorations est une métrique secondaire : ne pas forcer
  aveuglément l'ancienne valeur d'environ 3 718 si la durée simulée réelle ne
  correspond pas.
- La progression doit ralentir légèrement au fil des niveaux, sans mur brutal.
- Les paliers de niveau et de qualité doivent produire des accélérations
  visibles et des grosses améliorations marquantes.

### Défis non-combat

- Cible globale : environ **66 % de réussite**.
- Les défis doivent devenir légèrement plus difficiles avec la progression.
- Un échec :
  - ne donne aucune XP ;
  - laisse avancer la salle ;
  - applique une pénalité légère cohérente avec le défi ;
  - ne doit jamais provoquer directement un KO.
- Direction validée pour les conséquences :
  - piège et embuscade : perte non létale de **5 % des PV actuels** ; le
    périmètre exact des héros touchés reste à confirmer pendant
    l'implémentation ;
  - obstacle : petite perte non létale de PV pour l'équipe ; sa valeur exacte
    reste à calibrer ;
  - énigme et rituel : perte de **10 % du mana actuel du héros sélectionné** ;
  - négociation : perte de **3 % de l'or actuel, plafonnée au gain de trois
    combats ordinaires du même étage**. Cette formule est validée : la perte
    doit être perceptible sans pouvoir ruiner le joueur. La valeur de 1 % a été
    rejetée comme trop faible.

### Équipement et profils de simulation

Le harness doit couvrir deux comportements :

1. **Optimisé** : examine et équipe chaque amélioration rentable.
2. **Moyen** : réévalue l'équipement au level-up, après un boss et lors d'un
   retour/reprise, sans micromanagement après chaque rencontre.

Le ressenti attendu est :

- améliorations fréquentes ;
- progression régulièrement perceptible ;
- gros écarts de palier ou de qualité franchement marquants ;
- une rareté très supérieure peut exceptionnellement doubler la contribution
  d'un emplacement si le gap est réellement important.

Ne pas calibrer uniquement le gain relatif moyen de chaque remplacement : ce
ratio baisse naturellement à mesure que l'équipement accumulé devient fort.
Conserver aussi la disponibilité immédiate, la croissance de puissance totale,
la distribution des raretés et les jackpots.

### UnderCity

- UnderCity remplace le donjon normal ; le donjon legacy n'est plus un parcours
  produit distinct à calibrer.
- Progression séquentielle jusqu'au Roi des Rats à l'étage 50.
- Après le Roi, le comportement simple retenu est de farmer automatiquement la
  dernière zone, la **Cour du Roi des Rats**.
- Les primes personnelles UnderCity doivent accélérer le leveling **et**
  apporter équipement et matériaux.
- Il n'y a pas de cible globale séparée pour cette accélération : les dix
  rencontres fixes doivent former des paliers visibles dans le parcours réel.

### Vocation Novice vers T1

Conserver la règle existante :

- une seule vocation clairement éligible déclenche automatiquement la
  transition ;
- plusieurs vocations proches proposent un choix au joueur ;
- la fenêtre d'affinité existante de 1 % est la règle à vérifier, pas à
  réinventer.

Sur la seed observée, trois héros ont effectué une transition automatique et un
héros a nécessité un choix. Le premier essai
`vocationChoices === finalClasses.length` était donc incorrect ; le compteur
a été corrigé pour additionner transitions automatiques et choix explicites.

## Diagnostics vérifiés

### Moteur T0/T1

Les fonctions centrales de level-up, de croissance et de transition n'ont pas
été modifiées par le dernier commit UnderCity. Les tests ciblés ont donné :

```text
7 fichiers réussis
198 tests réussis
```

Ils couvrent notamment XP multi-niveaux, vocation, équipement T1, persistance,
idle, donjon et migrations.

### Validation du sous-lot UnderCity publié

Après la rédaction initiale du handoff :

- les 5 suites ciblées de présentation, playback et autorité donjon passent :
  **51 tests réussis** ;
- `npm.cmd run typecheck` passe, contrôle de matrice du catalogue d'objets
  inclus ;
- `npm.cmd run test:undercity-product` passe sur **10 processus et 10 runs** :
  2 920 rencontres, 100 échantillons AoE multi-cibles, 10 wipes vérifiés,
  10 plafonds Roi des Rats, 10 boucles de farm, 30 récompenses d'objet
  ordinaires et 1 401 entrées de loot de farm.

Ces validations couvrent les correctifs locaux déjà réalisés. Elles ne rendent
pas vert le harness de progression T0/T1 décrit ci-dessous, qui demeure un
chantier de calibration distinct et explicitement différé.

### Comparaison de campagne legacy

Le harness `npm.cmd run test:xp-tier1` sur le jalon vert `669f722` passait :

- taux global des défis : 67,52 % ;
- médianes niveaux 10/20/30/35/40 :
  275 / 930 / 1 866 / 2 621 / 3 718 explorations.

Sur le code actuel, 100 runs ont tous produit leur rapport, mais l'agrégateur
échoue :

- taux global : 71,63 % ;
- bandes : 67,47 / 70,28 / 70,51 / 72,25 / 74,60 % ;
- médianes : 254 / 910 / 1 810 / 2 473 / 3 356 explorations ;
- les contrôles de gain relatif moyen des objets échouent dans 7 bandes sur 8.

Le run complet effectué après ajout des assertions T1 a atteint l'agrégation :
les assertions de transition n'ont donc pas cassé les shards. L'échec terminal
reste celui de calibration ci-dessus.

### Limite critique du harness actuel

`tests/helpers/heroXpTier1Campaign.ts` appelle directement
`resolveAuthoritativeDungeonEncounter` sans installer un
`currentEncounter.dungeonId === UNDERCITY_DUNGEON_ID`.

Conséquences :

- il simule encore le chemin legacy mono-ennemi ;
- il continue au-delà de l'étage 50, jusqu'aux étages 70–79 dans les runs
  observés ;
- il n'exerce ni les groupes UnderCity, ni les primes personnelles, ni le
  passage réel au farm de la Cour ;
- ses résultats actuels ne sont donc pas la preuve produit demandée.

La prochaine calibration doit d'abord corriger ce scénario. Ne pas retoucher
les ancres de difficulté à partir des seuls résultats legacy.

### Ancres et objets

Le commit `146e559` avait documenté une validation à 66,65 % et une médiane
de niveau 40 à 3 711 explorations avec le catalogue `level-bands-v1`.
Les documents du 4 septembre indiquent également une croissance forte de la
puissance équipée et des jackpots rares après le niveau 10.

Certaines ancres ont ensuite été légèrement modifiées, notamment les rituels,
mais aucune nouvelle valeur ne doit être appliquée avant la reconstruction du
harness UnderCity.

Le mode `XP_DIAGNOSTICS=1` a produit des cibles isotones exploratoires. Elles
ne sont **pas validées produit** et ne doivent pas être copiées directement :
certaines hausses seraient trop brutales.

## État actuel des pénalités dans le code

L'inspection a révélé que les pénalités existantes sont beaucoup plus fortes
que la direction maintenant validée :

- piège : jusqu'à 45 % des PV max pour les héros actifs ;
- embuscade/obstacle : jusqu'à 20 % des PV max ;
- énigme : 10 PM à chaque héros actif ;
- rituel : 15 PM et jusqu'à 10 % des PV ;
- négociation : seulement 20 or fixes.

Elles sont non létales grâce au plancher à 1 PV, mais elles doivent être
réalignées sur les décisions produit. Aucune de ces pénalités n'a encore été
modifiée dans cette session.

## Recherche externe retenue

Les références consultées confortent une progression idle faite de croissance
forte et de paliers multiplicatifs, plutôt qu'une courbe parfaitement lisse :

- Kongregate, *The Math of Idle Games, Part I* :
  https://blog.kongregate.com/the-math-of-idle-games-part-i
- Kongregate, *The Math of Idle Games, Part III* :
  https://blog.kongregate.com/the-math-of-idle-games-part-iii/
- GDC Europe 2016, Anthony Pecorella, *Quest for Progress* :
  https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf
- Documentation officielle Idle Game Maker d'Orteil :
  https://orteil.dashnet.org/experiments/idlegamemaker/help

Le point directement applicable au harness est de distinguer l'optimisation
théorique du comportement humain moyen. Les gros multiplicateurs de palier
doivent redonner temporairement de l'avance sur la courbe de coût.

## Ordre recommandé pour demain

1. Relire ce handoff et contrôler `git status --short`.
2. Préserver l'ensemble des quatorze chemins listés ci-dessus et vérifier
   qu'aucun processus de test ancien ne tourne encore.
3. Faire passer la campagne principale par l'autorité UnderCity réelle :
   démarrage/résolution avec `applyDungeonCommand`, progression jusqu'à 50,
   puis `dungeon.select_farm_zone` sur `court`.
4. Ajouter les deux stratégies d'équipement, optimisée et moyenne, sans copier
   le moteur métier dans le test.
5. Ajouter au rapport les temps médians par profil et les paliers personnels
   UnderCity.
6. Implémenter les conséquences non-combat validées, avec tests déterministes
   par type. Vérifier explicitement : aucune XP en échec, progression de salle,
   absence de KO, perte d'or bornée.
7. Lancer une petite passe de 1 à 3 seeds par profil pour corriger le scénario,
   puis seulement la campagne complète.
8. Comparer les deux profils à la cible de 12–13 heures et au taux de réussite
   d'environ 66 %, légèrement décroissant avec les niveaux.
9. Si un écart subsiste, effectuer des ablations ciblées sur les primes
   personnelles, le loot, les groupes et les ancres. Corriger la cause minimale
   démontrée ; ne pas simplement élargir les tolérances.
10. Réévaluer les contrôles objets sur les deux profils. Ne supprimer ni
    amplifier la courbe de puissance sur la seule base du harness legacy rouge.
11. Mettre à jour les documents de progression avec les résultats réellement
    obtenus.
12. Exécuter les tests ciblés, typecheck/lint utiles, puis
    `npm.cmd run test:xp-tier1`.
13. Faire l'audit fonctionnel pré-push avant toute demande de commit/push.

## Commandes connues

```powershell
npm.cmd test -- tests/utils.test.ts tests/heroXpModel.test.ts tests/townAuthority.test.ts tests/idleAuthority.test.ts tests/authoritativeDungeonGolden.test.ts tests/classAffinitySimulation.test.ts tests/tier1ClassEquipment.test.ts tests/stateMigrations.test.ts
npm.cmd run test:xp-tier1:shard
npm.cmd run test:xp-tier1
npm.cmd run test:undercity-product
```

Pour une passe exploratoire courte :

```powershell
$env:XP_SEED_COUNT = '1'
$env:XP_SEED_OFFSET = '0'
npm.cmd run test:xp-tier1:shard
Remove-Item Env:XP_SEED_COUNT
Remove-Item Env:XP_SEED_OFFSET
```

## Interdits de reprise

- Ne pas appliquer directement les tables isotones du diagnostic legacy.
- Ne pas déclarer le harness vert en relâchant seulement ses seuils.
- Ne pas recalibrer le donjon legacy comme s'il restait le produit courant.
- Ne pas supprimer les correctifs locaux antérieurs.
- Ne pas ouvrir de navigateur sans autorisation explicite.
- Ne pas commit/push sans confirmation explicite immédiate.

## Reprise exécutée le 8 septembre 2026

Le plan ci-dessus a été appliqué sans restaurer le chemin legacy :

- la campagne passe par `applyDungeonCommand`, termine les cinquante étages,
  sélectionne la Cour et la farme jusqu'au niveau 40 ;
- les profils d'équipement optimisé et moyen sont tous deux mesurés ;
- le temps partage la constante runtime d'auto-exploration de `4 750 ms` et
  sépare rencontres et récupération ;
- les pénalités d'échec sont centralisées : 5 % des PV actuels pour piège et
  embuscade, 3 % pour obstacle, 10 % du mana actuel du héros sélectionné pour
  énigme et rituel, 3 % de l'or plafonné à trois combats ordinaires pour
  négociation ; toutes restent non létales et ne donnent aucune XP ;
- la difficulté `undercity-two-profiles-v3` conserve les ancres validées et
  ajoute en farm `2` points par niveau du groupe au-dessus du niveau 20, après
  un décalage global de `+1`.

La passe complète vérifiée sur 100 seeds par profil termine 200/200 campagnes.
Les médianes niveau 40 sont `12,60 h` (optimisé) et `12,65 h` (moyen), avec une
médiane commune de `4 235` explorations et trois boucles de Cour. Les intervalles
P10–P90 sont respectivement `11,91–13,71 h` et `12,01–13,67 h`. Le taux global
des défis est `66,10 %`; les bandes 1–9, 10–19, 20–29, 30–34 et 35–40 donnent
`63,96 / 70,83 / 74,05 / 72,40 / 58,69 %`. Tous les contrôles agrégés de
campagne, défis et objets passent.

Le runner conserve désormais chaque résultat sous
`test-results/xp-tier1/<horodatage>.json` et actualise `latest.json`, y compris
avant un échec de seuil ou lorsqu'un shard échoue. Le timeout propre à la
campagne est porté de 60 à 120 minutes.
