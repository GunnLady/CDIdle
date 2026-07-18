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
- Le push final est unique pour le ticket : effectuer les corrections et les
  validations localement avant ce push. Un push correctif ultérieur n'est
  justifié que si l'audit post-push révèle un écart réel non détecté avant le
  push ; il doit alors être signalé comme tel.

Ce fichier est versionné dans le dépôt afin que ces principes restent
consultables après un changement de dossier ou de session.
