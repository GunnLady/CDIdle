# Audit Edge Function game-api (CDI-022)

## Périmètre vérifié

Le handler Edge Runtime expose les routes publiques, applique CORS strict,
authentifie la requête via une dépendance Bearer/JWT, valide les payloads,
retourne des erreurs structurées et ajoute un identifiant de requête.

## Contrôles réalisés

- `POST /game-api/bootstrap`, `/commands` et `/reset` sont routés.
- `DELETE /game-api/account` est routé.
- `OPTIONS` répond avec les en-têtes CORS autorisés.
- Une origine non autorisée est refusée en `403`.
- Une requête sans authentification est refusée en `401`.
- Les commandes invalides sont refusées en `400` avant le service.
- Les erreurs internes sont normalisées en `503`.
- Chaque réponse porte `x-request-id`.
- Trois tests Vitest couvrent les parcours nominaux et d'erreur.

## Écarts réels corrigés

| Écart | Correction |
| --- | --- |
| Aucun handler testable ne regroupait les routes et les contrôles HTTP. | Handler Edge Runtime et tests injectés ajoutés. |

## Écarts déjà prévus dans des tickets futurs

| Sujet | Ticket prévu | Statut pour CDI-022 |
| --- | --- | --- |
| Intégration du client Supabase et adaptateur client | CDI-023 | Hors périmètre |
| Exécution métier des commandes et calculs de gameplay | CDI-025 à CDI-030 | Hors périmètre |
| Cache, reconnexion et contrôles hors ligne | CDI-024 et CDI-031 | Hors périmètre |
| Hardening CORS/payloads et audit de sécurité approfondi | CDI-034 | Complément ultérieur |

## Conclusion

Le contrat HTTP est couvert localement sans réseau réel. La CI distante sera
interrogée via le connecteur/API après le push ; l'absence de run sera déclarée
comme inconnue.
