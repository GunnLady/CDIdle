# Instructions projet CDIdle

## Contexte d'exécution Codex

Les actions susceptibles d'être bloquées par le sandbox ou par des verrous de
processus sont documentées dans
[`docs/development/codex-elevation.md`](docs/development/codex-elevation.md).

Avant une commande potentiellement privilégiée, Codex doit :

1. annoncer l'action et sa cible exacte ;
2. demander une élévation ciblée si le sandbox la refuse ;
3. ne jamais demander une élévation globale ou utiliser une cible non vérifiée.

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
2. Cette autonomie couvre le flux normal d'un sous-lot demandé : inspection,
   édition, validation, audit pré-push, commit, push et contrôle post-push.
   `go`, `next` ou `continue` autorisent la poursuite de ce flux dans le
   périmètre actif.
3. Avant une mutation Git, Codex contrôle le statut, le diff et le périmètre
   afin de préserver les changements utilisateur sans rapport avec la tâche.
4. Les opérations destructrices, la réécriture d'historique, les suppressions
   de branches ou de tags et les modifications de remotes exigent une demande
   explicite et une cible vérifiée.
5. Codex ne déclare un commit, un push, une branche, une pull request ou une
   publication réussis qu'après avoir vérifié le résultat de la commande ou de
   l'API correspondante.
6. La CLI GitHub `gh` est installée, authentifiée et disponible dans
   l'environnement Codex CLI.
7. Si Git ou `gh` est indisponible dans la session courante, Codex le signale et
   fournit les commandes PowerShell exactes à exécuter manuellement.

## Déploiements CDIdle

1. Dans Codex CLI, Codex peut déclencher et surveiller en autonomie les
   déploiements GitHub Actions, Cloudflare Pages et Supabase nécessaires au
   périmètre demandé.
2. Le frontend est déployé par le workflow manuel
   `.github/workflows/deploy-frontend.yml`. Un push ne déclenche pas
   automatiquement ce déploiement.
3. La commande connue de déploiement backend est :

   ```powershell
   npm.cmd exec --offline -- supabase functions deploy game-api --project-ref tohujvjxcfarciotsnbp
   ```
4. Après un déploiement, Codex vérifie son état terminal et distingue le
   déclenchement, la réussite du workflow et la validation visuelle ou
   fonctionnelle de l'application.

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
