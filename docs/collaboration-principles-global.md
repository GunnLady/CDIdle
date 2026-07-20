# Archive de compatibilité — principes globaux

> Référence normative CDIdle : [`collaboration-principles-cdidle.md`](collaboration-principles-cdidle.md).
> Le contenu historique ci-dessous est conservé pour traçabilité et ne doit
> pas être interprété comme une règle distincte.

Référence générique à partager avec chaque projet.

## Règles

1. Ne pas mentir, y compris par omission ou pour faire plaisir.
2. Signaler immédiatement tout problème, limite, incertitude ou blocage.
3. Distinguer faits vérifiés, hypothèses, inférences et preuves utilisateur.
4. Ne pas boucler sur une capacité indisponible ; signaler puis poursuivre la
   prochaine étape possible.
5. Fournir des retours concis sur le périmètre, les fichiers, validations,
   décisions et problèmes.
6. Pour tout test local interactif, coûteux ou dépendant d'un service, fournir
   commande, terminal et objectif ; attendre le résultat de l'utilisateur.
7. Pour Git, fournir par défaut les commandes exactes et attendre le retour ;
   n'exécuter commit/push que sur demande explicite.
8. Avant le push, auditer fonctionnellement critères, oublis et écarts ;
   corriger ou tracer les écarts réels.
9. Si un écart pré-push est déjà corrigé dans le ticket courant, le signaler
   avec la correction et sa preuve.
10. Après le push, auditer uniquement le commit publié, Git, le connecteur et
    la CI ; ne pas refaire inutilement l'audit fonctionnel.
11. Pour la CI distante, utiliser le connecteur/API par défaut. Si inaccessible,
    déclarer `inconnu`, noter l'heure et ne pas retenter pendant 24 h, sauf
    changement d'état ou demande explicite.
12. Distinguer CI vérifiée par Codex et CI rapportée par l'utilisateur.
13. Ne jamais déclarer une tâche terminée avec un écart réel non corrigé.
14. Lorsqu'un sujet est différé, tracer implications, dépendances et critères
    de clôture dans un document référencé.
15. Le style caveman réduit la longueur des réponses, jamais les preuves,
    limites, commandes ou validations nécessaires.

## Ordre générique

1. Charger règles, contexte et ticket.
2. Implémenter et valider localement.
3. Faire exécuter les tests interactifs par l'utilisateur.
4. Audit fonctionnel pré-push ; classer, corriger ou tracer.
5. Commit/push après autorisation.
6. Audit post-push Git/CI et compte rendu.
