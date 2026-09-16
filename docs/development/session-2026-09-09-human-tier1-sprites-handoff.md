# Handoff — sprites humains par classe T1

Date d'arrêt : 9 septembre 2026.

> **Handoff historique, remplacé pour Guerrier, Voleur et Archer.** Leurs six
> anciennes planches ont été retirées du workspace après livraison de CDI-137,
> CDI-138 et CDI-139. Les classes restantes conservent leurs planches dans
> `assets/design/hero-sprites/approved/` jusqu'à leur remplacement.

## Objectif et règle validée

Produire, à partir des deux planches Novice canoniques, une planche homme et
une planche femme pour chacune des neuf classes T1. Ne modifier que les tenues
et l'équipement porté : positions, visages, cheveux, couleurs de peau, poses,
ordre des personnages et grille 5 × 4 doivent rester identiques.

Direction commune retenue : tenues simples de début de T1, mais avec des
caractéristiques de classe fortes ; vingt variantes réellement distinctes,
pas d'uniforme répété ; suppression du petit sac comme élément systématique.
La majorité des personnages ne doit porter aucun sac.

## État validé avec l'utilisateur

- Guerrier : direction retenue après simplification des armures, diversification
  des tenues et retrait des sacs systématiques.
- Voleur : validé. La seconde passe remplace l'apparence de pratiquant d'arts
  martiaux par des gilets boutonnés, surchemises et détails de
  cambrioleur/éclaireur T1.
- Archer : validé « pour le moment ». La seconde passe conserve davantage la
  richesse visuelle des Novices et évite une planche entièrement verte grâce à
  une palette brune, ocre, beige, bleue sourde, grise et olive minoritaire.
- Prochaine classe : Mage, homme puis femme.

## Fichiers et livrables

- Sources canoniques :
  - `src/assets/images/human-novice-male.jpg`
  - `src/assets/images/human-novice-female.jpg`
- Prompts de travail :
  `assets/design/hero-sprites/human-tier1-class-spritesheets-v1.prompt.md`
- Le document de prompts, ce handoff et les six planches retenues sont locaux
  et non commités.
- Les six planches alors retenues ont depuis été remplacées et retirées du
  workspace. Les sources et exports autoritaires sont ceux de CDI-137,
  CDI-138 et CDI-139.

Aperçus historiques retirés après remplacement :

- Guerrier : remplacé par les vingt sources et exports de `cdi-137/`.
- Voleur : remplacé par les vingt sources et exports de `cdi-138/`.
- Archer : remplacé par les vingt sources et exports de `cdi-139/`.

Ces dossiers sont relatifs à `assets/design/hero-sprites/`.

## Reprise recommandée

1. Relire le bloc commun et le prompt Mage.
2. Renforcer le prompt Mage avant génération : palettes et coupes variées,
   finition au moins équivalente aux Novices, identité Mage lisible sans
   accessoire tenu ni effet magique, simplicité T1.
3. Générer les deux sexes depuis les sources Novice originales, jamais depuis
   une planche de classe déjà transformée.
4. Présenter les aperçus à l'utilisateur et intégrer son retour au prompt avant
   de passer à la classe suivante.
5. Sauvegarder chaque nouvelle paire validée dans le dossier `approved` avec
   la même convention de nommage. Ne modifier l'application qu'après une
   demande explicite.
