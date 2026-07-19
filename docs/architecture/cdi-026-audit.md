# Audit détaillé CDI-026

## Contrôles sans écart

- recrutement atomique avec coût, guilde et capacité ;
- fabrique de héros injectée pour conserver la reproductibilité ;
- renvoi et activité des héros ;
- santé minimale et limite de quatre héros actifs ;
- tests `tests/utils.test.ts` : 53/53 réussis ;
- `npm run typecheck` : réussi ;
- `npm run check:determinism` : réussi ;
- aucune classe, statistique ou probabilité de base modifiée.

## Écarts réels

Aucun dans le périmètre local clôturé.

## Sujets prévus dans un autre ticket

- validation HTTP Edge/Supabase/RLS/RPC : smoke CDI-041/staging ;
- génération et mutations serveur complètes : raccordement dans la tranche
  autoritaire correspondante, sans présenter la validation distante comme
  acquise ici.

## Décision

CDI-026 peut être marqué `Done` pour son périmètre d’implémentation locale.
