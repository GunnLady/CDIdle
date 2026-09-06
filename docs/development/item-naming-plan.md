# Nommage des objets — recherche et plan proposé

Statut : style validé par l’utilisateur puis intégration demandée et réalisée,
5 septembre 2026. Validation technique réussie ; revue visuelle en attente.
Ce lot est séparé de la [refonte visuelle de la forge](forge-workshop-ui.md).

Résultats, commandes et limites : [harness de nommage](item-naming-harness.md).
Les étapes lexique/prototype/corpus puis raccordement sont exécutées.
Les [règles livrées et preuves d’intégration](../architecture/item-naming.md)
décrivent notamment le renommage visuel dérivé des objets évolutifs possédés,
sans migration des données. Aucun commit/push/déploiement effectué pour ce lot.

## Références consultées

- [Path of Exile, documentation officielle des objets](https://www.pathofexile.com/item-data) : les noms des objets magiques exposent leurs préfixes/suffixes. Retenir la lisibilité des propriétés, pas importer ses règles de loot.
- [Diablo II, Arreat Summit officiel](https://classic.battle.net/diablo2exp/items/magic.shtml) : les noms des objets rares sont générés et indépendants de leurs statistiques. Retenir une identité plus évocatrice, sans promettre de bonus inexistant.
- [Cataclysm-DDA, documentation du dépôt](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON/ITEM.md#conditional-naming) : noms conditionnels, composition avec le nom de base et formes de traduction/pluriel. Retenir les conditions explicites et la séparation identifiant/texte.
- [Tracery, dépôt de l’autrice](https://github.com/galaxykate/tracery) : grammaires de texte à base de dictionnaires, règles et modificateurs. Retenir les données séparées du moteur ; une grammaire narrative générale n’est pas nécessaire à notre V1.
- [Wesnoth, grammaires documentées](https://wiki.wesnoth.org/Context-free_grammar) et [données de noms du dépôt](https://github.com/wesnoth/wesnoth/blob/master/data/core/macros/names.cfg) : combinaisons et variantes pondérées. Il s’agit ici de noms de personnages, pas d’un moteur d’équipement à reprendre tel quel.

Ces sources inspirent la proposition suivante, qui est une décision de design
CDIdle, pas une norme imposée par ces jeux. Aucun code ni lexique tiers copié.

## État de départ vérifié avant intégration

- 48 familles actives dans `shared/domain/items/items.ts`, niveaux 1–40,
  cinq raretés. Les libellés actuels contiennent « évolutif/évolutive ».
- Les instances conservent `instanceId`, `itemId`, `itemLevel`, `powerModelId`,
  `rarity` et éventuellement `modifiers`. Elles ne stockent pas de nom propre.
- `resolveItemInstance` résout déjà niveau, rareté et bonus persistés/générés.
  Ne jamais nommer depuis les seules statistiques brutes de la base.
- Forge : l’offre ne fixe pas la rareté finale ; le joueur accepte ou refuse,
  puis choisit éventuellement une infusion. Identifiant final connu :
  `item:forge:<previewId>`. L’infusion n’a pas de champ de provenance distinct
  dans l’instance finale : ne pas prétendre la reconnaître après coup.
- Inventaire/équipement résolus et journaux de récompenses n’utilisent pas
  tous le même chemin de nommage aujourd’hui. Prévoir leur raccordement.

## Direction retenue après validation du harness

1. Garder le nom de famille reconnaissable. Le plan décrit une famille,
   l’objet obtenu porte un nom individuel. Aucun changement des identifiants
   de plan ou d’objet, ni nouvelle base créée pour chaque nom.
2. Commune : nom sobre. Inhabituelle : qualificatif lié à un bonus réel.
   Rare/épique : enrichissement court et évocateur. Légendaire : possibilité
   d’une épithète mémorable avec la famille toujours visible.
   Une rareté légendaire ne signifie pas objet unique/signature de boss.
3. Niveau affiché séparément. Les huit tranches peuvent filtrer le vocabulaire
   de finition, sans exiger huit noms systématiques par famille. Ne jamais
   utiliser le tier du héros comme substitut au niveau ou à la rareté.
4. Maximum un qualificatif de finition et une expression thématique ; cible
   de 2–6 mots, plafond proposé de 60 caractères avec forme courte prévue.
   Pas d’empilement de tous les bonus dans le titre.
5. Le thème doit correspondre aux propriétés réelles : vitesse → vivacité,
   PV → vigueur, défense → rempart. Distinguer résistance au feu et dégâts de
   feu ; ne pas présenter un scaling Force comme un bonus de Force.
6. Variantes sélectionnées dans un lexique écrit et validé en français : genre,
   nombre, élisions et formes composées explicites. Pas d’accord déduit de la
   dernière lettre ; traiter les gantelets et armes jumelles au pluriel.

Exemples d’intention, pas lexique final : « Épée », « Épée de vivacité »,
« Épée ouvragée de vivacité », « Bouclier du rempart »,
« Épée — Serment de l’aube ». Un exemple thématique nécessite le bonus associé.

## Architecture retenue

- Lexique versionné dans `shared/data/item-naming-v1.ts`, moteur pur dans
  `shared/domain/items/naming.ts` ; mêmes règles côté serveur et frontend.
  Le prototype et son lexique ont été promus dans ces chemins, sans copie
  conservée dans les tests. Le harness importe directement le moteur livré.
- Entrées : base, instance stable, rareté finale et propriétés résolues.
  Sortie structurée : nom affiché, nom de famille et clés de thème/style.
- Hash déterministe dédié à partir de `instanceId` et d’un espace de noms V1.
  Aucun appel au RNG canonique, à `Math.random`, à l’heure ou au réseau.
  Ordre des candidats et des modificateurs normalisé ; pas d’état anti-doublon
  dépendant de l’ordre de lecture des objets.
- Choisir parmi les thèmes éligibles selon des priorités explicites par famille,
  jamais en comparant directement 10 PV et 2 % de vitesse. Pas de priorité
  spéciale « infusion » sans donnée fiable permettant de l’identifier.
- V1 recommandée : nom dérivé, pas de champ ajouté aux sauvegardes ni backfill
  SQL. Le lexique et la règle V1 doivent être figés après validation ; une
  évolution susceptible de renommer les objets nécessitera un nouveau plan
  de versionnement/persistance. Ne pas promettre la stabilité entre versions
  si l’on modifie silencieusement les mots ou les critères.
- Instances `legacy-fixed-v1` : nom historique conservé. Instances évolutives
  déjà possédées : nouveau nom d’affichage proposé, sans changer leurs données.
  Le raccordement demandé applique ce choix aux affichages, sans réécrire les
  instances ni les messages historiques.
- Recettes : famille stable ; avant le craft, pas de faux nom individuel.
  Preview : nom de base ou mention provisoire tant que la décision n’est pas
  prise. Un éventuel aperçu final devra résoudre exactement la même instance
  que le serveur, sans dupliquer l’algorithme de fabrication.
- Noms identiques autorisés : l’unicité reste celle de `instanceId`.
  Aucun bonus, coût, taux de drop ou effet lié au nom.

## Séquence de réalisation et contrôle de clôture

Étapes 1–6 réalisées ; tests, documentation et contrôle technique de l’étape 7
réalisés. Revue visuelle utilisateur en attente. Publication hors demande.

1. Valider le style, le traitement des anciens objets évolutifs et la place
   des épithètes légendaires. Écrire un premier lexique français couvrant les
   48 familles, cinq raretés et propriétés réellement disponibles.
2. Prototyper le moteur pur dans un harness isolé, sans raccord runtime.
   Utiliser de vraies instances produites/résolues par les helpers du jeu.
3. Exporter un corpus reproductible : 48 familles × 8 tranches × 5 raretés
   × 100 identifiants distincts, soit 192 000 noms ; les 40 niveaux sont aussi
   couverts par les tests de bornes. Mesurer répétitions, longueur, thèmes et
   collisions, sans imposer artificiellement 100 % de noms uniques.
   Fournir un échantillon lisible de 240 objets, plus les anomalies regroupées.
4. Ajuster puis valider les objectifs dans le harness avant raccordement.
5. Raccorder forge, inventaire, équipement, comparaisons, recherche/tri,
   récompenses de combats/coffres/boss, recrutement et rank-up/vocations.
   Utiliser le même résolveur même lorsqu’une provenance conserve un objet legacy.
   Garder recherche par famille et par nom généré ; ne jamais identifier par nom.
6. Pour les nouveaux journaux, capturer le nom du résultat réellement attribué
   à l’endroit où son état complet est disponible. Vérifier aussi recyclage
   et objets équipés. Ne pas réécrire les messages historiques sans données
   permettant de reconstruire exactement leur objet d’origine.
7. Tests, documentation métier/architecture/UI, audit global des usages de
   `item.name` et `itemName`, vérification des compatibilités et du code mort.
   Commit/push uniquement après autorisation, puis suivi CI.

## Critères de validation

- Même instance et même décision : même nom après chargement, équipement,
  changement de héros, replay et sur les surfaces serveur/frontend.
- Aucune mutation des stats, sauvegardes ou état RNG ; drops et résultats des
  scénarios témoins strictement identiques avec/sans moteur de noms.
- Tous les chemins de provenance couverts, y compris recrutement et rank-up.
- Accord français et éligibilité des qualificatifs vérifiés ; pas de nom vide,
  doublon de fragment, référence à un effet absent ou perte de la famille.
- Legacy intact, anciens objets évolutifs traités conformément au choix validé,
  fallback explicite sur les données anciennes incomplètes.
- Régressions rapides, tests de contrats et corpus réduit en CI qualité ;
  campagne complète uniquement en commande dédiée/manuelle si coûteuse.
  Pas de simulation complète de progression XP pour un changement de texte.
- Revue utilisateur du lexique et du rendu sur écran étroit avant clôture.

## Hors périmètre

Choix du prototype : le niveau reste une information séparée ; aucun
qualificatif supplémentaire n’est imposé par tranche. Les raretés rare/épique
pilotent la finition, la légendaire porte un titre, et les thèmes reposent sur
les propriétés résolues. L’éventuel vocabulaire de niveau reste à discuter
après lecture de l’échantillon, sans toucher aux courbes de puissance.

LLM en jeu, API de génération, traduction multilingue complète, renommage libre
par le joueur, nouvelles signatures de boss et nouvelle mécanique d’affixes.
Le moteur décrit les objets existants ; il ne les rééquilibre pas.
