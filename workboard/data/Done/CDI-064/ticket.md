---
id: CDI-064
title: Versionner les builds alpha
status: Done
area: delivery
priority: P1
size: S
risk: medium
source: Audit de preparation alpha du 2026-07-30
depends_on: []
blocks: ["CDI-065", "CDI-066"]
github_issue: null
related_docs: ["src/App.tsx", "shared/contracts/authoritative.ts", ".github/workflows/deploy.yml", ".github/workflows/rollback.yml"]
---

# CDI-064 — Versionner les builds alpha

## Objectif

Remplacer la version client codée en dur par une identité de build traçable,
visible et stable pendant les commandes, les rapports d erreur et les rollback.

## Resultat utilisateur

Le propriétaire peut identifier exactement le build utilisé par un testeur et
le relier au commit et au déploiement Cloudflare correspondants.

## Contexte

Le client envoie actuellement `clientVersion: "cdi-061"`. Cette valeur ne suit
plus les livraisons et ne permet pas d analyser un défaut observé après plusieurs
déploiements.

## Perimetre autorise

- Générer une version depuis le commit Git construit par la CI.
- Fournir une valeur locale explicite pour le développement et les tests.
- Remplacer la constante `cdi-061` dans les enveloppes de commande.
- Afficher une version courte et copiable dans une surface discrète de l UI.
- Inclure la même version dans les futurs rapports d erreur CDI-065.
- Relier dans le runbook version, commit, déploiement Cloudflare et rollback.

## Hors perimetre

- Mettre en place un cycle SemVer public complexe.
- Construire une page de notes de version complète.
- Ajouter analytics, monitoring ou alertes.
- Modifier la compatibilité du schéma de sauvegarde.

## Contrat d'implementation

- La version de build provient d une variable injectée et possède un fallback
  local explicite ; elle n est jamais calculée aléatoirement au runtime.
- Toutes les commandes d un même build utilisent la même valeur.
- Une enveloppe déjà créée conserve sa version originale lors d un retry, afin
  de ne pas modifier son empreinte idempotente.
- La version affichée et envoyée au serveur correspond au même commit.
- Aucune variable sensible n est exposée avec les métadonnées de build.

## Dependances

Aucune dépendance d implémentation. Le ticket bloque CDI-065 et la validation
backend CDI-066.

## Criteres d'acceptation

- [x] `clientVersion: "cdi-061"` n existe plus dans le code de production.
- [x] Le développement local expose une version déterministe identifiable.
- [x] La CI injecte le commit du build dans l artefact Cloudflare.
- [x] L interface affiche une version courte correspondant au build.
- [x] Les commandes et retries conservent la version correcte.
- [x] Le rollback permet d identifier sans ambiguïté la version restaurée.
- [x] Aucun secret ou chemin local n apparaît dans les métadonnées exposées.

## Tests

- Tests unitaires de résolution et d affichage de version.
- Test d enveloppe prouvant la conservation de version lors d un retry.
- Build avec et sans variable de CI.
- Inspection du bundle construit.
- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:secrets`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Lancer un build local puis un build avec une fausse SHA contrôlée, vérifier la
valeur affichée et envoyée dans une commande. Après publication, comparer cette
valeur au commit Cloudflare puis confirmer la version restaurée par rollback.

## Preservation

- Préserver le contrat `clientVersion` et l idempotence des commandes.
- Préserver les builds locaux sans dépendre de GitHub.
- Ne jamais exposer de secret dans les variables Vite.

## Risques

- Une version recalculée entre deux retries peut produire un conflit
  d idempotence.
- Une valeur différente entre UI et commandes rendrait les diagnostics faux.
- Une injection CI absente peut produire des builds non traçables.

## Handoff

Fournir la convention de version, les variables de build, les fichiers modifiés,
les preuves local/CI, un exemple de commande versionnée et la correspondance
commit/déploiement/rollback.

## Validation du 2026-07-30

- Convention : `local-dev` sans injection, `git-<SHA complet>` dans les
  commandes et `git-<12 caractères>` dans le footer.
- Les workflows CI, déploiement et rollback calculent `VITE_BUILD_SHA` depuis
  le commit réellement checkouté.
- Preuve Codex : 327 tests passent; typage, lint ciblé, secrets, logs,
  migrations, déterminisme, bundle et board passent.
- Preuve utilisateur : builds Vite avec et sans SHA réussis.
- Preuve Codex : le bundle injecté contient le SHA contrôlé, le préfixe `git-`
  et aucune occurrence de `cdi-061`.
- Preuve utilisateur : footer court, infobulle complète et payload `/commands`
  avec le SHA complet validés dans le navigateur.
- L exécution CI distante sera vérifiée après push. Le rollback Cloudflare réel
  reste une validation de publication couverte par CDI-062.
