---
id: CDI-075
title: Reequilibrer les rencontres non-combat et le jet de chance
status: Later
area: domain
priority: P1
size: M
risk: high
source: Audit du deroule et du calcul des rencontres non-combat du 2026-08-01
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/authoritative-dungeon-parity-audit.md", "src/domain/authoritativeDungeon.ts", "src/utils/dungeonHelpers.ts", "tests/authoritativeDungeonGolden.test.ts", "tests/utils.test.ts"]
---

# CDI-075 - Reequilibrer les rencontres non-combat et le jet de chance

## Objectif

Definir puis implementer un calcul de reussite lisible, equilibre et
deterministe pour les six rencontres non-combat, sans conserver implicitement
une formule historique non calibree.

## Resultat utilisateur

Une epreuve reste incertaine lorsque le groupe est correctement dimensionne,
valorise les bons attributs et la chance, puis devient progressivement plus
exigeante avec l ascension du donjon. Le transcript permet de comprendre
clairement pourquoi elle reussit ou echoue.

## Contexte

Le calcul actuel additionne les deux attributs de l epreuve, choisit le heros
au meilleur total, tire un entier entre `1` et sa valeur de `LUK`, puis compare
le resultat a `10 + etage * 2`. Un heros avec `LUK 1` obtient donc toujours
`+1` et un heros avec `LUK 2` seulement `+1` ou `+2`.

A l etage 1, la difficulte vaut 12. Les scores 13 et 20 constates en jeu
garantissent deja la reussite et rendent le jet sans effet. La difficulte ne
depend pas de la salle. Pour Embuscade et Negociation, `LUK` entre dans le
score puis determine aussi l amplitude du jet. Pour les autres epreuves, le
choix du heros ignore sa chance reelle de reussite. Les bonus d attributs
issus de l equipement ne participent pas au score, car seuls les attributs de
base sont lus.

La formule provient du prototype historique et a ete preservee pour la parite.
Les tests actuels forcent une reussite et un echec, mais ne prouvent ni la
courbe par etage, ni les distributions selon niveau, classe et `LUK`.

## Perimetre autorise

- Auditer les six couples d attributs et leurs consequences fonctionnelles.
- Definir explicitement le role de `LUK` dans le score et le hasard.
- Comparer plusieurs formules candidates avant validation produit.
- Definir la difficulte par etage et statuer sur une variation par salle.
- Choisir le heros selon sa probabilite reelle de reussite avec la formule
  retenue.
- Supprimer tout double comptage involontaire de `LUK`.
- Decider explicitement si les bonus d attributs d equipement, de passifs ou
  d autres sources participent aux epreuves.
- Verifier le deroule complet : selection, tentative, resultat, consequence,
  recompense, XP et avancement de salle.
- Clarifier le transcript avec les attributs, le score, le jet, les bonus et
  la difficulte effectivement utilises.
- Remplacer le libelle historique `CHA` par `LUK` lorsque la statistique
  represente bien la chance.

## Hors perimetre

- Modifier les combats ordinaires ou les boss.
- Reequilibrer toute l economie du donjon hors recompenses directement liees
  aux rencontres non-combat.
- Ajouter de nouveaux types de rencontres avant validation des six existants.
- Choisir une nouvelle formule sans simulation et validation produit.

## Contrat d'implementation

- La formule finale est documentee avec ses bornes et des exemples exacts.
- Un seul roll RNG canonique determine la part aleatoire de l epreuve, sauf
  decision produit explicite et versionnee.
- Une meme sauvegarde, commande et graine produit le meme resultat.
- La selection du heros maximise le critere valide et departage les egalites
  de maniere deterministe.
- `LUK` ne compte pas deux fois sans justification produit explicite.
- La difficulte evolue selon une courbe testee sur les etages representatifs.
- Les sources d attributs incluses ou exclues sont uniques et explicites.
- Les consequences et recompenses conservees correspondent aux valeurs
  affichees dans le transcript.
- Le comportement apres echec, actuellement l avancement vers la salle
  suivante, est confirme ou remplace explicitement.

## Dependances

Aucune dependance obligatoire pour la phase d audit et de simulation. Si les
bonus d attributs d equipement doivent participer au score, leur raccordement
doit rester coherent avec le catalogue autoritaire et les travaux objets.

## Criteres d'acceptation

- [ ] Les six rencontres possedent un couple d attributs et une consequence
      explicitement valides.
- [ ] Le role de `LUK` est unique, comprehensible et documente.
- [ ] Aucun type de rencontre ne double-compte involontairement `LUK`.
- [ ] Le meilleur heros est choisi selon le calcul reel de reussite.
- [ ] Les sources d attributs retenues sont identiques entre calcul et UI.
- [ ] La courbe de difficulte est validee aux etages bas, moyens et hauts.
- [ ] Les probabilites restent interessantes pour plusieurs niveaux, classes
      et compositions de groupe representatifs.
- [ ] Les cas de reussite garantie et d echec impossible sont intentionnels
      et bornes.
- [ ] Le transcript explique chaque terme du calcul sans libelle `CHA`
      errone pour `LUK`.
- [ ] Recompenses, consequences, XP et avancement apres echec correspondent
      aux decisions validees.
- [ ] RNG, idempotence, F5 et replay restent canoniques.

## Tests

- Tests table-driven des six couples d attributs et libelles.
- Tests de frontiere autour du seuil de reussite.
- Tests de selection entre un meilleur score brut et une meilleure
  probabilite effective.
- Tests de `LUK` minimale, moyenne et haute sans double comptage.
- Simulations statistiques sur plusieurs niveaux, classes, etages et graines.
- Golden tests des six succes, six echecs, consequences et recompenses.
- Tests du nombre et de l ordre exact des rolls RNG.
- Tests F5, replay et persistance de l etat resultant.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec une sauvegarde controlee, jouer chaque rencontre avec un groupe faible,
adapte et surdimensionne sur plusieurs etages. Comparer les attributs visibles,
le heros choisi, le jet, le seuil, la consequence et la recompense. Confirmer
ensuite l etat apres F5 et le replay autoritaire de la commande.

## Preservation

- Preserver l autorite serveur, l atomicite et l idempotence.
- Preserver les identifiants de rencontres et la structure des evenements
  utiles ou fournir une evolution compatible.
- Preserver le RNG canonique et documenter toute modification de consommation.
- Ne pas traiter la formule historique comme une decision produit validee.
- Ne pas modifier silencieusement les consequences deja visibles.

## Risques

- Une difficulte mal calibree peut rendre les epreuves automatiques ou
  impossibles selon la classe.
- Une croissance des attributs plus rapide que celle du seuil recreerait les
  reussites garanties observees.
- Inclure deux fois `LUK` ou des bonus d equipement fausserait fortement les
  probabilites.
- Modifier le nombre de rolls casserait les golden tests et les replays
  deterministes attendus.

## Handoff

Fournir l audit des six rencontres, les formules comparees, les distributions
mesurees, la decision produit, les courbes par etage, les golden tests, les
etats RNG avant/apres et les preuves F5/replay.
