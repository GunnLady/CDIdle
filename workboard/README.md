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

Puis ouvrir `http://127.0.0.1:4173/`. Le serveur ecoute exclusivement sur
`127.0.0.1` et n'expose aucun jeton GitHub au navigateur.

Si un autre Workboard utilise deja 4173, lancer CDIdle sur un port temporaire :

```powershell
node workboard/server/server.mjs 4174
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

Le validateur controle les champs et sections obligatoires, les identifiants,
les chemins, le graphe de dependances, les cycles, les liens `blocks`, les
statuts executables et la limite WIP.

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
