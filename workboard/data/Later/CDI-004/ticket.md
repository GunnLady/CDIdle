---
id: CDI-004
title: Hygiene dependances et configuration
status: Later
area: tooling
priority: P1
size: M
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: ["CDI-003"]
blocks: []
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/4"
related_docs: ["README.md", ".env.example", "docs/architecture/README.md"]
---

# CDI-004 — Hygiene dependances et configuration

## Objectif

Reduire la surface inutile du prototype et rendre sa configuration temporaire Firebase explicite, reproductible et sans secret avant le remplacement Supabase.

## Resultat utilisateur

Le depot s'installe avec uniquement les outils utilises et ne depend plus de fichiers de configuration generes ou ambigus.

## Contexte

Le manifeste contient plusieurs dependances sans import runtime evident, tandis que `src/lib/firebase.ts` contient une configuration en dur et que des artefacts Firebase/AI Studio sont suivis a la racine.

## Perimetre autorise

- Prouver par `rg`, le build et les tests l'usage ou l'inutilite de chaque dependance candidate.
- Retirer si elles sont effectivement inutilisees : `@google/genai`, `express`, `dotenv`, `tsx`, `@types/express` et `esbuild` direct.
- Conserver Firebase jusqu'au ticket CDI-023 ; ne pas anticiper le cutover Supabase.
- Charger temporairement la configuration publique Firebase depuis des variables `VITE_FIREBASE_*` documentees dans `.env.example`.
- Supprimer les artefacts `firebase-applet-config.json` et `firebase-blueprint.json` uniquement apres avoir prouve qu'aucun script ne les consomme.
- Documenter les variables publiques par opposition aux secrets qui ne doivent jamais entrer dans Vite.

## Hors perimetre

- Ne pas supprimer Firebase, Firestore, Auth ou `firestore.rules`.
- Ne pas creer de client Supabase.
- Ne pas modifier la logique de sauvegarde ou d'authentification.
- Ne pas mettre a jour toutes les dependances vers leurs dernieres versions sans besoin prouve.

## Contrat d'implementation

- Chaque retrait doit etre justifie dans le handoff par l'absence d'import et un build/test vert.
- Le client doit echouer clairement au demarrage en developpement lorsqu'une variable Firebase requise manque, sans afficher de valeur sensible.
- Les fichiers `.env*` reels restent ignores ; seul `.env.example` est versionne.
- Regenerer `package-lock.json` exclusivement via npm.
- `npm audit` ne doit introduire aucune vulnerabilite high/critical de production.

## Dependances

CDI-003 doit etre `Done` afin que chaque nettoyage soit protege par la CI standardisee.

## Criteres d'acceptation

- [ ] Toutes les dependances restantes ont un usage documentable.
- [ ] L'application se construit avec une configuration fournie par `.env.example`.
- [ ] Aucun secret serveur n'est present dans le depot ou le bundle.
- [ ] Firebase continue de fonctionner comme avant jusqu'au cutover planifie.
- [ ] Les artefacts supprimes n'ont aucun consommateur.

## Tests

- `rg -n "@google/genai|express|dotenv|tsx|esbuild|firebase-applet-config|firebase-blueprint" . -g "!node_modules/**" -g "!dist/**"`
- `npm ci`
- `npm run check`
- `npm audit --omit=dev --audit-level=high`

## Validation manuelle

- Demarrer `npm run dev` avec une copie locale de `.env.example` completee et verifier la page d'authentification.
- Retirer temporairement une variable obligatoire et verifier l'erreur explicite, puis restaurer le fichier local.

## Preservation

- Preserver le flux Firebase actuel, la cle de sauvegarde existante et l'interface utilisateur.

## Risques

- Certaines dependances peuvent etre chargees indirectement par Vite. Ne les retirer qu'apres inspection du graphe et validation complete.

## Handoff

Fournir la matrice dependance vers usage/preuve, les fichiers de configuration touches, les commandes executees et toute dependance conservee par prudence.
