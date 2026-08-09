# Handoff — CDI-069, restructuration des écrans

## État du sous-lot

CDI-069 est clos dans `workboard/data/Done/CDI-069/ticket.md`. La
restructuration fonctionnelle des écrans Cité, Aventuriers, Donjon, Coffre,
Compte et du parcours d'entrée est implémentée. Ne pas recommencer cette
architecture : reprendre le dépôt et le ticket tels quels.

La validation visuelle utilisateur et l'audit fonctionnel pré-push sont
terminés. L'implémentation a été publiée sur `main` dans le commit `be04493`.
Le ticket a été déplacé en `Done` le 2026-08-09 après demande explicite de
l'utilisateur, validation de la CI et déploiement du backend et du frontend.

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
- projection de la bannière Donjon extraite dans le modèle de présentation
  partagé et exception de récupération du Compte documentée ;
- dette d'orchestration restante de `App.tsx` tracée dans `CDI-089` ;
- documentation d'architecture consolidée dans
  `docs/architecture/cdi-069-interface-architecture.md`.

`App.tsx` reste l'orchestrateur global ; ne pas lancer une nouvelle refonte
globale au milieu de la clôture de CDI-069.

## Preuves actuelles

Vérifiées par Codex :

- TypeScript : conforme ;
- ESLint : conforme ;
- Workboard : 89 tickets, 0 erreur ;
- `git diff --check` : conforme ;
- Vitest : 96 fichiers, 718 tests réussis.

Rapportées par l'utilisateur le 2026-08-09 :

- `npm.cmd run test:layout-browser` : 53/53 ;
- `npm.cmd run test:browser` : 1/1 après correction du sélecteur onboarding ;
- `npm.cmd run build` : réussi en 2,60 s ;
- `npm.cmd run check:bundle` : 212 923 B gzip, plus gros chunk 121 591 B.

La couverture n'a pas été rejouée après les toutes dernières additions de
tests. Ne pas la présenter comme une preuve récente sans nouveau résultat.

## Reprise recommandée

1. Lire `AGENTS.md`, le ticket CDI-076 et l'architecture issue de CDI-069.
2. Poursuivre CDI-076 depuis `workboard/data/Doing/CDI-076/ticket.md` sans
   reprendre l'implémentation fonctionnelle close de CDI-069.
3. Considérer `be04493` comme le commit fonctionnel publié et ne pas refaire
   l'audit pré-push sans modification fonctionnelle ultérieure.
4. Contrôler uniquement Git, la CI et les déploiements concernés.
5. La CI du commit fonctionnel final `17362cb` est vérifiée réussie dans le run
   GitHub Actions `31308627735`.
6. Le déploiement backend `game-api` est rapporté réussi par l'utilisateur ; le
   frontend alpha du même commit est vérifié déployé par Codex dans le run
   `31309156183`.

## Déploiement à retenir

Les changements touchent le front et `game-api` :

- le front est déployé manuellement par l'utilisateur depuis GitHub ;
- commande backend connue :

```powershell
npm.cmd exec --offline -- supabase functions deploy game-api --project-ref tohujvjxcfarciotsnbp
```

Ne pas affirmer qu'un push déploie automatiquement le front.
