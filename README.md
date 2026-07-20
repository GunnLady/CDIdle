# CDIdle

CDIdle est un jeu de gestion/idle avec un état de jeu progressivement rendu
autoritaire côté Supabase. Le dépôt contient le client React, les domaines purs,
les commandes serveur Edge et le Workboard de suivi.

## Prérequis

- Node.js LTS et npm ;
- Docker Desktop uniquement pour Supabase local ;
- PowerShell sous Windows.

## Installation et développement

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Ouvrir l'URL Vite affichée, par défaut `http://127.0.0.1:3000`.
Ne jamais placer de clé service-role ou de secret serveur dans `.env.local` ou
dans Git.

## Workboard

```powershell
npm run board:start
npm run board:stop
npm run board:validate
```

Le Workboard est la source de vérité des tickets. Documentation :
[workboard/README.md](workboard/README.md).

## Contrôles locaux

```powershell
npm run typecheck
npm run lint
npm run check:determinism
npm run build
npm test -- --run
npm run check
```

Pour les tests nécessitant Docker, Supabase ou plusieurs essais interactifs,
lancer la commande indiquée dans le ticket et communiquer le résultat avant de
poursuivre.

## Supabase local

Les fonctions Edge et migrations sont dans `supabase/`. Docker Desktop doit
être démarré avant les commandes Supabase locales. Les validations authentifiées
ou dépendantes de Kong/PostgREST sont manuelles et ne sont pas déclarées
réussies sans preuve.

## Architecture et suivi

- [Vue d'architecture](docs/architecture/README.md)
- [Plan fullstack autoritaire](docs/fullstack-authoritative-plan.md)
- [Index des audits](docs/architecture/audit-global.md)
- [Principes de collaboration CDIdle (référence unique)](docs/collaboration-principles-cdidle.md)

Le travail se fait directement sur `main`. Chaque ticket suit un audit
fonctionnel pré-push, un push propre et un audit post-push ciblé Git/CI.
