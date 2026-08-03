---
id: CDI-085
title: Rendre l IA de combat tactique dans sa gestion du mana
status: ToDo
area: gameplay
priority: P1
size: L
risk: high
source: Analyse du systeme de mana avec l utilisateur le 2026-08-03
depends_on: []
blocks: []
github_issue: null
related_docs: ["src/domain/authoritativeDungeon.ts", "src/domain/tier1ClassTransition.ts", "src/data/skills.ts", "shared/domain/dungeon-progression.ts", "tests/authoritativeDungeonGolden.test.ts", "docs/architecture/authoritative-dungeon-parity-audit.md"]
---

# CDI-085 - Rendre l IA de combat tactique dans sa gestion du mana

## Objectif

Remplacer la selection actuelle de la premiere competence active acceptable par
un moteur de decision deterministe qui choisit entre toutes les actions
disponibles selon l urgence, leur valeur tactique, leur cout en mana et les
besoins previsibles de l expedition.

## Resultat utilisateur

Les heros utilisent leurs competences au bon moment, conservent assez de mana
pour les soins et les boss, evitent les lancements inutiles et restent
comprehensibles dans leurs decisions.

Le joueur ne voit plus un heros gaspiller ses derniers PM sur une action
marginale, ignorer une competence decisive ou consommer du mana pour un effet
sans incidence reelle sur le combat.

## Contexte

Le moteur autoritaire parcourt actuellement `hero.activeSkills` dans leur ordre
stocke et execute la premiere competence qui remplit quelques conditions
locales. Une attaque normale est utilisee lorsqu aucune competence ne passe ces
conditions.

Les comportements deja presents sont :

- verification du mana disponible et du cooldown ;
- utilisation offensive contre un boss, une menace elevee, un ennemi encore
  resistant ou lorsqu une competence peut l achever ;
- soin individuel de l allie vivant au plus faible pourcentage de PV ;
- soin de groupe si un allie est critique ou si plusieurs sont blesses ;
- utilisation conditionnelle des buffs et debuffs ;
- attaque normale gratuite comme solution de repli.

Cette base ne constitue cependant pas une gestion tactique complete :

- le pourcentage de mana restant n influence pas la decision ;
- aucune reserve n est conservee pour un soin ou le boss de fin d etage ;
- la duree restante de l expedition n est pas prise en compte ;
- les actions ne sont pas comparees entre elles ;
- la premiere competence acceptable gagne, y compris lorsque son ordre a ete
  tire aleatoirement lors du changement de classe ;
- le cout en mana n est pas rapporte au gain obtenu ;
- le sursoin et les degats excedentaires sont peu ou pas penalises ;
- l evaluation offensive utilise parfois les degats physiques du heros comme
  reference, y compris pour les profils magiques ;
- les buffs et debuffs consomment actuellement mana et cooldown mais leurs
  modificateurs ne sont pas appliques au combat.

Le donjon connait le nombre de salles de l etage et sa salle finale. Cette
information autoritaire peut etre utilisee pour preparer un boss sans predire
les rencontres aleatoires intermediaires.

## Perimetre autorise

- Rendre fonctionnels les buffs et debuffs autoritaires :
  - appliquer leurs modificateurs ;
  - suivre leur duree en tours ;
  - definir explicitement rafraichissement, remplacement et non-cumul ;
  - retirer les effets expires ;
  - ne pas les persister au-dela de la rencontre sauf decision produit
    explicite et documentee.
- Extraire la selection d action dans une fonction pure et testable.
- Construire la liste de toutes les actions legales :
  - attaque normale ;
  - competences actives connues ;
  - cooldown termine ;
  - mana suffisante ;
  - cible valide ;
  - effet applicable.
- Evaluer toutes les actions plutot que prendre la premiere.
- Introduire des niveaux de priorite tactique :
  - empecher une mort probable ;
  - tuer avant la prochaine attaque ennemie ;
  - stabiliser un allie en danger ;
  - reduire sensiblement le danger ou la duree du combat ;
  - economiser la mana.
- Estimer les degats de l attaque normale et des competences apres defenses,
  resistances, nombre de frappes et type de degats.
- Estimer les degats ennemis probables au prochain tour pour detecter une cible
  menacee de mort.
- Evaluer les soins selon les PV effectivement rendus et penaliser le sursoin.
- Evaluer les soins de groupe selon le soin effectif total et le nombre d allies
  reellement menaces.
- Evaluer buffs et debuffs selon leur effet reel, leur duree utile, les tours
  estimes restants et les effets deja actifs.
- Introduire une reserve de mana derivee des competences possedees :
  - soin d urgence pour un soigneur ;
  - action de soutien importante ;
  - une ou plusieurs attaques fortes pour le boss ;
  - reduction progressive de cette reserve pendant le boss.
- Permettre a une urgence vitale ou une action decisive de puiser dans la
  reserve.
- Utiliser l etage, la salle courante et la distance au boss sans consulter de
  futur aleatoire.
- Ajouter des raisons de decision stables et exploitables dans le transcript ou
  les diagnostics de test.
- Prevoir trois profils configurables une fois le comportement par defaut
  valide :
  - prudent ;
  - equilibre ;
  - agressif.
- Documenter les regles de choix et les valeurs d equilibrage.

## Hors perimetre

- Donner au client le pouvoir de resoudre ou corriger un combat autoritaire.
- Utiliser un modele probabiliste non deterministe ou un service externe.
- Consommer du RNG pour departager deux actions tactiques.
- Predire la nature des rencontres aleatoires futures.
- Ajouter immediatement un editeur complexe de scripts par competence.
- Refaire l ensemble du systeme de classes ou du catalogue de competences.
- Reequilibrer tous les couts de mana sans mesure issue des nouveaux tests.
- Modifier les regles de recuperation hors combat sans ticket ou critere
  explicite.
- Persister silencieusement de nouveaux reglages sans contrat canonique,
  validation et migration adaptes.

## Contrat d'implementation

- La selection prend la forme d une fonction pure, par exemple
  `chooseHeroAction(context)`.
- Le contexte contient uniquement les informations autoritaires deja connues :
  heros, groupe, ennemi, effets actifs, etage, salle, tour et strategie.
- Le resultat identifie :
  - le type d action ;
  - la competence eventuelle ;
  - la cible eventuelle ;
  - une raison de decision stable.
- L attaque normale reste toujours une action candidate valide pour un heros
  vivant et actif.
- Les actions sont d abord classees par niveau tactique, puis departagees par :
  1. valeur nette ;
  2. efficacite par point de mana ;
  3. cooldown ;
  4. identifiant stable.
- Les priorites absolues sont reservees a la survie probable et aux actions
  evitant une attaque ennemie.
- Une competence offensive ordinaire doit apporter un gain mesurable par
  rapport a l attaque normale.
- Une competence de soin utilise le soin effectif, jamais uniquement sa valeur
  theorique.
- Un buff ou debuff ne peut etre choisi que si son effet est applique par le
  moteur et utile pendant une duree suffisante.
- La reserve de mana est derivee des competences du heros, pas d une liste de
  classes codee en dur.
- Le profil equilibre constitue le comportement canonique par defaut.
- Un snapshot historique sans profil explicite conserve le profil equilibre.
- Le choix d action ne consomme aucun RNG et ne modifie pas l ordre des tirages
  de combat hors changements intentionnels documentes.
- Une meme entree, un meme etat RNG et une meme version produisent le meme
  choix, le meme combat et le meme transcript.
- Les journaux expliquent l action executee sans exposer chaque candidat refuse
  ni gonfler excessivement les snapshots.
- Les changements de transcript, de consommation RNG ou de resultat des golden
  tests sont inventories et justifies.

## Dependances

Aucune dependance bloquante n est identifiee.

L implementation doit toutefois tenir compte des modifications locales deja
presentes dans `authoritativeDungeon.ts` et ses tests. Elle doit commencer par
rebaser le diagnostic sur l etat courant du fichier afin de ne pas ecraser un
travail utilisateur.

Si les profils tactiques sont persistes, leur ajout dependra du contrat
canonique, de sa validation et de la strategie de migration effectivement en
place au moment de l implementation.

## Criteres d'acceptation

- [ ] Buffs et debuffs modifies influencent reellement le combat.
- [ ] Leur duree, expiration, rafraichissement et cumul sont explicites et
      testes.
- [ ] La selection d action est extraite dans une fonction pure.
- [ ] Toutes les actions legales sont comparees avec l attaque normale.
- [ ] L ordre de `activeSkills` ne determine plus arbitrairement l action.
- [ ] Un departage egal reste stable et ne consomme aucun RNG.
- [ ] Un soin empechant probablement une mort est prioritaire.
- [ ] Un soin inutile ou largement gaspille n est pas lance.
- [ ] Un soin de groupe exige une valeur collective suffisante.
- [ ] Une competence offensive est privilegiee lorsqu elle evite une attaque
      ennemie que l attaque normale laisserait passer.
- [ ] Une competence marginale est refusee lorsque son gain ne justifie pas son
      cout.
- [ ] Les defenses et resistances reelles interviennent dans le choix offensif.
- [ ] Un heros magique n est plus evalue a partir de ses seuls degats physiques.
- [ ] Une reserve de mana adaptee aux competences est conservee avant le boss.
- [ ] Une urgence vitale peut utiliser cette reserve.
- [ ] La reserve est depensee utilement pendant le boss et ne provoque pas une
      defaite par retention excessive.
- [ ] Le profil equilibre fonctionne sans configuration historique.
- [ ] Les profils prudent, equilibre et agressif ont des differences
      deterministes et documentees.
- [ ] Chaque action executee fournit une raison stable exploitable par les tests.
- [ ] Le moteur reste autoritaire, rejouable et deterministe.
- [ ] Aucun nouvel ecart reel de gameplay n est laisse non documente.

## Tests

Ajouter des tests unitaires parametrises du selecteur pur couvrant au minimum :

- mana insuffisante et cooldown actif ;
- attaque normale lorsqu aucun sort n est rentable ;
- sort lethal alors que l attaque normale ne tue pas ;
- refus d un sort qui ne fait que produire des degats excedentaires ;
- choix entre deux sorts de couts et efficacites differents ;
- choix elementaire face aux defenses et resistances ;
- departage stable independant de l ordre des competences ;
- soin individuel empechant une mort probable ;
- absence de soin lorsque les blessures sont mineures ;
- penalite de sursoin ;
- choix entre soin individuel et soin de groupe ;
- conservation du dernier soin d urgence ;
- utilisation de la reserve lors d une urgence ;
- conservation de mana avant le boss ;
- consommation adaptee pendant le boss ;
- buff utile au debut d un combat long ;
- refus d un buff sur un ennemi presque mort ;
- absence de cumul interdit et rafraichissement explicite ;
- expiration des effets ;
- profils prudent, equilibre et agressif ;
- invariance du choix sans consommation RNG.

Completer avec des golden tests de rencontres completes :

- groupe avec soigneur et DPS magique sur une salle ordinaire ;
- groupe a faible mana proche du boss ;
- boss avec plusieurs tours et effets temporaires ;
- progression sur plusieurs salles avec persistance de la mana ;
- defaite et retour au repos ;
- replay identique d une meme commande.

Commandes de validation non interactives :

- `npm.cmd run board:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`

Les tests interactifs ou dependants de Supabase local sont executes par
l utilisateur selon les instructions du projet.

## Validation manuelle

Sur une partie locale controlee :

1. Constituer un groupe comprenant un soigneur, un DPS magique et un soutien.
2. Observer plusieurs salles faciles et confirmer que les sorts marginaux ne
   vident pas la mana.
3. Blesser fortement un allie et verifier que le soin d urgence devient
   prioritaire.
4. Approcher de la derniere salle avec peu de mana et verifier la conservation
   d une reserve coherente.
5. Combattre le boss et verifier que cette reserve est effectivement utilisee.
6. Observer un buff et un debuff et confirmer leur incidence reelle puis leur
   expiration.
7. Comparer les profils prudent, equilibre et agressif.
8. Rejouer une commande autoritaire identique et verifier le meme resultat et
   le meme transcript.

La commande, le terminal et l objectif de chaque test local interactif seront
fournis a l utilisateur au moment de la validation.

## Preservation

- Preserver l autorite serveur et la validation du snapshot canonique.
- Preserver la persistance actuelle de la mana et des cooldowns.
- Preserver l attaque normale comme solution de repli.
- Preserver la priorite de soin garantie de l Acolyte, sauf remplacement prouve
  par une regle tactique plus robuste.
- Preserver les contrats publics de commandes sauf changement explicitement
  necessaire et documente.
- Preserver les proprietes de replay, revision et idempotence.
- Preserver les modifications utilisateur deja presentes dans le worktree.
- Ne pas copier la logique autoritaire dans le frontend.
- Ne pas ecrire de token, session ou donnee sensible dans les tests ou logs.

## Risques

- Une reserve trop elevee peut conduire les heros a mourir avec du mana restant.
- Une reserve trop faible reproduit le gaspillage actuel avant le boss.
- Une estimation de menace trop optimiste peut retarder un soin vital.
- Un score unique mal calibre peut comparer incorrectement soin, degats et
  controle ; les niveaux tactiques doivent preceder les scores secondaires.
- L activation reelle des buffs et debuffs modifiera l equilibrage et les
  golden tests existants.
- Un changement involontaire de consommation RNG casserait les preuves de
  replay.
- Des raisons de decision trop detaillees gonfleraient les transcripts.
- La persistance des profils peut exiger une migration canonique.
- Des profils trop configurables rendraient le comportement difficile a
  comprendre et a tester.

## Handoff

Fournir :

- le contrat du contexte et du resultat de selection ;
- la liste des niveaux tactiques et leurs regles ;
- les formules ou tables d efficacite et de reserve ;
- les regles d application, cumul et expiration des effets ;
- la matrice de tests unitaires et golden ;
- l inventaire des golden tests modifies avec justification ;
- la preuve que le selecteur ne consomme aucun RNG ;
- la preuve de determinisme et de replay ;
- les commandes de validation executees ;
- les validations manuelles restant a effectuer ;
- les decisions d equilibrage et les points encore a mesurer.
