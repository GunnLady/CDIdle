# Principes de collaboration

Ce document est une référence de travail partagée pour les échanges et les
modifications effectuées dans ce dépôt.

## Règles explicites

1. Ne pas mentir, y compris par omission ou pour faire plaisir.
2. Signaler clairement tout problème, incertitude, limite ou blocage.
3. Chercher ensuite une solution avec l'utilisateur, plutôt que masquer le
   problème ou improviser une certitude.
4. Faire de la vérité et du respect les bases de la collaboration.
5. À chaque fin de ticket, fournir un résumé des actions réalisées, puis
   effectuer un push propre et cohérent avec l'historique, en vérifiant que la
   CI passe.
6. Après le push final, exécuter systématiquement un audit post-push des
   critères du ticket, des oublis et des écarts. Distinguer les écarts réels
   de ceux déjà prévus dans un ticket futur ; corriger les écarts réels ou les
   tracer explicitement avant de déclarer le ticket terminé.
7. L'audit post-push doit décrire chaque constat trouvé et le classer
   explicitement : écart réel à corriger, écart déjà prévu dans un autre ticket,
   ou contrôle sans écart. Une conclusion globale ne remplace pas cette liste.

8. Pour la CI distante, utiliser par défaut le connecteur ou l'API GitHub.
9. Ne pas ouvrir le site GitHub pour vérifier la CI lorsqu'une vérification par
   connecteur/API est disponible.
10. Si le connecteur/API ne permet pas de vérifier le run, le signaler clairement
    comme inconnu, ne rien inventer, puis poursuivre l'étape suivante possible.
11. Travailler directement sur `main` pour ce projet ; ne pas créer de branche
    par ticket sauf demande explicite contraire.
12. Utiliser le workboard comme source de vérité pour le statut du ticket.
13. Passer le ticket à `Doing` au début du travail.
14. Passer le ticket à `Done` uniquement après implémentation, validations et
    audit post-push terminés.
15. Enchaîner les tickets tant qu'aucun blocage réel ne l'empêche ; signaler
    immédiatement tout blocage.
16. Au début d'un ticket, rappeler son périmètre, ses critères et les
    validations prévues.
17. Pendant le travail, fournir des retours sur le périmètre, les fichiers,
    validations, décisions et problèmes rencontrés.
18. Ne jamais déclarer `Done` avec un écart réel non corrigé.
19. Lorsqu'un sujet est différé, le tracer dans un document référençable et
    indiquer le ticket de suivi, s'il existe.
20. Pour chaque sujet différé, documenter ses implications, dépendances et
    critères de clôture.
21. Après un push, auditer l'état effectivement poussé, et pas seulement l'état
    local précédemment validé.
22. Distinguer dans les comptes rendus les preuves obtenues par Codex des
    vérifications manuelles rapportées par l'utilisateur.
23. Après tout changement de dossier ou de session, relire les règles, la
    documentation et l'archive de conversation disponibles.
24. Prendre en compte le contexte global du projet, pas uniquement le ticket
    actif.
25. Exécuter les actions demandées dans le périmètre convenu ; ne pas se
    limiter à déplacer un ticket ou à décrire une action non réalisée.
26. Signaler immédiatement toute limite technique et proposer une solution
    sûre et réaliste.
27. Ne pas boucler sur une capacité indisponible ou impossible ; passer à la
    prochaine étape possible après l'avoir signalé.
28. Respecter immédiatement toute demande d'arrêt.
29. Une CI verte rapportée par l'utilisateur est une preuve utilisateur ; elle
    doit être distinguée d'une preuve obtenue directement par Codex.
30. Conserver ce fichier de règles après les changements de dossier ou de
    session afin qu'il reste la référence persistante.
31. Partager cette référence avec les projets concernés, notamment
    `SpotifyCodex`.
32. Pour les tests locaux nécessitant Docker, Supabase, un service externe, une
    réinitialisation ou plusieurs essais interactifs, donner d'abord les
    consignes à l'utilisateur et lui laisser l'exécution, afin d'économiser les
    tokens. Ne lancer automatiquement que les validations locales simples,
    rapides et non interactives, sauf demande explicite contraire.
33. Pour tout test local interactif, coûteux ou dépendant d'un service, fournir
    explicitement la commande, le terminal à utiliser et l'objectif du test ;
    attendre le résultat communiqué par l'utilisateur avant de poursuivre.
34. Pour les opérations Git, fournir par défaut les commandes exactes à
    exécuter et attendre le retour de l'utilisateur ; n'exécuter commit ou push
    que sur demande explicite.

## Conséquences pratiques

- Distinguer les faits vérifiés, les hypothèses et les inférences.
- Ne pas déclarer une tâche terminée sans vérification proportionnée au risque.
- Signaler les commandes, changements ou effets externes importants avant de
  les effectuer lorsqu'une autorisation est nécessaire.
- Préserver les changements existants et ne modifier que le périmètre demandé.
- En cas de contexte manquant, le dire explicitement et utiliser le dépôt comme
  source de référence plutôt que prétendre se souvenir d'un échange absent.
- Si une vérification échoue, rapporter l'échec et sa cause connue au lieu de
  présenter un résultat supposé.
- En fin de ticket, résumer les fichiers et comportements modifiés, les
  vérifications exécutées, les risques résiduels et les décisions prises.
- Ne pousser que des commits cohérents avec le périmètre du ticket ; ne pas
  annoncer une CI verte sans preuve vérifiée.
- Pour tout test local potentiellement long ou coûteux en tokens, distinguer les
  commandes à exécuter manuellement des preuves obtenues directement par Codex.
- Le push final est unique pour le ticket : effectuer les corrections et les
  validations localement avant ce push. Un push correctif ultérieur n'est
  justifié que si l'audit post-push révèle un écart réel non détecté avant le
  push ; il doit alors être signalé comme tel.

Ce fichier est versionné dans le dépôt afin que ces principes restent
consultables après un changement de dossier ou de session.
