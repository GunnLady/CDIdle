# Donjon 2D — production des sprites et animations d’action

Révision du 15 septembre 2026. Complément directeur du
[plan des rencontres](dungeon-2d-encounter-plan.md).
**Plan de production, pas constat de livraison ni validation visuelle.**

## 1. Décisions utilisateur et limites

- PC uniquement ; conserver l’identité CDIdle et les compositions validées.
- Slime Team Manager reste la référence de mise en scène du combat, pas la DA.
- Approche mixte : transformations des sprites pour les mouvements simples,
  poses dessinées pour les vrais gestes. Reprendre effectivement les héros
  pour normaliser leur DA et couvrir leurs actions ; harmoniser également les
  monstres qui le nécessitent.
- Les dix classes T1 comptent chacune dix hommes et dix femmes. Les anciennes
  clés restent compatibles par une réattribution déterministe des index 0–19
  vers 0–9 du même genre ; les quarante anciens visuels par classe ne sont pas
  conservés individuellement.
- Trois lots artistiques sont distincts : **base neutre → pose de combat →
  poses d’action**. Chaque identité reçoit une pose de combat en garde, avec le
  même visage et le même équipement dessiné. Les poses d’action restent
  ciblées par famille de geste : pas d’animation complexe ni de cycle de marche
  complet produit systématiquement.
- L’arme visible appartient au sprite. Elle ne suit **pas** l’arme équipée.
  Plusieurs sprites d’une même classe peuvent avoir des armes différentes.
  Les poses éventuelles doivent conserver cette arme et une gestuelle compatible.
- Conserver les identités, la diversité des carnations, visages et cheveux,
  les silhouettes, les particularités et les équipements visuels validés.
  Normaliser le dessin ne signifie pas uniformiser tous les personnages.
- Chaque référence, kit de poses et écran modifié est validé visuellement par
  l’utilisateur. Les preuves techniques restent réalisées par Codex ; regrouper
  les tests complets et la documentation de livraison après validation de l’écran.
  Contrôler immédiatement un alpha, un fichier ou un montage cassé reste nécessaire.
- Aucun déploiement. Pas de nouvelle règle de combat, compétence, cible,
  durée de statut, ressource ou conséquence inventée par l’animation.

## 2. Pourquoi le découpage précédent ne suffit pas

Constats vérifiés dans le code local le 13 septembre, sans prétendre à un nouvel
audit visuel des images :

| Constat | Conséquence pour le plan |
| --- | --- |
| `shared/data/skills.ts` définit 36 compétences actives dans dix classes | Une catégorie « magie » et une catégorie « soutien » ne couvrent pas leurs gestes et signatures |
| `HERO_SPRITE_SHEETS` expose encore dix classes, deux genres et vingt index historiques par genre | Produire 200 identités, dix par genre et par classe, puis conserver la compatibilité des 400 clés historiques par réattribution stable ; une garde générique remplaçant les visages n’est pas une solution |
| `dungeonCombatActionProfile.ts` classe les attaques directes en mêlée et distingue seulement deux tirs par identifiant | Revoir le routage des attaques de base, les tirs avec debuff et les actions ennemies |
| Le même profil classe tout dégât non physique en magie | Le poing tellurique et le coup de pied du zéphyr restent des gestes de corps à corps ; les appareils de l’Artificier ne deviennent pas des incantations |
| Le rôle ennemi `ranged` est aussi attribué au membre central d’escortes, dont plusieurs chefs armés au contact | Ne pas déduire la gestuelle d’un rôle de combat ou d’un nom traduit ; utiliser la clé de contenu et le sprite associé |
| Le lecteur progresse par pas logiques de 400 ms ; les effets actuels annoncent 720 ms et des bulles espacées de 600 ms | Une démonstration pas à pas ne prouve pas une lecture continue correcte ; chevauchement, annulation et fin des gestes sont un livrable |
| Les trente blueprints utilisent des membres et des assets partagés | Auditer les images uniques et leurs usages, pas régénérer un sprite par emplacement |

L’implémentation en cours de CDI-113 est une première version technique, **pas
une couverture artistique ou chorégraphique achevée**. Les tests déjà consignés
restent des preuves de leur ancien périmètre, pas de cette nouvelle exigence.
La mention « seule validation visuelle restante » n’est plus applicable.
Les acquis de CDI-099 et CDI-108–112 restent conservés ; les retouches nouvelles
ont leurs propres lots et ne réécrivent pas l’historique des validations.

## 3. Recherche croisée et méthode retenue

Sources primaires consultées ; les propositions CDIdle ci-dessous sont notre
adaptation, pas des prescriptions attribuées aux jeux cités.

| Source | Enseignement utile | Application CDIdle |
| --- | --- | --- |
| [Slime Team Manager, code figé](https://github.com/Arias1101/Slime-Team-Manager/tree/e6a37d95b870e643d0aee33f4162e60b551a6f07) ; détails sourcés dans le plan principal | Auteur, déplacement, projectile séparé, contact, réaction et retour à l’attente composent une action | Écrire une fiche de chorégraphie complète, pas seulement choisir un effet |
| [Wesnoth — Advanced Animation Tutorial](https://wiki.wesnoth.org/Advanced_Animation_Tutorial) | Faire intervenir la pose d’attaque autour du contact, réemployer certaines poses préparatoires et distinguer projectile, réussite et échec | Référence de base + poses ciblées, avec un repère de contact commun ; ne pas copier ses durées comme norme CDIdle |
| [Riot — Visual Effects](https://www.riotgames.com/en/artedu/visual-effects) | Les effets doivent expliquer action et état, rester cohérents sur tout le roster et conserver leur identité de source | Charte de silhouettes, densité et priorité visuelle ; feu, soin et poudre ne sont pas le même orbe recoloré |
| [Epic — Animation Montage Overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-montage-overview?application_version=4.27) | Sections de mouvement, repères temporels pour les effets et variantes partageant un montage | Recettes déclaratives réutilisables, phases et ancrages communs ; ni migration vers Unreal ni mutation métier déclenchée par une animation |

La lecture du code STM est documentée dans le plan initial ; son jeu n’a pas
été exécuté pour cette recherche. Les pages Wesnoth, Riot et Epic ont été lues,
pas leurs vidéos intégrales. Aucun asset externe n’est copié.
Ragnarok Online et Lost Ark restent les références utilisateur du flux de
bulles, sans affirmer ici une nouvelle mesure de leurs timings.

Organisation retenue : **inventaire léger → référence artistique → geste simple →
pilote intégré → validation visuelle → seules déclinaisons utiles → recette continue**.
Le pilote prouve ensemble sprite, animation et coût réel avant la production en série.
Ne pas introduire de rig squelettique, d’éditeur d’animation, de couches de corps
interchangeables ou de pipeline complexe pour éviter quelques poses ciblées.

## 4. Catalogue : distinguer geste, signature et résultat

Une action se décrit par plusieurs axes, sans créer une animation indépendante
pour toutes leurs combinaisons :

- **Identité visuelle** : sprite stable, arme dessinée, morphologie et pose.
- **Geste** : taille, estoc, coup lourd, pugilat, tir, projection mécanique,
  incantation, soin, chant, interaction ou réaction.
- **Signature** : physique, élément, naturel, sacré, son, poussière ou technologie.
- **Distribution** : soi, cible unique, plusieurs cibles, impacts successifs.
- **Résultat prouvé** : succès, esquive, critique, perte/gain réel, KO, statut,
  expiration ou transition de phase.

La classe historique et l’identité du sprite peuvent déterminer une présentation,
jamais les dégâts. La compétence structurée impose sa signature et ses cibles.
L’équipement réel continue de décider ses règles métier ; il ne change pas le
dessin de l’arme. Cette abstraction est explicite, y compris si les deux diffèrent.
Une arme absente de la pose ne doit pas surgir sous prétexte de jouer une recette.

### 4.1 Familles de gestes : attendu et éléments à produire

Les phases indiquées sont des exigences de lecture, pas une liste d’images à
dessiner. Une légère inclinaison peut suffire à la préparation et le retour
utiliser la base. Chaque élément dessiné ci-dessous est un candidat, à produire
seulement si le pilote simple ne suffit pas. Le nombre final est fixé après ce test.

| Famille | Rendu attendu | Éléments à produire ou réutiliser |
| --- | --- | --- |
| Contact, taille légère | Appui, armé, rapprochement court, coupe lisible au contact, retour | Base + armé + frappe si nécessaires ; arc de coupe ancré à l’arme, impact physique |
| Contact, estoc / lance / dague | Corps équilibré, allonge dans l’axe de l’arme, pointe alignée, retrait | Pose d’allonge et reprise ; ancrages main/pointe ; aucune déformation du manche |
| Contact, arme lourde | Préparation plus marquée, poids du buste, coup ample, récupération | Armé/frappe lourde, effet contondant ou tranchant selon arme visible ; ombre au sol |
| Armes jumelles | Alternance crédible des mains, lames cohérentes, retour en garde | Poses droite/gauche compatibles avec le sprite ; répéter uniquement les impacts reçus |
| Pugilat | Coup de poing ou de pied identifiable, bassin/appui stables | Poses poing/pied et reprises ; version terrestre/aérienne des effets, pas de projectile magique de remplacement |
| Créature, morsure / griffe / pince | Approche adaptée au corps, geste de mâchoire ou membre, recul | Poses ciblées par morphologie ; griffure/pincement/impact, pas un slash d’épée universel |
| Slime / corps souple | Compression sur son appui, propulsion/extension brève, contact, reformation | Déformation contrôlée ; pose supplémentaire si la silhouette ou le visage se dégrade |
| Arc | Bras et corde en tension, décoche, flèche quittant l’arc, réception | Pose de visée tendue + décoche ; projectile avec origine exacte et orientation de trajet |
| Arbalète / arme mécanique | Visée cohérente, départ au mécanisme, recul court et remise en position | Pose de tir propre à l’arme ; carreau/charge/flash adaptés ; pas de corde d’arc simulée |
| Projection d’appareil | Appareil manipulé, émission depuis celui-ci, trajectoire ou jet identifiable | Pose d’activation, buse/ancrage ; jet de feu, arc électrique ou objet selon compétence |
| Sort projectile | Préparation par le héros, libération main/focaliseur, trajet, impact élémentaire | Pose(s) de canalisation/libération ; départ, projectile et impact distincts |
| Sort apparaissant à la cible | Geste causal de l’auteur puis émergence localisée, sans faux trajet | Pose de lancement ; pointe/ronces/marque à l’ancrage de cible, dissipation |
| Soin magique / naturel | Geste bienveillant lisible, réception sur les seuls bénéficiaires | Pose de soin ; réception sacrée/naturelle ; valeur et jauge au repère prévu |
| Soin médical ennemi | Utilisation du matériel déjà dessiné, distincte d’une attaque | Pose de soin/pansement/applicateur ; effet local discret, pas de magie gratuite |
| Chant / cri / commandement | Bouche, posture ou instrument cohérents, onde lisible vers les cibles concernées | Pose de chant/cri/ordre ; signatures sonore et commandement, sans dégâts fictifs |
| Buff / debuff / protection | Geste de pose puis état persistant discret avec début et fin | Pose compatible, apparition et marqueur d’état ; symbole + texte, pas seulement couleur |

### 4.2 Couverture des 36 compétences actives

Inventaire issu de `shared/data/skills.ts`. Les propositions de forme des effets
restent à valider visuellement ; leurs conséquences restent celles du domaine.
Les gestes communs ne dispensent pas d’une ligne de couverture par identifiant.

| Classe | Identifiants | Mise en scène et production nécessaires |
| --- | --- | --- |
| Novice | `heavy_blow` | Frappe lourde compatible avec l’arme dessinée, armé et impact accentués |
| Novice | `guard_stance` | Prise de garde, marqueur défensif puis expiration |
| Guerrier | `cleaving_strike` | Balayage et impacts sur toutes les cibles reçues ; aucun ennemi décoratif touché |
| Guerrier | `weakening_shout`, `provocation` | Deux signatures de cri : affaiblissement de cible / défi de l’auteur ; ne pas dessiner une nouvelle règle d’aggro |
| Voleur | `quick_shiv`, `double_cut` | Coup bref / deux coupes avec deux repères, si deux impacts effectivement fournis |
| Voleur | `blinding_dust` | Geste de lancer, poudre vers la cible, affaiblissement ; pas de dégâts inventés |
| Archer | `precise_shot`, `piercing_arrow` | Deux tirs reconnaissables par anticipation/intensité ; perforante ne signifie pas multicible |
| Archer | `crippling_shot` | Tir et application du debuff ; le code actuel ne définit pas un effet de dégâts associé |
| Mage | `fire_bolt`, `ice_shard` | Trait enflammé / éclat cristallin, avec silhouettes et impacts distincts |
| Mage | `water_lance`, `stone_spike` | Jet d’eau / émergence minérale ciblée ; deux géométries, pas une recoloration |
| Mage | `wind_blade`, `lightning_bolt` | Lame d’air / trait de foudre ; vitesse et forme lisibles sans masquer la cible |
| Acolyte | `minor_heal`, `holy_smite` | Soin ciblé / châtiment sacré, sans confusion entre réception positive et coup |
| Acolyte | `sacred_barrier`, `holy_mark`, `benediction` | Protection alliée, marque adverse, renforcement allié ; trois états identifiables et bornés |
| Aède | `inspiring_song`, `discordant_chord`, `soothing_song` | Instrument/chant : renforcement allié collectif, affaiblissement adverse collectif, soin collectif |
| Druide | `thorn_grasp`, `wild_regrowth`, `barkskin` | Ronces d’affaiblissement, repousse de soin, écorce défensive ; ne pas inventer immobilisation ou dégâts périodiques |
| Artificier | `flame_thrower`, `lightning_arc` | Jet mécanique multicible / arc électrique ciblé ; statistiques physiques n’impliquent pas mêlée |
| Artificier | `overcharged_core`, `static_trap` | Activation de noyau allié / pose-déclenchement de piège adverse ; pas de piège persistant métier ajouté |
| Pugiliste | `earthen_fist`, `zephyr_strike` | Poing renforcé de pierre / coup de pied avec vent ; contact physique malgré l’élément |
| Pugiliste | `rapid_combo`, `battle_focus` | Jusqu’aux cinq frappes reçues avec gestes alternés / concentration sur soi |

Les attaques de base des dix classes et de chaque membre ennemi sont des lignes
supplémentaires du manifeste, y compris sans compétence ni mana. Les passifs
statistiques ne créent pas artificiellement un tour, un geste ou une bulle.
Un coût insuffisant, un cooldown ou l’absence de cible ne produit pas une fausse
incantation ; présenter uniquement l’action réellement résolue.

### 4.3 Réactions, états et fin de rencontre

| Événement | Rendu attendu | Production / contrainte |
| --- | --- | --- |
| Attente de combat | Garde lisible, mouvement faible, déphasé entre acteurs, pieds et ombre stables | Utiliser la pose `combat_idle` de la même identité ; retour à cette garde à la fin de chaque geste, même sans action suivante |
| Prise d’action | Auteur immédiatement repérable | Contour dur à diffusion courte : or héros, rouge ennemi ; pas d’aura permanente |
| Coup reçu | Réaction au contact, pas au début du trajet | Recul très court ou pose de réaction si nécessaire ; même horloge que PV et dégâts |
| Critique | Accent bref sur un impact réel | Impact/typographie renforcés ; ni second coup ni secousse globale systématique |
| Esquive | Décalage/évitement puis retour ; projectile manque réellement sa cible | Pose si nécessaire, libellé lisible ; pas de flash de dégât ou de perte PV |
| Multi-frappe | Geste et réaction pour chaque impact prouvé | Ordre et valeurs conservés, arrêt des impacts quand la trace s’arrête, KO après l’impact létal |
| Multicible | Une cause lisible, réceptions sur chaque cible réelle | Liste de cibles figée pour l’action ; ne pas utiliser la prochaine cible vivante par défaut |
| Ressources | Une information par bulle, une ligne, hors visage ; PV rouge, PM bleu | Réutiliser le flux validé : départs 600 ms, vie 1 000 ms, chevauchement lisible autorisé ; signe et libellé distinguent gain/perte |
| Buff/debuff posé, renouvelé, expiré | Transition brève puis état discret et fin explicite | Marqueurs et données temporelles ; pas de durée déduite d’un timer CSS |
| Protection / exposition | Lien lisible avec le protecteur vivant et changement réel d’état | Ne pas transformer une priorité de ciblage ou un bonus défensif en blocage/absorption chiffrée |
| Préparation / assaut ennemi | Intention courante compréhensible, accent au véritable assaut | Pas de prévision de cible ou d’attaque future non fournie |
| Roi P1 → P2 | Mutation vers la forme monstrueuse validée, armure arrachée, combat sans hache en P2 | Réutiliser les deux sprites validés ; poses différentes P1/P2, transition ancrée et non rejouée à chaque pas |
| KO héros / mort ennemi | Affaissement ou pose dédiée, arrêt de l’attente, identité maintenue dans l’historique | Pose KO par silhouette si les transformations dénaturent le personnage ; ne pas jouer un KO comme une attaque |
| Réanimation | Relèvement puis attente, uniquement au repos autorisé | Pose compatible ; ressources reçues, jamais résurrection de combat inventée |
| Victoire / défaite / butin | Fin des actions, résultat et récompenses exactes, commandes disponibles | Geste court de relâchement si utile ; pas de boucle de célébration qui retarde la progression |
| Niveau / classe / jalon | Information issue de l’événement, indépendante d’un impact | Réutiliser les surfaces existantes ; pas de transformation de héros au milieu d’un coup ancien |

La P2 du Roi suit la condition du domaine liée à ses gardes, pas un nouveau seuil
de PV. Le changement de sprite déjà livré doit être préservé et relu dans le
scénario complet ; il n’est pas à réinventer sous couvert d’animation.

### 4.4 Les huit familles hors combat restent dans le plan

| Rencontre | Geste / résultat à comprendre | Éléments à produire ou compléter |
| --- | --- | --- |
| Trésor | Présence autour du coffre, ouverture/révélation puis gains distincts | Conserver décor, coffre, ombre et composition validés ; pose d’interaction seulement si nécessaire |
| Repos | Héros installés autour du feu, récupération individuelle et éventuel relèvement | Conserver camp et formation ; poses de repos/KO/relèvement compatibles avec les nouveaux héros |
| Piège | Héros sélectionné qui repère/désamorce, ou déclenche puis subit la conséquence | Pose d’intervention, accessoire actif/inactif ; pas seulement une arrivée d’image |
| Énigme | Observation/manipulation puis résolution ou contrecoup | Pose de lecture/manipulation, état du dispositif, ressources exactes |
| Embuscade | Alerte puis évitement ou surprise selon l’épreuve reçue | Pose d’alerte/esquive et accessoire ; pas de combat supplémentaire |
| Rituel | Geste de canalisation, activation puis réussite/retour de force | Pose de rituel et effet propre au dispositif, sans confondre avec un sort de dégâts |
| Obstacle | Effort contre l’obstacle puis franchissement ou recul | Pose d’appui/effort, réaction du décor ; pas d’affaissement décoratif sans cause |
| Négociation | Geste d’échange, acceptation/refus, conséquences monétaires reçues | Pose de dialogue/offre et objets existants ; pas de nouveau PNJ interactif ni mini-jeu |

Chaque branche applicable reçoit une fiche. Un échec d’épreuve n’est pas un wipe.
Les six accessoires en cours de CDI-115 sont réutilisables sous réserve de
validation ; leur animation d’apparition ne suffit pas à valider l’interaction.

## 5. Chantier artistique et manifeste de production

### A0 — références et inventaire, avant la série

1. Comparer les héros actuels sur une planche commune à taille visible égale :
   tête/corps, simplification du visage, contours, texture, contraste, lumière.
2. Faire valider un petit étalon avec deux héros contrastés et un monstre
   humanoïde existant. Conserver les autres morphologies comme contrepoints,
   sans imposer une anatomie humaine aux rats, cafards ou slimes.
3. Garder compatibles les 400 clés héros historiques, mais produire 200
   identités visuelles : dix hommes et dix femmes par classe. Réattribuer les
   index 0–19 vers 0–9 du même genre de façon déterministe. Noter les
   incompatibilités d’arme, de morphologie ou de DA qui demandent une exception.
4. Auditer les images ennemies uniques des cinq zones avec tous leurs usages :
   `conserver`, `retouche ciblée`, `refaire la base`, `poses manquantes`.
   Lister les défauts concrets ; on ne sait pas encore quelles images exigent
   réellement une harmonisation. Les changements soumis par l’utilisateur ne
   constituent pas un verdict global contre tous les sprites validés.
5. Comparer un pilote sans nouvelle pose à une variante avec une pose utile.
   Chiffrer images nouvelles, réutilisations, exports, poids et mémoire décodée.
   Ne lancer une série que pour un gain visuel constaté, pas pour compléter
   artificiellement une grille d’animation.

### A1 — bases neutres des héros, par classe

Refaire les dix classes sur un format commun de dix hommes et dix femmes. La
base neutre est utilisée dans le recrutement, le catalogue, le stockage et les
scènes hors combat. Chaque ticket de classe valide d’abord un pilote contrasté,
puis ses vingt identités et leur réattribution stable des anciens index 0–19
vers 0–9. Il ne produit ni garde ni pose d’action.

### A1b — poses de combat des héros, par classe

Après chaque base validée, produire une garde pour les vingt mêmes identités.
Visage, carnation, coiffure, tenue, arme ou accessoire, direction, lumière,
échelle, pieds et pivot restent cohérents avec la base neutre. CDI-148 fixe le
standard sur les Novices ; CDI-149 à CDI-157 l’appliquent aux neuf classes T1.

La garde devient l’attente persistante du cinéma pendant un affrontement. Le
lecteur suit **neutre → garde → action → garde → neutre en fin de combat**.
Une action sans pose dédiée retombe sur la garde, jamais sur la pose d’une autre
identité. La garde persistante ne remplace pas la compétence `guard_stance`,
qui conserve son geste ou son effet propre.

### A1c — poses d’action ciblées

Après validation des gardes, produire uniquement les gestes nécessaires aux
familles d’action : contact, tir, sort, soin, chant, appareil, réaction ou KO.
Une arme ou une morphologie différente peut exiger une exception au sein de la
même classe. Les compétences partagent une pose si le geste reste convaincant ;
la couverture des actions n’est pas un objectif de quantité d’images.

Le lecteur distingue garde, préparation, émission ou contact, récupération,
réaction et KO. Ces états logiques réutilisent autant que possible les poses
validées. Une réutilisation validée est une couverture ; changer le visage pour
utiliser une pose ne l’est pas.

### A2 — harmonisation et poses des monstres, zone par zone

Ordre : Égouts, Contrebandiers, Citernes, Bastion, Cour. À l’intérieur d’une
zone, traiter un écran à la fois et les assets partagés une seule fois.
Les fiches couvrent bases, morphologies d’attaque, médical/soutien, protections,
élites, boss et Roi P2. Chaque correction reçoit la référence CDIdle validée,
le sprite existant et une demande ciblée. Ne pas régénérer tout un groupe pour
corriger une arme, un gant, un visage ou l’éclairage d’un seul membre.

### Fiche obligatoire par ressource / geste

| Champ | Contenu exigé avant production en série |
| --- | --- |
| Identité | Clé du sprite, classe ou membre ennemi, usages partagés, référence validée |
| Geste | Action(s) couvertes, arme visible, pose(s) réutilisées et pose(s) manquantes |
| Chronologie | Préparation, émission, contact(s), récupération, réaction ; repères nommés |
| Ancrages | Pieds, ombre, main/focaliseur, pointe/bouche de tir, réception, nom/PV/PM |
| Cohérence | Taille alpha visible, tête/corps, arme, visage, couleurs, direction et lumière |
| Export | Source/version, recadrage commun, dimensions, alpha, poids, atlas éventuel |
| Suivi | À auditer / spécifié / produit / intégré / validé visuellement / vérifié techniquement |
| Preuve | Scénario du catalogue, écran en jeu, date du verdict utilisateur, tests ciblés |

Workflow image : références existantes, fond monochrome éloigné des couleurs
du personnage, détourage puis décontamination des franges hors runtime.
Vérifier réellement le canal alpha sur fonds clair et sombre, les moustaches,
armes entières et détails fins. Pas de damier peint, de suppression globale
d’une couleur du personnage ou de correction d’opacité qui le rend translucide.
La lumière suit la scène de référence, notamment depuis la gauche sur les
ennemis concernés ; retourner une image ne corrige pas son éclairage.
Une grande toile transparente ne prouve pas une grande silhouette : contrôler
la boîte alpha et conserver pivot/échelle entre poses pour éviter les sauts.

## 6. Architecture et chronologie à livrer

Séparer quatre responsabilités :

1. Domaine/trace : résultat, auteurs, cibles, impacts, ressources, effets et
   phases autoritaires. Ajouter seulement les métadonnées historiques nécessaires.
2. Catalogue de présentation : identités de sprites, armes visuelles, familles,
   poses, ancrages et signatures d’action ; pas de règle de dégâts dans ce catalogue.
3. Projection/ordonnanceur : convertir les événements reçus en pistes d’acteurs,
   trajectoires, impacts et bulles à un instant donné, hors des composants React.
4. Rendu : afficher les pistes et gérer les interactions locales ; aucun choix
   de cible ou commande réseau depuis un événement CSS, une fin de sprite ou un timer.

Les repères `prepare`, `release`, `contact[n]`, `recover`, `idle` sont partagés
par poses, projectiles, réactions et jauges. Les PM suivent leur consommation
réelle ; les PV suivent les impacts de présentation sans modifier l’état canonique.
Prévoir l’arbitrage d’un acteur déjà occupé : réaction superposée limitée,
remplacement explicite ou rattrapage borné, sans accumulation infinie.

**Ne pas allonger silencieusement le pas logique de 400 ms.** Prouver une lecture
continue avec plusieurs actions et cinq impacts : pas d’effet remonté/rejoué
à chaque nouveau pas, pas de jauge retardée dont le timer est sans cesse annulé,
pas d’attente définitivement suspendue après la dernière attaque.
Conserver les timings validés des bulles comme référence ; résoudre leur
arbitrage avec les impacts et la saturation sur un pilote. Si le rendu souhaité
nécessite une autre politique de cadence, présenter l’écart à l’utilisateur
avant de changer ce contrat, plutôt que de promettre des gestes tronqués.

Cas obligatoires : pause/reprise, replay complet, retour historique, accélération
si déjà disponible, remplacement de rencontre, onglet masqué, démontage,
animations désactivées, image manquante et ancienne trace. Les anciennes données
incomplètes gardent un repli neutre ; le contenu actuel ne peut pas s’en servir
pour masquer une famille non implémentée.

## 7. Redécoupage d’exécution

Découpage **appliqué le 13 septembre 2026** après demande utilisateur :
CDI-104/113/114/115/116 recadrés, CDI-117–135 créés, CDI-136–145
ajoutés pour les dix bases neutres héros, CDI-146/147 pour les reprises ciblées
des Galeries et du Bastion, puis CDI-148–157 pour les poses de combat des dix
classes. Les liens ci-dessous
pointent vers les tickets Markdown, source de vérité des statuts. Les codes
A1/A2 restent des catégories de retouches à instancier après le tri CDI-117,
avec consommateurs et recette bloqués explicitement. Les statuts courants sont
portés par les tickets liés ci-dessous.

### Tickets existants recadrés

| Ticket | Nouveau lot borné | Ce qui en sort |
| --- | --- | --- |
| CDI-113 | Chronologie d’action commune et un pilote de contact complet dans le vrai lecteur ; transition garde → action/contact → garde | Production du roster, toutes les autres familles avancées et leur validation globale |
| CDI-114 | Cycle buffs/debuffs du producteur au rendu : début, renouvellement, expiration, cibles individuelles/collectives | Intentions/protections ennemies et chorégraphie Roi vers E1/E2 ; gestes de lancement vers les familles concernées |
| CDI-115 | Interaction de piège complète succès/échec, socle partagé et un vrai geste du héros | Les cinq autres épreuves vers N1–N5 ; les accessoires existants restent conservés |
| CDI-116 | Mesures sur **tous** les kits et familles révisés intégrés | Aucun travail artistique ou animation oubliée à cacher dans le ticket de performance |
| CDI-104 | Recette globale, après convergence des lots artistiques, fonctionnels et mesures | Aucune clôture fondée seulement sur l’ancien graphe de vingt tickets |

Les cases cochées des tickets en cours doivent être réévaluées seulement pour
les critères modifiés, sans effacer leurs anciennes preuves. CDI-113 et CDI-115
ne sont plus annoncés prêts à la seule validation visuelle.

### Lots et tickets créés

| Lot | Livrable / limite | Prérequis | Clôture propre |
| --- | --- | --- | --- |
| A0 — [CDI-117](../../workboard/data/Done/CDI-117/ticket.md) | Étalon DA, tri des ressources conservées et création des seules reprises utiles | Acquis 099, 108–112 | Référence et cinq zones validées ; tickets A1/A2 bornés, aucune animation produite |
| A1 — [CDI-136](../../workboard/data/Done/CDI-136/ticket.md) à [CDI-145](../../workboard/data/Done/CDI-145/ticket.md) | Refaire les bases neutres des dix classes, vingt identités par classe : dix hommes et dix femmes | 117 ; 137–145 dépendent aussi du Novice 136 validé | Une classe par ticket ; réattribution stable 0–19 → 0–9, aucune pose de combat ou d’action incluse |
| A1b — [CDI-148](../../workboard/data/Done/CDI-148/ticket.md) à [CDI-157](../../workboard/data/Later/CDI-157/ticket.md) | Produire et intégrer la garde des vingt identités de chaque classe | Base neutre de la classe ; 149–157 réutilisent le standard Novice 148 | Même identité et équipement ; garde dans le cinéma, retour après action, neutre hors combat |
| A2 — [CDI-146](../../workboard/data/Later/CDI-146/ticket.md), [CDI-147](../../workboard/data/Later/CDI-147/ticket.md), puis lots restants | CDI-146 regroupe les cinq écrans humains des Galeries ; CDI-147 les trois reprises de deux écrans du Bastion | A0 et geste concerné | Chaque écran validé, usages partagés revérifiés ; images conservées explicitement listées |
| C1 — [CDI-118](../../workboard/data/Later/CDI-118/ticket.md) | Contact léger, lourd, estoc et armes jumelles à partir du pilote | 113 + gardes Novice/Guerrier/Voleur | `heavy_blow`, `quick_shiv`, `double_cut` ; gestes et accents adaptés, retour en garde |
| C2 — [CDI-119](../../workboard/data/Later/CDI-119/ticket.md) | Balayage et pugilat / combo | 113 + C1 | `cleaving_strike`, poing, pied, cinq impacts reçus ; pose ciblée seulement pour geste impossible à lire |
| C3 — [CDI-120](../../workboard/data/Later/CDI-120/ticket.md) | Créatures : morsure/pince et corps souple | 113 + pilotes A2 | Deux recettes simples sur rat/crabe et slime ; exceptions explicites, pas tout le bestiaire redessiné |
| D1 — [CDI-121](../../workboard/data/Later/CDI-121/ticket.md) | Tir : arc et arbalète | 113 + éventuelle pose de tir | Base, précis, perforant, handicapant ; décoche, trajet, contact et debuff ; autres armes seulement si réellement dessinées |
| M1 — [CDI-122](../../workboard/data/Later/CDI-122/ticket.md) | Magie projectile : feu / glace / foudre | 113 | Même geste de lancement si suffisant, trois signatures lisibles sans pack d’images imposé |
| M2 — [CDI-123](../../workboard/data/Later/CDI-123/ticket.md) | Eau / terre / vent et appareils de l’Artificier | M1 | Réutiliser jets, traits et impacts ; distinguer émergence/appareil ; scinder si le pilote révèle une nouvelle technique |
| S1 — [CDI-124](../../workboard/data/Later/CDI-124/ticket.md) | Soin allié et médical ennemi, sacré et nature | 113 ; 114 pour états | Soin, châtiment, repousse, ronces/écorce/marque ; poses conservées si lisibles, signatures sobres |
| S2 — [CDI-125](../../workboard/data/Later/CDI-125/ticket.md) | Chant, cri, poudre et renforcement | 113 ; 114 pour états | Distinguer instrument/voix/lancer avec effets courts ; mêmes primitives d’état, pas un moteur par compétence |
| E1 — [CDI-126](../../workboard/data/Later/CDI-126/ticket.md) | Intentions et protections ennemies | 113 ; contrat 106 | Trace/projection/rendu sur cover/surge et protecteur mort ; pas de fausse absorption |
| E2 — [CDI-127](../../workboard/data/Later/CDI-127/ticket.md) | Roi : gardes, mutation et attaques P1/P2 | E1 + 112 | Réutiliser les formes validées, transition une fois à la vraie condition ; geste simple propre à chaque forme |
| R1 — [CDI-128](../../workboard/data/Later/CDI-128/ticket.md) | Réactions, KO et relèvement | 113 + gardes héros | Dernier coup, esquive, retour en garde, repos avec KO ; transformation simple avant toute pose neuve |
| N1–N5 — [CDI-129](../../workboard/data/Later/CDI-129/ticket.md), [CDI-130](../../workboard/data/Later/CDI-130/ticket.md), [CDI-131](../../workboard/data/Later/CDI-131/ticket.md), [CDI-132](../../workboard/data/Later/CDI-132/ticket.md), [CDI-133](../../workboard/data/Later/CDI-133/ticket.md) | Un ticket par énigme, embuscade, rituel, obstacle, négociation | 115 + pose d’interaction nécessaire | Réussite/échec, geste/accessoire, conséquences et écran validés |
| N6 — [CDI-134](../../workboard/data/Later/CDI-134/ticket.md) | Réintégrer les héros retouchés dans trésor/repos | 102 + lots A1 terminés | Aucun recul de composition, ombre, bulles ou réanimation validées |
| Q1 — [CDI-135](../../workboard/data/Later/CDI-135/ticket.md) | Combat complet continu et couverture du catalogue | Tous les lots de combat et séries A1/A1b/A2 | 36 compétences + bases/gardes ennemies et héros + réactions/états, aucune ligne actuelle au fallback |

Ce sont des lots de production, **pas une estimation uniforme en M**. Avant de
créer un ticket artistique, nommer ses identités, ses poses utiles et ses exports.
Pour N1–N5, les cinq tickets CDI-129–133 sont créés. Les bases héros A1 sont
bornées par CDI-136–145 et les gardes A1b par CDI-148–157, une classe par ticket
dans chaque série. Les retouches ennemies A2
restent à créer après le tri des zones, sans masquer plusieurs écrans sous un
seul ticket. Les lots fonctionnels regroupent les actions
qui réutilisent réellement la même technique ; tout nouveau geste complexe
doit d’abord être simplifié, puis éventuellement isolé si cela reste nécessaire.
Chaque lot conserve son test intégré : pas de tickets « schéma seulement »
déclarés complets alors que leur comportement ne fonctionne pas dans la scène.

Ordre utile : base Novice CDI-136 → garde Novice CDI-148 → chronologie/contact
CDI-113 → bases CDI-137–145 → gardes correspondantes CDI-149–157 → poses
d’action par famille. Une classe peut alimenter son lot d’action dès que sa
base et sa garde sont validées, sans attendre les neuf autres, mais CDI-134
exige les dix bases et CDI-135 exige les dix bases et les dix gardes. Dérouler ensuite les autres familles et les seules
déclinaisons utiles, écran par écran. Les épreuves ont leur
branche 115/N1–N6. La convergence appliquée est : CDI-135 (Q1) et CDI-129–134 (N1–N6),
CDI-114/115 et les packs déjà livrés → CDI-116 → CDI-104. Les besoins A1/A2
identifiés par CDI-117 doivent devenir des prérequis supplémentaires du
consommateur et de CDI-135, ainsi que de CDI-134 pour les héros, avant clôture
du tri ou du pilote concerné. Les liens réciproques sont vérifiés ; WIP ≤ 3
et GitHub sync off conservés.

CDI-113, CDI-117, CDI-136–142 et CDI-148 sont `Done`. CDI-115 reste
`Paused` sur le piège, sans déclarer les autres épreuves terminées. Les bases
CDI-143–145 et les autres nouveaux tickets sont `Later`.
Les lots avec états
persistants (121, 123, 124, 125) dépendent de 114 : le pilote de tir/soin se
clôture après cette preuve, même si sa préparation visuelle peut être étudiée avant.

## 8. Validation, coût et conditions de fin

Un écran prêt à montrer doit se rejouer automatiquement, avec les mêmes assets
et le même lecteur que le jeu. Le pas-à-pas aide au diagnostic ; il ne remplace
pas le combat continu. Pour chaque famille : préparation visible, bonne pose,
origine de projectile, contact, valeurs, réaction, récupération et attente.
Vérifier quatre héros/trois ennemis, cibles éloignées, changements de profondeur,
létal avec survivant, esquive et multihit, puis le mélange des familles.

Critères visuels : geste compréhensible sans lire le journal, visage stable,
arme cohérente, proportions stables entre poses, pieds ancrés, éclairage juste,
silhouettes non superposées, PV/PM lisibles, bulles hors visage, effets non
envahissants. Validation utilisateur par planche puis par écran, jamais de
validation globale déduite d’un « je valide » portant sur un seul écran.

Critères techniques : projection déterministe, replay fidèle, aucun calcul
métier React, métadonnées compatibles, aucune commande depuis les effets,
annulation et ressources bornées, mode sans animation complet, texte accessible.
Après l’accord visuel du lot, exécuter les tests ciblés et la régression
proportionnée ; seuls leurs résultats réels sont consignés comme preuves.

Budgets existants conservés : JS gzip total ≤ 250 KiB, fichier ≤ 300 KiB,
16 effets temporaires, historique ≤ 15 rencontres, campagne de 100 rencontres,
PC 1024/1280/1440 et zoom 200 %. Les 2 MiB artistiques par scène doivent
désormais comptabiliser les **nouvelles poses**, même si elles représentent un
héros déjà existant ; l’exclusion des anciens portraits n’est pas un passe-droit.
Mesurer froid/cache, mémoire décodée et changements de groupe ; charger les
identités/poses utiles, pas les 200 paires neutre/garde au démarrage. Atlas et découpage de
fichiers sont des choix à mesurer sur le pilote, pas une solution présumée.
Toute révision de budget est une décision explicite avant généralisation.

La clôture exige une couverture sans action actuelle manquante : bases cohérentes,
poses réellement nécessaires produites ou réutilisations validées, signatures lisibles,
chaque action intégrée et chaque écran concerné validé. Ni tests verts seuls,
ni génération d’images seule, ni quatre héros pilotes ne terminent le chantier.
Inversement, une famille lisible avec un seul sprite ne reçoit pas de poses
supplémentaires pour atteindre un quota artistique.

## 9. État de cette révision

Plan ajusté au verdict utilisateur du 15 septembre 2026 : vingt identités par
classe, bases neutres, gardes puis poses d’action. Aucun sprite produit et aucun
code applicatif changé par cette révision documentaire. Le Workboard ajoute
CDI-148–157 et relie les gardes aux consommateurs. Les preuves antérieures de
113/115 restent identifiées comme telles ; aucune nouvelle preuve applicative
n’est revendiquée.
Depuis cette révision documentaire, CDI-113, CDI-136–142 et CDI-148 ont été
validés et déplacés en `Done`. La prochaine base neutre de la chaîne est
CDI-143, consacrée aux Druides.
