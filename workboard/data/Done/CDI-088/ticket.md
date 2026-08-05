---
id: CDI-088
title: Assainir les frappes ennemies et les repetitions de rencontres
status: Done
area: gameplay
priority: P1
size: S
risk: medium
source: Ajustement gameplay valide avec l utilisateur le 2026-08-05
depends_on: []
blocks: []
github_issue: null
related_docs: ["package.json", "shared/domain/monster-combat.ts", "src/utils/dungeonHelpers.ts", "src/domain/authoritativeDungeon.ts", "src/domain/combatTactics.ts", "tests/dungeonEncounterRules.test.ts", "tests/dungeonRulesSimulation.test.ts", "tests/authoritativeDungeonGolden.test.ts", "tests/combatTacticsSimulation.test.ts", "tests/DungeonPanel.test.tsx", "docs/development/dungeon-rules-simulation.md"]
---

# CDI-088 - Assainir les frappes ennemies et les repetitions de rencontres

## Objectif

Supprimer les frappes multiples automatiques des elites et boss et empecher la
repetition immediate d une meme rencontre non-combat.

## Resultat utilisateur

Les elites et boss restent menacants sans doubler ou tripler automatiquement
leurs attaques. Les rencontres non-combat gagnent en variete.

## Contexte

`isBoss` accorde actuellement deux frappes garanties, puis trois selon l etage.
La selection ponderee peut egalement produire deux fois de suite le meme type
de rencontre non-combat.

## Perimetre autorise

- Introduire une resolution pure du profil de frappe ennemi.
- Conserver la probabilite actuelle des monstres normaux.
- Donner aux elites 35 % de chance d une seconde frappe.
- Donner aux boss majeurs 50 % de chance d une seconde frappe.
- Limiter tous les ennemis a deux frappes dans cette version.
- Exclure du tirage le dernier type rencontre s il n est pas `fight`.
- Conserver un seul tirage RNG pour la selection d une rencontre.
- Adapter les tests deterministes et golden.

## Hors perimetre

- Ajouter des competences ou phases de boss.
- Reequilibrer les statistiques de tous les ennemis.
- Interdire deux combats consecutifs.
- Modifier les poids de base des rencontres.
- Ajouter une migration persistante.

## Contrat d'implementation

Le combat resout un profil explicite avant la boucle d attaque : une frappe de
base, une probabilite de frappe bonus et un plafond de deux frappes. La boucle
ne derive plus directement son nombre de frappes depuis `isBoss` ou un seuil
d etage.

Pour les rencontres, le dernier element de `encounterHistory` est consulte. Si
son type n est pas `fight`, ce type est retire du prochain tirage pondere. Les
poids restants sont renormalises implicitement et un seul nombre aleatoire est
consomme. Une salle finale reste forcee a `fight`.

## Dependances

Aucune dependance bloquante. `encounterHistory` contient deja le type necessaire.

## Criteres d'acceptation

- [x] Un monstre normal conserve sa probabilite actuelle de seconde frappe.
- [x] Une elite possede une seule frappe garantie et 35 % de chance d une seconde.
- [x] Un boss majeur possede une seule frappe garantie et 50 % de chance d une seconde.
- [x] Aucun ennemi ne depasse deux frappes.
- [x] La boucle d attaque ne contient plus de branche de frappes basee sur `isBoss`.
- [x] Deux rencontres `trap`, `enigma`, `ambush`, `ritual`, `obstacle`,
      `negotiation`, `treasure` ou `rest` identiques ne peuvent pas se suivre.
- [x] Deux rencontres `fight` peuvent se suivre.
- [x] Une rencontre non-combat peut revenir apres un combat ou un autre type.
- [x] La selection consomme un seul tirage RNG.
- [x] Les salles finales restent des combats.
- [x] Le replay autoritaire reste deterministe.

## Tests

- Tester les profils normal, elite et boss aux bornes du jet.
- Tester le plafond de deux frappes.
- Tester l exclusion de chaque type non-combat.
- Tester que `fight` reste eligible apres `fight`.
- Adapter les bandes RNG golden affectees.
- Executer typecheck, lint, tests complets, determinisme et build.

## Validation manuelle

Aucune validation manuelle longue n est prevue. Les deux regles doivent etre
couvertes par des simulations deterministes utilisant le moteur autoritaire.

La commande `npm.cmd run test:dungeon-simulation` a produit 17 tests reussis
sur 17. Ce resultat a ete verifie par Codex puis rapporte independamment par
l utilisateur le 2026-08-05.

## Preservation

- Preserver les poids de base des rencontres.
- Preserver la probabilite actuelle des monstres normaux.
- Preserver l ordre RNG hors changements explicitement inventories.
- Preserver les salles finales, defenses, esquives et choix de cibles.
- Ne pas introduire un second moteur de combat.

## Risques

- Les boss deviennent moins explosifs et peuvent necessiter plus tard des
  competences propres.
- Une consommation RNG supplementaire casserait les replays et golden tests.
- Lire un historique client non valide ne doit pas influencer l autorite ; seul
  l historique canonique persiste doit etre utilise.

## Handoff

Fournir les formules finales, les changements de consommation RNG, les golden
tests adaptes et les preuves de validation automatisee.

### Realisations et preuves

- Profil partage : normal conserve la formule historique, elite `1 + 35 %`,
  boss majeur `1 + 50 %`, plafond de deux frappes.
- Combat reel et IA tactique utilisent la meme resolution partagee du rang et
  de l esperance de frappes.
- Le dernier type non-combat est exclu du tirage pondere suivant sans reroll.
- `fight` reste repetable et la salle finale reste forcee a `fight`.
- Changement RNG : un jet de profil par tour ennemi ; selection de rencontre
  maintenue a un seul jet avec renormalisation des poids restants.
- Simulation donjon : 17 tests sur 17 reussis, preuve Codex et preuve utilisateur.
- Suite complete : 55 fichiers et 517 tests reussis.
- Typecheck, lint, determinisme, diff et build de production reussis.
- Compatibilite front verifiee par les tests de `DungeonPanel`, les simulations
  tactiques et le build ; aucun contrat de rendu ni migration n a change.
- Avertissement de build non bloquant conserve pour le chunk vendor existant.
