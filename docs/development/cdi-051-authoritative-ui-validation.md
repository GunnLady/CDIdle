# Validation de l’interface autoritaire — CDI-051

## Objet

Ce document conserve les preuves, écarts et validations manuelles de
l’intégration UI vers les commandes autoritaires. Il constitue une
documentation de suivi durable et non un handoff de session.

## État

- L’intégration principale CDI-051 est publiée dans `f47993e`.
- La régression de création des novices est tracée dans `e0fe83e`.
- CDI-051 est en `Paused`, bloqué par CDI-053.
- CDI-053 restaure la génération autoritaire complète des novices.

## Corrections réalisées

- Exécuteur `/commands` typé, sérialisé et basé sur la révision canonique.
- Réponse serveur appliquée à l’interface puis au cache IndexedDB.
- Conflit `409` suivi d’un rechargement `/bootstrap` immédiat avant la
  prochaine commande.
- Erreurs métier `400` distinguées d’une indisponibilité serveur.
- Ville, héros, inventaire, forge, donjon, recrutement, onboarding et cheats
  raccordés aux commandes autoritaires.
- Forge locale inaccessible supprimée des handlers actifs.
- Timers locaux de ressources, immigration, récupération et combat neutralisés.
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

## Preuves navigateur obtenues

Preuves rapportées par l’utilisateur :

- bannière hors ligne absente avec le backend disponible ;
- amélioration d’un bâtiment via `/game-api/commands` : HTTP 200 ;
- révision canonique relevée à 11, puis niveau et ressources conservés après
  `F5` ;
- activation ou désactivation d’un héros via `/game-api/commands` : HTTP 200 ;
- révision canonique relevée à 12, puis état actif/inactif conservé après
  `F5`.

## Validations navigateur restantes

Après résolution de CDI-053, continuer avec une mutation par domaine :

- héros : activité, équipement ou recrutement ;
- inventaire : équipement ou recyclage ;
- forge : démarrage puis finalisation/annulation ;
- donjon : sélection d’étage, exploration, résolution et auto-donjon ;
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
- Validation complète de la création des novices après CDI-053.

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
- aucun CDI-054 séparé : ce périmètre est regroupé dans CDI-053.

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
