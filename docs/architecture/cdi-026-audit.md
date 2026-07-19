# Audit détaillé CDI-026

## Contrôles sans écart

- recrutement atomique avec coût, guilde et capacité ;
- fabrique de héros injectée pour conserver la reproductibilité ;
- renvoi et activité des héros ;
- santé minimale et limite de quatre héros actifs ;
- commandes Edge `hero.recruit`, `hero.dismiss` et `hero.activity` raccordées ;
- tests ciblés (`townAuthority`, `supabaseAdapter`, `gameApi`) : 11/11 réussis ;
- `npm run typecheck` : réussi ;
- `npm run check:determinism` : réussi ;
- aucune classe, statistique ou probabilité de base modifiée.

## Écarts réels

Aucun dans le périmètre local clôturé.

## Sujets prévus dans un autre ticket

- les mutations serveur locales sont maintenant raccordées ;
- validation HTTP authentifiée Edge/Supabase/RLS/RPC : smoke CDI-041/staging ;
  cette preuve distante reste explicitement différée et n'est pas présentée
  comme acquise ici.

## Décision

CDI-026 peut être marqué `Done` pour son périmètre d’implémentation locale.
