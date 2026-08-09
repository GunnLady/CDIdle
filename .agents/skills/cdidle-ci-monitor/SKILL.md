---
name: cdidle-ci-monitor
description: Surveiller sans bloquer les workflows GitHub Actions de CDIdle après un push, un déploiement, une relance ou une demande de suivi CI. Utiliser ce skill dès qu'un run GitHub doit être suivi jusqu'à son état terminal pendant que l'agent principal poursuit un autre travail utile.
---

# Surveiller GitHub Actions en arrière-plan

## Démarrage

1. Résoudre le dépôt, le workflow, le `run_id`, l'URL et le SHA attendu avec
   `gh`. Ne jamais sélectionner un run uniquement par son titre.
2. Vérifier `gh auth status` seulement si l'authentification n'est pas déjà
   établie dans la conversation.
3. Consulter les agents actifs. Si un slot est libre, lancer un agent secondaire
   avec une tâche bornée de surveillance et lui transmettre le `run_id`, le SHA
   attendu, le dépôt et les critères de compte rendu.
4. Continuer immédiatement le travail utile dans l'agent principal. Ne pas
   exécuter `gh run watch` dans l'agent principal lorsqu'une autre étape peut
   progresser.

## Tâche de l'agent de surveillance

Demander à l'agent secondaire de :

- confirmer que le run observé correspond au SHA attendu ;
- interroger `gh run view <run_id> --json status,conclusion,url,headSha,jobs`
  toutes les 20 à 30 secondes ;
- éviter les flux complets de logs et les mises à jour intermédiaires répétées ;
- à succès, retourner le statut, l'URL, la durée et les étapes importantes ;
- à échec, récupérer `gh run view <run_id> --log-failed`, isoler l'étape et
  l'erreur actionnable, puis retourner un diagnostic concis ;
- signaler explicitement un run annulé, expiré, introuvable ou associé à un
  autre SHA ;
- ne jamais relancer, annuler ou modifier un workflow sans demande distincte.

Le polling est en lecture seule. Une temporisation de 20 à 30 secondes est
acceptable ; ne jamais bloquer un appel unique plus de 60 secondes.

## Coordination

- Réserver un seul agent secondaire par run.
- Si un agent surveille déjà le même `run_id`, lui envoyer le contexte manquant
  au lieu d'en créer un autre.
- Quand l'agent secondaire termine, intégrer son résultat au prochain point de
  contrôle de l'agent principal, ou au début du prochain tour.
- Si aucun slot n'est libre, faire un polling ponctuel depuis l'agent principal
  entre deux étapes utiles. Utiliser `gh run watch` seulement lorsqu'il n'existe
  réellement aucun autre travail et qu'un résultat terminal est requis avant
  de continuer.
- S'il ne reste aucun travail utile après la délégation, rendre immédiatement
  la main à l'utilisateur avec le `run_id`, son URL et la mention que la
  surveillance continue en arrière-plan.
- Ne jamais garder le tour ouvert, appeler une attente de boîte aux lettres ou
  publier des mises à jour uniquement pour patienter jusqu'à la fin du run.
- L'utilisateur peut poursuivre avec une autre demande pendant la surveillance.
  Traiter cette demande normalement, puis intégrer le rapport terminal dès
  qu'il est disponible.

## Compte rendu terminal

Distinguer :

- CI ou déploiement vérifié par Codex via GitHub ;
- preuve rapportée par l'utilisateur ;
- validation visuelle ou fonctionnelle non réalisée.

Ne déclarer la réussite qu'après `status: completed` et `conclusion: success`.
Inclure le lien direct du run. En cas d'échec, présenter l'écart avant toute
correction, sauf si une demande `corrige` couvre déjà ce périmètre.
