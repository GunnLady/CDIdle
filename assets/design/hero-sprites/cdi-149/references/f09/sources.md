# F09 — recherche de garde à l'épée à deux mains

Recherche effectuée le 20 septembre 2026. Les fichiers externes restent des
références de travail et ne sont pas destinés au runtime du jeu.

## Références examinées

| Famille | Source | Apport | Limite | Décision |
| --- | --- | --- | --- | --- |
| Historique, Italie, début XVe siècle | Morgan Library, Fiore dei Liberi, *Il fior di battaglia*, MS M.383 fol. 12r — https://ica.themorgan.org/manuscript/page/21/77302 | Figure isolée, appuis décalés, deux mains groupées et garde haute prête à frapper | Dessin ancien peu détaillé aux mains ; la lame passe trop près du visage pour le sprite | Retenue pour la structure générale de la garde, avec séparation accrue entre visage et lame |
| Historique, tradition germanique | Gardes `Ochs` et `Pflug`, reproduction étudiée dans *L'art de l'escrime* — https://journals.openedition.org/aes/6184 | Compare garde haute et garde basse, montre genoux souples, centre de gravité et menace de pointe | Deux combattants et deux lames dans la même image ; risque de contamination | Étudiée puis écartée des entrées ImageGen |
| Musée, Europe occidentale, 1400–1450 | Metropolitan Museum of Art, Two-Handed Sword, objet `2023.580.1` — https://www.metmuseum.org/art/collection/search/35388 | Géométrie complète vérifiable : lame droite à deux tranchants, pointe, croix, poignée longue et pommeau ; 146,1 cm, 2,354 kg | Photo d'objet sans pose ; corrosion à traduire en acier illustré entretenu | Retenue comme autorité géométrique de l'arme |
| Musée, Inde (Assam, Naga), XIXe siècle | Metropolitan Museum of Art, Two-Handed Sword, objet `36.25.1356` — https://www.metmuseum.org/art/collection/search/31181 | Contrepoint culturel : arme à deux mains plus courte, silhouette et préhension différentes | Pas de croix européenne et forme moins compatible avec la garde retenue | Comparée puis écartée pour F09 |
| Musée, Birmanie ou Siam, XIXe siècle | Metropolitan Museum of Art, paire d'épées à longue poignée, objets `1979.448.1,2` — https://resources.metmuseum.org/resources/metpublications/pdf/Notable_Acquisitions_1979_1980.pdf | Contrepoint d'Asie du Sud-Est : longues poignées, lames courbes à simple tranchant | PDF et géométrie trop éloignée de l'épée droite choisie | Comparée, non téléchargée et écartée |
| Manga fantasy | VIZ, série officielle *Claymore* — https://www.viz.com/claymore | Lisibilité immédiate d'une guerrière à grande épée, silhouette féminine forte | Épées volontairement surdimensionnées et compositions de couverture | Retenue comme influence de silhouette, non transmise à ImageGen |
| Manga dark fantasy | Dark Horse, page officielle *Berserk* — https://digital.darkhorse.com/pages/156/berserk | Poids visuel, présence et marqueur fantasy puissant | Arme démesurée, incompatible avec les proportions et le cadre du sprite | Étudiée puis écartée |
| Jeu vidéo | Capcom, manuel officiel *Monster Hunter Generations*, Great Sword — https://game.capcom.com/manual/MH_Gen/en/page-101.html | Confirme la lecture jeu vidéo d'une grande épée lente, puissante et capable de garder | Poses surtout orientées attaque et armes très massives | Influence de lisibilité seulement ; non transmise |
| Référence interne validée | `validated-male-v1/warrior-male-06-combat-idle-v1.png` | Style CDI-149, cadrage large, acier peint, prise à deux mains et garde réellement lisible | Personnage, tenue et lame courbe non transposables à F09 | Retenue uniquement pour le langage graphique et le cadrage |

## Références transmises à ImageGen

Quatre références couvrent quatre responsabilités non redondantes :

1. neutre F09 : identité, tenue, palette et proportions ;
2. Morgan Library : structure de la garde haute à deux mains ;
3. Met `2023.580.1` : géométrie de l'épée droite ;
4. M06 validé : langage graphique CDI-149, matière de la lame et cadrage.

La quatrième image est justifiée par le risque déjà observé sur F08 : une photo
d'objet seule peut pousser ImageGen vers un rendu moderne ou photographique.
