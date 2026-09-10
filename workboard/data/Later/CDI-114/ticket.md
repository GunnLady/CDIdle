---
id: CDI-114
title: Tracer et représenter les statuts, intentions et protections
status: Later
area: ui
priority: P1
size: L
risk: high
source: Demande utilisateur du 10 septembre 2026 - redécoupage approuvé des scènes Donjon 2D
depends_on: ["CDI-113"]
blocks: ["CDI-116"]
github_issue: null
related_docs: ["docs/development/dungeon-2d-encounter-plan.md","docs/development/dungeon-2d-resizing-proposal.md","src/components/dungeon/CurrentEncounterPanel.tsx","shared/domain/undercity-combat.ts","src/ui/foundations/tokens.css","shared/contracts/authoritative.ts","shared/domain/authoritative-dungeon.ts","shared/domain/undercity.ts","docs/development/canonical-state-migrations.md","docs/development/supabase-egress-budget.md","src/domain/encounterPlayback.ts","src/hooks/useEncounterPlayback.ts","src/domain/dungeonPresentation.ts","src/hooks/useAuthoritativeCommandDispatch.ts","tests/encounterPlayback.test.ts","src/components/dungeon/DungeonPage.tsx","src/components/dungeon/DungeonHistoryPanel.tsx","src/hooks/useDungeonAutomation.ts","src/hooks/useCrossTabGameSynchronization.ts","docs/development/dungeon-segment-ko-milestone-plan.md"]
---

# CDI-114 — Tracer et représenter les statuts, intentions et protections

## Objectif

Prouver de bout en bout la trace, la projection et le rendu des statuts, intentions et protections.

## Resultat utilisateur

Les buffs, debuffs et gardes du Roi sont visibles au bon moment, sur les bonnes cibles et pour leur durée réelle.

## Contexte

L regroupe un même contrat d'effet à travers producteur, projection et rendu. Une icône terminée sans preuve de début/fin ne suffit pas ; les ressources et la scène intégrée sont déjà fournies.

Périmètre approuvé dans dungeon-2d-resizing-proposal.md ; taille relative incluant tests, documentation et revue, hors attente utilisateur.

## Perimetre autorise

Tracer dans le domaine les débuts, cibles multiples, changements et fins des
buffs/debuffs/protections, intentions et phases du Roi ; projeter ces données
puis les rendre dans la scène intégrée. Une matrice de couverture clôture les
champs encore ouverts de 098. Tester mana/effets collectifs, expiration,
gardes/protection du Roi, changement d'intention et événement inconnu.

**Le L évite trois tickets artificiels de schéma, projection et icône qui
pourraient être déclarés terminés sans prouver la même durée d'effet.**
Préserver RNG/résultats et calendrier existants ; prouver compatibilité,
octets et pipeline local des changements persistés. Le rendu fonctionne avec
les fallbacks neutres tant que le pack 112 n'est pas prêt ; la recette finale
exige le Roi et ses gardes définitifs. Aucun système de statuts métier nouveau.

## Hors perimetre

- Créer de nouveaux effets métier, modifier équilibrage, RNG ou durée réelle des statuts.
- Production artistique du Roi/gardes : CDI-112 ; rendu neutre possible en attendant ce pack, sans remplacer sa validation finale.
- Parser les logs français ou laisser un effet visible faute de fin tracée.
- Pas de nouveau gameplay, moteur de combat, zone, ciblage ou récompense.
- Pas de commit, push ou déploiement sans les confirmations distinctes du projet.

## Contrat d'implementation

- Capturer début, auteur/cibles multiples, changements et expiration au point métier connu ; inclure intentions, protection des gardes et phases du Roi.
- Étendre la projection pure et le rendu intégré dans ce ticket ; clôturer les rubriques restantes de la matrice CDI-098.
- Conserver transcript unique, ordre canonique, calendrier historique (intention autrefois filtrée sans pas ajouté), compatibilité additive et historique borné.
- Les icônes/effets de présentation ont provenance, poids et fallback documentés ; ne pas signaler un état uniquement par couleur.
- Vérifier parité des sorties métier/RNG, egress et pipeline local des changements persistés.
- Respecter l'identité CDIdle, le périmètre et les budgets du plan ; aucune règle métier dans le rendu React.
- Pas de refactor collatéral, de commande depuis une animation, ni de progression dépendant d'une fin CSS.
- Ancien record ou donnée insuffisante : résumé fidèle et fallback neutre, jamais valeurs historiques inventées.

## Dependances

- CDI-113 : Animer les compétences, projectiles et soins du combat.

Les dépendances directes et leurs liens blocks font foi ; les acquis déjà livrés cités dans le plan restent à préserver.

## Criteres d'acceptation

- [ ] Buffs/debuffs simples et collectifs, changements, mana associé, expiration, intentions et protections sont couverts dans la matrice avec leurs vrais auteurs/cibles.
- [ ] Producteur, projection à t et rendu indiquent exactement le même début, état et fin d'effet.
- [ ] Gardes/protection du Roi et changement d'intention/phase sont représentés sans faux effet inventé.
- [ ] Aucun ajout visuel ne change durée de lecture, RNG, dégâts, choix de cible, loot ou récompense.
- [ ] Anciennes traces, événements inconnus et absence de métadonnées donnent un résumé fidèle ; les preuves locales couvrent compatibilité, persistance/replay et octets.
- [ ] Le rendu intégré respecte reduced-motion, annonces HTML, plafond d'effets et libération des ressources ; l'utilisateur valide les états représentatifs.
- [ ] Le pack CDI-112 reste obligatoire pour la recette finale du Roi/gardes ; son absence temporaire n'est pas déclarée couverture artistique complète.

## Tests

- Étendre authoritativeContracts, authoritativeDungeonGolden et les tests de projection/composants sur la même matrice d'effets.
- Fixtures buff/debuff multicible, expiration, soutien, gardes du Roi et changement d'intention.
- npm.cmd run check:determinism
- npm.cmd run test:egress-budget
- npm.cmd run test:integration (Supabase local pour les ajouts persistés).
- npm.cmd run build
- npm.cmd run check:bundle
- npm.cmd run typecheck
- npm.cmd run lint -- --quiet
- npm.cmd run board:validate

Ces validations sont à exécuter lors de l'implémentation du ticket ; le redécoupage documentaire ne les déclare pas passées.

## Validation manuelle

L'utilisateur vérifie buff/debuff et expiration puis Roi/gardes dans le combat intégré ; distinguer validation du comportement et validation artistique finale avec CDI-112.

## Preservation

- Conserver autorité serveur, RNG, résultats, XP, loot, révisions, idempotence et règles de segment.
- Aucun changement de cadence de progression, aucune commande réseau depuis une animation.
- Conserver les changements utilisateur et les autres écrans ; pas de refactor collatéral.
- Commit, push et déploiement suivent les confirmations AGENTS.md ; contrôles visuels par l'utilisateur.

## Risques

- Un statut sans fin explicite reste affiché indéfiniment.
- Afficher les intentions peut ajouter par erreur des pas de lecture et ralentir l'automatisation.

## Handoff

Fournir matrice de données complète, fixtures partagées producteur/projection/rendu, preuves de cadence/compatibilité/egress et verdict utilisateur. V04/V05/V14/V17/V18. Aucun champ nécessaire aux scènes actuelles ne reste sans propriétaire.

Indiquer fichiers, commandes réellement exécutées, résultats et limites. Ne pas clore avec un écart réel non corrigé ; ne pas attribuer au présent ticket la livraison de ses successeurs.
