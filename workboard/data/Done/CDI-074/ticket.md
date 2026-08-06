---
id: CDI-074
title: Strategie des competences actives et conservation du mana
status: Done
area: domain
priority: P1
size: M
risk: high
source: Audit des competences actives et du mana du 2026-08-01
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/authoritative-dungeon-parity-audit.md", "docs/architecture/idle-engine.md", "docs/development/combat-tactics.md", "src/domain/authoritativeDungeon.ts", "src/domain/combatTactics.ts", "src/data/skills.ts", "src/data/heroes.ts", "tests/combatTacticsSimulation.test.ts"]
---

# CDI-074 - Strategie des competences actives et conservation du mana

## Objectif

Remplacer la selection implicite de la premiere competence active utilisable
par une strategie explicite, deterministe et extensible, tout en permettant
aux heros de conserver le mana necessaire aux actions prioritaires.

## Resultat utilisateur

Les heros utilisent leurs competences au moment pertinent, evitent de vider
inutilement leur mana sur des combats faibles et conservent les ressources
necessaires aux soins et protections importantes.

## Contexte

Le moteur autoritaire parcourt actuellement `activeSkills` dans leur ordre et
execute la premiere competence disponible, abordable et jugee utile. Aucun
profil de preference ou reserve de mana n existe. L Acolyte privilegie le soin
uniquement parce que `minor_heal` est en premiere position, tandis que le Mage
ne compare ni cout, ni rendement, ni resistance entre ses deux sorts.

L estimation de la duree du combat repose sur `physicalDamage`, y compris
pour les competences magiques. Le mana restant est correctement persiste entre
les rencontres et les recuperations existantes sont autoritaires.

Le moteur autoritaire applique bien les buffs et debuffs. Leur selection est
cependant presque toujours rejetee par la strategie actuelle : leur benefice,
exprime en points de degats ajoutes ou evites, est compare directement a leur
cout en mana. Ces unites ne sont pas comparables. La reserve de mana penalise
ensuite une seconde fois les sorts de support couteux, puis l attaque normale
gagne generalement le classement grace a ses degats immediats. Les tests
existants valident surtout la legalite et le determinisme des choix ainsi que
quelques urgences extremes ; ils ne prouvent pas qu un buffer ou debuffer
utilise effectivement ses sorts dans une situation normale.

## Perimetre autorise

- Definir un classement explicite des actions actives disponibles.
- Prioriser le soin urgent, l attaque letale, la protection utile puis le
  meilleur rendement offensif adapte a la cible.
- Definir une reserve de mana liee aux soins ou protections prioritaires
  connus par le heros.
- Autoriser le franchissement de la reserve pour une urgence, un boss ou un
  coup fatal.
- Evaluer les competences avec leur statistique de scaling et les defenses ou
  resistances pertinentes.
- Evaluer buffs, debuffs, soins et attaques dans une unite commune fondee sur
  le gain ou la perte de PV projetee pendant les tours ou l effet est utile.
- Permettre l utilisation assez tot d un buff ou debuff rentable lorsque la
  duree estimee du combat permet d en tirer profit.
- Eviter de relancer un effet encore actif lorsqu aucune amelioration utile n
  en resulte.
- Rendre la strategie generique pour plusieurs actifs et les futures classes
  Tier 2 a Tier 4.
- Refuser la consommation de mana et de cooldown lorsqu un effet fonctionnel
  n est pas applique.
- Preserver le resultat dans l etat canonique, le transcript et le replay.

## Hors perimetre

- Equilibrer globalement tous les couts, puissances et cooldowns.
- Concevoir les classes Tier 2 a Tier 4.
- Ajouter une interface avancee de programmation manuelle des heros sans
  validation produit dediee.
- Implementer silencieusement les effets generaux de buff et debuff dans ce
  ticket si ce chantier depasse la strategie de selection.

## Contrat d'implementation

- La selection recoit toutes les actions disponibles et produit un choix
  deterministe sans roll RNG supplementaire.
- L ordre brut de `activeSkills` ne constitue plus la seule preference.
- Une action est eligible seulement si son effet est fonctionnel, son
  cooldown termine et son cout payable selon la reserve applicable.
- La reserve correspond au cout d une action de soin ou protection prioritaire
  plutot qu a un pourcentage arbitraire identique pour toutes les classes.
- Le cout en mana influence la conservation et le rendement strategique, mais
  n est jamais compare directement a une valeur exprimee en points de degats.
- La reserve est adaptee au role et ne penalise pas deux fois le sort de
  support dont l utilisation est en cours d evaluation.
- Une urgence de soin, une attaque letale ou un combat de boss peut ignorer la
  reserve selon des regles explicites et testees.
- Les degats attendus utilisent `effect.scalingStat`, le type de degats, la
  defense ou la resistance cible et le nombre de touches.
- La defense magique constitue la resistance elementaire de base. L affinite
  de l element modifie cette defense avant une unique soustraction, avec la
  meme regle dans les deux sens du combat.
- Les competences sans effet applique ne consomment ni mana ni cooldown.
- Le mana depense ou restaure reste persiste par l autorite existante.

## Dependances

Aucune dependance obligatoire pour definir et tester la strategie. Si
l application reelle des buffs et debuffs devient necessaire, elle doit etre
tracee ou realisee dans un perimetre explicitement valide avant de rendre ces
competences eligibles.

## Criteres d'acceptation

- [x] Une matrice de priorite des actions est documentee et validee.
- [x] Un soin urgent passe avant une attaque non letale.
- [x] Une attaque letale peut passer avant une action moins rentable.
- [x] Un Mage compare ses sorts avec la statistique et la resistance adaptees.
- [x] Un heros conserve assez de mana pour son soin ou sa protection
      prioritaire hors exception explicite.
- [x] Un boss, une urgence ou un coup fatal peut utiliser la reserve selon le
      contrat valide.
- [x] Un buff ou debuff sans effet applique ne consomme aucune ressource.
- [x] Un buff ou debuff fonctionnel et rentable peut etre choisi dans un
      combat normal assez long, sans exiger une menace de mort ou un boss.
- [x] La valeur d un effet est projetee sur ses tours utiles et n est jamais
      comparee directement a son cout en mana.
- [x] Un effet encore actif n est pas relance sans benefice supplementaire.
- [x] Les classes representatives de buff et debuff ont une frequence d usage
      non nulle dans la matrice de simulation lorsqu elles possedent le sort.
- [x] Le choix reste deterministe et ne modifie pas la sequence RNG.
- [x] Mana, cooldowns et replay restent identiques a l etat canonique ; la
      reconstruction depuis cet etat couvre la compatibilite F5 sans test
      navigateur manuel.
- [x] La strategie accepte plusieurs actifs sans logique specifique codee en
      dur pour une seule classe.

## Tests

- Tests unitaires de classement avec plusieurs competences eligibles.
- Tests de soin urgent, attaque letale, boss et reserve de mana.
- Tests Mage avec resistances elementaires et couts differents.
- Tests garantissant qu un effet non applique ne consomme rien.
- Simulations de combats ordinaires assez longs avec Aede, Druide, Acolyte et
  Artificier, en comptant les selections de buffs et debuffs.
- Assertions de frequence non nulle et motifs explicites de selection ou de
  rejet, afin qu un test uniquement legal et deterministe ne masque plus une
  absence totale d utilisation.
- Tests de non-relance d un effet actif et de rejet dans un combat trop court.
- Golden tests du transcript, du mana, des cooldowns et du nombre de rolls.
- Tests de persistance apres rencontres successives, F5 et replay.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

La validation manuelle longue a ete remplacee par le moteur de simulation
autoritaire demande pendant le ticket. Il couvre les chargements reels, les
groupes physiques et magiques, les ennemis faibles ou resistants, les groupes
blesses, les boss, les cooldowns, les effets temporaires, le mana, le transcript
et le replay. Le build frontend a ete rapporte valide par l utilisateur.

## Preservation

- Preserver le mana restant entre les salles.
- Preserver les recuperations de mana existantes : niveau, repos, enigme,
  rituel et repos en ville.
- Preserver l autorite serveur, l atomicite, l idempotence et le RNG canonique.
- Preserver les identifiants de competences et les sauvegardes existantes.
- Ne pas transformer l ordre historique des tableaux en decision produit
  implicite.

## Risques

- Une mauvaise priorite peut rendre un soigneur offensif au mauvais moment ou
  provoquer une conservation excessive du mana.
- Une evaluation incorrecte des resistances peut inverser le meilleur choix.
- Une projection trop optimiste peut forcer les supports sur des combats trop
  courts ; une projection trop prudente peut reproduire leur non-utilisation.
- Toute consommation RNG ajoutee casserait les golden tests et les replays.
- L activation prematuree de buffs ou debuffs non fonctionnels recreerait une
  depense sans benefice.

## Handoff

La matrice de priorite, l unite commune de comparaison, la formule de reserve,
les exceptions et les frequences simulees sont documentees dans
`docs/development/combat-tactics.md`. La matrice instantanee couvre 44
chargements autoritaires et la matrice longitudinale resout 176 combats
complets. `wind_blade`, `holy_mark` et `static_trap` sont effectivement utilises
sur les rotations adaptees ; aucun reequilibrage de catalogue n est retenu.
`cleaving_strike` reste explicitement differe jusqu au multi-ennemi.

Validation finale : 62 fichiers de tests et 559 tests passes, typecheck, ESLint,
determinisme et workboard valides ; build frontend rapporte valide par
l utilisateur.
