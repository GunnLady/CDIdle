# Handoff — CDI-069, restructuration des écrans

## État du sous-lot

CDI-069 est toujours dans `workboard/data/Doing/CDI-069/ticket.md`. La
restructuration fonctionnelle des écrans Cité, Aventuriers, Donjon, Coffre,
Compte et du parcours d'entrée est implémentée. Ne pas recommencer cette
architecture : reprendre le dépôt et le ticket tels quels.

Le prochain contrôle attendu est visuel et appartient à l'utilisateur. Après
validation visuelle, faire l'audit fonctionnel pré-push, puis laisser
l'utilisateur exécuter les commandes Git.

## Réalisé

- shell, navigation et suivi du groupe restructurés ;
- pages Cité, Aventuriers, Donjon, Coffre et Compte découpées en composants et
  modèles de présentation dédiés ;
- historiques Cité, Donjon et Système séparés et plafonnés ;
- connexion, création de Cité et sélection des deux fondateurs extraites de
  l'ancien `LoginPage` ;
- portraits visibles et cartes de fondateurs entièrement sélectionnables, avec
  champ de nom indépendant ;
- recrutement normal extrait de `App.tsx` dans
  `src/components/heroes/RecruitmentOfferDialog.tsx` ;
- modale de recrutement compatible clavier, lecture seule et viewport court ;
- coût, capacité et priorité des refus de recrutement partagés entre le front
  et les handlers autoritaires, y compris dès `hero.recruit_offer` ;
- documentation d'architecture consolidée dans
  `docs/architecture/cdi-069-interface-architecture.md`.

`App.tsx` reste l'orchestrateur global ; ne pas lancer une nouvelle refonte
globale au milieu de la clôture de CDI-069.

## Preuves actuelles

Vérifiées par Codex :

- TypeScript : conforme ;
- ESLint : conforme ;
- Workboard : 88 tickets, 0 erreur ;
- `git diff --check` : conforme ;
- Vitest : 96 fichiers, 717 tests réussis.

Rapportées par l'utilisateur le 2026-08-09 :

- `npm.cmd run test:layout-browser` : 53/53 ;
- `npm.cmd run test:browser` : 1/1 après correction du sélecteur onboarding ;
- `npm.cmd run build` : réussi en 2,60 s ;
- `npm.cmd run check:bundle` : 212 923 B gzip, plus gros chunk 121 591 B.

La couverture n'a pas été rejouée après les toutes dernières additions de
tests. Ne pas la présenter comme une preuve récente sans nouveau résultat.

## Reprise recommandée

1. Lire `AGENTS.md`, le ticket CDI-069 et l'architecture associée.
2. Inspecter `git status` : le sous-lot complet est encore dans le worktree ;
   préserver toutes ces modifications.
3. Laisser l'utilisateur effectuer les contrôles visuels.
4. Corriger seulement les écarts réellement observés.
5. Faire l'audit fonctionnel pré-push final.
6. Donner les commandes Git exactes ; ne pas commit/push à la place de
   l'utilisateur.
7. Après push, contrôler uniquement Git/CI et les déploiements concernés.

## Déploiement à retenir

Les changements touchent le front et `game-api` :

- le front est déployé manuellement par l'utilisateur depuis GitHub ;
- commande backend connue :

```powershell
npm.cmd exec --offline -- supabase functions deploy game-api --project-ref tohujvjxcfarciotsnbp
```

Ne pas affirmer qu'un push déploie automatiquement le front.

