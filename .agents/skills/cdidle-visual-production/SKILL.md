---
name: cdidle-visual-production
description: Produire, modifier, valider et intégrer les assets raster de CDIdle dans une direction artistique isométrique cohérente. Utiliser ce skill pour les terrains, bâtiments évolutifs, routes, effets visuels, décors, sprites et aperçus de composition du village, ainsi que pour contrôler leur détourage, leur superposition et leur intégration en couches.
---

# Production visuelle CDIdle

## Objectif

Produire les visuels sans dégrader les assets validés. Construire chaque scène par couches indépendantes et conserver une chaîne de production reproductible.

## Architecture active du village

Pour CDI-069, la Cité est un tableau de bord et non une carte interactive. Le
header et la composition validée servent de références UI ; la ville complète
reste une référence artistique secondaire. Ne produire aucun masque, hit-test
bitmap ou détourage de bâtiment pour piloter l'interface. Consulter
`references/town-assets.md` avant toute action sur le village.

Lire [references/art-direction.md](references/art-direction.md) avant toute génération, [references/asset-contract.md](references/asset-contract.md) avant toute préparation technique et [references/town-assets.md](references/town-assets.md) pour le village.

## Utiliser les outils adaptés

- Utiliser le skill système `imagegen` pour générer ou éditer un bitmap.
- Utiliser `view_image` avant d'éditer un fichier local absent de la conversation.
- Utiliser les scripts fournis pour contrôler et composer les fichiers de façon déterministe.
- Ne pas employer ImageGen pour une superposition, un détourage reproductible ou une modification de code.
- Ne pas introduire de chroma au runtime pour un asset pouvant être détouré pendant la production.

## Maintenir les états

Attribuer un état explicite dans le manifeste :

1. `draft` : proposition brute non validée ;
2. `source-approved` : sprite isolé approuvé, sans garantie d'intégration ;
3. `processed` : préparation technique contrôlée, sans garantie artistique ;
4. `context-approved` : superposition à l'échelle réelle approuvée ;
5. `integrated` : consommé et vérifié dans le produit ;
6. `rejected` : variante conservée uniquement pour traçabilité.

Ne jamais présenter un asset comme final avant l'état correspondant. Ne jamais remplacer un asset validé sans accord explicite.

## Suivre le workflow

### 1. Cadrer

- Identifier fonction, niveau, empreinte maximale, couche et état initial en jeu.
- Lire `assets/design/cdi-069/manifest.json` et les références validées.
- Fixer canevas, point d'ancrage, boîte visible cible et zone de terrain avant une série évolutive.
- Définir l'échelle d'affichage cible avant de juger les proportions ou la densité de pixels.
- Générer un seul élément à la fois, sauf demande explicite de variantes.

### 2. Générer le sprite brut

- Prendre le terrain maître et les bâtiments déjà intégrés comme références prioritaires ; utiliser le sprite isolé seulement pour son identité.
- Préserver perspective, échelle, palette locale, contraste, lumière et empreinte prévus.
- Demander un fond chroma uniforme et une marge généreuse.
- Choisir une clé absente du sujet ; utiliser le contrat pour les sujets végétaux.
- Exclure décor, route, texte, personnage, watermark et élément non demandé.
- Intégrer la lumière structurelle ; isoler les effets dynamiques.

### 3. Approuver la source isolée

- Montrer le sprite brut sans le qualifier de validé dans le jeu.
- Examiner angle, silhouette, matériaux et contenu, puis passer seulement à `source-approved`.
- Ne jamais déduire la qualité en contexte d'une image isolée sur chroma.
- En cas de refus, modifier seulement le sprite concerné. Ne jamais régénérer le terrain complet.
- Archiver une variante rejetée hors du chemin canonique.

### 4. Préparer

- Conserver la source chroma validée et son prompt.
- Appliquer le helper fourni par `imagegen`.
- Exécuter `scripts/validate_visual_asset.py` sur la source et le PNG alpha.
- Exécuter `scripts/validate_visual_manifest.py` après toute mise à jour du manifeste.
- Vérifier visuellement les contours après le contrôle automatisé.
- Traiter `processed` comme un état purement technique.
- Signaler tout détourage invalide et demander confirmation avant un fallback natif.

### 5. Valider en contexte

- Utiliser `scripts/compose_visual_preview.py` pour superposer sans repeindre.
- Produire trois vues : source isolée, alpha sur fond neutre et composite à l'échelle réelle.
- Comparer explicitement angle, proportions, palette, contraste, lumière, densité de pixels et raccord du sol.
- Ajuster uniquement ancrage et échelle lorsque le sprite est compatible ; régénérer le sprite si l'un de ces critères reste faux.
- Garder routes, ombres et effets dans des couches distinctes.
- Passer à `context-approved` seulement après approbation explicite du composite.
- Enregistrer les coordonnées retenues dans le manifeste après cette approbation.
- Interdire la production des variantes supérieures tant que le niveau de référence n'est pas `context-approved`.

### 6. Intégrer

- Copier l'asset traité dans le répertoire runtime seulement pendant le lot frontend concerné.
- Mettre à jour le catalogue visuel typé sans déplacer de logique métier dans l'UI.
- Vérifier chargement différé, poids, cadrage, états, responsive et réduction des animations.
- Passer l'asset à `integrated` seulement après preuve dans l'application.
- Rapporter chemins, prompt, mode de génération et validations.

## Respecter les couches

Cette section s'applique uniquement aux scènes raster réellement composées en
couches. Elle ne décrit pas l'architecture active du tableau de bord CDI-069.

1. terrain maître immuable ;
2. bâtiments ;
3. routes et chemins ;
4. ombres et lumières contextuelles ;
5. fumée, flammes, étincelles et particules ;
6. survol, sélection, marqueurs et informations UI.

Ne jamais cuire un emplacement vide, une route future ou un indicateur UI dans le terrain maître.

## Contrôler avant intégration

- Confirmer projection, échelle, ancrage et empreinte.
- Confirmer proportions entre hauteur des murs, toiture et empreinte au sol.
- Confirmer palette, saturation et luminosité par rapport à la zone locale du terrain.
- Confirmer que contours, micro-contraste et densité de pixels ne rendent pas le sprite plus net que la scène.
- Confirmer que direction, intensité et température de lumière correspondent au terrain.
- Confirmer matériaux, volumes et lumière structurelle à l'échelle finale, pas uniquement sur la source.
- Confirmer l'absence d'effet dynamique figé.
- Confirmer alpha, franges, dimensions et budget fichier.
- Confirmer l'intégrité du terrain maître.
- Confirmer que visibilité et variante restent pilotées par les données.
- Confirmer un fallback statique avec `prefers-reduced-motion` pour chaque animation.
