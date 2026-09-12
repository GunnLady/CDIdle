# Instructions projet CDIdle

## Contexte d'exécution Codex

Les actions susceptibles d'être bloquées par le sandbox ou par des verrous de
processus sont documentées dans
[`docs/development/codex-elevation.md`](docs/development/codex-elevation.md).

Avant une commande potentiellement privilégiée, Codex doit :

1. annoncer l'action et sa cible exacte ;
2. demander une élévation ciblée si le sandbox la refuse ;
3. ne jamais demander une élévation globale ou utiliser une cible non vérifiée.

### Incident connu du sandbox Windows

Sur ce poste, le backend Windows `elevated` échoue avant le lancement de toute
commande avec `helper_unknown_error: setup refresh had errors`. Le journal
`%USERPROFILE%\.codex\.sandbox\sandbox.<date>.log` montre alors
`SetNamedSecurityInfoW failed: 5` pendant la pose des ACE de protection sur
`.git` et `.codex`. Il s'agit d'un incident du sandbox Codex Windows, pas d'un
échec de PowerShell, Git ou du projet.

Procédure obligatoire :

1. ne faire qu'une tentative sandboxée ; ne pas réessayer avec un autre shell ;
2. confirmer une seule fois le motif dans le dernier journal sandbox ;
3. si le motif est confirmé, poursuivre immédiatement avec des commandes hors
   sandbox à élévation ciblée et des cibles explicites ;
4. ne pas réinitialiser ni bricoler les ACL de `.git` ou `.codex` : ce n'est
   pas une correction démontrée et cela peut endommager les protections ou Git ;
5. utiliser le fallback officiel `[windows] sandbox = "unelevated"`, redémarrer
   Codex, puis valider avec `Get-Location` sans élévation. Revenir à `elevated`
   seulement après une mise à jour Codex corrigeant l'incident et un test réussi.

Le fallback `unelevated` conserve un sandbox Windows à jeton restreint ; ce
n'est ni `danger-full-access` ni une autorisation globale. Les opérations qui
sortent de ses capacités continuent d'exiger une élévation ciblée.

Dans une session Codex CLI, Codex exécute de manière autonome toutes les
commandes nécessaires au périmètre demandé : Git, GitHub CLI, tests, builds,
Vite, Vitest, Supabase local, Docker et déploiements. Les contraintes du
sandbox et les élévations ciblées restent applicables.

Le PowerShell utilisateur devient le recours lorsque l'action exige une session
interactive, une interface graphique, un périphérique ou une capacité
indisponible dans Codex CLI. Dans ce cas, Codex fournit la commande, le terminal
et l'objectif exacts, puis attend le résultat.

## Collaboration et contrôles

1. Pour les travaux d'interface, Codex réalise les contrôles structurels et
   techniques. L'utilisateur réalise les contrôles visuels, sauf demande
   explicite contraire.
2. Ne pas ouvrir, piloter ou inspecter l'application avec un navigateur sans
   autorisation explicite de l'utilisateur.
3. Lors d'un audit, présenter les écarts avant correction avec leur priorité et
   leur rentabilité.
4. Si l'utilisateur demande explicitement `corrige` ou `corrige tout`, cette
   demande autorise les corrections du périmètre présenté sans demander une
   seconde validation.
5. Après correction, refaire un contrôle structurel et technique ciblé :
   critères fonctionnels, oublis, régressions, compatibilité front, code mort
   et refactors injustifiés.

## Autorisation active — chantier Donjon 2D

Pour le goal utilisateur « dérouler le reste du plan avec une vision globale et
relire avant de finir chaque ticket », l'utilisateur délègue explicitement à
Codex, pendant toute la durée de ce goal :

1. les validations structurelles et techniques, tests locaux, builds et
   contrôles navigateur autorisés ;
2. les mutations Git non destructrices nécessaires, notamment `add`, `commit`
   et `push`, ainsi que le suivi CI après publication, sans redemander de
   confirmation à chaque ticket ;
3. l'enchaînement autonome des tickets du plan après audit et validation de
   leurs critères.

L'utilisateur reste sollicité uniquement pour une décision fonctionnelle ou
technique réellement nécessaire et pour les validations visuelles. Aucun
déploiement frontend, backend, Cloudflare ou Supabase n'est autorisé sans un
contre-ordre explicite immédiat. Un commit ou un push ne constitue jamais ce
contre-ordre. Cette autorisation limitée au chantier Donjon 2D prime sur les
points 2 et 3 de « Git et publication » ci-dessous et cesse à la clôture ou à
l'annulation du goal.

## Architecture et refactors

1. Maintenir les règles métier dans le domaine partagé.
2. Préparer les modèles de présentation hors des composants React.
3. Limiter les composants au rendu, aux interactions locales et aux callbacks
   nécessaires.
4. Séparer les responsabilités de transport, d'orchestration, de présentation
   et de domaine.
5. Éviter les refactors collatéraux sans bénéfice direct pour le sous-lot.
6. Avant de supprimer un helper ou une abstraction historique, vérifier ses
   usages réels, notamment avec `rg`, puis supprimer proprement le code devenu
   mort et ses tests obsolètes.
7. Pour une refonte d'interface, valider d'abord la structure, les actions et le
   responsive avant de travailler le design system ou l'habillage final.

## Stratégie de validation

1. Préférer les simulations, harnesses et tests automatisés déterministes aux
   longues procédures manuelles.
2. Documenter l'objectif, le fonctionnement, les dépendances et les limites des
   moteurs de test ou de simulation ajoutés.
3. Ne pas remplacer une preuve réelle nécessaire par une simulation ; utiliser
   chaque niveau de test pour le risque qu'il doit couvrir.
4. Réutiliser les commandes et décisions déjà établies dans le projet. Ne pas
   relire systématiquement tous les scripts pour redécouvrir une commande
   connue, sauf si le dépôt a changé ou qu'un doute réel existe.

## Git et publication

1. Dans Codex CLI, Codex peut exécuter en autonomie toutes les commandes Git et
   `gh` nécessaires au travail demandé, y compris `add`, `commit`, `push`,
   gestion de branches, consultation ou création de pull requests et
   déclenchement de workflows.
2. Cette autonomie couvre l'inspection, l'édition, les tests, l'audit pré-push
   et, après confirmation explicite de l'utilisateur, le commit, le push et le
   contrôle post-push. Une confirmation peut autoriser une séquence précisément
   annoncée de commit et push.
3. Codex demande toujours une confirmation explicite immédiatement avant un
   commit ou un push. `go`, `next`, `continue` ou une validation
   fonctionnelle ne constituent jamais cette confirmation.
4. Avant une mutation Git, Codex contrôle le statut, le diff et le périmètre
   afin de préserver les changements utilisateur sans rapport avec la tâche.
5. Les opérations destructrices, la réécriture d'historique, les suppressions
   de branches ou de tags et les modifications de remotes exigent une demande
   explicite et une cible vérifiée.
6. Codex ne déclare un commit, un push, une branche, une pull request ou une
   publication réussis qu'après avoir vérifié le résultat de la commande ou de
   l'API correspondante.
7. La CLI GitHub `gh` est installée, authentifiée et disponible dans
   l'environnement Codex CLI.
8. Si Git ou `gh` est indisponible dans la session courante, Codex le signale et
   fournit les commandes PowerShell exactes à exécuter manuellement.

## Déploiements CDIdle

1. Dans Codex CLI, Codex peut déclencher et surveiller en autonomie les
   déploiements GitHub Actions, Cloudflare Pages et Supabase nécessaires au
   périmètre demandé, après confirmation explicite de l'utilisateur.
2. Codex demande cette confirmation immédiatement avant de déclencher le
   déploiement. `go`, `next`, `continue`, un commit ou un push ne
   constituent jamais une confirmation de déploiement.
3. Le frontend est déployé par le workflow manuel
   `.github/workflows/deploy-frontend.yml`. Un push ne déclenche pas
   automatiquement ce déploiement.
4. Dans Codex CLI, lorsque `gh` est installé et authentifié, Codex déclenche
   lui-même le déploiement frontend après la confirmation explicite requise,
   avec la commande suivante :

   ```powershell
   gh workflow run deploy-frontend.yml --repo GunnLady/CDIdle --ref main
   ```

   Il ne renvoie cette commande à l'utilisateur que si `gh`, l'authentification
   ou une capacité nécessaire est réellement indisponible.
5. La commande connue de déploiement backend est :

   ```powershell
   npm.cmd exec --offline -- supabase functions deploy game-api --project-ref tohujvjxcfarciotsnbp
   ```
6. Après un déploiement, Codex vérifie son état terminal et distingue le
   déclenchement, la réussite du workflow et la validation visuelle ou
   fonctionnelle de l'application.

## Surveillance asynchrone CI et déploiements

1. Après un push, une relance ou un déploiement GitHub Actions, utiliser le
   skill projet `cdidle-ci-monitor`.
2. Déléguer par défaut le polling du run à un agent secondaire et poursuivre le
   travail utile dans l'agent principal.
3. Ne pas bloquer l'agent principal avec `gh run watch` lorsqu'une autre étape
   du sous-lot peut avancer.
4. Après délégation, rendre immédiatement la main s'il ne reste aucun travail
   utile, en signalant une seule fois que la surveillance continue. Remonter
   ensuite l'état terminal, ou immédiatement un blocage exigeant une décision.
5. Si aucun slot d'agent n'est libre, effectuer des contrôles ponctuels à faible
   fréquence entre les autres étapes.

## Replay autoritaire local

Pour rejouer manuellement une commande sans copier de bearer :

1. récupérer dans `public.game_commands` le `command_id`,
   `expected_revision` et la nature de la commande à vérifier ;
2. depuis la console Chrome ouverte sur le frontend local, importer
   `supabase` avec `await import("/src/lib/supabase.ts")`, puis obtenir la
   session avec `supabase.auth.getSession()` ;
3. renvoyer sur `/functions/v1/game-api/commands` exactement le même envelope :
   même `commandId`, même `idempotencyKey`, même `expectedRevision`, même
   `clientVersion` et même `command` ;
4. ne pas réinjecter manuellement la réponse dans l'interface ;
5. vérifier `HTTP 200`, `ok: true`, `replayed: true`, une seule ligne pour le
   `command_id` dans `public.game_commands` et l'absence de duplication dans
   l'état canonique.

Le token doit être lu depuis la session courante et ne doit jamais être écrit
dans la documentation, les commandes partagées ou Git.
