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

## Écarts réels restant à corriger

| Écart | Preuve | Action nécessaire |
| --- | --- | --- |
| Aucun point d'entrée `Deno.serve` n'était exporté. | Le fichier exposait uniquement `createGameApiHandler`. | Corrigé par `serveGameApi()` et son test. |
| Aucun service Supabase de production n'est branché. | Les quatre services sont obligatoirement injectés par l'appelant. | CDI-040 — adaptateur Auth/repository/dispatcher. |
| Le JWT n'est pas vérifié cryptographiquement par l'implémentation livrée. | Le handler délègue `authenticate` sans implémentation par défaut. | CDI-039 — vérification Supabase Auth et allowlist. |
| Aucun test d'exécution via le runtime Edge réel. | Les tests utilisent le handler en mémoire avec des services fictifs. | CDI-041 — smoke test Edge/Supabase local. |

Ces trois sujets sont désormais tracés dans
[`game-api-followups.md`](game-api-followups.md) et ne sont pas considérés
comme corrigés dans CDI-022.

## Écarts déjà prévus dans des tickets futurs

| Sujet | Ticket prévu | Statut pour CDI-022 |
| --- | --- | --- |
| Intégration du client Supabase côté navigateur et suppression Firebase | CDI-023 | Hors périmètre |
| Exécution métier des commandes et calculs de gameplay | CDI-025 à CDI-030 | Hors périmètre |
| Cache, reconnexion et contrôles hors ligne | CDI-024 et CDI-031 | Hors périmètre |
| Hardening CORS/payloads et audit de sécurité approfondi | CDI-034 | Complément ultérieur |

## Conclusion

Le contrat HTTP et l'entrée Edge sont couverts localement. Les services Supabase
concrets restent injectés par l'environnement d'exécution et l'intégration
client est prévue dans CDI-023 ; ils ne sont pas simulés ici. La CI distante
sera interrogée via le connecteur/API après le prochain push ; l'absence de run
sera déclarée comme inconnue.
