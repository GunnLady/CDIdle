---
id: CDI-107
title: Construire le lecteur temporel annulable à cadence constante
status: Done
area: frontend
priority: P1
size: M
risk: high
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-100"]
blocks: ["CDI-101"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/domain/encounterPlayback.ts","src/hooks/useEncounterPlayback.ts","src/domain/dungeonPresentation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","tests/encounterPlayback.test.ts"]
---

# CDI-107 — Construire le lecteur temporel annulable à cadence constante

## Objectif

Lire la projection pure avec une horloge injectée, une annulation sûre et le calendrier de progression inchangé.

## Resultat utilisateur

La lecture avance ou se recale sans blocage, même si l'animation est arrêtée ou si la rencontre change.

## Contexte

M couvre lecteur, promesses et génération, hors hooks d'intégration CDI-103. Le dispatch attend actuellement la lecture ; sa durée n'est donc pas seulement décorative.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Consommer la projection 100 avec horloge injectée, rattrapage direct, identité
de génération, annulation, déduplication et promesses toujours libérées.
Prouver le calendrier identique avec rendu désactivé, hors page, 60/120 Hz,
asset lent, absence de fin CSS et changement de session. Garder les animations
décoratives indépendantes de la cadence ; aucun appel métier depuis un callback
visuel. Cent rencontres déterministes ne font pas croître timers/collections.
Le raccordement réel des hooks applicatifs et de la visibilité appartient à 103.

## Hors perimetre

- Résolution métier ou règle économique.
- Raccordement réel de l'automate/cross-tab et contrôles de page : CDI-103.
- Boutons de vitesse/pause/replay et fin de combat pilotée par animationend/onComplete.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Consommer le modèle CDI-100 ; (N + 1) × 400 ms pour les événements de cadence existants, pas pour les seules métadonnées.
- Séparer interpolation et horloge applicative ; calcul direct de l'état après suspension plutôt qu'une file de films.
- Session/génération/rencontre invalident les callbacks anciens ; dédupliquer encounterId et libérer toutes les promesses même sans fin CSS.
- Pas de timer/collection en croissance et pas de travail visuel hors vue ; la politique des nouveaux départs se raccorde dans CDI-103.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-100 : Projeter les rencontres en états de scène déterministes.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Lecture active/désactivée, hors page et raf à 60/120 Hz donnent le même instant de fin et les mêmes valeurs.
- [x] Projection directe après suspension égale la lecture séquentielle ; aucun backlog illimité ni rafale de scènes.
- [x] Nouvelle rencontre/révision, reset ou changement de session invalident toute ancienne mise à jour.
- [x] Doublon/replay ne redémarre pas une boucle de lecture.
- [x] Asset lent/manquant, absence de fin CSS, record vide/inconnu et annulation ne laissent aucune promesse suspendue.
- [x] Cent rencontres déterministes ne font croître ni collections ni minuteries ; les ressources sont libérées.

## Tests

- Étendre tests/encounterPlayback.test.ts et les tests du lecteur avec fake clock/horloge injectée.
- Couvrir interruption à mi-action, invalidation de génération, asset lent, replay et nettoyage de cent rencontres.
- npm.cmd run check:determinism
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

La fidélité temporelle est prouvée automatiquement. Une vérification visuelle ultérieure est complémentaire, pas une preuve suffisante de cadence.

Preuves Codex du 10 septembre 2026 : l'horloge injectée utilise des échéances
absolues et projette directement le curseur attendu après suspension. La durée
reste `(N + 1) × 400 ms`, indépendamment d'un échantillonnage à 60/120 Hz, du
rendu désactivé ou d'une page hors vue. Rencontre, révision, reset et session
invalident les générations anciennes ; doublons actifs et replays terminés sont
dédupliqués. Une annulation règle la promesse même avec une horloge injectée
défaillante, tandis que l'horloge système supprime immédiatement sa minuterie.
La mémoire de replay est bornée à 32 identités et une campagne de cent
rencontres finit sans minuterie active.

Validations réussies : 13 tests ciblés ; suite complète, 127 fichiers et 1 043
tests ; tests voisins du dispatch et de la synchronisation cross-tab, 11 tests ;
`npm.cmd run check:determinism` ; `npm.cmd run lint -- --quiet` ; typecheck avec
une configuration temporaire excluant uniquement `tmp` ; build Vite, 2 016
modules ; budget bundle, 252 142 octets gzip JS et plus gros chunk 121 584
octets ; Workboard, 116 tickets et zéro erreur ; `git diff --check` sans erreur.

La commande exacte `npm.cmd run typecheck` échoue hors périmètre sur les imports
manquants du dossier utilisateur ignoré
`tmp/deployment-2026-09-10/backend-v27`. Ce dossier n'a pas été modifié. La
configuration temporaire de contrôle a été supprimée après le typecheck isolé
réussi. Aucune validation visuelle n'est requise pour ce lecteur sans rendu.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une fin anticipée accélère l'économie ; une annulation non résolue bloque le prochain dispatch.

## Handoff

Fournir contrat d'horloge, durée de référence, règles d'annulation/dédoublonnage et preuves de ressources. V09/V10/V11/V12/V16. CDI-103 prouve ces mécanismes dans les vrais hooks.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.

Contrat livré dans `encounterPlayback.ts` : horloge monotone injectable,
échéances absolues, calcul pur du curseur, rattrapage direct, génération
annulable, identité session/rencontre/révision, déduplication bornée et promesses
toujours réglées. `useEncounterPlayback.ts` utilise l'horloge système et vide la
mémoire de replay lors d'un reset. Le lecteur consomme la chronologie CDI-100
sans dupliquer sa projection de présentation et sans appeler le métier depuis
un callback visuel.

Limites transmises : CDI-103 reste propriétaire du raccordement réel de la
session, des révisions, de la visibilité document/page et du cycle
dispatch/cross-tab ; CDI-101 consomme le curseur dans la première scène de
combat. Les contrôles de vitesse, pause et replay manuel restent hors périmètre.
