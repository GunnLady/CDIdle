# Design system interne CDIdle v0.1

## Intention

Le design system est une couche interne, code-first et propre a CDIdle. Il
stabilise le vocabulaire visuel issu de CDI-069 sans devenir une bibliotheque
generique ni imposer une migration massive des ecrans.

Principes : hierarchie medievale lisible, surfaces sombres et accents dores,
densite maitrisee, cible interactive minimale de 44 px, focus toujours visible,
et mouvement non indispensable a la comprehension.

## Architecture et source de verite

- `src/ui/foundations/tokens.css` : source unique des tokens semantiques.
- `src/ui/primitives` : controles HTML sans connaissance metier.
- `src/ui/components` : surfaces et retours d'etat composables.
- `src/ui/patterns` : compositions produit, ajoutees seulement avec un usage reel.
- `src/ui/catalog` : catalogue prive reutilisant les composants de production.

Les tokens `ui-canvas`, `ui-surface`, `ui-panel`, `ui-border`, `ui-accent`,
`ui-text`, `ui-danger`, `ui-success`, `ui-warning`, `ui-info` et `ui-focus`
expriment une intention. Un composant ne doit pas creer un nouveau token nomme
d'apres un ecran. Les polices, couleurs, rayons, ombres et dimensions de
controle sont centralises dans le meme fichier. Les espacements utilisent la
grille Tailwind de 4 px; les couches utilisent `--ui-layer-status` et
`--ui-layer-dialog`. Les durees utilisent `--ui-motion-fast` et
`--ui-motion-normal`; elles deviennent quasi instantanees avec
`prefers-reduced-motion: reduce`.

## Composants v0.1

| Composant | Intention et usages | Etats | Anti-usages et remplacement |
| --- | --- | --- | --- |
| `Button` | Declencher une action locale ou serveur. Employer `primary` une fois par zone, `secondary` par defaut, `danger` pour une action risquee et `ghost` pour une action discrete. | normal, survol, actif, focus, desactive, chargement | Ne pas l'utiliser comme lien ni y coder une autorisation metier. Remplace progressivement les boutons stylises repetes. |
| `IconButton` | Porter une action uniquement iconique avec un libelle accessible obligatoire. | variantes et indisponibilite de `Button` | Ne pas l'utiliser si un libelle visible est rentable. Remplace les boutons icone ponctuels. |
| `TextField` | Saisir une valeur avec libelle, aide, erreur et contenu initial optionnel. | normal, focus, desactive, erreur | Ne pas omettre le nom accessible ni valider une regle autoritaire ici. Remplace les champs stylises locaux. |
| `Panel` | Regrouper une zone titree; `strong` renforce la priorite visuelle et `titleAs` preserve la hierarchie. | default, strong | Ne pas en faire une boite modale. Les anciennes frames restent les adaptateurs de depreciation. |
| `Card` | Regrouper un element repetable et exposer sa selection. | default, selected | Ne pas remplacer un panneau de page. Remplace les cartes locales quand leur migration est prouvee. |
| `Alert` | Afficher information, succes, avertissement, erreur, observateur ou verrouillage. `live` ou `role` est toujours explicite pour une annonce dynamique. | six variantes semantiques | Ne pas creer plusieurs regions live simultanees. Remplace les alertes locales et leurs couleurs ponctuelles. |
| `Progress` | Exposer une progression bornee avec un nom accessible. | vide, partiel, complet | Ne pas representer une duree inconnue ni recalculer une regle de jeu. Remplace les progressions locales determinees. |
| `Dialog` | Fournir role modal, piege a focus, Escape et restauration du focus pour les confirmations transversales. | ouvert, fermeture permise ou bloquee | Ne pas y copier une regle metier. Les dialogues historiques migreront consommateur par consommateur. |
| `Tooltip` | Rendre une aide courte disponible au survol et au focus avec un nom de declencheur distinct de la description. | masque, survol, focus | Ne pas y placer une information indispensable. Remplace les attributs `title` informatifs prouves. |
| `Select` | Choisir une valeur dans une liste native avec libelle, aide et erreur. | normal, focus, desactive, erreur | Ne pas l'utiliser pour une recherche libre ou un choix multiple complexe. |
| `Checkbox` | Activer une option booleenne explicite avec aide associee. | coche, decoche, focus, desactive | Ne pas l'utiliser comme action immediate ni comme selection exclusive. |
| `Badge` | Identifier un trait court, une rarete ou un etat non interactif. | sept tons semantiques | Ne pas y placer une action ni une information longue. |
| `Disclosure` | Replier une zone secondaire en conservant un declencheur clavier natif. | ouvert, ferme, focus | Ne pas masquer une action obligatoire ou un message critique. |
| `SelectableCard` | Selectionner un element riche avec `aria-pressed`. | normal, selectionne, desactive | Ne pas imbriquer de champ ou de bouton interactif dans la carte. |
| `Metric` | Afficher une valeur courte, son libelle et un detail optionnel. | avec ou sans icone/detail | Ne pas recalculer de statistique metier dans le composant. |
| `EmptySlot` | Representer un emplacement ou une collection vide. | vide | Ne pas remplacer une alerte ni une erreur. |
| `StatusBanner` | Afficher un etat persistant info, hors-ligne ou observateur. | statique, live, sticky, avec action | Limiter les regions live simultanees et ne pas dupliquer une `Alert`. |
| `LoadingState` | Annoncer une attente de page ou de zone. | local, pleine page | Ne pas l'utiliser pour une progression determinee. |

`Progress` expose aussi les tons accent, sante, mana et experience, ainsi
qu'une taille compacte. `Dialog` peut fermer sur le backdrop lorsque le
consommateur l'autorise; `dismissDisabled` bloque toujours Escape et le
backdrop pendant une operation.

## Patterns produit

- `NavigationTabs` : navigation responsive avec etat courant et indisponible.
- `ActivityLog` : journal repliable, action optionnelle et etat vide.
- `RoomProgress` : progression ordonnee par salles, incluant un boss.
- `EntryScreen` : cadre pleine page ou apercu pour authentification et
  onboarding.
- `FloatingPrompt` : reprise visible d'une decision differee.

Les anciennes frames compte, heros, stockage et donjon ont ete supprimees une
fois leurs derniers consommateurs migres. Les composants produit importent
desormais `Panel` directement. Les quatre panneaux du Donjon declarent
explicitement `variant="strong"`; cette intention visible ne justifie pas une
abstraction intermediaire propre a un seul ecran.

## Reports explicites

Les patterns metier `AssignmentControl`, `UpgradeAction` et
`EquipmentPicker` restent en v0.2 comme decide dans CDI-069. Leur critere
d'entree est deux consommateurs reels ou un besoin transversal documente,
avec exemple catalogue et test avant adoption.

## Couleurs locales et dette de migration

L inventaire du 2026-08-09 releve 255 occurrences de couleurs hexadecimales
dans `src/components` :

| Zone | Occurrences | Fichiers |
| --- | ---: | ---: |
| Compte | 1 | 1 |
| Shell applicatif | 59 | 4 |
| Authentification | 9 | 1 |
| Cite | 36 | 4 |
| Donjon | 56 | 4 |
| Heros | 60 | 8 |
| Onboarding | 17 | 2 |
| Coffre | 17 | 2 |

Ce nombre mesure les valeurs brutes restantes, pas autant d ecarts a corriger.
Les couleurs qui portent une information produit restent locales lorsqu aucun
token semantique existant ne decrit correctement leur role : identite des
ressources, PV/PM/XP, rarete, genre, resultat de combat, illustration, sprite
ou accent propre a un contenu metier. Leur contraste et leur signification
doivent rester stables.

Les couleurs de surface, bordure, texte, focus et ombre qui ne portent aucune
information produit constituent en revanche une dette de migration. Lorsqu un
composant concerne evolue, elles doivent etre remplacees par les tokens `ui-*`
existants, ou justifiees avant la creation d un nouveau token. Un remplacement
global est interdit : il risquerait de confondre identite produit et structure
visuelle, et de modifier des ecrans deja valides sans preuve ciblee.

## Catalogue prive

Lancer `npm.cmd run dev`, puis ouvrir
`http://localhost:3000/?ui-catalog=1`. Le catalogue n'est disponible que quand
`import.meta.env.DEV` est vrai, n'a aucun lien dans l'alpha et est charge par un
import dynamique. `npm.cmd run check:bundle` recherche son marqueur et echoue
s'il fuit dans un build public.

Le catalogue couvre les variantes de controles, selections, badges, metriques,
progressions, disclosures, journaux, navigation, bannieres persistantes, etats
d'entree, chargement, notifications dynamiques, invites differees et dialogues
de choix ou bloques. Les compositions strictement produit sont presentees comme
patterns et ne deplacent aucune regle metier dans `src/ui`.

### Inventaire produit traite

Les compositions auparavant absentes ou partielles sont maintenant representees
par leurs composants produit reels dans le catalogue. Les donnees et callbacks
sont des fixtures locales deterministes; aucune regle metier ni mutation
canonique n'est deplacee dans `src/ui`. Cette couverture ne transforme pas ces
compositions en composants partages : les criteres d'extraction restent deux
usages reels ou un risque transversal documente.

| Composition | Etat catalogue | Couverture |
| --- | --- | --- |
| En-tete de ressources, taux et acces Compte | couvert | Valeurs compactes, taux positifs/nuls, acces Compte et repli responsive du composant reel. |
| Navigation principale reelle | couvert | Onglet courant, version authentifiee et version verrouillee; libelles/icones suivent les breakpoints reels. |
| Banniere persistante de progression du Donjon | couvert | Groupe rempli/vide, medaillons Novice et neuf classes T1, galerie locale exhaustive, barres PV/mana et pause/reprise auto sur toutes les pages authentifiees. |
| Portrait de heros | couvert | Tailles `xs`, `md`, `lg`, `xl`, sprites et fallback avec bordures du composant reel. |
| Objet equipe et comparaison avant/apres | couvert | Objet equipe, emplacement vide, niveau bloque, remplacement, deltas et objet deplace. |
| Carte de batiment | couvert | Selection, verrouillage, prerequis, niveaux et icones de Cite. |
| Controle d'affectation | couvert | Compteurs, bornes desactivees, citoyen libre et variante sans citoyen libre. |
| Rencontre et transcript de combat | couvert | Attente avec journal vide, combat en lecture, victoire, defaite et absence de rencontre. |
| Groupe du Donjon et reservistes | couvert | Emplacements libres, selection, fiche/equipement, deploiement et retrait. |
| Recrutement et choix des fondateurs | couvert | Selection, renommage, elite, cout, lecture seule et chargement lors de la confirmation. |
| Confirmation destructive Compte | couvert | Ouverture locale, annulation, attente simulee et retour d'erreur local. |
| Filtres responsive du Coffre | couvert | Recherche, divulgation mobile, tri desactive et reinitialisation. |

Le controle responsive du catalogue doit verifier `scrollWidth <= innerWidth` a
360 px et 1440 px. Une largeur basee sur `100vw` est interdite dans son contenu
padde : sous Windows elle inclut la barre de defilement verticale et peut creer
un debordement horizontal artificiel.

Le 2026-08-09, apres integration des compositions produit inventoriees,
l'utilisateur a rapporte le test dedie
`tests/browser/uiCatalog.responsive.browser.spec.ts` vert a 360 px et 1440 px :
2 tests passes en 3,6 s. Cette preuve est rapportee par l'utilisateur et n'a pas
ete executee par Codex.

## Gouvernance et depreciation

Un ajout doit repondre a au moins deux usages reels, ou a un risque transversal
explicite (accessibilite, securite d'interaction, coherence). La proposition
documente intention, variante, etats, exemple catalogue, test et anti-usage.
Une modification conserve les contrats existants ou fournit un adaptateur.

Une depreciation est annoncee dans ce document, garde l'ancien export pendant
la migration des consommateurs, puis supprime l'adaptateur seulement apres
verification des usages avec `rg` et couverture des remplacements. Les tokens
bruts d'un ecran ne deviennent pas semantiques par simple renommage.

## Validation

Les tests de composants couvrent semantique, erreurs, chargement et bornage.
Les tests de tokens verifient les contrastes textuels AA et la reduction du
mouvement. Typecheck, lint, build alpha et budget bundle completent la preuve.
La validation visuelle desktop/mobile et le parcours clavier du catalogue
ont ete realises par l'utilisateur. Toute modification visuelle posterieure
demande une revalidation ciblee avant cloture definitive de CDI-076.
La suite Playwright responsive des ecrans consommateurs a ensuite ete
rapportee verte par l'utilisateur: 53 tests sur 53 en 27,7 s.

## Handoff CDI-077

Ecrans et zones prets pour une migration incrementale :

- Compte, Aventuriers, Coffre et Donjon : panneaux deja delegues a `Panel`.
- Alerte d'etat canonique : `Alert` et `Button` adoptes.
- Barre de recherche du Coffre : `TextField` adopte.
- Cartes d'objets du Coffre : `Card` adopte.
- Creation de cite : action iconique migree vers `IconButton`.
- Details de ressources : aides migrees vers `Tooltip`.
- Recrutement et priere de vocation : candidats identifies pour migrer vers
  `Dialog` sans fusionner leurs regles metier.

La revalidation utilisateur couvre l'agrandissement typographique, Card,
Dialog, Tooltip, les etats semantiques, le clavier et l'absence de debordement
en desktop et a 360 px. Les preuves sont conservees dans
`assets/design/cdi-076/catalog-desktop-1440.png` et
`assets/design/cdi-076/catalog-mobile-360.png`; leur contexte est decrit dans
`assets/design/cdi-076/manifest.json`. Codex a inspecte les deux fichiers apres
la validation utilisateur.
