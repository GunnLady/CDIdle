# Audit CDI-018 — schéma PostgreSQL et RLS

## Périmètre vérifié

Audit réalisé contre le plan fullstack autoritaire, le ticket CDI-018 et la
migration `supabase/migrations/20260718000000_initial_game_socle.sql`.

## Faits vérifiés

- Les tables `alpha_allowlist`, `profiles`, `games` et `game_commands` sont
  définies par la migration.
- Les lectures propriétaire sont protégées par RLS et les mutations directes
  sont révoquées pour `anon` et `authenticated`.
- `games.state` est un objet JSONB, les révisions sont non négatives et les
  événements sont limités à 128 Ko.
- La rétention des commandes est limitée à 24 heures et 50 réponses par
  utilisateur.
- `commit_game_command` est `SECURITY DEFINER`, verrouille son `search_path`
  et n’est exécutable que par `service_role`.
- Les tests pgTAP vérifient la structure, les politiques et les privilèges :
  23 assertions passent localement.

## Écarts réels corrigés

| Écart | Preuve | Correction |
| --- | --- | --- |
| `prune_game_commands()` était exécutable par `PUBLIC` malgré `SECURITY DEFINER` | privilège `EXECUTE` public constaté dans la base locale | révocation explicite et test pgTAP dédié |
| `set_updated_at()` était exécutable par `PUBLIC` | privilège `EXECUTE` public constaté dans la base locale | révocation explicite et test pgTAP dédié |

## Écarts déjà prévus dans des tickets futurs

| Écart | Ticket prévu | Décision |
| --- | --- | --- |
| Tests RLS hostiles avec JWT et scénarios multi-utilisateurs | CDI-034 | conservé hors CDI-018, car il relève du hardening sécurité |
| Dispatcher complet, limites de débit et concurrence applicative | CDI-021 | conservé hors CDI-018 |
| OAuth, allowlist active et hook de pré-création | CDI-019 | conservé hors CDI-018 |

## Écart CI corrigé

La CI GitHub `CDIdle quality` démarre désormais Supabase avec
`supabase/setup-cli`, exécute `npm run test:db`, puis arrête Supabase même en
cas d’échec. Les 23 tests pgTAP sont ainsi contrôlés localement et dans la CI
distante.

## Conclusion

Les écarts réels identifiés dans le périmètre CDI-018 sont corrigés. Les
écarts explicitement attribués à CDI-019, CDI-021 et CDI-034 restent tracés et
ne sont pas comptés comme des oublis de CDI-018.
