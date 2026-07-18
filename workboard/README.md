# CDIdle Workboard

Le Workboard CDIdle est un tableau Kanban local, versionne avec le depot et
alimente par des tickets Markdown. Il constitue la source de verite pour le
contenu et les dependances des tickets. Les Issues GitHub en sont un miroir de
collaboration.

Le plan approuve qui gouverne ces tickets est conserve dans
[`docs/fullstack-authoritative-plan.md`](../docs/fullstack-authoritative-plan.md).

## Demarrage

```powershell
npm run board
```

Pour un demarrage idempotent (ne relance pas un serveur deja actif), utiliser :

```powershell
npm run board:start
```

Ajouter `-Open` a `workboard/scripts/start.ps1` pour ouvrir automatiquement
l'interface dans Google Chrome. La commande attend la reponse `/health` avant
de rendre la main et signale clairement un conflit de port.

Puis ouvrir l'URL affichee par la commande. Le serveur ecoute exclusivement
sur `127.0.0.1` et n'expose aucun jeton GitHub au navigateur. La configuration
versionnee est dans `workboard/config.json`; le port et l'instance active sont
memorises localement dans `.workboard.local.json` (ignore par Git).

Le demarrage idempotent reutilise une instance CDIdle identifiee par son
`projectId`; sinon il cherche un port libre dans la plage configuree sans
arreter un autre processus. Pour arreter une instance, utiliser :

```powershell
npm run board:stop
```

L'arret est refuse si `/health` ne confirme pas le meme projet et la meme
instance que l'etat local.

Si un autre Workboard utilise deja 4174, lancer CDIdle sur un port temporaire :

```powershell
node workboard/server/server.mjs 4175
```

## Contrat des dossiers

```text
workboard/data/
  ToDo/
  Doing/
  Later/
  Paused/
  Done/
    CDI-###/ticket.md
```

- Le dossier parent definit le statut reel du ticket.
- Le champ `status` du frontmatter doit rester identique au dossier parent.
- Un identifiant ne peut exister que dans une seule colonne.
- `ToDo` contient uniquement des tickets dont toutes les dependances sont
  `Done`.
- `Doing` est limite a trois tickets et suit la meme regle de dependances.
- Seul Sol deplace les tickets et synchronise GitHub dans le protocole Eclipse.

## Validation

```powershell
npm run board:validate
```

## Creation par API

`POST /api/tickets` accepte soit `{ "markdown": "..." }`, soit un ticket
structure avec `id`, `title`, `status`, `area`, `priority`, `size`, `risk`,
`source`, `depends_on`, `blocks`, `related_docs` et un objet `sections`.
Le serveur genere les sections manquantes, ecrit le fichier puis refuse toute
creation qui rendrait le Workboard invalide.

Le validateur controle les champs et sections obligatoires, les identifiants,
les chemins, le graphe de dependances, les cycles, les liens `blocks`, les
statuts executables et la limite WIP.

## Promotion Git et CI

Un ticket ne peut passer en `Done` qu'apres :

1. execution locale de `npm run check` et des tests propres au ticket ;
2. commit Git dedie contenant uniquement le perimetre du ticket ;
3. push de la branche vers le depot distant ;
4. CI GitHub verte sur le commit pousse.

Le handoff doit fournir le hash du commit, le lien du push ou de la PR et le
resultat de la CI. Une erreur CI laisse le ticket en `Doing` ou `Paused`.

## Synchronisation GitHub

La synchronisation est a sens unique, du fichier Markdown vers GitHub. Le mode
par defaut est une simulation :

```powershell
npm run board:sync
npm run board:sync:apply
```

La commande `board:sync:apply` exige une session `gh` authentifiee avec acces
au depot. Elle cree ou actualise les labels et Issues, ferme une Issue lorsque le ticket passe
en `Done`, puis renseigne `github_issue` dans le fichier local. Les commentaires
GitHub restent un journal distant et ne sont jamais reinjectes dans les tickets.
