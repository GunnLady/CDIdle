---
id: CDI-103
title: Intégrer le premier combat et sécuriser son cycle de lecture
status: Later
area: frontend
priority: P1
size: L
risk: high
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-101"]
blocks: ["CDI-102","CDI-113"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/components/dungeon/DungeonPage.tsx","src/components/dungeon/CurrentEncounterPanel.tsx","src/components/dungeon/DungeonHistoryPanel.tsx","src/hooks/useDungeonAutomation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","src/hooks/useCrossTabGameSynchronization.ts","docs/development/dungeon-segment-ko-milestone-plan.md"]
---

# CDI-103 — Intégrer le premier combat et sécuriser son cycle de lecture

## Objectif

Intégrer le premier combat au Donjon en préservant dès maintenant toutes les garanties du cycle applicatif.

## Resultat utilisateur

Le combat pilote s'enchaîne en manuel/auto sans double commande, lecture périmée ou blocage d'un jalon.

## Contexte

L reste cohérent : le dispatch, la promesse de lecture, l'automate et les annulations doivent être validés ensemble. L'intégration n'attend plus les cinq packs ni les huit scènes hors combat.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Brancher le combat pilote sur `CurrentEncounterPanel`, conserver historique,
commandes, préférence locale d'animations et résumé ; adapter les assertions
de hauteur/transcript dans le périmètre réellement remplacé. Prouver cadence
400 ms par événement existant plus clôture, délai auto 4 750 ms, nombre de
commandes inchangé, priorité résultat/rencontre suivante/jalon et conservation
des parcours 5/10/50, vocation, KO et farm.

Inclure dès cette intégration navigation, document masqué, reprise sans rafale,
cross-tab/leader/observateur, replay/doublon/conflit, nouvelle révision,
reset/logout/compte suivant et erreurs. Les valeurs de lecture restent locales.
**L est maintenu parce que dispatch, automate et annulation doivent être
validés ensemble**, sans repousser leur sûreté à une recette finale.

Le pilote ne dépend pas des cinq packs de zone ou des huit scènes hors combat.
Acteurs sans art final et actions encore non chorégraphiées restent représentés
honnêtement ; les rencontres non-combat gardent temporairement leur affichage
existant. Ces états transitoires sont explicitement fermés par 108–115 et ne
constituent pas le résultat final accepté du chantier. Ce ticket n'autorise
aucun déploiement partiel automatique.

## Hors perimetre

- Production des packs CDI-108 à CDI-112 et des extensions CDI-102/CDI-113/CDI-114/CDI-115.
- Nouvelle cadence économique, poll, WebSocket, commande par impact, replay animé complet ou suppression de l'historique.
- Déploiement automatique d'une version partielle.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Remplacer le transcript principal pour le combat pilote ; éviter les cartes ennemies redondantes, conserver historique, contrôles et préférence locale d'animation.
- Cadence : (N + 1) × 400 ms selon les événements existants, puis 4 750 ms avant le prochain départ auto ; une invocation nominale par rencontre.
- Document masqué : arrêter animations et nouveaux départs, reprendre sans rafale ; autre page visible : préserver la progression existante sans travail visuel de scène.
- Révision/session/génération invalident tout callback obsolète ; reset/logout/compte suivant purgent acteurs et ressources ; observateur sans mutation.
- Priorité explicite résultat/rencontre suivante/jalon ; aucune valeur de playback ne remplace le snapshot global.
- Une annonce synthétique accessible, journal détaillé et reduced-motion ; le dernier historique reste terminé après rechargement, sans replay automatique des quinze entrées.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-101 : Construire la scène de combat simple CDIdle.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Le combat pilote fonctionne dans CurrentEncounterPanel avec kit CDIdle, commandes et historique ; les assertions de hauteur/transcript modifiées couvrent réellement le nouveau rendu.
- [ ] Manuel et auto gardent résultats, heures de fin/départ et nombre de requêtes en rendu actif/désactivé, hors page Donjon et à fréquence écran différente.
- [ ] Jalons 5/10/50, continuer/retour, retraite, pause auto, KO, vocation et sélection de farm restent accessibles au bon moment.
- [ ] Masquage/retour, navigation/démontage, autre onglet, changement de leader/observateur, replay, doublon, conflit et snapshot récent n'ajoutent ni commande ni scène périmée.
- [ ] Reset, déconnexion/changement de compte et erreur réseau ne montrent pas une ancienne victoire ou les acteurs d'une autre session.
- [ ] Les animations et préférences locales n'attendent jamais un callback CSS pour libérer le dispatch ; aucun backlog de scènes ou ressource croissante.
- [ ] Les replis transitoires pour art/actions manquants et non-combat sont fidèles et documentés avec leurs tickets de fermeture ; aucune couverture finale fictive n'est annoncée.

## Tests

- Étendre DungeonPanel, dungeonPresentation, useDungeonAutomation, useCrossTabGameSynchronization et dungeonSegmentHarness.
- Comparer horaires/comptes de commandes avec horloge contrôlée dans tous les modes de visibilité, d'animation et de session.
- Mettre à jour tests/browser/dungeonPage.responsive.browser.spec.ts dans le cadre navigateur autorisé.
- npm.cmd test -- --run
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Parcours local utilisateur : combat manuel/auto, pause/retraite, KO et jalons, vocation/farm, navigation, observateur et retour d'onglet. Vérification visuelle par l'utilisateur ; commande/terminal/objectif exacts si un contrôle interactif ne peut pas être exécuté dans Codex.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une fin de playback prématurée accélère la progression ; une promesse orpheline bloque l'automate.
- Le snapshot final peut masquer un KO ou une décision de jalon si la priorité des panneaux est implicite.

## Handoff

Fournir raccordement, preuves de cadence/requêtes, priorités, cycle de session et replis transitoires attribués. V06/V08–V14. CDI-102/113/114/115 intègrent ensuite leurs extensions ; l'art complet arrive dans CDI-108–112.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
