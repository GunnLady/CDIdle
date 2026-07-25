---
id: CDI-054
title: Parite deterministe du moteur de donjon autoritaire
status: Done
area: vertical
priority: P1
size: L
risk: high
source: Audit de parite combat historique/backend du 2026-07-24
depends_on: ["CDI-015", "CDI-029", "CDI-050", "CDI-052"]
blocks: ["CDI-051", "CDI-046", "CDI-048", "CDI-049", "CDI-058"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/authoritative-dungeon-parity-audit.md", "docs/architecture/api-command-contracts.md", "docs/architecture/clock-rng.md", "docs/architecture/game-api-followups.md", "supabase/functions/game-api/dungeon-authority.ts", "src/hooks/useDungeonSystem.ts"]
---

# CDI-054 — Parite deterministe du moteur de donjon autoritaire

## Objectif

Restaurer dans un unique moteur autoritaire les regles du dernier donjon
fonctionnel trace par `640f89f`, sans maintenir une seconde implementation
historique executable.

## Resultat utilisateur

Une exploration autoritaire reproduit les comportements caracterises, les
mutations et l ordre des rolls attendus. Le client ne calcule plus le combat et
ne lit que le transcript canonique persiste.

## Contexte

L audit du 2026-07-24 compare la reference Git `640f89f`, derniere version
active avant le raccordement autoritaire, a la resolution simplifiee alors
presente dans le backend. Le commit
`f47993e` a neutralise le timer local sans porter le moteur historique cote
serveur.

La resolution simplifiee a ete remplacee le 25 juillet 2026 par
`src/domain/authoritativeDungeon.ts`. Le commit `640f89f` reste une trace Git,
et `tests/authoritativeDungeonGolden.test.ts` fige les comportements retenus.
Le donjon consomme exclusivement les `calculatedStats` persistees ; les
recalculs de statistiques appartiennent au domaine heros lors du level-up.

L audit complet, les anciens messages de log et le registre exact des rolls
sont conserves dans
`docs/architecture/authoritative-dungeon-parity-audit.md`.

## Perimetre autorise

- Maintenir un unique moteur de donjon pur partage par le backend.
- Injecter un unique contrat `Rng` dans chaque branche aleatoire.
- Preserver l ordre des catalogues, formules, seuils et appels RNG.
- Porter la selection ponderee des encounters et le cas force des boss.
- Porter monstres, boss, scaling, armes, types de degats et resistances.
- Porter competences, mana, cooldowns, buffs, debuffs et soins.
- Porter critiques, vitesse, multi-frappes, ciblage, esquive et mort.
- Porter or, materiaux, objets, XP, niveaux, croissance et classe.
- Restaurer les competences lors du passage T0 vers T1 avec les particularites
  Mage et Acolyte.
- Produire un transcript exhaustif, type et persistable.
- Caracteriser les comportements traces par `640f89f` avec des bandes RNG.
- Refuser un heros canonique incomplet au lieu d inventer des statistiques.
- Integrer l etat RNG canonique livre par CDI-050.
- Conserver la presentation progressive CDI-051 comme simple lecteur du
  transcript serveur.

## Hors perimetre

- Reequilibrer les probabilites, couts, degats ou recompenses.
- Corriger les comportements historiques juges surprenants sans ticket separe.
- Rejouer exactement les combats historiques deja executes : `Math.random`
  n etait ni seede, ni persiste, ni journalise.
- Permettre au client de calculer ou valider le resultat canonique.

## Contrat d'implementation

- Meme etat initial + meme bande RNG = meme etat final et meme transcript.
- Chaque roll historique est consomme au meme emplacement et dans le meme
  ordre, y compris la consommation historique liee a l ID visuel du monstre
  tant qu une decision explicite ne la remplace pas.
- Un replay idempotent ne consomme aucun roll supplementaire.
- Une commande rejetee ou en conflit ne fait pas avancer le RNG.
- La resolution, le transcript, les recompenses, la progression et le nouvel
  etat RNG sont committes atomiquement.
- Les poids historiques restent inchanges. Leur total vaut 149 et le poids
  `fight: 85` correspond donc a environ 57,05 % des encounters ordinaires.
- Le transcript contient les informations necessaires pour reconstruire les
  anciens logs sans recalcul client.
- Le client ne fait qu ordonner et temporiser les evenements signes.
- La validation canonique verifie chaque heros, ses statistiques de base, ses
  statistiques calculees, ses PV/PM, competences et cooldowns.
- Le moteur ne contient aucun fallback de statistique de combat.
- Une vocation retire l actif Novice, conserve son passif et reinitialise les
  cooldowns. Les autres classes tirent un actif et un passif ; le Mage tire
  deux sorts elementaires distincts et un passif ; l Acolyte recoit
  `minor_heal`, puis tire un autre actif et un passif.

## Dependances

- CDI-015 — contrat du moteur de combat et transcript.
- CDI-029 — tranche verticale donjon autoritaire a corriger.
- CDI-050 — persistance et avancement atomique du RNG.
- CDI-052 — contrat canonique partage et versionne.

## Criteres d'acceptation

- [x] Un unique moteur autoritaire pur porte les regles caracterisees.
- [x] Tous les `Math.random` du parcours sont remplaces par le meme `Rng`
      injecte sans modifier l ordre des rolls.
- [x] Encounter, monstre, boss et scaling correspondent aux fixtures.
- [x] Ordre des tours, competences, mana et cooldowns sont portes.
- [x] Armes, types de degats, defenses et resistances sont portes.
- [x] Critiques, multi-frappes, ciblage, esquives et morts sont portes.
- [x] Or, materiaux, objets, XP, niveaux et classes sont portes.
- [x] Les competences T1 sont attribuees deterministement, avec les regles
      Mage/Acolyte et la conservation du passif Novice.
- [x] Les encounters non-combat necessaires a la parite du roll initial sont
      portes avec leurs mutations historiques.
- [x] Le transcript restitue les messages utiles et leurs donnees.
- [x] Des golden tests comparent etat, transcript et nombre exact de rolls.
- [x] Les heros incomplets sont rejetes avant resolution et aucun fallback de
      statistique n est applique.
- [x] Les anciens chemins `currentMonster`, `currentEncounterType` et
      `combatTimer` sont retires du panneau et du hook client.
- [x] Les memes graines et commandes reproduisent le meme resultat apres
      bootstrap, replay et reconnexion.
- [x] Le backend ne depend plus du moteur React pour une regle canonique.
- [x] Le parcours navigateur confirme le deroule progressif complet apres F5.

## Tests

- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/dungeonAuthority.test.ts`
- `npm.cmd test -- --run tests/authoritativeDungeonGolden.test.ts tests/authoritativeContracts.test.ts tests/dungeonAuthority.test.ts tests/townAuthority.test.ts`
- `npm.cmd test -- --run tests/utils.test.ts tests/catalogValidation.test.ts tests/authoritativeDungeonGolden.test.ts`
- tests de caracterisation avec bande RNG scriptable
- tests de replay, conflit, bootstrap et avancement atomique du RNG
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec une session authentifiee et une partie connue :

1. lancer une exploration avec une graine connue ;
2. verifier encounter, monstre, boss eventuel et ordre des tours ;
3. verifier competences, critiques, esquives, PV/PM et cooldowns ;
4. verifier XP, niveaux, or, objets et materiaux ;
5. verifier chaque ligne du transcript progressif ;
6. recharger puis comparer etat et historique ;
7. reinitialiser le meme compte de test ou injecter une fixture controlee,
   puis rejouer les memes commandes et comparer integralement. Deux comptes
   distincts ne partagent pas une graine, car elle est derivee du `userId`.

## Validation finale du 2026-07-25

Preuves utilisateur sur Supabase local avec session Google authentifiee :

- bootstrap 200 revision 31, RNG `draws: 2` ;
- combat Gobelin resolu automatiquement, transcript progressif complet,
  revision 33, RNG `draws: 3`, puis etat identique apres `F5` ;
- replay exact de la commande : 200, `replayed: true`, revision 33, aucune
  mutation ni duplication ;
- rencontre `trap` resolue automatiquement, revision 35, RNG `draws: 4` ;
- fixture locale de vocation : Ragnor Novice niveau 9 evolue Guerrier niveau
  10 avec `weakening_shout`, conservation de `survival_instinct`, ajout de
  `weapon_training`, cooldowns vides et PV/PM au maximum ;
- apres `F5`, RNG identique (`draws: 5`, `state: 2640898453`), profil et
  transcript de vocation persistants ;
- fonction Edge demarree reellement apres correction de tous les imports
  relatifs du graphe Deno.

Preuves automatisees rapportees vertes par l utilisateur :

- typecheck, tests cibles et suite complete ;
- garde de determinisme ;
- build de production ;
- validation Workboard.

## Preservation

- Conserver les catalogues et leur ordre historique.
- Conserver les formules et probabilites, meme lorsqu elles semblent
  involontaires.
- Conserver l autorite serveur, revision, idempotence et protection offline.
- Conserver l historique canonique limite aux 15 derniers encounters resolus.

## Risques

- Un seul roll ajoute, retire ou deplace decale toutes les resolutions.
- Une copie executable de la reference creerait une seconde source de verite.
- Les anciens helpers ont des valeurs par defaut `systemRng` dangereuses pour
  le backend si l injection n est pas imposee.
- Les donnees de catalogue client doivent etre partagees sans import runtime
  React dans l Edge Function.
- Les heros deja T1 dans une sauvegarde existante ne sont pas rerolles
  silencieusement. Une migration ulterieure, si elle est necessaire, devra etre
  versionnee et definir explicitement sa consommation du RNG canonique.
- La migration du schema doit rester compatible avec les sauvegardes actuelles.

## Handoff

Fournir :

- matrice des comportements caracterises mise a jour ;
- bande RNG et nombre de rolls consommes par scenario ;
- golden fixtures des encounters ordinaires et boss ;
- transcripts complets incluant succes, echec, critique, esquive, competence,
  mort, loot et progression ;
- preuve de replay et de persistance RNG ;
- preuve navigateur de la presentation progressive ;
- liste explicite des comportements historiques conserves volontairement.
