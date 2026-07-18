# Audit Google OAuth et allowlist (CDI-019)

## Périmètre vérifié

L'audit couvre le contrôle d'inscription Google, l'allowlist active, les
permissions de la fonction Auth Hook, la révocation administrative et la
configuration locale/reproductible. Aucun secret OAuth n'est versionné.

## Contrôles réalisés

- `public.before_user_created(jsonb)` accepte uniquement le provider `google`
  et une adresse présente dans `alpha_allowlist` avec `active = true`.
- L'adresse est normalisée en minuscules et les erreurs sont explicites.
- La fonction est `security definer`, avec `search_path` fixé, et n'est
  exécutable que par `supabase_auth_admin`.
- `public.revoke_allowlisted_email(text)` est réservé à `service_role` et
  désactive l'entrée de façon idempotente.
- Google est activable via variables d'environnement dans `supabase/config.toml`.
- Les 12 assertions pgTAP de CDI-019 passent avec les 23 assertions de CDI-018
  (35 tests au total).

## Écarts réels corrigés

| Écart | Correction |
| --- | --- |
| La fonction de hook pouvait entrer en conflit avec le nom de colonne `email`. | Variable renommée `normalized_email` et test de régression ajouté. |
| Une révocation administrative devait éviter l'accès direct de rôles applicatifs à l'allowlist. | Fonction dédiée `revoke_allowlisted_email`, privilèges limités à `service_role`. |
| L'effet réel de la révocation sur le hook n'était pas couvert. | Scénario pgTAP ajouté : révocation puis refus de l'inscription. |
| Les tests pouvaient désactiver la fixture de seed `local@example.test` et échouer au relancement suivant. | Fixture dédiée CDI-019, réactivée au démarrage et supprimée en fin de test. |
| `supabase:verify` ne contrôlait pas la déclaration Google OAuth et du hook. | Vérifications explicites ajoutées au script local. |

## Écarts déjà prévus dans des tickets futurs

| Sujet | Ticket prévu | Statut pour CDI-019 |
| --- | --- | --- |
| Intégration du client Supabase et suppression du prototype Firebase | CDI-023 | Hors périmètre, explicitement planifié |
| Nettoyage complet lors de la suppression définitive d'un compte | CDI-032 | Hors périmètre, dépend du client Supabase |
| Tests RLS hostiles et hardening des budgets/sécurité | CDI-034 | Hors périmètre, hardening ultérieur |

## Conclusion

Le périmètre CDI-019 est couvert localement après correction de l'écart de test
révélé par l'audit post-push. La vérification de la CI distante après le push reste
à faire via le connecteur/API GitHub ; si l'API ne remonte pas les runs déclenchés
par un push, le résultat distant sera déclaré inconnu, sans consultation du site.
