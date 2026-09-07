# Prompt de référence — CDIdle, Dessous de la Cité et progression personnelle

## Mission
Mettre à jour uniquement le harness expérimental et sa documentation. Ne pas modifier le jeu, ouvrir de navigateur, publier ou committer. Réutiliser les règles métier canoniques ; isoler les variantes expérimentales dans les helpers et bundles en mémoire. Lire AGENTS.md. Préserver les modifications préexistantes.

## Décisions produit validées
1. Premier donjon : Les Dessous de la Cité, 50 étages. Égouts 1–10 ; Galeries des contrebandiers 11–20 ; Citernes oubliées 21–30 ; Bastion des Exclus 31–40 ; Cour du Roi des Rats 41–50.
2. Garder des rencontres solo, duo et trio dans chaque zone. Sans compétences adaptées, un groupe doit surtout prendre plus de temps à vaincre, avec un léger surcroît de dégâts subis, sans multiplication recherchée des wipes. Aucune classe ni compétence obligatoire. Les comportements sont validés ; leurs coefficients restent configurables et doivent encore être calibrés contre cette intention.
3. Le Roi est intelligent et monstrueux, protecteur des exclus et maître de la vermine. Deux gardes réellement ciblables ; leur mort déclenche sa phase monstrueuse au round suivant. Pas de résurrection ou PV ajoutés.
4. Préserver l'aléatoire des classes T1, statistiques et compétences. Aucune compétence multi-cible garantie. Distinguer AoE de frappes répétées sur une cible. Les équipes imposées ne servent qu'aux tests comparatifs.
5. Ciblage : respecter les protections, privilégier une élimination possible, sinon le soutien. Évaluer l'intérêt d'une AoE au regard du mana. Garder les soins, effets, cooldowns et tours individuels cohérents.
6. Les récompenses du donjon mêlent équipements, matériaux et blueprints. Conserver les blueprints dans les tables répétables. Tendances validées : Égouts → survie/récupération ; Contrebandiers → vitesse/frappes multiples ; Citernes → protection/endurance ; Bastion → soutien/protection du groupe ; Cour → commandement/attaques multi-cibles. Chaque zone utilise un pool de statistiques compatibles avec cette identité plutôt qu'un bonus unique imposé à tous les objets. Un objet reçoit un seul bonus thématique déterministe ; un bonus de dégâts incompatible avec le type de son arme est exclu. Les valeurs restent configurables. Les signatures forment une petite série d'objets réservée au Roi des Rats dans le périmètre actuel. Les effets spéciaux proposés ne sont pas retenus pour une implémentation immédiate : leur support par le moteur n'est pas établi. Définir d'abord un objet avec les propriétés d'équipement réellement disponibles. Un seul composant spécifique au Roi sert aux recettes de cette série, comme défini dans la section Craft.
7. Progression personnelle par héros, conservée à travers les changements de groupe. Le compte conserve ressources, équipement et découvertes ; le groupe conserve composition et consignes ; l'expédition conserve sa position.
8. Nouveaux héros : progression propre, même avec des vétérans. Accompagnement autorisé. Le groupe reprend au dernier jalon commun à ses membres ; aucun étage n'est accordé automatiquement à un novice.
9. Jalons après les étages 5,10,15,… terminés. Reprise aux étages 6,11,16,… Avant le premier jalon, reprise à 1. Wipe ou repli : arrêt de l'expédition, point de reprise au dernier jalon commun. Le joueur déclenche MANUELLEMENT la reprise selon les règles de disponibilité/récupération existantes. Ne pas inventer un redémarrage automatique ni une nouvelle obligation d'attendre toute l'équipe. Les vétérans ne perdent pas leurs acquis. Aucun changement de composition pendant un combat.
10. Premières victoires personnelles uniquement sur élites FIXES et boss FIXES. Identifiants permanents indépendants des noms, instances et équipes. Chaque héros présent vivant et engagé au début est éligible si la rencontre est gagnée, même s'il termine KO.
11. Pour chaque héros éligible : un bonus d'XP personnel et un lot de matériaux versé dans l'inventaire commun, une seule fois. Sur un boss fixe, ajouter aussi un équipement ordinaire garanti utilisable par ce héros, sans garantir qu'il améliore son équipement actuel. Les blueprints restent accessibles dans le loot normal dès cette première victoire. Pour le Roi des Rats, sa signature est également accessible dès cette première victoire. Ni les plans ni la signature ne sont garantis par la prime personnelle. Sur une élite fixe : matériaux et XP, sans équipement garanti. Ces objets personnels sont distincts du loot normal et des blueprints répétables. Quatre nouveaux héros : quatre lots, plus un seul loot normal de rencontre. Un novice et trois vétérans déjà récompensés : un seul nouveau lot. Les élites aléatoires donnent leur bonus répétable normal, jamais une nouvelle première victoire personnelle.
12. Reconnexion/replay : aucune duplication de progression, XP, matériaux ou objets. Les preuves doivent distinguer simulation sérialisée et vraie idempotence backend, non couverte dans ce périmètre.
13. Farm ciblé seulement lorsque TOUS les membres ont vaincu le Roi. Choix d'une zone, parcours jusqu'au boss inclus, puis retour au début de la zone. Après wipe ou repli : arrêt ; au prochain lancement MANUEL par le joueur, reprendre au début de cette zone selon les règles de récupération existantes. La boucle après une victoire contre le boss de zone reste automatique tant que le farm est actif. Pas de reprise directe devant le boss, ni de nouveau bonus de première victoire.
14. Une seule expédition active. Formations enregistrées et expéditions simultanées différées ; structurer les données pour les accueillir, sans les implémenter maintenant.
15. Difficulté supérieure et compétences rares apprises par palier sont différées. Garder pour plus tard une distinction personnelle cosmétique après la victoire sur le Roi (titre, bestiaire ou apparence), sans bonus de puissance.
16. Repli volontaire ET wipe : conserver tout le butin des rencontres déjà terminées. Le combat perdu ne donne aucune récompense. Ne pas confisquer les récompenses précédentes et ne pas ajouter de pénalité économique spécifique. Les conséquences du wipe restent le repos et le retour au point de reprise, avec relance manuelle.
17. Aucune modification de composition en plein combat. Le repli volontaire conserve le comportement historique : il annule immédiatement la rencontre active, sans récompense ni progression pour cette rencontre, puis arrête l'expédition au jalon. Un changement de zone de farm reste refusé pendant une rencontre ; hors combat, il repart au début de la nouvelle zone et conserve le butin acquis.
18. Pas de système de pity pour le moment : drops aléatoires et fabrication lorsque le blueprint est obtenu. Aucun compteur augmentant les chances après des échecs et aucune garantie d'objet ou de plan après un nombre de victoires. La fabrication est une voie alternative ; elle ne protège pas automatiquement contre la malchance d'obtention du blueprint.


## Application au harness
Créer un modèle sérialisable séparant progression des héros, composition, expédition et reçus de récompenses. Brancher ce modèle sur de vrais combats, gains d'XP, inventaires et repos du moteur existant. Les bonus doivent agir sur la simulation, pas seulement sur des compteurs. Conserver les témoins pour mesurer le changement.

Le harness sert à éprouver les règles fonctionnelles validées, pas à les remplacer. Il peut faire varier librement les paramètres d'équilibrage explicitement expérimentaux. Toute variante qui modifie un comportement fonctionnel — progression, reprise, farm, récompenses, éligibilité ou boucle idle — doit être présentée, discutée et validée avant d'être ajoutée au code ou aux profils du harness. Un résultat expérimental ne devient jamais une décision produit sans validation explicite.

Paramètres de départ explicitement expérimentaux : gardiens fixes à 5/15/25/35/45, boss à 10/20/30/40/50 ; montants des primes configurables. Réutiliser les matériaux et équipements canoniques existants avant de prétendre disposer de signatures inédites équilibrées.

Tester : groupe neuf ; vétérans avec novice ; changements de composition ; interdiction en combat ; progression séquentielle ; reprise avant/après un jalon ; wipe ; volontaire ; héros KO éligible ; 4 lots puis 0 au replay ; un seul novice récompensé ; élites aléatoires répétables ; farm interdit à un groupe mixte ; boss de zone et retour automatique après victoire ; arrêt sur repli/wipe et relance manuelle ; changement de zone différé ; repos ; sauvegarde/rechargement ; absence de double récompense.

Exécuter les campagnes déterministes avec 10 seeds et 10 processus. Mesurer réussite, durée simulée, repos, défaites, AoE, solos/groupes, premières primes, acquis personnels, boucles et récompenses de farm. Documenter chaque limite, paramètre provisoire, écart réel et critère de clôture. Ne pas confondre l'existence des règles avec leur équilibrage ou leur validation visuelle.

## Dernières réponses validées et conception du craft

4. Craft : un seul composant spécifique au Roi des Rats, commun aux recettes de sa petite série d'objets signatures. Petite quantité garantie à chaque victoire sur le Roi, consommation à chaque fabrication et blueprint conservé. Les quatre autres boss conservent matériaux habituels et blueprints ; aucun composant spécifique supplémentaire.

6. Recommandation acceptée : conserver les drops aléatoires et la fabrication avec un blueprint obtenu, sans garantie automatique pour commencer. Expliquer que le pity peut être une augmentation progressive des chances ou une garantie après un nombre d'essais ; une recette de craft à coût fixe n'est pas, à elle seule, un pity sur l'obtention du plan. Mesurer les séries malchanceuses avant de rouvrir ce choix.

8. Confirmation reçue : tout le butin précédemment acquis est conservé après un wipe ; aucun loot pour le combat perdu ; repos et retour au jalon/début de zone, sans confiscation supplémentaire.

9. Clarification acquise : la reprise après interruption est déclenchée manuellement par le joueur. La question précédente sur un redémarrage automatique était mal posée. Conserver les règles actuelles de disponibilité des héros ; ne pas ajouter un choix inutile.

## État d'application et preuves

Le harness de validation implémente : arrêt sur wipe/repli puis commande explicite de reprise du bot ; équipement ordinaire rare par héros à la première victoire de chaque boss fixe ; pool de loot propre à chaque zone ; trois signatures du Roi injectées uniquement dans le bundle ; Marque du Roi, blueprints et craft dédiés ; aucun pity. Les tests déterministes ciblés passent. La campagne actuelle `undercity-theme-pools-v1` termine 30/30 parcours avec dix seeds et dix processus ; les audits de conservation, temps, rencontres, primes personnelles, farm et signatures passent.

Vérification du code actuel : les cinq tables canoniques de boss possèdent une entrée blueprints à 5 % de chance de tentative. Le tirage requiert un plan éligible non déjà débloqué ; 5 % n'est donc pas une garantie d'obtenir un nouveau plan à chaque série de vingt victoires. Le harness conserve ce chemin canonique et ajoute le tirage expérimental des trois plans du Roi. L'intégration produit conserve le chemin canonique des blueprints existants et ajoute la table explicite des trois plans du Roi ; leurs probabilités restent configurables pour recalibrage.

## Craft — décisions validées

1. Rôle : la Marque du Roi est réservée aux recettes de sa série signature, en complément des matériaux génériques. Les recettes ordinaires ne la demandent pas.
2. Granularité : un seul composant spécifique, obtenu sur le Roi des Rats et commun aux recettes de sa série. Aucun composant spécifique aux quatre autres boss ; conserver leurs matériaux habituels et blueprints.
3. Acquisition : une petite quantité garantie à chaque victoire sur le Roi des Rats, y compris en farm et dès la première victoire. Les blueprints et signatures directement trouvées restent aléatoires ; aucun pity. Le composant répétable est un gain de rencontre, distinct des primes personnelles.
4. Consommation : le composant est dépensé à chaque fabrication ; le blueprint débloqué est conservé. Aucune nouvelle consommation n'est implicitement ajoutée aux autres opérations de forge.

Ces règles sont implémentées dans le harness et dans le domaine produit partagé. Paramètres configurables : 1–2 Marques par victoire ; 6 Marques, 18 débris métalliques et 3 métaux raffinés par recette ; 15 % de signature directe ; 20 % de découverte d'un plan manquant ; 4 % de craft légendaire. Aucun de ces taux ne vaut encore équilibrage produit.

## Signatures — décisions validées

1. Trois signatures uniquement pour le Roi des Rats : Croc du Roi, Manteau des Exclus et Chaîne des tributs. Chacune possède son blueprint ; les recettes utilisent la Marque du Roi. Niveau 35, épique minimum, légendaire possible, statistiques fixes. La version épique porte une faiblesse secondaire ; la légendaire améliore les bonus et retire le malus. Aucune série signature pour les quatre autres boss.
2. Chaque signature doit être un très bon équipement de son palier. Un effet de combat inédit n'est pas un prérequis : partir des propriétés réellement supportées par le moteur. Elle ne suit pas automatiquement le niveau du héros et ne doit pas rendre le farm d'un ancien boss obligatoire après progression vers les paliers suivants. Les premiers paliers peuvent toujours servir à équiper un nouveau groupe.
3. Chaque objet de la série fait partie de la table normale du Roi des Rats dès la première victoire, puis lors des victoires suivantes. Son obtention reste aléatoire, sans garantie de première victoire. Les blueprints restent également présents dès la première victoire selon leurs conditions de tirage.
4. La prime personnelle de première victoire garantit un équipement ordinaire utilisable par le héros ; elle ne garantit ni signature ni blueprint. Le loot normal de rencontre peut donc ajouter une signature à cette même première victoire, sans multiplier son tirage par le nombre de héros éligibles à la prime.
5. Les noms, emplacements, statistiques et compromis sont validés dans les fiches liées ci-dessous. Les probabilités et coûts du harness sont des paramètres d'essai à mesurer.

Validation ciblée présente : signature accessible dès la première victoire et en farm ; un tirage de rencontre ; équipement personnel ordinaire par héros éligible ; absence de signature garantie ; trois plans distincts ; composant commun consommé ; malus épique retiré en légendaire ; reprise explicite. Les six variantes de signature dépassent le 90e percentile des objets ordinaires comparables de niveau 35 dans leur rôle. Les séries sans plan ou signature et les paramètres d'acquisition restent à mesurer.

## Pistes différées — effets signatures avancés

Les propositions de récupération conditionnelle, de frappe supplémentaire liée à un objet, de protection automatique d'un allié et de frappe secondaire sont des idées futures, pas des capacités vérifiées du moteur ni des exigences du sous-lot. Leur reprise dépend d'un inventaire des effets existants et d'une décision explicite d'étendre le système d'équipement. Avant intégration : définir déclenchement, cumul et interaction avec compétences, vérifier la résolution canonique et les replays, puis mesurer l'équilibrage dans le harness. Aucun de ces effets ne doit être simulé comme acquis pour valider la série actuelle.

Fiches validées et paramètres implémentés dans le harness et le jeu : [Série du Roi des Rats](rat-king-signature-items.md).

## Décisions d'intégration produit validées

1. Migration : chaque héros déjà présent reçoit la progression du donjon actuellement acquise par le compte, bornée aux 50 étages des Dessous de la Cité. Les premières récompenses fixes situées à un étage déjà acquis sont marquées comme reçues afin d'éviter une nouvelle distribution lors de la migration.
2. Combat multiple : afficher séparément chaque ennemi avec ses PV, son rôle, ses effets et son intention. Le ciblage reste automatique ; aucune sélection manuelle de cible n'est ajoutée.
3. Progression et farm : adapter simplement l'écran Donjon existant. Montrer le jalon commun, la progression individuelle des membres, l'état arrêté avec l'action de reprise, puis le choix de zone lorsque le farm est accessible. Éviter une nouvelle page ou un parcours secondaire.
4. Préparer les contrats avec un `dungeonId` dès cette première intégration afin que progression, reçus et expédition ne deviennent pas implicitement globaux lorsque plusieurs donjons seront ajoutés.

## Intégration du loot thématique au nommage — décision validée

Le moteur de nommage V1 choisit déjà ses thèmes parmi les modificateurs positifs réellement résolus et persistés. Un bonus de zone devient donc automatiquement éligible : vitesse peut produire « de célérité », résistance au poison « de garde contre le poison », critique « du coup décisif ». Il n'est cependant pas garanti d'être le thème retenu si l'objet possède plusieurs bonus.

Dans l'interface actuelle, ne pas ajouter de badge ni de libellé indiquant qu'un objet est thématique d'une zone. Le bonus thématique reste une statistique réelle de l'objet et participe au nommage existant comme les autres modificateurs ; ne pas forcer le nom de la zone dans le nom principal. Chaque objet thématique conserve toutefois une provenance technique avec l'identifiant du donjon et celui de la zone, sans affichage pour le joueur. Cette provenance servira au diagnostic, aux migrations et aux évolutions futures. Si une table de loot visible est ajoutée plus tard, elle devra présenter clairement les pools thématiques des zones ; son contrat d'affichage sera défini avec cette fonctionnalité.


## Intégration produit autorisée — 2026-09-06

Le périmètre initial du présent prompt était le harness. Après validation des résultats et des décisions ci-dessus, l'intégration dans le jeu a été explicitement autorisée. La source d'architecture et l'état des raccords se trouvent dans [l'architecture des Dessous de la Cité](../architecture/undercity.md). Les paramètres issus du harness restent configurables ; le harness demeure une preuve statistique et ne remplace pas les règles produit.
