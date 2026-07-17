# ADR 0002 — Environnements et absence de facturation

- **Statut :** accepté
- **Date :** 2026-07-15

## Décision

Le projet possède deux environnements Supabase Free, `staging` et `production`.
Les clients sont des sites statiques Cloudflare Pages Free : la branche
`staging` alimente la préproduction et `main` la production. Aucune Pages
Function n'est requise pour l'API de jeu.

Les secrets restent dans les variables d'environnement de la plateforme et ne
sont jamais envoyés au navigateur. Les contrôles de quota et les limites de
requêtes sont obligatoires avant chaque promotion.

## Garde-fous

- Ne jamais activer de plan payant automatiquement.
- Toute montée en gamme Supabase, Cloudflare ou Google Cloud exige une nouvelle
  décision utilisateur explicite.
- Les journaux ne contiennent pas de PII ni de jetons.
- Les données de staging sont synthétiques et supprimables.
- Une promotion exige les tests automatisés et les scénarios bloquants du plan.

## Conséquences

Le déploiement doit rester réversible : migration, rollback et suppression des
ressources sont documentés avant l'ouverture de la production.
