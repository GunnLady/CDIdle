# Audit global CDIdle

Ce document est l’index de référence des audits d’architecture et de domaine.
Il sert à préparer les tickets suivants sans perdre les écarts déjà identifiés.

Les audits sont des instantanés datés. Leurs états de tickets et leurs listes
d'écarts restent des preuves historiques ; seul le Workboard indique ce qui est
encore ouvert aujourd'hui.

## Audits référencés

Les audits et le registre historique de suivis `game-api` sont référencés ici :

- [hero-domain-audit.md](hero-domain-audit.md)
- [authoritative-dungeon-parity-audit.md](authoritative-dungeon-parity-audit.md)
- [inventory-equipment-audit.md](inventory-equipment-audit.md)
- [forge-domain-audit.md](forge-domain-audit.md)
- [dungeon-progression-audit.md](dungeon-progression-audit.md)
- [zero-rebase-audit.md](zero-rebase-audit.md)
- [supabase-local-audit.md](supabase-local-audit.md)
- [postgres-rls-audit.md](postgres-rls-audit.md)
- [google-oauth-audit.md](google-oauth-audit.md)
- [game-repository-audit.md](game-repository-audit.md)
- [command-dispatcher-audit.md](command-dispatcher-audit.md)
- [game-api-audit.md](game-api-audit.md)
- [game-api-followups.md](game-api-followups.md)
- [cdi-025-post-push-audit.md](cdi-025-post-push-audit.md)
- [clock-rng-audit.md](clock-rng-audit.md)
- [cdi-038-audit.md](cdi-038-audit.md)
- [cdi-026-audit.md](cdi-026-audit.md)
- [cdi-027-audit.md](cdi-027-audit.md)
- [cdi-028-audit.md](cdi-028-audit.md)
- [cdi-029-audit.md](cdi-029-audit.md)
- [cdi-030-audit.md](cdi-030-audit.md)
- [cdi-034-hardening-audit.md](cdi-034-hardening-audit.md)
- [cdi-042-audit.md](cdi-042-audit.md)
- [cdi-059-audit.md](cdi-059-audit.md)
- [idle-engine-audit.md](idle-engine-audit.md)
- [supabase-cache-audit.md](supabase-cache-audit.md)
- [supabase-client-audit.md](supabase-client-audit.md)
- [town-authoritative-parity-audit.md](town-authoritative-parity-audit.md)

Les documents de contrat ou de domaine (`game-state-v1.md`, `town-domain.md`,
etc.) ne sont pas des audits et restent référencés uniquement par leurs tickets.

## Règle d’utilisation

Ce fichier ne répète pas les sujets déjà traités. Il indexe les audits sans
présumer que leurs écarts sont encore ouverts. Toute action courante doit être
confirmée par un ticket non `Done` du Workboard.

Lorsqu’un nouvel audit `*-audit.md` est créé, il doit être ajouté à cette liste.
