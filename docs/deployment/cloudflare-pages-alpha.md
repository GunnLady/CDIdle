# Frontend alpha sur Cloudflare Pages

Le frontend alpha est un projet Cloudflare Pages **Direct Upload**. Son
deploiement est independant du backend Supabase : il ne lance ni migration ni
deploiement de `game-api`.

## Configuration externe

Creer un environnement GitHub `cdidle-alpha` avec les variables publiques :

- `VITE_SUPABASE_URL` : URL du projet Supabase distant ;
- `VITE_SUPABASE_PUBLISHABLE_KEY` : cle `sb_publishable_...` du navigateur ;
- `CLOUDFLARE_PROJECT_NAME` : nom du projet Pages, recommande `cdidle-alpha` ;
- `CLOUDFLARE_ACCOUNT_ID` : identifiant non secret du compte Cloudflare.

Ajouter les secrets suivants :

- `CLOUDFLARE_API_TOKEN` : jeton limite a `Cloudflare Pages: Edit` sur le compte.

La cle publishable est publique par nature, mais aucune cle `sb_secret_`,
`service_role`, JWT utilisateur ou secret OAuth ne doit etre fourni au build.

## Creation initiale du projet

Le projet est cree une seule fois depuis PowerShell, apres authentification
Wrangler :

```powershell
npx.cmd --allow-scripts=esbuild,workerd wrangler@4.116.0 pages project create cdidle-alpha --production-branch main
```

Le workflow `CDIdle frontend alpha deploy` construit ensuite le commit choisi,
controle le bundle et publie `dist/` avec `cloudflare/wrangler-action@v4`.
Les source maps sont extraites avant publication et conservees 30 jours dans
un artefact GitHub prive nomme avec le SHA complet. Wrangler est pince en
`4.116.0` et npm autorise uniquement les scripts d'installation exacts de son
`esbuild` et de `workerd`.

## Relier l'origine Pages au backend

Une fois l'URL `https://<projet>.pages.dev` connue :

1. conserver `http://127.0.0.1:3000` dans les URL de redirection Supabase Auth ;
2. utiliser l'URL Pages comme `Site URL` et l'ajouter aux Redirect URLs ;
3. ajouter cette origine exacte a `GAME_API_ALLOWED_ORIGINS` dans les secrets
   Edge Function, sans joker ;
4. redeployer explicitement `game-api` une seule fois :

```powershell
npm.cmd exec --offline -- supabase functions deploy game-api
```

Un deploiement frontend ulterieur ne refait aucune de ces actions backend.

## Smoke apres publication

- ouvrir l'URL Pages sans backend local ;
- verifier Google OAuth, `bootstrap` 200 et la conservation de session apres F5 ;
- effectuer une mutation, faire F5 et verifier sa persistance ;
- verifier une coupure/reconnexion et le transfert de controle entre deux onglets ;
- verifier dans les reponses HTML les en-tetes CSP, anti-iframe, anti-sniffing,
  referrer et permissions ;
- verifier qu'une URL `.map` ne sert aucun JSON de source map : Cloudflare peut
  repondre 404 ou retourner le fallback SPA `200 text/html` ;
- verifier qu'une origine inconnue reste refusee par `CORS_FORBIDDEN`.

## Rollback frontend

Lancer `CDIdle frontend alpha rollback` avec le SHA d'un commit frontend deja
deployee et compatible avec `build:alpha`. Le workflow reconstruit ce commit,
publie uniquement `dist/` et ne modifie jamais Supabase. Apres rollback,
verifier la version affichee, un bootstrap et l'absence de changement inattendu
de revision de partie.

## Prune realise

L'ancien `cloudflare/pages-action@v1` et le couplage frontend/backend ont ete
retires des workflows de deploiement et rollback backend. L'audit des imports
et dependances directes n'a trouve aucun module de jeu supplementaire pouvant
etre supprime sans perte fonctionnelle. Les paquets extraneous observes dans
un `node_modules` ancien sont nettoyes par `npm ci` et ne sont pas declares dans
le projet.
