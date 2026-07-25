---
id: CDI-051
title: Raccordement UI aux commandes autoritaires
status: Paused
area: integration
priority: P1
size: L
risk: high
source: Audit Eclipse CDI-037 du 2026-07-23
depends_on: ["CDI-023", "CDI-025", "CDI-026", "CDI-027", "CDI-028", "CDI-029", "CDI-031", "CDI-041", "CDI-052", "CDI-053", "CDI-054"]
blocks: ["CDI-045", "CDI-046", "CDI-048", "CDI-049"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/api-command-contracts.md", "docs/architecture/game-api-followups.md", "docs/development/cdi-051-authoritative-ui-validation.md", "src/App.tsx", "src/lib/supabase.ts"]
---

# CDI-051 — Raccordement UI aux commandes autoritaires

## Objectif

Raccorder les actions ville, heros, inventaire, forge et donjon du front aux
commandes typees de `game-api`, puis appliquer uniquement l etat canonique
retourne par le serveur.

## Resultat utilisateur

Les actions visibles sont validees par le serveur, persistent apres rechargement
et ne divergent pas entre cache local, interface et partie canonique.

## Contexte

Le client appelle actuellement `bootstrap` et `reset`, mais aucune mutation UI
n appelle `/commands`. Les hooks locaux continuent donc de produire les
mutations visibles malgre les autorites serveur deja livrees.

La validation navigateur du 2026-07-24 a aussi identifie puis fait corriger une regression :
les heros crees par l onboarding autoritaire ne conservaient plus leur profil
affiche complet : statistiques, statut elite, competences et equipement.
CDI-053 a restaure ce profil complet et sa persistance avant la reprise de
CDI-051.

L audit de parite du 2026-07-24 a ensuite identifie la resolution serveur
simplifiee. CDI-054 la remplace par un moteur autoritaire unique caracterise
depuis la trace Git `640f89f`, avec RNG injecte, transcript exhaustif et
validation stricte des heros canoniques.

La reprise CDI-054 restaure aussi la vocation T0 vers T1 : actif Novice retire,
passif Novice conserve, tirages de classe autoritaires et cas particuliers
Mage/Acolyte. La preuve navigateur apres `F5` reste requise dans CDI-051.

## Perimetre autorise

- Construire les enveloppes de commandes avec UUID, idempotence et revision.
- Raccorder les mutations ville, heros, inventaire, forge et donjon.
- Raccorder onboarding, cheats autorises, ticks ville, immigration,
  recuperation et auto-donjon a l autorite serveur.
- Appliquer la reponse canonique et rafraichir le cache local.
- Traiter erreurs metier, conflit 409, replay et indisponibilite reseau.
- Supprimer ou neutraliser les mutations locales qui contournent l autorite.
- Supprimer ou reformuler la fausse synchronisation cloud sans commande.
- Appliquer le reset local uniquement apres le succes de `/reset`.

## Hors perimetre

- Modifier les regles, probabilites ou couts du gameplay.
- Ajouter une file de mutations offline.
- Modifier le schema RNG canonique de CDI-050.

## Contrat d'implementation

- Toute mutation canonique passe par `/game-api/commands`.
- Le client ne remplace jamais le serveur avec un snapshot `save_game`.
- Aucun timer React ne produit de ressources, citoyens, recuperation, loot ou
  progression canonique.
- Hors ligne, aucune commande ni mutation canonique locale n est appliquee.
- Une reponse 409 recharge l etat canonique avant une nouvelle action.
- Les commandes repetees restent idempotentes.
- Le reset attend la reponse serveur avant de modifier l interface et le cache.

## Dependances

- CDI-023, CDI-025, CDI-026, CDI-027, CDI-028, CDI-029, CDI-031, CDI-041 et
  CDI-052.
- CDI-054 — parite deterministe du moteur de donjon autoritaire.

## Criteres d'acceptation

- [ ] Les actions ville utilisent des commandes typees.
- [ ] Les actions heros, inventaire et forge utilisent des commandes typees.
- [x] Les actions donjon utilisent des commandes typees.
- [ ] Onboarding, cheats, ticks et auto-donjon ne contournent pas l autorite.
- [ ] L interface applique uniquement l etat canonique retourne.
- [ ] Le cache local suit la revision canonique apres chaque succes.
- [ ] Offline, 409, replay et erreurs metier sont couverts.
- [x] Un rechargement confirme la persistance des mutations.
- [ ] La sauvegarde manuelle ne pretend pas synchroniser sans commande serveur.
- [ ] Un echec de `/reset` ne reinitialise ni l interface ni le cache.
- [x] CDI-053 restaure le profil novice autoritaire complet et sa persistance.
- [ ] La vocation T1 affiche et persiste les competences autoritaires attendues
      pour une classe ordinaire, un Mage et un Acolyte.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec une session authentifiee, executer une mutation par domaine, recharger,
passer offline puis online et verifier revision, cache et etat canonique.

## Preservation

Conserver l UX existante, les protections offline, les identifiants de commande
et les contrats serveur deja valides.

## Risques

Un raccordement partiel laisserait deux sources d autorite et pourrait dupliquer
ou perdre des mutations.

## Handoff

Fournir la matrice action UI vers commande, les fichiers touches, les tests et
les preuves navigateur. CDI-053 est termine et ne bloque plus CDI-051.

Preuve donjon du 2026-07-24 :

- activation de Ragnor et creation d une rencontre autoritaire jusqu a la
  revision 19 ;
- correction du retour visuel : carte de rencontre en attente et libelle
  `Resoudre la rencontre` ;
- `dungeon.resolve` 200 revision 20, victoire en trois tours, transcript de
  cinq evenements affiche, recompense de 6 or et progression vers la salle 2 ;
- apres `F5`, bootstrap revision 20 : salle 2, 131 or, Ragnor a 100 PV,
  rencontre nulle et aucune banniere hors connexion.

Evolution UX donjon confirmee le 2026-07-24 :

- un clic sur `Explorer la salle` chaine en interne `dungeon.explore`, puis
  `dungeon.resolve` ; aucune action utilisateur `Resoudre` ne subsiste ;
- le transcript canonique est revele ligne par ligne toutes les 400 ms avant
  d afficher le resultat et la recompense ;
- une nouvelle exploration et l auto-donjon attendent la fin de cette lecture ;
- `encounterHistory` persiste les 15 derniers combats resolus dans l etat
  canonique et reste visible apres bootstrap, rechargement ou autre appareil ;
- une rencontre active interrompue est reprise et resolue automatiquement ;
- le reset ne modifie plus l interface ni le cache avant le succes serveur.

Preuves automatisees Codex :

- `npm.cmd run typecheck` : PASS ;
- autorite, contrats, ville et game-api : 4 fichiers, 31 tests, PASS ;
- registre UI progressif sans bouton de resolution : 1 fichier, 1 test, PASS.

Preuve navigateur du nouveau flux obtenue le 2026-07-25 pendant CDI-054 :

- combat et rencontre `trap` resolus sans bouton manuel ;
- transcript progressif complet et historique persistant apres `F5` ;
- replay idempotent sans mutation ;
- vocation Guerrier, competences, statistiques et cooldowns persistants.

Blocage actif :

- CDI-054 a restaure et valide le comportement fonctionnel et RNG du donjon
  dans une seule implementation autoritaire ;
- audit : `docs/architecture/authoritative-dungeon-parity-audit.md` ;
- Le blocage CDI-054 est leve. CDI-051 reste `Paused` jusqu a sa reprise
  explicite pour terminer ses autres validations UI autoritaires.
