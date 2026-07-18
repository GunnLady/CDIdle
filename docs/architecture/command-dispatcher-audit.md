# Audit dispatcher transactionnel (CDI-021)

## Périmètre vérifié

Le dispatcher valide l'enveloppe de commande, vérifie le type connu, calcule
une empreinte SHA-256 stable, applique la limite de 60 commandes par minute et
délègue la transaction au `CommandStore`.

## Contrôles réalisés

- Une commande appliquée retourne la nouvelle révision et l'état canonique.
- Une commande rejouée retourne le même résultat avec `replayed = true`.
- Une révision périmée retourne `REVISION_CONFLICT` avec la révision courante.
- Une réutilisation de `commandId` avec une empreinte différente retourne
  `DUPLICATE_COMMAND`.
- Les enveloppes invalides et les types inconnus sont rejetés avant le commit.
- Le rate limit est vérifié avant tout commit.
- Les tests Vitest couvrent ces scénarios avec un store mémoire déterministe.

## Écarts réels corrigés

| Écart | Correction |
| --- | --- |
| Aucun dispatcher testable ne reliait les contrats de commande au commit atomique. | Contrat `CommandStore`, dispatcher et hash de requête ajoutés. |
| Le dispatcher ne restituait pas la réutilisation d'un `commandId` avec une autre empreinte. | Résultat `duplicate`, erreur `DUPLICATE_COMMAND` et test ajoutés. |

## Écarts déjà prévus dans des tickets futurs

| Sujet | Ticket prévu | Statut pour CDI-021 |
| --- | --- | --- |
| Transaction PostgreSQL concrète via RPC et contraintes SQL | CDI-022 | Adaptateur HTTP/Edge hors périmètre |
| JWT, CORS, routes `game-api` et identifiants de requête | CDI-022 | Hors périmètre |
| Exécution métier de chaque commande et calculs serveur | CDI-025 à CDI-030 | Hors périmètre |

## Conclusion

Le périmètre CDI-021 est couvert localement après correction de l'écart révélé
par l'audit post-push. La vérification distante sera
tentée via le connecteur/API après le push ; l'absence de données sera déclarée
comme inconnue.
