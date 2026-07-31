---
id: CDI-074
title: Strategie des competences actives et conservation du mana
status: Later
area: domain
priority: P1
size: M
risk: high
source: Audit des competences actives et du mana du 2026-08-01
depends_on: []
blocks: []
github_issue: null
related_docs: ["docs/architecture/authoritative-dungeon-parity-audit.md", "docs/architecture/idle-engine.md", "src/domain/authoritativeDungeon.ts", "src/data/skills.ts", "src/data/heroes.ts"]
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
pour les competences magiques. Les buffs et debuffs caracterises consomment
du mana et un cooldown alors que leurs modificateurs ne sont pas appliques.
Le mana restant est toutefois correctement persiste entre les rencontres et
les recuperations existantes sont autoritaires.

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
- Une urgence de soin, une attaque letale ou un combat de boss peut ignorer la
  reserve selon des regles explicites et testees.
- Les degats attendus utilisent `effect.scalingStat`, le type de degats, la
  defense ou la resistance cible et le nombre de touches.
- Les competences sans effet applique ne consomment ni mana ni cooldown.
- Le mana depense ou restaure reste persiste par l autorite existante.

## Dependances

Aucune dependance obligatoire pour definir et tester la strategie. Si
l application reelle des buffs et debuffs devient necessaire, elle doit etre
tracee ou realisee dans un perimetre explicitement valide avant de rendre ces
competences eligibles.

## Criteres d'acceptation

- [ ] Une matrice de priorite des actions est documentee et validee.
- [ ] Un soin urgent passe avant une attaque non letale.
- [ ] Une attaque letale peut passer avant une action moins rentable.
- [ ] Un Mage compare ses sorts avec la statistique et la resistance adaptees.
- [ ] Un heros conserve assez de mana pour son soin ou sa protection
      prioritaire hors exception explicite.
- [ ] Un boss, une urgence ou un coup fatal peut utiliser la reserve selon le
      contrat valide.
- [ ] Un buff ou debuff sans effet applique ne consomme aucune ressource.
- [ ] Le choix reste deterministe et ne modifie pas la sequence RNG.
- [ ] Mana, cooldowns, F5 et replay restent identiques a l etat canonique.
- [ ] La strategie accepte plusieurs actifs sans logique specifique codee en
      dur pour une seule classe.

## Tests

- Tests unitaires de classement avec plusieurs competences eligibles.
- Tests de soin urgent, attaque letale, boss et reserve de mana.
- Tests Mage avec resistances elementaires et couts differents.
- Tests garantissant qu un effet non applique ne consomme rien.
- Golden tests du transcript, du mana, des cooldowns et du nombre de rolls.
- Tests de persistance apres rencontres successives, F5 et replay.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Sur une sauvegarde controlee, faire combattre un Acolyte et un Mage avec
plusieurs actifs contre un ennemi faible, un ennemi resistant, un groupe
blesse et un boss. Verifier le choix de competence, le mana conserve ou
depense, les cooldowns, puis confirmer le meme etat apres F5 et replay.

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
- Toute consommation RNG ajoutee casserait les golden tests et les replays.
- L activation prematuree de buffs ou debuffs non fonctionnels recreerait une
  depense sans benefice.

## Handoff

Fournir la matrice de priorite validee, la formule de reserve, les exceptions,
les preuves par classe representative, les golden tests, les etats de mana et
cooldowns avant/apres, ainsi que les validations F5 et replay.
