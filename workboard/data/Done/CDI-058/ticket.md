---
id: CDI-058
title: Invariants et preuves de progression des heros
status: Done
area: domain
priority: P1
size: M
risk: high
source: Audit progression historique, documentation et implementation du 2026-07-25
depends_on: ["CDI-054"]
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/architecture/hero-domain.md", "docs/architecture/novice-convergence.md", "docs/architecture/authoritative-dungeon-parity-audit.md", "docs/architecture/api-command-contracts.md", "docs/development/cdi-051-authoritative-ui-validation.md", "src/domain/hero.ts", "src/utils/gameCalculations.ts"]
---

# CDI-058 - Invariants et preuves de progression des heros

## Objectif

Verrouiller la progression autoritaire des heros par rapport au comportement
historique `640f89f` et aux decisions produit confirmees apres la migration
full-stack.

## Resultat utilisateur

Les gains d XP, niveaux, statistiques, recuperations et vocations produisent
un etat deterministe, coherent apres rechargement et protege contre une
sauvegarde de progression incoherente.

## Contexte

L audit du 25 juillet 2026 confirme la parite generale mais identifie une
validation trop faible de `xpNeeded`, une recuperation de mana manquante, un
fallback de croissance T1 incoherent avec la strategie stricte et des trous de
preuve sur les niveaux multiples et la convergence des Novices.

Pour un Novice, les trois statistiques prioritaires sont les trois plus hautes
`baseStats` au debut de chaque niveau. Elles excluent equipement, passifs et
statistiques derivees. Les egalites suivent l ordre historique
`str, agi, end, int, wiz, dex, luk`.

## Perimetre autorise

- Conserver la formule XP et la croissance caracterisees depuis `640f89f`.
- Appliquer une seule recuperation par recompense causant un ou plusieurs
  niveaux : 20 % des PV max et 30 % des PM max, plafonnes aux maxima.
- Conserver la restauration complete des PV/PM lors d une vocation T0 vers T1.
- Ne pas recalculer `calculatedStats` pour un simple gain d XP sans niveau.
- Recalculer les statistiques derivees lors d un level-up et lors d un
  equipement ou desequipement.
- Valider ou migrer `xpNeeded` selon le niveau et la classe canoniques.
- Refuser explicitement une classe T1 sans statistiques principales avant
  toute consommation RNG.
- Renforcer les tests de progression, vocation, transcript, persistance et RNG.
- Corriger et completer la documentation de progression.

## Hors perimetre

- Reequilibrer la formule XP, les poids 80/20 ou les scores d affinite.
- Ajouter des classes T2, un niveau maximal ou de nouvelles races.
- Modifier les catalogues de classes, competences ou batiments.
- Reroller silencieusement les competences des heros T1 existants.

## Contrat d'implementation

- Chaque point de croissance Novice consomme un roll de groupe 80/20 puis un
  roll de selection, soit dix rolls pour cinq points.
- Chaque point T1 consomme les deux memes rolls, soit seize rolls pour huit
  points.
- Le top trois Novice est calcule depuis les `baseStats` au debut de chaque
  niveau et recalcule au niveau suivant.
- Un gain multi-niveaux conserve l ordre historique des rolls et applique la
  recuperation PV/PM une seule fois.
- Une vocation conserve le passif Novice, remplace ses actifs, attribue les
  competences T1 confirmees et vide les cooldowns.
- Toute migration de `xpNeeded` est explicite, deterministe et sans tirage RNG.
- Une configuration T1 sans `mainStats` echoue avant mutation et avant roll.

## Dependances

CDI-054 fournit le moteur de donjon autoritaire et la reference de parite. Le
ticket bloque la cloture de CDI-051.

## Criteres d'acceptation

- [x] La recuperation de niveau vaut exactement 20 % PV max et 30 % PM max.
- [x] Une recompense multi-niveaux ne recupere PV/PM qu une fois.
- [x] Un simple gain d XP conserve les `calculatedStats` persistees.
- [x] Equipement et desequipement recalculent toujours les stats derivees.
- [x] `xpNeeded` est coherent avec `level + 1` et `classType` apres migration.
- [x] Une classe T1 sans `mainStats` est refusee avant consommation RNG.
- [x] Les rolls Novice et T1 sont comptes et caracterises exactement.
- [x] Les niveaux 10, 11, 12 et 13 prouvent la convergence documentee.
- [x] Les vocations ordinaire, Mage et Acolyte sont testees dans le moteur
      autoritaire avec transcript et etat persiste.
- [x] La documentation distingue historique et decisions produit ulterieures.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/utils.test.ts tests/authoritativeDungeonGolden.test.ts tests/authoritativeContracts.test.ts`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Sur une sauvegarde locale controlee, faire gagner un niveau puis plusieurs
niveaux, relever XP, PV, PM, stats, classe, competences, transcript et
`rngState`, recharger avec `F5`, puis verifier la persistance et le replay.

## Preservation

- Preserver la formule XP, l ordre des catalogues et les poids historiques.
- Preserver l autorite serveur, l atomicite, la revision et l idempotence.
- Preserver les decisions confirmees Mage, Acolyte et passif Novice.
- Ne pas recalculer silencieusement les stats persistees hors declencheur
  fonctionnel explicite.

## Risques

- Un roll ajoute ou retire decale le RNG canonique de toutes les commandes
  suivantes.
- Une migration `xpNeeded` incorrecte peut modifier la progression existante.
- Un soin applique par niveau au lieu de par recompense sur-soignerait les
  heros lors d un gain multi-niveaux.

## Handoff

Fournir la matrice historique/existant, les bandes RNG, les tests de
convergence et de vocation, la strategie de migration `xpNeeded`, les preuves
automatisees et le parcours navigateur apres `F5`.

## Progression

Implementation du 25 juillet 2026 :

- recuperation de niveau portee a 20 % PV max et 30 % PM max, une seule fois
  par recompense multi-niveaux ;
- normalisation idempotente de `xpNeeded` pour heros, candidats onboarding et
  recrutement en attente, sans consommation RNG ;
- refus d un reliquat XP qui necessiterait une croissance aleatoire implicite ;
- refus explicite des classes T1 sans `mainStats` avant tout roll ;
- top trois Novice recalcule depuis les `baseStats` avant chaque niveau ;
- golden tests integres Guerrier, Mage et Acolyte avec transcript et skills ;
- tests reels des seuils de convergence, rolls, niveaux multiples, equipement
  et migration ;
- validation automatisee finale par Codex le 26 juillet 2026 : test cible du
  transcript 37 tests PASS, typecheck PASS, suite complete 30 fichiers et
  220 tests PASS, determinisme PASS, ESLint `--quiet` PASS, Workboard
  58 tickets et 0 erreur, et `git diff --check` PASS ;
- build actualise apres les derniers ajustements de transcript : PASS rapporte
  par l utilisateur le 26 juillet 2026 ;
- audit fonctionnel pre-push : PASS. Le seul ecart releve, un commentaire de
  test nommant Dragon au lieu de Minotaure, a ete corrige sans changement de
  comportement.

Validation navigateur rapportee par l utilisateur le 26 juillet 2026 :

- level-up ordinaire : PV `62/92 -> 80/93`, soit
  `62 + floor(93 * 20 %)`, et PM `0/92 -> 31/104`, soit
  `floor(104 * 30 %)` ; croissance Novice de cinq points et statistiques
  derivees recalculees ; etat identique apres `F5` ;
- transcript chiffre valide ensuite sur un second niveau : PV
  `82/93 -> 93/93`, PM `21/104 -> 57/123` et cinq points de caracteristiques
  detailles ;
- vocation Mage niveau 10 : deux sorts elementaires distincts, passif Mage,
  passif Novice conserve, actif Novice retire, cooldowns vides, PV/PM pleins et
  persistance apres `F5` confirmes par l utilisateur ;
- recompense de boss : `+8584 XP`, neuf niveaux `1 -> 10`, recuperation unique
  PV `1/200 -> 47/233` et PM `0/100 -> 26/89`, quarante-cinq points de
  croissance et vocation evaluee une seule fois ; etat identique apres `F5` ;
- replay exact de `dungeon.resolve` : `replayed: true`, commande
  `7b330a45-cb07-4e3d-8344-721733f1a415`, revision `119` sans passage a `120`,
  RNG `draws: 14`, `state: 1434733041`, sans rencontre ni recompense dupliquee
  apres `F5` ;
- smoke navigateur final apres build actualise : `[Coup critique]` distingue
  les critiques, `[Frappe bonus] [Coup critique]` apparait sans compteur, et le
  KO nomme le Minotaure Vagabond, les 223 degats et la transition
  `1 -> 0/233 PV` avant le retour aux dortoirs.
