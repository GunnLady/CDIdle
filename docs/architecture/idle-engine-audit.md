# Audit des oublis et écarts idle — CDI-016

Date : 2026-07-18

## Méthode

Cet audit compare l’implémentation de `src/domain/idle.ts` avec le plan
autoritaire et les tickets dépendants. Les sujets déjà explicitement portés
par un ticket futur ne sont pas répétés comme des oublis.

## Sujets déjà couverts par des tickets futurs

- Branchement au bootstrap, au cache utilisateur et à la persistance de
  `lastProcessedAt` : CDI-024.
- Traitement serveur au retour et présentation d’un rapport idle : CDI-030.
- Verrouillage hors ligne et reprise après interruption : CDI-031.

## Écarts non couverts ailleurs

### IDLE-AUDIT-001 — Unité de temps non contractualisée

`applyIdle` manipule actuellement des secondes entières, tandis que les
frontières applicatives utilisent aussi des timestamps JavaScript en
millisecondes. Aucun ticket futur ne fixe l’unité ni ne décrit la conversion.

Action proposée : documenter une unité canonique (millisecondes côté API,
secondes uniquement dans le calcul) et ajouter un test de conversion avant le
branchement CDI-024/CDI-030.

### IDLE-AUDIT-002 — Mode sans utilisateur encore partiellement mutateur

Avec `hasUser = false`, la production est nulle, mais l’immigration et la
récupération des héros peuvent encore modifier l’état. Cela contredit la règle
« hors connexion, aucune mutation » et n’est pas explicitement couvert par
CDI-024, CDI-030 ou CDI-031.

Action proposée : rendre le mode non authentifié strictement sans mutation et
ajouter un test d’invariance de l’état.

### IDLE-AUDIT-003 — Invariants citoyens incomplets

La validation idle vérifie les valeurs non négatives, mais pas la cohérence
entre allocations et `totalCitizensCount`, ni la capacité d’habitation avant
d’ajouter un citoyen. Le validateur global couvre une partie de ces règles,
mais le moteur idle ne les protège pas directement.

Action proposée : réutiliser une validation canonique du domaine ville et
refuser toute transition incohérente avant calcul.

### IDLE-AUDIT-004 — Fin de récupération non spécifiée

Le moteur restaure les PV/mana des héros `resting`, mais ne formalise pas la
transition vers `idle` quand les deux jauges atteignent leur maximum. Le hook
historique le faisait, mais aucun ticket futur ne fixe ce comportement dans le
contrat serveur.

Action proposée : décider et documenter la transition dans CDI-030 avant son
intégration au bootstrap.

### IDLE-AUDIT-005 — Rapport idle trop agrégé pour l’observabilité

`IdleReport` expose les totaux produits et consommés, mais pas les détails par
ressource ou par héros récupéré. Le besoin d’un rapport est prévu par CDI-030,
mais son niveau de détail n’est pas défini.

Action proposée : préciser le schéma du rapport dans CDI-030, notamment les
ressources, citoyens et héros affectés.

## Conclusion

Les cinq écarts ci-dessus ne sont pas actuellement suivis par un ticket dédié.
Les trois premiers touchent directement le contrat du moteur et doivent être
traités avant son branchement serveur ; les deux derniers doivent être décidés
dans CDI-030.
