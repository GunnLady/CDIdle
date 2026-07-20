# Principes de collaboration CDIdle — référence normative unique

> Ce fichier conserve la version CDIdle la plus récente et fait autorité pour
> ce projet. Les autres fichiers sont des archives de compatibilité.

Ce fichier complète [les principes globaux](collaboration-principles-global.md).
En cas de conflit, la règle la plus spécifique à CDIdle prime.

## Règles spécifiques

- Travailler directement sur `main` ; ne pas créer de branche par ticket sauf
  demande explicite.
- Utiliser le Workboard comme source de vérité du statut et des dépendances.
- Passer un ticket à `Doing` au début ; passer à `Done` après l'audit pré-push
  sans écart réel.
- Enchaîner les tickets uniquement lorsqu'aucun blocage réel ne l'empêche.
- Pour Docker, Supabase, Kong/PostgREST et les tests externes, laisser
  l'exécution interactive à l'utilisateur.
- Conserver les règles et la documentation après changement de dossier/session.
- Partager ce socle avec les autres projets concernés, notamment SpotifyCodex.

## Ordre CDIdle

1. Charger le socle global, cet overlay, le contexte et le ticket.
2. Démarrer le Workboard si nécessaire et passer le ticket à `Doing`.
3. Implémenter, valider localement et fournir les commandes interactives.
4. Audit pré-push fonctionnel, correction/tracé des écarts.
5. `Done`, puis commandes Git et push après autorisation.
6. Audit post-push limité au commit publié, Git, connecteur et CI.
