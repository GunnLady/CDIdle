# Architecture CDIdle

Ce dossier contient les décisions normatives de la transformation fullstack.
Le document de référence est [`../fullstack-authoritative-plan.md`](../fullstack-authoritative-plan.md).

## Cible

- Deux projets **Supabase Free** : staging et production.
- Authentification Google uniquement, avec allowlist exacte des emails.
- Client statique sur **Cloudflare Pages Free**.
- Gameplay et mutations exécutés côté serveur ; le client rend l'état reçu.
- Cache local limité à l'interface et à la lecture hors connexion.

## Documents normatifs

- [ADR 0001 — Supabase et autorité serveur](adr/0001-authoritative-supabase.md)
- [ADR 0002 — Environnements et absence de facturation](adr/0002-environments-and-zero-billing.md)
- [Workflow Eclipse](../development/eclipse-workflow.md)

Les notes historiques ne remplacent pas ces documents. Toute décision qui
modifie cette cible doit être ajoutée au Workboard et validée explicitement.
