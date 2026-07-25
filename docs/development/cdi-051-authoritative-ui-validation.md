# Validation de l’interface autoritaire — CDI-051

## Objet

Ce document conserve les preuves, écarts et validations manuelles de
l’intégration UI vers les commandes autoritaires. Il constitue une
documentation de suivi durable et non un handoff de session.

## État

- L’intégration principale CDI-051 est publiée dans `f47993e`.
- La régression de création des novices est tracée dans `e0fe83e`.
- CDI-051 est en `Paused`.
- CDI-053 a restauré puis validé la génération autoritaire complète des novices.

## Corrections réalisées

- Exécuteur `/commands` typé, sérialisé et basé sur la révision canonique.
- Réponse serveur appliquée à l’interface puis au cache IndexedDB.
- Conflit `409` suivi d’un rechargement `/bootstrap` immédiat avant la
  prochaine commande.
- Erreurs métier `400` distinguées d’une indisponibilité serveur.
- Bâtiments et citoyens raccordés aux commandes autoritaires. Les districts
  sont retirés de l'interface et refusés par l'API jusqu'à leur refonte.
- Forge locale inaccessible supprimée des handlers actifs.
- Timers locaux de ressources, immigration, récupération et combat neutralisés.
- Progression active de Ville rafraîchie par bootstrap autoritaire toutes les
  trente secondes, sans calcul gameplay local.
- Rapport idle significatif présenté au retour.
- Auto-donjon : le client déclenche les commandes, le serveur produit seul les
  mutations canoniques.
- Sauvegarde manuelle reformulée en actualisation canonique `/bootstrap`.
- Reset local effectué uniquement après le succès serveur.
- Registre de commandes dédupliqué et protégé par un test.
- Cheats protégés par `GAME_API_ENABLE_CHEATS=true`, désactivés par défaut.
- Exemple d’environnement ajouté :
  `supabase/functions/.env.example`.

## Preuves automatisées obtenues

Preuves utilisateur :

- Tests ciblés : 6 fichiers, 35 tests, tous réussis.
- Suite complète : 18 fichiers, 119 tests, tous réussis.
- Build Vite production : réussi.

Preuves Codex :

- `npm.cmd run typecheck` : réussi.
- `npm.cmd run check:determinism` : réussi.
- `npm.cmd run board:validate` : 52 tickets, 0 erreur.
- `git diff --check` : aucune erreur, uniquement avertissements CRLF.
- ESLint : 0 erreur ; avertissements historiques encore présents.
- Audit statique : les handlers UI actifs passent par
  `dispatchAuthoritativeCommand`; les setters canoniques actifs servent à
  appliquer une réponse serveur ou le cache hors ligne.

Le warning Vitest sur plusieurs `GoTrueClient` reste un warning connu du test,
pas un échec.

## Rectification Ville CDI-057

L'audit du 2026-07-25 a trouvé un contournement `unassigned`, l'absence des
prérequis d'étage côté serveur et des districts historiquement incohérents.
CDI-057 corrige les invariants et les étages, désactive entièrement les
districts, corrige le libellé du Campement et prune les handlers Ville locaux.
CDI-051 reste bloqué jusqu'à la validation navigateur de cette correction.

## Preuves navigateur obtenues

Preuves rapportées par l’utilisateur :

- bannière hors ligne absente avec le backend disponible ;
- amélioration d’un bâtiment via `/game-api/commands` : HTTP 200 ;
- révision canonique relevée à 11, puis niveau et ressources conservés après
  `F5` ;
- activation ou désactivation d’un héros via `/game-api/commands` : HTTP 200 ;
- révision canonique relevée à 12, puis état actif/inactif conservé après
  `F5`.
- activation de Ragnor puis `dungeon.explore` : rencontre active persistée en
  révision 19 ;
- l'ancien flux affichait une carte explicite et un bouton
  « Résoudre la rencontre » ; cette preuve historique a déclenché son
  remplacement par une résolution transparente ;
- `dungeon.resolve` : 200, révision 20, victoire en trois tours, cinq
  événements de transcript restitués dans le journal, +6 or et passage à la
  salle 2 ;
- après `F5`, bootstrap révision 20 : salle 2, 131 or, Ragnor à 100 PV,
  rencontre nulle et aucune bannière hors connexion.

## Résolution transparente et registre persistant

Évolution confirmée puis implémentée le 24 juillet 2026 :

- `Explorer la salle` exécute `dungeon.explore`, puis `dungeon.resolve` sans
  second clic et sans bouton de résolution ;
- le transcript retourné par le serveur apparaît ligne par ligne avec un
  intervalle de 400 ms ;
- le verdict et la récompense restent masqués jusqu'à la fin de la lecture ;
- l'exploration manuelle et l'auto-donjon attendent la fin de cette lecture ;
- une rencontre active retrouvée au bootstrap reprend automatiquement ;
- `encounterHistory` conserve côté serveur les 15 derniers combats, leurs
  transcripts et leurs récompenses ; l'historique est donc disponible après
  `F5` et sur un autre appareil ;
- le nom du héros est conservé dans chaque événement afin que les anciens
  combats restent lisibles après un renvoi ;
- le reset attend désormais le succès de `/reset` avant de modifier l'interface
  et le cache.

Preuves Codex :

- `npm.cmd run typecheck` : réussi ;
- tests ciblés autorité/contrats/ville/API : 4 fichiers, 31 tests, réussis ;
- test du registre UI progressif et de l'absence de bouton `Résoudre` :
  1 fichier, 1 test, réussi.

La preuve navigateur de ce nouveau flux reste nécessaire.

## Blocage CDI-054 — parite du moteur de donjon

Le test navigateur du registre avait révélé que le transcript serveur ne
contenait que `hero.hit` et `enemy.hit`. CDI-054 restaure désormais dans
l'unique moteur autoritaire les rencontres pondérées, monstres, boss,
compétences, mana, cooldowns, critiques, multi-frappes, esquives, défenses,
récompenses, XP et progression caractérisés depuis `640f89f`.

CDI-051 ne peut pas etre clos avec un transcript anime mais fonctionnellement
incomplet. La reprise depend de CDI-054 et de :

`docs/architecture/authoritative-dungeon-parity-audit.md`.

Durcissement CDI-054 du 25 juillet :

- validation canonique imbriquée de chaque héros avant chargement ou commande ;
- rejet `INVALID_GAME_STATE` au lieu de statistiques de combat implicites ;
- suppression de `currentMonster`, `currentEncounterType`, `combatTimer` et des
  anciennes cartes de résolution locale dans `DungeonPanel` ;
- golden tests renforcés sur les mutations exactes des six épreuves, le soin
  de groupe et la limite atomique de 100 rounds.

## Validations navigateur restantes

Après correction de CDI-053, continuer avec une mutation par domaine :

- héros : activité, équipement ou recrutement ;
- inventaire : équipement ou recyclage ;
- forge : démarrage puis finalisation/annulation ;
- donjon : valider le nouveau clic unique, la lecture progressive, l'absence de
  bouton de résolution, le blocage pendant la lecture, l'auto-donjon et la
  persistance de l'historique après `F5` ;
- conflit `409` : vérifier le rechargement canonique ;
- offline/online : aucune mutation hors ligne, cache visible, reprise après
  reconnexion ;
- reset : vérifier qu’un échec serveur ne réinitialise rien localement.

Après ces preuves :

1. faire l’audit pré-push final ;
2. mettre à jour la matrice UI → commande et le ticket `CDI-051` ;
3. décider si les critères permettent le passage à `Done` ;
4. fournir les commandes Git à l’utilisateur, sans commit/push par Codex.

## Points encore non prouvés

- Persistance navigateur réelle de chaque domaine après `F5`.
- Comportement navigateur du conflit `409`.
- Parcours offline/online complet.
- Préservation visuelle du parcours onboarding et du transcript de donjon.
- Nouveau flux visuel du donjon et historique canonique après `F5`.

## Régression CDI-053 observée le 24 juillet 2026

Preuve utilisateur pendant la validation navigateur :

- à la création des héros, le profil affiché n’est pas conservé : équipement,
  statistiques, statut élite et compétences ;
- conséquence : les nouveaux héros arrivent avec un profil plat et le coffre
  reste vide, ce qui bloque aussi la validation manuelle du parcours inventaire ;
- cause confirmée : les cinq candidats étaient générés localement puis
  `onboarding.start` reconstruisait deux héros différents côté serveur ;
- statut : **bloquant CDI-051** ;
- clôture attendue dans CDI-053 : générer et persister l’offre complète côté
  serveur, promouvoir deux IDs offerts, recréer un compte ou réinitialiser une
  partie, puis vérifier le profil complet et sa persistance après `F5` ;
- CDI-053 a corrigé la génération des novices ; CDI-054, séparé, restaure le
  moteur de donjon autoritaire et bloque toujours la clôture de CDI-051.

L’audit fonctionnel CDI-053 a identifié puis fait corriger les écarts suivants :

- `hero.recruit_offer` et `hero.recruit` utilisent désormais le même
  générateur complet que l’onboarding ;
- `calculatedStats` est persisté et fournit les maxima nécessaires à
  l’autorité idle ;
- `xpNeeded` vaut 100 pour un novice de niveau 1 ;
- les tests couvrent la parité client/serveur de 256 profils, les équipements,
  les passifs, le bouclier, la récupération idle et les deux recrutements.

Les validations automatisées ciblées sont vertes. La suite complète et le build
après correction élite sont également verts, preuve rapportée par l’utilisateur
le 24 juillet 2026. La validation navigateur reste la dernière preuve avant
clôture de CDI-053.

## Décision d’audit sur les novices élites

- La première implémentation serveur utilisait un Fisher-Yates uniforme pour
  choisir les deux statistiques fortes d’un novice élite.
- L’historique utilisait `sort(() => rng.next() - 0.5)`. Cette distribution,
  bien que biaisée, fait partie du comportement existant à préserver.
- CDI-053 restaure l’algorithme historique et ajoute une preuve explicite sur
  une graine élite connue : statut élite, exactement deux statistiques entre
  8 et 10, total valide et replay déterministe.
- Les tests comparent désormais champ par champ le candidat et le héros créé
  pour l’onboarding, l’offre de guilde et le recrutement direct.
- La disparition du message de log spécifique après un recrutement normal ou
  élite est acceptée comme non bloquante et ne sera pas corrigée dans CDI-053.

## Calcul global des statistiques secondaires

La validation navigateur CDI-053 a découvert un écart supplémentaire :
`hero.equip` et `hero.unequip` modifiaient bien l'équipement canonique, mais
laissaient `calculatedStats` inchangé côté serveur. Le rechargement client
recalculait visuellement les valeurs via `getHeroStats`, ce qui masquait un
état canonique périmé, notamment dangereux pour les maxima PV/PM utilisés par
l'autorité idle.

La correction conserve la fonction globale historique :

- le noyau pur de calcul est extrait dans `shared/domain/hero-stats.ts` ;
- `getHeroStats` reste l'adaptateur global côté client ;
- la génération et les mutations d'équipement novices utilisent exactement le
  même noyau côté serveur ;
- aucun second jeu de formules de statistiques secondaires n'est maintenu ;
- les tests comparent le calcul serveur au résultat de
  `refreshHeroDerivedStats` et couvrent déséquipement puis rééquipement.

Preuve intermédiaire navigateur du 24 juillet 2026 :

- offre de cinq candidats : 200, révision 14 ;
- création de Ragnor et Beatrix : 200, révision 15, profils complets identiques ;
- `F5` puis bootstrap : 200, révision 15, profils et équipements inchangés ;
- déséquipement de la dague de Ragnor : 200, révision 16, objet visible dans le
  coffre ;
- après redémarrage de la fonction locale corrigée, rééquipement de la dague :
  révision 17 ;
- bootstrap final : 200, révision 17, `quick_dagger` persistée sur Ragnor,
  absente du coffre et `calculatedStats.criticalChance` égal à 4.9.

## Validation à ajouter pour la vocation T1

Faire évoluer trois Novices avec des bâtiments permettant de forcer une classe
ordinaire, Mage et Acolyte. Pour chaque réponse `/commands`, puis après `F5` :

- vérifier que l’actif Novice a disparu et que son passif est conservé ;
- classe ordinaire : un actif et un passif de classe ;
- Mage : deux sorts élémentaires distincts et un passif Mage ;
- Acolyte : `minor_heal`, un autre actif et un passif Acolyte ;
- vérifier la révision, les PV/PM restaurés, les cooldowns vides et la
  persistance exacte après bootstrap.

## Validation CDI-054 observée le 25 juillet 2026

Preuve utilisateur sur l'environnement Supabase local :

- bootstrap 200, révision 31, RNG canonique à deux tirages ;
- combat Gobelin : résolution automatique, transcript progressif complet,
  révision 33 et RNG à trois tirages ;
- après `F5`, révision, RNG, état et historique strictement identiques ;
- replay exact : 200, `replayed: true`, aucune récompense ni rencontre
  dupliquée ;
- rencontre `trap` : résolution automatique, révision 35 et RNG à quatre
  tirages ;
- fixture locale : Ragnor passe Novice niveau 9 à Guerrier niveau 10 ;
- actif `weakening_shout`, passif Novice `survival_instinct` conservé,
  passif Guerrier `weapon_training`, cooldowns vides et PV/PM restaurés ;
- après `F5`, profil, transcript et RNG (`draws: 5`,
  `state: 2640898453`) restent identiques.

Les cas particuliers Mage et Acolyte sont couverts par les tests
déterministes. Leur reproduction navigateur reste une validation UI de
CDI-051, pas un blocage du moteur CDI-054.

## Raccordement Ville CDI-057

- Les améliorations et affectations écrivent leurs événements canoniques dans
  le journal Ville.
- La progression active est relue par bootstrap toutes les trente secondes
  uniquement lorsqu'une production, une immigration ou une récupération peut
  modifier le snapshot.
- La fin de récupération replace le héros en `idle` et produit un résumé
  distinct des soins partiels.
- La réinitialisation applique directement le snapshot et la révision renvoyés
  par `/reset`; aucune reconstruction locale de la partie n'est effectuée.
- Restent à observer dans le navigateur : révision et persistance après une
  commande Ville, heartbeat actif, immigration ou récupération, puis `F5`.

Preuve locale obtenue le 2026-07-25 : bâtiment et citoyens en 200 avec
révisions 44/45, persistance après `F5`, heartbeat en 200 révision 51 sans saut
de ressource, immigration animée et réconciliée, récupération PV/PM animée à
2 % des maxima puis `idle`, journal présent et contrôles District absents.
Le reset destructif a également répondu 200, augmenté la révision, restauré
l'état initial complet sans déconnecter Google et persisté ce résultat après
`F5`.
Le retour en haut après reset et la restauration de l'onglet actif après `F5`
ont aussi été confirmés dans le navigateur local.
