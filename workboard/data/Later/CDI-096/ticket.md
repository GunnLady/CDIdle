---
id: CDI-096
title: Borner la croissance egress de l inventaire canonique
status: Later
area: architecture
priority: P1
size: L
risk: high
source: Audit CDI-095 du 2026-08-20
depends_on: []
blocks: []
github_issue: null
related_docs: ["workboard/data/Doing/CDI-095/ticket.md", "docs/development/supabase-egress-budget.md", "shared/contracts/authoritative.ts", "src/lib/egressBudget.ts", "supabase/functions/game-api/supabase-adapter.ts"]
---

# CDI-096 - Borner la croissance egress de l inventaire canonique

## Objectif

Garantir que la croissance de storedItems ne rende pas chaque bootstrap et
commande progressivement plus couteux, sans supprimer ni alterer les objets du
joueur.

## Resultat utilisateur

Un inventaire ancien ou volumineux reste disponible et fiable sans menacer le
quota egress ni ralentir toutes les commandes du jeu.

## Contexte

CDI-095 mesure un profil haut de cent objets et declenche une alerte au-dessus
de 80 Ko. L historique de donjon est borne a quinze entrees, mais storedItems
ne possede pas de limite structurelle. Un joueur peut donc faire croitre le
snapshot canonique sans borne en accumulant du butin.

## Perimetre autorise

- Mesurer la croissance par objet, rarete et nombre de modificateurs.
- Choisir entre pagination autoritaire, partition de stockage ou plafond metier
  avec mecanisme non destructif de debordement.
- Charger uniquement les donnees necessaires a une commande sans affaiblir
  revision, idempotence, replay ou isolation joueur.
- Definir une migration compatible avec toutes les sauvegardes existantes.
- Etendre le harness egress avec le profil maximal garanti.

## Hors perimetre

- Supprimer, recycler ou declasser silencieusement des objets.
- Cacher une partie de l inventaire sans moyen de consultation.
- Deplacer l autorite ou la validation des objets vers le client.
- Modifier les probabilites de butin pour masquer le probleme de stockage.

## Contrat d'implementation

- Aucun objet existant n est perdu pendant la migration.
- Les commandes equipement, forge, recyclage et butin restent atomiques.
- Une commande nominale ne recharge pas une collection non bornee.
- Les pages ou partitions utilisent un ordre stable et des curseurs rejouables.
- La taille maximale garantie est couverte par le budget CDI-095.

## Dependances

La decision de stockage doit reutiliser les mesures CDI-095 et conserver les
RPC compacts CDI-093. Ce ticket ne bloque pas la livraison des reductions
immediates ; il constitue le suivi obligatoire de la limite de croissance.

## Criteres d'acceptation

- [ ] La croissance actuelle en octets par objet est mesuree.
- [ ] Une limite ou partition autoritaire non destructive est implementee.
- [ ] Les sauvegardes existantes migrent sans perte et sans doublon.
- [ ] Equipement, forge, recyclage, butin, replay et conflits restent exacts.
- [ ] Le snapshot ou les routes paginees ont une taille maximale documentee.
- [ ] Le scenario maximal reste sous le budget egress CDI-095.
- [ ] Les tests de migration, pagination, isolation et concurrence passent.

## Tests

- Harness de mille objets avec zero, un et plusieurs modificateurs.
- Migration aller et compatibilite avec une sauvegarde historique.
- Pagination stable, pages vides, curseur invalide et concurrence.
- Parite des commandes inventaire et donjon.
- Suites typecheck, lint, unitaires, pgTAP, navigateur et build.

## Validation manuelle

Sur une sauvegarde locale volumineuse, parcourir tout l inventaire, equiper,
recycler et obtenir du butin, puis verifier dans Network les tailles et l
absence de chargement integral non necessaire.

## Preservation

- Preserver chaque objet, instanceId, rarete et modificateur.
- Preserver revision, idempotence, RNG et autorite serveur.
- Preserver le fonctionnement hors connexion deja supporte.
- Ne journaliser aucun snapshot, token ou contenu joueur.

## Risques

- Une partition mal transactionnee peut desynchroniser etat et inventaire.
- Un curseur instable peut dupliquer ou masquer des objets.
- La migration peut augmenter temporairement le cout de stockage ou de commit.

## Handoff

Fournir la decision d architecture, le plan de migration, les bornes de taille,
les preuves de non-perte, la parite des commandes et la projection egress
actualisee.
