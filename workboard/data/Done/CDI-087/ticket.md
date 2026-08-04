---
id: CDI-087
title: Rendre le scaling des degats propre a chaque arme et introduire le DPS
status: Done
area: gameplay
priority: P1
size: L
risk: high
source: Conception du scaling des armes avec l utilisateur le 2026-08-04
depends_on: []
blocks: []
github_issue: null
related_docs: ["shared/domain/items/types.ts", "shared/domain/items/weapons.ts", "shared/domain/items/items_weapons_tier1.ts", "shared/domain/items/weapon-scaling.ts", "shared/domain/items/weapon-attack-profile.ts", "shared/domain/weapon-combat.ts", "shared/domain/hero-stats.ts", "shared/contracts/authoritative.ts", "src/types.ts", "src/utils/gameCalculations.ts", "src/domain/authoritativeDungeon.ts", "src/domain/weaponPresentation.ts", "src/components/HeroPanel.tsx", "src/components/StoragePanel.tsx", "src/components/TownPanel.tsx", "src/components/DungeonPanel.tsx", "tests/weaponCombat.test.ts", "tests/weaponProfilesSimulation.test.tsx", "tests/authoritativeDungeonGolden.test.ts", "tests/HeroPanel.test.tsx", "tests/StoragePanel.test.tsx", "tests/TownPanel.test.tsx", "tests/DungeonPanel.test.tsx", "docs/architecture/item-catalog-matrix.md", "docs/development/weapon-profile-simulation.md"]
---

# CDI-087 - Rendre le scaling des degats propre a chaque arme et introduire le DPS

## Objectif

Faire de la categorie offensive et de la statistique de scaling des
informations propres a chaque definition d arme.

Corriger les degats des profils qui utilisent principalement l Agilite, la
Dexterite, l Intelligence ou la Sagesse, sans lier definitivement un type
d arme a une seule categorie.

Introduire un DPS estime comme statistique derivee du heros et indicateur commun
d equilibrage des armes, sans l utiliser directement dans la resolution des
combats.

## Resultat utilisateur

Les Voleurs, Archers et utilisateurs d armes magiques exploitent reellement
leurs statistiques principales.

Une lance peut etre de Puissance ou de Finesse selon sa definition individuelle,
sans que son type impose automatiquement son scaling.

Le joueur peut identifier sur chaque arme :

- sa categorie offensive ;
- la statistique utilisee ;
- sa plage de degats ;
- sa vitesse ;
- le DPS estime de son heros avec l equipement actuel.

Le DPS est affiche comme une estimation de l attaque normale et non comme une
promesse de degats contre toutes les cibles.

## Contexte

La formule physique actuelle repose sur :

`2 + FOR x 1,3 + DEX x 0,4`.

L Agilite ne contribue pas aux degats et la Dexterite reste secondaire. Les
Voleurs et Archers possedent pourtant respectivement AGI/DEX et DEX/AGI comme
statistiques principales.

L attaque normale ajoute ensuite le jet de l arme a `physicalDamage`, sans
prendre en compte une categorie de scaling propre a l arme. Les competences du
Voleur et de l Archer utilisent egalement `physicalDamage`.

Les armes magiques peuvent infliger un type de degats magique tout en utilisant
encore la puissance physique pour leur attaque normale.

Les degats par coup ne suffisent pas pour comparer deux armes. Leur performance
depend egalement :

- de la vitesse d attaque de l arme ;
- de la vitesse du heros ;
- du nombre moyen de frappes ;
- des chances de critique ;
- de la plage de degats ;
- de la statistique utilisee pour le scaling ;
- des bonus physiques ou magiques.

Une mesure commune est donc necessaire pour comparer objectivement les armes de
Puissance, Finesse, Distance et Magiques.

## Perimetre autorise

### Scaling des armes

- Ajouter a chaque definition d arme une categorie offensive :
  - `power` ;
  - `finesse` ;
  - `ranged` ;
  - `magic`.
- Ajouter a chaque definition d arme sa statistique de scaling effective :
  - `str` ;
  - `agi` ;
  - `dex` ;
  - `int` ;
  - `wiz`.
- Stocker ces informations sur chaque arme, pas seulement sur son
  `weaponTypeId`.
- Autoriser plusieurs scalings pour un meme type d arme.
- Migrer toutes les armes existantes vers une valeur explicite.
- Valider les associations entre categorie et statistique.
- Centraliser la resolution du scaling dans le domaine partage.
- Utiliser le scaling de l arme pour les attaques normales.
- Faire suivre aux competences physiques basees sur `physicalDamage` la
  puissance fournie par l arme equipee.
- Utiliser la puissance magique pour l attaque normale d une arme magique.
- Utiliser la Force comme fallback pour une attaque sans arme.
- Preserver l independance entre scaling et types de degats.
- Recalculer les statistiques derivees apres un changement d arme.

### Profils de maniement

- Conserver `handedness` comme source du nombre de mains occupees et des regles
  d equipement.
- Ajouter un profil de combat explicite propre a chaque arme, sans champ de mode
  dupliquant `handedness`.
- Remplacer par ce profil la structure actuelle de resolution des frappes.
- Une arme a une main produit un coup garanti appliquant 100 % de la puissance.
- Une arme a deux mains produit un gros coup garanti appliquant 125 % de la
  puissance.
- Une arme jumelle produit deux coups garantis appliquant chacun 65 % de la
  puissance.
- Resoudre separement le jet de degats, le critique, les types de degats et la
  defense de chaque coup.
- Utiliser la vitesse uniquement pour une eventuelle frappe supplementaire
  apres les frappes garanties.
- Conserver un plafond absolu de trois frappes par action.
- Conserver une grande amplitude de degats pour les haches, en reduisant en
  priorite leur borne basse lorsqu une baisse de moyenne est necessaire.

### DPS estime

- Ajouter `estimatedDps` aux statistiques derivees du heros.
- Calculer cet indicateur depuis :
  - la puissance effective fournie par le scaling de l arme ;
  - la plage de degats de l arme ;
  - la vitesse d attaque de l arme ;
  - la vitesse du heros ;
  - le nombre moyen de frappes ;
  - les chances de critique ;
  - les bonus `physicalDamage` ou `magicDamage`.
- Recalculer le DPS lorsque les caracteristiques, les modificateurs ou
  l equipement du heros changent.
- Conserver `estimatedDps` dans `calculatedStats`.
- Accepter les sauvegardes historiques sans ce champ et le regenerer depuis les
  donnees canoniques.
- Afficher la valeur comme `DPS estime - attaque normale`.
- Expliquer que cette valeur correspond aux degats moyens attendus par cycle
  d attaque dans le moteur au tour par tour.
- Utiliser le DPS pour les tests, les outils internes et l equilibrage du
  catalogue.
- Garantir que le DPS estime ne devient jamais une entree de la resolution
  autoritaire du combat.
- Preserver la parite entre calcul client, affichage et autorite serveur.

## Hors perimetre

- Ajouter des coefficients de scaling statistique hybrides ou propres aux
  competences. Les coefficients de puissance par frappe du profil de
  maniement font partie du perimetre.
- Ajouter un scaling hybride utilisant plusieurs statistiques simultanement.
- Ajouter un scaling impose par chaque competence.
- Reequilibrer integralement les classes, monstres et competences.
- Modifier les defenses, resistances ou multiplicateurs critiques.
- Ajouter plus d une frappe supplementaire au-dela du profil de base.
- Rendre aleatoire la categorie d une instance d arme.
- Inferer la categorie depuis le nom de l arme.
- Inferer obligatoirement la categorie depuis `weaponTypeId`.
- Utiliser le DPS estime pour infliger les degats d un combat.
- Inclure les competences actives, le mana, les cooldowns ou une rotation de
  sorts dans la premiere version du DPS.
- Produire un DPS dependant d une cible, de sa defense ou de ses resistances.
- Modifier la consommation de RNG sans justification explicite.

## Contrat d'implementation

### Contrat de scaling

Chaque arme expose un scaling equivalent a :

`{ category: "power" | "finesse" | "ranged" | "magic", stat: "str" | "agi" | "dex" | "int" | "wiz" }`.

Les associations valides sont :

- `power` avec `str` ;
- `finesse` avec `agi` ;
- `ranged` avec `dex` ;
- `magic` avec `int` ou `wiz`.

La categorie sert aux regles generales et a l affichage. La statistique indique
la caracteristique effectivement utilisee par le calcul.

Le type d arme, le type de degats et le scaling restent trois informations
independantes.

Exemple d une lance de Puissance :

`{ weaponTypeId: "spear", scaling: { category: "power", stat: "str" } }`.

Exemple d une lance de Finesse :

`{ weaponTypeId: "spear", scaling: { category: "finesse", stat: "agi" } }`.

Exemple d un arc de feu :

`{ weaponTypeId: "longbow", scaling: { category: "ranged", stat: "dex" }, damageTypes: ["fire"] }`.

### Repartition initiale du catalogue

La repartition initiale est :

- Puissance/FOR :
  - epees ;
  - espadons ;
  - haches ;
  - haches doubles ;
  - masses ;
  - lances ;
  - batons bo ;
  - poings ;
  - gantelets.
- Finesse/AGI :
  - dagues ;
  - sabres ;
  - epees doubles legeres ;
  - sabres doubles ;
  - dagues doubles.
- Distance/DEX :
  - arcs courts ;
  - arcs longs ;
  - arbaletes ;
  - fusils ;
  - canons a engrenages.
- Magique/INT ou WIZ :
  - baguettes ;
  - batons magiques ;
  - grimoires ;
  - instruments.

Cette repartition initialise les armes existantes. Elle ne devient jamais une
regle runtime imposant le meme scaling a toutes les armes partageant un
`weaponTypeId`.

### Formule de puissance

La puissance de base suit la meme formule pour toutes les categories :

`floor(2 + statistique de scaling x 1,3)`.

Les armes physiques appliquent ensuite les modificateurs `physicalDamage`.

Les armes magiques appliquent les modificateurs `magicDamage`.

Les degats bruts d une attaque normale correspondent a :

`puissance effective + jet de degats de l arme`.

Le moteur applique ensuite, selon les regles existantes :

1. le critique ;
2. la repartition entre les types de degats ;
3. la defense ou les resistances de la cible.

Une attaque sans arme utilise la Force comme scaling par defaut.

### Contrat des profils de maniement

`handedness` reste responsable des contraintes d equipement. Le profil d attaque
reste responsable des frappes et de la puissance par frappe. Ces responsabilites
ne doivent pas etre melangees.

Chaque arme expose un profil equivalent a :

`{ baseStrikes: 1 | 2, powerPerStrike: number, maxStrikes: 3 }`.

Les profils standards sont :

- une main : `{ baseStrikes: 1, powerPerStrike: 1, maxStrikes: 3 }` ;
- deux mains : `{ baseStrikes: 1, powerPerStrike: 1.25, maxStrikes: 3 }` ;
- jumelles : `{ baseStrikes: 2, powerPerStrike: 0.65, maxStrikes: 3 }`.

Les degats bruts d un coup deviennent :

`floor(puissance effective x powerPerStrike) + jet de degats de l arme`.

Une arme jumelle effectue deux jets de degats et deux jets critiques. La
defense ou les resistances sont appliquees separement a chacun des deux coups.

La vitesse de l arme et celle du heros determinent uniquement la probabilite
d une frappe supplementaire au-dela de `baseStrikes`. Une attaque ne depasse
jamais `maxStrikes`, fixe a trois dans cette version.

Pour une arme jumelle, la plage de degats est appliquee a chaque coup. Les
haches conservent une plage large et un maximum eleve. Leur moyenne est ajustee
en abaissant prioritairement la borne minimale plutot qu en ecrasant leur
amplitude.

### Competences

Les competences physiques utilisant actuellement `physicalDamage` emploient la
puissance physique resolue depuis l arme equipee.

Ainsi :

- un Surin rapide avec une dague de Finesse utilise l AGI ;
- un Tir precis avec un arc utilise la DEX ;
- une competence physique avec une hache de Puissance utilise la FOR.

Une future competence pourra posseder un scaling propre dans un ticket
distinct. Ce ticket conserve un fonctionnement centre sur l arme.

### Notion de DPS

Le DPS constitue une statistique derivee, une projection d affichage et un
indicateur d equilibrage. Il ne constitue jamais une entree de la resolution du
combat.

Le moteur etant organise en tours plutot qu en secondes reelles, la premiere
version represente les degats moyens attendus par cycle d attaque.

Le nom technique retenu est `estimatedDps`. L interface affiche :

`DPS estime - attaque normale`.

Une aide contextuelle explique son unite et son perimetre.

Le calcul prend en compte :

- la puissance effective du heros avec son arme ;
- toutes les valeurs entieres possibles dans la plage de degats ;
- la probabilite de critique ;
- le multiplicateur critique et son arrondi reel ;
- la vitesse de l arme ;
- la vitesse du heros ;
- la limite actuelle de trois frappes par action.

Le nombre moyen de frappes part de `baseStrikes` puis ajoute au maximum une
frappe supplementaire selon la vitesse, sans jamais depasser `maxStrikes`.

Le dommage moyen d une frappe est calcule sur toute la plage de l arme. Pour
chaque valeur possible, le resultat normal et le resultat critique sont
ponderes separement.

Le calcul reproduit l arrondi `floor` utilise pour un critique reel afin que
l estimation reste alignee sur le moteur.

Le DPS estime initial exclut :

- la defense d une cible particuliere ;
- ses resistances et vulnerabilites ;
- les buffs et debuffs temporaires ;
- les competences actives ;
- les couts en mana ;
- les cooldowns ;
- les strategies de groupe.

Il mesure donc le potentiel durable de l attaque normale dans des conditions
neutres.

L estimateur est une fonction partagee, pure, deterministe et sans consommation
de RNG.

### Persistance et autorite

`estimatedDps` est ajoute a `calculatedStats`, mais reste une valeur
reconstructible.

Une sauvegarde historique sans ce champ reste valide. L autorite recalcule la
valeur depuis les caracteristiques, les modificateurs et l equipement.

Une valeur `estimatedDps` recue depuis le client ou presente dans un ancien
snapshot ne doit jamais etre utilisee pour resoudre un combat.

La resolution autoritaire continue de calculer les degats depuis :

- les statistiques canoniques ;
- l arme equipee ;
- ses modificateurs ;
- le RNG canonique ;
- les defenses et resistances de la cible.

Modifier artificiellement `estimatedDps` ne doit donc avoir aucune incidence
sur un combat.

## Dependances

Aucune dependance bloquante n est identifiee.

L implementation doit rester compatible avec les contrats canoniques existants
et ne pas anticiper les refontes structurelles differees.

Si une sauvegarde historique ne contient pas `estimatedDps`, sa compatibilite
depend uniquement de la capacite de l autorite a recalculer cette projection.
Aucune migration destructive ne doit etre necessaire.

## Criteres d'acceptation

### Scaling

- [x] Chaque definition d arme possede une categorie et une statistique.
- [x] Une arme invalide ou sans scaling est detectee par les validations.
- [x] Une lance de Puissance utilise la FOR.
- [x] Une lance de Finesse peut utiliser l AGI avec le meme `weaponTypeId`.
- [x] Les armes de Finesse utilisent l AGI.
- [x] Les armes a Distance utilisent la DEX.
- [x] Les armes magiques utilisent explicitement INT ou WIZ.
- [x] Sans arme, une attaque physique utilise la FOR.
- [x] Les attaques normales utilisent la puissance correspondant a l arme.
- [x] Les competences physiques du Voleur et de l Archer suivent l arme equipee.
- [x] Une arme magique n utilise plus la puissance physique pour son attaque
      normale.
- [x] Les bonus plats et en pourcentage restent appliques correctement.
- [x] Le type de degats reste independant du scaling.
- [x] Changer d arme recalcule les statistiques derivees.
- [x] Client et serveur autoritaire produisent le meme resultat.
- [x] Le combat reste deterministe et rejouable.

### Profils de maniement

- [x] `handedness` reste utilise uniquement pour les mains occupees et les
      regles d equipement.
- [x] `attackProfile` remplace l ancienne resolution des frappes sans dupliquer
      le mode de maniement ni creer de calcul concurrent.
- [x] Une arme a une main applique un coup a 100 % de puissance.
- [x] Une arme a deux mains applique un coup a 125 % de puissance.
- [x] Une arme jumelle applique deux coups garantis a 65 % de puissance chacun.
- [x] Chaque coup jumelle possede son propre jet de degats et de critique.
- [x] La defense ou les resistances sont appliquees separement a chaque coup.
- [x] La vitesse ne remplace plus les frappes garanties du profil.
- [x] Une seule frappe bonus peut etre ajoutee par la vitesse.
- [x] Une attaque ne depasse jamais trois frappes.
- [x] Les haches conservent une plage de degats plus large et un maximum eleve.

### DPS

- [x] `estimatedDps` est une statistique derivee du heros.
- [x] Un DPS estime est calculable pour chaque arme du catalogue.
- [x] Il utilise le scaling individuel de l arme.
- [x] Il tient compte de la plage de degats, de la vitesse, des frappes
      supplementaires et des critiques.
- [x] Il reproduit les arrondis pertinents du moteur.
- [x] Il est recalcule apres tout changement d arme ou de caracteristiques.
- [x] Il permet de comparer les quatre categories sur une mesure commune.
- [x] Il est affiche avec le perimetre `attaque normale`.
- [x] L interface explique qu il est normalise par cycle d attaque.
- [x] Une sauvegarde historique sans ce champ reste compatible.
- [x] Son calcul est pur, stable et ne consomme aucun RNG.
- [x] Il n intervient dans aucune decision ni resolution de combat.
- [x] Une valeur falsifiee ne change pas le resultat autoritaire.
- [x] Les tests du catalogue exposent les principaux ecarts et valeurs
      aberrantes sans imposer silencieusement un equilibrage non valide.

### Qualite globale

- [x] Les changements de golden tests sont inventories et justifies.
- [x] Aucun calcul concurrent du scaling ou du DPS n est duplique entre client
      et serveur.
- [x] Aucun ecart reel de gameplay n est laisse sans correction ou tracage.

## Tests

Ajouter ou adapter les tests couvrant au minimum :

### Catalogue et contrat

- presence d un scaling sur toutes les armes ;
- validation de chaque association categorie/statistique ;
- rejet des associations invalides ;
- deux armes partageant un `weaponTypeId` avec des scalings differents ;
- chargement d un snapshot historique sans `estimatedDps`.

### Calcul des degats

- arme de Puissance utilisant la FOR ;
- arme de Finesse utilisant l AGI ;
- arme a Distance utilisant la DEX ;
- arme Magique utilisant l INT ;
- arme Magique utilisant la WIZ ;
- attaque sans arme ;
- bonus physiques et magiques plats ;
- bonus physiques et magiques en pourcentage ;
- competence physique du Voleur ;
- competence physique de l Archer ;
- attaque normale d une arme magique.

### DPS

- plage de degats fixe ;
- plage de degats variable ;
- critique a 0 %, valeur intermediaire et 100 % ;
- reproduction de l arrondi critique ;
- seuil produisant une frappe ;
- seuil produisant deux frappes ;
- seuil produisant trois frappes ;
- respect du plafond de trois frappes ;
- recalcul apres changement d arme ;
- recalcul apres changement de caracteristique ;
- comparaison d une arme de chaque categorie ;
- lance de Finesse variant avec l AGI et non la FOR ;
- absence de consommation RNG ;
- absence d utilisation du DPS pendant la resolution du combat ;
- matrice lisible des DPS du catalogue pour l equilibrage.

### Profils de maniement

- une main : un coup a 100 % ;
- deux mains : un coup a 125 % ;
- jumelles : deux coups garantis a 65 % ;
- critiques independants des deux coups jumelles ;
- defense appliquee separement aux deux coups ;
- frappe bonus de vitesse apres les coups garantis ;
- plafond absolu de trois coups ;
- parite entre le combat reel, l estimateur tactique et le DPS ;
- matrice groupee par rarete, niveau requis et maniement ;
- preservation de l amplitude des haches apres ajustement de leur moyenne.

### Interface

- affichage de la categorie ;
- affichage de la statistique de scaling ;
- affichage de `DPS estime - attaque normale` ;
- explication de l unite et du perimetre ;
- mise a jour apres changement d equipement.

### Commandes non interactives

- `npm.cmd run board:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`

## Validation manuelle

Aucun parcours manuel long n est requis pour cloturer ce ticket. Il est
remplace par la simulation automatisee documentee dans
`docs/development/weapon-profile-simulation.md`.

Commande executee :

`npm.cmd run test:weapon-simulation`

Resultat : trois scenarios sur trois reussis. La simulation utilise les vraies
autorites de ville et de donjon ainsi que le rendu React du panneau Heros. Elle
couvre les regles une main, deux mains et armes jumelles, les critiques et la
defense par frappe, le recalcul des statistiques et la mise a jour du DPS et du
profil affiches.

## Preservation

- Preserver l autorite serveur.
- Preserver le format des instances stockees lorsque leur reference catalogue
  suffit.
- Preserver les types de degats existants.
- Preserver les defenses, resistances et vulnerabilites.
- Preserver les multiplicateurs critiques et leurs arrondis.
- Remplacer les anciennes regles de frappes par le profil valide et preserver
  le plafond absolu de trois frappes.
- Preserver revision, idempotence et replay.
- Preserver la compatibilite des sauvegardes historiques.
- Ne pas inferer le scaling depuis le nom de l arme.
- Ne pas imposer le scaling depuis `weaponTypeId`.
- Ne pas dupliquer les formules entre frontend et backend.
- Ne pas utiliser `estimatedDps` pour resoudre un combat.
- Ne pas ecrire de donnee sensible dans les tests ou journaux.
- Ne pas ecraser les modifications utilisateur existantes.

## Risques

- L AGI augmente deja la vitesse et l esquive. Son utilisation pour les degats
  peut amplifier fortement le DPS des armes de Finesse.
- La DEX augmente deja les chances de critique et peut egalement produire un
  double benefice offensif.
- Les armes magiques peuvent devenir trop fortes si leur attaque normale et
  leurs competences profitent simultanement des memes bonus.
- Le changement peut modifier de nombreux golden tests.
- Une arme oubliee pendant la migration pourrait produire un fallback
  silencieux.
- Un calcul different entre statistiques affichees et combat autoritaire
  creerait un ecart visible.
- Le terme DPS peut etre mal interprete dans un moteur au tour par tour si son
  unite n est pas clairement affichee.
- Une estimation limitee a l attaque normale ne represente pas le potentiel
  complet d une classe utilisant beaucoup de competences.
- Une valeur persistee mais reconstructible pourrait devenir obsolete si elle
  n est pas recalculee apres chaque mutation pertinente.
- Des seuils d equilibrage trop stricts pourraient figer le catalogue avant
  observation du gameplay reel.
- Deux coups jumelles a pleine puissance produiraient un scaling total de 200 %
  et rendraient le profil dominant ; le coefficient de 65 % par coup doit etre
  partage par le combat et le DPS.
- Appliquer la defense une seule fois au total jumelle supprimerait sa faiblesse
  naturelle face aux cibles protegees.
- Reduire uniformement les deux bornes des haches pourrait detruire leur
  identite de forte variance.

## Handoff

Fournir :

- la liste complete des armes et de leurs scalings ;
- les exceptions partageant un type avec des categories differentes ;
- la formule partagee de puissance ;
- la formule partagee de DPS estime ;
- la convention d unite par cycle d attaque ;
- les adaptations du combat autoritaire ;
- les adaptations des competences physiques ;
- les adaptations de l interface ;
- la strategie de compatibilite des sauvegardes ;
- la matrice comparative des DPS du catalogue ;
- les valeurs anormalement fortes ou faibles observees ;
- les changements de golden tests et leur justification ;
- les preuves de typecheck, lint, tests, determinisme et build ;
- les instructions et resultats de validation manuelle.
- la structure `attackProfile` ayant remplace l ancienne resolution des frappes ;
- la preuve que `handedness` reste la source des contraintes d equipement ;
- la matrice DPS par rarete, niveau requis et maniement ;
- les ajustements de plages effectues sur les haches et leur justification.

### Realisations et preuves

- Scaling et statistique stockes sur chaque arme avec validation canonique.
- `handedness` conserve pour l equipement et `attackProfile` utilise pour le
  combat, sans resolution concurrente.
- Profils appliques : une main `1 x 100 %`, deux mains `1 x 125 %`, jumelles
  `2 x 65 %`, avec au plus une frappe bonus et trois frappes au total.
- Critique, jet d arme, types de degats et defense resolus par frappe.
- `estimatedDps` derive, persiste, regenere pour les sauvegardes historiques et
  exclu de la resolution autoritaire.
- Affichage aligne dans Heros, Stockage, Ville et Donjon.
- Matrice du catalogue regeneree par rarete, niveau requis et maniement ; les
  haches jumelles conservent une plage large.
- Simulation automatisee : 3 scenarios sur 3 reussis.
- Suite complete : 53 fichiers et 500 tests reussis.
- Typecheck, lint, controle du diff, determinisme, validation workboard et
  build de production reussis.
- Build : avertissement non bloquant conserve pour le chunk vendor existant de
  558,72 kB.
