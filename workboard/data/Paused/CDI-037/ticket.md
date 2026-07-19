---
id: CDI-037
title: Audit global et migration horloge/RNG
status: Paused
area: domain
priority: P1
size: L
risk: medium
source: Extension utilisateur du plan fullstack autoritaire
depends_on: ["CDI-009", "CDI-010", "CDI-011", "CDI-012", "CDI-013", "CDI-014", "CDI-015", "CDI-016", "CDI-029"]
blocks: []
attack_speed_rng_note: "Remplacer Math.random dans le calcul des frappes multiples attackSpeed + speed par le Rng injecte, en conservant la formule et le plafond de trois frappes."
github_issue: null
tags: ["analyse"]
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/clock-rng.md", "docs/architecture/dungeon-progression-audit.md", "docs/architecture/zero-rebase-audit.md"]
---

# CDI-037 — Audit global et migration horloge/RNG

## Objectif

Auditer puis migrer les domaines et adaptateurs restants vers les dépendances
`Clock` et `Rng` injectées, afin de supprimer les accès directs non autoritaires
à `Date.now` et `Math.random`.

## Résultat utilisateur

Le domaine de jeu est reproductible en test et aucune mutation métier ne
dépend implicitement de l’horloge ou de l’aléatoire global.

## Périmètre autorisé

- Inventorier les accès directs dans `src/domain`, les hooks et les helpers.
- Migrer les appels métier vers les contrats CDI-009.
- Conserver les implémentations système uniquement aux frontières UI/bootstrap.
- Ajouter un contrôle CI empêchant la réintroduction d’accès directs dans le domaine.

## Hors périmètre

- Ne pas réécrire le gameplay ni changer les probabilités.
- Ne pas implémenter la persistance serveur de la graine (CDI-017/021).

## Critères d’acceptation

- [ ] L’inventaire des usages est documenté et chaque usage est classé.
- [ ] Les domaines concernés reçoivent `Clock`/`Rng` explicitement.
- [ ] Les tests métier sont reproductibles avec une horloge et une graine contrôlées.
- [ ] La CI détecte les nouveaux accès interdits dans le domaine.

## Tests

- npm test -- --run
- npm run lint
- npm run build
- npm run board:validate

## Dépendances

Les contrats CDI-009 et les domaines CDI-010 à CDI-016 doivent être disponibles
avant l’audit final.

## Resultat utilisateur

Le domaine est reproductible en test et aucune mutation metier ne depend
implicitement de l horloge ou de l aleatoire global.

## Contexte

CDI-009 fournit les contrats injectables ; ce ticket verifie leur adoption
complete apres migration des domaines.

## Perimetre autorise

- Auditer les acces directs et migrer les appels metier.
- Ajouter les controles et tests deterministes necessaires.

## Hors perimetre

- Ne pas changer les probabilites ni reecrire le gameplay.
- Ne pas implementer la persistance serveur de la graine.

## Contrat d'implementation

- Les dependances non deterministes sont explicites et injectees.
- Les frontieres systeme sont les seules a fournir l heure et l aleatoire reels.
- La migration hybride 2C de CDI-029 doit converger vers une resolution 2B
  entierement cote serveur.
- Le `Rng` injecte doit etre utilise par la resolution serveur 2B ; `Math.random`
  est interdit dans les mutations de combat, loot et progression.

## Dependances

Les contrats CDI-009 et les domaines CDI-010 a CDI-016 doivent etre disponibles.

## Criteres d'acceptation

- [ ] L inventaire des usages est documente et chaque usage est classe.
- [ ] Les domaines concernes recoivent `Clock`/`Rng` explicitement.
- [ ] Les tests metier sont reproductibles avec une horloge et une graine controlees.
- [ ] La CI detecte les nouveaux acces interdits dans le domaine.

## Validation manuelle

Verifier qu un meme seed et une meme horloge rejouent les memes mutations.

## Preservation

Conserver les probabilites et les contrats fonctionnels existants.

## Risques

Une migration partielle pourrait laisser des divergences entre domaines.

## Handoff

Fournir l inventaire, les usages migres et les exceptions justifiees.

## Progression

Pause explicite : la migration des tirages de combat de `useDungeonSystem.ts`
attend le contrat serveur autoritaire de CDI-029. La partie deja migree reste
conservee et controlee par le garde-fou deterministe.

L inventaire est trace dans `docs/architecture/clock-rng-audit.md`. Le domaine
pur (`src/domain`) ne contient plus d acces direct hors de la frontiere
`random.ts`, et `npm run check:determinism` protege cette regle en CI.

Les helpers gameplay `src/utils/gameCalculations.ts` et
`src/utils/dungeonHelpers.ts` acceptent maintenant un `Rng` explicite sans
changer les probabilites. Les hooks UI gardent des tirages locaux et sont
classes comme frontieres ou migrations gameplay ulterieures.

La suite `tests/utils.test.ts` passe a 49 tests. La declaration du script
`check:determinism` a ete dedupliquee dans `package.json`.
