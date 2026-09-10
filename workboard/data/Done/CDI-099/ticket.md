---
id: CDI-099
title: Préparer le catalogue visuel et le kit pilote CDIdle
status: Done
area: art
priority: P1
size: L
risk: medium
source: Demande utilisateur du 10 septembre 2026 - scènes Donjon 2D inspirées de SLT
depends_on: ["CDI-097"]
blocks: ["CDI-101","CDI-108","CDI-109","CDI-110","CDI-111","CDI-112"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/assets/heroSpriteSheets.ts","src/domain/heroPortrait.ts","src/components/HeroPortrait.tsx","shared/domain/undercity.ts","assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md"]
---

# CDI-099 — Préparer le catalogue visuel et le kit pilote CDIdle

## Objectif

Livrer le catalogue réutilisable, les silhouettes des héros existants et un kit artistique suffisant pour le premier combat.

## Resultat utilisateur

Le pilote retrouve les héros CDIdle et montre une meute de rats identifiable dans les Égouts.

## Contexte

400 identités proviennent des planches existantes (10 classes × 2 sexes × 20 variantes), pas de 400 animations à dessiner. L réunit l'outillage de préparation et sa première preuve artistique.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Préparer une seule chaîne réutilisable d'extraction/détourage des planches
existantes : 400 identités résolubles et conservation de la variante à travers
les classes, sans redessiner 400 héros. Ajouter catalogue de présentation,
ancrages, échelles, provenance, versions, fallback, chargement à la demande,
cache borné et vérificateur de couverture.

Le kit pilote comprend le décor des Égouts et les trois membres de `rat-pack`,
avec les effets simples nécessaires au prototype retenu. Mesurer le poids et
valider visuellement l'échantillon et les détourages représentatifs sur fond
sombre. Toute identité non montrée individuellement reste vérifiée par la
couverture et les contrôles de planches, sans inventer 400 avis utilisateur.
**L correspond à l'outillage réutilisable et à sa première preuve artistique**,
pas à toute la production ennemie. Les quatre autres décors, les autres ennemis
et les accessoires hors combat passent dans leurs tickets dédiés.

## Hors perimetre

- Redessiner les héros, modifier visage/cheveux/peau/sexe/variante ou utiliser les variantes comme frames.
- Production complète des cinq zones : CDI-108 à CDI-112 ; accessoires hors combat : CDI-102/CDI-115.
- Cycles dédiés par variante sans décision du prototype ; copie de code ou d'assets SLT sans vérification distincte des droits.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Séparer le catalogue de présentation du métier et aligner ses clés sur le contrat de CDI-098, sans y mettre d'URL d'asset.
- Détourage/extraction réutilisable hors de la boucle de rendu, ancrage au sol et échelles stables.
- Documenter provenance, versions, cadrage, fallback et chargement à la demande ; cache borné et libéré à la sortie de session.
- Budgets : au plus 2 MiB supplémentaires à froid pour le kit affiché, ou révision motivée explicitement acceptée ; JS inchangé à 250 KiB gzip total / 300 KiB par fichier.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-097 : Valider la composition PC de la scène Donjon 2D.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [x] Les 400 identités actuelles se résolvent avec conservation de la variante à travers les classes et contrôle de couverture automatique.
- [x] Le kit livre le décor des Égouts et les trois membres de rat-pack, leurs ancrages et les effets simples retenus par CDI-097.
- [x] Le manifeste détecte entrées/fichiers manquants ; un acteur sans ressource reste représenté par un fallback utile.
- [x] Aucun détourage par frame ni chargement de toute la bibliothèque pour une scène ; le cache et les poids sont mesurés.
- [x] L'utilisateur valide l'échantillon représentatif et les détourages délicats sur fond sombre ; la cohérence des planches est contrôlée sans prétendre à 400 avis individuels.
- [x] Si le prototype exige de nouvelles poses, la production est réestimée et la décision documentée avant généralisation.

## Tests

- Vérifier catalogue contre HERO_SPRITE_SHEETS et les trois membres de rat-pack ; fichiers, dimensions, poids et absence d'identités manquantes.
- npm.cmd test -- --run tests/heroPortrait.test.ts
- Simuler asset absent/chargement lent et contrôler cache, transparence et identité historique.
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Faire valider par l'utilisateur silhouettes, franges vertes, échelles et kit des Égouts. Les mesures de poids et le manifeste ne remplacent pas son verdict artistique.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Une chaîne de détourage correcte sur une seule planche ne garantit pas les autres classes.
- Le besoin de poses dédiées remettrait en cause l'estimation ; il doit être décidé dans CDI-097.

## Handoff

Fournir catalogue, sources/prompts autorisés, couverture des 400 identités, mesures et verdict du pilote. V01/V13/V18. CDI-108 réutilise le décor et rat-pack ; ne pas marquer la bibliothèque complète livrée.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.

## Preuves d'implementation

- Le catalogue `encounterVisuals` versionne les clés de présentation sans URL
  dans le domaine : les 400 clés héros reprennent exactement l'identité
  `classe_sexe_variante` de CDI-098 ; `rat-pack` conserve les clés membres
  immuables `a`, `b`, `c`. Ancrages, échelles, provenance et fallbacks sont
  portés par les descripteurs.
- L'extraction chroma des héros est sortie du composant React. Les planches et
  sprites traités utilisent des caches asynchrones bornés à 4 et 32 entrées ;
  les ressources de rencontre sont bornées à 16 entrées. Les caches sont
  purgés au changement ou à la fin de session.
- Les assets sont chargés à la demande. Le build de production peut éliminer
  le catalogue de démonstration non utilisé hors catalogue UI ; aucune image
  du kit n'est intégrée au JS principal.
- Le kit v1 livre le décor des Égouts et les trois rats distincts dans
  `src/assets/images/dungeon/undercity/sewers/`. Les prompts, références et
  transformations sont consignés dans
  `assets/design/dungeon-2d/undercity-sewers-kit-v1.prompt.md`.
- `npm.cmd run check:dungeon-visuals` : 20 planches, 400 identités, quatre
  fichiers exacts, dimensions attendues, transparence pixel réellement
  présente sur chaque rat et 493 053 octets sur le budget froid de 2 MiB.
- L'audit avant validation a corrigé deux écarts : le contrôle alpha ne se
  contente plus du type RGBA et la clé `effect:physical-impact` est maintenant
  traçable dans le rendu et le test navigateur.
- `npm.cmd test -- --run` : 126 fichiers et 1 026 tests passés sur la version
  finale. Les paquets ciblés couvrent catalogue, cache, cadrage opaque,
  profondeur, formation, phases et rendu du catalogue UI.
- `npm.cmd run lint -- --quiet`, le typecheck isolé excluant seulement le
  dossier utilisateur `tmp`, `npm.cmd run build`, `npm.cmd run check:bundle`
  et `npm.cmd run board:validate` passent. Le bundle JS total mesure 248 611
  octets gzip, avec un plus gros fichier à 121 584 octets.
- CDI-097 a validé le prototype avec silhouettes transformées et sans poses
  dédiées ; aucune réestimation artistique n'est donc déclenchée ici.
- Verdict utilisateur PC : rats validés, absence de franges vertes confirmée,
  fond Égouts validé après retrait du faux plancher brun, héros recadrés,
  formation en losange replacée sur les deux berges et scaling léger de
  profondeur validé. Le contour d'action or du héros est validé ; l'animation
  actuelle est acceptée pour une attaque d'arme au corps-à-corps.
- `npm.cmd run test:layout-browser -- tests/browser/dungeonScenePrototype.responsive.browser.spec.ts`
  a été exécuté par l'utilisateur sur la version finale : 4 tests passés en
  5,8 s. Codex n'a ni ouvert ni piloté de navigateur.
- Suivi différé non bloquant : le même mécanisme sélectionne un contour rouge
  pour `data-team="enemies"`, mais aucune fixture actuelle ne fait agir un
  ennemi. CDI-101 devra le faire valider lors de la première action ennemie :
  contour rouge ajusté à la silhouette active, sans contour or concurrent.
  Projectiles, soins et compétences restent attribués à CDI-113.
- Aucun écart réel CDI-099 ne reste ouvert. Aucun commit, push ou déploiement
  n'a été lancé par cette étape.
