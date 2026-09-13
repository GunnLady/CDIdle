# Donjon 2D — audit et validation des sprites existants

Ticket : CDI-117. Mode PC uniquement.

Ce document suit les décisions visuelles de l’utilisateur. Codex relève les
faits techniques et prépare les comparaisons ; il ne valide pas seul la
direction artistique. Aucun sprite n’est modifié avant son verdict.

## Références humanoïdes CDIdle confirmées

L’utilisateur a retenu le 13 septembre 2026 les cinq sprites suivants comme
références communes :

| Référence | Apport à l’étalon |
| --- | --- |
| `public/assets/images/dungeon/undercity/court/chamberlain-blade-v3.png` | Silhouette féminine, armes jumelles, pose de combat, diversité |
| `public/assets/images/dungeon/undercity/court/deep-chamberlain-v3.png` | Silhouette âgée, étoffes usées, détails et volumes |
| `public/assets/images/dungeon/undercity/court/deep-alchemist-v2.png` | Silhouette légère, accessoires lisibles, geste de soutien |
| `public/assets/images/dungeon/undercity/bastion/barricade-blade-v1.png` | Pose basse dynamique, armes longues et appuis |
| `public/assets/images/dungeon/undercity/bastion/outcast-standard-bearer-v1.png` | Silhouette lourde, grande arme/accessoire et hiérarchie visuelle |

Ces références fixent le niveau de détail, les volumes, les contours, les
matières, la lumière et la lisibilité générale. Elles ne deviennent pas un
modèle anatomique unique : conserver diversité des corps, âges, carnations,
visages, cheveux, tenues et armes propres aux sprites.

Faits techniques vérifiés : cinq fichiers PNG individuels de 384 × 384 avec
canal alpha, éclairage documenté depuis la gauche et détourage/dépollution verte
déjà tracés dans les kits Cour/Bastion. Leurs échelles runtime diffèrent selon
leur rôle ; comparer la taille alpha visible, pas seulement la toile carrée.

## Méthode de validation

Ordre : dix classes héros, puis monstres zone par zone et écran par écran.
Chaque lot reçoit un verdict utilisateur :

- `validé` : conserver l’image sans retouche artistique ;
- `retouche ciblée` : nommer précisément le défaut et les clés concernées ;
- `à refaire` : nouvelle base nécessaire, avec référence et identité à préserver.

Une retouche ou refonte confirmée donne lieu à un ticket A1/A2 borné avant la
clôture de CDI-117. Les poses d’action viendront ensuite : sprite existant et
mouvement court d’abord, une ou deux poses seulement si le geste reste illisible.

## Héros

| Classe | Ressources examinées | Faits techniques | Verdict utilisateur | Suite |
| --- | --- | --- | --- | --- |
| Novice | `src/assets/images/human-novice-male.jpg`, `human-novice-female.jpg` | Deux planches JPEG 20 variantes, fond vert, silhouettes frontales chibi ; extraction runtime historique | À refaire | CDI-136 : premier étalon héros, préserver les quarante idées identitaires |
| Guerrier | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-137 |
| Voleur | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-138 |
| Archer | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-139 |
| Mage | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-140 |
| Acolyte | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-141 |
| Aède | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-142 |
| Druide | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-143 |
| Artificier | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-144 |
| Pugiliste | Deux planches PNG 20 variantes | Bases historiques à adapter après validation Novice | À refaire | CDI-145 |

## Monstres

Le tri suivra l’ordre Égouts, Contrebandiers, Citernes, Bastion, Cour. Les cinq
références ci-dessus sont déjà validées comme étalon ; cela ne revalide pas
automatiquement tous leurs écrans ni les autres sprites déjà livrés.

| Zone | Statut du tri CDI-117 |
| --- | --- |
| Égouts infestés | Validé intégralement par l’utilisateur le 13 septembre 2026 ; conserver les onze sprites existants, aucun ticket A2 |
| Galeries des contrebandiers | Tri terminé le 13 septembre 2026 : refaire les onze humains ; conserver les deux gobelins et le molosse |
| Citernes oubliées | Validé intégralement par l’utilisateur le 13 septembre 2026 ; conserver les neuf sprites distincts et leurs dix usages, aucun ticket A2 |
| Bastion des Exclus | Tri terminé le 13 septembre 2026 : trois sprites à refaire dans CDI-147 ; conserver les sept autres |
| Cour du Roi des Rats | Validé intégralement par l’utilisateur le 13 septembre 2026 ; conserver les quinze sprites distincts et leurs seize usages, aucun ticket A2 |

### Égouts infestés — ressources conservées

Verdict utilisateur : « je valide tous les sprite des sewers ». Ce verdict
couvre les onze PNG actuellement catalogués dans la zone :

- meute : `rat-pack-canal-rat-v1.png`, `rat-pack-mangy-rat-v1.png`,
  `rat-pack-plague-rat-v1.png` ;
- nuée : `beetle-swarm-black-sewer-cockroach-v1.png`,
  `beetle-swarm-carrion-cockroach-v1.png`,
  `beetle-swarm-pipe-cockroach-v1.png` ;
- solitaires : `colossal-rat-v1.png`, `pipe-slime-v1.png`,
  `vermin-mother-v1.png` ;
- gardiens : `sewer-warden-iron-gnawer-v1.png`,
  `sewer-warden-lock-biter-v1.png`.

Le fond `undercity-sewers-stage-v1.jpg` n’est pas un sprite et n’entre pas dans
ce verdict. Aucun défaut artistique retenu, donc aucun ticket A2 Égouts.

### Galeries des contrebandiers — tri terminé

Verdict utilisateur : « faut reprendre tous les humains les autres sprite sont
valide ». Les ressources sont réparties par écran afin que chaque reprise garde
sa propre validation visuelle :

| Écran | À refaire | À conserver |
| --- | --- | --- |
| Escorte des passeurs | `smuggler-guard-v1.png`, `smuggler-crossbowman-v1.png`, `tunnel-medic-v2.png` | — |
| Pillards gobelins | — | `goblin-copper-scavenger-v1.png`, `goblin-lookout-v1.png` |
| Dresseur et molosse | `gallery-chainmaster-v1.png` | `chainbreaker-hound-v1.png` |
| Coupe-jarret du tribut | `tribute-cutthroat-v2.png` | — |
| Capitaine contrebandier | `smuggler-sworn-blade-v2.png`, `smuggler-captain-v1.png`, `smuggler-alchemist-v1.png` | — |
| Collecteur du tribut | `tribute-guard-v1.png`, `tribute-collector-v1.png`, `tribute-apothecary-v1.png` | — |

Le fond `smugglers-gallery-stage-v1.jpg` n’est pas inclus dans ce verdict.
À la demande de l’utilisateur, un seul lot A2 CDI-146 couvre les onze humains
des cinq écrans. Chaque écran conserve son propre jalon de validation afin que
ce regroupement ne masque aucun rendu incomplet. L’écran des gobelins ne
nécessite aucune reprise.

### Citernes oubliées — ressources conservées

Verdict utilisateur : « citernes tous les sprites sont validés ». Les neuf PNG
distincts sont conservés sans retouche :

- parasites : `mud-lamprey-v2.png`, `valve-crab-v1.png`,
  `black-pit-eel-v2.png` ;
- solitaires : `dead-water-slime-v2.png`,
  `drowned-refuge-warden-v2.png`, `dead-water-warden-v2.png` ;
- sangsues : `pale-cistern-leech-v2.png`,
  `armored-cistern-leech-v2.png` ;
- sentinelle : `water-sentinel-v1.png`.

Le crabe des vannes est partagé entre `water-parasites:b` et
`valve-sentinel:b`, soit dix usages de manifeste pour neuf fichiers. Le fond
`forgotten-cisterns-stage-v1.jpg` n’est pas un sprite et ne fait pas partie du
verdict. Aucun ticket A2 Citernes n’est nécessaire.

### Bastion des Exclus — tri terminé

Verdict utilisateur : reprendre `exile-blackshot-v1.png`,
`palisade-lookout-v1.png` et `banished-sentinel-v1.png`. CDI-147 regroupe les
deux écrans concernés : Veilleur sans-bannière et Patrouille des exilés, avec
une validation distincte pour chacun.

Les sept autres PNG distincts sont conservés : `banished-bulwark-v1.png`,
`barricade-blade-v1.png`, `barricade-colossus-v1.png`,
`barricade-warden-v1.png`, `outcast-standard-bearer-v1.png`,
`outcast-surgeon-v1.png` et `rampart-eye-v1.png`. Certains sont partagés entre
plusieurs écrans ; tous leurs usages restent inchangés. Le fond
`bastion-exiles-stage-v1.jpg` n’est pas inclus dans le verdict.

### Cour du Roi des Rats — ressources conservées

Verdict utilisateur : « tous les sprites sont valide à la cour ». Les quinze
PNG distincts sont conservés sans retouche :

- garde : `court-living-bulwark-v4.png`,
  `court-royal-crossbowman-v4.png`, `dungeon-medic-v4.png` ;
- vermine : `court-rat-v4.png`, `court-dungeon-devourer-v3.png` ;
- chambellan : `chamberlain-blade-v3.png`, `deep-chamberlain-v3.png`,
  `deep-alchemist-v2.png` ;
- champion : `court-champion-v3.png` ;
- héraut : `herald-blade-bearer-v4.png`, `rat-king-herald-v5.png` ;
- Roi : `rat-king-left-blade-v2.png`, `rat-king-right-blade-v2.png`,
  `rat-king-v3.png` et sa phase monstrueuse
  `rat-king-monster-form-v3.png`.

`dungeon-medic-v4.png` est partagé entre la Garde des Sans-Couronne et le
Héraut du Roi : le manifeste contient donc seize usages pour quinze fichiers.
Le fond `rat-king-court-stage-v1.jpg` n’est pas un sprite et ne fait pas partie
du verdict. Aucun ticket A2 Cour n’est nécessaire.

## Limites actuelles

- Les dix classes sont confirmées à refaire ; CDI-136–145 sont créés. Aucune image n’est encore produite.
- CDI-136 livre le Novice en premier. Une fois validé, il rejoint les cinq références pour CDI-137–145.
- Le tri des cinq zones est terminé : Égouts, Citernes et Cour sont conservés intégralement ; Galeries et Bastion ont leurs tickets A2 bornés.
- CDI-146 porte les onze humains des Galeries et bloque leurs consommateurs jusqu’aux cinq validations d’écran.
- CDI-147 porte les trois reprises ciblées du Bastion et bloque leurs consommateurs jusqu’aux deux validations d’écran.
- Aucun sprite, pose, code applicatif ou budget n’a été modifié par ce relevé.
