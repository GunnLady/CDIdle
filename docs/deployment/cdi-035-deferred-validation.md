# CDI-035 — Validation staging différée

La promotion staging réelle et l’observation de 48 heures ne sont pas
exécutées dans cette livraison : les credentials et environnements distants ne
seront pas fournis.

Cette absence n’est pas présentée comme une preuve de succès. Elle est reportée
vers CDI-047 pour le smoke Edge/Supabase authentifié distant et CDI-048 pour les
parcours front online/offline/reprise.

Critères de reprise : compte de test, secrets hors dépôt, projet staging,
bootstrap 200, mutation contrôlée, puis checklist navigateur et observation
multi-compte. Aucun état de production ne doit être modifié.
