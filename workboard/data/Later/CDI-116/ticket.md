---
id: CDI-116
title: Mesurer et stabiliser les performances des scènes complètes
status: Later
area: quality
priority: P1
size: M
risk: high
source: Demande utilisateur du 13 septembre 2026 - recadrage selon le plan amélioré
depends_on: ["CDI-108","CDI-109","CDI-110","CDI-111","CDI-112","CDI-114","CDI-115","CDI-129","CDI-130","CDI-131","CDI-132","CDI-133","CDI-134","CDI-135"]
blocks: ["CDI-104"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","docs/development/supabase-egress-budget.md","docs/development/ci-quality.md","scripts/check-bundle-budget.mjs","scripts/test-temporal-concurrency.mjs","tests/browser/canonicalPipeline.browser.spec.ts","tests/browser/dungeonPage.responsive.browser.spec.ts","AGENTS.md","docs/development/dungeon-2d-action-production-plan.md"]
---

# CDI-116 — Mesurer et stabiliser les performances des scènes complètes

## Objectif

Mesurer et stabiliser les budgets du produit complet avec toutes les scènes et tous les packs disponibles.

## Resultat utilisateur

Une longue session garde des scènes fluides, des ressources bornées et la même progression.

## Contexte

M réutilise les tests et instruments déjà ajoutés par les tickets. Il sépare la campagne de performance de la recette documentaire CDI-104.

Périmètre révisé le 13 septembre selon dungeon-2d-action-production-plan.md ; l’ancien découpage reste historique. La convergence des familles CDI-118–128 et des retouches A1/A2 est prouvée par CDI-135 ; les huit non-combats par 102/115/129–134.

## Perimetre autorise

Avec toutes les scènes et tous les packs disponibles, mesurer le scénario
représentatif et le maximal réel : JS gzip total/fichier 250/300 KiB, assets
supplémentaires à froid proposés à 2 MiB par scène/zone, egress et quinze
traces enrichies longues, charge hors vue, ressources sur cent rencontres.
Mesurer réellement la cible 60 FPS sur le poste PC de référence et consigner
matériel, navigateur, viewport et durée. Corriger uniquement les écarts de
performance localisés, sans changement de moteur/refactor global non justifié.
Une révision de budget nécessite une décision explicite. Ne pas confondre
preuves simulées d'horloge et mesures de rendu. Réutiliser les harnesses et
mesures progressivement ajoutés, sans bâtir un second moteur de test général.

## Hors perimetre

- Créer un second moteur général de simulation/test ou changer de moteur graphique sans justification et décision distincte.
- Mesurer les FPS à partir de fake timers, masquer des événements ou relever implicitement un budget.
- Refactor global, nouveaux effets de gameplay ou calibrage économique sans rapport.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Autonomie technique/Git limitée au chantier selon AGENTS.md ; aucun déploiement sans contre-ordre explicite.

## Contrat d'implementation

- Mesurer scénario représentatif et maximal réel, jusqu'à quatre héros/trois ennemis et 16 effets ; consigner matériel, navigateur, viewport, durée et environnement.
- JS : somme gzip ≤ 250 KiB, fichier ≤ 300 KiB ; assets supplémentaires à froid proposés ≤ 2 MiB par scène de zone et groupe, portraits préexistants mesurés séparément. Les nouvelles poses héros comptent dans les 2 MiB supplémentaires ; mesurer aussi la mémoire décodée, chargement utile et changements de groupe.
- Mesurer la cible réelle de 60 FPS sur PC, sans l'annoncer acquise avant preuve.
- Cent rencontres : pas de croissance de nœuds/timers/écouteurs, aucune boucle de scène hors vue, aucune commande supplémentaire.
- Historique ≤ quinze ; mesurer octets des traces longues et projection du budget egress. CDI-096 inventaire reste distinct.
- Corriger les écarts de performance localisés du périmètre ; toute révision de budget doit être explicitement acceptée.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-108 : Compléter les assets des Égouts infestés.
- CDI-109 : Produire les assets des Galeries des contrebandiers.
- CDI-110 : Produire les assets des Citernes oubliées.
- CDI-111 : Produire les assets du Bastion des Exclus.
- CDI-112 : Produire les assets de la Cour du Roi des Rats.
- CDI-114 : cycle des buffs/debuffs.
- CDI-115 : piège et socle des épreuves.
- CDI-129–133 : cinq autres épreuves, un écran par ticket.
- CDI-134 : trésor/repos après retouches héros.
- CDI-135 : couverture du combat continu et convergence artistique.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Le graphe révisé est terminé : CDI-135 pour le combat, CDI-129–134 pour les autres scènes et tous les tickets artistiques ajoutés après CDI-117 ; aucune retouche réelle non tracée ou non validée.
- [ ] Tous les packs CDI-108–112 et toutes les extensions intégrées sont présents dans la campagne, pas seulement le kit pilote.
- [ ] Poids JS, assets froid/cache et egress sont mesurés avec fichiers/scénarios et respectent les seuils ou une révision explicite acceptée.
- [ ] La fluidité réelle PC est documentée sur matériel identifié à 1024/1280/1440 px ; une simulation n'est pas donnée comme mesure de rendu.
- [ ] La campagne de cent rencontres prouve stabilité des ressources, absence de travail hors vue et cadence/compte de commandes identiques.
- [ ] Les profils petits/moyens/grands et quinze traces enrichies longues sont mesurés sans exposer de données sensibles.
- [ ] Les écarts constatés sont corrigés et retestés ou bloquent la clôture ; les preuves et limites sont prêtes pour CDI-104.

## Tests

- Réutiliser campagne du lecteur et harnesses déterministes ; documenter objectif, dépendances et limites de toute instrumentation ajoutée.
- npm.cmd run test:egress-budget
- npm.cmd run build
- npm.cmd run check:bundle
- Mesures réelles de rendu/ressources selon le cadre navigateur autorisé ; consigner appareils et protocole.
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

Les mesures réelles et contrôles visuels suivent AGENTS.md. Fournir commande PowerShell, terminal, objectif et résultat attendu pour toute capacité interactive indisponible, puis attendre la preuve.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Autonomie technique/Git du chantier selon AGENTS.md ; contrôles visuels par l’utilisateur ; zéro déploiement sans contre-ordre explicite.

## Risques

- Scène calme ou poste trop puissant donnant une confiance excessive.
- Une trace enrichie augmente l'egress sans ajouter de requête ; cache chaud masquant le coût à froid.

## Handoff

Fournir métriques, protocole reproductible, corrections/retests et limites ; référencer V16 et budgets du plan. CDI-104 consolide ces preuves avec les dix-huit validations.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
