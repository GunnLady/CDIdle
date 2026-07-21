---
id: CDI-044
title: Corriger et valider Google OAuth
status: Done
area: auth
priority: P1
size: M
risk: high
source: audit utilisateur
depends_on: []
blocks: []
github_issue: null
related_docs: ["src/lib/supabase.ts"]
---

# CDI-044 — Corriger et valider Google OAuth

## Objectif

R�tablir ou diagnostiquer compl�tement l'authentification Google.

## Resultat utilisateur

Une connexion Google fonctionnelle ou un blocage document� avec preuve.

## Contexte

L'authentification Google ne fonctionne actuellement pas.

## Perimetre autorise

- Configuration Supabase
- Callback OAuth
- Parcours navigateur

## Hors perimetre

- Autres fournisseurs OAuth

## Contrat d'implementation

- V�rifier redirect URLs, provider et gestion d'erreur.

## Dependances

Aucune.

## Criteres d'acceptation

- [ ] Cause identifi�e
- [ ] Correction test�e ou blocage trac�

## Tests

- Test navigateur authentifi�
- npm.cmd test -- --run

## Validation manuelle

Ex�cuter le parcours Google dans le navigateur.

## Preservation

- Conserver le mode email/dev si existant.

## Risques

- D�pendance � la configuration distante.

## Handoff

Documenter URLs, erreur et r�sultat.
