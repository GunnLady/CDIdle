---
id: CDI-052
title: Unifier les contrats canoniques client et serveur
status: Done
area: architecture
priority: P1
size: L
risk: high
source: Audit Eclipse du plan principal le 2026-07-23
depends_on: ["CDI-007", "CDI-008", "CDI-041"]
blocks: ["CDI-050", "CDI-051"]
github_issue: null
related_docs: ["docs/fullstack-authoritative-plan.md", "docs/architecture/game-state-v1.md", "docs/architecture/api-command-contracts.md", "shared/contracts/game-state.ts", "src/domain/commands.ts", "supabase/functions/game-api/town-authority.ts"]
---

# CDI-052 — Unifier les contrats canoniques client et serveur

## Objectif

Definir une source partagee et validee a l execution pour `GameStateV1`, les
enveloppes API et toutes les commandes autoritaires.

## Resultat utilisateur

Le front, l Edge Function, les tests et la base interpretent exactement les
memes champs et commandes, sans perte silencieuse au bootstrap ou au
rechargement.

## Contexte

L audit du plan a confirme plusieurs divergences :

- `totalCitizensCount` et `districts` cote serveur contre `totalCitizens` et
  `unlockedDistricts` dans le mapping React ;
- `currentEncounter` cote serveur contre `currentMonster` cote client ;
- `clientVersion` obligatoire dans l Edge Function mais absent de
  `CommandEnvelope` ;
- `hero.activity`, `hero.equip`, `rarity` et `modifiers` divergent entre les
  unions client et serveur ;
- les autorites serveur utilisent encore des `Record<string, unknown>` et
  redefinissent leurs propres contrats.

## Perimetre autorise

- Definir les schemas runtime partages de `GameStateV1`, `GameEnvelope`,
  `CommandEnvelope`, `GameCommand` et `CommandResult`.
- Aligner les noms de champs du bootstrap, du cache, du front et du serveur.
- Supprimer les unions de commandes dupliquees dans les autorites serveur.
- Valider les payloads complets, pas uniquement `command.type`.
- Ajouter une migration compatible pour les snapshots existants si necessaire.
- Ajouter des tests de contrat importables par Vite, Vitest et Edge Runtime.

## Hors perimetre

- Persister et avancer le RNG canonique, traite par CDI-050.
- Raccorder les composants React a `/commands`, traite par CDI-051.
- Modifier les regles, couts ou probabilites du gameplay.

## Contrat d'implementation

- Une seule definition gouverne chaque champ et chaque commande publique.
- Le bootstrap ne traduit pas silencieusement des noms de champs divergents.
- Les donnees transitoires et persistantes sont classees explicitement.
- Tout payload incomplet ou inconnu produit une erreur structuree.
- Les sauvegardes existantes restent lisibles ou migrent deterministiquement.

## Dependances

- CDI-007 — premier contrat `GameStateV1`.
- CDI-008 — premiers contrats API et commandes.
- CDI-041 — comportement HTTP reel de `game-api`.

## Criteres d'acceptation

- [ ] `GameStateV1` possede un schema runtime partage et versionne.
- [ ] Client, serveur, cache et bootstrap utilisent les memes noms de champs.
- [ ] `CommandEnvelope` inclut toutes les metadonnees requises, dont
  `clientVersion`.
- [ ] Toutes les commandes et leurs payloads sont definis une seule fois.
- [ ] Les autorites serveur n utilisent plus d unions publiques divergentes.
- [ ] Les tests echouent sur champ manquant, champ renomme ou payload invalide.
- [ ] Le contrat partage est importable par Vite, Vitest et Edge Runtime.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Comparer un bootstrap local reel au schema partage, puis verifier que chaque
champ applique par React correspond exactement au snapshot retourne.

## Preservation

Conserver les revisions, l idempotence, les sauvegardes existantes et les
reponses HTTP deja validees.

## Risques

Une migration incomplete peut rendre une sauvegarde illisible ou masquer une
valeur canonique sous un ancien nom de champ.

## Handoff

Fournir la matrice ancien champ vers champ canonique, les schemas partages, les
migrations et les tests de compatibilite entre runtimes.
