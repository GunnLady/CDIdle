---
id: CDI-112
title: Produire les assets de la Cour du Roi des Rats
status: Done
area: art
priority: P1
size: M
risk: medium
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-099"]
blocks: ["CDI-116"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/assets/undercityCourtVisualManifest.ts","src/assets/undercityVisualManifest.ts","shared/domain/undercity.ts","assets/design/dungeon-2d/undercity-court-kit-v1.prompt.md"]
---

# CDI-112 — Produire les assets de la Cour du Roi des Rats

## Objectif

Livrer le pack artistique complet de la zone Cour du Roi des Rats, avec catalogue vérifiable et ressources optimisées.

## Resultat utilisateur

Le joueur reconnaît l'ambiance de Cour du Roi des Rats, ses groupes ennemis, son élite et son boss.

## Contexte

M couvre une seule zone : six blueprints et 15 emplacements de membres actuellement déclarés, avec réemplois possibles ; il ne signifie pas 15 illustrations originales obligatoires. Le catalogue et les silhouettes de héros existent dans CDI-099.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

- Couvrir uniquement la zone canonique `court` : `court-guard`, `court-vermin`, `chamberlain-escort`, `court-champion`, `king-herald`, `rat-king`.
- Livrer tous les membres de ses quatre rencontres régulières, de son élite et de son boss, ainsi que son décor.
- Créer l'ambiance de zone et les ressources manquantes en réutilisant le catalogue établi par CDI-099.
- Préparer provenance, versions, cadrage, ancrages, échelles, transparence, poids et fallback ; vérifier la couverture contre UNDERCITY_ZONES.
- Valider la cohérence artistique et le chargement à la demande de cette zone, indépendamment des autres packs.
- Livrer les deux formes visuelles du Roi et déclencher la forme monstrueuse sur
  le signal métier canonique émis après la mort de ses deux gardes, sans changer
  ses PV ni les règles de combat.

## Hors perimetre

- Les autres zones et le catalogue héros/pilote CDI-099.
- Chorégraphie, nouvelle rencontre, modification de rôle, équilibrage ou règle de gameplay.
- Copie de ressources SLT sans examen distinct des droits ou refonte de l'identité CDIdle.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Conserver les clés blueprint/membre de CDI-098 et le manifeste de présentation CDI-099 ; ne pas dupliquer manuellement le catalogue métier dans le vérificateur.
- Réemploi de familles permis si les membres et rôles restent distinguables ; élite/boss identifiables. Le Roi, sa lame senestre et sa lame dextre gardent trois identités distinctes.
- Chargement limité à la zone/acteurs utiles ; cache borné, transparence préparée hors frame et fallback qui ne masque jamais un acteur.
- Respecter le budget proposé ≤ 2 MiB supplémentaires à froid par scène/groupe (portraits existants séparés), ou obtenir une révision motivée explicite avant clôture.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-099 : Préparer le catalogue visuel et le kit pilote CDIdle.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Le vérificateur confirme les six blueprints de court et leurs 15 emplacements de membres sans entrée ni fichier manquant.
- [x] Décor, acteurs, provenance/versions, ancrages et échelles sont livrés dans le catalogue de présentation.
- [x] Les rôles, l'élite et le boss restent lisibles ; aucune ressource de repli provisoire ne remplace silencieusement un membre attendu. Roi et deux gardes sont distincts.
- [x] Fichiers/dimensions/transparence, téléchargement à froid/cache et cas lent/absent sont contrôlés dans les budgets.
- [x] L'utilisateur valide le pack sur fond sombre à 1024/1280/1440 px et au zoom 200 %, dont le cas quatre héros/boss escorté si applicable.
- [x] Le Roi conserve sa forme armée en phase 1 puis adopte sa forme monstrueuse,
  désarmée et plus massive au premier événement visible suivant son intention
  canonique `Assaut monstrueux`.
- [x] Le pack est chargeable indépendamment des quatre autres zones ; aucune dépendance séquentielle artistique inutile n'est introduite.

## Tests

- Contrôler la couverture contre UNDERCITY_ZONES pour court ; tous les membres, pas seulement un visuel par blueprint.
- Vérifier manifeste, fichiers, poids, transparence, ancrages, fallback et chargement tardif ; utiliser le harness de scène selon l'autorisation navigateur.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

Résultats techniques du 12 septembre 2026 :

- `check:dungeon-visuals` : cinq packs valides ; Cour = six blueprints,
  15 membres canoniques, 16 fichiers uniques décor et variante de phase 2
  inclus, 2 239 334 octets au total ; scène la plus lourde = phase 2 du
  `rat-king`, 702 554 octets sur 2 MiB.
- Vitest ciblé : 5 fichiers, 67 tests passés (`encounterSceneProjection`,
  `dungeonCombatScene`, `encounterVisuals`, domaine UnderCity et budget egress).
- Playwright packs UnderCity : 5 tests passés à 1024, 1280, 1440 px, dans
  l'équivalent 1024 px à zoom 200 %, et sur la variante explicite du Roi en
  phase 2 ; assets prêts et acteurs dans la scène.
- `typecheck`, `lint --quiet`, `build`, `check:bundle` et `board:validate`
  réussis ; bundle JS = 255 690 octets gzip, plus gros chunk = 121 290 octets.
- `git diff --check` réussi ; seuls les avertissements CRLF historiques du
  poste Windows sont remontés.

## Validation manuelle

L'utilisateur a validé écran par écran la Cour du Roi des Rats : cohérence
CDIdle, silhouettes, détourage, diversité, taille relative et lisibilité des
groupes, de l'élite et du boss. Il a également validé les deux formes du Roi,
dont sa mutation de phase 2 désarmée au cadrage final 384 × 345 et à l'échelle
runtime `2.6`. Les vérifications de poids ne remplacent pas cet avis.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Confondre six blueprints et six sprites alors que chaque groupe comporte plusieurs membres.
- Réemploi trop uniforme ou silhouettes peu lisibles sur le décor sombre ; charge à réestimer si CDI-097 exige des poses dédiées.

## Handoff

Manifeste de Cour, sources/prompts autorisés, réemplois, métriques, contrôle des
15 emplacements et avis utilisateur sont livrés. La variante visuelle
`undercity:rat-king:c:monstrous` est pilotée par l'intention canonique du Roi et
testée dans la projection, la présentation, le catalogue et le harness PC.
V01/V13/V15/V18 et V05. CDI-116 mesure la couverture complète des cinq packs.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
