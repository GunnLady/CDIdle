# CDI-069 — Architecture de l'interface

Statut : **architecture implémentée et validée visuellement par l'utilisateur ;
audit fonctionnel pré-push terminé sans écart restant**. Le ticket demeure en
`Doing` sur décision explicite de l'utilisateur.

## 1. Décision

La refonte commence par l'architecture logicielle et l'architecture de
l'information, avant l'extraction du design system. Le shell global et la Cité
servent de premier cas réel. Les composants communs seront extraits seulement
après que ce cas aura prouvé leur contrat.

La maquette de composition est versionnée dans
`assets/design/cdi-069/references/city-dashboard-reference.png`.

## 2. Navigation globale

Une seule navigation principale de jeu reste visible : Cité, Aventuriers,
Donjon et Coffre. Compte reste une page, mais son accès est un bouton dédié dans
le header, disponible connecté ou non et marqué actif sur la page Compte. Le
header affiche les ressources et l'identité. Les ornements
sont des assets de présentation ; icônes, libellés et valeurs sont des éléments
DOM accessibles, adaptables et indépendants du bitmap.

Les pages ne recréent pas une seconde barre de destinations. Une navigation
locale n'est admise que lorsqu'elle représente plusieurs modes indispensables
d'un même objet. Elle ne sert pas à cacher les informations principales.

### Bandeau permanent d'expédition

`DungeonProgressBanner` est affiché dans `AppShell` sur Cité, Aventuriers,
Coffre et Compte lorsque le joueur est authentifié. Il est masqué sur Donjon,
où la progression complète est déjà la vue principale. Il permet de suivre le
groupe sans ouvrir le Donjon :

- étage et salle courants, avec progression dans l'étage ;
- état explicite : aucun groupe, prêt, exploration, rencontre, combat, pause ou
  retour au camp ;
- mode automatique actif ou arrêté ;
- quatre places du groupe avec héros, PV, mana et indisponibilité éventuelle ;
- action principale `Voir le Donjon` ;
- commande rapide pause/reprise seulement lorsque son sens est non ambigu.

Sans groupe actif, le bandeau reste compact et propose `Préparer le groupe` vers
Aventuriers. Il ne possède aucun polling ou état de progression propre : il
projette uniquement le snapshot canonique déjà détenu par `App`.

Sur desktop, navigation et progression partagent une seule barre persistante :
la navigation occupe 40 % et le suivi 60 %. Sur mobile, les deux blocs restent
empilés et persistants. Les quatre héros sont disponibles dans un développement
accessible, sans masquer la navigation principale.

Le Grimoire développeur n'appartient pas au shell fonctionnel. Lorsqu'il est
autorisé, il reste replié dans un outil flottant hors du flux de page.

## 3. Composition de la Cité

La Cité affiche simultanément trois zones :

| Zone | Responsabilité | Source |
| --- | --- | --- |
| Bâtiment sélectionné | détail, coût, prérequis et action principale | catalogue + état canonique |
| Bâtiments | liste, niveaux, verrouillages et sélection | catalogue + état canonique |
| Affectations | citoyens libres et répartition des quatre rôles | état canonique |

La sélection change le détail sans navigation et sans commande réseau. La
sélection initiale est déterministe : `habitation` lorsqu'elle existe, sinon le
premier identifiant du catalogue. Elle n'est ni persistée ni synchronisée.

Le panneau s'appelle `Bâtiment sélectionné`. Le terme `Prochaine décision`
reste interdit tant qu'aucune recommandation déterministe, expliquée et testée
n'existe.

### Forge

La Forge n'est plus un sous-onglet. Sélectionner `forge` affiche dans le panneau
de détail son verrouillage et son prérequis, ou son catalogue et son flux de
fabrication lorsqu'elle est construite. Les commandes `forge.start`,
`forge.finalize` et `forge.cancel` conservent leur contrat.

`createForgeWorkspaceView` prépare plans, matériaux, disponibilité, rareté,
détails d'arme et compatibilité des modificateurs. `ForgeWorkspace` conserve
seulement la sélection locale du plan et les décisions de confirmation.

## 4. Structure des autres pages

### Aventuriers

La page conserve quatre zones fonctionnelles sans onglet par héros :

| Zone | Contenu |
| --- | --- |
| Roster et recrutement | capacité, coût, recrutement, liste compacte et statut actif |
| Héros sélectionné | identité, classe, niveau, synthèse combat, attributs et action de renvoi |
| Compétences | compétences actives et passives avec leurs effets |
| Équipement | quatre emplacements, objet équipé, sélection et retrait |
| Expédition | quatre places actives, PV, étage/salle et accès au Donjon |

`selectedHeroId` est un état local de présentation. La sélection initiale est
le premier héros actif, sinon le premier héros du roster. `DungeonPartyManager`
affiche les quatre places actives et leur santé. `HeroRosterPanel` porte les
réservistes, les raisons d'indisponibilité et les actions d'ajout/retrait. Le
changement actif/inactif, le recrutement, le renvoi et l'équipement restent des
commandes canoniques.

Sur desktop, roster et expédition occupent la colonne gauche, la synthèse du
héros le centre, et Compétences/Équipement la colonne droite ou deux panneaux
empilés. Sur mobile : expédition, roster, héros sélectionné, équipement,
compétences. Les détails experts peuvent utiliser des sections repliables,
jamais une seconde navigation de page.

### Donjon

La page contient quatre zones :

| Zone | Contenu |
| --- | --- |
| Progression et commande | étage, salle, navigation d'étage, exploration manuelle/auto, retraite |
| Rencontre actuelle | type, ennemi ou événement, état de lecture et résultat |
| Gestion du groupe | quatre places, héros engagés, réservistes, PV/PM, équipement et ajout/retrait |
| Historique | rencontres résolues et notes locales du Donjon |

La progression reste canonique. `DungeonPartyPanel` permet de consulter tous
les héros, de les ajouter ou retirer et d'ouvrir leur fiche/équipement sans
quitter le Donjon. Les seuls états locaux concernent l'affichage : héros
sélectionné, confirmation de reset et développement d'un
détail. L'action principale courante est unique et persistante ; les actions de
reset ou retraite sont visuellement séparées.

Sur desktop, progression en bandeau, rencontre au centre, groupe à droite et
historique en bas. Sur mobile : progression, rencontre, action principale,
groupe, historique repliable.

### Coffre

La page suit un maître/détail à quatre zones :

| Zone | Contenu |
| --- | --- |
| Résumé | quantité d'objets et matériaux de forge |
| Recherche et filtres | recherche permanente, type, rareté, niveau et tri |
| Inventaire | liste ou grille des piles filtrées |
| Décision d'équipement | objet, héros cible, équipement actuel, comparaison et confirmation |

`selectedItemInstanceId`, filtres, tri et cible d'équipement sont locaux.
`StorageEquipmentDecisionPanel` montre, pour chaque héros compatible, son portrait,
son niveau, l'emplacement visé, l'objet actuel, les effets gagnés/perdus et les
statistiques dérivées avant/après. Il signale le niveau requis, le blocage de
main gauche et tout objet déplacé par une arme à deux mains.

L'action `Remplacer` est atomique : le serveur équipe le nouvel objet et restitue
l'ancien au Coffre dans une seule transition. Si la commande échoue, aucun des
deux états n'est modifié. Le recyclage reste isolé comme action dangereuse et
demande confirmation lorsque sa conséquence est irréversible.

Sur desktop, filtres et inventaire occupent la zone principale, le détail reste
visible à droite. Sur mobile, recherche et inventaire précèdent un panneau de
détail plein écran ou une feuille modale ; les filtres avancés sont repliables
avec un compteur actif.

### Compte

Cette page est une exception au maître/détail : elle regroupe des responsabilités
distinctes sans objet sélectionné.

| Zone | Contenu |
| --- | --- |
| Identité et session | compte actif, connexion ou déconnexion |
| Synchronisation | état cloud, commande de sauvegarde et erreurs |
| Résumé du royaume | ressources, bâtiments, citoyens, héros et progression |
| Historique système | connexion, synchronisation et état de l'application |
| Zone dangereuse | réinitialisation du royaume et suppression du compte |

Déconnecté, la page devient un portail d'authentification unique et n'affiche
pas des contrôles inopérants. Connecté, les cinq zones sont visibles sans
sous-navigation. Reset et suppression utilisent le même contrat de confirmation
accessible, mais restent deux actions distinctes. En fonctionnement normal,
leur disponibilité dépend du transport, du chargement de session et de
l'autorité de l'onglet. Une sauvegarde incompatible constitue une exception de
récupération : après chargement de la session et tant que le navigateur est en
ligne, reset et suppression restent accessibles même si le transport canonique
et le leadership n'ont pas pu être établis. Le serveur conserve l'autorité sur
leur résultat et aucune donnée locale n'est effacée avant sa réponse.

Sur desktop, identité/synchronisation et résumé peuvent former deux colonnes ;
l'historique système et la zone dangereuse restent en pleine largeur en bas.
Sur mobile : identité, synchronisation, résumé, historique puis zone dangereuse.

### Règle commune de composition

- une destination globale correspond à une page ;
- une sélection locale change un détail, jamais la destination ;
- un panneau repliable réduit la densité mais ne cache pas l'action principale ;
- un dialogue est réservé à une décision temporaire ou une confirmation ;
- les actions fréquentes, dangereuses et secondaires ne partagent pas la même
  priorité visuelle ;
- le responsive réordonne les mêmes données sans dupliquer les commandes.

## 5. Responsabilités logicielles

```text
App
└─ AppShell
   ├─ ResourceHeader
   ├─ PrimaryNavigation
   ├─ DungeonProgressBanner
   ├─ CanonicalStatusLayer
   └─ PageViewport
      ├─ CityDashboard
      │  ├─ SelectedBuildingPanel
      │  ├─ AssignmentPanel
      │  └─ BuildingListPanel
      ├─ HeroesPage
      │  ├─ HeroRosterPanel
      │  ├─ DungeonPartyManager
      │  ├─ SelectedHeroPanel
      │  ├─ HeroSkillsPanel
      │  └─ HeroEquipmentPanel
      ├─ DungeonPage
      │  ├─ DungeonProgressControls
      │  ├─ CurrentEncounterPanel
      │  ├─ DungeonPartyPanel
      │  └─ DungeonHistoryPanel
      ├─ StoragePage
      │  ├─ StorageToolbar
      │  ├─ ItemInventoryPanel
      │  └─ StorageEquipmentDecisionPanel
      └─ AccountPage
         ├─ AccountIdentityPanel
         ├─ SyncStatusPanel
         ├─ RealmSummaryPanel
         ├─ SystemHistoryPanel
         └─ AccountDangerZonePanel
```

### `App`

- possède et compose les runtimes existants ;
- choisit la destination active ;
- transmet des projections et callbacks typés ;
- ne reprend pas le rendu détaillé des pages.

### `AppShell`

- structure header, navigation, bandeau d'expédition, statuts transverses et
  viewport ;
- ne connaît aucune règle de bâtiment, héros, donjon ou objet ;
- conserve le chargement différé des cinq pages.

### `CityDashboard`

- compose les trois zones ;
- possède seulement le `selectedBuildingId` local ;
- transforme une sélection invalide vers la sélection initiale déterministe ;
- ne calcule ni coût, ni disponibilité, ni résultat de commande.

### Panneaux de présentation

- reçoivent des modèles de vue et des callbacks ;
- n'importent pas Supabase ni la file d'opérations ;
- n'écrivent pas dans le snapshot canonique ;
- exposent une structure HTML sémantique et testable.

### Domaine et orchestration

- restent propriétaires des règles, projections, commandes, idempotence,
  concurrence, mode observateur et restauration autoritaire ;
- ne connaissent pas la disposition des panneaux.

## 6. Modèles de présentation

Les modèles de présentation regroupent seulement les informations déjà
calculées nécessaires au rendu. Ils n'introduisent aucune règle persistante.

```ts
type CityBuildingView = {
  id: BuildingId;
  name: string;
  level: number;
  maxLevel: number;
  locked: boolean;
  lockReason?: string;
  cost: ResourceCost;
  canUpgrade: boolean;
};

type CityDashboardView = {
  buildings: CityBuildingView[];
  citizens: CitizenAssignmentView;
  recentActivity: TownActivityView[];
};
```

Les types exacts seront alignés sur les projections existantes pendant
l'implémentation. Ce schéma fixe les responsabilités, pas une duplication du
catalogue métier.

Les pages Aventuriers et Coffre appliquent le même contrat avec un identifiant
de sélection local et une liste de vues préparées. Donjon consomme directement
la projection de progression et les rencontres autoritaires. Compte consomme
les états de session et synchronisation sans projection maître/détail forcée.

### Patterns transverses prouvés

`DungeonPartyManager` et `DungeonPartyPanel` consomment des projections issues
du même roster. Aventuriers privilégie une synthèse qui mène au Donjon ; Donjon
ajoute réservistes, raisons de blocage, statistiques de combat et callbacks
`hero.activity`. La capacité active vient de `ACTIVE_HERO_LIMIT` dans le domaine
partagé et n'est plus recopiée dans les panneaux.

`EquipmentDecisionPanel` et `StorageEquipmentDecisionPanel` répondent à deux
contextes différents : un emplacement du héros d'un côté, un objet du Coffre et
plusieurs héros candidats de l'autre. Ils partagent `EquipmentChangeSummary` et
les projections pures de `heroEquipmentPresentation`, alignées sur la transition
autoritaire. Aucun composant ne simule lui-même l'équipement.

`DungeonProgressBanner` consomme la même projection que Donjon et n'est rendu
que lorsque la destination active n'est pas Donjon. Il n'exécute que la
navigation et, si elle est exposée, la commande existante de pause/reprise. Il
ne possède ni minuterie, ni progression optimiste indépendante.

## 7. Responsive

- **≥ 1280 px** : `Bâtiment sélectionné | Bâtiments | Affectations`, avec une
  proportion `1,35 | 1 | 1` et des hauteurs alignées ;
- **< 1280 px** : une colonne dans l'ordre Bâtiment sélectionné, Bâtiments,
  Affectations ;
- aucun panneau ne dépend d'une largeur fixe ;
- aucun défilement horizontal à 360, 768, 1024 ou 1440 px ;
- la navigation compacte reste accessible sans geste horizontal caché.

Le header peut réduire l'ornement et regrouper les ressources, mais ne supprime
ni valeur ni libellé indispensable.

## 8. Accessibilité et états

- `nav` et destination active exposées sémantiquement ;
- titre unique de page et sections nommées ;
- cibles interactives de 44 × 44 px minimum ;
- focus visible et ordre clavier identique à l'ordre visuel ;
- verrouillage accompagné d'une raison textuelle ;
- chargement, erreur, hors ligne, observateur et restauration autoritaire ne
  partagent pas plusieurs régions `role=status` ambiguës ;
- aucune information portée uniquement par couleur, image, emoji ou `title` ;
- mouvement réduit lorsque `prefers-reduced-motion` est actif.

## 9. Assets

- `header-reference.png` fixe l'identité bois, or, blason et gemmes ;
- `city-dashboard-reference.png` fixe la composition générale ;
- `village-complete-reference.png` reste une référence artistique secondaire ;
- aucun masque, détourage ou hit-test bitmap n'est requis ;
- les miniatures de bâtiments peuvent d'abord utiliser des cadrages
  rectangulaires ou des placeholders cohérents ; elles n'ont aucune fonction
  métier et peuvent évoluer séparément.

## 10. Ordre d'implémentation

1. `AppShell`, header et navigation, sans déplacer les runtimes.
2. `DungeonProgressBanner` partagé sur les quatre pages hors Donjon.
3. Projection de présentation Cité et état local de sélection.
4. Composition des trois panneaux sans Forge avancée.
5. Réintégration contextuelle du flux Forge existant.
6. Tests ciblés, responsive et preuve visuelle.
7. Extraction dans CDI-076 des primitives réellement répétées.

La preuve responsive autonome du lot Cité s'exécute sans Supabase :

```powershell
npm.cmd run test:layout-browser
```

Elle monte les cinq pages sans Supabase et contrôle 360, 768, 1024, la frontière
desktop de 1280 et 1440 px. La Cité vérifie le débordement horizontal, le
maître/détail desktop, les 14 bâtiments, la lecture seule, l'absence de commande
sur sélection et les états Forge 0/1. Aventuriers, Donjon, Coffre et Compte
vérifient leurs zones, leur ordre responsive, leurs sélections locales et le
verrouillage des commandes indisponibles.

## 11. Parcours d'entrée et fondation

Les écrans précédant la partie complète ne sont pas rendus dans `AppShell` :

1. `AuthenticationPage` reçoit uniquement le callback d'authentification ;
2. `OnboardingPage` déduit l'étape depuis l'offre autoritaire ;
3. `CityCreationStep` prépare le nom et demande l'offre de cinq novices ;
4. `FounderSelectionStep` conserve localement les deux sélections et les noms ;
5. la confirmation transmet uniquement les couples `{ id, name }` à `App`.

`heroCandidatePresentation` prépare le résumé canonique commun aux candidats de
fondation et de recrutement. `onboardingPresentation` ajoute les suggestions de
nom et la sélection minimale ; `recruitmentPresentation` ajoute le coût issu de
la règle de domaine partagée. Cette même règle fournit au backend le coût, la
capacité et la priorité des refus pour la création de l'offre, sa confirmation
et le recrutement direct ; les handlers ne les recalculent pas. Les
composants n'importent ni Supabase ni le
transport canonique. Les
saisies locales restent disponibles en mode observateur, tandis que les deux
commandes autoritaires sont verrouillées. Le parcours conserve l'action de
transfert du contrôle sans réintroduire la navigation du jeu. Les réussites de
fondation sont routées explicitement dans l'historique Cité.

Le recrutement normal est rendu par `RecruitmentOfferDialog`, chargé à la
demande. `App` lui transmet seulement le candidat, l'état d'autorité et les
callbacks ; la projection des attributs et le calcul du coût ne sont plus dans
la racine. L'offre reste consultable en mode observateur, mais ses commandes
sont verrouillées. La modale capture et restaure le focus, boucle la navigation
au clavier, accepte `Échap` lorsque l'annulation est autorisée et devient
scrollable sur un viewport peu haut.

## 12. Hors périmètre du ticket

- recommandation automatique du prochain bâtiment ;
- nouvelle règle de gameplay ou nouveau contrat persistant ;
- carte interactive, masque ou variante graphique par niveau ;
- bibliothèque UI générique construite sans consommateur réel ;
- décomposition supplémentaire des cas d'usage et runtimes encore orchestrés
  par `App.tsx`, sans rapport direct avec la structure des écrans de CDI-069.
