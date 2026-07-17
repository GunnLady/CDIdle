---
id: CDI-001
title: ADR et contrat du depot
status: Done
area: architecture
priority: P0
size: M
risk: medium
source: Plan fullstack autoritaire approuve le 2026-07-15
depends_on: []
blocks: ["CDI-002"]
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/1"
related_docs: ["README.md", "workboard/README.md"]
---

# CDI-001 — ADR et contrat du depot

## Objectif

Transformer les decisions du plan approuve en documentation d'architecture normative, suffisamment precise pour qu'un agent moins capable puisse executer les tickets suivants sans rouvrir les choix produit ou techniques.

## Resultat utilisateur

Le depot explique clairement ce que CDIdle devient, ce qui est autoritaire, ce qui reste local, comment staging et production sont separes et pourquoi aucune depense cloud involontaire n'est possible.

## Contexte

Le depot est actuellement un prototype React/Vite dont la logique, l'authentification Firebase et la sauvegarde Firestore sont pilotees par le client. Le plan approuve retient Supabase Free, Google OAuth avec allowlist, Cloudflare Pages statique, une simulation serveur autoritaire et un cache hors-ligne en lecture seule.

## Perimetre autorise

- Creer `docs/architecture/README.md` comme point d'entree de l'architecture cible.
- Creer `docs/architecture/adr/0001-authoritative-supabase.md` pour le choix backend et la frontiere d'autorite.
- Creer `docs/architecture/adr/0002-environments-and-zero-billing.md` pour local, staging, production et les garde-fous de cout.
- Creer `docs/development/eclipse-workflow.md` pour les roles Sol/Luna, le cycle des tickets et les preuves de handoff.
- Mettre a jour le README racine avec les liens vers ces documents et l'etat actuel du chantier.

## Hors perimetre

- Aucun changement de code React, Firebase, gameplay, dependance npm ou configuration cloud.
- Aucune creation de projet Supabase, Google Cloud ou Cloudflare.
- Aucun deploiement ni migration de donnees.

## Contrat d'implementation

- Documenter les invariants verrouilles : serveur autoritaire, Google OAuth uniquement, allowlist exacte, revision optimiste, idempotence, idle limite a 24 heures et absence d'auto-donjon hors connexion.
- Decrire les quatre routes cibles `bootstrap`, `commands`, `reset` et `account` sans inventer de route supplementaire.
- Decrire `GameStateV1`, `GameCommandRequest`, `GameEnvelope` et les codes d'erreur deja valides.
- Inscrire explicitement que Supabase et Cloudflare restent sur leurs offres gratuites et qu'une montee en gamme exige une nouvelle decision utilisateur.
- Inscrire la politique de sauvegarde preproduction : abandon des sauvegardes Firebase/localStorage existantes, sans import.
- Distinguer les documents normatifs des notes historiques et dater les ADR.

## Dependances

Aucune. Ce ticket est la premiere source normative du chantier et debloque CDI-002.

## Criteres d'acceptation

- [ ] Les quatre documents cibles existent et ne se contredisent pas.
- [ ] Toutes les decisions verrouillees du plan sont retrouvables dans un document normatif.
- [ ] Les limites de cout, d'autorite, d'offline et de migration sont explicites.
- [ ] Le README racine oriente un nouvel implementateur vers l'architecture et le Workboard.
- [ ] Aucun fichier sous `src/` ni aucune dependance n'est modifie.

## Tests

- `npm run board:validate`
- `npm run lint`
- `npm run build`
- `git diff --check`

## Validation manuelle

- Lire les documents comme un agent sans contexte de conversation et verifier qu'aucun choix d'architecture majeur ne reste a prendre.
- Comparer les ADR aux decisions du ticket et au Workboard.

## Preservation

- Conserver l'interface, le comportement runtime, la configuration Firebase et les scripts existants inchanges pendant ce ticket documentaire.

## Risques

- Une formulation vague recreerait des choix pour les tickets suivants. Employer des exigences testables et distinguer clairement cible et etat actuel.

## Handoff

Fournir les fichiers crees/modifies, la liste des decisions encodees, les commandes executees avec leur resultat et toute ambiguite residuelle detectee.
