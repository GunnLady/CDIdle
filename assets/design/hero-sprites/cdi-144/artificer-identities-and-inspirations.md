# CDI-144 — Identités et inspirations des Artificiers

## Canon CDIdle vérifié

- L'Artificier T1 est un fabricant et réparateur de terrain. Ses appareils
  produisent les effets de classe ; ce ne sont ni des incantations de Mage, ni
  une collection d'armes modernes.
- `flame_thrower` et `lightning_arc` restent des jets issus d'un dispositif
  mécanique. `overcharged_core` active un noyau allié et `static_trap` pose un
  dispositif adverse, sans ajouter de mécanique persistante de métier.
- Les armes historiques (`basic_gear_cannon`, `basic_rifle`,
  `basic_crossbow`) n'imposent pas l'équipement visible des bases neutres.
- Le niveau T1 doit évoquer un artisan expérimenté et mobile : outils compacts,
  vêtements réparables, protections localisées et appareils plausibles, sans
  exosquelette ni laboratoire ambulant.

## Direction générale adaptée de CDI-143

L'Artificier CDIdle est un **praticien de terrain des mécanismes**. Il peut être
réparateur, hydraulicien, horloger, fondeur, fabricant d'instruments, mécanicien
textile, opticien, appareilleur ou technicien de noyaux. Comme pour les Druides
validés, sa tenue doit répondre à un travail concret et à un environnement avant
d'ajouter un symbole de classe.

La silhouette doit faire lire, dans cet ordre :

1. l'identité humaine déjà établie par le Novice correspondant ;
2. une fonction technique concrète ;
3. une tenue T1 crédible d'aventurier aguerri ;
4. deux ou trois marqueurs forts d'Artificier et de spécialité ;
5. éventuellement un accessoire compact et physiquement attaché ;
6. jamais une règle de gameplay ou l'équipement réellement possédé.

## Étalon visuel et garde de proportions

Contrôle obligatoire avant de présenter une nouvelle génération, repris du
processus Druide :

1. vérifier les dimensions et le poids en Ko/Mo du fichier source ;
2. mesurer la boîte englobante des pixels visibles (`alpha > 15`) ;
3. produire une normalisation temporaire sur le canevas runtime `341 × 692`
   avec le gabarit Novice de même genre et même index ;
4. comparer position verticale, hauteur visible, ligne des pieds et pivot aux
   Mages M06/M08 pour les hommes ou F06/F08 pour les femmes ;
5. contrôler séparément tête, épaules, tronc, bras, hanches et jambes : taille
   relative de la tête, largeurs des épaules et du bassin, position de la taille,
   longueur du torse, des bras, des cuisses et des jambes, niveau des mains et
   des genoux ; le candidat doit rester dans l'intervalle des deux Mages ;
6. distinguer l'anatomie de l'encombrement du vêtement et des appareils afin
   qu'un habit à pans, une robe, un harnais ou un boîtier ne donne pas
   artificiellement une silhouette géante ;
7. ne présenter le candidat que si l'échelle et toutes les proportions passent,
   puis consigner dimensions source/export, boîte visible et poids en Ko/Mo.

Les quatre Mages fournissent uniquement l'échelle et les rapports corporels.
Chaque Artificier conserve strictement visage, carnation, cheveux, morphologie
et pose neutre de son Novice. Un vêtement peut modifier le contour visible ; il
ne peut ni allonger le squelette, ni grossir la tête, ni déplacer une articulation.

## Références historiques et culturelles

Les références ci-dessous donnent des **fonctions**, des principes techniques
et des familles de matières. Elles ne servent pas à reproduire des costumes,
des inscriptions, des symboles religieux ou des objets patrimoniaux précis.

| Référence | Apport retenu | Limite de transposition |
| --- | --- | --- |
| [Automates hydrauliques d'al-Jazari — The Met](https://www.metmuseum.org/art/collection/search/451298) | Roues à eau, conduites, flotteurs, maintenance de mécanismes hydrauliques | Aucun décor, vêtement ou manuscrit copié |
| [Échappement hydraulique de Su Song — Science Museum Group](https://collection.sciencemuseumgroup.org.uk/objects/co894/scale-model-of-su-songs-water-balance-escapement) | Régulation, contrepoids, séquences mécaniques et modules remplaçables | Pas de reproduction de l'horloge monumentale |
| [Métallurgie africaine — National Museum of African Art](https://africa.si.edu/exhibitions/african-mosaic-selections-permanent-collection/metals) | Fonte, forge, moulage et importance du savoir technique | Aucun emblème communautaire ou objet de prestige copié |
| [Fonte à cire perdue en Afrique de l'Ouest — Smithsonian MCI](https://mci.si.edu/node/1247593) | Modèles en cire, noyaux d'argile et outils fins de coulée | Employer le procédé comme métier, pas comme raccourci culturel |
| [Astrolabe planisphérique — The Met](https://www.metmuseum.org/art/collection/search/451699) | Laiton gravé, instruments de précision, pièces plates articulées | Pas d'inscription religieuse ni de copie de décor |
| [Astrolabe du Yémen rasoulide — The Met](https://www.metmuseum.org/art/collection/search/444408) | Lien entre fabrication, observation et traité technique | Pas de fac-similé patrimonial |
| [Métiers Jacquard — Science Museum Group](https://collection.sciencemuseumgroup.org.uk/search/objects/object_type/jacquard-loom) | Cartes de motifs, navettes, commande séquentielle d'un textile | Pas de machine industrielle complète portée sur le dos |
| [Métallurgie et distillation du zinc à Zawar — Indian Science Heritage](https://indiascienceheritage.gov.in/Home5.html) | Cornues, creusets, maîtrise thermique et séparation des matières | Pas de costume régional inventé ou stéréotypé |
| [Uniformes et équipements napoléoniens — musée de l'Armée](https://www.musee-armee.fr/magazine/les-uniformes-et-equipements-des-soldats-de-larmee-napoleonienne.html) | Silhouette immédiatement lisible du fusilier du début du XIXe siècle : habit ajusté, col structuré, revers, sangles croisées, giberne et équipement distribué près du corps | Reprendre la construction et le port, jamais un uniforme français, ses couleurs, ses insignes, son bicorne ou son fusil |
| [Équipement de campagne napoléonien — musée de l'Armée](https://www.musee-armee.fr/expoNapoleonStratege/docs/MA-livret-napoleon-strategeFR.pdf) | Drap de laine, havresac, baudrier, giberne, guêtres et logique d'un fantassin mobile chargé sans sac technique géant | Aucun symbole impérial, numéro de régiment, baïonnette ou tenue de reconstitution |
| [Exposition Steampunk — Museum of the History of Science, Oxford](https://www.mhs.ox.ac.uk/exhibits/steampunk/index.html) | Le steampunk comme pratique de design : fabrication visible, détournement artisanal et rencontre entre histoire des sciences et technologie imaginaire | Ne pas réduire le style à du laiton, des lunettes et des engrenages décoratifs |

## Références d'œuvres culturelles

Elles cadrent l'énergie de la classe et les risques de cliché ; aucune tenue,
silhouette, palette ou machine reconnaissable ne doit être reproduite.

| Œuvre | Apport retenu | À éviter |
| --- | --- | --- |
| [Engineer — Guild Wars 2](https://www.guildwars2.com/en/the-game/professions/engineer/) | Kits spécialisés et résolution pratique d'un problème | Tourelles, fusils et ceinture d'icônes copiés |
| [Machinist — Final Fantasy XIV](https://eu.finalfantasyxiv.com/jobguide/machinist/) | Dispositifs portatifs lisibles et automatismes | Arme à feu dominante ou silhouette de job copiée |
| [Eberron: Forge of the Artificer — D&D Beyond](https://www.dndbeyond.com/sources/dnd/efota) | Rencontre entre fabrication, innovation et merveilleux | Iconographie D&D et surcharge d'objets magiques |
| [Fullmetal Alchemist — VIZ](https://www.viz.com/fullmetal-alchemist) | Technique, prothèse et transformation de la matière | Automail, uniforme ou personnage reconnaissable |
| [Dr. Stone — VIZ](https://www.viz.com/blog/posts/dr-stone-rocks) | Ingéniosité lisible par les matériaux et les procédés | Coiffure, costume ou accessoire de personnage |
| [Arcane — Netflix](https://www.netflix.com/tudum/articles/arcane-season-1-recap?inapp=true) | Tension entre appareil compact, énergie et responsabilité | Hextech, cristaux, palettes Piltover/Zaun et costumes |
| [Steamboy — Sony Pictures](https://www.sonypictures.com/movies/steamboy) | Rétrofuturisme industriel du XIXe siècle, volumes sous pression et machines dont la fonction reste lisible | Steam Ball, machines monumentales, tenue ou personnage reconnaissable |
| [Dishonored — Bethesda](https://bethesda.net/game/dishonored-de) | Technologie industrielle étrange mêlée au fantastique, appareils robustes et gadgets spécialisés | Masques, armes, huile de baleine, architecture ou silhouette de Dunwall |

## Langage visuel commun

- Silhouette d'aventurier aguerri : posture neutre stable, vêtements entretenus
  mais réparés, protections sur les zones réellement exposées.
- Comme pour les Druides validés, l'appartenance à la classe doit rester forte
  à taille de jeu. Une tenue civile enrichie de micro-outils ne suffit pas.
- Chaque sprite porte obligatoirement trois marqueurs hiérarchisés : un marqueur
  de **silhouette Artificier** (habit structuré, protection ou harnais), un
  marqueur de **spécialité** immédiatement identifiable (module, étui ou matière)
  et un marqueur de **signature individuelle** (asymétrie, panneau, couleur ou
  système de fermeture). Au moins deux restent lisibles en silhouette réduite.
- Les marqueurs occupent des zones différentes du corps afin de ne pas devenir
  une masse de détails à la ceinture. Ils modifient le contour ou créent un fort
  contraste de matière ; ils ne reposent pas uniquement sur une gravure fine.
- Cuivre, fer bleui, bois, textile ciré, cuir, céramique, verre et corde sont
  distribués selon les métiers ; les engrenages ne sont jamais du remplissage.
- Les appareils restent fermés, gainés et portables. Aucun tuyau ne flotte dans
  le vide, aucun outil ne coupe la silhouette ou la pose neutre.
- Le fusilier napoléonien apporte une grammaire de coupe : col debout, habit
  ajusté ou veste à pans, poignets structurés, sangle diagonale et rangements
  plaqués au corps. Ces éléments sont recomposés dans des palettes fantasy et
  ne forment jamais un uniforme historique complet.
- Le steampunk apporte une grammaire mécanique : rivets utiles, carters,
  ressorts protégés, petites soupapes, isolants et conduites très courtes. Un
  détail n'est conservé que si sa fonction est compréhensible.
- Les femmes peuvent porter pantalon, jupe ou robe de travail longue si la
  mobilité, la protection et la spécialité restent lisibles.

## Matières et palettes adaptées

- Textiles : drap de laine, toile forte, lin, feutre, textile ciré et panneaux
  matelassés ; leur assemblage doit rester lisible à taille de jeu.
- Protections : cuir localisé, manchettes, tabliers segmentés, plaques de
  céramique et petites pièces de métal ; jamais une armure complète.
- Mécanismes : fer bleui, cuivre mat, laiton assombri, bois, verre épais,
  ressorts protégés et isolants textiles. Le métal brillant reste un accent.
- Couleurs : pétrole, prune, indigo, bleu ardoise, terre cuite, rouille, sauge,
  charbon, ivoire fumé et ocre. Brun et cuivre ne dominent pas toute la série.

## Accessoires adaptés

- Autorisés s'ils servent la fonction : rouleau d'outils fermé, raccords,
  boîtier de ressorts, gabarit articulé, carte de motif, étui d'instrument,
  lentille protégée, creuset, cornue opaque, isolant ou noyau fermé.
- Les mains restent de préférence libres. Un outil est rangé ou gainé dans la
  pose neutre ; il ne devient ni arme ni accessoire d'action.
- Aucun sac à dos-machine géant, tourelle, automate compagnon, câble flottant,
  nuage de vapeur ou engrenage suspendu.
- Aucun effet actif, éclair, flamme, aura, rune ou pièce en mouvement dans la
  pose neutre.

## Frontières avec les autres classes

- **Mage** : pas de robe académique, grimoire, cristal, glyphe ni énergie issue
  directement des mains.
- **Alchimiste** : pas de profusion de fioles, potion colorée ou laboratoire
  portable ; les contenants servent un procédé mécanique ou thermique précis.
- **Forgeron/Guerrier** : pas d'armure lourde, grand marteau, enclume ou posture
  de combattant.
- **Archer/Tireur** : aucune arme longue imposée par les clés historiques de
  classe ; la base neutre n'est pas un fusilier armé.
- **Voleur** : pas de capuche d'infiltration, masque ou accumulation de petites
  sacoches indistinctes.
- **Artificier cliché** : pas de lunettes obligatoires, engrenages collés,
  monocle, haut-de-forme, laiton uniforme ou machine absurde.

## Interdits de série

- Répéter vingt fois le même tablier de cuir, les mêmes gants et la même clé.
- Mettre des lunettes ou des engrenages décoratifs sur chaque personnage.
- Copier le bleu/blanc/rouge, les épaulettes, le shako, le bicorne, les
  baudriers blancs, les insignes ou l'armement d'un régiment napoléonien.
- Employer jean, bleu de travail moderne, fermeture éclair ou outil électrique.
- Transformer un T1 en soldat steampunk, armurier, savant fou ou sac à dos
  mécanique géant.
- Copier un costume culturel, un symbole sacré, une inscription ou une machine
  historique identifiable.
- Confondre la classe avec le Mage par des runes flottantes, avec l'Alchimiste
  par une profusion de fioles ou avec le Forgeron par une armure et un marteau.

## Vingt identités proposées

| ID | Base Novice | Fonction | Construction et marqueurs | À éviter |
| --- | --- | --- | --- | --- |
| M01 | `novice-male-01-v1.png` | Réparateur itinérant | Veste courte vert pétrole, rouleau d'outils articulé à la hanche, genou renforcé, petites pinces fermées | Gros marteau, uniforme de mécanicien moderne |
| M02 | `novice-male-02-v1.png` | Mainteneur de pompes et conduites | Surveste cirée bleu sombre, manchettes étanches, raccords et joints rangés dans deux étuis | Tuyaux flottants, scaphandrier |
| M03 | `novice-male-03-v1.png` | Régleur d'instruments de précision de terrain | Habit-veste prune d'inspiration fusilier avec col debout, parements anthracite, double boutonnière et deux basques arrière ; pantalon droit taille haute, guêtres boutonnées et chaussures basses ; une seule mallette de précision fermée portée par une sangle diagonale, instrument pliant fixé dessus | Uniforme napoléonien littéral, fusil, pantalon bouffant, bottes d'aventurier, machine active sur le torse, accumulation d'outils ou d'engrenages |
| M04 | `novice-male-04-v1.png` | Modeleur de fonderie | Habit-veste charbon à parements terre cuite ; demi-tablier thermique asymétrique à trois panneaux ; manchette doublée de céramique et unique étui de modelage dont les outils sont sécurisés ; pantalon droit et guêtres | Forgeron en armure, marteau, enclume, tablier générique, four portatif ou vêtements couverts de suie |
| M05 | `novice-male-05-v1.png` | Fabricant d'instruments de relevé | Mantelet sable, étui plat d'instrument, compas fermé, corde graduée, bottes de terrain | Cartographe moderne, sextant copié |
| M06 | `novice-male-06-v1.png` | Mécanicien de métier textile | Veste indigo, panneaux souples anti-accroc, cartes de motifs vierges et petite navette rangée | Costume folklorique, métier à tisser portable |
| M07 | `novice-male-07-v1.png` | Tailleur et polisseur de lentilles | Tunique gris fumée, tablier clair court, étuis matelassés circulaires, chiffon protégé | Lunettes extravagantes, savant fou |
| M08 | `novice-male-08-v1.png` | Ajusteur d'attelles et de prothèses | Veste ocre structurée, bandes de cuir perforées, gabarits articulés plats, pinces gainées | Automail, médecin religieux |
| M09 | `novice-male-09-v1.png` | Technicien de cornues et creusets | Longue veste aubergine, panneaux céramiques localisés, étui à deux petits récipients opaques | Alchimiste couvert de fioles, masque de peste |
| M10 | `novice-male-10-v1.png` | Calibrateur de noyaux portatifs | Manteau court bleu nuit et cuivre, boîtier fermé à la ceinture, isolants textiles et boucle de décharge | Réacteur géant, cristal Hextech |
| F01 | `novice-female-01-v1.png` | Graveuse d'instruments astronomiques | Robe de travail longue bleu ardoise, surpanneau de cuir souple, étui-disque fermé et burins gainés | Astrolabe patrimonial copié, Mage céleste |
| F02 | `novice-female-02-v1.png` | Inspectrice de vannes et réservoirs | Veste croisée vert profond, jupe-pantalon fendue, joints, jauge repliée et gants courts | Plombière moderne, tuyaux dominants |
| F03 | `novice-female-03-v1.png` | Fondeuse à cire perdue | Robe-tunique rouille et charbon, tablier d'argile segmenté, petites formes de cire protégées | Parure culturelle, forgeronne lourde |
| F04 | `novice-female-04-v1.png` | Conceptrice de séquences textiles | Veste courte structurée indigo à col debout et double boutonnière ; longue robe de travail à quatre grands panneaux crème/indigo et bandes-guide cuivre ; un seul étui rigide avec trois cartes abstraites rangées et une navette fixée | Robe de cour, robe de Mage, copie Jacquard, chaîne de cartes libre ou métier portable |
| F05 | `novice-female-05-v1.png` | Fabricante d'appareillages de campagne | Veste longue sauge, jupe droite fendue, sangles, rivets plats et gabarit d'articulation | Infirmière moderne, prothèse de personnage connu |
| F06 | `novice-female-06-v1.png` | Spécialiste d'arcs électriques | Manteau prune et cuivre, couches isolantes, bobine fermée et points de mise à la terre | Éclairs permanents, câble flottant, Mage de foudre |
| F07 | `novice-female-07-v1.png` | Maîtresse de four et de distillation | Robe de travail brun rouge, surjupe thermique, deux étuis céramiques et pince courte | Laboratoire de fioles, robe sale sans raison fonctionnelle |
| F08 | `novice-female-08-v1.png` | Accordeuse d'automates | Veste bleu gris sur jupe asymétrique, boîtiers de ressorts et tiges repliables | Marionnette portée, horloge géante |
| F09 | `novice-female-09-v1.png` | Arpenteuse et fabricante de niveaux | Mantelet ocre et turquoise sombre, étui d'instrument, fil à plomb fixé, carnet protégé | Exploratrice coloniale, carte lisible |
| F10 | `novice-female-10-v1.png` | Intégratrice de noyaux modulaires | Longue veste ivoire et pétrole, ceinture à logements fermés, plaques d'isolation et pinces fines | Armure futuriste, cristal lumineux dominant |

## Jumelages facultatifs

Ils créent une parenté de métier sans uniformiser les coupes, les palettes ou
les genres. M03/F08 partagent la précision des mécanismes ; M04/F03 la fonderie ;
M02/F02 l'eau ; M05/F09 les instruments de relevé ; M08/F05 l'appareillage ;
M09/F07 la maîtrise thermique ; M10/F10 les noyaux. M01, M06, M07, F01, F04 et
F06 restent autonomes pour préserver des silhouettes franchement contrastées.

## Pilote et rythme de validation

Le pilote couvre quatre fonctions très différentes : M03 (échappements), M04
(fonderie), F04 (séquences textiles) et F06 (arcs électriques). Il est produit
sprite par sprite. Pour chacun : génération, normalisation, contrôle de toutes
les proportions, poids Ko/Mo, présentation utilisateur, puis archivage seulement
après validation. Une planche clair/sombre peut servir au contrôle d'ensemble,
mais elle n'ajoute pas une validation intermédiaire : après F06, la série reprend
directement par M01 puis M02.

Comme pour CDI-143, une validation n'autorise que le passage au sprite suivant.
Elle ne vaut pas validation anticipée de la série, de la planche ou du cinéma.
Une variante rejetée reste hors runtime ; une variante validée est archivée avec
sa version exacte. Les jumelages M/F sont facultatifs et ne justifient jamais un
uniforme ou une répétition de coupe.

Le contrôle visuel du pilote comporte aussi un verdict explicite sur les trois
marqueurs forts. Une proposition techniquement propre mais qui lit comme un
fantassin, un paysan, un mécanicien moderne ou un aventurier générique est
rejetée avant présentation.

### M03 validé — 18 septembre 2026

Après rejet des variantes trop génériques puis trop chargées, l'utilisateur a
validé le nouveau pilote M03 fondé sur une lecture de fusilier-crafteur : habit-
veste structuré, pantalon droit, guêtres et mallette unique dont l'usage reste
plausible. La source est archivée sous
`validated-male-v1/artificer-male-03-v1.png` (`1 159 808 octets`, SHA-256
`B1EF9FED912C5173DF77D6FC168883D99DBB27CCE9AC9D3EBCFB5CE1D913AA27`).

L'export `normalized-alpha-v1/male/artificer-male-03-v1.png` mesure
`341 × 692 px`, avec une zone visible de `260 × 623 px`, un poids de
`251 840 octets` et le SHA-256
`6AAAD88E8BDE6912E4D482D6AF129D2F9C694B092F41C27F96F762BE7D28024C`.
Le contrôle tête/épaules/tronc/bras/hanches/jambes face aux Mages M06/M08 est
conforme ; les seuls écarts de contour proviennent des basques et de la mallette.

### M04 validé — 18 septembre 2026

M04 v1 a été rejeté pour une tête trop petite, des épaules trop larges et des
bras trop longs. M04 v2 a corrigé tête et épaules mais restait trop étroit au
tronc et aux jambes. L'utilisateur a validé M04 v3 après le troisième contrôle :
tête `72 px`, épaules `129 px`, tronc/bras `229 px` et jambes `182 px`, tous dans
l'intervalle M06/M08. La largeur supplémentaire aux hanches provient uniquement
du demi-tablier thermique.

La source est archivée sous `validated-male-v1/artificer-male-04-v1.png`
(`1 350 559 octets`, SHA-256
`ABC325612E25F2FDD49D5294359C6BB6C3EF45397C36F163AA59F1694EC9BB76`).
L'export `normalized-alpha-v1/male/artificer-male-04-v1.png` mesure
`341 × 692 px`, avec une zone visible de `268 × 623 px`, un poids de
`269 693 octets` et le SHA-256
`663E5F557836C082EC6D979408FDC93A96584FC37D4E31D410997214D7173148`.

### F04 validée — 18 septembre 2026

L'utilisateur a validé F04 v1 : la spécialité textile est portée d'abord par
la construction de la veste et des grands panneaux de robe, puis par un unique
kit cohérent de cartes de motifs et de navette. L'encombrement total de
`304 × 596 px` dépasse F06 de `5,6 %` en largeur, mais toutes les coupes
anatomiques restent dans l'intervalle F06/F08 ; l'ourlet seul dépasse de `3,1 %`.

La source est archivée sous `validated-female-v1/artificer-female-04-v1.png`
(`1 589 207 octets`, SHA-256
`55130D5AC28281E49A00254C75AFBBA7BAB391B04A9AC100333029DC984236BC`).
L'export `normalized-alpha-v1/female/artificer-female-04-v1.png` mesure
`341 × 692 px`, pèse `298 186 octets` et porte le SHA-256
`957A9AAD8BC2306360FC401A3DB1D3F21DCE8AA432C1696BC1BCE24C0F4B4203`.

### F06 validée — 18 septembre 2026

L'utilisateur a validé explicitement la variante source
`exec-18430dbc-316c-4fa9-8dc6-680e33c60850.png`, reconnaissable à ses bottes
fines montantes. F06 conserve l'identité rousse et les taches de rousseur de la
Novice, avec un habit-veste prune de fusilière-crafteuse, des isolants en
céramique intégrés et un unique boîtier de bobine fermé.

Après normalisation, la hauteur (`595 px`), le bas des pieds (`y = 673`) et le
pivot (`x = 170,5`) correspondent aux Mages F06/F08. Les coupes mesurées sont :
tête `109 px`, épaules `70 px`, tronc/bras `175 px` et jambes `167 px`, toutes
dans leurs intervalles de référence. La coupe à hauteur des hanches atteint
`221 px` contre `215 px` pour F08 uniquement à cause des mains et du boîtier ;
le corps reste dans le gabarit. L'alpha est propre et ne contient aucun élément
détaché.

La source exacte est archivée sous
`validated-female-v1/artificer-female-06-v1.png` (`1 035 854 octets`, SHA-256
`E9C901C8749A9389F5426B6930FE9921DC19FFC096E04FBD5981A36D8C596735`).
L'export `normalized-alpha-v1/female/artificer-female-06-v1.png` mesure
`341 × 692 px`, avec une zone visible de `241 × 595 px`, pèse `219 365 octets`
et porte le SHA-256
`AECFD2E2F52F36E552776D92D6E0D194A2F46C4A4642038377CD6CC19C2FD789`.

### M01 validé — 18 septembre 2026

M01 v1 a été rejeté au contrôle avant présentation : épaules à `95 px` contre
un intervalle Mage de `99–131 px`, et hanches/haut des jambes à `148 px` contre
`168–183 px`. La correction v2 conserve l'identité, la veste vert pétrole et
l'unique rouleau d'outils, mais rétablit la carrure (`110 px`) et le bassin
(`176 px`). La tête (`74 px`, dont la pointe des cheveux), le tronc/bras
(`236 px`) et les jambes (`181 px`) sont cohérents avec M06/M08 ; hauteur,
pivot et ligne des pieds correspondent exactement aux gabarits.

L'utilisateur a validé la source exacte
`exec-b6521347-c808-498b-92ba-98204bbd0360.png`, archivée sous
`validated-male-v1/artificer-male-01-v1.png` (`1 228 895 octets`, SHA-256
`1767C22D76409F13A394F6C57B1A8FD66F3E91306DDA8915A7F95DA1EE7B97BF`).
L'export `normalized-alpha-v1/male/artificer-male-01-v1.png` mesure
`341 × 692 px`, avec une zone visible de `273 × 623 px`, pèse `257 532 octets`
et porte le SHA-256
`81571DC901516BAF99DE0049991670C14423AA406448F532D6B87987D90DBEBD`.

### M02 validé — 18 septembre 2026

Les variantes dérivées successivement ont été abandonnées parce qu'elles
ajoutaient un voile clair au rendu. La version retenue a donc été régénérée de
zéro, sans aucune ancienne image M02 en référence. Elle conserve les couleurs
profondes du groupe validé : manteau ciré bleu nuit, yoke charbon, fermoirs de
vanne en laiton et unique kit compact de raccords/joints.

Le contrôle final donne un tronc/bras de `233 px`, des hanches à `167 px` et des
jambes à `185 px`. L'écart d'un pixel aux hanches par rapport au minimum Mage
(`168 px`) relève du seuil alpha. La coupe fixe `y = 180` traverse le col, mais
la bande anatomique réelle des épaules à `y = 195–200` mesure `159–166 px`, dans
les valeurs des Mages M06/M08. Hauteur (`623 px`), pivot et ligne des pieds sont
identiques aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-294051f4-4369-4e49-b59f-bc2ef913a134.png`, archivée sous
`validated-male-v1/artificer-male-02-v1.png` (`1 256 834 octets`, SHA-256
`9D3A4D5EECEE58C37125F845A6D5DA1EAFBB2F0AAF24A30F16F3F18AFAA40856`).
L'export `normalized-alpha-v1/male/artificer-male-02-v1.png` mesure
`341 × 692 px`, avec une zone visible de `269 × 623 px`, pèse `252 112 octets`
et porte le SHA-256
`FDF2DFA571FAB56FE5199AA0003EFBDBC0233A19A91029CD18E4939A971CFEA0`.

### M05 validé — 18 septembre 2026

M05 v1 a été validé avec son mantelet asymétrique sable, son habit-veste vert
pétrole et son unique étui plat réunissant instruments fermés et corde graduée
sécurisée. Les marqueurs de relevé reposent aussi sur les graduations abstraites
intégrées aux coutures ; aucun costume d'explorateur ni instrument historique
copié n'est utilisé.

Le contrôle donne une tête de `68 px`, des épaules à `107 px`, un tronc/bras à
`231 px` et des hanches à `177 px`, dans les intervalles M06/M08. La coupe des
jambes atteint `189 px`, soit `5 px` de plus dus au contour des guêtres ; la
longueur anatomique, la hauteur (`623 px`), le pivot et la ligne des pieds sont
alignés sur les gabarits. L'alpha est propre.

La source exacte `exec-25080c40-f7ec-4bcd-aae2-8a532daa7069.png` est archivée
sous `validated-male-v1/artificer-male-05-v1.png` (`1 283 992 octets`, SHA-256
`37A808663274A2F540E560A632930CE8F278AB5ED9EE9C0EF7966F3BFE53F3BB`).
L'export `normalized-alpha-v1/male/artificer-male-05-v1.png` mesure
`341 × 692 px`, avec une zone visible de `269 × 623 px`, pèse `271 254 octets`
et porte le SHA-256
`2D25C9F7D449E2484D8AA7B11D552FFFCA5A6B6720ED8B8BACF04EC3FA652279`.

### M06 validé — 18 septembre 2026

M06 v1 a été validé avec son habit-veste indigo, ses panneaux anti-accroc, ses
cartes de motifs abstraites et son unique étui à cartes portant une navette
sécurisée. La haute queue-de-cheval, le visage et la carnation du Novice sont
conservés ; aucun métier portable, fil pendant ou costume folklorique n'est
introduit.

Le contrôle donne une tête de `69 px`, un tronc/bras à `229 px`, des hanches à
`173 px` et des jambes à `184 px`. La ligne fixe `y = 180` traverse le col ; la
bande anatomique des épaules à `y = 195–205` mesure `153–171 px`, conforme aux
Mages M06/M08. Hauteur (`623 px`), pivot et pieds sont identiques aux gabarits ;
l'alpha est propre.

La source exacte `exec-f20da691-cfd7-4fff-9d00-1074ccdfe18e.png` est archivée
sous `validated-male-v1/artificer-male-06-v1.png` (`1 345 326 octets`, SHA-256
`D646E2413A9CD5F5C224B947DBF95D36CF50E33AC8A6D16AC5788AE0527110C3`).
L'export `normalized-alpha-v1/male/artificer-male-06-v1.png` mesure
`341 × 692 px`, avec une zone visible de `271 × 623 px`, pèse `247 988 octets`
et porte le SHA-256
`4305CD3455AD34F4BFE612BA26FC11513FABD399B8DBD719343C273E7D644C28`.

### M07 validé — 18 septembre 2026

Les premières variantes ont été rejetées pour alternance entre épaules trop
larges et bas du corps trop étroit. M07 v5 a été validé après correction ciblée
du tronc et des bras, sans délavage global : habit-veste charbon et vert sombre,
tablier optique gris pâle localisé, trois fermoirs concentriques et unique étui
rembourré à compartiments fermés.

Le contrôle final donne une tête de `71 px`, des épaules à `131 px`, un
tronc/bras à `229 px`, des hanches à `182 px` et des jambes à `184 px`, tous dans
les intervalles M06/M08. Hauteur (`623 px`), pivot et pieds sont identiques aux
gabarits ; l'alpha est propre sur fonds clair et sombre.

La source exacte `exec-d69b07d6-cefa-4da8-87a4-1b3973683752.png` est archivée
sous `validated-male-v1/artificer-male-07-v1.png` (`1 226 723 octets`, SHA-256
`B3539C048AF7A3A06C15818545E225EA239A8F6D28C7A6EB6E2DA826B37B442C`).
L'export `normalized-alpha-v1/male/artificer-male-07-v1.png` mesure
`341 × 692 px`, avec une zone visible de `263 × 623 px`, pèse `255 291 octets`
et porte le SHA-256
`42515DD2A87DD5A12CE71C69E92756B408711BF42BBBD849C7AD283355EDA8A5`.

### M08 validé — 18 septembre 2026

M08 v1 a été rejeté pour une bande d'épaules `6–10 px` trop large. La v2
validée resserre seulement les panneaux perforés et l'implantation des manches,
en conservant l'identité, le coatee ocre/charbon, les trois articulations
symboliques et l'unique étui de gabarits plats et pinces protégées.

Le contrôle final donne une tête de `71 px`, des épaules à `118 px`, un
tronc/bras à `238 px`, des hanches à `177 px` et des jambes à `183 px`, dans les
intervalles M06/M08. Hauteur (`623 px`), pivot et pieds sont identiques aux
gabarits ; l'alpha et les couleurs sont propres sur fonds clair et sombre.

La source exacte `exec-f33da0f1-ff55-42eb-9172-a374a8d80f4d.png` est archivée
sous `validated-male-v1/artificer-male-08-v1.png` (`1 241 918 octets`, SHA-256
`E45466C6C66BD9B62C7FD8DA39C7B89319BE816099758535A2D912B1C222985E`).
L'export `normalized-alpha-v1/male/artificer-male-08-v1.png` mesure
`341 × 692 px`, avec une zone visible de `265 × 623 px`, pèse `257 217 octets`
et porte le SHA-256
`3DD0FA69B13BC47E69E35D13FE4F2D13EF8E7ED77F96A039F4538F30B9062767`.

### M09 validé — 18 septembre 2026

M09 v1 a été rejeté pour des hanches et jambes légèrement trop étroites. La v2
validée conserve l'identité asymétrique, l'habit aubergine, les inserts
céramiques localisés et l'unique étui de deux récipients opaques et d'une pince
protégée, tout en corrigeant le bassin et les guêtres.

Le contrôle final donne une tête de `73 px` (un pixel de mèche au-dessus de la
plage), des épaules à `121 px`, un tronc/bras à `241 px` (un pixel de seuil
alpha), des hanches à `174 px` et des jambes à `186 px`. Hauteur (`623 px`),
pivot et pieds sont identiques aux gabarits ; l'alpha et les couleurs sont
propres sur fonds clair et sombre.

La source exacte `exec-eb641489-87a4-438c-8ffa-2180672e441e.png` est archivée
sous `validated-male-v1/artificer-male-09-v1.png` (`1 342 055 octets`, SHA-256
`69F0603D6E551906444753424C525292A11065BFE6B744A2A3F7EC7AADB919B9`).
L'export `normalized-alpha-v1/male/artificer-male-09-v1.png` mesure
`341 × 692 px`, avec une zone visible de `271 × 623 px`, pèse `266 719 octets`
et porte le SHA-256
`69585793B100E1299B750060802F139771FB1575ADBA27516EDFD0049D9B08D3`.

### M10 validé — 18 septembre 2026

M10 v1 a été validé avec son habit bleu nuit/charbon, ses isolants localisés,
ses trois verrous de calibration, sa boucle de mise à terre fixée et son unique
boîtier fermé. La longue tresse du Novice est conservée sans être confondue avec
la carrure lors du contrôle.

La tresse traversant les coupes brutes de tête et d'épaules, le contrôle utilise
le demi-contour droit non masqué, reconstruit symétriquement : sur la bande
anatomique `y = 185–220`, l'écart maximal face à Mage M08 est de `4 px`. Le
tronc/bras mesure `233 px`, les hanches `167 px` (un pixel sous le minimum au
seuil alpha) et les jambes `186 px`. Hauteur (`623 px`), pivot et pieds sont
identiques aux gabarits ; l'alpha est propre.

La source exacte `exec-074fa4a6-8567-40fd-9882-1c5ac97ce207.png` est archivée
sous `validated-male-v1/artificer-male-10-v1.png` (`1 295 063 octets`, SHA-256
`6587648E66AF487425CCADF8277AAAA0A2242E2266965966179E098DC6585CC1`).
L'export `normalized-alpha-v1/male/artificer-male-10-v1.png` mesure
`341 × 692 px`, avec une zone visible de `263 × 623 px`, pèse `264 586 octets`
et porte le SHA-256
`6A08B524C4B6464BFB4B0ACF6DB1AC9D945075340C3369A734BB1559F5198676`.

### F01 validée — 18 septembre 2026

Les premières variantes ont permis de préciser la construction attendue pour
la tenue féminine : une robe-manteau structurée portée sur un pantalon, ouverte
à la fois au centre devant et sur les coutures latérales. La v5 validée forme
ainsi deux pans avant et des pans arrière mobiles, sans masquer le pantalon ni
abandonner la silhouette militaire de l'artificière. Le haut bleu nuit et
charbon, les liserés laiton et rose, la ceinture, les outils fermés et l'unique
boîtier circulaire sont conservés.

Le contrôle final donne une tête de `125 px`, des épaules à `109 px`, un
tronc/bras à `187 px`, des hanches à `169 px` et des jambes à `223 px`. Le
tronc dépasse de `3 px` la coupe brute de Mage F06 à cause du contour des
manches ; les autres coupes restent entre F06 et F08. La hauteur (`595 px`), le
pivot (`170 px`) et la ligne des pieds correspondent aux gabarits ; l'alpha est
propre sur fonds clair et sombre.

L'utilisateur a validé la source exacte
`exec-f73d5dbf-d3e8-4970-b53e-31fe77b7f2e5.png`, archivée sous
`validated-female-v1/artificer-female-01-v1.png` (`1 252 845 octets`, SHA-256
`6982528EFC45EA66736D42B559D5700FCBAB93DE8E9DDFE23D38BEFDDD9D6F3E`).
L'export `normalized-alpha-v1/female/artificer-female-01-v1.png` mesure
`341 × 692 px`, avec une zone visible de `268 × 595 px`, pèse `254 890 octets`
et porte le SHA-256
`C41B75C7A5BC41F6C83487165427B1522A580C477725AE6662FB9451CBD4AEE1`.

### F02 validée — 18 septembre 2026

F02 v1 a été rejetée avant validation car sa tête (`77 px`) était plus étroite
que les deux gabarits féminins. La v2 corrige uniquement l'échelle de la tête
et conserve l'identité de la Novice, la veste croisée vert profond, les pans
bleu nuit, le pantalon charbon, le cadran de pression, les trois joints rangés
et les gants courts. Le jumelage avec M02 repose sur l'eau et la pression sans
dupliquer sa tenue ni ajouter de tuyauterie dominante.

Le contrôle final donne une tête de `89 px`, des épaules à `70 px`, un
tronc/bras à `178 px`, des hanches à `207 px` et des jambes à `239 px`, tous
compris entre Mage F06 et Mage F08. La hauteur (`595 px`), le pivot (`170,5 px`)
et la ligne des pieds correspondent aux gabarits ; l'alpha est propre sur fonds
clair et sombre.

L'utilisateur a validé la source exacte
`exec-384e3c04-c4a2-4939-8cc2-eb90861bcc5c.png`, archivée sous
`validated-female-v1/artificer-female-02-v1.png` (`1 247 445 octets`, SHA-256
`5BAA5FF048432158D9D387B92A8C7B3E2230FCB688D059C493E24354894C41A9`).
L'export `normalized-alpha-v1/female/artificer-female-02-v1.png` mesure
`341 × 692 px`, avec une zone visible de `261 × 595 px`, pèse `235 989 octets`
et porte le SHA-256
`B7272EA829BA10E5DCB0CE7521C2DB88502419CC16046974C79C76FEB76E0504`.

### F03 validée — 18 septembre 2026

F03 v1 a été rejetée avant présentation car le tronc/bras (`162 px`) était plus
étroit que les gabarits. La v2 corrige seulement cette carrure et conserve la
silhouette courte choisie pour varier les tenues féminines : tunique croisée
rouille et charbon, pantalon complet, tablier de protection en trois panneaux,
deux formes de cire protégées, trois outils fins rangés et une seule protection
d'avant-bras. Le jumelage avec M04 reste limité au métier de fonderie.

Le contrôle final donne une tête de `91 px`, des épaules à `100 px`, un
tronc/bras à `170 px`, des hanches à `194 px` et des jambes à `180 px`. Le
tronc est à `1 px` de Mage F08 au seuil alpha ; les autres coupes sont comprises
entre F06 et F08. La hauteur (`595 px`), le pivot (`170,5 px`) et la ligne des
pieds correspondent aux gabarits ; l'alpha est propre sur fonds clair et sombre.

L'utilisateur a validé la source exacte
`exec-17b2cb59-c29b-4d70-84d1-c81f6f7954ba.png`, archivée sous
`validated-female-v1/artificer-female-03-v1.png` (`1 223 004 octets`, SHA-256
`AB4594D5E2F965DB45E8500D1A4B00300D7070778A2044021D79D71DB1A039ED`).
L'export `normalized-alpha-v1/female/artificer-female-03-v1.png` mesure
`341 × 692 px`, avec une zone visible de `253 × 595 px`, pèse `247 105 octets`
et porte le SHA-256
`025BD766C289DB3A5DE252ADB114C86172246AFC64FE4FCCCEAC265B813EFD3A`.

### F05 validée — 18 septembre 2026

F05 v1 a été validée avec une veste sauge mi-longue, une jupe droite séparée et
fendue sur le côté, un pantalon charbon et des bottes plus courtes que celles
des précédentes artificières. Les marqueurs d'appareillage reposent sur deux
gabarits articulés plats, une sangle perforée et un outil gainé ; aucun symbole
médical moderne ni membre mécanique n'est présent. Le jumelage avec M08 reste
limité au langage des gabarits et renforts perforés.

Le contrôle donne des épaules à `119 px`, un tronc/bras à `175 px`, des hanches
à `212 px` et des jambes à `159 px`, dans les intervalles F06/F08. La coupe
brute de tête atteint `137 px` à cause des boucles latérales ; le Novice F05
d'origine mesure `146 px` sur la même ligne, ce qui confirme que la génération
n'a pas agrandi la tête anatomique. La hauteur (`595 px`), le pivot (`170 px`)
et les pieds correspondent aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-2601ab2a-89fe-48bb-9f34-ed621fb595ed.png`, archivée sous
`validated-female-v1/artificer-female-05-v1.png` (`1 247 859 octets`, SHA-256
`B2352AAEB62C31246A23B402519CD400605C35AC29A3C000953054E6600DAC67`).
L'export `normalized-alpha-v1/female/artificer-female-05-v1.png` mesure
`341 × 692 px`, avec une zone visible de `238 × 595 px`, pèse `248 712 octets`
et porte le SHA-256
`345070909EFF4F7172E9357A9E373AF04D6D6EA99D41D64879C590A212B93CF8`.

### F07 validée — 18 septembre 2026

F07 v1 a été rejetée avant présentation car son tronc/bras (`162 px`) était
trop étroit. La v2 corrige seulement cette carrure et conserve la robe-tunique
brun rouge, la demi-surjupe thermique arrière et latérale, les protections
céramiques propres, les deux canisters fermés et la pince courte rangée. Aucun
effet de saleté, flamme ou laboratoire de fioles n'est ajouté ; le jumelage avec
M09 reste limité à la maîtrise thermique.

Le contrôle final donne une tête brute de `129 px` et des épaules à `149 px`,
contre respectivement `138 px` et `158 px` sur le Novice F07 d'origine : les
cheveux longs expliquent ces largeurs sans agrandir l'anatomie. Le tronc/bras
mesure `170 px`, à `1 px` de Mage F08 au seuil alpha ; les hanches mesurent
`172 px` et les jambes `180 px`. La hauteur (`595 px`), le pivot (`170,5 px`)
et les pieds correspondent aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-8c4391fb-ad90-4030-aba2-1717b4becfd5.png`, archivée sous
`validated-female-v1/artificer-female-07-v1.png` (`1 322 548 octets`, SHA-256
`B57ABF4D04B5A56991EC03F7CA77179219B6D0D961859FE70200DFF63BA70AD4`).
L'export `normalized-alpha-v1/female/artificer-female-07-v1.png` mesure
`341 × 692 px`, avec une zone visible de `249 × 595 px`, pèse `261 369 octets`
et porte le SHA-256
`F51F0E19CE14743B18206FB3000A17CB2DD989566625166506545540B37F809D`.

### F08 validée — 18 septembre 2026

F08 v1 a été validée avec une veste courte bleu-gris, une jupe indigo
asymétrique au-dessus d'un pantalon et des bottes mi-mollet. Le métier
d'accordeuse d'automates est porté par une cassette compacte de trois tambours
fermés, deux tiges repliées et une clé de tension discrète ; aucune marionnette,
horloge géante ou pièce flottante n'est utilisée. Le jumelage avec M03 repose
uniquement sur la précision des mécanismes.

Le contrôle donne une tête de `123 px`, des épaules à `125 px` et un
tronc/bras à `174 px`, presque identiques à Mage F08 (`125`, `127` et `171 px`).
La coupe des hanches atteint `223 px`, soit `8 px` de plus dus au pan
asymétrique de la jupe ; les jambes mesurent `165 px` et l'anatomie visible
reste alignée. La hauteur (`595 px`), le pivot (`170 px`) et les pieds
correspondent aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-67b404e2-8019-402b-9fd5-7c030dc81ce8.png`, archivée sous
`validated-female-v1/artificer-female-08-v1.png` (`1 291 382 octets`, SHA-256
`1F112065DB6A84901BB00097D76A46C96063F8E310716A1E6F0ECBD1744C0808`).
L'export `normalized-alpha-v1/female/artificer-female-08-v1.png` mesure
`341 × 692 px`, avec une zone visible de `244 × 595 px`, pèse `232 558 octets`
et porte le SHA-256
`6C2F1C47A91E05DCA5367660B28157710B9FFAD936C41B52D898F770544EA910`.

### F09 validée — 18 septembre 2026

F09 v1 a été rejetée avant contrôle car le fil à plomb restait libre. La v2
conserve la silhouette sans jupe — mantelet ocre asymétrique, veste turquoise
sombre et pantalon ample resserré — mais range le plomb et son fil bobiné dans
un fourreau rigide. L'étui de niveau et le carnet protégé restent fermés ; aucun
code d'exploratrice coloniale ni carte lisible n'est introduit. Le jumelage avec
M05 repose sur les instruments de relevé.

Le contrôle final donne une tête de `107 px`, des épaules à `112 px`, un
tronc/bras à `179 px`, des hanches à `217 px` et des jambes à `176 px`. Les
hanches dépassent de `2 px` Mage F08 à cause des étuis de ceinture ; les autres
coupes sont dans l'intervalle F06/F08. La hauteur (`595 px`), le pivot
(`170,5 px`) et les pieds correspondent aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-d7a31bca-e33d-4cf6-ac1a-e7921dc51ef4.png`, archivée sous
`validated-female-v1/artificer-female-09-v1.png` (`1 136 064 octets`, SHA-256
`0A25A3AAAFDA41E6F255419AF2E428A6D75E6BD5D868E67F19C6A9CAE9C3BC7E`).
L'export `normalized-alpha-v1/female/artificer-female-09-v1.png` mesure
`341 × 692 px`, avec une zone visible de `243 × 595 px`, pèse `235 544 octets`
et porte le SHA-256
`7FE9BA3C9BE218A2E1BC542DD246713F65F69CE0F0BA0887C03C0CE62A69F8E6`.

### F10 validée — 18 septembre 2026

F10 v1 a été validée avec un long gilet technique ivoire porté sur une blouse
pétrole et un pantalon charbon. Les pans avant étroits et le large pan arrière
gardent le vêtement distinct d'une robe. Trois cellules modulaires fermées, des
plaques isolantes intégrées, une pince gainée et une boucle de mise à la terre
fixée assurent les marqueurs d'intégration sans cristal lumineux, armure
futuriste ni câble libre. Le jumelage avec M10 reste limité aux noyaux modulaires.

Le contrôle donne une tête de `96 px`, des épaules à `71 px`, un tronc/bras à
`176 px` et des jambes à `193 px`, dans les intervalles F06/F08. La coupe des
hanches atteint `230 px`, soit `15 px` de plus dus aux pans arrière du gilet ;
l'anatomie visible reste alignée. La hauteur (`595 px`), le pivot (`170,5 px`)
et les pieds correspondent aux gabarits ; l'alpha est propre.

L'utilisateur a validé la source exacte
`exec-5d91c380-75e0-4460-800a-c094d324989b.png`, archivée sous
`validated-female-v1/artificer-female-10-v1.png` (`1 267 397 octets`, SHA-256
`4C7449B5A7E75B5CC51D1F1316B30ED860487B234D08858EB12306F1DBC0C54B`).
L'export `normalized-alpha-v1/female/artificer-female-10-v1.png` mesure
`341 × 692 px`, avec une zone visible de `245 × 595 px`, pèse `258 085 octets`
et porte le SHA-256
`9B2686739F2943E3108344A017FEBBF7CD5C6CCB84417D40000FE645C57930EB`.
