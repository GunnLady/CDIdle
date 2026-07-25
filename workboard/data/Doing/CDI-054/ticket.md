---
id: CDI-054
title: Parite deterministe du moteur de donjon autoritaire
status: Doing
area: vertical
priority: P1
size: L
risk: high
source: Audit de parite combat historique/backend du 2026-07-24
depends_on: ["CDI-015", "CDI-029", "CDI-050", "CDI-052"]
blocks: ["CDI-051", "CDI-046", "CDI-048", "CDI-049"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/authoritative-dungeon-parity-audit.md", "docs/architecture/api-command-contracts.md", "docs/architecture/clock-rng.md", "docs/architecture/game-api-followups.md", "supabase/functions/game-api/dungeon-authority.ts", "src/hooks/useDungeonSystem.ts"]
---

# CDI-054 — Parite deterministe du moteur de donjon autoritaire

## Objectif

Remplacer le moteur de donjon serveur simplifie par un port autoritaire du
dernier moteur historique actif, sans modifier ses regles, ses probabilites,
ses formules ni l ordre de consommation des rolls.

## Resultat utilisateur

Une exploration autoritaire produit le meme encounter, le meme deroule de
combat, les memes mutations et le meme transcript que le moteur historique
lorsqu elle recoit le meme etat initial et la meme sequence RNG.

## Contexte

L audit du 2026-07-24 compare la reference Git `640f89f`, derniere version
active avant le raccordement autoritaire, au backend actuel. Le commit
`f47993e` a neutralise le timer local sans porter le moteur historique cote
serveur.

Le backend actuel ne resout que des combats generiques avec deux evenements,
`hero.hit` et `enemy.hit`. Il ne reproduit pas les encounters ponderes, les
catalogues de monstres et boss, les armes, competences, critiques, esquives,
multi-frappes, defenses, resistances, recompenses, XP ou progressions de
classe. La divergence RNG commence au premier roll.

L audit complet, les anciens messages de log et le registre exact des rolls
sont conserves dans
`docs/architecture/authoritative-dungeon-parity-audit.md`.

## Perimetre autorise

- Extraire le moteur historique de `640f89f` dans un domaine pur partage.
- Injecter un unique contrat `Rng` dans chaque branche aleatoire.
- Preserver l ordre des catalogues, formules, seuils et appels RNG.
- Porter la selection ponderee des encounters et le cas force des boss.
- Porter monstres, boss, scaling, armes, types de degats et resistances.
- Porter competences, mana, cooldowns, buffs, debuffs et soins.
- Porter critiques, vitesse, multi-frappes, ciblage, esquive et mort.
- Porter or, materiaux, objets, XP, niveaux, croissance et classe.
- Produire un transcript exhaustif, type et persistable.
- Comparer moteur de reference et backend avec la meme bande RNG.
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

## Dependances

- CDI-015 — contrat du moteur de combat et transcript.
- CDI-029 — tranche verticale donjon autoritaire a corriger.
- CDI-050 — persistance et avancement atomique du RNG.
- CDI-052 — contrat canonique partage et versionne.

## Criteres d'acceptation

- [ ] Le moteur historique est fige sous forme de reference pure testable.
- [ ] Tous les `Math.random` du parcours sont remplaces par le meme `Rng`
      injecte sans modifier l ordre des rolls.
- [ ] Encounter, monstre, boss et scaling correspondent a la reference.
- [ ] Ordre des tours, competences, mana et cooldowns correspondent.
- [ ] Armes, types de degats, defenses et resistances correspondent.
- [ ] Critiques, multi-frappes, ciblage, esquives et morts correspondent.
- [ ] Or, materiaux, objets, XP, niveaux et classes correspondent.
- [ ] Les encounters non-combat necessaires a la parite du roll initial sont
      portes avec leurs mutations historiques.
- [ ] Le transcript restitue tous les anciens messages utiles et leurs donnees.
- [ ] Des golden tests comparent etat, transcript et nombre exact de rolls.
- [ ] Les memes graines et commandes reproduisent le meme resultat apres
      bootstrap, replay et reconnexion.
- [ ] Le backend ne depend plus du moteur React pour une regle canonique.
- [ ] Le parcours navigateur confirme le deroule progressif complet apres F5.

## Tests

- `npm.cmd run check:determinism`
- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/dungeonAuthority.test.ts`
- tests de caracterisation reference/backend avec bande RNG scriptable
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
7. rejouer la meme graine sur une seconde partie et comparer integralement.

## Preservation

- Conserver les catalogues et leur ordre historique.
- Conserver les formules et probabilites, meme lorsqu elles semblent
  involontaires.
- Conserver l autorite serveur, revision, idempotence et protection offline.
- Conserver l historique canonique limite aux 15 derniers encounters resolus.

## Risques

- Un seul roll ajoute, retire ou deplace decale toutes les resolutions.
- Une copie partielle des formules creerait une seconde source de verite.
- Les anciens helpers ont des valeurs par defaut `systemRng` dangereuses pour
  le backend si l injection n est pas imposee.
- Les donnees de catalogue client doivent etre partagees sans import runtime
  React dans l Edge Function.
- La migration du schema doit rester compatible avec les sauvegardes actuelles.

## Handoff

Fournir :

- table reference/backend mise a jour ;
- bande RNG et nombre de rolls consommes par scenario ;
- golden fixtures des encounters ordinaires et boss ;
- transcripts complets incluant succes, echec, critique, esquive, competence,
  mort, loot et progression ;
- preuve de replay et de persistance RNG ;
- preuve navigateur de la presentation progressive ;
- liste explicite des comportements historiques conserves volontairement.
