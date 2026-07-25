---
id: CDI-057
title: Parite Ville autoritaire
status: Done
area: vertical
priority: P1
size: L
risk: high
source: Audit fonctionnel Ville Git et documentation du 2026-07-25
depends_on: ["CDI-025", "CDI-030"]
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/town-authoritative-parity-audit.md", "docs/architecture/town-domain.md", "docs/development/cdi-051-authoritative-ui-validation.md"]
---

# CDI-057 - Parite Ville autoritaire

## Objectif

Restaurer le fonctionnel historique valide de la Ville dans l'autorite serveur,
fermer les contournements de progression et raccorder l'affichage actif a un
etat canonique rafraichi.

## Resultat utilisateur

Les batiments, citoyens, ressources et retours idle respectent les memes
regles sur l'interface et le serveur, persistent apres rechargement et ne
peuvent pas etre contournes par une commande directe.

## Contexte

L'audit compare au comportement Git `640f89f` a revele des invariants citoyens
contournables, des prerequis d'etage absents du serveur, des districts
incoherents et une progression active non rafraichie. CDI-057 corrige ces
ecarts avant la reprise de CDI-051.

## Decisions fonctionnelles

- Le Campement ajoute un emplacement de heros par niveau, en plus des deux
  emplacements initiaux.
- Les districts sont entierement desactives dans cette version en attente de
  leur refonte. Leurs donnees persistees sont conservees mais restent inertes.
- Les mutations actives restent exclusivement autoritaires.

## Perimetre autorise

- Interdire toute allocation vers le role `unassigned`.
- Valider strictement ressources, batiments, citoyens et invariants de
  population avant toute transition.
- Appliquer cote serveur les prerequis de batiment et d'etage.
- Centraliser les regles de batiment reutilisees par le serveur.
- Desactiver l'interface, la commande et les bonus de district.
- Rafraichir periodiquement l'etat canonique sans mutation locale.
- Projeter visuellement la production chaque seconde entre deux snapshots,
  sans utiliser cette projection pour autoriser une mutation.
- Afficher un rapport utile apres une absence significative.
- Journaliser les evenements Ville retournes par l'autorite.
- Repasser un heros entierement retabli de `resting` a `idle`.
- Recuperer uniformement 2 % des PV max et 2 % des PM max par seconde ; les
  bonus raciaux non contractualises sont differes avec les races concernees.
- Appliquer le snapshot canonique retourne par la reinitialisation.
- Replacer la vue en haut sur la creation de cite apres reinitialisation.
- Conserver l'onglet courant lors d'un `F5` dans la session navigateur.
- Supprimer les anciens handlers locaux Ville devenus inaccessibles.
- Supprimer les moteurs locaux Ville/idle dupliquant l'autorite et inutilises
  par le runtime.
- Ajouter les tests de parite, refus, invariants, idle et UI utiles.
- Corriger la documentation issue des anciens audits.

## Hors perimetre

- Concevoir les nouveaux districts, leurs couts ou leurs bonus.
- Ajouter une file de commandes offline.
- Modifier les couts ou niveaux maximums historiques des batiments.
- Modifier le schema RNG ou le donjon.

## Contrat d'implementation

- Toute progression visible provient d'un snapshot `game-api`.
- Une commande refusee ne modifie ni etat, ni revision, ni cache.
- La somme des allocations reste egale au total de citoyens.
- Les couts, maximums et prerequis de batiment ont une source partagee.
- Les donnees Districts sont compatibles en lecture mais sans effet.

## Dependances

CDI-057 depend des socles Ville CDI-025 et idle CDI-030, et bloque la cloture
de l'integration UI CDI-051.

## Criteres d'acceptation

- [x] `citizens.allocate` refuse `unassigned` et conserve toujours le total.
- [x] Un etat Ville incoherent est refuse avant mutation.
- [x] Tous les prerequis d'etage sont appliques par le serveur.
- [x] Les couts et niveaux maximums serveur utilisent le catalogue partage.
- [x] Les districts sont absents de l'UI, refuses par l'API et sans bonus idle.
- [x] Le Campement affiche et applique un emplacement par niveau.
- [x] Les ressources et l'immigration visibles suivent un rafraichissement
      canonique periodique.
- [x] La production affichee progresse chaque seconde sans modifier le
      snapshot canonique ni les controles de depense.
- [x] La barre d'immigration progresse chaque seconde, atteint 100 %, puis
      presente le nouveau citoyen avant reconciliation serveur.
- [x] Les jauges d'un heros au repos progressent chaque seconde et presentent
      `idle` a recuperation complete sans mutation canonique locale.
- [x] Le retour apres absence presente le rapport idle utile.
- [x] Les evenements batiment et citoyens alimentent le journal Ville.
- [x] La fin de recuperation remet le heros a `idle` et est distinguee d'un
      soin partiel dans le rapport.
- [x] La reinitialisation applique le snapshot et la revision serveur.
- [x] La reinitialisation replace la vue en haut de l'ecran de creation.
- [x] Un `F5` restaure l'onglet Ville, Heros, Donjon, Coffre ou Compte actif.
- [x] Aucun ancien handler local ne permet de contourner `game-api`.
- [x] Tests cibles, suite complete, typecheck, build et Workboard passent.
- [x] Le parcours navigateur Ville confirme commandes, revisions et F5.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/townAuthority.test.ts tests/townParity.test.ts tests/idleAuthority.test.ts tests/idleReport.test.ts tests/townHeartbeat.test.ts tests/townEventLog.test.ts tests/catalogValidation.test.ts tests/TownPanel.test.tsx`
- `npm.cmd test -- --run`
- `npm.cmd run test:coverage` puis `npm.cmd run check:coverage`
- `npm.cmd run check:determinism`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run board:validate`

## Validation manuelle

Avec une session authentifiee : ameliorer un batiment, affecter puis retirer
un citoyen, attendre un rafraichissement canonique, recharger et verifier
ressources, population, revision et absence des districts.

## Preservation

- Conserver les couts, plafonds, identifiants et prerequis historiques valides.
- Conserver les donnees de district existantes sans les appliquer.
- Conserver cache offline, revisions, idempotence et erreurs structurees.

## Risques

- Une validation trop permissive laisserait persister un etat impossible.
- Une validation trop stricte pourrait refuser une ancienne sauvegarde valide.
- Un rafraichissement trop frequent augmenterait inutilement les ecritures.

## Handoff

Implementation et preuves automatiques terminees le 2026-07-25 : typecheck,
tests Ville/idle cibles, 209 tests complets, seuils de couverture,
determinisme, build, budget bundle et Workboard passent. Le lint ne porte
aucune erreur ; ses 50 avertissements historiques hors perimetre restent
traces par la sortie de validation. Les anciens moteurs locaux `town.ts` et
`idle.ts`, le catalogue District et les handlers UI associes ont ete prunes.

La seconde passe d'audit a aussi ferme les maps initiales partielles, la borne
de progression citoyenne, les ressources inconnues, le statut de fin de repos,
la distinction soin/recuperation complete, les logs Ville et l'application du
snapshot `/reset`. `hero.recruit` direct reste uniquement pour compatibilite
du contrat ; l'UI utilise offre/confirmation.

## Preuve navigateur locale du 2026-07-25

- amelioration de batiment : `/commands` 200, revision 44, niveau +1,
  ressources persistees apres `F5` et evenement visible dans le journal ;
- affectation citoyenne : revision 45, profession +1, total invariant,
  evenement visible, retrait puis persistance confirmes ;
- projection de production : nourriture actualisee chaque seconde ;
  reconciliation `/bootstrap` 200 a la revision 51, valeur 580 avant/apres,
  sans saut ni double production ;
- immigration : capacite 3/6 puis remplissage, nouvelle capacite 6/9, barre
  animee jusqu'a 100 %, nouveau citoyen et reconciliation sans ecart ;
- repos : projection PV/PM visible chaque seconde a 2 % des maxima, soin
  canonique au bootstrap, statut `idle`, journal et persistance apres `F5` ;
- aucun onglet, bouton ou panneau District visible.
- reset destructif : `/reset` 200, revision augmentee, ressources, citoyens,
  habitation, heros et RNG revenus aux valeurs initiales ; session Google
  conservee, vue replacee en haut, ecran de creation et snapshot initial
  identiques apres `F5` ;
- onglet actif conserve et restaure apres `F5` dans la meme session navigateur.

CDI-057 ne conserve plus de critere ouvert.
