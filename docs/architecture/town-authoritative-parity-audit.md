# Audit et correction de parite Ville autoritaire — CDI-057

Date : 2026-07-25

## References comparees

- comportement historique Git `640f89f` et `useTownSystem` ;
- catalogue `src/data/buildings.ts` ;
- plan `docs/fullstack-authoritative-plan.md` ;
- implementations CDI-010, CDI-016, CDI-025, CDI-030 et CDI-051 ;
- autorites Edge Ville et idle.

## Ecarts confirmes

1. Le contrat autorisait `unassigned` comme cible de `citizens.allocate`. Une
   commande negative pouvait creer des citoyens libres sans modifier le total.
2. Les prerequis d'etage existaient dans le fonctionnel historique et l'UI,
   mais pas dans l'autorite serveur introduite par `8bbf8aa`.
3. Les districts historiques etaient incoherents : `quartier_foret` etait lu
   sous `quartier_bois`, son bonus documente de 25 % devenait 20 %, et le bonus
   pierre n'etait jamais applique.
4. Les anciens handlers React conservaient des mutations locales devenues
   inaccessibles mais contraires au contrat autoritaire.
5. Sans commande ni rechargement, la Ville visible ne recevait plus la
   progression appliquee par l'horloge serveur.
6. Le rapport idle etait retourne par l'API mais ignore par l'interface.
7. Le libelle Campement annoncait deux emplacements par niveau alors que le
   comportement historique, le domaine, l'UI et le serveur en accordaient un.

## Decisions

- Campement : deux emplacements initiaux, puis un emplacement par niveau.
- Districts : fonctionnalite integralement desactivee jusqu'a sa refonte.
  Les donnees existantes restent dans les sauvegardes mais sont inertes.
- Rafraichissement actif : bootstrap autoritaire toutes les trente secondes,
  serialise dans la meme file que les commandes et suspendu lorsque l'onglet
  navigateur est masque.
- Rapport de retour : presente a partir de 60 secondes ou lorsqu'il contient
  un citoyen, une recuperation de heros ou du temps hors plafond.

## Corrections

- union de roles limitee aux quatre professions productives ;
- validation stricte des ressources, batiments, allocations, total et
  capacite d'habitation avant toute transition ;
- couts, maximums et prerequis lus depuis le catalogue partage ;
- controle serveur des etages requis ;
- commande `district.unlock` refusee avec `DISTRICTS_DISABLED` ;
- onglet, props, handlers et bonus Districts supprimes des chemins actifs ;
- anciens timers et mutations Ville React supprimes ;
- heartbeat canonique et resume idle ajoutes ;
- libelle Campement corrige.

## Seconde passe d'audit

La revue finale a ferme les oublis suivants :

- `citizenGrowthProgress` est limite a un entier de 0 a 99 et les cles de
  ressource inconnues sont refusees ;
- la liste initiale des batiments provient du catalogue complet, y compris les
  batiments sans niveau initial explicite ;
- le metadata du Campement indique maintenant un emplacement par niveau et un
  test couvre la capacite `2 + niveau` ;
- un heros au repos repasse a l'etat `idle` des que ses PV et PM sont pleins ;
- le rapport distingue un heros partiellement soigne d'un heros entierement
  retabli ;
- le heartbeat ne tourne que si production, immigration ou recuperation peut
  effectivement modifier l'etat ;
- les evenements canoniques d'amelioration et d'affectation alimentent le
  journal Ville ;
- une reinitialisation applique le snapshot retourne par `/reset` au lieu de
  reconstruire localement un etat concurrent.
- la production n'est plus affichee par bonds de trente secondes : une
  projection pure actualise les compteurs chaque seconde, tandis que les
  depenses restent basees sur le snapshot canonique et que le heartbeat
  reconcilie l'affichage toutes les trente secondes.
- la barre d'immigration utilise la meme projection : elle progresse chaque
  seconde, presente explicitement 100 %, puis affiche le nouveau citoyen sans
  anticiper de mutation canonique.
- les jauges PV/PM des heros au repos suivent egalement une projection
  visuelle a la seconde et presentent `idle` a recuperation complete ; le
  snapshot serveur reste l'unique etat persiste.
- la vitesse de repos est remplacee par 2 % des PV max et 2 % des PM max par
  seconde. L'ancien bonus Homme-Lezard, code en dur mais non documente, est
  retire jusqu'a l'implementation future de cette race.

La commande directe historique `hero.recruit` reste acceptee pour compatibilite
du contrat public. Le parcours UI utilise seulement `hero.recruit_offer` puis
`hero.recruit_confirm`. La suppression du chemin direct exige une decision de
versionnement distincte ; elle n'est pas necessaire a la parite Ville active.

## Compatibilite

Le champ canonique `districts` est conserve. Le supprimer casserait les
sauvegardes existantes et anticiperait la refonte. Ses valeurs booleennes sont
validees mais elles ne modifient aucun taux ni aucune interface.

## Validation attendue

- tests exhaustifs de cout par niveau et batiment ;
- tests de tous les prerequis d'etage ;
- tests d'invariants citoyens et de refus `unassigned` ;
- tests d'inertie et de refus des districts ;
- migration profonde des anciennes maps partielles de ressources, bâtiments
  et citoyens sans masquer une valeur corrompue ;
- heartbeat suspendu lorsque ni production, ni immigration, ni récupération
  de héros ne peut faire progresser l'état ;
- tests idle, rapport et rendu UI ;
- typecheck, suite complete, build, Workboard ;
- preuve navigateur authentifiee avant cloture.

## Preuve navigateur locale

Le 2026-07-25, le parcours authentifie a confirme : commandes batiment et
citoyens en 200, revisions 44/45, logs Ville et persistance apres `F5` ;
production projetee chaque seconde puis bootstrap 200 revision 51 sans saut a
580 nourriture ; immigration animee de 3/6 a pleine capacite puis de 6/9 avec
barre a 100 % ; repos anime a 2 % des maxima puis statut `idle`, journal et
persistance ; absence complete des controles District.

La reinitialisation navigateur a ensuite ete autorisee et executee : `/reset`
200, revision augmentee, etat initial complet renvoye, session Google
conservee, retour a la creation de cite puis snapshot strictement identique
apres `F5`.
La vue est egalement replacee en haut apres le reset afin d'afficher
immediatement la selection du nom du royaume.
L'onglet d'interface courant est conserve dans `sessionStorage` afin qu'un
`F5` restaure la vue Ville, Heros, Donjon, Coffre ou Compte sans ajouter cette
preference a l'etat de jeu canonique.

## Rectification temporelle CDI-061

Le heartbeat CDI-057 ne fournit plus son propre point de départ temporel avec
`Date.now()`. Chaque bootstrap ou commande renvoie désormais `serverTime` et
`lastProcessedAt` depuis PostgreSQL. La Ville projette leur reliquat avec
`performance.now()`, sans autoriser de mutation locale, puis se recale au
snapshot suivant. Le commit idle autonome incrémente la révision et compare
simultanément l'ancienne révision et l'ancien timestamp.
