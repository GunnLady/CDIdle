# Rapports d erreurs de l alpha

CDI-065 conserve uniquement les erreurs techniques inattendues. Les reponses
4xx inattendues sont collectees, mais les erreurs d authentification `401`,
les refus CORS `403`, les conflits `409` et les limites `429` ne sont pas
envoyes.

## Donnees autorisees

- version du build ;
- date PostgreSQL ;
- categorie technique ;
- message et stack nettoyes et bornes ;
- `requestId` eventuel ;
- code d erreur et statut HTTP pour les reponses 4xx inattendues et 5xx ;
- surface UI ou route API.

Le rapport ne stocke ni utilisateur, email, JWT, payload de commande, etat de
partie, ressources, heros, inventaire ou transcript. Une cle supplementaire
dans le payload est refusee. Le compte authentifie sert seulement a limiter le
debit a 10 rapports par 10 minutes dans une table technique inaccessible.

## Analyse

La table est inaccessible aux roles navigateur et au `service_role`. La
lecture administrative se fait dans l editeur SQL Supabase :

```sql
select
  build_version,
  category,
  error_code,
  http_status,
  surface,
  count(*) as occurrences,
  min(request_id) as exemple_request_id,
  min(occurred_at) as first_seen,
  max(occurred_at) as last_seen
from public.alpha_error_reports
where occurred_at >= now() - interval '7 days'
group by build_version, category, error_code, http_status, surface
order by last_seen desc;
```

Pour examiner un groupe, selectionner uniquement `message`, `stack`,
`request_id` et `occurred_at` pour la version et la periode concernees.

## Stacks frontend et source maps

Les crashes React conservent la stack JavaScript et la pile des composants.
La version complete `git-<sha>` permet de retrouver exactement le code source.

Pour analyser une stack minifiee, reconstruire localement les source maps
depuis le commit concerne avec les memes variables publiques de build :

```powershell
git switch --detach <sha-du-rapport>
npm.cmd ci
$env:VITE_BUILD_SHA='<sha-du-rapport>'
npm.cmd run build -- --sourcemap hidden
```

Les fichiers `dist/**/*.map` sont des artefacts prives de diagnostic : ils ne
doivent jamais etre publies avec le frontend. Le workflow Cloudflare les
extrait avant publication et les conserve 30 jours comme artefact GitHub prive
nomme avec le SHA complet. La reconstruction ci-dessus reste le recours apres
expiration de cet artefact.

## Purge

La premiere revue est tracee par CDI-067 et ne doit pas avoir lieu avant le
29 aout 2026. Les erreurs importantes sont d abord transformees en tickets et
un resume non sensible est conserve. La duree de retention suivante est
decidee selon le volume reel.

Apres cette revue uniquement, les lignes explicitement jugees inutiles peuvent
etre supprimees avec une date bornee et un comptage avant/apres :

```sql
delete from public.alpha_error_reports
where occurred_at < now() - interval '30 days';

delete from public.alpha_error_report_rate_events
where occurred_at < now() - interval '10 minutes';
```

Une panne ou un refus du collecteur est silencieux cote jeu afin de ne jamais
masquer l erreur initiale ni creer une boucle de rapports.
