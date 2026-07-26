---
id: CDI-059
title: Securiser et restaurer forge, plans et recyclage
status: Done
area: integration
priority: P0
size: L
risk: high
source: Audit fonctionnel forge, craft, scrap et objets du 2026-07-26
depends_on: []
blocks: ["CDI-051"]
github_issue: null
related_docs: ["docs/architecture/cdi-059-audit.md", "docs/architecture/forge-domain.md", "docs/architecture/forge-domain-audit.md", "docs/architecture/cdi-028-audit.md", "docs/architecture/inventory-domain.md", "docs/development/cdi-051-authoritative-ui-validation.md", "supabase/functions/game-api/forge-authority.ts", "supabase/functions/game-api/inventory-authority.ts", "src/components/TownPanel.tsx", "src/components/StoragePanel.tsx"]
---

# CDI-059 - Securiser et restaurer forge, plans et recyclage

## Objectif

Corriger immediatement les ruptures autoritaires de l economie, de la forge
novice, des plans, du recyclage et de l identite des exemplaires d equipement
sans attendre la definition du catalogue complet des objets.

## Resultat utilisateur

La forge novice produit toujours l objet attendu, les plans visibles
correspondent aux recettes autorisees, le recyclage reste exact et aucune
commande cliente ne permet de creer gratuitement des objets ou materiaux.
Deux exemplaires du meme modele restent distinguables et conservent leur
identite entre loot, coffre, equipement, forge, recyclage et replay.

## Contexte

L audit du 26 juillet 2026 a prouve quatre groupes d ecarts. Les commandes
publiques `inventory.add` et `inventory.remove` permettent de contourner l
economie. La finalisation UI envoie `accepted: false` pour une fabrication
standard, que le serveur traite comme un abandon apres consommation du cout.
Les nouvelles parties ont une liste de plans vide tandis que le serveur
ignore cette liste. Enfin, le recyclage nominal est atomique mais doit etre
durci contre les payloads invalides et les exemplaires ambigus. `itemId`
identifiait jusque-la le modele sans identifier chaque exemplaire persiste.

## Perimetre autorise

- Retirer `inventory.add` et `inventory.remove` de la surface de commandes
  cliente ou leur imposer une autorite interne serveur explicite.
- Valider strictement les payloads inventaire, forge et recyclage.
- Restaurer les six plans historiquement forgeables parmi les sept objets
  novice uniquement.
- Distinguer finalisation de l objet, acceptation de l amelioration et
  annulation de la fabrication.
- Produire l objet commun lorsque l amelioration est refusee ou absente.
- Restaurer le proc autoritaire 85 % standard, 13 % inhabituel et 2 % rare
  avec resultat persiste et rejouable.
- Consommer les couts d amelioration cote serveur et valider le modificateur.
- Corriger `critChance` vers `criticalChance` et aligner les resistances
  proposees avec celles reellement applicables.
- Initialiser et migrer les plans novice puis les verifier cote serveur.
- Durcir le recyclage des cinq raretes et la comparaison des modificateurs.
- Corriger l identite React des instances partageant objet et rarete mais ayant
  des modificateurs differents.
- Appliquer les effets generaux, la rarete et les modificateurs des sept objets
  novice au recalcul des statistiques des Novices et des neuf classes Tier 1.
- Ajouter un `instanceId` unique a chaque equipement persiste dans le coffre ou
  sur un heros ; `itemId` reste la reference du modele catalogue.
- Produire des identites deterministes pour forge et loot de donjon sans tirage
  RNG supplementaire.
- Deplacer l instance exacte lors de l equipement et du desequipement, la
  restituer au coffre lors du renvoi d un heros et la supprimer exactement une
  fois lors du recyclage.
- Conserver l `instanceId` strictement technique et non expose ; distinguer les
  exemplaires par leurs cartes, raretes et modificateurs utilisateur.
- Ajouter les tests unitaires, integration UI et replay necessaires.

## Hors perimetre

- Definir ou rendre equipables les 124 objets hors catalogue novice.
- Definir ou recalculer les classes Tier 1 depuis les 124 objets du catalogue
  complet hors catalogue novice.
- Brancher les tables de butin de boss ou leurs plans avances.
- Reequilibrer les couts, taux de proc ou recompenses de recyclage sans
  decision produit explicite.

## Contrat d'implementation

- Une commande HTTP cliente ne peut jamais creer directement un objet ou un
  materiau.
- `forge.start` consomme atomiquement le cout de base, verifie le plan et
  persiste le proc avec le RNG canonique.
- `forge.finalize` cree exactement un objet ; `acceptUpgrade` ne concerne que
  l amelioration optionnelle.
- `forge.cancel` est la seule action qui supprime une preview sans produire
  l objet et conserve la regle explicite de consommation du cout de base.
- Une preview ne peut etre finalisee ou annulee qu une fois.
- Le replay conserve preview, rarete, materiaux, objet, modificateurs et etat
  RNG sans duplication.
- Les equipements ne sont pas empiles ; les materiaux de forge conservent leurs
  piles et leur `count`.
- `hero.equip` et `inventory.recycle` ne recoivent que l `instanceId` cible ;
  le serveur resout le modele, la rarete et les modificateurs.
- Une meme identite ne peut exister simultanement dans le coffre, sur un heros
  ou dans une offre temporaire.
- Le recyclage retire une instance exacte avant d attribuer une seule fois les
  recompenses serveur de sa rarete.
- Aucune migration d ancienne sauvegarde n est requise par decision produit ;
  la sauvegarde locale de developpement doit etre reinitialisee.

## Dependances

CDI-027 et CDI-028 fournissent les autorites inventaire et forge. CDI-037
fournit le RNG injectable. CDI-058 fixe les invariants de statistiques et de
replay a preserver. Ce ticket bloque la reprise de CDI-051.

## Criteres d'acceptation

- [x] `inventory.add` et `inventory.remove` ne sont plus invocables comme
      mutations clientes publiques.
- [x] Les payloads invalides de rarete, quantite et modificateurs sont refuses
      sans mutation.
- [x] Une forge standard consomme le cout puis ajoute exactement un objet
      commun.
- [x] Refuser une amelioration conserve et finalise l objet commun.
- [x] Accepter une amelioration produit la rarete, le cout et le modificateur
      determines par la preview serveur.
- [x] Les taux 85/13/2 utilisent le RNG canonique et sont caracterises par des
      tests deterministes.
- [x] F5 et replay conservent le meme resultat sans double consommation ni
      double objet.
- [x] Une nouvelle partie possede les plans novice decides et le serveur
      refuse un plan verrouille.
- [x] Les cinq tables de recyclage sont testees avec instances et modificateurs
      exacts.
- [x] L UI distingue correctement les instances ayant des modificateurs
      differents.
- [x] Deux exemplaires du meme modele possedent des `instanceId` distincts et
      les commandes equipement/recyclage ciblent l exemplaire exact.
- [x] Forge et loot creent des identites deterministes sans tirage RNG ajoute.
- [x] Le renvoi d un heros restitue ses instances equipees au coffre.
- [x] Le replay persistant d une finalisation de forge conserve une seule
      instance avec la meme identite.
- [x] Coffre, fiche heros et transcripts ne montrent aucun identifiant
      technique tout en ciblant l instance exacte lors des actions.

## Tests

- `npm.cmd run typecheck`
- `npm.cmd test -- --run tests/townAuthority.test.ts tests/TownPanel.test.tsx tests/authoritativeContracts.test.ts`
- Ajouter des tests dedies forge UI, securite des commandes, plans, replay et
  recyclage des cinq raretes.
- Preuves locales : 53/53 tests cibles des instances et 33 fichiers, 270/270
  tests PASS sur la suite complete ; typecheck, lint, determinisme et validation
  Workboard PASS.
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`
- `npm.cmd run board:validate`

## Validation manuelle

Avec Docker et Supabase local, reinitialiser la sauvegarde dev, partir d un etat
controle, forger deux exemplaires du meme modele et verifier leurs identites
distinctes via l etat reseau. Equiper puis desequiper un exemplaire exact,
recharger avec F5 et verifier coffre, heros, transcript et `rngState`, sans ID
technique visible. Rejouer la finalisation sans
double objet, obtenir un loot objet de donjon puis recycler l instance choisie.

Validation utilisateur du 26 juillet 2026 : reset de la sauvegarde, double
forge du meme modele, equipement, desequipement, recyclage exact, loot objet,
F5 et replay PASS. Le replay de `dungeon.resolve` a conserve `revision: 181`,
trois objets stockes, `uniqueInstances: true` et le meme `rngState`
(`draws: 8`, `state: 16222175`) sans duplication. Aucun `instanceId` technique
n est visible dans l interface ou les transcripts.

## Preservation

- Preserver revision, idempotence, atomicite et autorite serveur.
- Preserver les sept recettes novice et les tables de recyclage actuelles tant
  qu aucune decision produit ne les modifie.
- Preserver la consommation du cout de base lors d une annulation si elle est
  confirmee par le test fonctionnel.
- Preserver l `instanceId` pendant tous les transferts et ne jamais le recalculer
  lors d un equipement, desequipement ou renvoi.
- Ne pas introduire le catalogue complet par duplication locale supplementaire.

## Risques

- Toute variation du nombre de tirages decale le RNG canonique ulterieur.
- Une migration aveugle des plans peut debloquer une recette volontairement
  verrouillee.
- Une confusion entre refus d amelioration et annulation peut encore detruire
  des materiaux ou dupliquer un objet.
- Le retrait des commandes publiques doit conserver les mutations internes
  necessaires au loot, a la forge et au desequipement.
- Une collision ou une duplication d `instanceId` rendrait l etat canonique
  invalide ; les namespaces serveur et la validation globale doivent rester
  alignes.

## Handoff

Fournir la comparaison avec `640f89f`, les schemas de commandes, la strategie
de migration des plans, les bandes RNG, les tests de securite et d atomicite,
les preuves Docker/navigateur apres F5 et l audit fonctionnel pre-push.
