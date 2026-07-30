# Migration npm 12

## Versions de reference

- Node.js : `24.18.0` LTS.
- npm : `12.0.1`.
- Installation canonique : `npm.cmd ci` sous Windows, `npm ci` en CI.

`packageManager`, `engines`, `devEngines`, `.nvmrc` et les trois workflows
portent les memes versions. `devEngines` refuse une commande projet lancee avec
un autre runtime ou gestionnaire de paquets.

## Migration locale Windows

La mise a niveau initiale doit etre lancee hors du depot afin que npm 11 ne
rencontre pas la contrainte `devEngines` destinee a npm 12 :

```powershell
Push-Location $env:TEMP
npm.cmd install --global npm@12.0.1 --ignore-scripts
Pop-Location
npm.cmd --version
npm.cmd ci
```

La version affichee doit etre `12.0.1`.

## Matrice des changements npm 12

| Changement npm 12 | Usage CDIdle | Decision |
| --- | --- | --- |
| Node `^22.22.2 || ^24.15.0 || >=26` requis | Node 24 LTS | Node `24.18.0` epingle |
| Git et URL distantes refuses par defaut | Aucun paquet Git, URL ou tarball | `allow-git=none` et `allow-remote=none` explicites |
| Scripts d'installation bloques par defaut | `esbuild` requis; `fsevents` optionnel | `esbuild@0.25.12` autorise, `fsevents` refuse |
| Options inconnues ou abregees refusees | Aucune option invalide detectee | Options longues conservees |
| `npm view --json` renvoie toujours un tableau | Aucun parseur de cette sortie | Sans impact |
| Sorties JSON de `pack` et `publish` modifiees | Projet prive non publie | Sans impact |
| `npm shrinkwrap` supprime | `package-lock.json` utilise | Sans impact |
| Commandes `star`, `stars`, `unstar`, `adduser` supprimees | Non utilisees | Sans impact |
| `preinstall` racine execute plus tot | Aucun script racine d'installation | Sans impact |
| Pages de manuel globales non enregistrees | Non utilisees | Sans impact |

Le lockfile ne contient aucune source hors `registry.npmjs.org`. Les seuls
paquets marques `hasInstallScript` sont `esbuild@0.25.12` et l'optionnel
`fsevents@2.3.3`. Supabase CLI, Lightning CSS et Tailwind/Oxide utilisent les
binaires deja publies dans ce graphe et ne demandent aucun script
d'installation.

Les scripts projet invoquent les binaires locaux par `npm run` ou
`npm exec --offline`; aucun telechargement implicite par `npx` n'est conserve.

## Verification de reproductibilite

Depuis une copie propre du depot :

```powershell
npm.cmd --version
npm.cmd ci
git diff -- package-lock.json
npm.cmd ci
git diff -- package-lock.json
```

Les deux installations doivent passer et le second diff doit etre vide. La CI
Ubuntu repete l'installation avec Node `24.18.0` et npm `12.0.1` avant les
controles complets.

## Rollback vers npm 11

Le rollback outil ne modifie ni les donnees ni le code applicatif :

```powershell
Push-Location $env:TEMP
npm.cmd install --global npm@11.16.0 --ignore-scripts
Pop-Location
npm.cmd --version
```

Pour rendre ce rollback permanent dans le depot, restaurer ensemble
`package.json`, `package-lock.json`, `.npmrc`, `.nvmrc` et les workflows depuis
le commit precedant CDI-055. Ne jamais melanger un lockfile regenere par npm 12
avec une configuration declaree npm 11.
