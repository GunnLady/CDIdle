# Instructions projet CDIdle

## Contexte d'exécution Codex

Les actions susceptibles d'être bloquées par le sandbox ou par des verrous de
processus sont documentées dans
[`docs/development/codex-elevation.md`](docs/development/codex-elevation.md).

Avant une commande potentiellement privilégiée, Codex doit :

1. annoncer l'action et sa cible exacte ;
2. demander une élévation ciblée si le sandbox la refuse ;
3. ne jamais demander une élévation globale ou utiliser une cible non vérifiée.

Le PowerShell utilisateur reste la référence pour les processus interactifs,
Vite, Vitest, Supabase local et Docker.

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

Ces règles projet sont plus strictes que les éventuelles permissions Git
génériques.

1. L'utilisateur exécute toutes les commandes Git qui modifient le dépôt,
   l'index, les références, les branches ou les remotes.

2. Codex ne doit notamment jamais exécuter :
   - `git add`, `git rm`, `git mv` ;
   - `git restore`, `git checkout`, `git switch`, `git reset`, `git clean` ;
   - `git stash` ;
   - `git commit`, `git merge`, `git rebase`, `git cherry-pick`,
     `git revert` ;
   - création, suppression ou modification de branche ou de tag ;
   - `git fetch`, `git pull`, `git push` ;
   - création ou modification de pull request ;
   - toute commande Git équivalente qui modifie l'état local ou distant.

3. Codex peut exécuter uniquement les commandes Git en lecture seule nécessaires
   à ses contrôles et audits :
   - `git status` ;
   - `git diff` et `git diff --check` ;
   - consultation de l'historique avec `git log`, `git show`, `git blame` et
     `git reflog` ;
   - comparaison de commits, branches ou références avec `git diff <ref>` ;
   - consultation de la branche, des tags, des remotes et des références sans
     modification.

4. L'historique Git peut être utilisé pour retrouver l'origine d'une
   régression, contrôler le périmètre d'un commit, comparer une implémentation
   antérieure ou vérifier ce qui a réellement été publié.

5. Lorsque le sous-lot est prêt, Codex fournit à l'utilisateur les commandes
   PowerShell exactes, dans leur ordre d'exécution, avec le périmètre attendu.
   Codex attend ensuite le résultat rapporté par l'utilisateur.

6. Codex ne doit jamais interpréter `go`, `next`, `continue` ou une validation
   fonctionnelle comme une autorisation d'exécuter Git.

7. Une autorisation explicite de préparer, terminer ou publier un sous-lot
   signifie que Codex doit fournir les commandes Git ; elle ne l'autorise pas à
   les exécuter.

8. Codex ne doit pas déclarer un commit, un push, une branche ou une publication
   réussis sans résultat explicite fourni par l'utilisateur.

9. La CLI GitHub `gh` est considérée comme indisponible tant que l'utilisateur
   n'a pas explicitement confirmé son installation.

Les modifications normales des fichiers avec les outils d'édition restent
autorisées ; cette restriction concerne Git et la publication.

## Déploiements CDIdle

1. Le frontend est déployé manuellement par l'utilisateur depuis GitHub.
2. Ne jamais affirmer qu'un push déclenche automatiquement le déploiement du
   frontend.
3. La commande connue de déploiement backend est :

   ```powershell
   npm.cmd exec --offline -- supabase functions deploy game-api --project-ref tohujvjxcfarciotsnbp
   ```

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
