# CDI-069 — Audit et cadrage UI/UX de l’alpha

Statut : **audit fonctionnel conservé ; architecture d'interface consolidée**.

> La décision active est décrite dans
> `docs/architecture/cdi-069-interface-architecture.md`. Les passages historiques
> qui évoquent une scène interactive ou des masques sont remplacés par cette
> architecture et ne constituent plus une consigne d'implémentation.

## 1. Portée et niveau de preuve

Cet audit ne modifie ni les écrans, ni le CSS, ni les règles de jeu. Il distingue :

- **vérifié dans le code** : structure React, styles, composants, sémantique et
  responsive déclaré ;
- **vérifié dans l’alpha** : écran déconnecté à 1280 × 720 et 360 × 800 ;
- **inféré du code** : densité et parcours des écrans authentifiés, encore à
  confirmer visuellement avec une partie représentative ;
- **proposé** : navigation, direction visuelle et ordre des lots.

La validation visuelle des écrans authentifiés reste un critère de clôture de
CDI-069. Elle ne doit pas être remplacée par les seules mesures statiques.

## 2. Résumé de décision proposé

CDIdle doit viser une interface **dark fantasy lisible**. Un shell ornemental
porte les ressources et une navigation principale unique. La Cité devient un
tableau de bord persistant en maître/détail, sans sous-onglets Population,
Infrastructures ou Forge. La refonte ne doit ni remplacer le runtime canonique
extrait par CDI-081, ni réécrire les règles métier.

Priorités proposées :

1. fixer les responsabilités de `App`, `AppShell` et des pages ;
2. intégrer le header ressources et une navigation bois/or cohérente ;
3. migrer la Cité vers ses trois panneaux persistants et la Forge contextuelle ;
4. extraire dans CDI-076 les fondations prouvées par ce premier écran ;
5. migrer ensuite Aventuriers, Donjon, Coffre et Compte.

## 3. Architecture frontend actuelle

### Frontières préservées

- React 19, TypeScript, Vite et Tailwind CSS 4 ;
- état autoritaire et orchestration dans les hooks et modules `domain`/`lib` ;
- `App.tsx` compose les runtimes, la navigation et les panneaux ;
- les panneaux reçoivent des données et callbacks typés ;
- chargement différé des cinq panneaux principaux.

CDI-081 a déjà extrait session, snapshot, file optimiste, leadership,
multi-onglets, automation et transcript. Une refonte visuelle ne doit pas
réintroduire ces responsabilités dans les composants UI ni déplacer à nouveau
ces modules sans preuve de besoin.

### Baseline avant le premier lot CDI-069 (historique)

Le tableau suivant décrit l'état audité avant l'implémentation du shell et de
la nouvelle Cité. Il est conservé pour expliquer les décisions du ticket, mais
ne décrit plus l'état courant du code.

| Surface | Taille | Constats |
| --- | ---: | --- |
| `App.tsx` | 1 524 lignes | shell, états transverses, navigation, onboarding et modales restent assemblés dans un même rendu |
| `TownPanel` | 1 056 lignes | citoyens, bâtiments et forge dans un seul composant |
| `HeroPanel` | 1 082 lignes | recrutement, liste, fiche, compétences et équipement |
| `DungeonPanel` | 730 lignes | navigation d’étage, groupe, rencontre et journaux |
| `StoragePanel` | 506 lignes | résumé, six contrôles, cartes et équipement |
| `AccountPanel` | 315 lignes | identité, résumé, sauvegarde et zone destructive |

Il n’existe pas encore de couche UI commune significative : les composants
partagés actuels couvrent surtout portraits, icônes de ressource, alertes
canoniques et prière de vocation.

### État après le premier lot Cité

- `AppShell` porte désormais le header, les statuts transverses, la navigation
  persistante et le bandeau d'expédition ;
- `TownPanel` est supprimé et remplacé par `CityDashboard`,
  `SelectedBuildingPanel`, `BuildingListPanel`, `AssignmentPanel` et
  `ForgeWorkspace` ;
- les projections de présentation Cité et Forge sont préparées dans
  `src/domain` ;
- `App.tsx` reste une dette globale de 1 256 lignes. Sa réduction supplémentaire
  est différée aux migrations des autres écrans afin d'éviter un refactor sans
  consommateur réel.

Le sous-lot Aventuriers poursuit cette migration : `HeroPanel` est remplacé par
`HeroesPage`, `DungeonPartyManager`, `HeroRosterPanel`, `SelectedHeroPanel`,
`HeroEquipmentPanel` et `HeroSkillsPanel`. La sélection du héros devient locale
et les règles de recrutement ou de capacité du groupe restent projetées depuis
le domaine partagé.

La cible n’est pas un nouveau « gros composant générique ». `AppShell`, les
écrans et leurs compositions doivent dépendre de composants UI sans logique
autoritaire ; les hooks existants restent la frontière de comportement.

## 4. Cartographie du style et de la sémantique

Mesures vérifiées sur `App.tsx` et `src/components/*.tsx` :

- 835 blocs `className="…"` littéraux, dont 619 combinaisons uniques ;
- 173 couleurs hexadécimales distinctes ;
- `#5c402b`, `#caa050` et `#a89078` sont répétées respectivement 92, 80 et
  58 fois ;
- au moins 140 occurrences de tailles explicites inférieures à 12 px, sans
  compter les valeurs décimales comme 9,5 px et 10,5 px ;
- cinq familles déclarées dans le thème et six familles téléchargées depuis
  Google Fonts ;
- 71 boutons, mais aucun élément `<nav>`, aucun `<dialog>`, aucune barre
  `<progress>` et une seule `<section>` ;
- 6 `aria-label`, 1 `aria-labelledby`, aucun `aria-describedby` et 36 aides
  portées uniquement par `title`.

Le CSS global ne contient que les polices, le thème typographique et les
scrollbars. Presque toute l’identité est donc distribuée dans le JSX. Les
variantes actif, danger, verrouillé, chargement et sélection sont recréées
localement, ce qui explique les écarts de couleur, rayon, bordure et feedback.

## 5. Parcours et frictions

### Shell et navigation — P1, rentabilité très forte

**Preuve alpha.** À 1280 px, les cinq onglets occupent environ 240 px chacun.
À 360 px, leur conteneur garde 514 px de contenu et `main` devient un défilement
horizontal. « Coffre » et « Compte » commencent hors viewport. La barre n’est
pas déclarée comme navigation ni comme liste d’onglets.

**Conséquences.** Accès aux surfaces principales caché, déplacement horizontal
involontaire et état actif exprimé surtout par la couleur.

**Direction validée.** Header horizontal ornemental pour les ressources et
l'identité, navigation principale en bois sculpté, puis adaptation compacte
sur mobile sans défilement horizontal caché. La Forge reste dans la Cité et
s'ouvre depuis la liste des bâtiments, sans destination ou sous-onglet dédié.
Un bandeau d'expédition permanent apparaît sur Cité, Aventuriers, Coffre et
Compte avec étage, salle, état et groupe. Il est absent de Donjon pour ne pas
dupliquer la progression détaillée déjà affichée par cette page.

### Cité — P1, rentabilité forte

**Vérifié dans le code.** Trois sous-onglets mélangent citoyens, bâtiments et
forge. L’affectation répète quatre fois les mêmes contrôles `−/+`. Les coûts,
prérequis, production et actions se partagent de nombreuses lignes en 9 à
12 px.

**Friction probable.** Le joueur doit parcourir une interface de gestion avant
de comprendre la prochaine action rentable.

**Direction validée.** Composition à trois zones persistantes : Bâtiment
sélectionné, Affectations et Bâtiments. Le clic sur un
bâtiment met à jour le détail sans navigation. La Forge devient le contenu
contextuel du bâtiment `forge`. Sur mobile, les zones deviennent une colonne
ordonnée sans défilement horizontal. La scène complète reste une référence
artistique et n'est plus une surface interactive.

### Forge — P1, rentabilité forte

**Vérifié dans le code.** Catalogue scrollable, détail du plan, coût,
prévisualisation, option d’amélioration, choix de statistique, annulation et
finalisation cohabitent dans `TownPanel`.

**Friction probable.** Le flux séquentiel est présenté comme une grande page,
et les actions irréversibles ne disposent pas d’un pattern de confirmation
commun.

**Proposition.** Pattern en trois étapes : choisir le plan, vérifier résultat
et coût, confirmer/refuser. Sur mobile, une étape par vue avec récapitulatif
persistant. Le verrouillage explique toujours le prérequis et offre le chemin
vers le bâtiment concerné.

### Aventuriers — P1, rentabilité forte

**Vérifié dans le code.** Chaque héros est une fiche longue avec portrait,
niveau, trois onglets, sept attributs en grille, statistiques de combat,
résistances, compétences, quatre emplacements et actions. Plusieurs libellés
et badges utilisent 9 à 11 px.

**Friction probable.** Comparer deux héros ou changer rapidement l’activité du
groupe exige de parcourir des cartes très denses.

**Proposition.** Desktop en maître/détail : expédition et roster à gauche,
fiche du héros sélectionné au centre, équipement et compétences à droite.
Mobile : expédition, roster puis fiche dédiée. Le gestionnaire montre les
quatre places, les réservistes et permet ajout/retrait sans perdre le contexte
du Donjon. Équipement et Coffre partagent le même pattern de décision et de
comparaison, branché sur la même transition métier.

### Donjon — P2, rentabilité forte

**Vérifié dans le code.** Choix d’étage, dix salles, quatre commandes,
composition du groupe, rencontre et trois filtres de journaux sont réunis.
Les actions principales utilisent 11 px et les filtres 10 px.

**Friction probable.** L’état courant et la prochaine action rivalisent avec
le journal et les contrôles secondaires.

**Proposition.** Bandeau de progression d’étage, rencontre au centre, commande
principale persistante, gestion complète des héros actifs et disponibles, puis
journal repliable. Le joueur peut ajouter, retirer, inspecter et équiper ses
héros sans quitter le Donjon. L’exploration automatique doit afficher un état
explicite, pas seulement une variante de bouton.

### Coffre — P2, rentabilité moyenne à forte

**Vérifié dans le code.** Recherche, type, rareté, niveau, critère de tri,
direction et remise à zéro précèdent une grille de cartes. Équiper et recycler
partagent la même densité visuelle.

**Friction probable.** Les filtres prennent trop de place sur mobile et une
action destructive peut être trop proche d’une action fréquente.

**Proposition.** Recherche toujours visible ; filtres avancés dans un panneau
avec compteur ; tri compact ; décision d'équipement montrant le héros, son
emplacement actuel, les effets et statistiques avant/après. Le remplacement
est atomique et restitue l'ancien objet. Le recyclage reste isolé comme action
dangereuse.

### Compte — P2, rentabilité moyenne

**Vérifié dans l’alpha.** L’écran déconnecté est clair, mais la navigation
globale et le pied de page restent visibles alors que quatre destinations sont
verrouillées. À 360 px, le texte descriptif est à 12 px et les métriques de
pied de page à 10 px.

**Vérifié dans le code.** Sauvegarde, déconnexion, réinitialisation et
suppression sont regroupées dans une carte ; les confirmations sont des blocs
conditionnels sans sémantique de dialogue.

**Proposition.** Séparer session, synchronisation et « zone dangereuse ».
Employer le même composant de confirmation accessible pour reset, suppression
et forge lorsque nécessaire.

## 6. Direction visuelle validée

### Principes CDIdle

1. **Gestion visible** : détail, affectations et bâtiments restent
   consultables sans changer de sous-vue.
2. **Maître/détail** : une sélection locale change le contexte sans modifier
   l'état canonique ni déclencher de commande.
3. **Information lisible** : ressources, verrouillages et action principale
   restent compréhensibles malgré l'ornement.
4. **Fantasy assumée** : header bois/or, blason, gemmes violettes, matières et
   lumière chaude structurent l'identité.
5. **Feedback autoritaire explicite** : en cours, confirmé, restauré, hors
   ligne et observateur partagent un vocabulaire stable.
6. **Détails progressifs** : la console révèle le niveau expert sans bloquer
   la décision courante.

Les références visuelles sont versionnées sous `assets/design/cdi-069/`.
L'architecture active est décrite dans
`docs/architecture/cdi-069-interface-architecture.md`.

### Fondations v0 proposées

- surfaces : fond, shell, panneau, carte et surface élevée ;
- texte : principal, secondaire, discret et désactivé ;
- accent bronze/or réservé à sélection, progression importante et action
  primaire, sans donner un sens de succès ;
- sémantiques distinctes : information bleu, succès vert, attente ambre,
  danger rouge, observateur violet, verrouillage neutre ;
- `Cinzel` pour titres courts, `Inter` pour lecture et contrôles,
  `JetBrains Mono` pour valeurs tabulaires ; autres polices différées jusqu’à
  preuve d’un usage ;
- grille d’espacement 4 px, cibles interactives de 44 px minimum, rayon et
  ombre limités à trois niveaux ;
- mouvement de 120 à 200 ms uniquement pour confirmer état et relation, avec
  `prefers-reduced-motion`.

## 7. Vocabulaire sémantique

| État | Sens | Exemple de formulation |
| --- | --- | --- |
| information | fait sans action urgente | « Production mise à jour » |
| succès | commande confirmée | « Bâtiment amélioré » |
| attente | action en cours | « Forge en cours… » |
| danger | conséquence grave ou irréversible | « Supprimer le compte » |
| erreur | action refusée ou service indisponible | « Action annulée, état restauré » |
| verrouillé | prérequis non rempli | « Requiert Forge niv. 1 » |
| désactivé | action momentanément impossible | raison visible à proximité |
| observateur | lecture seule multi-onglets | « Contrôlé dans un autre onglet » |

Le verrouillage est un état métier expliqué ; le désactivé est un état
d’interaction temporaire. Ils ne doivent pas partager uniquement une opacité.

## 8. Architecture UI cible

Organisation cible : le shell et les compositions d'écran sont matérialisés
par le premier lot CDI-069 ; les primitives réutilisables sont extraites dans
CDI-076 après preuve de leur usage réel.

```text
src/ui/
  foundations/   tokens, reset ciblé, focus, mouvement
  primitives/    Button, IconButton, TextField, Select, Badge
  components/    Panel, Card, Tabs, Dialog, Alert, Progress, Tooltip
  patterns/      ResourceBar, UpgradeAction, AssignmentControl,
                 EquipmentPicker, AuthoritativeFeedback
  catalog/       catalogue exclu de l’alpha publique
src/components/  écrans et compositions métier migrés progressivement
```

- une primitive ignore héros, forge et donjon ;
- un composant combine des primitives sans règle de jeu ;
- un pattern peut nommer un usage du jeu, mais reçoit état et callbacks ;
- l’écran choisit les données et commandes ;
- les hooks/domaines existants restent responsables du comportement.

Premiers composants rentables à confirmer dans CDI-076 : `Button`,
`IconButton`, champs, `Panel`, `Alert`, `Progress`, `Dialog` et `Tooltip`.
`Tabs` n'est pas une fondation prioritaire de la Cité aplatie. Les patterns
`AssignmentControl`, `UpgradeAction` et `EquipmentPicker` n’entrent en v0.2
qu’après leur première migration réelle.

## 9. Responsive et accessibilité : critères explicites

- aucun défilement horizontal à 360, 768, 1024 et 1440 px ;
- navigation principale entièrement accessible sans geste horizontal caché ;
- texte courant de 14 px minimum ; 12 px réservé aux métadonnées non
  essentielles ; aucune information nécessaire à 9–10 px ;
- cible interactive de 44 × 44 px, focus `:focus-visible` contrasté et ordre
  clavier identique à l’ordre visuel ;
- `nav`, titres hiérarchisés, `section`, `progress`, `dialog`/`aria-modal` et
  descriptions reliées quand ils portent du sens ;
- information jamais transmise par la seule couleur, l’emoji ou `title` ;
- contraste WCAG AA : 4,5:1 pour texte normal, 3:1 pour grand texte et
  composants ;
- états chargement, erreur, offline et observateur annoncés sans multiplier
  des régions `role=status` ambiguës ;
- animations réduites lorsque demandé par le système.

## 10. Gouvernance légère

1. un composant naît d’au moins deux usages ou d’un besoin transversal fort
   (accessibilité, feedback autoritaire, confirmation) ;
2. toute variante possède intention, états, exemple réel, test et anti-usage ;
3. un token est sémantique et remplace des valeurs observées, pas une valeur
   arbitraire isolée ;
4. toute modification est visible dans le catalogue interne ;
5. une dépréciation nomme le remplacement et ne supprime l’ancien style
   qu’après recherche de ses consommateurs ;
6. les exceptions restent locales et documentées tant que leur réutilisation
   n’est pas prouvée.

## 11. Trajectoire et lots proposés

| Étape | Livrable | Condition de sortie |
| --- | --- | --- |
| v0 — CDI-069 cadrage | audit, architecture et maquette validées | décision utilisateur consignée |
| lot 1 — CDI-069 | shell, navigation, Cité et Forge contextuelle | aucun overflow mobile, runtime inchangé |
| v0.1 — CDI-076 | fondations extraites du lot 1 et catalogue privé | variantes, clavier, contrastes et mobile vérifiés |
| lot 2 | Aventuriers + équipement | roster/détail et sélection d’objet validés |
| lot 3 | Donjon | état, action et journal hiérarchisés |
| lot 4 | Coffre + Compte | filtres et actions dangereuses validés |
| v0.2 | patterns métier prouvés par les lots | catalogue et usages alignés |
| v1 | écrans principaux migrés | adoption mesurée, exceptions et dette restantes documentées |

## 12. Dette et nettoyage proposés

- ne pas supprimer les hooks/runtime de CDI-081 : ils sont appelés et
  constituent la frontière correcte ;
- extraire le shell et les modales de présentation d’`App.tsx` pendant leur
  lot visuel, sans déplacer les commandes ;
- poursuivre la migration des écrans restants par compositions d’écran ;
  `TownPanel` et `HeroPanel` sont désormais remplacés par leurs compositions
  Cité et Aventuriers ;
- remplacer progressivement les classes répétées par les tokens et composants
  validés ; ne pas lancer de réécriture mécanique globale ;
- vérifier `VocationPrayerDialog` et `VocationPrayerPrompt` pendant la création
  du composant `Dialog`, puis supprimer uniquement la variante sans
  consommateur prouvé.

## 13. Validation attendue

Avant CDI-076, valider ou corriger :

1. le header ressources ornemental et sa déclinaison mobile ;
2. la navigation bois/or sans débordement horizontal ;
3. la composition Cité à trois panneaux et la Forge contextuelle ;
4. l'ordre Cité/Forge → Aventuriers → Donjon → Coffre/Compte ;
5. le contrat d'assets sans texte aplati ni surface bitmap interactive ;
6. les écrans authentifiés avec une partie représentative sur desktop et
   mobile.
