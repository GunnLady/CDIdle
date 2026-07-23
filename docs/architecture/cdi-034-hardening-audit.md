# Audit CDI-034 — hardening et budgets

Date : 2026-07-23

## Périmètre vérifié

- Payload Edge limité à 128 KiB, avec réponse `413 PAYLOAD_TOO_LARGE` et test
  reproductible dans `tests/gameApi.test.ts`.
- RLS hostile vérifiée par pgTAP dans
  `supabase/tests/database/021_hardening_rls.sql` : les rôles anon/authenticated
  ne peuvent pas muter directement les sauvegardes ni appeler le commit atomique.
- Audit des secrets automatisé par `npm run check:secrets` via
  `scripts/check-secrets.mjs`. Aucun secret détecté dans les fichiers suivis.
- Error Boundary global dans `src/components/AppErrorBoundary.tsx`, avec test
  de repli et rechargement dans `tests/appErrorBoundary.test.tsx`.
- Code splitting des panneaux et des dépendances via `React.lazy` et
  `vite.config.ts`. Le build ne produit plus de warning de chunk.
- Benchmark combat reproductible dans `tests/combat.benchmark.test.ts` :
  1000 rounds sous 500 ms.

## Preuves

- Vitest : 15 fichiers, 102 tests, succès.
- pgTAP : 4 fichiers, 50 tests, succès.
- TypeScript : `npm run typecheck`, succès.
- Build Vite : succès, chunks maximum 478,71 kB bruts.
- Budget JS : 231014 octets gzip, maximum autorisé 250 KiB ; chunk gzip maximum
  144900 octets, maximum autorisé 300 KiB.
- Board : 51 tickets, 0 erreur.
- Audit secrets : 222 fichiers suivis analysés, succès.

## Écart résiduel

`npm run lint` retourne 0 erreur et 132 warnings hérités de fichiers gameplay/UI
antérieurs à CDI-034. Aucun warning nouveau n'a été introduit par ce ticket.
Leur correction globale est hors périmètre et doit rester dans les tickets
propriétaires concernés.
