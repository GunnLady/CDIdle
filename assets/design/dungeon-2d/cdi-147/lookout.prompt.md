# CDI-147 — Guetteur mobile

## Sélection utilisateur

Source explicitement retenue : `exec-98e73dfc-48c4-4434-8256-968ec85db589.png`.
Verdict : « oublie, on valide exec-98e73dfc-48c4-4434-8256-968ec85db589.png ».
Copie exacte : `palisade-lookout-v5-approved.png`.
SHA-256 source et copie :
`E084ECD0C92DADF9A54C1EABC23E76563D9DAB4159EB6D7A022350498CDAF535`.

La prise classique basse remplace la prise inversée de l’ancien sprite par
décision utilisateur. Les essais de dague tenue par la lame pour lancer sont
abandonnés et ne sont pas intégrés. Le premier « validé » de la version
`exec-9da1ec63-9219-4507-bcc6-0eca46093555.png` avait été retiré avant intégration.

## Références et filiation

Génération ImageGen intégrée, trois références initiales :

- Identité et équipement : `originals/palisade-lookout-v1.png`.
- Garde stylisée et proportions : `../cdi-146/smuggler-sworn-blade-v4-approved.png`.
- Arc et corde : `public/assets/images/dungeon/undercity/bastion/rampart-eye-v1.png`.

Premier candidat `exec-f9612545-1661-4b11-a97f-82cd4dc6dbfd.png` : rejeté,
trop chibi et dague mal tenue. Correction `exec-9da1ec63-9219-4507-bcc6-0eca46093555.png` :
tête et cheveux réduits, buste développé ; prise de dague encore rejetée.
Références de cette correction : premier candidat, Lame jurée v4 et
`../cdi-146/tribute-cutthroat-v4-approved.png` pour la prise et l’arme.
La réduction de 15 % demandée au prompt est une consigne, pas une mesure.

Passage à la prise classique : `exec-263e0d10-6ac7-483f-8ba8-5f87ce0c035b.png`.
Main et rendu approuvés, raccord lame/manche à corriger. Trois références :
candidat précédent, Lame jurée v4 et Coupe-jarret v4.

Prompt exact de passage en prise classique :

> Retouche locale de l’image 1. Corriger uniquement la main et la dague À DROITE DE L’IMAGE, avec leur raccord au poignet. Conserver le bras déjà étendu vers le bas et la droite. Remplacer la prise inversée par une PRISE CLASSIQUE anatomiquement correcte de la MAIN GAUCHE : quatre doigts entourent réellement le manche, pouce opposé verrouille la prise près de la garde ; la lame sort du côté pouce/index, le pommeau du côté auriculaire. Poignet détendu, pas de torsion, ne pas dupliquer la main droite tenant l’arc. Image 2 : exemple de garde basse avec prise classique ; image 3 : référence de poignée et petite garde uniquement, ne pas copier les lames courbes. Dague courte à lame DROITE et étroite, garde simple. Pommeau, manche, centre de garde, nervure et pointe forment un seul axe rectiligne continu. Orienter naturellement la dague vers l’avant du personnage, pointe en diagonale bas-gauche, garde au repos ; lame lisible et dégagée de l’arc. Adapter légèrement la position du poignet si nécessaire pour éviter un chevauchement. Préserver strictement tout le reste de l’image 1 : identité, tête et cheveux réduits, proportions, buste, tenue, couleurs, jambes, pieds, arc et main qui le tient, style dessiné 2D et éclairage gauche. Personnage et armes entiers, fond réellement transparent, aucun effet. Un seul candidat.

Le résultat conserve une pointe vers le bas et la droite de l’image ; la main
et le rendu ont été validés visuellement malgré cet écart à la consigne.

## Correction finale retenue

Entrée unique : `exec-263e0d10-6ac7-483f-8ba8-5f87ce0c035b.png`.
Sortie : `exec-98e73dfc-48c4-4434-8256-968ec85db589.png`.
Prompt exact :

> Retouche géométrique STRICTEMENT LOCALE : corriger seulement la lame métallique de la dague, à droite de l’image. Le manche et la main sont validés : ne les modifier en aucun cas. Actuellement la lame descend trop par rapport à l’axe du manche, créant un coude au niveau de la garde. Repérer la droite allant du centre du pommeau doré au centre de la poignée puis au centre de la garde ; prolonger exactement cette droite pour placer la nervure centrale et la pointe. Remonter légèrement la pointe actuelle pour obtenir cette colinéarité. Redessiner une petite lame triangulaire droite et symétrique autour de cet axe, raccordée proprement au milieu de la garde, sans décalage, torsion ni cassure. Garder longueur et largeur comparables. Préserver strictement main, doigts, prise classique, manche, pommeau, garde, bras et TOUT le reste du personnage, proportions, arc, couleurs, lumière, cadrage. Fond réellement transparent, un seul candidat.

## Export

Ancien sprite sauvegardé dans `originals/palisade-lookout-v1.png`.
Export avec `scripts/prepare-dungeon-character-sprite.ps1 -MatchReferenceHeight` :
384 × 384, 111 701 octets. Échelle 1,42 et pivot 0,93 conservés.
Patrouille complète dans son décor validée explicitement par l’utilisateur
le 1er octobre 2026 après intégration du Trait-noir.
