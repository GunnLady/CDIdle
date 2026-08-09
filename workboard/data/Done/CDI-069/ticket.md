---
id: CDI-069
title: Cadrer l architecture UI UX et le tableau de bord de la Cite
status: Done
area: frontend
priority: P1
size: L
risk: medium
source: Retour utilisateur du 2026-07-30 apres deploiement de l alpha
depends_on: ["CDI-068"]
blocks: ["CDI-076", "CDI-089"]
github_issue: null
related_docs: ["docs/architecture/cdi-069-ui-ux-audit.md", "docs/architecture/cdi-069-interface-architecture.md", "docs/architecture/hero-domain.md", "src/App.tsx", "src/components/app-shell/AppShell.tsx", "src/components/city/CityDashboard.tsx", "src/domain/cityPresentation.ts", "assets/design/cdi-069/manifest.json"]
---

# CDI-069 - Cadrer l architecture UI UX et le tableau de bord de la Cite

## Objectif

Définir l'architecture logicielle et l'architecture de l'information de la
refonte avant de construire le design system. Le premier écran de référence est
la Cité : une page de gestion persistante et lisible, sans navigation imbriquée,
qui réutilise l'état canonique et les commandes existantes.

## Resultat utilisateur

Le joueur se déplace entre quatre destinations de jeu — Cité, Aventuriers,
Donjon et Coffre — et accède à Compte depuis un bouton dédié du header. Sur la
Cité, sans changer de sous-vue, il retrouve le bâtiment sélectionné, la liste
des bâtiments et les affectations.

## Contexte

L'alpha est fonctionnelle mais accumule des menus et des vues secondaires. Dans
`TownPanel`, Population, Infrastructures et Forge sont trois sous-onglets alors
qu'ils appartiennent au même parcours de gestion. La maquette validée confirme
une direction plus directe : un shell global ornemental et des pages en
maître/détail.

Les contrats existants suffisent pour le premier lot : niveaux des bâtiments,
citoyens, ressources, commandes `building.upgrade` et `citizens.allocate` et
flux de forge.

## Decisions validees

- Une seule navigation principale de jeu : Cité, Aventuriers, Donjon et Coffre.
  Compte est accessible depuis le bouton dédié du header.
- Un bandeau d'expédition suit étage, salle, état et groupe depuis Cité,
  Aventuriers, Coffre et Compte. Il est absent de Donjon, qui porte déjà ces
  informations.
- Le header ornemental affiche les ressources avec du texte HTML accessible ;
  les valeurs ne sont jamais intégrées au bitmap.
- La Cité abandonne les sous-onglets Population, Infrastructures et Forge.
- La page Cité contient trois zones persistantes : Bâtiment sélectionné,
  Bâtiments et Affectations. Sur desktop, leurs proportions sont `1,35 | 1 | 1`
  et leurs hauteurs sont alignées.
- Le clic sur un bâtiment met à jour la zone de détail sans changer de page.
- La Forge devient le contenu contextuel du bâtiment Forge, pas une destination
  ou un sous-onglet supplémentaire.
- Le libellé par défaut est `Bâtiment sélectionné`. `Prochaine décision` ne sera
  utilisé que si une recommandation déterministe, documentée et testée existe.
- La sélection est un état local de présentation. Les niveaux, coûts,
  prérequis, ressources et commandes restent canoniques.
- La navigation principale contient quatre destinations de jeu. Compte reste
  une page accessible par un bouton permanent du header.
- Sur desktop, navigation et suivi du Donjon forment une seule barre persistante
  ; sur mobile, ils restent empilés. Le suivi expose PV et mana du groupe.
- Le Grimoire développeur est replié et flottant, hors du flux de page.
- Coffre et Aventuriers partagent une décision d'équipement montrant héros,
  objet actuel, nouvel objet, effets et statistiques avant/après.
- `hero.equip` remplace atomiquement un objet déjà équipé et restitue l'ancien
  au Coffre ; une erreur ne laisse aucun état intermédiaire.
- Aventuriers et Donjon partagent une gestion complète des quatre places du
  groupe, avec héros actifs, réservistes, santé, statut et ajout/retrait.
- La scène complète du village reste une référence artistique. Elle n'est plus
  une surface interactive et aucun masque ou détourage n'est requis.
- Aventuriers, Donjon et Coffre suivent un principe maître/détail adapté à leur
  objet principal ; Compte reste une page de sections sans sélection forcée.
- La structure des cinq pages est fixée avant l'implémentation du shell, même si
  leur migration est réalisée par lots.

## Structure des pages

| Page | Zones persistantes | État local de présentation |
| --- | --- | --- |
| Cité | bâtiment sélectionné, affectations, bâtiments | `selectedBuildingId` |
| Aventuriers | expédition, roster/recrutement, héros, compétences, équipement | `selectedHeroId`, sélecteur d'équipement |
| Donjon | progression/commande, rencontre, gestion du groupe, historique | héros sélectionné, filtre, confirmations |
| Coffre | résumé, recherche/filtres, inventaire, décision d'équipement | `selectedItemInstanceId`, filtres, tri, cible d'équipement |
| Compte | identité/session, synchronisation, résumé, zone dangereuse | confirmations uniquement |

Ordre mobile :

- Cité : bâtiment, bâtiments, affectations ;
- Aventuriers : expédition, roster, héros, équipement, compétences ;
- Donjon : progression, rencontre, action, groupe, historique ;
- Coffre : résumé/recherche, inventaire, détail ;
- Compte : identité, synchronisation, résumé, zone dangereuse.

Une sélection locale ne déclenche aucune commande. Les listes, panneaux
repliables et dialogues restent des modes de consultation ou de décision, pas
des destinations supplémentaires.

## Architecture logicielle cible

```text
App
└─ AppShell
   ├─ ResourceHeader
   │  └─ Accès Compte
   ├─ PrimaryNavigation
   ├─ DungeonProgressBanner (hors page Donjon)
   ├─ CanonicalStatusLayer
   └─ PageViewport
      └─ CityDashboard
         ├─ SelectedBuildingPanel
         ├─ AssignmentPanel
         └─ BuildingListPanel
```

Les autres pages appliquent la même frontière : composition d'écran, sélection
locale éventuelle, panneaux de présentation et callbacks canoniques. Leur
structure détaillée est normative dans
`docs/architecture/cdi-069-interface-architecture.md`.

- `App` conserve l'orchestration des runtimes et transmet des données et
  callbacks typés.
- `AppShell` porte uniquement le cadre commun, la navigation, le responsive et
  les retours transverses.
- `CityDashboard` compose la page et possède seulement l'identifiant du
  bâtiment sélectionné.
- Les panneaux de présentation ignorent la file optimiste, Supabase et les
  règles de calcul ; ils reçoivent des vues préparées et des callbacks.
- Les règles de disponibilité et les conséquences des commandes restent dans
  les projections, hooks et domaines existants.
- `createForgeWorkspaceView` prépare la vue Forge ; `ForgeWorkspace` ne possède
  aucune règle de coût, rareté ou compatibilité de modificateur.
- Les primitives communes sont extraites depuis ce premier écran réel, puis
  généralisées dans CDI-076. Aucun composant générique n'est créé par avance.

## Premier lot d implementation propose

1. Extraire le shell visuel de `App.tsx` sans déplacer les runtimes.
2. Mettre en place le header ressources et la navigation principale.
3. Ajouter le bandeau d'expédition sur les quatre pages hors Donjon.
4. Remplacer les trois sous-onglets de `TownPanel` par `CityDashboard`.
5. Brancher sélection, amélioration, affectation et forge contextuelle sur les
   données et commandes existantes.
6. Vérifier le responsive, le clavier, les états verrouillés, hors ligne,
   observateur et restauration autoritaire.
7. Identifier les primitives réellement répétées qui alimenteront CDI-076.

## Perimetre autorise

- Cadrage du shell, de la navigation, de la composition Cité et de leurs
  responsabilités logicielles.
- Versionnement des références visuelles validées et de leur contrat d'usage.
- Inventaire des données, commandes et composants existants à réutiliser.
- Définition du responsive et de l'accessibilité du premier lot.
- Découpage de l'implémentation en composants testables sans modifier le
  contrat canonique.
- Préparation des critères de preuve fonctionnelle et visuelle.

## Hors perimetre

- Implémenter la refonte avant validation du présent cadrage.
- Modifier une règle de jeu, un coût, un prérequis ou le contrat persistant.
- Créer un moteur arbitraire de recommandation de bâtiment.
- Rendre la ville interactive par zones d'image, masques ou détourage.
- Générer des variantes visuelles par niveau de bâtiment.
- Migrer Aventuriers, Donjon, Coffre ou Compte dans le premier lot Cité.
- Installer Carbon React ou publier une bibliothèque UI générique.
- Réécrire mécaniquement tout le CSS ou tous les composants.

## Contrat d'implementation

- Chaque étape maintient le jeu fonctionnel et l'autorité serveur intacte.
- La sélection d'un bâtiment ne produit aucune commande réseau.
- Les actions existantes conservent leur enveloppe, leur idempotence, leur
  projection optimiste et leur restauration en cas d'échec.
- La transition `hero.equip` peut remplacer l'objet de l'emplacement cible dans
  la même commande ; l'ancien objet et toute main gauche déplacée sont restitués
  sans duplication.
- La comparaison d'équipement utilise une projection pure alignée sur la
  transition autoritaire, jamais un calcul divergent dans le composant.
- `DungeonPartyManager` affiche la projection des quatre places actives sans
  posséder la limite canonique ; le roster porte `hero.activity` et les raisons
  de refus.
- `DungeonProgressBanner` projette l'état existant sans polling, minuterie ou
  progression locale indépendante et n'est pas rendu sur la page Donjon.
- La Forge conserve son flux séquentiel et ses confirmations existantes ; seul
  son emplacement dans l'interface change.
- Les ressources sont des éléments DOM lisibles, sélectionnables et annoncés.
- Le header décoratif possède un fallback CSS et ne bloque jamais l'interface.
- Les états actif, verrouillé, désactivé, chargement, erreur, hors ligne et
  observateur ne reposent pas uniquement sur la couleur.
- Le responsive réorganise les panneaux ; il ne duplique pas leurs données ni
  leur logique.

## Dependances

CDI-068 reste la dépendance fonctionnelle. CDI-069 fixe l'architecture écran
avant CDI-076, qui extraira les fondations et composants communs prouvés par la
première migration.

## Criteres d'acceptation

- [x] Les frictions principales et la dette structurelle sont inventoriées.
- [x] La navigation de jeu à quatre destinations et l'accès Compte dans le
      header sont validés.
- [x] La maquette de composition du shell et de la Cité est versionnée.
- [x] L'architecture Cité à trois zones persistantes est définie.
- [x] Les responsabilités de `App`, `AppShell`, `CityDashboard` et des panneaux
      sont distinguées.
- [x] Les données et commandes existantes à réutiliser sont identifiées.
- [x] Les masques, le détourage et la carte interactive sont retirés de
      l'architecture active.
- [x] La Forge est définie comme contenu contextuel du bâtiment Forge.
- [x] La règle du libellé `Bâtiment sélectionné` est explicite.
- [x] La structure desktop et mobile des cinq pages est définie.
- [x] Les sélections locales et les commandes canoniques sont distinguées pour
      chaque page.
- [x] Les exceptions au maître/détail, notamment Compte, sont explicites.
- [x] Le bandeau d'expédition global et son exception sur Donjon sont définis.
- [x] La décision d'équipement contextualisée est définie pour Coffre et héros.
- [x] La gestion du groupe est définie pour Aventuriers et Donjon.
- [x] Le remplacement atomique d'un équipement est retenu sans état
      intermédiaire client.
- [x] Responsive et accessibilité possèdent des critères mesurables.
- [x] Le cadrage consolidé est validé par l'utilisateur avant développement.
- [x] Le premier lot Cité est implémenté et couvert par des tests ciblés.
- [x] La preuve utilisateur desktop et mobile confirme la hiérarchie et l'absence de
      navigation imbriquée.
- [x] Le sous-lot Aventuriers remplace les fiches répétées et leurs sous-onglets
      par Expédition, Roster, Héros sélectionné, Équipement et Compétences.
- [x] La preuve utilisateur desktop et mobile valide la hiérarchie du sous-lot
      Aventuriers et l'accès aux actions de groupe.
- [x] Le sous-lot Donjon sépare progression, rencontre, gestion du groupe et
      historique sans réintroduire de sous-navigation.
- [x] Le sous-lot Coffre sépare résumé, filtres, inventaire et décision
      d'équipement contextualisée.
- [x] Le sous-lot Compte sépare identité, synchronisation, résumé, historique
      système et zone dangereuse ; les runtimes d'authentification restent dans
      `App`.
- [x] Les historiques Cité, Donjon et Système disposent chacun d'une rétention
      indépendante de 25 entrées.
- [x] La preuve responsive autonome des cinq pages passe après la migration du
      Compte et l'ajout de la frontière desktop à 1280 px.

## Tests

Pendant le cadrage :

- `npm.cmd run board:validate`
- `python .agents/skills/cdidle-visual-production/scripts/validate_visual_manifest.py --manifest assets/design/cdi-069/manifest.json`
- recherche des décisions contradictoires sur les masques et sous-onglets.

Pendant le premier lot :

- tests unitaires des projections de présentation et de la sélection ;
- tests de comparaison d'équipement, remplacement occupé, arme à deux mains et
  restitution de la main gauche ;
- tests du gestionnaire de groupe à 0/4, 4/4, héros blessé et ajout/retrait ;
- test du bandeau sur quatre pages et de son absence sur Donjon ;
- tests de structure et d'ordre responsive pour chaque page lors de son lot ;
- tests composants des actions amélioration, affectation et forge ;
- test du flux autoritaire avec restauration après échec ;
- contrôle clavier et responsive à 360, 768, 1024, 1280 et 1440 px ;
- simulation autonome sans Supabase : `npm.cmd run test:layout-browser` ;
- `npm.cmd run typecheck`, `npm.cmd run lint`, tests ciblés, build et budget
  bundle selon les règles du projet.

Preuve rapportée par l'utilisateur le 2026-08-08 : le script alors nommé
`test:city-browser` (désormais généralisé en `test:layout-browser`) passe avec
5 tests sur 5 en 4,8 s.

Preuve rapportée par l'utilisateur le 2026-08-08 :
`test:layout-browser` passe avec 10 tests sur 10 en 7,8 s après l'ajout du
sous-lot Aventuriers.

Contrôle structurel Codex du 2026-08-08 : remplacement occupé atomique aligné
entre projection optimiste et autorité serveur, comparaison avant/après,
restitution de la main gauche, projections React externalisées et cycle clavier
de la modale couverts par 73 tests ciblés. La suite complète passe ensuite avec
88 fichiers et 674 tests ; TypeScript, ESLint et le validateur Workboard sont
également conformes.

Contrôle structurel Codex du 2026-08-08 après migration des cinq pages :
TypeScript, ESLint, Workboard et `git diff --check` conformes ; 67 tests ciblés
passent. La preuve `test:layout-browser` compte désormais 30 scénarios.

Preuve rapportée par l'utilisateur le 2026-08-08 :
`test:layout-browser` passe avec 30 tests sur 30 en 16,3 s sur les cinq pages.

Correction de l'audit structurel du 2026-08-08 : le reset de récupération reste
disponible lorsqu'une sauvegarde incompatible verrouille les mutations de jeu ;
les conteneurs de pages ne déclarent plus à tort leurs consultations locales
comme désactivées ; la limite d'équipe active est partagée jusque dans les
handlers autoritaires ; la documentation reflète les composants et les cinq
zones réelles de Compte. TypeScript, ESLint et 75 tests ciblés confirment ces
corrections, dont la reprise du leadership après restauration du transport.

Sous-lot d'entrée et fondation du 2026-08-08 : l'ancien `LoginPage` de 504 lignes
est remplacé par `AuthenticationPage`, `OnboardingPage`, `CityCreationStep`,
`FounderSelectionStep` et `FounderCandidateCard`. Les composants reçoivent des
callbacks typés, les cartes utilisent `onboardingPresentation`, les deux héros
sont confirmés sous forme minimale `{ id, name }`, les sélections locales
survivent aux projections équivalentes et les événements de fondation vont
explicitement dans l'historique Cité. La seconde porte d'authentification morte
du Compte est supprimée. TypeScript, ESLint et 23 tests ciblés sont conformes ;
un harness responsive autonome couvre Connexion, Cité et Fondateurs.

Les cartes de fondateurs réutilisent le sprite `HeroPortrait` déterministe. Toute
la surface de carte sélectionne ou désélectionne le héros au pointeur et au
clavier ; le champ de nom reste un contrôle indépendant. Les preuves responsive
couvrent désormais 360, 768, 1024, 1280 et 1440 px, et vérifient que le renommage
ne modifie pas la sélection.

Le dernier écart P3 est corrigé : le recrutement normal est extrait dans
`RecruitmentOfferDialog`. Sa présentation s'appuie, comme l'onboarding, sur
`heroCandidatePresentation`, tandis que `recruitmentPresentation` projette le
coût partagé du domaine. `App.tsx` ne calcule plus les attributs, le genre ou le
coût de l'offre et conserve uniquement les callbacks d'orchestration. Les tests
unitaires couvrent l'offre, la lecture seule et le fallback de genre cohérent.

Contrôle complémentaire du 2026-08-09 : le backend utilise désormais la même
éligibilité partagée que la présentation pour le coût, la capacité et la
priorité des erreurs, dès la création de l'offre. La modale de recrutement enferme le focus, restaure le
contrôle précédent, accepte `Échap` et scrolle sur viewport court. La lecture
seule des Fondateurs est prouvée sans commande canonique, le fallback historique
de 20 PM reste limité à l'offre de recrutement et le test d'authentification
porte maintenant le nom du composant réel.

Le premier lancement du pipeline navigateur réel a atteint les cinq candidats,
leurs portraits et deux sélections, puis a révélé un sélecteur sensible à la
casse sur le bouton final. Le libellé fonctionnel était présent et actif ; le
test utilise désormais son nom accessible sans dépendre de la casse.

## Validation manuelle

Preuve rapportée par l'utilisateur le 2026-08-09 : l'ensemble du périmètre
visuel de CDI-069 a été contrôlé sur une partie réelle et validé sans écart,
notamment le parcours d'entrée ainsi que les écrans Cité, Aventuriers, Donjon,
Coffre et Compte. Cette validation couvre la composition, les actions, les
états visibles et le comportement responsive attendus du ticket.

## Audit fonctionnel pré-push du 2026-08-09

L'audit complet des objectifs, des frontières React/présentation/domaine, de
l'orchestration canonique et de la parité frontend/backend ne relève aucune
régression fonctionnelle. Deux écarts de cohérence restent ouverts avant
clôture :

- [x] P2 — extraire la projection du `DungeonProgressBanner` hors du composant
      React et la partager avec `dungeonPresentation`, puis prouver la parité du
      statut, de la progression et des quatre places du groupe.
- [x] P3 — documenter l'exception de récupération d'une sauvegarde incompatible :
      les actions dangereuses restent accessibles après chargement de session
      lorsque l'état canonique est rejeté, même si le transport canonique et le
      leadership ne peuvent pas être établis.

Preuves de l'audit : TypeScript, ESLint, déterminisme, `git diff --check` et
Workboard conformes ; 96 fichiers Vitest et 717 tests réussis. Les preuves
navigateur, build et bundle restent celles rapportées par l'utilisateur le
2026-08-09 ; la couverture n'a pas été rejouée.

Corrections de l'audit : `DungeonProgressBanner` reçoit désormais une vue pure
préparée par `App`, fondée sur la même projection de salle que Donjon ; le
composant ne calcule plus statut, groupe ni pourcentages. Le contrat Compte
documente l'exception de récupération exactement comme
`canUseAccountDangerActions` et ses tests. Quatre fichiers de tests ciblés et
20 tests passent ; TypeScript et ESLint sont conformes. Après correction, la
suite complète passe avec 96 fichiers et 718 tests ; déterminisme,
`git diff --check` et Workboard restent conformes.

## Preservation

- Préserver les comportements et contrats canoniques validés.
- Préserver toutes les informations utiles actuellement disponibles.
- Préserver le chargement différé des cinq pages.
- Conserver les références visuelles validées sans en faire une dépendance
  fonctionnelle du domaine.

## Risques

- Recréer des sous-menus dans les panneaux annulerait le gain de navigation.
- Extraire trop tôt des composants génériques déplacerait la complexité au lieu
  de la réduire.
- Mélanger sélection locale et état canonique introduirait des commandes ou
  sauvegardes inutiles.
- L'ornement peut réduire la lisibilité si les valeurs ne restent pas en DOM.
- Une Forge simplement déplacée sans préserver son flux peut régresser les
  confirmations et états intermédiaires.

## Handoff

Fournir l'architecture validée, la référence de composition, le contrat des
assets, la cartographie des données et commandes réutilisées, le découpage du
premier lot, les critères responsive/accessibilité et les preuves de validation.
