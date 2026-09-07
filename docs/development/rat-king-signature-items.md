# Série du Roi des Rats — fiches de conception

## Statut

Décisions validées et intégrées : Croc du Roi, Manteau des Exclus et Chaîne des tributs, chacun avec son blueprint ; un composant commun à leurs recettes. Niveau 35, rareté épique minimale, statistiques fixes, malus sur la version épique et aucun malus sur la version légendaire. Le harness et le jeu appliquent ces règles ; leur équilibrage reste configurable.

Référence : [prompt de progression](undercity-progression-prompt.md). L'intégration produit est décrite dans [l'architecture des Dessous de la Cité](../architecture/undercity.md).

## Référence au boss réellement simulé

Dans scripts/helpers/undercity-groups.mjs, le Roi est accompagné de deux gardes. Tant qu'un garde vit : attaque ×0,75 et défenses physique/magique ×1,15. Après leur mort : attaque ×1,10 et défenses ×0,85 au round suivant. Le récit en fait un souverain intelligent et monstrueux, protecteur des Exclus. Aucun pouvoir personnel de soin, poison, invocation ou aura de commandement n'est établi par cette lecture.

Les objets évoquent ces aspects par des propriétés permanentes existantes. Ils ne reproduisent pas automatiquement son changement de phase.

## Base de chiffrage proposée

Niveau d'objet et niveau requis : 35 fixes ; rareté minimale : épique ; légendaire possible. L'étage 50 n'est pas un niveau d'objet 50 : la génération actuelle plafonne à 40. Les campagnes doivent encore vérifier que le groupe atteint bien un niveau compatible au moment du premier Roi.

Les valeurs suivantes sont les valeurs FINALES résolues à ce niveau et cette rareté, avant application aux statistiques du héros. Ne pas les recopier comme valeurs brutes de catalogue : les multiplicateurs canoniques de rareté et éventuellement de niveau s'appliqueraient à nouveau. Les pourcentages sont des modificateurs de statistiques, pas des pourcentages de réduction finale des dégâts.

## 1. Croc du Roi

- Objet : dague à une main, main principale, dégâts physiques, scaling de finesse sur AGI suivant la dague canonique.
- Identité : un croc démesuré du Roi monté sur une poignée ; souvenir de sa brutalité lorsqu'il perd ses gardes.
- Description : « Même arraché à sa mâchoire, le croc cherche encore la gorge des vivants. »
- Épique : dégâts 105–193 ; vitesse d'arme 1,35 ; dégâts physiques +40 % ; critique +15 points ; vitesse +20 % ; résistance sacrée −15.
- Légendaire : dégâts 150–275 ; vitesse d'arme 1,35 ; dégâts physiques +55 % ; critique +22 points ; vitesse +30 % ; aucun malus.
- Compromis épique : faiblesse sacrée de la relique impure. Aucun déclenchement, frappe supplémentaire ou altération.
- Compatibilité : règles actuelles d'accès aux dagues ; ne pas accorder l'arme à toutes les classes.
- Blueprint : Plan du Croc du Roi.

## 2. Manteau des Exclus

- Objet : armure de cuir (leather_armor), emplacement armure ; manteau renforcé, pas accessoire de catégorie cloak.
- Identité : manteau royal rapiécé et renforcé par les Exclus ; évoque le Roi protégé et la solidarité de sa cour.
- Description : « Chaque pièce de cuir porte la marque d'un Exclu auquel le Roi avait offert refuge. »
- Épique : défense physique +100 % ; défense magique +60 % ; PV maximum +45 % ; résistance au feu −15.
- Légendaire : défense physique +260 % ; défense magique +160 % ; PV maximum +110 % ; aucun malus.
- Compromis épique : les pièces récupérées sont inflammables. Les bonus concernent uniquement le porteur.
- Compatibilité : règles actuelles d'accès aux armures de cuir. Aucun changement de permissions d'équipement.
- Blueprint : Plan du Manteau des Exclus.

## 3. Chaîne des tributs

- Objet : amulette, emplacement accessoire.
- Identité : collier du Roi composé de pièces et de maillons payés par les contrebandiers. Il matérialise son emprise sur les dessous de la cité.
- Description : « Chaque maillon avait acheté le droit de traverser son royaume. »
- Épique : PV maximum +50 % ; vitesse +20 % ; esquive +10 points ; résistance au poison +30 ; mana maximum −10 %.
- Légendaire : PV maximum +70 % ; vitesse +28 % ; esquive +16 points ; résistance au poison +46 ; aucun malus.
- Intention : survie mobile et polyvalente ; se distinguer des défenses du Manteau, sans spécialisation magique ni bonus de dégâts.
- Le collier et le lien thématique entre survie, esquive et poison sont des propositions narratives. Ils ne signifient pas que le Roi possède une capacité spéciale d'esquive ou de poison dans le harness actuel.
- Compromis épique : instinct et survie au détriment de la concentration. Aucun effet déclenché, aura ou pouvoir inédit.
- Blueprint : Plan de la Chaîne des tributs.

## Craft et acquisition

Chaque objet et son blueprint sont éligibles au loot normal du Roi dès sa première victoire et ensuite en farm. Aucun des trois n'est garanti par la prime personnelle de première victoire. Les blueprints sont distincts et conservés après fabrication.

Composant commun : Marque du Roi, pièce de tribut frappée de son sceau. Paramètres expérimentaux du harness : 1–2 Marques garanties par victoire ; 6 Marques, 18 débris métalliques et 3 métaux raffinés par recette ; 15 % de chance de signature directe ; 20 % de chance de découvrir un blueprint manquant ; 4 % de chance de craft légendaire. Un drop signature est légendaire avec la proportion 4/23, tirée des poids épique/légendaire du palier final. Aucun pity. Les recettes utilisent les mêmes propriétés d'objet que le drop.

## Validation effectuée et restante

1. Fait : les helpers canoniques résolvent les valeurs finales sans double scaling ; les tests vérifient les malus épiques, leur absence en légendaire et les bonus critiques plats.
2. Fait : types, emplacements, niveau 35, restrictions de dague et de cuir passent la validation du catalogue injecté. Les héros de campagne atteignent le Roi aux niveaux 35 à 40.
3. Fait dans le harness : comparaison avec 100 affixes déterministes par base ordinaire comparable, au niveau 35 et à rareté égale, sur un Voleur représentatif. Le score reprend les statistiques de combat canoniques et isole le rôle de chaque objet : offense du Croc, robustesse du Manteau, survie mobile de la Chaîne. Le seuil retenu pour qualifier une signature de puissante est le 90e percentile des objets ordinaires de même rôle.
4. Fait en déterministe : trois plans séparés, conservation du plan, composant commun, consommation exacte, première victoire/farm et tirage unique par rencontre. Sur dix parcours naturels, quatre plans et trois signatures directes apparaissent ; aucune fabrication, car le seul parcours réunissant plan et six Marques reçoit le plan à sa dernière victoire.
5. Fait dans le produit : les objets, plans, Marques et recettes utilisent le domaine partagé, la résolution canonique et la persistance v5. Les effets avancés restent différés ; les tests automatisés couvrent le catalogue, la forge et la résolution du Roi.

## Comparaison de puissance

Commande : `node scripts/analyze-rat-king-signature-power.mjs`.

Après recalibrage, les six variantes dépassent le 90e percentile ordinaire de leur rôle :

| Signature | Épique | Légendaire |
| --- | ---: | ---: |
| Croc du Roi | percentile 100 ; +3,0 % au-dessus du meilleur échantillon | percentile 100 ; +6,5 % au-dessus du meilleur échantillon |
| Manteau des Exclus | percentile 96 | percentile 95 |
| Chaîne des tributs | percentile 91,2 | percentile 91 |

Cette preuve établit une puissance élevée dans l'identité prévue, pas une domination de toutes les constructions. Elle ne mesure pas encore la durée d'un parcours complet équipé de chaque signature.


## Intégration produit autorisée — 2026-09-06

Les trois signatures, leurs plans et la Marque du Roi sont maintenant définis dans le domaine partagé et raccordés au loot canonique du Roi et à la forge. Les effets avancés restent différés. Voir [l'architecture des Dessous de la Cité](../architecture/undercity.md) et [le domaine de forge](../architecture/forge-domain.md).
