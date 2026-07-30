# Audit des oublis et écarts Supabase local — CDI-017

> Instantané historique : cet audit conserve les constats de son exécution.
> Le Workboard indique seul les statuts et écarts encore ouverts aujourd'hui.

Date : 2026-07-18

## Méthode

Cet audit compare l'état du dépôt et les artefacts du dossier `supabase/` au
contrat de `CDI-017` et au plan fullstack autoritaire. Les sujets explicitement
attribués à des tickets ultérieurs sont référencés sans être comptés comme des
oublis de `CDI-017`.

## Éléments propres à CDI-017

### CDI017-AUDIT-001 — CLI et exécution Docker non prouvées

La CLI Supabase n'est pas installée dans l'environnement courant. La
configuration locale est présente, mais `supabase start` et `supabase db reset`
n'ont pas encore été exécutés avec succès.

Action : conserver les commandes documentées et ajouter une vérification locale
reproductible ; installer la CLI dans l'environnement de développement avant
la validation finale du ticket.

### CDI017-AUDIT-002 — Migrations et seed non exécutés

La migration et le seed sont versionnés, mais aucune preuve d'import réel dans
une base Supabase locale n'est encore disponible.

Action : exécuter `supabase db reset`, conserver la sortie de validation et
vérifier la présence de l'entrée de seed.

### CDI017-AUDIT-003 — Preuve d'import du code partagé

Le point d import historique a été retiré lors du nettoyage CDI-066.
`supabase/shared-import-proof.ts` et son test Vitest importent désormais
directement `shared/contracts/authoritative.ts`, seule source du contrat, sans
réexport intermédiaire.

État actuel : conserver le contrat canonique partagé et sa preuve
compilée/testée, sans façade de compatibilité inutilisée.

## Sujets volontairement rattachés aux tickets suivants

### CDI017-AUDIT-004 — Schéma complet, RLS et pgTAP → CDI-018

Les tables, contraintes, politiques et tests RLS complets appartiennent à
`CDI-018`. Les éléments déjà présents dans la migration initiale sont un
échafaudage local et devront être complétés ou révisés dans ce ticket.

### CDI017-AUDIT-005 — Dispatcher et idempotence complète → CDI-021

La révision, l'empreinte, les limites de commandes et le commit atomique
complet sont du ressort de `CDI-021`. La fonction présente dans l'échafaudage
ne constitue pas la validation de ce ticket futur.

### CDI017-AUDIT-006 — Edge Function `game-api` → CDI-022

Les routes, JWT, CORS et erreurs HTTP ne doivent pas être implémentés dans
`CDI-017`.

## Conclusion

`CDI-017` est clôturé sur `main` au commit `3d30471`. Les oublis techniques
propres au ticket sont couverts par la configuration, l'exécution locale, le
seed et la preuve d'import partagée. Le schéma PostgreSQL, la RLS et les tests
pgTAP sont désormais livrés par `CDI-018`; les autres écarts restent suivis
par `CDI-021` et `CDI-022`.
