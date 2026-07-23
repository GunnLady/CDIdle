---
id: CDI-036
title: Couverture globale et seuils de qualite
status: Doing
area: testing
priority: P2
size: M
risk: low
source: Extension utilisateur du plan fullstack autoritaire
depends_on: ["CDI-034"]
blocks: []
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "package.json", "vitest.config.ts"]
---

# CDI-036 — Couverture globale et seuils de qualité

## Objectif

Mesurer la couverture globale de l application apres stabilisation des
domaines et definir des seuils utiles par zone.

## Resultat utilisateur

Le projet dispose d un rapport reproductible montrant les zones couvertes et
les zones critiques restant insuffisamment testees.

## Contexte

CDI-002 fournit une couverture informative du prototype. Ce ticket additionnel
complete le plan initial apres le hardening de CDI-034.

## Perimetre autorise

- Configurer le rapport global Vitest avec des exclusions justifiees.
- Distinguer metier, adaptateurs, UI, bootstrap et fichiers generes.
- Definir des seuils progressifs par domaine critique.
- Publier le rapport localement et dans la CI.

## Hors perimetre

- Ne pas ecrire de tests artificiels pour augmenter un pourcentage.
- Ne pas modifier le gameplay ou les contrats pour faciliter la couverture.
- Ne pas compter dist, mocks et fixtures comme code de production sans raison.

## Contrat d'implementation

- Le rapport fournit lignes, fonctions, branches et statements.
- Les seuils et exclusions sont versionnes et documentes.
- Les tests restent deterministes, sans reseau ni Firebase reel.

## Dependances

CDI-034 doit etre termine avant de fixer les seuils definitifs.

## Criteres d'acceptation

- [ ] Un rapport global reproductible est genere localement et en CI.
- [ ] Les exclusions sont explicites et justifiees.
- [ ] Les seuils par domaine critique sont documentes.
- [ ] Une baisse de couverture utile est detectee sans seuil artificiel.

## Tests

- npm run test:coverage
- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Validation manuelle

- Comparer les rapports local et CI sur le meme commit.
- Verifier qu un fichier genere exclu n ameliore pas artificiellement le score.

## Preservation

- Conserver la couverture informative de CDI-002 comme point de depart.
- Preserver des temps d execution raisonnables.

## Risques

- Un seuil unique pourrait masquer une zone metier dangereuse.
- Des exclusions trop larges pourraient donner une fausse impression de qualite.

## Handoff

Fournir le rapport, les seuils, les exclusions, les commandes, le temps
d execution et les zones restant volontairement sous le seuil.
