# Donjon 2D — proposition de redécoupage des tickets

Date : 10 septembre 2026.
Statut : **approuvé, appliqué et vérifié — vingt tickets (1 S, 14 M, 5 L)**.
Demande : donner aux tickets une charge logique, en conservant une taille L
lorsque le regroupement est réellement justifié.

Référence de périmètre : [plan Donjon 2D](dungeon-2d-encounter-plan.md).
Les vingt tickets Markdown sont la source de vérité après application.
L'archive initiale `dungeon-2d-workboard-proposal.json` est conservée sans
réécriture historique. Le présent document conserve le contenu de l'aperçu
confirmé et consigne son application en section 9.

## 1. Décision proposée et règles de taille

Passer de huit lots à **vingt tickets exécutables** : recadrer CDI-097 à
CDI-104 et ajouter CDI-105 à CDI-116. Aucun ticket supprimé, aucun identifiant
réutilisé pour un sujet sans rapport. Les huit axes initiaux restent décrits
dans le plan, sans ajouter huit tickets parents qui doubleraient le suivi.

- **S** : une correction localisée et sa preuve de non-régression.
- **M** : un livrable borné, utilisant un contrat ou un mécanisme établi,
  avec ses tests et sa validation propres.
- **L** : un ensemble plus conséquent, mais dont la cohérence doit être
  prouvée de bout en bout avant clôture ; justification donnée ci-dessous.

Ces tailles sont relatives, pas des promesses de durée. Elles incluent les
tests, la documentation et la revue du livrable. Le délai d'attente d'un avis
visuel utilisateur n'est pas une charge de développement. Une décision de
poses dessinées supplémentaires dans CDI-097 imposerait de réestimer l'art
avant production : la taille actuelle repose sur les silhouettes transformées.

Chaque ticket doit être clôturable sur ses propres critères, sans attendre
la recette finale pour découvrir une omission. On ne découpe pas un même
correctif en tickets « code », « tests » et « documentation ».

## 2. Fichiers et champs concernés par la confirmation

Modifier uniquement les huit fichiers existants :

- `workboard/data/Doing/CDI-097/ticket.md`
- `workboard/data/Later/CDI-098/ticket.md`
- `workboard/data/Later/CDI-099/ticket.md`
- `workboard/data/Later/CDI-100/ticket.md`
- `workboard/data/Later/CDI-101/ticket.md`
- `workboard/data/Later/CDI-102/ticket.md`
- `workboard/data/Later/CDI-103/ticket.md`
- `workboard/data/Later/CDI-104/ticket.md`

Créer uniquement les douze tickets suivants :

- `workboard/data/ToDo/CDI-105/ticket.md`
- `workboard/data/Later/CDI-106/ticket.md`
- `workboard/data/Later/CDI-107/ticket.md`
- `workboard/data/Later/CDI-108/ticket.md`
- `workboard/data/Later/CDI-109/ticket.md`
- `workboard/data/Later/CDI-110/ticket.md`
- `workboard/data/Later/CDI-111/ticket.md`
- `workboard/data/Later/CDI-112/ticket.md`
- `workboard/data/Later/CDI-113/ticket.md`
- `workboard/data/Later/CDI-114/ticket.md`
- `workboard/data/Later/CDI-115/ticket.md`
- `workboard/data/Later/CDI-116/ticket.md`

Pour les tickets existants : actualiser `title`, `size`, `risk`, `depends_on`,
`blocks`, `related_docs`, le titre Markdown et les treize sections obligatoires
en fonction des périmètres ci-dessous. Conserver `id`, `status`, `area`,
`priority: P1`, `source` et `github_issue: null`. CDI-097 conserve son titre,
sa taille, son risque et son périmètre ; seuls les liens et la reprise sont
précisés. Pour les nouveaux : créer tous les champs et sections obligatoires,
avec priorité P1, source de la demande de redécoupage du 10 septembre et
`github_issue: null`.

Documents à actualiser après confirmation :

- `docs/development/dungeon-2d-encounter-plan.md` : références de tickets dans
  les écarts, contrat, art, séquencement, matrice V01–V18 et reprise ; conserver
  les exigences produit, budgets et preuves historiques de la création initiale.
- `docs/development/dungeon-2d-resizing-proposal.md` : statut d'approbation,
  résultat d'application et preuves de validation du redécoupage.

Ne pas modifier l'archive initiale, les 96 tickets antérieurs, la configuration
Workboard, les fichiers applicatifs ou les documents de déploiement présents
dans l'arbre de travail. Ni commit, ni push, ni synchronisation GitHub.

## 3. Titres, tailles, risques et dépendances exacts proposés

Les numéros abrégés ci-dessous désignent les identifiants `CDI-###`.
La colonne « Bloque » est le miroir exact des dépendances directes.

| ID | Titre proposé | Taille / risque | Area | Statut | Dépend de | Bloque |
| --- | --- | --- | --- | --- | --- | --- |
| 097 | Valider la composition PC de la scène Donjon 2D | M / medium | ui | Doing | — | 098, 099 |
| 098 | Capturer les acteurs initiaux dans un contrat de rencontre compatible | L / high | architecture | Later | 097 | 100, 106 |
| 099 | Préparer le catalogue visuel et le kit pilote CDIdle | L / medium | art | Later | 097 | 101, 108, 109, 110, 111, 112 |
| 100 | Projeter les rencontres en états de scène déterministes | M / high | frontend | Later | 098, 105 | 106, 107 |
| 101 | Construire la scène de combat simple CDIdle | M / medium | ui | Later | 099, 107 | 103 |
| 102 | Mettre en scène trésors, repos et réanimations | M / medium | ui | Later | 103, 106 | 115 |
| 103 | Intégrer le premier combat et sécuriser son cycle de lecture | L / high | frontend | Later | 101 | 102, 113 |
| 104 | Consolider la recette et préparer la livraison des rencontres 2D | M / high | quality | Later | 116 | — |
| 105 | Corriger la cible journalisée par une compétence létale | S / high | architecture | ToDo | — | 100 |
| 106 | Compléter les traces et projections de ressources et de cibles | M / high | architecture | Later | 098, 100 | 102, 113 |
| 107 | Construire le lecteur temporel annulable à cadence constante | M / high | frontend | Later | 100 | 101 |
| 108 | Compléter les assets des Égouts infestés | M / medium | art | Later | 099 | 116 |
| 109 | Produire les assets des Galeries des contrebandiers | M / medium | art | Later | 099 | 116 |
| 110 | Produire les assets des Citernes oubliées | M / medium | art | Later | 099 | 116 |
| 111 | Produire les assets du Bastion des Exclus | M / medium | art | Later | 099 | 116 |
| 112 | Produire les assets de la Cour du Roi des Rats | M / medium | art | Later | 099 | 116 |
| 113 | Animer les compétences, projectiles et soins du combat | M / medium | ui | Later | 103, 106 | 114 |
| 114 | Tracer et représenter les statuts, intentions et protections | L / high | ui | Later | 113 | 116 |
| 115 | Mettre en scène les six épreuves du Donjon | L / medium | ui | Later | 102 | 116 |
| 116 | Mesurer et stabiliser les performances des scènes complètes | M / high | quality | Later | 108, 109, 110, 111, 112, 114, 115 | 104 |

Répartition : **1 S, 14 M, 5 L**. CDI-097 est passé en Doing au démarrage de
son exécution ; CDI-105 reste prêt en ToDo. CDI-105 est indépendant du prototype : la mauvaise cible est une anomalie de trace
existante, à reproduire avant correction, pas une décision de design.

## 4. Livrables et limites des tickets

### CDI-097 — prototype cadré, M conservé

Conserver le prototype isolé : composition quatre héros/trois ennemis,
états attente/KO/repos/épreuve, clavier, journal, 1024/1280/1440 px et zoom 200 %.
Démontrer anticipation, déplacement, impact et retour avec quelques silhouettes.
L'avis utilisateur arrête le besoin de poses dédiées avant CDI-099. Ni lecteur
de production, ni persistance, ni bibliothèque complète dans ce prototype.

### CDI-098 — contrat initial, L conservé et justifié

Livrer l'extension additive, versionnée et facultative du record : acteurs
capturés avant résolution/XP, identités héros et clés blueprint/membre ennemi,
places, PV/PM et état KO nécessaires aux neuf types. Documenter une matrice
des champs existants/manquants et leur propriétaire 105/106/114.

Prouver compatibilité ancien/nouveau, validation API, persistance, cache,
bootstrap, cross-tab, replay, historique de quinze entrées, parité métier/RNG
et coût en octets sur traces longues. Une preuve Supabase locale est requise
pour ce contrat persisté. Ne pas inclure les corrections de cible (105) ni
l'enrichissement de toutes les actions (106/114). **L reste justifié par le
contrat traversant ces frontières : une moitié compatible n'est pas livrable.**

### CDI-099 — catalogue et kit pilote, L conservé et justifié

Préparer une seule chaîne réutilisable d'extraction/détourage des planches
existantes : 400 identités résolubles et conservation de la variante à travers
les classes, sans redessiner 400 héros. Ajouter catalogue de présentation,
ancrages, échelles, provenance, versions, fallback, chargement à la demande,
cache borné et vérificateur de couverture.

Le kit pilote comprend le décor des Égouts et les trois membres de `rat-pack`,
avec les effets simples nécessaires au prototype retenu. Mesurer le poids et
valider visuellement l'échantillon et les détourages représentatifs sur fond
sombre. Toute identité non montrée individuellement reste vérifiée par la
couverture et les contrôles de planches, sans inventer 400 avis utilisateur.
**L correspond à l'outillage réutilisable et à sa première preuve artistique**,
pas à toute la production ennemie. Les quatre autres décors, les autres ennemis
et les accessoires hors combat passent dans leurs tickets dédiés.

### CDI-100 — projection pure, M

Adapter les records nouveaux/anciens vers acteurs, actions, points d'impact,
PV/PM et résultat ; établir l'état à t sans minuterie ni rendu React. Couvrir
coup normal/létal, KO, conséquences déjà explicitement disponibles, ordre et
regroupement des événements. Prouver égalité projection directe/pas à pas et
identifiants stables. Records insuffisants, inconnus ou héros retirés du roster
actuel : résumé honnête, jamais reconstruction fictive. Les informations encore
absentes sont identifiées pour 106/114, pas déduites du français. Le lecteur
temporel et ses promesses appartiennent à 107.

### CDI-101 — combat simple, M

Composer les acteurs et couches, entrée/repos animé, mêlée, impact, nombre
flottant, PV, esquive, critique, KO et résultat avec le lecteur et le kit pilote.
Supporter jusqu'à quatre héros/trois ennemis et les identités historiques.
Inclure nettoyage, plafond de 16 effets temporaires, HTML accessible et
mouvements réduits. Prouver les cibles/valeurs et le coup létal sur le bon acteur.
Les actions avancées encore non chorégraphiées restent fidèles par un rendu
neutre/résumé explicite ; leur rendu final relève de 113/114. Pas de branchement
à l'automate dans ce ticket de rendu.

### CDI-102 — trésor/repos, M

Créer et raccorder dans le vrai Donjon les deux scènes et leurs accessoires :
coffre vide/contenu exact, récupération partielle PV/PM, un ou plusieurs KO de
segment réanimés. Installer la composition non-combat réutilisée par 115.
Inclure provenance/poids des accessoires, valeurs reçues, cas plafonnés,
accessibilité et avis visuel. Pas de clic de collecte, héros de ville ajouté
ou pourcentage recalculé. Les six épreuves restent temporairement sur leur
présentation fidèle existante jusqu'à 115.

### CDI-103 — première intégration robuste, L conservé et justifié

Brancher le combat pilote sur `CurrentEncounterPanel`, conserver historique,
commandes, préférence locale d'animations et résumé ; adapter les assertions
de hauteur/transcript dans le périmètre réellement remplacé. Prouver cadence
400 ms par événement existant plus clôture, délai auto 4 750 ms, nombre de
commandes inchangé, priorité résultat/rencontre suivante/jalon et conservation
des parcours 5/10/50, vocation, KO et farm.

Inclure dès cette intégration navigation, document masqué, reprise sans rafale,
cross-tab/leader/observateur, replay/doublon/conflit, nouvelle révision,
reset/logout/compte suivant et erreurs. Les valeurs de lecture restent locales.
**L est maintenu parce que dispatch, automate et annulation doivent être
validés ensemble**, sans repousser leur sûreté à une recette finale.

Le pilote ne dépend pas des cinq packs de zone ou des huit scènes hors combat.
Acteurs sans art final et actions encore non chorégraphiées restent représentés
honnêtement ; les rencontres non-combat gardent temporairement leur affichage
existant. Ces états transitoires sont explicitement fermés par 108–115 et ne
constituent pas le résultat final accepté du chantier. Ce ticket n'autorise
aucun déploiement partiel automatique.

### CDI-104 — recette de clôture, M

Consolider les preuves V01–V18 déjà obtenues au fil des tickets, leur date,
environnement et limite ; effectuer une régression ciblée du produit complet
et réunir le verdict visuel final. Contrôler neuf types intégrés, toutes zones,
actions, ancien/nouveau contrat, accessibilité, documentation et audit pré-push.
Vérifier l'intégration Supabase/concurrence sur la version complète et utiliser
les mesures 116 ; aucune mesure simulée ne vaut un FPS réel. Ne pas transformer
ce ticket en réservoir d'implémentations oubliées : rouvrir/tracer chez le
propriétaire et ne pas clôturer avec un écart réel non corrigé. Publication
éventuelle et CI restent distinctes, soumises aux confirmations du projet.

### CDI-105 — mauvaise cible au coup létal, S

Reproduire la branche de compétence monocible avec cible tuée et survivant
suivant, puis corriger uniquement l'identité/PV journalisés au point d'impact.
Ajouter le cas sans survivant et prouver état métier, RNG et récompenses
inchangés. Ne pas enrichir le schéma ni modifier le choix de cible du combat.
Le constat est statique à ce jour : aucun test de reproduction n'est encore
déclaré passé.

### CDI-106 — ressources et cibles, M

Compléter au producteur les données structurées réellement absentes de mana,
auteurs, impacts multiples, cibles explicites, soins/récupération et conséquences
des huit rencontres hors combat ; étendre dans le même ticket leur projection
pure et leurs fixtures. Distinguer dégâts annoncés/PV effectivement retirés,
héros sélectionné, butin et pertes réelles. Couvrir les branches applicables
sans parsing de texte et sans nouvelles attentes dans le calendrier.

Exclure début/fin de buffs/debuffs, intentions et protection du Roi, pris en
charge verticalement par 114. Vérifier compatibilité additive, parité métier,
taille des traces et pipeline local pour les changements persistés. Ce ticket
n'attend pas les animations 113 pour démontrer la fidélité de ses données.

### CDI-107 — lecteur temporel, M

Consommer la projection 100 avec horloge injectée, rattrapage direct, identité
de génération, annulation, déduplication et promesses toujours libérées.
Prouver le calendrier identique avec rendu désactivé, hors page, 60/120 Hz,
asset lent, absence de fin CSS et changement de session. Garder les animations
décoratives indépendantes de la cadence ; aucun appel métier depuis un callback
visuel. Cent rencontres déterministes ne font pas croître timers/collections.
Le raccordement réel des hooks applicatifs et de la visibilité appartient à 103.

### CDI-108 à CDI-112 — un pack artistique par zone, cinq M

Chaque pack contient les membres des quatre rencontres régulières, de l'élite
et du boss de sa zone, ainsi que son décor ; réemplois de familles autorisés
si les acteurs et leurs rôles restent distincts. Couverture calculée depuis
`UNDERCITY_ZONES`, provenance, ancrages, échelles, transparence, cache/fallback,
poids à froid et validation utilisateur font partie de chaque ticket.

| Ticket | Zone canonique | Couverture vérifiée dans le catalogue actuel |
| --- | --- | --- |
| 108 | `sewers` | 6 blueprints, 11 emplacements de membres ; réutiliser les 3 rats et le décor de 099 |
| 109 | `smugglers` | 6 blueprints, 14 emplacements de membres |
| 110 | `cisterns` | 6 blueprints, 10 emplacements de membres |
| 111 | `bastion` | 6 blueprints, 13 emplacements de membres |
| 112 | `court` | 6 blueprints, 15 emplacements de membres ; Roi et deux gardes distincts |

Les 63 emplacements ne sont pas une exigence de 63 illustrations originales :
certains membres/familles se réemploient. Aucune scène, aucun équilibrage et
aucune nouvelle zone de gameplay dans ces tickets. Le pack 108 complète le
kit pilote sans refaire son travail. Chaque zone est vérifiable séparément ;
aucune chaîne artificielle 108 puis 109 puis 110 n'est imposée.

### CDI-113 — compétences, projectiles et soins, M

Étendre le combat déjà intégré : tir, sort offensif, soin allié/soutien ennemi,
multi-frappe et dégâts multicibles, avec les effets génériques nécessaires.
Profils tirés de l'action reçue, bons auteurs/cibles, nombres/jauges au même
instant ; coûts de mana exacts et pas d'impacts inventés. Inclure provenance/
poids des effets, plafonds de rendu, mouvements réduits et vérification visuelle
sur le vrai Donjon. S'appuyer sur 106 ; ne pas reconstituer les statuts non
tracés, qui appartiennent à 114.

### CDI-114 — statuts et intentions de bout en bout, L justifié

Tracer dans le domaine les débuts, cibles multiples, changements et fins des
buffs/debuffs/protections, intentions et phases du Roi ; projeter ces données
puis les rendre dans la scène intégrée. Une matrice de couverture clôture les
champs encore ouverts de 098. Tester mana/effets collectifs, expiration,
gardes/protection du Roi, changement d'intention et événement inconnu.

**Le L évite trois tickets artificiels de schéma, projection et icône qui
pourraient être déclarés terminés sans prouver la même durée d'effet.**
Préserver RNG/résultats et calendrier existants ; prouver compatibilité,
octets et pipeline local des changements persistés. Le rendu fonctionne avec
les fallbacks neutres tant que le pack 112 n'est pas prêt ; la recette finale
exige le Roi et ses gardes définitifs. Aucun système de statuts métier nouveau.

### CDI-115 — six épreuves paramétrées, L justifié

Réaliser et intégrer `trap`, `enigma`, `ambush`, `ritual`, `obstacle`,
`negotiation`, leurs six accessoires et les branches succès/échec applicables.
Réutiliser la composition non-combat 102 et les données 106 : héros sélectionné,
issue, pertes, mana, or et récompenses exacts. Chaque type reçoit une mise en
scène identifiable ; le partage de moteur n'autorise pas six animations
visuellement identiques. `ambush` reste une épreuve, sans combat ajouté.

**L est justifié par un même contrat de défi et une matrice paramétrée commune**,
après retrait de trésor/repos et du socle technique. Livrer les six variantes
ensemble évite six petits tickets répétant montage, fixtures et validation.
Inclure provenance/poids des accessoires, mouvements réduits, clavier, résumé,
et avis utilisateur sur les issues contrastées. Aucun échec n'invente un wipe.

### CDI-116 — budgets et endurance, M

Avec toutes les scènes et tous les packs disponibles, mesurer le scénario
représentatif et le maximal réel : JS gzip total/fichier 250/300 KiB, assets
supplémentaires à froid proposés à 2 MiB par scène/zone, egress et quinze
traces enrichies longues, charge hors vue, ressources sur cent rencontres.
Mesurer réellement la cible de 60 FPS sur le poste PC de référence aux trois
largeurs retenues et consigner matériel, navigateur, viewport et durée.
Corriger uniquement les écarts de
performance localisés, sans changement de moteur/refactor global non justifié.
Une révision de budget nécessite une décision explicite. Ne pas confondre
preuves simulées d'horloge et mesures de rendu. Réutiliser les harnesses et
mesures progressivement ajoutés, sans bâtir un second moteur de test général.

## 5. Ordre de livraison et fermeture des états transitoires

1. CDI-097 fixe structure/actions/composition PC et le mode d'animation ; CDI-105
   peut corriger indépendamment la trace existante.
2. Contrat initial 098 et catalogue/kit 099, puis projection 100, lecteur 107,
   combat simple 101 et **intégration réelle 103**. Les compléments 106 peuvent
   avancer une fois leur projection de base prête, sans bloquer ce pilote.
3. Production artistique par zone 108–112 et extensions intégrées :
   ressources 106, trésor/repos 102, compétences 113, statuts 114, épreuves 115.
4. Mesures sur produit complet 116 puis recette consolidée 104.

Les dépendances décrivent des prérequis de livrable, pas une autorisation de
déléguer à des agents. Aucun prérequis artistique complet ne bloque le pilote.
CDI-116 dépend de toutes les branches terminales ; CDI-104 dépend de 116 :
aucun morceau de la couverture finale ne peut être oublié par le graphe.

## 6. Traçabilité des huit lots initiaux

| Lot initial | Répartition proposée de tout son périmètre |
| --- | --- |
| 097, prototype | 097 inchangé sur le fond |
| 098, trace complète | 105 ciblage ; 098 acteurs/compatibilité ; 106 ressources/cibles ; 114 statuts/intentions ; preuve de clôture 104 |
| 099, bibliothèque entière | 099 catalogue/héros/pilote ; 108–112 zones/ennemis ; 102 et 115 accessoires hors combat ; 101/113/114 effets correspondant à leurs actions |
| 100, projection et lecteur | 100 projection de base ; 106/114 extensions correspondantes ; 107 lecteur ; 103 raccordement applicatif |
| 101, toutes animations combat | 101 combat simple ; 113 compétences/soins ; 114 effets persistants/intentions/Roi |
| 102, huit scènes hors combat | 102 trésor/repos ; 115 les six épreuves, avec assets et intégration dans chacun |
| 103, intégration complète | 103 premier combat et toutes garanties de cycle ; 102/113/114/115 intégration de leurs extensions ; 104 preuve des neuf types finaux |
| 104, toute validation | Tests et avis propres à chaque ticket ; 116 mesures/endurance ; 104 consolidation, régression finale et préparation de livraison |

### Propriétaires proposés de V01–V18

| ID | Responsables après redécoupage |
| --- | --- |
| V01 | 097, 098, 099, 100, 108–112 |
| V02 | 105, 100, 101, 106, 113 |
| V03 | 105, 100, 101, 113 |
| V04 | 106, 113, 114 |
| V05 | 114, 112 |
| V06 | 098, 100, 101, 102, 103 |
| V07 | 106, 102, 115 |
| V08 | 103 |
| V09 | 107, 103 |
| V10 | 107, 103 |
| V11 | 098, 107, 103, 104 |
| V12 | 107, 103, 104 |
| V13 | 098, 099, 100, 103, 108–112 |
| V14 | 097, 101, 102, 103, 113, 114, 115, 104 |
| V15 | 097, 101, 108–112, 104 |
| V16 | 107, 116 |
| V17 | 098, 106, 114, 104 |
| V18 | 097, 099, 101, 102, 108–115, 104 |

CDI-104 consolide les dix-huit preuves ; cette responsabilité ne dispense
aucun propriétaire de tester et valider son propre livrable.

### Contrôle des 49 critères initiaux

C1, C2, etc. désignent les cases d'acceptation dans l'ordre de chaque ticket
initial, conservé dans l'[archive approuvée des huit tickets](dungeon-2d-workboard-proposal.json).
Le rapprochement a été effectué avec les critères et contrats des vingt tickets
écrits. Chaque critère initial a au moins un propriétaire ; les critères
regroupés sont répartis sans supprimer leurs conditions. Les exigences produit
et les dix-huit scénarios du plan restent inchangés.

| Ticket initial | Critères initiaux → tickets responsables après redécoupage |
| --- | --- |
| CDI-097 | C1 → 097 ; C2 → 097 ; C3 → 097 ; C4 → 097 ; C5 → 097 |
| CDI-098 | C1 → 105 ; C2 → 098 ; C3 → 098, 106, 114 ; C4 → 098, 105, 106, 114 ; C5 → 098, 100, 106, 114 ; C6 → 098, 106, 114, 116 ; C7 → 098, 106, 114, 104 |
| CDI-099 | C1 → 099 ; C2 → 108, 109, 110, 111, 112, 104 ; C3 → 102, 115 ; C4 → 099, 102, 108, 109, 110, 111, 112, 113, 114, 115 ; C5 → 099, 102, 108, 109, 110, 111, 112, 113, 114, 115, 116 ; C6 → 099, 108, 109, 110, 111, 112, 104 |
| CDI-100 | C1 → 100, 106, 114 ; C2 → 100, 102, 106, 114 ; C3 → 107, 103 ; C4 → 107, 103 ; C5 → 107, 103 ; C6 → 107, 116 |
| CDI-101 | C1 → 101, 102, 113, 114 ; C2 → 099, 108, 109, 110, 111, 112, 104 ; C3 → 105, 100, 101, 113 ; C4 → 101, 103, 113, 114 ; C5 → 101, 103, 113, 114 ; C6 → 101, 113, 114, 116 |
| CDI-102 | C1 → 102, 115 ; C2 → 102 ; C3 → 102 ; C4 → 106, 115 ; C5 → 115 ; C6 → 102, 115 |
| CDI-103 | C1 → 103, 102, 113, 114, 115, 104 ; C2 → 103 ; C3 → 103 ; C4 → 107, 103 ; C5 → 107, 103 ; C6 → 103 ; C7 → 103, 104 |
| CDI-104 | C1 → 104 ; C2 → 101, 108, 109, 110, 111, 112, 116, 104 ; C3 → 104 ; C4 → 116, 104 ; C5 → 098, 106, 114, 104 ; C6 → 104 |

## 7. Contrôles prévus à l'application

- Recontrôler les tickets présents et les identifiants libres avant écriture.
- Vérifier la correspondance entre cet aperçu confirmé et les vingt tickets :
  tailles, statuts, périmètres, exclusions, critères, tests et handoffs.
- Vérifier liens documentaires, unicité des identifiants, graphe sans cycle,
  miroirs `blocks`, accessibilité de tous les lots depuis la clôture 104.
- Exécuter `npm.cmd run board:validate` : résultat attendu si le reste du
  tableau reste inchangé, **116 tickets et zéro erreur**.
- Vérifier la conservation de tous les critères initiaux et de V01–V18 ;
  contrôler les fichiers hors périmètre et les espaces de fin de ligne.
- Aucun test applicatif, contrôle de serveur, lancement de navigateur ou
  changement Git n'est nécessaire pour ce redécoupage documentaire.

## 8. État des preuves de cette proposition

Lecture des huit tickets, du plan, de la configuration et du validateur
Workboard effectuée. Le catalogue `UNDERCITY_ZONES` confirme les cinq zones,
leurs trente blueprints et les effectifs utilisés pour dimensionner les packs.
Les tailles restent une estimation de travail, pas une mesure de réalisation.
La proposition ne déclare aucune fonctionnalité, correction ou image livrée.

Contrôles effectués sur l'aperçu le 10 septembre : vingt identifiants uniques,
répartition 1 S / 14 M / 5 L, dépendances réciproques, absence de cycle et
vingt tickets couverts par les prérequis transitifs de clôture de CDI-104
(CDI-104 inclus). Les dix-huit lignes V01–V18 ont des responsables. Les douze
nouveaux identifiants sont libres au moment du contrôle. Les liens locaux de
ce document existent et ses lignes ne portent pas d'espaces finaux.

Avant application, `npm.cmd run board:validate` avait confirmé **104 tickets,
zéro erreur** sur le tableau alors inchangé. Le contrôle du tableau après
application est consigné ci-dessous ; ces deux preuves ne sont pas confondues.

La confirmation demandée portait sur les vingt titres/périmètres, tailles,
dépendances et fichiers listés ici. Elle a été reçue avant l'écriture des
tickets, conformément au workflow du skill Workboard.

## 9. Application confirmée

Le 10 septembre 2026, l'utilisateur a répondu à la demande d'application :
« Oui, applique ce découpage ». Huit tickets sont recadrés et douze ajoutés,
sans suppression ni déplacement d'un ticket existant. Le plan est synchronisé
avec ces vingt périmètres et la matrice V01–V18.

Le sandbox a refusé la création du premier dossier. Une élévation ciblée a
créé uniquement `ToDo/CDI-105` et `Later/CDI-106` à `Later/CDI-116` ; aucun
changement d'ACL n'a été effectué. Tous les contenus ont été écrits avec
`apply_patch`.

Preuves obtenues après application :

- `npm.cmd run board:validate` : **116 tickets, zéro erreur**.
- Vingt fichiers comparés intégralement aux contenus préparés : correspondance
  exacte ; leur sérialisation avec le générateur officiel Workboard est identique.
- Titres, tailles, risques, areas, statuts, dépendances et blocks correspondent
  au tableau approuvé ; les champs déclarés conservés des huit tickets le sont.
- Les douze sections métier/validation de CDI-097 sont inchangées ; seul son
  handoff et son lien documentaire sont précisés.
- Vingt tickets appartiennent au graphe de clôture de CDI-104, sans cycle ;
  les dix-huit scénarios ont les mêmes propriétaires dans le plan et l'aperçu.
- Les 49 critères initiaux ont été rapprochés des critères/contrats écrits
  selon la table de section 6 ; les huit types hors combat et tous les assets
  restent requis, pas seulement le pilote.
- Tous les related_docs et liens Markdown locaux contrôlés existent ; sections
  obligatoires complètes, aucun placeholder et aucune ligne à espace final.
- Les empreintes des 96 anciens tickets, de l'archive initiale, de la
  configuration Workboard et du SQL de préflight sont inchangées.
- `git diff --check` est sans erreur et aucun fichier applicatif suivi n'a
  changé. Aucune mutation Git, synchronisation GitHub ou publication effectuée.

Le document hors périmètre `docs/deployment/2026-09-10-back-front-plan.md`
a changé pendant cette intervention, sans écriture de notre part. Il a été
laissé intact ; son empreinte n'est donc pas déclarée inchangée.

Le redécoupage documentaire est terminé. CDI-097 est désormais en Doing,
CDI-105 reste prêt en ToDo et les dix-huit autres en Later. Aucune implémentation, correction métier,
image, validation visuelle ou performance future n'est déclarée livrée.

Le périmètre a ensuite été précisé par l'utilisateur : toute la phase Donjon
2D se concentre sur le mode PC. Les critères visuels et de performance portent
sur 1024/1280/1440 px et zoom 200 %. La composition mobile/tablette sous
1024 px est différée dans le plan avec ses conditions de reprise ; les tailles
et dépendances des vingt tickets restent inchangées.
