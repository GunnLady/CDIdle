# Direction artistique CDIdle

## Références versionnées

- Header : `assets/design/cdi-069/references/header-reference.png`.
- Composition UI : `assets/design/cdi-069/references/city-dashboard-reference.png`.
- Ville complète validée : `assets/design/cdi-069/references/village-complete-reference.png`.

La maquette de composition fixe la hiérarchie du shell et des panneaux. La
ville complète reste une référence secondaire pour la perspective, l'échelle,
les matières, la palette et la lumière des futures illustrations. Elle ne sert
plus de surface interactive et ne doit pas être découpée en masques.

## Style validé

- Employer un pixel art isométrique HD, propre et détaillé.
- Conserver une fantasy sombre mais lisible, texturée par le bois, la pierre, le métal et la végétation.
- Employer des silhouettes nettes et des volumes lisibles à l'échelle du jeu.
- Éviter les rendus génériques, plats, trop lisses ou excessivement cartoon.
- Conserver l'ornement bois, or et gemmes violettes du header sans sacrifier la lecture des ressources.

## Lumière et atmosphère

- Intégrer les sources structurelles : fenêtres, lanterne fixée et reflets locaux.
- Contenir la lumière projetée dans l'empreinte du bâtiment.
- Séparer fumée, flamme mouvante, braises, étincelles, poussière et magie pulsante.
- Garder les ombres séparées lorsqu'elles dépendent de la scène.
- Éviter les fenêtres noires pour un bâtiment actif et habité.

## Compatibilité en contexte

Évaluer chaque sprite sur le terrain maître à sa taille finale. Une belle source isolée peut rester incompatible avec la scène.

- **Angle** : faire correspondre la hauteur de caméra, les axes du toit, les murs visibles et l'empreinte aux petits bâtiments des références. Rejeter une vue trop frontale ou trop verticale.
- **Proportions** : fixer une boîte visible cible sur le terrain. Comparer hauteur, largeur et masse du toit aux arbres, rochers et bâtiments voisins. Rejeter une toiture dominante ou des murs trop hauts.
- **Densité urbaine** : contrôler chaque empreinte dans la composition complète validée. Ne pas agrandir un bâtiment isolé uniquement parce qu'il paraît petit sur le terrain vide ; préserver l'espace nécessaire aux quatorze bâtiments et à leurs chemins.
- **Palette** : prendre la zone locale du terrain comme source principale. Employer des bois, pierres et sols désaturés compatibles avec ses verts olive et gris froids.
- **Contraste** : éviter les contours noirs, ombres bouchées et détails plus tranchants que le terrain. Juger à 100 % de la taille d'affichage.
- **Lumière** : reprendre l'heure, la direction et la douceur du terrain. En plein jour, limiter les fenêtres chaudes à un signe de vie ; interdire le halo nocturne ou la nappe orange au sol.
- **Densité de pixels** : comparer la taille apparente des détails après mise à l'échelle. Rejeter un sprite plus grossier, plus lisse ou artificiellement plus net.
- **Raccord au sol** : harmoniser teinte, texture et contour de l'empreinte. Garder les routes hors du sprite.

Présenter successivement la source chroma, le PNG alpha sur fond neutre et le composite réel. Ne demander la validation finale que sur le composite.

Retour d'expérience Cabane rejetée : ne pas reproduire une caméra trop basse, un volume trop grand, une toiture trop verticale, des bruns orangés saturés, un contour trop dur ni des fenêtres jaunes avec halo sur un terrain diurne.

## Village

- Utiliser la maquette validée comme référence de composition du tableau de bord.
- Rendre les valeurs, libellés, états et actions avec des éléments DOM.
- Utiliser le header comme ornement adaptable, jamais comme texte aplati.
- Utiliser des miniatures rectangulaires ou des placeholders cohérents tant
  qu'aucun asset de bâtiment n'est approuvé.
- Ne pas créer de carte interactive, masque ou hit-test bitmap.
- Ne pas déduire l'état construit/non construit depuis les pixels : l'état
  canonique pilote les libellés, niveaux, verrouillages et actions.

## Chroma

- Utiliser `#00ff00` pour les sujets non végétaux.
- Utiliser `#ff00ff` lorsqu'un sujet contient du vert important.
- Choisir une autre clé seulement si elle est absente du sujet et la consigner dans le manifeste.
- Exiger un fond uniforme sans gradient, vignette, texture ni ombre.
- Conserver le sol propre au bâtiment dans son empreinte ; exclure toute route sortante.
- Détourer hors runtime et valider avant superposition.

## Interdictions

- Ne pas régénérer une scène complète pour ajouter un bâtiment.
- Ne pas ajouter spontanément clôture, jardin, personnage, route ou bâtiment secondaire.
- Ne pas masquer un échec de détourage par un fichier prétendument final.
- Ne pas refactorer `HeroPortrait` pour les bâtiments : les nouveaux sprites doivent être préparés avec alpha avant intégration.
