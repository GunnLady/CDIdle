# Nommage des objets

## Règle livrée

Le lexique français validé dans le harness est intégré au domaine partagé :
`shared/data/item-naming-v1.ts` et `shared/domain/items/naming.ts`.
`nameItem` produit le nom, la famille, le thème/style et le mode
`generated`, `legacy` ou `fallback`. `resolveNamedItemInstance` est le
résolveur de présentation : mêmes propriétés que `resolveItemInstance`,
avec uniquement `name` remplacé. Les calculs de combat gardent leur résolveur
statistique inchangé et ne calculent pas de noms.

- Commune : famille seule ; inhabituelle : thème lié à un bonus réel.
- Rare/épique : finition accordée et thème ; légendaire : famille et titre.
- 48 familles ; accords masculin/féminin et singulier/pluriel explicites.
- Le thème est choisi parmi les propriétés positives résolues, y compris les
  modificateurs persistés. Résistance et dégâts élémentaires sont distincts.
  Les valeurs de statistiques d’unités différentes ne sont pas comparées.
- Le nom ne décrit pas tous les bonus et n’en ajoute aucun. L’infusion ne
  bénéficie pas d’une priorité spéciale : sa provenance n’est pas persistée.
- Le niveau reste affiché séparément. Aucun qualificatif fondé sur le tier du héros.
- Plafond de 60 caractères pour les noms générés, forme courte sémantique,
  jamais de troncature arbitraire de la famille. Les noms identiques sont permis.

## Identité, sauvegarde et stabilité

Version publique `item-naming-v1`. L’espace de hash interne reste
`item-naming-candidate-v2` pour conserver exactement les noms du corpus validé.
Il est combiné à `instanceId` et à l’usage du tirage cosmétique. Aucun RNG du
jeu, horloge, réseau, état anti-doublon ou bibliothèque supplémentaire.

Le nom est dérivé : aucun champ ajouté aux instances, aucune migration SQL,
aucun backfill. Les objets évolutifs déjà possédés reçoivent le même nom que
des objets neufs de mêmes identité/propriétés. Les 131 bases `legacy-fixed-v1`
gardent leur nom historique, y compris recrutement, cadeaux T1 et signatures
de boss. Les messages historiques ne sont pas réécrits.

Une base inconnue, non mappée, une identité incohérente ou un niveau manquant
donne un fallback de nom explicite. Le résolveur de présentation ne masque
pas les erreurs de puissance/niveau du résolveur statistique : nommage tolérant
ne signifie pas réparation de sauvegarde invalide.

Le lexique et la sélection V1 sont figés. Changer des mots, des conditions,
des poids ou le hash peut renommer les objets. Une évolution de ce type exige
un plan de versionnement/persistance et une nouvelle validation du corpus.
Une évolution des propriétés d’un objet peut également changer son thème.

## Raccordements

| Surface | Source du nom |
|---|---|
| Inventaire, héros, équipement actuel, candidats, objets remplacés | Résolveur partagé via `heroEquipmentPresentation` |
| Recherche/tri | Nom affiché ; recherche conservée aussi sur le nom de catalogue et la description |
| Recettes, plans obtenus, offre de forge non finalisée | Nom de catalogue stable, aucun nom individuel anticipé |
| Forge finalisée | `itemName` capturé après décision de rareté et résolution de l’infusion |
| Recyclage | `itemName` capturé depuis l’instance retirée |
| Équiper/retirer, y compris remplacement de main gauche | `itemName` capturé sur chaque événement d’instance |
| Coffres et boss | `itemName` et message capturés avec l’instance réellement attribuée |
| Rank-up automatique et vocation choisie | Noms résolus depuis les deux références de récompense complètes |
| Recrutement | Références historiques inchangées, présentées par le même résolveur |

Les combats ordinaires ne distribuent actuellement pas d’objet hors chemin
de récompense de boss ; leurs récompenses et les courbes XP restent inchangées.
`townEventLog` utilise le nom capturé de forge/recyclage, avec fallback de
catalogue pour les événements anciens sans nom. Il ne reconstruit pas un nom
depuis un événement incomplet. Les événements d’équipement/vocation ne créent
pas de nouveau flux de messages : seul leur payload existant est enrichi.

## Validation et limites

- `npm.cmd exec --offline -- vitest run tests/itemNaming.test.ts tests/itemNamingIntegration.test.tsx` :
  46 tests ; 9 600 comparaisons de propriétés résolues, corpus réduit, stabilité,
  héritage et toutes les provenances actuelles ; rendu DOM des composants.
- `npm.cmd run test:item-naming` : 192 000 noms ; empreinte identique au V2
  validé, zéro anomalie selon les contrôles du [harness](../development/item-naming-harness.md).
- Suite qualité : 115 fichiers, 901 tests réussis avec couverture.
- TypeScript/catalogue, lint, garde de déterminisme, build et budget bundle
  réussis, ainsi que les seuils de couverture et le contrôle de sécurité des
  logs. Bundle JavaScript gzip : 237 990 octets, soit +3 100 octets par
  rapport à la refonte forge seule, sans nouvelle dépendance.

Tests de contrat et DOM, pas de preuve de rendu navigateur ou de replay SQL
réel revendiquée. Le corpus complet reste une commande dédiée hors CI qualité.
Les tests rapides utilisent directement le moteur de production, sans copie.
La revue visuelle utilisateur des noms longs en fenêtre étroite est en attente.
Le runtime Edge local a été relancé après constat de deux nouveaux fichiers
partagés non montés. Leur présence et le chargement effectif de `game-api`
ont été vérifiés ; voir la [procédure locale](../development/codex-elevation.md#supabase-local--nouveaux-imports-partagés).
Contrôle demandé : coffre, fiche héros/comparaison et forge avant/après
finalisation ; même nom entre objet final et journal, nom de famille avant
finalisation. Aucun commit, push ou déploiement inclus dans cette intégration.
