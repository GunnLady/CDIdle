---
id: CDI-062
title: Publier le frontend alpha sur Cloudflare Pages
status: Later
area: delivery
priority: P1
size: M
risk: high
source: Demande utilisateur du 2026-07-30
depends_on: ["CDI-035", "CDI-047", "CDI-049", "CDI-056", "CDI-066"]
blocks: []
github_issue: null
related_docs: ["docs/architecture/adr/0002-environments-and-zero-billing.md", "docs/deployment/cdi-035-runbook.md", ".github/workflows/deploy.yml", ".github/workflows/rollback.yml"]
---

# CDI-062 — Publier le frontend alpha sur Cloudflare Pages

## Objectif

Mettre le frontend statique CDIdle en ligne sur Cloudflare Pages, relié au
projet Supabase distant déjà validé, avec un déploiement frontend reproductible
et indépendant des migrations et de l'Edge Function.

## Resultat utilisateur

Le propriétaire et les alpha-testeurs autorisés peuvent ouvrir CDIdle depuis
une URL HTTPS stable, se connecter avec Google et retrouver leur partie sans
lancer Vite ni le backend local.

## Contexte

Le backend Supabase distant, Google OAuth, l'allowlist, `game-api` et les
parcours authentifiés ont été validés avec un frontend local. CDI-035 contient
déjà une première infrastructure de déploiement, mais le frontend n'a jamais
été hébergé. Les workflows existants couplent la publication web au déploiement
des migrations et de l'Edge Function et utilisent l'ancienne action
`cloudflare/pages-action@v1`.

Cette livraison reste une alpha contrôlée : l'URL est publique, mais l'accès au
jeu demeure limité par l'allowlist Supabase.

L origine Edge autorisée par défaut reste limitée à Vite local. La publication
Cloudflare doit donc disposer d une origine explicitement autorisée sans
élargir CORS à un joker. CDI-066 possède l alignement backend correspondant et
constitue le gate final avant cette mise en ligne.

## Perimetre autorise

- Créer et configurer un projet Cloudflare Pages Free pour le frontend alpha.
- Produire puis publier le répertoire Vite `dist/` sur une URL HTTPS
  `*.pages.dev`.
- Injecter au build uniquement `VITE_SUPABASE_URL` et la clé Supabase publique
  attendue par le frontend.
- Remplacer `cloudflare/pages-action@v1` par
  `cloudflare/wrangler-action@v3` dans le chemin de publication web.
- Rendre le déploiement et le rollback du frontend exécutables sans appliquer
  de migration ni redéployer `game-api`.
- Configurer l'URL alpha exacte dans la `Site URL` et les `Redirect URLs` de
  Supabase Auth.
- Valider depuis Cloudflare l origine exacte configurée et contrôlée par
  CDI-066, ainsi que le refus de toute origine inconnue.
- Ajouter les en-têtes statiques Cloudflare rentables : anti-sniffing,
  `Referrer-Policy`, `Permissions-Policy`, protection anti-iframe et CSP
  minimale compatible avec Supabase et les polices effectivement utilisées.
- Documenter les secrets GitHub/Cloudflare requis, la promotion, le smoke et le
  rollback sans consigner leur valeur.
- Produire des source maps liées au SHA comme artefact privé de diagnostic ou
  garantir leur reconstruction reproductible, sans les publier sur Cloudflare.
- Valider le frontend hébergé avec le compte Google allowlisté.

## Hors perimetre

- Ouvrir les inscriptions ou supprimer l'allowlist.
- Créer un second projet Supabase de production.
- Acheter ou configurer un domaine personnalisé.
- Modifier le gameplay, les contrats canoniques ou les données de partie.
- Appliquer une migration ou redéployer `game-api` lors d'un déploiement
  frontend seul.
- Introduire une offre payante Cloudflare, Supabase ou Google Cloud.
- Placer une clé `service_role`, un jeton utilisateur ou un secret OAuth dans
  le dépôt, les logs, les artefacts ou le bundle navigateur.
- Réimplémenter l authentification, le versionnement ou la collecte d erreurs,
  respectivement traités par CDI-063, CDI-064 et CDI-065.
- Ajouter un dashboard, des alertes, du monitoring d uptime ou des analytics.

## Contrat d'implementation

- Le build doit échouer explicitement si la configuration publique Supabase
  attendue est absente ou invalide.
- Le bundle peut contenir la clé publique/publishable Supabase prévue pour un
  client navigateur, mais aucun secret privilégié.
- Le workflow frontend doit être manuel ou protégé par un environnement GitHub
  et rester indépendant du chemin de déploiement backend.
- La production Cloudflare doit provenir du commit Git validé et du `dist/`
  construit par le workflow.
- Le rollback frontend doit sélectionner un artefact ou un commit antérieur
  sans rollback destructif de base de données.
- L'URL OAuth de retour doit correspondre exactement à l'origine Cloudflare
  utilisée par `window.location.origin`.
- CORS doit autoriser uniquement les origines locales conservées et l origine
  Cloudflare alpha exacte ; aucun joker n est accepté.
- Les en-têtes statiques ne doivent bloquer ni OAuth, ni les appels Supabase,
  ni les assets nécessaires, et doivent refuser l intégration en iframe.
- Les erreurs de publication et de smoke doivent être visibles sans exposer de
  secret ni de donnée personnelle.
- Les fichiers source map ne doivent pas faire partie du répertoire réellement
  envoyé à Cloudflare et restent accessibles uniquement comme artefact privé.

## Dependances

- CDI-035 — infrastructure et runbook de déploiement.
- CDI-047 — backend Supabase distant et smoke authentifié.
- CDI-049 — readiness du plan autoritaire.
- CDI-056 — client Supabase JS à jour.
- CDI-066 — backend Supabase aligné et validé pour l alpha.

## Criteres d'acceptation

- [ ] Une URL HTTPS Cloudflare Pages stable sert le frontend alpha.
- [ ] Le déploiement frontend utilise `cloudflare/wrangler-action@v3` et ne
  déclenche ni migration ni déploiement de `game-api`.
- [ ] Les variables Vite ciblent le projet Supabase distant attendu et aucun
  secret privilégié n'est présent dans le bundle ou les logs.
- [ ] Supabase Auth accepte exactement l'URL alpha comme `Site URL` et URL de
  redirection, tout en conservant le développement local autorisé.
- [ ] Google OAuth revient sur l'URL Cloudflare et la session survit à F5.
- [ ] L origine Cloudflare exacte peut appeler `game-api`, tandis qu une origine
  inconnue reçoit `CORS_FORBIDDEN`.
- [ ] Les en-têtes anti-sniffing, referrer, permissions, anti-iframe et CSP
  sont présents sans casser OAuth, Supabase ou les assets.
- [ ] Un bootstrap et une mutation autoritaire réussissent depuis le frontend
  hébergé, puis la mutation reste visible après F5.
- [ ] Les parcours offline/reconnexion et transfert de contrôle multi-onglet ne
  présentent aucune régression bloquante sur l'origine hébergée.
- [ ] Un rollback frontend vers une version antérieure est documenté et prouvé
  sans modification du backend.
- [ ] Le runbook distingue clairement alpha hébergée et production publique.
- [ ] Une stack frontend collectée peut être résolue avec les source maps du
  même SHA, et aucun fichier `.map` n est servi publiquement.
- [ ] Les offres gratuites et l'allowlist restent actives.

## Tests

- `npm.cmd run check`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run check:secrets`
- Inspection du bundle `dist/` pour secrets et URLs inattendues.
- Vérification que les source maps du SHA sont privées ou reproductibles et
  absentes du contenu publié sur Cloudflare.
- Contrôle du workflow afin de prouver qu'un déploiement frontend seul ne lance
  ni `supabase db push` ni `supabase functions deploy`.
- Smoke HTTP de l'URL Cloudflare et contrôle des assets après publication.
- Smoke CORS positif depuis l origine Cloudflare et négatif depuis une origine
  inconnue.
- Inspection des en-têtes HTTP et de la console navigateur après OAuth.

## Validation manuelle

Depuis un navigateur sans backend local :

1. ouvrir l'URL Cloudflare Pages et se connecter avec le compte Google
   allowlisté ;
2. vérifier le bootstrap 200, effectuer une mutation contrôlée et faire F5 ;
3. vérifier la conservation de la session et de la mutation ;
4. tester une courte coupure réseau puis la reconnexion ;
5. ouvrir deux onglets, transférer le contrôle et exécuter une commande ;
6. redéployer une version contrôlée puis prouver le rollback frontend sans
   changement de révision backend inattendu.

## Preservation

- Conserver le projet Supabase distant, ses migrations, son Edge Function et
  ses données hors des mutations du déploiement frontend.
- Conserver l'allowlist et les protections OAuth existantes.
- Conserver le développement local sur `http://127.0.0.1:3000`.
- Conserver les budgets de bundle, contrôles de secrets et validations CI.
- Conserver une liste CORS exacte sans `*` et les protections Edge existantes.
- Ne jamais versionner les identifiants Cloudflare, secrets GitHub ou clés
  privilégiées.

## Risques

- Une URL Supabase mal configurée peut renvoyer OAuth vers localhost ou refuser
  la connexion.
- Une origine Cloudflare absente provoquera `CORS_FORBIDDEN`; une origine trop
  large affaiblirait le cloisonnement du backend.
- Une CSP trop stricte peut bloquer Supabase, OAuth ou les polices distantes.
- Un mauvais découplage du workflow peut appliquer des migrations ou redéployer
  le backend lors d'un simple changement frontend.
- Une variable Vite privilégiée serait intégrée publiquement au bundle.
- Une source map publiée exposerait inutilement le code source de l alpha ; une
  source map absente ou d un autre SHA rendrait les stacks minifiées peu utiles.
- L'URL `pages.dev` rend l'interface publiquement accessible même si l'allowlist
  protège l'accès au jeu.
- Un rollback couplé au backend pourrait réintroduire une version incompatible
  de `game-api`.

## Handoff

Fournir l'URL Cloudflare, le commit et le workflow de déploiement, la liste des
configurations externes réalisées sans leurs valeurs, les preuves de build et
de smoke authentifié, le résultat du contrôle de secrets, la preuve de rollback
frontend et les éventuels écarts différés vers une vraie production publique.
