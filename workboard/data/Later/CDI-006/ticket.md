---
id: CDI-006
title: Aligner les statistiques affichees du Donjon
status: Later
area: gameplay
priority: P1
size: S
risk: low
source: Audit du prototype CDIdle du 2026-07-15
depends_on: ["CDI-002"]
blocks: []
github_issue: "https://github.com/mathrondot-collab/CDIdle/issues/6"
related_docs: ["src/components/DungeonPanel.tsx", "src/utils/dungeonHelpers.ts"]
---

# CDI-006 — Aligner les statistiques affichees du Donjon

## Objectif

Supprimer la duplication des couples de statistiques d'encounter dans l'interface et garantir que le Donjon affiche toujours les attributs réellement utilises par le calcul.

## Resultat utilisateur

Pour chaque salle de test de statistiques, les attributs annonces correspondent exactement a ceux qui selectionnent le heros et calculent son score.

## Contexte

`getEncounterDetails` definit les couples canoniques `statA` et `statB`, tandis que `DungeonPanel.getEncounterUIInfo` recopie manuellement les libelles. Cette double source peut afficher une information differente du calcul sans erreur TypeScript.

## Perimetre autorise

- Exporter ou creer une fonction pure de formatage des attributs d'encounter.
- Faire deriver l'affichage de `getEncounterDetails(type).statA/statB` pour les six encounters de test.
- Centraliser la correspondance `str`, `agi`, `end`, `int`, `wiz`, `dex`, `luk` vers les libelles francais deja utilises par l'interface.
- Ajouter un test table-driven pour trap, enigma, ambush, ritual, obstacle et negotiation.

## Hors perimetre

- Ne pas changer les couples canoniques dans `getEncounterDetails`.
- Ne pas modifier la formule de score, le jet de chance, la difficulte, les recompenses ou les probabilites d'encounter.
- Ne pas refondre visuellement `DungeonPanel`.

## Contrat d'implementation

- La fonction d'affichage doit consommer les donnees canoniques, pas une seconde table de couples.
- Conserver les abreviations francaises actuelles, notamment `FOR`, `AGI`, `INT`, `SAG`, `DEX` et `CHA` pour Chance/LUK.
- `fight`, `treasure` et `rest` gardent leurs textes specifiques et ne doivent pas etre forces dans un faux test de statistiques.
- Le test doit comparer pour chaque type les deux cles canoniques et les deux libelles rendus.

## Dependances

CDI-002 doit etre `Done` pour disposer du harnais et des fixtures d'encounter.

## Criteres d'acceptation

- [ ] Une seule source definit les couples de statistiques des encounters.
- [ ] Les six encounters affichent les attributs de `getEncounterDetails` dans le meme ordre.
- [ ] Les encounters sans test gardent leur presentation actuelle.
- [ ] Aucun calcul, taux ou resultat de Donjon ne change.

## Tests

- `npm test -- --run`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run board:validate`

## Validation manuelle

- Ouvrir le panneau Donjon avec chaque type d'encounter fixture et comparer le couple affiche au couple retourne par `getEncounterDetails`.

## Preservation

- Preserver les textes narratifs, couleurs, emojis, calculs de selection et recompenses actuels.

## Risques

- Une normalisation excessive des libelles pourrait modifier des textes visibles hors Donjon. Garder la fonction ciblee aux attributs d'encounter.

## Handoff

Fournir la table type vers attributs/libelles testee, les fichiers touches, les commandes executees et la confirmation qu'aucune regle de Donjon n'a change.
