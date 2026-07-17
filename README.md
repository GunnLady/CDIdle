<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/816036e6-d0e7-466c-96c3-50e874ec98eb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copiez `.env.example` vers `.env.local` et renseignez les variables
   publiques `VITE_FIREBASE_*` du prototype
3. Run the app:
   `npm run dev`

Quality checks:

```powershell
npm run check
```

## Architecture et suivi

La cible d'architecture est documentée dans
[`docs/architecture/README.md`](docs/architecture/README.md). Le plan complet
se trouve dans [`docs/fullstack-authoritative-plan.md`](docs/fullstack-authoritative-plan.md).

Le suivi opérationnel se fait dans le
[`Workboard`](workboard/README.md) :

```powershell
npm run board
```
