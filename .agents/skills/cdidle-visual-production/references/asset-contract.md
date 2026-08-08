# Contrat technique des assets

## Contrat actif CDI-069

CDI-069 utilise des références UI versionnées, pas une carte interactive. Le
header est un ornement de présentation et la maquette fixe la composition. Les
libellés, valeurs, états et zones interactives restent en DOM. La ville complète
est une référence artistique secondaire sans contrat de masque, d'ancrage ou de
hit-test. Les contrats de sprites, chromas et couches restent valables seulement
pour les autres familles d'assets qui utilisent réellement ce pipeline.

## Répertoires

- Conserver sources, prompts, références, aperçus et variantes rejetées sous `assets/design/cdi-069/`.
- Réserver `src/assets/images/town/` aux fichiers réellement consommés par le frontend.
- Ne copier vers le runtime qu'au moment de l'intégration du lot concerné.
- Tenir `assets/design/cdi-069/manifest.json` à jour à chaque changement d'état.

## Géométrie

Les règles ci-dessous concernent uniquement une future scène raster composée en
couches. Elles ne s'appliquent pas au tableau de bord CDI-069.

- Verrouiller le terrain maître à `1448 × 1086` pixels.
- Utiliser un repère dont l'origine est le coin supérieur gauche du terrain.
- Définir l'ancrage d'un bâtiment au centre inférieur de son empreinte au sol.
- Exprimer placement et ancrage en pixels natifs du terrain maître.
- Trier les couches de bâtiments par coordonnée verticale d'ancrage lorsque leurs empreintes se chevauchent.
- Ne pas supposer une grille isométrique mathématique : verrouiller la projection par comparaison au terrain maître.
- Enregistrer la boîte visible, l'ancrage source, l'échelle et l'ancrage terrain dans le manifeste.
- Conserver le même ancrage terrain pour toutes les variantes d'un bâtiment.
- Enregistrer avant génération une boîte visible cible exprimée dans le repère du terrain.

## Validation artistique

- `source-approved` autorise le détourage, pas l'intégration.
- `processed` confirme uniquement alpha, dimensions, franges et fichiers.
- `context-approved` exige un composite au point d'ancrage et à l'échelle prévus.
- Comparer le composite à 100 % et à la taille réelle de l'interface.
- Consigner les motifs d'un rejet selon les catégories `angle`, `proportion`, `palette`, `contrast`, `lighting`, `pixel-density` et `grounding`.
- Ne produire aucune variante de niveau supérieur avant l'approbation contextuelle du niveau de référence.

## Formats et rendu

- Pour le tableau de bord, préférer PNG/WebP rectangulaire et CSS aux détourages
  complexes tant qu'un besoin d'alpha n'est pas prouvé.
- Ne jamais intégrer de valeur de ressource ou de texte fonctionnel au bitmap.
- Conserver les sources chroma en PNG.
- Produire les bâtiments détourés en PNG RGBA.
- Employer une référence statique PNG pour chaque effet animé.
- Ne pas forcer `image-rendering: pixelated` sans comparaison visuelle ; le rendu HD peut nécessiter le filtrage navigateur.
- Charger les secteurs et variantes non visibles à la demande.
- Mesurer tout ajout avec le budget bundle du projet avant intégration.

## Animations

- Garder fumée, flamme, braises et magie indépendantes du sprite du bâtiment.
- Limiter une boucle ambiante à 6–12 images par seconde et environ 1–2 secondes.
- Ne jamais lier une animation décorative au temps de résolution du gameplay.
- Fournir une première image statique cohérente.
- Arrêter ou simplifier l'animation sous `prefers-reduced-motion` et hors viewport.
- Choisir CSS, spritesheet ou canvas pendant l'implémentation frontend selon le nombre d'instances ; ne pas figer cette décision dans le bitmap.

## Contrôles

Exécuter depuis la racine du dépôt :

```powershell
python .agents/skills/cdidle-visual-production/scripts/validate_visual_asset.py --input <source.png> --kind chroma --expected-size 1254x1254
python .agents/skills/cdidle-visual-production/scripts/validate_visual_asset.py --input <sprite.png> --kind alpha --expected-size 1254x1254
python .agents/skills/cdidle-visual-production/scripts/validate_visual_manifest.py --manifest assets/design/cdi-069/manifest.json
```

Le script exige Pillow, déjà requis par le helper de détourage du skill `imagegen`. Compléter le contrôle automatisé par une inspection visuelle.
