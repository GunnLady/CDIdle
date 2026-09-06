# Handoff — calibration idle de la Forge

## Objet

Ce document prépare la reprise du sujet Forge sans rouvrir les décisions déjà validées et sans transformer une expérience du harness en règle fonctionnelle. Toute nouvelle modification de comportement doit être discutée et validée avant son ajout au harness. Les taux et coûts peuvent être explorés comme paramètres d'équilibrage clairement identifiés.

## Références et ordre de priorité

1. [Domaine Forge](../architecture/forge-domain.md) : comportement autoritaire actuellement implémenté.
2. [Plan consolidé Forge](forge-item-evolution-plan.md) : décisions fonctionnelles figées, progression du bâtiment, recettes, previews et compatibilité.
3. [Catalogue des objets](../architecture/item-catalog.md) : niveaux, raretés, familles actives et persistance des instances.
4. [Rythme idle v4](loot-idle-rhythm-v4.md) : dernière décision utilisateur sur le rythme. Il annule les quotas arbitraires et porte le loot régulier désormais retenu.
5. [Interface de l'atelier](forge-workshop-ui.md) : parcours frontend déjà défini et validé techniquement.
6. [Handoff loot/forge du 5 septembre](session-2026-09-05-loot-forge-handoff.md) : contexte historique et contraintes d'exécution.

Documents historiques utiles uniquement pour leurs mesures :

- [Diagnostic initial](loot-economy-harness.md) ;
- [Expériences loot/forge v1](loot-idle-experiments.md) ;
- [Protocole de flux v2](loot-idle-flow-v2.md) ;
- [Pilote budget et procs v3](loot-idle-budget-v3.md).

Leurs anciennes cibles « 1–3 loots », « 1–2 améliorations », croissance obligatoire des tentatives et durée imposée ne sont plus des critères produit.

## État acquis

- Le loot idle régulier est intégré au domaine partagé et validé sur 100 campagnes : objet de secours sur coffre ou salle finale, puis chance de 5 à 12 % sur un combat ordinaire selon le héros le moins avancé.
- La Forge possède huit niveaux, 48 familles actives, des plans persistants, des previews de rareté, des coûts d'acceptation et un recyclage autoritaire.
- Les objets et plans legacy restent compatibles sans redevenir des recettes actives.
- Les comptes de matériaux, l'absence de cycle craft/recyclage gratuit, le RNG et les replays sont couverts par les validations existantes.
- Aucune cible chiffrée de durée, de crafts ou d'améliorations n'est active.

## Sujet encore ouvert

Les probabilités alternatives de forge, le recyclage renforcé et la préservation de scraps ont seulement été testés dans le harness. Aucun candidat n'a été validé pour le produit.

Les résultats v4 montrent :

| Profil | Durée moyenne | Crafts | Objets forgés équipés |
| --- | ---: | ---: | ---: |
| Forge actuelle avec loot historique | 9,15 h | 155,78 | 55,28 |
| Loot retenu + recyclage renforcé | 6,82 h | 451,38 | 74,55 |
| Courbe de rareté expérimentale | 7,40 h | 439,60 | 55,65 |
| Courbe expérimentale + préservation | 7,23 h | 677,82 | 64,27 |

Ces valeurs décrivent les trajectoires du bot. Elles ne désignent aucun gagnant et ne prouvent pas le ressenti d'un joueur.

## Questions à traiter lors de la reprise

1. Quel problème joueur précis cherche-t-on à résoudre dans la Forge actuelle : manque de tentatives intéressantes, manque de matériaux, trop longues périodes sans offre utile, ou faible contrôle sur la recette ?
2. Veut-on modifier une règle fonctionnelle ou seulement calibrer les probabilités et coûts existants ?
3. Quels résultats doivent être observés sans réintroduire un quota arbitraire : distribution des offres, périodes sans craft utile, consommation de ressources, diversité des objets équipés et évolution par tranche ?
4. Quelle validation dans le jeu complétera le harness pour le ressenti en session et hors ligne ?

## Méthode de reprise

1. Choisir avec l'utilisateur un seul problème et une seule hypothèse.
2. Présenter toute modification fonctionnelle avant de toucher au harness.
3. Garder la Forge actuelle comme témoin et le loot canonique identique entre profils.
4. Tester d'abord en déterministe et sur un petit pilote.
5. Ne lancer 100 seeds sur dix processus qu'après lecture du pilote.
6. Auditer ressources, RNG, équipements uniques, sauvegarde/replay et absence de cycle gratuit.
7. Présenter distributions et conséquences avant toute intégration produit.

## Hors périmètre automatique

- Aucun auto-recyclage dans le jeu.
- Aucun pity, système de maîtrise ou garantie de proc implicite.
- Aucun changement de puissance des raretés, coût, probabilité ou source de plan sans décision explicite.
- Aucun objectif de durée dérivé directement des heures simulées.
