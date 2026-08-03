---
id: CDI-086
title: Étoffer et structurer le bestiaire par paliers
status: Later
area: gameplay
priority: P2
size: L
risk: medium
source: Revue du bestiaire avec l utilisateur le 2026-08-03
depends_on: []
blocks: []
github_issue: null
related_docs: ["src/data/monsters.ts", "src/domain/authoritativeDungeon.ts", "src/components/DungeonPanel.tsx", "shared/domain/dungeon-progression.ts", "tests/authoritativeDungeonGolden.test.ts"]
---

# CDI-086 - Étoffer et structurer le bestiaire par paliers

## Objectif

Remplacer la sélection fragile fondée sur la position des monstres dans un
tableau par un catalogue autoritaire explicite, puis proposer huit monstres
réguliers distincts pour chacun des cinq paliers du donjon.

## Resultat utilisateur

Le joueur rencontre un bestiaire plus varié et cohérent pendant l ascension.
Chaque palier possède une identité propre sans modifier artificiellement les
courbes moyennes de difficulté, d XP et d or déjà validées.

## Contexte

Le catalogue contient actuellement quinze monstres réguliers. Les groupes
sont construits avec des appels `slice(...)` dépendant de l ordre du tableau :

- quatre monstres aux premiers étages ;
- six dans les deux paliers intermédiaires ;
- cinq à partir de l étage 30 ;
- certains modèles sont repris implicitement entre les groupes.

Le frontend maintient également une liste de bestiaire séparée dans
`DungeonPanel`, ce qui crée un risque de divergence avec le moteur
autoritaire. Avec une progression allant jusqu à cinquante salles par étage,
la répétition des quinze modèles devient très visible.

Le moteur actuel utilise les statistiques du catalogue comme poids relatifs.
L attaque, l XP et l or effectifs sont recalculés depuis le budget de l étage.
Les ratios de défense et les résistances déterminent ensuite le profil du
monstre. Les PV restent calculés par le moteur : attaque finale multipliée par
16 pour un monstre régulier et par 32 pour une élite de dernière salle.

## Perimetre autorise

- Définir une entrée de catalogue avec au minimum :
  - identifiant stable ;
  - nom et représentation visuelle ;
  - étage minimum et maximum ;
  - attaque de référence ;
  - type de dégâts ;
  - défense physique et magique ;
  - résistances et vulnérabilités ;
  - poids d XP et d or.
- Créer les cinq paliers 1-10, 11-20, 21-30, 31-40 et 41-50.
- Intégrer exactement huit monstres réguliers principaux par palier selon la
  matrice validée ci-dessous.
- Remplacer les `slice(...)` par `getMonsterPoolForFloor(floor)`.
- Conserver les budgets moyens de difficulté, d XP et d or définis par la
  progression du donjon.
- Conserver les boss aux étages 10, 20, 30, 40 et 50.
- Alimenter le bestiaire du frontend depuis la même source que le serveur.
- Préserver le RNG canonique, les replays et les rencontres déjà sérialisées.
- Documenter le catalogue, les paliers et les formules de mise à l échelle.

## Hors perimetre

- Exécuter `Monster.skills` ou ajouter des compétences de monstres.
- Ajouter vitesse, critique, esquive ou frappes bonus propres aux monstres.
- Modifier les budgets de progression, les primes de première sécurisation ou
  les coûts des bâtiments.
- Modifier les tables de butin ou le catalogue d objets.
- Remplacer le système de combat autoritaire.
- Réécrire les historiques de rencontres ou les sauvegardes existantes.

## Contrat d'implementation

- Une entrée appartient explicitement à un palier et ne dépend jamais de sa
  position dans un tableau.
- `getMonsterPoolForFloor` retourne exactement huit entrées pour tout étage de
  1 à 50.
- Un étage supérieur à 50 utilise explicitement la politique du dernier palier
  tant qu aucun contenu supplémentaire n est défini.
- Chaque identifiant de monstre est unique, stable et indépendant du nom
  traduit.
- Le choix conserve un tirage RNG canonique parmi le groupe admissible.
- La création de l identifiant visuel conserve son tirage RNG existant.
- Les valeurs d attaque, d XP et d or restent des poids relatifs normalisés par
  rapport à la moyenne du palier.
- Les résistances sont appliquées telles quelles par le moteur actuel.
- Les boss majeurs gardent leurs statistiques directes et leur formule de PV.
- Une rencontre active déjà sérialisée est résolue sans rechercher à nouveau
  son monstre dans le catalogue.
- Le frontend ne maintient aucune copie manuelle des noms du bestiaire.
- Les rôles indiqués dans la matrice décrivent uniquement la distribution des
  statistiques ; ils ne constituent pas des capacités spéciales.

### Palier 1 - Étages 1 à 10

| Monstre | Rôle | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---|---|---:|---|---:|---:|---:|---:|---|
| Rat Énorme des Égouts | Standard fragile | 3 | physical | 1 | 0 | 8 | 2 | - |
| Chauve-souris Vampire | Résistant aux ténèbres | 4 | physical | 1 | 1 | 10 | 3 | dark +20%, holy -15% |
| Gobelin Éclaireur | Offensif léger | 6 | physical | 2 | 1 | 18 | 6 | - |
| Brigand Masqué | Équilibré | 7 | physical | 3 | 2 | 20 | 10 | - |
| Slime des Cryptes | Défense magique | 4 | poison | 0 | 3 | 12 | 4 | poison +50%, fire -20% |
| Kobold Ferrailleur | Défense physique | 5 | physical | 3 | 1 | 14 | 7 | earth +10% |
| Cultiste des Soupiraux | Attaquant magique | 6 | dark | 1 | 4 | 17 | 8 | dark +25%, holy -20% |
| Loup des Galeries | Offensif fragile | 6 | physical | 1 | 0 | 15 | 5 | nature +10%, fire -10% |

### Palier 2 - Étages 11 à 20

| Monstre | Rôle | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---|---|---:|---|---:|---:|---:|---:|---|
| Squelette Guerrier | Défense physique | 10 | physical | 5 | 2 | 15 | 22 | poison +50%, holy -20% |
| Zombie Affamé | Endurant | 12 | physical | 4 | 1 | 18 | 25 | poison +50%, fire -15% |
| Araignée Géante Cavernicole | Équilibrée | 15 | physical | 6 | 4 | 35 | 20 | poison +30% |
| Orc Pilleur des Brumes | Offensif | 20 | physical | 8 | 4 | 45 | 28 | - |
| Salamandre de Soufre | Attaquant magique | 16 | fire | 4 | 8 | 38 | 25 | fire +40%, ice -20% |
| Troll des Cavernes | Défense physique | 22 | physical | 12 | 3 | 50 | 32 | earth +20%, fire -10% |
| Chaman Gobelin Fulminant | Défense magique | 14 | lightning | 3 | 10 | 42 | 30 | lightning +30%, earth -15% |
| Basilic des Failles | Défenses mixtes | 18 | poison | 9 | 7 | 48 | 35 | poison +40%, wind -15% |

### Palier 3 - Étages 21 à 30

| Monstre | Rôle | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---|---|---:|---|---:|---:|---:|---:|---|
| Liche Reconstituée | Défense magique | 28 | dark | 10 | 25 | 60 | 55 | dark +40%, arcane +20%, holy -25% |
| Golem de Pierre de Taille | Défense physique | 25 | physical | 25 | 10 | 90 | 50 | earth +45%, lightning -15% |
| Minotaure Vagabond | Offensif physique | 36 | physical | 18 | 12 | 120 | 80 | - |
| Démon du Soufre | Défenses mixtes | 45 | fire | 20 | 25 | 150 | 130 | fire +50%, dark +25%, ice -20% |
| Chevalier Spectral | Défense magique | 32 | dark | 14 | 28 | 105 | 75 | physical +15%, dark +35%, holy -30% |
| Hydre Runique | Endurante magique | 40 | poison | 20 | 20 | 135 | 100 | poison +50%, water +25%, lightning -20% |
| Sentinelle Foudroyée | Défense physique | 38 | lightning | 28 | 14 | 125 | 90 | lightning +35%, earth -20% |
| Assassin des Ombres | Offensif fragile | 42 | blood | 10 | 12 | 140 | 120 | dark +25%, radiant -20% |

### Palier 4 - Étages 31 à 40

| Monstre | Rôle | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---|---|---:|---|---:|---:|---:|---:|---|
| Chimère d Obsidienne | Défenses mixtes | 55 | fire | 30 | 25 | 260 | 220 | fire +35%, earth +30%, ice -20% |
| Dragon d Émeraude Ancestral | Défense physique | 70 | physical | 45 | 40 | 400 | 350 | nature +50%, poison +50%, fire +30% |
| Seigneur Vampire Céleste | Défense magique | 85 | dark | 40 | 50 | 600 | 500 | dark +60%, blood +40%, holy -30% |
| Titan Obscur Écorché | Défense physique | 110 | physical | 75 | 60 | 1000 | 800 | dark +50%, earth +40%, radiant -25% |
| Arcaniste Déchu | Attaquant magique | 65 | arcane | 20 | 55 | 480 | 420 | arcane +50%, lightning +20%, physical -10% |
| Chevalier Abyssal | Défenses mixtes | 78 | dark | 55 | 42 | 620 | 520 | dark +45%, holy -25% |
| Griffon des Tempêtes | Offensif élémentaire | 72 | lightning | 30 | 32 | 520 | 450 | wind +40%, lightning +35%, earth -20% |
| Dryade Corrompue | Défense magique | 60 | nature | 24 | 48 | 450 | 380 | nature +55%, poison +25%, fire -30% |

### Palier 5 - Étages 41 à 50

| Monstre | Rôle | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---|---|---:|---|---:|---:|---:|---:|---|
| Wyrm du Néant | Défense magique | 120 | dark | 60 | 90 | 1200 | 950 | dark +60%, arcane +40%, radiant -30% |
| Archidémon Cendré | Offensif élémentaire | 145 | fire | 70 | 80 | 1500 | 1300 | fire +70%, dark +30%, ice -30% |
| Colosse Arcanique | Défense physique | 160 | earth | 120 | 75 | 1800 | 1500 | earth +60%, physical +20%, lightning -25% |
| Ange Déchu | Défenses mixtes | 135 | radiant | 75 | 100 | 1650 | 1450 | holy +30%, dark +30%, blood -20% |
| Léviathan Souterrain | Endurant | 150 | water | 105 | 85 | 1900 | 1600 | water +70%, ice +30%, lightning -30% |
| Dévoreur Astral | Attaquant magique | 140 | arcane | 55 | 115 | 1750 | 1700 | arcane +65%, dark +25%, physical -15% |
| Dragon du Vide | Défenses mixtes | 155 | dark | 95 | 105 | 2000 | 1850 | dark +70%, fire +30%, radiant -35% |
| Phénix de Cendres Noires | Offensif magique | 148 | fire | 60 | 110 | 1850 | 1750 | fire +80%, wind +25%, water -30% |

### Boss majeurs conservés

| Étage | Boss | PV | ATK | Type | DEF | DEF mag. | XP | Or | Résistances |
|---:|---|---:|---:|---|---:|---:|---:|---:|---|
| 10 | Giga Gobelin « Roi des Déchets » | 288 | 12 | physical | 6 | 4 | 60 | 100 | earth +15%, poison +20% |
| 20 | Chef de Meute Orc Blindé | 720 | 30 | physical | 16 | 8 | 150 | 250 | nature +20% |
| 30 | Gardien du Portail en Obsidienne | 1320 | 55 | physical | 35 | 20 | 450 | 600 | fire +60%, earth +40%, water -15%, ice -10% |
| 40 | Liche Éternelle « Malakor » | 2160 | 90 | arcane | 40 | 70 | 1200 | 1500 | arcane +70%, dark +50%, holy -35% |
| 50 | Sinueux Dragon Rouge Primordial | 4080 | 170 | physical | 100 | 90 | 5000 | 6000 | fire +90%, earth +30%, ice -25% |

## Dependances

Aucune dépendance de code bloquante.

Le développement doit toutefois commencer après la validation économique du
parcours actuellement en cours. Modifier le bestiaire pendant cette mesure
changerait la difficulté, les résistances et le nombre possible de défaites,
ce qui rendrait les résultats difficiles à comparer.

Le futur branchement de `Monster.skills` sera traité séparément et pourra
s appuyer sur ce catalogue sans en modifier le contrat de sélection.

## Criteres d'acceptation

- [ ] Le catalogue contient exactement quarante monstres réguliers uniques.
- [ ] Chaque palier contient exactement huit monstres.
- [ ] Les frontières 10/11, 20/21, 30/31 et 40/41 sont explicites et testées.
- [ ] Les étages supérieurs à 50 utilisent explicitement le dernier palier.
- [ ] Tous les identifiants, noms, types et nombres sont valides.
- [ ] Les résistances utilisent uniquement les types de dégâts supportés.
- [ ] La sélection ne dépend plus de l ordre d un tableau ni de `slice(...)`.
- [ ] L attaque, l XP et l or moyens restent conformes aux budgets existants.
- [ ] Les boss restent aux étages 10, 20, 30, 40 et 50.
- [ ] Le frontend affiche le catalogue autoritaire sans liste dupliquée.
- [ ] Une rencontre active historique reste résoluble.
- [ ] Le nombre de tirages RNG reste inventorié et intentionnel.
- [ ] Une même entrée et un même RNG produisent la même rencontre et le même
      replay.
- [ ] Aucun changement de compétence de monstre n est introduit.
- [ ] La documentation décrit le catalogue et les formules effectives.

## Tests

- Test paramétré des huit monstres pour chacun des cinq paliers.
- Test des frontières et des étages supérieurs à 50.
- Test d unicité des identifiants et de validité des statistiques.
- Test de validité des types de dégâts, résistances et vulnérabilités.
- Test des moyennes et bornes de facteurs d attaque, XP et or par palier.
- Test des boss aux cinq étages d ancrage.
- Test d une rencontre active sérialisée avec un ancien nom de monstre.
- Test de parité entre bestiaire affiché et catalogue autoritaire.
- Golden tests de rencontres ordinaires et d élites sur chaque palier.
- Test de replay et de consommation RNG.
- `npm.cmd run board:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd test -- --run`
- `npm.cmd run check:determinism`
- `npm.cmd run build`

## Validation manuelle

Sur une partie locale contrôlée :

1. Forcer plusieurs rencontres sur chacun des cinq paliers.
2. Vérifier que les huit modèles peuvent être rencontrés sans modèle étranger
   au palier.
3. Vérifier les noms, types de dégâts et résistances visibles dans les combats.
4. Vérifier que le bestiaire de l interface correspond aux rencontres.
5. Résoudre la dernière salle des étages 10, 20, 30, 40 et 50.
6. Comparer les gains et la difficulté moyenne avec les budgets documentés.
7. Rejouer une commande autoritaire et confirmer le même monstre, les mêmes
   récompenses et le même état RNG.

Les commandes locales et leurs objectifs seront fournis à l utilisateur au
moment du test conformément aux instructions du projet.

## Preservation

- Préserver l autorité serveur et le RNG canonique.
- Préserver les budgets de progression validés avant ce ticket.
- Préserver les boss, leurs tables de butin et leurs statistiques.
- Préserver les sauvegardes et rencontres déjà sérialisées.
- Préserver les historiques de combat existants.
- Ne pas copier la logique de sélection dans le frontend.
- Ne pas activer silencieusement les compétences de monstres.
- Préserver les modifications utilisateur déjà présentes dans le worktree.

## Risques

- Des résistances trop fortes peuvent modifier la difficulté réelle malgré un
  budget d attaque inchangé.
- Des poids bruts mal répartis peuvent produire des extrêmes après
  normalisation.
- Changer la taille des groupes modifie les monstres tirés pour un seed
  historique, même si le replay d une commande déjà persistée reste stable.
- Une source prétendument partagée mais importée différemment par le frontend
  et l Edge Function recréerait une divergence.
- Ajouter des capacités décrites mais non exécutées induirait le joueur en
  erreur ; elles restent donc hors périmètre.

## Handoff

Fournir :

- le schéma final d une entrée de catalogue ;
- la matrice finale des quarante monstres ;
- la fonction de sélection par étage ;
- les moyennes et bornes mesurées par palier ;
- la preuve de suppression des listes et `slice(...)` dupliqués ;
- l inventaire exact de la consommation RNG avant et après ;
- les golden tests modifiés avec justification ;
- la preuve de compatibilité d une rencontre historique ;
- les validations automatisées et manuelles ;
- les éventuels ajustements d équilibrage restant à mesurer.
