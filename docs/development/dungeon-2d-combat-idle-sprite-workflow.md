# Workflow commun — sprites de garde `combat_idle`

Date de formalisation : 20 septembre 2026.

## Ordre prioritaire pour les générations — décision utilisateur du 24 septembre 2026

1. Rechercher une pose de **combat stylisée** (fantasy, jeu vidéo, manga ou fan
   art), une référence de l'arme ou de l'accessoire, et charger la pose neutre
   exacte. Ces trois images sont les références transmises à ImageGen.
2. Rédiger un prompt **simple et clair** : identité et tenue du neutre intactes,
   garde prête mais au repos, arme lisible, aucun effet ou attaque déjà lancé.
   Le relire au moins une fois, corriger ambiguïtés et contradictions, puis
   seulement lancer ImageGen.
3. Générer **un seul candidat** et le montrer immédiatement à l'utilisateur
   pour verdict visuel. Si rejeté, ajuster références et prompt puis présenter
   un seul nouveau candidat.
4. **Après validation visuelle seulement**, documenter les références et le
   prompt dans le ticket, contrôler proportions et alpha, normaliser, intégrer
   et tester. Les obligations de documentation et de contrôle ci-dessous
   s'appliquent à cette étape. Aucun autre sprite n'est généré avant le verdict.

Cet ordre prime sur les passages plus bas qui placent des mesures, un registre
détaillé ou un rapport technique avant la validation visuelle.

## Objet et périmètre

Ce document définit la méthode commune des tickets CDI-148 à CDI-157 pour
produire et intégrer les gardes de combat des dix classes de héros. Il complète
les règles propres à chaque classe, sans les remplacer.

Chaque ticket produit vingt correspondances strictes avec les bases neutres de
sa classe : dix hommes et dix femmes, index 0–9. Une garde `combat_idle` est une
attente persistante pendant l'affrontement. Ce n'est ni une attaque déjà
engagée, ni la compétence `guard_stance`, ni une pose de réaction ou de KO.

La base neutre de l'identité concernée reste l'autorité pour le visage, la
carnation, les cheveux, la morphologie, les proportions, la tenue, les
couleurs, les accessoires, la lumière et le style graphique.

## Responsabilités et rythme de validation

- Codex prépare les références, génère un seul sprite à la fois, inspecte
  réellement le résultat et réalise les contrôles techniques et de proportions.
- L'utilisateur réalise la validation visuelle de chaque sprite et du rendu
  final dans le cinéma.
- Une validation concerne exclusivement le fichier précisément désigné. Elle
  n'autorise ni une autre variante ni une modification artistique silencieuse.
- Après validation, Codex archive et normalise ce fichier, met le suivi à jour,
  puis passe automatiquement au sprite suivant, sauf ordre d'arrêt.
- Codex ne génère pas plusieurs sprites non validés d'avance ; après chaque
  verdict positif, il contrôle les proportions avant l'intégration.
- Chaque sortie ImageGen est inspectée, contrôlée et rapportée avant tout nouvel
  appel de génération. Une variante techniquement rejetée ne déclenche donc pas
  une chaîne silencieuse de nouvelles tentatives.
- Un défaut objectif peut être rejeté par Codex après inspection, avec son motif
  explicite. Une incertitude esthétique ou géométrique est soumise à
  l'utilisateur ; elle n'est jamais présentée comme un fait vérifié.
- Une conformité technique ne vaut jamais validation visuelle utilisateur.

## 1. Préparer la classe et le pilote

Avant la première génération d'une classe :

1. charger le ticket de garde, le ticket et le handoff de la base neutre, ainsi
   que le présent document ;
2. confirmer les vingt sources neutres autoritaires et leur ordre M01–M10 puis
   F01–F10 ;
3. vérifier dans le domaine partagé les armes, mains libres, boucliers, focus,
   instruments ou accessoires réellement disponibles, ainsi que leur famille
   et leur caractéristique ; exclure tout élément absent du jeu ;
4. définir avec l'utilisateur les familles d'armes ou d'accessoires, les styles
   de garde et les restrictions cohérentes avec la classe et le jeu ;
5. choisir un pilote suffisamment représentatif ou contraignant ;
6. établir la direction artistique propre à la classe sans modifier les
   identités déjà validées ;
7. présenter la matrice classe/armes/gardes et obtenir l'accord utilisateur
   avant de lancer le pilote.

La tenue n'est jamais jumelée ni redessinée à ce stade : elle est déjà figée par
chaque base neutre. Seuls une pose, une arme, un accessoire de combat ou une
configuration de mains peuvent être jumelés entre un homme et une femme. Ce
jumelage reste facultatif, ne doit pas forcer deux identités à adopter la même
silhouette et n'interdit pas la variété compatible avec le rôle de la classe.

Le pilote est validé avant la production courante de la série. Une adaptation
sur l'autre genre peut être utilisée lorsque cela apporte une preuve utile,
mais elle ne dispense jamais des vingt validations individuelles.

### Registre de production obligatoire

Avant la première génération, créer dans le handoff ou le suivi du ticket une
ligne pour chacune des vingt identités. Ce registre reste l'autorité pour
déterminer le prochain sprite ; l'ordre n'est jamais déduit de mémoire ou de la
seule conversation.

Chaque ligne conserve au minimum :

| Champ | Contenu attendu |
| --- | --- |
| Identité | Classe, genre et index exacts, par exemple `M09` |
| Source neutre | Chemin du fichier autoritaire |
| Arme et garde | Choix convenu et contraintes propres à la pose |
| Références | Chemins ou provenance de la pose et de l'arme retenues |
| Prompt | Texte exact ou identifiant de sa version |
| Candidat | Identifiant exact `exec-…png` |
| Contrôle | Inspection et verdict détaillé des proportions |
| Verdict utilisateur | En attente, rejeté ou validé |
| Livraison | État, chemin d'archive et SHA-256 du fichier exact |

Avant chaque génération, relire ce registre et vérifier les fichiers présents.
Ne jamais régénérer une identité validée ni sauter vers une autre identité sur
la base d'un ordre supposé.

## 2. Rechercher avant de générer

Pour chaque nouvelle famille d'arme ou garde, examiner plusieurs références
avant la génération ; les deux premiers résultats d'une recherche ne suffisent
pas à établir la pose. Croiser selon le besoin :

- sources historiques et arts martiaux ;
- iconographie fantasy ;
- manga, manhwa et manhua ;
- jeux vidéo et animation ;
- objets réels ou collections de musée pour la géométrie des armes.

Pour une classe sans arme, remplacer la recherche de géométrie d'arme par une
recherche sur les mains, le geste, le focus, l'instrument, l'accessoire ou la
silhouette fonctionnelle propre à cette classe. Le niveau d'exigence reste le
même.

### Seuil minimal vérifiable

Pour une pose ou une arme sans référence déjà validée dans le ticket, la
recherche réunit au moins six références candidates provenant d'au moins trois
familles de sources différentes :

1. au moins une source réelle, historique, martiale, muséale ou technique pour
   l'anatomie, la prise ou la géométrie de l'objet ;
2. au moins une œuvre culturelle fantasy, manga, manhwa, manhua ou animation
   pour la force de la silhouette et la lisibilité de la garde ;
3. au moins une référence de jeu vidéo pour la lecture en situation de combat.

Lorsque l'arme ou la posture possède plusieurs traditions identifiables, la
recherche compare au moins deux cultures, écoles ou périodes au lieu de réduire
la garde à une seule interprétation. Les références doivent montrer des angles
utiles ; six images presque identiques ne satisfont pas ce seuil.

Pour chaque référence candidate retenue ou rejetée, noter brièvement :

- sa source ou son URL ;
- ce qu'elle permet de vérifier ;
- sa limite éventuelle ;
- la décision : retenue pour la pose, retenue pour l'arme ou écartée.

Une pose déjà validée peut réutiliser son corpus de références si l'arme, la
prise et la morphologie restent réellement compatibles. Cette réutilisation est
notée dans le registre ; elle ne permet pas de forcer une référence inadaptée.

La recherche doit permettre de vérifier :

- les appuis, le centre de gravité et la préparation au combat ;
- l'orientation des épaules, du bassin, des coudes et des poignets ;
- la ligne des mains sur une poignée ou une hampe ;
- l'axe, la perspective et le raccourcissement de l'arme ;
- l'orientation du tranchant, de la pointe ou de la tête de frappe ;
- pour une garde sans arme, la lisibilité des mains, du geste, du focus ou de
  l'accessoire ;
- la cohérence entre la garde et une future action plausible pour la classe,
  qu'elle soit martiale, magique, spirituelle, musicale ou technique.

Une recherche n'est pas une preuve si les références retenues ne sont ni
examinées ni utilisées. Les références utiles sont conservées sous le dossier
du ticket avec leur provenance ou une note permettant de les retrouver.
Après cette recherche élargie, retenir au minimum deux références externes
complémentaires : une pour la pose et une pour la géométrie de l'arme. Elles
sont effectivement transmises à ImageGen avec la base neutre.

Les images externes servent uniquement à la recherche et à la génération. Pour
chacune, conserver l'URL, l'auteur ou l'institution lorsque disponible, ainsi
que la licence ou son état inconnu. Elles ne sont jamais importées dans le
runtime ni distribuées avec le jeu. Si leur licence n'autorise pas la
redistribution, conserver seulement le lien et les métadonnées dans Git ; le
fichier local de travail reste hors livraison.

## 3. Références transmises à la génération

Utiliser par défaut trois références propres et complémentaires :

1. la base neutre exacte, autorité exclusive pour l'identité et la tenue ;
2. une référence de pose, autorité pour les appuis, l'anatomie et la garde ;
3. une référence de détail fonctionnel : arme, mains, geste, focus, instrument
   ou accessoire, selon la classe.

ImageGen reçoit donc normalement trois images. Il ne reçoit jamais plus de cinq
références. Une quatrième ou une cinquième n'est ajoutée que si elle couvre un
besoin distinct et ne crée pas de contamination. Ne pas multiplier des images
redondantes.

Une génération rejetée n'est pas réutilisée comme référence de géométrie ou de
style. Une pose validée d'une autre identité peut uniquement servir de référence
de posture et de cadrage ; elle ne devient jamais une référence de visage, de
morphologie, de tenue ou de couleurs.

## 4. Contrat de génération

Le prompt doit demander une nouvelle image complète en conservant strictement
l'identité neutre. Seules la pose et, lorsqu'ils ont été convenus, l'arme, le
bouclier, le focus, l'instrument, l'accessoire de combat ou la configuration des
mains peuvent changer. La tenue, l'armure, les couleurs et les accessoires
identitaires ne sont jamais redessinés sous couvert de changer « l'équipement
visuel ». Le candidat attendu respecte les invariants suivants :

- personnage complet, pieds visibles et aucun membre coupé ;
- garde prête au combat, stable et lisible, sans impact ni attaque déjà partie ;
- expression concentrée ou sérieuse adaptée au combat ;
- tenue, palette et accessoires conformes à la base neutre ;
- arme, focus, instrument ou accessoire entier, lisible et dimensionné pour la
  garde lorsqu'il existe ;
- cadre assez large pour la pose : ne jamais courber, raccourcir ou replier une
  arme ou un accessoire uniquement pour le faire entrer dans l'image ;
- même style, même densité de pixels, mêmes contours et même lumière que la
  source ;
- aucun texte, décor, cercle au sol, aura ou effet étranger à la demande.

Un fond chroma ou une transparence imparfaite ne constitue pas à lui seul un
motif de rejet artistique. Le nettoyage technique intervient après validation.

## 5. Inspection réelle du candidat

Après chaque sortie ImageGen et avant toute nouvelle génération, ouvrir le
fichier et l'examiner à une échelle permettant de voir le personnage et les
détails de l'arme. Cette obligation s'applique aussi aux résultats qui semblent
manifestement ratés dans l'aperçu.

Contrôler au minimum :

- identité, visage, carnation, coiffure et expression ;
- tenue, couleurs, couches textiles, armure et accessoires ;
- anatomie, mains, doigts, poignets, coudes et épaules ;
- appuis, équilibre et lisibilité de la garde ;
- continuité main–poignée–garde–lame, alignement des mains et de la hampe ou
  articulation crédible des mains et du geste sans arme ;
- axe de l'arme ou de l'accessoire, orientation du tranchant, perspective, tête
  et pointe lorsque ces éléments existent ;
- absence de lame tordue, de manche cassé, de tête désaxée, de fusion ou de
  déformation destinée à tenir dans le cadre ;
- absence d'ajout ou de disparition d'un élément identitaire.

Pour une arme assemblée — notamment hache, marteau, masse ou arme d'hast — le
contrôle en gros plan doit décomposer la géométrie au lieu de conclure à partir
de la silhouette globale :

1. afficher côte à côte le gros plan de l'arme candidate et la référence
   visuelle d'arme réellement transmise à ImageGen, à la même hauteur et sans
   déformer le ratio propre de chaque image ;
2. identifier explicitement les éléments que la référence rend autoritaires :
   construction, jonction, tête, tranchant, pointe, face de frappe ou prise ;
3. tracer visuellement l'axe longitudinal du manche ou de la hampe ;
4. vérifier que cet axe traverse naturellement la prise et reste cohérent avec
   le poignet ;
5. tracer séparément l'axe de l'œil, de la douille ou du col métallique ;
6. vérifier la continuité mécanique entre manche et œil/douille : aucune
   cassure d'angle n'est admise à la jonction, même si chaque segment paraît
   droit lorsqu'il est regardé isolément ;
7. suivre visuellement le bois jusqu'à l'intérieur réel de l'œil ou de la
   douille : le manche doit entrer au centre de cette ouverture et non se
   terminer sous la lame, contre le flanc de la tête ou à côté d'un cylindre
   métallique vide ; ne jamais confondre le contour extérieur du col, un poll
   ou une excroissance avec l'œil traversé par le manche ;
8. vérifier le plan de la tête, de la lame ou de la face de frappe par rapport
   à cette jonction et à la perspective ;
9. comparer les proportions relatives tête/manche et la façon dont les pièces
   sont emmanchées ou assemblées avec la référence autoritaire ;
10. simuler le premier mouvement de frappe suggéré par la garde pour confirmer
   que le tranchant, la pointe ou la face de frappe — et non le plat, le talon
   ou le manche — mène réellement vers l'adversaire.

Dire seulement « hampe droite » ou « tranchant bien orienté » ne suffit donc
pas. Si un de ces axes ne peut pas être lu avec certitude à l'échelle originale,
le verdict reste `incertain` ou `rejeté`, jamais `conforme`.

Le montage reproductible peut être produit avec
`scripts/new-combat-idle-weapon-reference-check.ps1`. Le rapport doit conserver
le chemin de la référence comparée et celui du montage. Une recherche de
référence qui n'est ni transmise à la génération ni réutilisée pendant le
contrôle ne constitue pas une preuve de conformité de l'arme.

Ne jamais affirmer qu'un défaut est absent sans cette inspection. Toute limite
de lecture ou tout doute doit être indiqué.

## 6. Contrôle des proportions après validation visuelle

Après le verdict visuel sur le candidat exact, comparer sa garde à la base
neutre de la même identité et aux deux gabarits Mage du même genre (M06/M08 ou
F06/F08). Examiner côte à côte le visage, la tête, les épaules, le tronc, les
bras, les hanches et les jambes, en tenant compte de la perspective et de la
flexion de la pose. L'arme et la largeur du canevas ne mesurent pas le corps.

Vérifier aussi les pieds, le pivot et l'échelle dans le cinéma. Signaler tout
écart visible ou toute incertitude avant intégration ; ne pas présenter une
comparaison approximative ou une détection automatique non vérifiée comme une
mesure fiable. Un écart artistique appelle un nouveau verdict utilisateur.

Le catalogue historique à quatorze repères et ses scripts restent disponibles
pour une analyse ciblée, sans être requis pour chaque sprite ni pour la clôture
des tickets CDI-148–157.
## 7. Présentation et verdict utilisateur

Présenter aussitôt un seul candidat à la fois, avec son nom de fichier exact,
notamment l'identifiant `exec-…png`. Réserver les mesures et le suivi détaillé
à l'étape après verdict.

Attendre ensuite un verdict explicite. Les formulations ambiguës ne sont pas
transformées en validation. Après `stop`, aucune normalisation, nouvelle
génération ni transition vers l'identité suivante n'est lancée.

## 8. Stratégie de correction et reprise de zéro

Une correction locale est réservée à une propriété isolée lorsque l'identité,
les proportions et la géométrie générale restent saines.

Repartir de zéro depuis la base neutre et les références propres lorsque :

- l'anatomie ou la géométrie de l'arme est structurellement fausse ;
- plusieurs corrections commencent à introduire des dérives ;
- un filtre clair, une perte de contraste ou une altération de style apparaît ;
- l'identité, la silhouette ou la tenue a dérivé ;
- la même erreur persiste après une correction ciblée.

Avant de répéter une génération, réévaluer les références, la pose, le cadrage
et la formulation. Ne pas boucler sur une stratégie qui échoue.

## 9. Archivage après validation

Après validation explicite :

1. copier exactement le fichier désigné dans le dossier `validated-*` avec le
   nom stable de la classe, du genre et de l'index ;
2. conserver les variantes rejetées hors du chemin runtime lorsqu'elles sont
   utiles à la traçabilité ;
3. nettoyer le fond et l'alpha avec un traitement déterministe sans retouche
   artistique ;
4. produire l'export runtime sans écraser la source validée ;
5. vérifier dimensions, alpha, franges, boîte visible, composants isolés,
   ligne des pieds et pivot ;
6. mesurer le poids en octets, Ko et Mo, avec Kio/Mio facultatifs et étiquetés ;
7. calculer le SHA-256 du fichier archivé ;
8. enregistrer la correspondance neutre/garde, le prompt exact, le fichier
   validé, son chemin d'archive, son SHA-256 et le verdict utilisateur dans le
   suivi du ticket.

## 10. Série, planches et cinéma

Après les vingt validations individuelles :

1. produire les vingt exports runtime alpha ;
2. produire les planches de contrôle sur fonds clair et sombre ;
3. vérifier les vingt correspondances `neutral`/`combat_idle` par classe,
   genre et index ;
4. intégrer les assets au catalogue de présentation et au lecteur réel ;
5. conserver `neutral` dans le recrutement, le stockage, le catalogue et les
   scènes hors combat ;
6. utiliser `combat_idle` pendant l'affrontement et comme repli après chaque
   action ;
7. vérifier la séquence
   `neutral → combat_idle → action → combat_idle → neutral` ;
8. charger uniquement les identités présentes dans la scène.

Une planche de sprites n'est pas une validation du cinéma. Le verdict cinéma se
fait dans le véritable lecteur de combat, sur des compositions représentatives,
avec les échelles, placements, pivots et transitions réels. L'utilisateur
valide ce rendu visuel final.

## 11. Validation technique et clôture

Après le verdict cinéma, exécuter les validations proportionnées au ticket :

- contrôle déterministe des assets et `npm.cmd run check:dungeon-visuals` ;
- tests ciblés de correspondance d'identité et de sélection de pose ;
- tests du lecteur aux transitions entrée, attente, action, retour et sortie ;
- `npm.cmd run typecheck` ;
- `npm.cmd run lint -- --quiet` ;
- `npm.cmd run build` ;
- `npm.cmd run check:bundle` ;
- `npm.cmd run board:validate`.

Mesurer le poids froid, le cache chaud, la mémoire RGBA décodée et le pire
groupe de héros représentatif. Documenter les références, prompts, sources,
exports, mesures, tests, reprises et verdicts utilisateur dans le handoff du
ticket.

Avant publication, auditer les critères fonctionnels, oublis, régressions,
compatibilité, code mort et refactors injustifiés. Aucun déploiement frontend,
backend, Cloudflare ou Supabase n'est inclus dans ces tickets.

## Critères d'arrêt

Arrêter la progression et corriger ou demander une décision si :

- l'identité, la tenue ou les proportions ne correspondent plus à la base ;
- la garde ressemble à une attaque engagée ou n'est pas prête au combat ;
- l'anatomie, la prise ou la géométrie de l'arme reste incertaine ;
- la série avance sans validation individuelle ;
- le contrôle de proportions n'a pas été effectué ;
- le fichier exact validé n'est plus identifiable ;
- le cinéma réel n'a pas encore reçu son verdict utilisateur final.
