# Plan fonctionnel — segments de donjon, héros KO et jalons

Date : 2026-09-09
Statut : corrections implémentées et validations automatisées réussies ;
validation visuelle finale par l'utilisateur à réaliser

## 1. Objectif

Empêcher qu'un joueur contourne les conséquences d'un KO en réaffectant ou en
remplaçant un héros pendant une expédition, tout en permettant à une salle de
repos de ranimer les héros KO appartenant au segment en cours.

Le système doit rendre les jalons des étages 5, 10, 15, etc. explicites et en
faire les points de décision entre la poursuite avec la même équipe et le
retour en ville.

## 2. Comportement initial caractérisé avant correction

- Une rencontre verrouillait temporairement la composition via
  `currentEncounter`.
- Entre deux rencontres, ce verrou disparaissait.
- Un héros mis KO passait à `0 PV`, devenait inactif et partait au
  repos.
- Dès qu'il récupérait au moins `1 PV`, la commande `hero.activity` pouvait le
  réaffecter entre deux rencontres.
- La synchronisation de l'équipe recalculait le checkpoint commun, mais aucun
  état ne mémorisait l'appartenance au segment ni le KO subi pendant celui-ci.
- Les salles de repos soignaient les héros actifs et vivants ; elles ignoraient
  les héros à `0 PV`.
- Les jalons fixes sont situés tous les cinq étages.
- La progression personnelle et les reçus de première victoire sont déjà
  suivis par héros.

## 3. Définitions fonctionnelles

### 3.1 Segment

Un segment est la traversée comprise entre deux jalons :

- étages 1 à 5 ;
- étages 6 à 10 ;
- étages 11 à 15 ;
- et ainsi de suite jusqu'à l'étage 50.

Pour un départ depuis la ville, le segment commence au lancement de sa première
salle. La sélection d'un étage ou la préparation de l'équipe ne verrouille pas
encore la composition.

Après un jalon, la confirmation explicite `Continuer avec la même équipe`
engage directement ce roster dans le segment suivant. Cette transition ne
repasse pas par une phase de recomposition.

### 3.2 Équipe du segment

L'équipe du segment est la liste autoritaire des héros engagés au lancement de
la première salle. Elle est distincte de la seule notion historique
`isActive`.

Un emplacement reste réservé à son héros pendant tout le segment, même si ce
héros tombe KO.

### 3.3 Héros KO

Un héros KO :

- reste membre de l'équipe du segment ;
- reste visible dans son emplacement ;
- ne participe plus aux combats ou épreuves tant qu'il est KO ;
- ne peut pas être remplacé ;
- ne récupère pas passivement en ville tant que le segment continue ;
- peut être ranimé par une salle de repos.

Tant que le segment ou sa décision de jalon existe, son statut fonctionnel
reste celui d'un membre de l'expédition. Il ne doit pas passer dans un état de
repos en ville susceptible de déclencher la récupération passive. Le marqueur
KO du segment prime sur la valeur courante de `currentHp` pour déterminer son
droit à participer.

### 3.4 Phases et participants

Les phases fonctionnelles sont les suivantes :

1. **Préparation** : aucune équipe de segment n'est encore capturée. Le joueur
   peut composer et équiper son groupe.
2. **Segment en cours** : le roster est capturé et verrouillé.
3. **Décision de jalon** : le segment précédent est terminé, mais son roster et
   ses KO restent figés jusqu'au choix `Continuer` ou `Retourner en ville`.
4. **Ville** : aucun segment n'est actif et la gestion des héros est libre.

Deux ensembles ne doivent pas être confondus :

- les **membres du segment**, dont les emplacements restent réservés ;
- les **participants d'une rencontre**, qui sont les membres opérationnels au
  lancement de cette rencontre.

Un héros déjà KO avant un combat n'en est pas participant. Un héros qui tombe
KO pendant le combat reste participant de cette rencontre. Une salle de repos
constitue une exception ciblée : elle traite tous les membres du segment pour
les soins, puis détermine les bénéficiaires de son XP après les réanimations.

## 4. Règles fonctionnelles validées

### 4.1 Verrouillage du groupe

- La composition est figée dès le lancement de la première salle du segment.
- Aucun membre ne peut être ajouté, retiré ou remplacé pendant le segment.
- Les actions d'équipement, de déséquipement, de renvoi et de changement de
  vocation sont verrouillées pour les seuls membres du segment.
- Les héros restés en ville restent entièrement gérables.
- Le recrutement d'un nouveau héros reste possible, mais ce héros ne peut pas
  rejoindre le segment en cours.

Matrice autoritaire attendue :

| Action | Préparation | Segment en cours | Décision de jalon | Ville |
|---|---:|---:|---:|---:|
| Ajouter ou retirer un membre | autorisé | refusé | refusé | autorisé |
| Équiper ou déséquiper un membre du segment | autorisé | refusé | refusé | autorisé |
| Renvoyer un membre du segment | autorisé | refusé | refusé | autorisé |
| Choisir sa vocation | autorisé | refusé | refusé | autorisé |
| Gérer un héros resté en ville | autorisé | autorisé | autorisé | autorisé |
| Recruter un héros | autorisé | autorisé | autorisé | autorisé |
| Lancer une nouvelle salle | autorisé si équipe valide | autorisé | refusé | refusé avant préparation |
| Continuer ou rentrer au jalon | sans objet | sans objet | autorisé | sans objet |

Les refus doivent être produits par l'autorité serveur, même si l'interface a
déjà désactivé l'action. Une raison métier stable doit être projetée dans
l'interface ; la proposition est `EXPEDITION_PARTY_LOCKED` pour les mutations
de membres et `CHECKPOINT_DECISION_REQUIRED` pour une tentative d'exploration
avant la décision. Une commande refusée ne modifie ni l'état canonique ni le
RNG et ne produit aucun événement métier de réussite.

### 4.2 KO et salle de repos

- Lorsqu'un héros tombe KO, sa place reste occupée.
- Une salle de repos ranime tous les membres KO du segment.
- Chaque héros ranimé revient à `max(1, round(PV max × 20 %))` PV, plafonné à
  son maximum. Il récupère aussi `max(1, round(PM max × 20 %))` PM, ajouté à
  ses PM courants et plafonné à son maximum ; un héros sans réserve de PM reste
  à `0 PM`. Cet arrondi conserve la règle canonique actuelle des salles de
  repos.
- Les soins sont appliqués avant le calcul des bénéficiaires de l'XP de repos.
- Le héros ranimé reçoit donc également l'XP attribuée par la salle de repos et
  compte dans le nombre de bénéficiaires utilisé pour partager cette XP.
- Il redevient automatiquement opérationnel et participe à partir de la salle
  suivante.
- La salle de repos ne permet aucune recomposition manuelle.
- Une salle de repos ne peut être atteinte que si au moins un membre est encore
  opérationnel ; un groupe entièrement KO déclenche déjà le wipe.

### 4.3 Progression et récompenses d'un héros KO

Si le héros faisait partie des participants au début d'une rencontre remportée
et tombe KO pendant celle-ci :

- la rencontre est créditée au héros ;
- l'étage n'est validé pour lui que si cette rencontre terminait la dernière
  salle de l'étage ;
- le jalon n'est validé que si cette rencontre terminait la dernière salle d'un
  étage multiple de cinq ;
- sa récompense personnelle de première victoire est attribuée dans ce même cas
  uniquement si elle n'avait jamais été obtenue ;
- il ne reçoit pas l'XP de combat ordinaire réservée aux héros encore debout ;
- l'exception validée est la salle de repos : s'il y est ranimé, il reçoit son
  XP de repos.

### 4.4 Jalon atteint en mode progression

Après la victoire finale d'un étage multiple de cinq :

- l'exploration se met en pause ;
- aucune guérison automatique n'est appliquée ;
- un état de décision persistant est enregistré ;
- le joueur peut consulter les autres écrans, mais aucune nouvelle exploration
  ne peut commencer avant sa décision.

L'information de jalon doit afficher clairement :

- le numéro du jalon atteint ;
- l'état de chaque membre, notamment les héros KO ;
- les vocations disponibles ;
- les conséquences de chaque choix.

Les deux choix sont :

1. **Continuer avec la même équipe** :
   - le segment terminé est clôturé et exactement le même roster est
     immédiatement engagé dans le segment suivant, à l'étage suivant, salle 1 ;
   - aucune recomposition n'est possible ;
   - les héros KO restent KO et conservent leur place ;
   - ils pourront revenir grâce à une future salle de repos ;
   - si l'exploration automatique était active avant le jalon, elle reprend
     après confirmation.
2. **Retourner en ville et gérer l'équipe** :
   - le segment se termine ;
   - l'équipe quitte le donjon ;
   - les marqueurs d'appartenance au segment et de KO dans le segment sont
     supprimés ;
   - tous les anciens membres sont retirés de l'équipe active ;
   - un héros blessé ou KO passe en récupération en ville, tandis qu'un héros
     déjà à ses maximums redevient disponible ;
   - aucune guérison instantanée n'est accordée ;
   - la récupération normale en ville reprend ;
   - la composition, l'équipement et les vocations redeviennent modifiables.

Il n'existe pas de troisième action de recomposition directe au checkpoint :
modifier l'équipe impose le retour en ville.

Cette pause ne s'applique pas au mode farm. À l'étage 50, l'action
`Continuer avec la même équipe` n'est pas proposée : le retour en ville est
obligatoire.

Depuis le bandeau global, un clic sur `Play` pendant cette décision applique
la règle suivante :

- si l'exploration automatique était active avant le jalon, qu'aucun membre du
  segment n'est KO, qu'aucun n'a de vocation en attente et que le jalon est
  antérieur à l'étage 50, la poursuite avec la même équipe est confirmée et
  l'exploration automatique reprend ;
- si l'exploration était manuelle, si un membre est KO, si un membre a une
  vocation en attente ou si l'étage 50 est terminé, le joueur est dirigé vers
  l'écran Donjon sans qu'aucune décision soit prise automatiquement.

Le détail de la décision reste exclusivement présenté dans l'écran Donjon ; le
bandeau global n'est pas agrandi pour l'accueillir.

### 4.5 Vocation disponible

- Une vocation acquise pendant un segment reste en attente.
- Elle ne déclenche pas de bandeau immédiat en mode progression.
- Au prochain jalon, l'alerte indique très visiblement le ou les héros pouvant
  choisir une vocation.
- Le bouton de retour en ville est mis en avant, mais continuer reste autorisé.
- Sous l'action de poursuite, le texte précise que la vocation restera en
  attente jusqu'au retour en ville.
- Si le joueur continue, le rappel réapparaît à chaque jalon.
- Le choix de la vocation ne peut être effectué qu'en ville.

Exemple de message :

> Vocation disponible pour Aldric : retournez en ville pour la choisir.

### 4.6 Retrait volontaire

- Le joueur peut ordonner un retour en ville avant le prochain jalon.
- Si une rencontre est en cours, elle est abandonnée sans récompense ni
  progression.
- Toute l'équipe quitte le segment ; il ne s'agit pas du retrait individuel
  d'un membre.
- Le dernier checkpoint commun acquis reste la base du prochain départ.
- Les marqueurs de segment sont supprimés et les statuts de ville sont
  réappliqués comme lors d'un retour depuis un jalon.

### 4.7 Wipe complet

- Si tous les membres opérationnels sont KO, l'expédition s'arrête
  immédiatement.
- Aucune salle de repos ultérieure ne peut être tirée après le wipe.
- Toute l'équipe retourne en ville et reprend les règles normales de
  récupération.
- La composition redevient modifiable.

### 4.8 Nouveau départ depuis la ville

- Tout héros ayant au moins `1 PV` peut être sélectionné.
- Partir avec un héros blessé reste un choix assumé du joueur.
- Le nouveau segment se verrouille seulement au lancement de sa première
  salle.
- Le point de départ est le premier étage suivant le checkpoint commun de
  l'équipe sélectionnée. Ajouter un héros moins avancé peut donc abaisser le
  point de départ, sans modifier la progression personnelle déjà acquise par
  les autres héros.

### 4.9 Mode farm

- La composition est verrouillée pour toute la session de farm.
- Les jalons traversés en farm ne mettent pas automatiquement l'exploration en
  pause.
- Les salles de repos peuvent ranimer les membres KO selon les mêmes règles que
  le mode progression.
- Le groupe redevient modifiable uniquement après un arrêt volontaire ou un
  wipe.
- Une vocation obtenue par un membre de la session de farm affiche uniquement
  dans l'écran Donjon une information non bloquante : « Vocation disponible —
  arrêtez le farm pour retourner en ville ».
- Cette information n'est accompagnée d'aucune notification globale ni d'aucun
  marqueur sur la navigation. Une vocation en attente pour un héros resté en
  ville n'y apparaît pas.
- Le farm continue tant que le joueur ne décide pas de l'arrêter.
- La fin d'une boucle de zone et les étages multiples de cinq ne créent aucune
  phase de décision de jalon en farm.
- Une autre zone de farm ne peut pas être sélectionnée pendant la session. Le
  joueur doit d'abord arrêter le farm et retourner en ville, puis sélectionner
  la nouvelle zone pour ouvrir une nouvelle session.

### 4.10 Étage 50

- Après la victoire de progression à l'étage 50, le retour en ville est
  obligatoire.
- Une zone de farm ne peut être sélectionnée qu'après ce retour.
- Les règles personnelles de validation et de récompense restent applicables
  aux participants, y compris à un héros tombé KO pendant la rencontre gagnée.

## 5. Présentation attendue

### 5.1 Héros KO

Le héros reste affiché dans son emplacement avec :

- un rendu assombri ;
- un marqueur KO très visible ;
- le texte « KO — attend une salle de repos » ;
- aucune duplication dans la liste des réservistes ;
- les actions incompatibles désactivées avec une raison accessible.

### 5.2 Décision de jalon

La décision est persistante et non contournable par un changement d'onglet.
Elle doit présenter :

- `Jalon N atteint` ;
- une synthèse des membres opérationnels et KO ;
- une section dédiée aux vocations en attente ;
- l'action principale `Retourner en ville et gérer l'équipe` lorsqu'une
  vocation est disponible ;
- l'action secondaire `Continuer avec la même équipe` ;
- un texte expliquant le maintien des KO et des vocations en attente en cas de
  poursuite.

Après un rechargement ou un changement d'onglet, la même décision et les mêmes
informations doivent réapparaître. Une fermeture visuelle éventuelle ne vaut
jamais décision et ne déverrouille pas l'exploration.

### 5.3 Actions verrouillées

Dans la fiche d'un membre du segment, une information compacte unique indique
« Équipe verrouillée pendant l'expédition ». Elle explique collectivement les
actions de renvoi, d'équipement et de déséquipement désactivées. Le message
ciblé déjà présent dans le coffre est conservé. Aucun texte supplémentaire
n'est ajouté à chaque bouton.

## 6. Modèle technique proposé

Cette section est une direction d'implémentation, pas une extension du contrat
produit.

- Ajouter à l'expédition une liste autoritaire ordonnée des membres du segment.
- Ajouter une liste ou un état autoritaire des membres KO du segment.
- Ajouter une phase explicite `preparing`, `running` ou
  `checkpoint_decision`. Le mode farm utilise `running` sans passer par
  `checkpoint_decision` aux étages multiples de cinq.
- Persister le fait que l'exploration automatique était active avant la pause
  de jalon.
- Ajouter une commande autoritaire de décision de jalon, par exemple
  `dungeon.checkpoint_decide({ decision: "continue" | "return_to_town" })`.
- Centraliser dans le domaine partagé les règles :
  - appartenance au segment ;
  - possibilité de muter un héros ;
  - transition vers le KO ;
  - réanimation par repos ;
  - fin de segment ;
  - décision de jalon.
- La politique pure de mutation renvoie une autorisation ou un refus accompagné
  d'un code métier stable. Le backend et la projection optimiste consomment la
  même décision ; le modèle de présentation traduit séparément le code en
  message français et React se limite à l'afficher.
- Dériver le type des commandes manipulées par l'autorité du donjon depuis le
  type canonique avec `Extract`. Ne conserver localement que les données
  internes à l'exécution.
- Ne pas faire de `isActive` l'unique source de vérité de l'équipe du segment.
- Utiliser le roster ordonné du segment pour les emplacements de présentation,
  y compris lorsqu'un héros est KO.
- Utiliser uniquement les membres opérationnels pour constituer les
  participants des combats et épreuves.
- Utiliser tous les membres du segment pour la phase de soins d'une salle de
  repos, puis les membres opérationnels après soin pour son partage d'XP.

Invariants canoniques à faire respecter par la validation et les migrations :

- le roster du segment est ordonné, sans doublon, limité à la capacité du
  groupe et ne référence que des héros existants ;
- les identifiants KO forment un sous-ensemble du roster du segment ;
- `preparing` ne contient ni roster engagé ni KO de segment ;
- `running` possède un roster engagé non vide ;
- `checkpoint_decision` n'existe qu'en progression, après un étage multiple de
  cinq, et conserve le roster du segment terminé jusqu'à la décision ;
- les participants mémorisés d'une rencontre sont un sous-ensemble des membres
  opérationnels au lancement de cette rencontre ;
- un retour en ville, volontaire, imposé ou causé par un wipe annule la
  rencontre courante et vide le roster et les KO du segment ;
- toute donnée incohérente est refusée à l'écriture et normalisée de façon
  déterministe lors d'une migration, sans inventer d'appartenance ou de KO.

Les noms exacts des champs et commandes seront choisis pendant
l'implémentation en respectant les contrats canoniques existants.

## 7. Migration des sauvegardes existantes

Les sauvegardes créées avant ce modèle ne permettent pas d'identifier avec
certitude un ancien membre KO d'un segment.

Règle déterministe validée :

- ne pas inventer d'ancien membre KO ;
- annuler une éventuelle rencontre historique en cours sans récompense,
  progression, événement de victoire ni consommation de RNG ;
- désactiver l'exploration automatique ;
- arrêter prudemment le mode progression au premier étage suivant le dernier
  checkpoint commun vérifiable des héros actifs et vivants ;
- si aucun héros actif et vivant ne permet d'établir ce checkpoint commun,
  revenir au checkpoint `0`, étage `1` ;
- arrêter une ancienne session de farm et revenir en ville en conservant les
  progressions personnelles et les zones déjà débloquées ;
- ouvrir uniquement la phase `preparing`, avec un roster de segment et une
  liste de KO vides ;
- conserver comme présélection les héros actifs et vivants lorsque leurs
  données sont valides, sans les considérer comme déjà engagés ;
- permettre au joueur de reformer son équipe sans perdre un jalon acquis ;
- laisser les héros historiques déjà inactifs ou à `0 PV` dans leur état de
  ville, sans supposer qu'ils appartenaient à l'expédition ;
- ne consommer aucun RNG pendant la migration.

## 8. Stratégie de harness avant implémentation

Le harness doit utiliser les vraies commandes autoritaires et le vrai
résolveur de donjon. Il ne doit pas recréer un moteur parallèle. Les rencontres
aléatoires sont pilotées avec un RNG déterministe ou une bande de tirages
contrôlée.

### 8.1 Socle du harness

- Construire une équipe déterministe de quatre héros.
- Pouvoir positionner l'expédition à une salle et un étage donnés.
- Pouvoir forcer une rencontre de combat, une victoire, un KO, une salle de
  repos, un jalon, un wipe et une vocation en attente.
- Exécuter les commandes canoniques complètes : exploration, résolution,
  activité, équipement, vocation, retrait, reprise et décision de jalon.
- Vérifier à la fois l'état canonique et les événements produits.

### 8.2 Caractérisation initiale

Avant la correction, écrire une preuve reproduisant le défaut actuel :

1. démarrer un segment ;
2. mettre un héros KO ;
3. laisser une période sans rencontre active ;
4. lui rendre au moins `1 PV` selon le comportement historique ;
5. envoyer `hero.activity(active: true)` ;
6. constater que la réaffectation est acceptée alors qu'aucune règle de segment
   ne l'autorise.

Cette caractérisation doit ensuite être remplacée ou inversée par le contrat
corrigé.

La caractérisation historique est isolée dans un test ciblé. Elle ne doit pas
rester comme une attente valide une fois le correctif implémenté.

### 8.3 Scénarios fonctionnels obligatoires

#### H01 — Verrouillage au bon moment

- La préparation reste modifiable avant la première salle.
- Le lancement de la première salle capture l'équipe et verrouille le segment.
- Après un jalon, `Continuer avec la même équipe` engage immédiatement le roster
  figé dans le segment suivant, sans fenêtre de recomposition.

#### H02 — KO sans remplacement

- Un membre tombe à `0 PV`.
- Il reste dans la liste du segment et dans son emplacement.
- Il ne participe plus aux rencontres.
- Toute tentative de l'enlever, de le réaffecter ou de le remplacer est
  refusée par l'autorité.

#### H03 — Mutations du membre verrouillées

- Équiper, déséquiper, renvoyer ou choisir une vocation pour un membre du
  segment échoue avec une erreur métier stable.
- Les mêmes actions restent possibles pour un héros resté en ville, y compris
  pendant une rencontre active du segment.

#### H04 — Repos sans KO

- Chaque membre opérationnel récupère les 20 % actuellement prévus, plafonnés
  à son maximum.
- L'XP de repos reste attribuée selon la politique canonique.

#### H05 — Repos avec un KO

- Tous les membres KO sont ranimés.
- Chacun revient à 20 % de ses PV maximum selon l'arrondi canonique.
- Chacun récupère 20 % de ses PM maximum selon l'arrondi canonique, sans
  dépasser son maximum.
- Chacun reçoit l'XP de repos.
- Le partage d'XP inclut les héros ranimés dans son nombre de bénéficiaires.
- Aucun ne combat rétroactivement dans la salle de repos.
- Tous participent à la salle suivante.

#### H06 — KO sans repos

- Le héros reste KO malgré le passage du temps tant que le segment continue.
- Le gel de la récupération reste actif pendant une décision de jalon, y
  compris après rechargement.
- Une récupération de ville ne peut pas le rendre combattant dans le segment.

#### H07 — Victoire avec un participant KO

- Le héros KO reçoit le crédit de la rencontre à laquelle il participait.
- Il ne valide l'étage que si la rencontre terminait sa dernière salle.
- Il ne valide le jalon que si la rencontre terminait un étage multiple de
  cinq.
- Dans ce même cas, il reçoit sa récompense personnelle de première victoire
  seulement si elle n'avait jamais été obtenue.
- Il ne reçoit pas l'XP de combat ordinaire.

#### H08 — Jalon sans KO

- La victoire de fin des étages 5, 10, 15, etc. ouvre une décision persistante.
- Toute nouvelle exploration est bloquée avant la décision.
- Les autres écrans restent consultables.

#### H09 — Jalon avec KO

- L'alerte décrit explicitement le héros KO.
- `Continuer` conserve le même groupe et le KO.
- `Continuer` ouvre le segment suivant à la salle 1 sans effacer le KO.
- `Retourner en ville` termine le segment sans soin instantané.
- Le retour supprime les marqueurs du segment et réactive ensuite la
  récupération de ville.

#### H10 — Vocation au jalon

- Une vocation acquise pendant le segment n'est pas choisissable immédiatement.
- Le prochain jalon affiche l'information et met en avant le retour en ville.
- Continuer reste possible.
- Le rappel revient au jalon suivant si la vocation est toujours en attente.

#### H11 — Reprise de l'automatisation

- Une exploration auparavant automatique reprend après `Continuer`.
- Une exploration auparavant manuelle reste manuelle.
- Au jalon, `Play` confirme directement la poursuite uniquement pour une
  exploration auparavant automatique, sans KO, sans vocation en attente dans
  le segment et avant l'étage 50.
- Dans tous les autres cas, `Play` dirige vers l'écran Donjon sans prendre la
  décision.

#### H12 — Retour volontaire entre deux salles

- Le segment se termine.
- Le checkpoint acquis est conservé.
- Le roster et les marqueurs KO du segment sont vidés.
- L'équipe retourne en ville et reprend la récupération normale.

#### H13 — Retour volontaire pendant une rencontre

- La rencontre est abandonnée.
- Aucun loot, aucune XP et aucune progression ne sont attribués.
- Le roster, les marqueurs KO et la rencontre courante sont vidés.
- Toute l'équipe retourne en ville.

#### H14 — Wipe complet

- L'expédition s'arrête immédiatement.
- Aucune rencontre suivante, notamment de repos, ne peut être tirée.
- Le roster, les marqueurs KO et la rencontre courante sont vidés sans soin
  instantané.
- La composition redevient modifiable en ville.

#### H15 — Nouveau départ blessé

- Un héros à `1 PV` peut être sélectionné.
- Le groupe reste modifiable jusqu'au lancement de la première salle.
- Il est ensuite capturé comme équipe du nouveau segment.

#### H16 — Farm avec KO et repos

- Le groupe reste verrouillé au passage des jalons de farm.
- Un KO conserve son emplacement.
- Une salle de repos le ranime normalement.
- Seul un arrêt volontaire ou un wipe déverrouille la composition.
- La fin d'une boucle de zone ne crée pas de décision de jalon.
- Changer de zone pendant la session est refusé ; la sélection d'une nouvelle
  zone n'est possible qu'après l'arrêt et le retour en ville.

#### H17 — Vocation en farm

- Le farm continue.
- Une information non bloquante apparaît uniquement dans l'écran Donjon, sans
  notification globale ni marqueur de navigation.
- Seules les vocations en attente des membres de la session de farm sont
  affichées.
- Le choix de vocation reste impossible jusqu'au retour en ville.

#### H18 — Fin de progression à l'étage 50

- Continuer directement en farm est impossible.
- Le retour en ville est obligatoire.
- La sélection d'une zone de farm devient ensuite disponible selon les règles
  personnelles existantes.

#### H19 — Migration d'une expédition historique

- Aucun membre KO n'est inventé.
- Le dernier checkpoint commun vérifiable est conservé.
- Sans héros actif et vivant exploitable, le fallback est le checkpoint `0`,
  étage `1`.
- La sauvegarde migrée est dans une phase sûre et modifiable.
- Une rencontre historique en cours est annulée sans récompense.
- Une ancienne session de farm revient en ville sans perdre les déblocages.
- Aucun RNG n'est consommé.

#### H20 — Rechargement et multi-onglet

- L'équipe du segment, les KO et la décision de jalon survivent au rechargement.
- Le harness unitaire conserve la preuve de déterminisme et de refus d'une
  seconde décision sur l'état déjà transitionné.
- Un test d'intégration séparé, exécuté sur le runtime Supabase local, prouve
  qu'une commande rejouée reste idempotente dans le pipeline persisté.
- Ce test prouve aussi que deux décisions concurrentes ne peuvent pas résoudre
  deux fois le jalon : une seule réussit et l'autre reçoit le conflit canonique
  attendu.

## 9. Suivi de la première implémentation

Cette checklist retrace le plan initial. Les cases dont la preuve doit être
renouvelée après l'audit sont volontairement décochées. Elle ne constitue plus
l'ordre à exécuter : le plan de correction autoritaire se trouve en section 12.

- [x] Écrire et exécuter le harness de caractérisation isolé du défaut.
- [x] Déclarer H01 à H20 dans le harness et les relier au présent contrat.
- [x] Tranche 1 : contrat canonique, migration et phases ; activer H01, H08,
  H11, H18, H19 et H20, constater leurs échecs puis les rendre verts.
- [x] Tranche 2 : roster verrouillé et matrice des mutations ; activer H02,
  H03, H12, H13 et H15, constater leurs échecs puis les rendre verts.
- [x] Tranche 3 : KO, repos, XP et wipe ; activer H04 à H07 et H14, constater
  leurs échecs puis les rendre verts.
- [x] Tranche 4 : vocation, présentation et farm ; activer H09, H10, H16 et
  H17, constater leurs échecs puis les rendre verts.
- [x] Adapter les projections optimistes sans dupliquer les règles métier.
- [x] Ajouter les modèles de présentation des états KO, jalon et vocation.
- [x] Adapter l'interface et les messages accessibles.
- [x] Valider les tests ciblés et le harness.
- [x] Valider les contrats, migrations, tests d'autorité et tests multi-onglet.
- [x] Exécuter typecheck, lint, suite complète, build et budget bundle.
- [ ] Faire réaliser la validation visuelle par l'utilisateur.
- [x] Effectuer l'audit fonctionnel pré-push.

### Preuves locales du 2026-09-09

- Dernier lot ciblé de correction : 6 fichiers, 60 tests réussis.
- Suite complète : 123 fichiers, 1 000 tests réussis.
- Pipeline Supabase local : replay exact d'une décision de jalon, une seule
  commande persistée, aucune double progression et une seule décision gagnante
  lors d'une concurrence ; test de limite temporelle également réussi.
- `npm.cmd run typecheck` : réussi.
- `npm.cmd run lint -- --quiet` : réussi.
- `npm.cmd run build` : réussi après relance hors sandbox ciblée ; la première
  tentative avait échoué au lancement d'esbuild avec `spawn EPERM`.
- `npm.cmd run check:bundle` : réussi, 246 937 octets gzip JavaScript et plus
  gros chunk à 121 584 octets.
- `git diff --check` ciblé : réussi ; seuls les avertissements de conversion
  LF vers CRLF du worktree Windows ont été signalés.

## 10. Critères de clôture

Le sous-lot ne peut être déclaré terminé que si :

- aucune commande autoritaire ne permet de remplacer ou de réaffecter un KO
  pendant son segment ;
- une salle de repos peut réellement ranimer tous les KO du segment ;
- les jalons imposent une décision persistante et compréhensible ;
- les vocations sont signalées selon le mode progression ou farm validé ;
- le retour, le wipe, le farm et l'étage 50 respectent le contrat ;
- les anciennes sauvegardes migrent sans perte de jalon ni consommation de RNG ;
- le harness déterministe et les validations techniques sont verts ;
- la validation visuelle utilisateur ne révèle aucun écart réel.

## 11. Audit post-implémentation et décisions

Cette section consigne les écarts relevés après la première implémentation.
Une décision marquée `validée` remplace, lorsqu'elles diffèrent, les modalités
précédemment envisagées dans ce document.

### E01 — Changement de zone pendant une session de farm

Statut : **validé — option B**.

Écart constaté : changer directement de zone pendant une session de farm
reconstruit l'expédition et efface les marqueurs KO. Un héros peut alors rester
à `0 PV`, toujours membre du segment, sans pouvoir récupérer passivement ni
être reconnu comme réanimable par une salle de repos.

Décision : il n'est plus permis de passer directement d'une zone de farm à une
autre. Le joueur doit arrêter la session et retourner en ville. Le segment est
alors clôturé selon les règles normales de retour, l'équipe redevient gérable,
puis une nouvelle zone peut être sélectionnée pour démarrer une nouvelle
session de farm.

### E02 — Gestion des héros restés en ville pendant une rencontre

Statut : **validé**.

Écart constaté : les anciens verrous fondés sur `currentEncounter` refusent
encore certaines mutations de héros qui ne font pas partie du segment.

Décision : seuls les membres du segment sont verrouillés pour l'équipement, le
déséquipement, le renvoi et le choix de vocation. Les héros restés en ville
demeurent gérables, y compris pendant une rencontre. Aucun héros extérieur ne
peut toutefois rejoindre l'équipe active tant que le segment continue.

### E03 — Action Play au moment d'un jalon

Statut : **validé**.

Décision : le bandeau global n'accueille pas le panneau détaillé du jalon.
Lorsqu'une décision de jalon est en attente, un clic sur `Play` applique la
règle suivante :

- si l'exploration automatique était active avant le jalon, que l'équipe ne
  contient aucun KO, qu'aucun de ses membres n'a de vocation en attente et que
  le jalon est antérieur à l'étage 50, `Continuer avec la même équipe` est
  exécuté directement puis l'exploration automatique reprend ;
- si l'exploration était manuelle avant le jalon, le clic sur `Play` dirige le
  joueur vers l'écran Donjon sans prendre automatiquement la décision ;
- si un membre est KO, si un membre a une vocation en attente ou si l'étage 50
  est terminé, aucune décision n'est prise automatiquement et le joueur est
  dirigé vers l'écran Donjon ;
- le panneau complet présent dans l'écran Donjon reste la source de détail et
  permet de choisir explicitement entre la poursuite et le retour en ville.

### E04 — Vocation obtenue pendant le farm

Statut : **implémenté et validé**.

Décision d'affichage : ne pas ajouter de notification globale ni de marqueur
sur la navigation. Le message de vocation reste uniquement affiché dans
l'écran Donjon et le farm continue sans interruption.

Correction appliquée : le message est calculé uniquement à partir des
membres de la session de farm. Une vocation en attente pour un héros resté en
ville ne doit pas être présentée comme une conséquence du farm en cours.

### E05 — Explication de la poursuite avec un héros KO

Statut : **écart accepté — aucun texte supplémentaire**.

Écart envisagé : le panneau indique qu'un héros KO conserve sa place sans
détailler qu'il restera indisponible jusqu'à une salle de repos.

Décision : conserver le libellé concis actuel. La conséquence est considérée
comme suffisamment déductible et un texte explicatif supplémentaire
alourdirait inutilement l'interface.

### E06 — Raison des actions désactivées

Statut : **validé**.

Écart constaté : dans la fiche d'un membre du segment, les actions de renvoi et
de déséquipement sont désactivées sans expliquer la cause du verrouillage.

Décision : afficher une information compacte unique, « Équipe verrouillée
pendant l'expédition », dans la fiche du héros concerné. Cette information
explique l'ensemble des actions désactivées sans ajouter une infobulle à chaque
bouton. Le message ciblé déjà présent dans le coffre est conservé.

### E07 — Renforcement des invariants canoniques

Statut : **validé avec réserve de proportionnalité**.

Écart constaté : le validateur accepte encore certaines combinaisons
impossibles que l'autorité normale ne produit pas, notamment un participant
déjà KO au lancement ou une décision dont la position ne correspond pas au
jalon mémorisé.

Décision : ajouter uniquement les contrôles de cohérence directs suivants :

- les participants d'une rencontre active sont des membres opérationnels et
  ne sont pas marqués KO ;
- la position de l'expédition correspond au jalon en attente ;
- la position globale correspond à celle de l'expédition ;
- l'auto-run est arrêté pendant la décision ;
- aucune rencontre active ne coexiste avec une décision de jalon.

La mesure est considérée comme légèrement excessive au regard du risque
actuel : son implémentation doit donc rester simple, sans nouveau mécanisme ni
refactor élargi.

### E08 — Centralisation des règles de verrouillage

Statut : **validé**.

Écart constaté : le backend, les projections optimistes et l'interface évaluent
séparément la phase et l'appartenance au segment, ce qui permet à leurs
comportements de diverger.

Décision : ajouter une politique pure dans le domaine partagé qui fournit, pour
une mutation donnée, l'autorisation ou le refus et un code métier stable. Le
backend et la projection optimiste consomment directement cette décision. Le
modèle de présentation traduit séparément le code en message destiné à
l'interface, puis React se limite à l'afficher.

Ce changement reste un refactor ciblé : le moteur de donjon, l'orchestration
autoritaire et le rendu React ne sont pas déplacés et aucun moteur parallèle
n'est créé.

### E09 — Source unique du type des commandes de donjon

Statut : **validé**.

Écart constaté : les commandes de donjon sont définies dans le contrat
canonique puis redéclarées dans l'autorité du donjon, ce qui crée un risque de
dérive entre les deux unions TypeScript.

Décision : dériver le type utilisé par l'autorité depuis le type canonique,
avec `Extract`, en ne conservant localement que les informations strictement
internes à l'exécution. Ce changement ne modifie aucune règle fonctionnelle.

### E10 — Compléter les scénarios partiellement couverts

Statut : **validé**.

Écart constaté : certains tests portant un identifiant Hxx ne prouvent qu'une
partie des critères décrits par le scénario correspondant.

Décision : compléter le harness existant avec les preuves ciblées suivantes :

- H03 : gestion d'un héros resté en ville pendant une rencontre active ;
- H04 et H05 : récupération exacte, plafonds, plusieurs KO et partage d'XP ;
- H06 : gel de la récupération pendant un jalon après rechargement ;
- H16 : obligation de retourner en ville avant de changer de zone de farm ;
- H17 : maintien du comportement d'affichage validé et filtrage des héros ;
- H19 : migration explicite d'une ancienne session de farm.

Ces ajouts utilisent les vraies commandes autoritaires et le harness existant ;
ils ne créent pas de moteur de simulation parallèle.

### E11 — Preuve réelle de rechargement, replay et concurrence

Statut : **implémenté et validé sur le runtime Supabase local**.

Écart initial : H20 appliquait deux fois une fonction pure au même
état. Cette preuve établit le déterminisme, mais pas l'idempotence du pipeline
persisté ni le comportement de deux onglets concurrents.

Décision : conserver le test déterministe existant et ajouter séparément un
test d'intégration du pipeline autoritaire qui vérifie :

- deux envois avec le même `commandId` et la même révision ;
- une seule transition persistée ;
- une seconde réponse identifiée comme replay ;
- aucune double progression ;
- deux décisions concurrentes dont une seule est acceptée, l'autre recevant le
  conflit canonique attendu.

Cette preuve dépend du runtime Supabase local. Sa commande et son objectif sont
documentés en C07 et elle ne fait pas partie du harness unitaire rapide.

### E12 — Mise à jour du statut et des cases du plan

Statut : **corrections et preuves automatisées consolidées ; clôture visuelle
en attente**.

Décision appliquée : les cases automatisées ont été recochées uniquement après
obtention de leurs preuves. La validation visuelle et la consolidation finale
restent explicitement ouvertes jusqu'à leur réalisation.

### E13 — Validation visuelle finale

Statut : **à réaliser avec l'utilisateur**.

Décision : réaliser la validation visuelle avec l'utilisateur après tous les
développements et tests automatisés, dans la même phase finale que la
consolidation du document. Aucun contrôle visuel intermédiaire n'est requis.

### E14 — Présentation d'un héros KO dans le segment

Statut : **correction appliquée et validation automatisée réussie**.

Écart constaté : le marqueur autoritaire empêchait bien la récupération en
ville, mais le journal de combat annonçait encore un retour aux dortoirs et les
fiches présentaient le héros comme étant « Au repos ».

Décision : conserver l'état interne compatible avec les données historiques,
mais présenter explicitement « KO en expédition » lorsque le héros appartient
aux KO du segment. Le journal indique désormais qu'il reste KO dans
l'expédition.

### E15 — Branchement du bouton global au jalon

Statut : **preuve ciblée ajoutée et validation automatisée réussie**.

Écart de preuve : les décisions de présentation, le composant et l'autorité
étaient testés séparément, sans preuve ciblée du routage utilisé par `App`.

Décision : extraire ce routage dans un helper d'orchestration léger utilisé par
`App` et vérifier les trois branches : contrôle auto-run, ouverture du Donjon
sans décision et continuation directe d'un jalon sûr.

## 12. Plan de correction exécuté et suivi de validation

Cette séquence est le plan d'exécution autoritaire. Elle n'étend pas le
périmètre fonctionnel validé dans E01 à E13. Les cases ne sont cochées qu'après
obtention de la preuve indiquée.

### C01 — Politique partagée et type canonique

- [x] Ajouter dans `shared/domain/dungeon-segment.ts` une politique pure de
  mutation qui renvoie une décision et un code métier stable, sans texte de
  présentation.
- [x] Faire consommer cette politique par l'autorité backend et par
  `src/domain/optimisticStateProjection.ts`.
- [x] Traduire les codes dans le modèle de présentation, sans déplacer la règle
  dans React.
- [x] Dériver dans `supabase/functions/game-api/dungeon-authority.ts` le type
  des commandes de donjon depuis le contrat canonique avec `Extract`.
- [x] Prouver par tests unitaires la parité backend/projection et l'absence de
  duplication de l'union de commandes.

Critères couverts : E08 et E09. Cette tranche précède C02 et C03.

### C02 — Cycle de session de farm

- [x] Refuser côté autorité `dungeon.select_farm_zone` lorsqu'une session de
  farm est engagée, sans modifier l'état ni le RNG.
- [x] Désactiver la sélection d'une autre zone dans l'interface jusqu'au retour
  en ville.
- [x] Conserver le message de vocation uniquement dans l'écran Donjon et le
  filtrer par les identifiants du roster de farm.
- [x] Compléter H16 et H17, y compris le retour en ville préalable et le cas
  d'une vocation en attente pour un héros extérieur au segment.

Critères couverts : E01, E04, H16 et H17.

### C03 — Gestion des héros et explication du verrou

- [x] Supprimer les refus historiques fondés uniquement sur
  `currentEncounter` pour le renvoi, la vocation et le changement d'activité
  d'un héros resté en ville.
- [x] Vérifier que l'équipement et le déséquipement d'un héros resté en ville
  demeurent autorisés pendant une rencontre active.
- [x] Conserver le refus d'ajouter un héros extérieur à l'équipe pendant un
  segment actif.
- [x] Afficher dans la fiche d'un membre verrouillé l'information unique
  « Équipe verrouillée pendant l'expédition » et conserver le message ciblé du
  coffre.
- [x] Compléter H03 pendant une rencontre active et tester le modèle de
  présentation ainsi que le rendu accessible.

Critères couverts : E02, E06 et H03. Aucun texte supplémentaire n'est ajouté
au panneau de poursuite avec un KO, conformément à E05.

### C04 — Action Play au jalon

- [x] Préparer hors de React la décision d'action du bandeau global à partir de
  `autoExploreBeforeCheckpoint`, des KO du segment, des vocations du segment et
  de l'étage du jalon.
- [x] Si toutes les conditions de poursuite automatique sont réunies, faire
  envoyer par `Play` la commande canonique `dungeon.checkpoint_decide` avec
  `continue`, puis laisser l'auto-run reprendre selon l'état canonique.
- [x] Dans chaque autre cas, faire naviguer `Play` vers l'écran Donjon sans
  envoyer de décision.
- [x] Tester les cinq branches : auto sans alerte, exploration manuelle, KO,
  vocation et étage 50.

Critères couverts : E03 et H11. Le bandeau global reste compact.

### C05 — Invariants canoniques ciblés

- [x] Refuser une rencontre dont un participant est absent du roster,
  non opérationnel ou déjà marqué KO.
- [x] Vérifier la cohérence entre le jalon en attente, la position de
  l'expédition et la position globale.
- [x] Exiger `autoExplore: false` et l'absence de rencontre active pendant une
  décision de jalon.
- [x] Ajouter les cas invalides correspondants dans
  `tests/authoritativeContracts.test.ts`, sans introduire de nouveau mécanisme
  de validation.

Critères couverts : E07.

### C06 — Compléments du harness déterministe

- [x] Compléter H04 et H05 avec les valeurs exactes, les plafonds, plusieurs KO
  et le partage d'XP après réanimation.
- [x] Compléter H06 avec un rechargement pendant la décision de jalon.
- [x] Compléter H19 avec la migration d'une ancienne session de farm.
- [x] Vérifier que les compléments H03, H16 et H17 réalisés dans C02 et C03
  couvrent toutes les assertions listées dans la section 8.
- [x] Conserver H20 unitaire comme preuve déterministe distincte de la preuve
  persistée.

Critères couverts : E10 et partie unitaire de E11.

### C07 — Pipeline Supabase réel

- [x] Étendre `scripts/test-temporal-concurrency.mjs` avec une décision de jalon
  réellement persistée.
- [x] Envoyer deux fois le même envelope, avec le même `commandId`, la même
  `idempotencyKey` et la même révision attendue ; vérifier une transition, puis
  une réponse `replayed: true`, sans double progression.
- [x] Envoyer deux décisions concurrentes distinctes depuis la même révision ;
  vérifier une réussite et un `REVISION_CONFLICT`.
- [x] Exécuter cette preuve uniquement contre le runtime Supabase local avec
  `npm.cmd run test:integration`.

Critères couverts : partie persistée et concurrente de E11. Ce test reste hors
du harness unitaire rapide et refuse déjà toute cible Supabase non locale.

Condition d'exécution acceptée : ce test remplit volontairement la fenêtre
locale de 60 commandes par minute afin d'en vérifier la frontière. Une relance
immédiate avec le même utilisateur local peut donc nécessiter d'attendre la fin
de cette minute. Ce comportement attendu du rate limiting n'est pas retenu
comme un écart et ne justifie aucune correction du jeu ou du harness.

### C08 — Validation et clôture documentaire

- [x] Exécuter le lot ciblé :
  `npm.cmd test -- --run tests/dungeonSegmentHarness.test.ts tests/dungeonAuthority.test.ts tests/townAuthority.test.ts tests/authoritativeContracts.test.ts tests/optimisticStateProjection.test.ts tests/dungeonPresentation.test.ts tests/DungeonProgressBanner.test.tsx tests/DungeonPanel.test.tsx tests/DungeonCheckpointDecision.test.tsx tests/HeroesPage.test.tsx tests/stateMigrations.test.ts`.
- [x] Exécuter `npm.cmd run test:integration` avec le runtime Supabase local.
- [x] Vérifier le routage du bouton global avec
  `tests/dungeonProgressBannerAction.test.ts`.
- [x] Exécuter le lot final ciblé :
  `npm.cmd test -- --run tests/heroPresentation.test.ts tests/DungeonPanel.test.tsx tests/dungeonSegmentHarness.test.ts tests/dungeonProgressBannerAction.test.ts tests/DungeonProgressBanner.test.tsx tests/HeroesPage.test.tsx`.
- [x] Exécuter `npm.cmd test -- --run`, `npm.cmd run typecheck`,
  `npm.cmd run lint -- --quiet`, `npm.cmd run build` et
  `npm.cmd run check:bundle`.
- [x] Réaliser l'audit fonctionnel pré-push : critères, oublis, régressions,
  compatibilité frontend, code mort et refactors injustifiés.
- [ ] Faire réaliser la validation visuelle finale par l'utilisateur.
- [ ] Mettre à jour en une passe le statut, les cases et les preuves de ce
  document.

Critères couverts : E12, E13 et critères de clôture de la section 10. Aucun
commit, push ou déploiement n'est inclus sans confirmation explicite séparée.
