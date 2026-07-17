# Workflow Eclipse

Le Workboard local est la source de vérité des tickets. GitHub Issues est un
miroir de collaboration, jamais une seconde source de statut.

## Rôles

- **Sol** pilote le ticket, déplace les dossiers et synchronise GitHub.
- **Luna** implémente dans le périmètre autorisé et fournit les preuves.

Un ticket ne change de colonne qu'après validation des critères d'acceptation,
des tests et de la préservation. `ToDo` et `Doing` ne contiennent que des
tickets dont les dépendances sont terminées ; `Doing` est limité à trois.

## Cycle

1. Sol choisit un ticket déblocable et confirme son périmètre.
2. Luna inspecte le dépôt, implémente sans élargir le contrat et exécute les
   commandes de validation du ticket.
3. Luna remet un handoff avec fichiers, résultats, risques et ambiguïtés.
4. Sol vérifie les preuves, déplace le ticket et lance la synchronisation
   GitHub si nécessaire.

Toute découverte hors périmètre devient un ticket séparé. Les décisions
produit ou d'architecture ne sont pas prises implicitement pendant une
implémentation.
