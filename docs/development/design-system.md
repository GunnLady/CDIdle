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

Les anciennes frames compte, heros, stockage et donjon deleguent desormais a
`Panel`; elles restent temporairement comme adaptateurs pour permettre une
migration ecran par ecran.

## Reports explicites

`Select` et `Badge` sont differes jusqu'a une migration reelle dans
CDI-077. Les patterns metier `AssignmentControl`, `UpgradeAction` et
`EquipmentPicker` restent en v0.2 comme decide dans CDI-069. Leur critere
d'entree est deux consommateurs reels ou un besoin transversal documente,
avec exemple catalogue et test avant adoption.

## Catalogue prive

Lancer `npm.cmd run dev`, puis ouvrir
`http://localhost:3000/?ui-catalog=1`. Le catalogue n'est disponible que quand
`import.meta.env.DEV` est vrai, n'a aucun lien dans l'alpha et est charge par un
import dynamique. `npm.cmd run check:bundle` recherche son marqueur et echoue
s'il fuit dans un build public.

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
