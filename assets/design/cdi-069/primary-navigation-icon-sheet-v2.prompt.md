# Planche commune des icônes de navigation principale V2

## Production

- Outil : ImageGen intégré, sans clé API.
- Références exclusivement issues de la direction artistique versionnée :
  `references/header-reference.png`,
  `references/city-dashboard-reference.png` et
  `references/village-complete-reference.png`.
- Aucun ancien sprite ni bouton n'a été fourni comme référence.
- Master chroma local ignoré :
  `sources/primary-navigation-icon-sheet-v2-chroma.png`.
- Extraction déterministe :
  `scripts/prepare-primary-navigation-icon-sheet.ps1`.
- Chaque quadrant source mesure `627 x 627 px` et est réduit intégralement vers
  `192 x 192 px`, sans recadrage ni redimensionnement individuel du sujet.
- Affichage initial : boîte DOM `64 x 64 px` sur desktop et `20 x 20 px` en
  compact. Après validation en contexte, Cité utilise une exception desktop de
  `60 x 55 px` avec déformation verticale CSS volontaire, un décalage
  horizontal de `-2 px` et un décalage vertical de `-4 px`. Aventuriers
  conserve `64 x 64 px` avec un décalage horizontal de
  `+3 px` et un décalage vertical de `-9 px`; son libellé utilise `-7 px`.
  Donjon conserve `64 x 64 px`
  avec un décalage horizontal de `-2 px` et un décalage vertical de `+3 px`;
  son libellé utilise `-7 px`.
  Coffre conserve `64 x 64 px` avec un décalage horizontal de `+3 px` et un
  décalage vertical de `+1 px`; son libellé utilise `-7 px`.

## Prompt final

```text
Use case: stylized-concept
Asset type: brand-new master 2 × 2 sprite sheet for the four CDIdle primary-navigation icons

Input images and roles:
- Image 1: CDIdle header art-direction reference only — aged gold, cold steel, dark walnut, violet gems, warm amber highlights, crisp ornamental fantasy rendering.
- Image 2: CDIdle city-dashboard art-direction reference only — readable dark-fantasy UI hierarchy, architecture, materials, and warm/cool balance.
- Image 3: CDIdle village art-direction reference only — medieval world identity, stone, wood, slate, atmosphere, and handcrafted character.
Do not copy any icon, layout, object, emblem, or previous sprite from the input images. Invent all four icons from scratch. No previous navigation-icon composition exists for this request.

Primary request:
Create one square 2 × 2 master sprite sheet containing exactly four new isolated hand-painted medieval dark-fantasy navigation icons. The four icons must form one coherent family and must have genuinely consistent proportions, optical weight, brightness, detail density, and silhouette footprint.

Mandatory quadrant order:
- TOP LEFT: CITÉ
- TOP RIGHT: AVENTURIERS
- BOTTOM LEFT: DONJON
- BOTTOM RIGHT: COFFRE

Strict shared geometry — highest priority:
- Divide the square canvas mentally into four equal invisible square cells.
- Place exactly one icon at the exact geometric center of each cell.
- Every icon must fit inside the same invisible near-square optical box.
- Every visible silhouette must be approximately as tall as it is wide, with an overall width-to-height ratio between 0.85:1 and 1.15:1.
- Each icon's visible silhouette must occupy approximately 64% of its cell width and 64% of its cell height.
- Give all four subjects equivalent visible area and perceived mass, not merely equivalent maximum dimensions.
- Keep identical empty padding around all four silhouettes: at least 18% of the cell on the top, bottom, left, and right.
- Align all four icons on equivalent optical centers and equivalent visual baselines.
- No icon may be long and flat. No icon may be tall and narrow. No icon may be noticeably larger, denser, brighter, or more detailed than another.
- Do not let weapon tips, roofs, flames, or chest corners escape the shared near-square footprint.
- The four equal cells will later be extracted and downscaled identically without individual resizing. The generated relative scale must therefore already be correct.
- No visible cell grid, borders, guides, labels, captions, or separators.

Shared rendering and palette:
- Polished hand-painted fantasy game UI icon style; mature, elegant, compact, readable, slightly weathered.
- Crisp dark outer contour around each silhouette; bold chunky forms; broad material highlights; limited micro-detail.
- Designed to remain recognizable at 64 × 64 px.
- Near-front orthographic or extremely shallow perspective; no dramatic camera angle.
- Consistent upper-front-left light direction and consistent contrast across all four icons.
- Bright enough for dark-walnut navigation buttons, without looking luminous or neon.
- Shared materials: dark dressed stone, cool steel, steel-blue slate, warm aged walnut, dark carved wood, restrained antique-gold fittings, small violet accents, warm amber interior light.
- No cartoon exaggeration, no photorealism, no pixel art, no flat vector style.

TOP LEFT — CITÉ, invented from scratch:
- Create a compact vertical medieval civic hall or governor's palace with an almost square silhouette.
- One strong central municipal tower occupies most of the composition, with a steep steel-blue slate roof and a small antique-gold civic finial.
- Two very short attached side wings, each no wider than one quarter of the central tower, keep the total building compact rather than panoramic.
- A large welcoming arched central doorway, two or three broad warm amber-lit windows, restrained aged-gold civic trim, and two tiny vertical pennants integrated close to the tower.
- Dark dressed stone with readable cool midtones.
- The total visible building must be nearly as tall as it is wide. Prioritize vertical compactness and a strong central tower over a wide façade.
- It must read as a civic administrative building and the heart of a city, not a military castle, dungeon, church, bank, ordinary house, or city panorama.
- No crenellations, battlements, defensive walls, portcullis, moat, weapons, shield, crown, sprawling wings, long horizontal façade, skyline, or surrounding buildings.

TOP RIGHT — AVENTURIERS, invented from scratch:
- Create one compact near-square party emblem.
- One short broad medieval sword and one short sturdy arcane staff cross in a compact X.
- One small warm walnut lute sits upright behind them, with its rounded body clearly visible in the center.
- Shorten the sword and staff deliberately so neither diagonal tip extends beyond the shared near-square optical box.
- Sword: bright cold-steel blade, compact aged-gold guard, dark grip.
- Staff: dark carved wood, compact faceted violet crystal in a restrained aged-gold mount.
- Lute: rounded body, short neck, broad readable strings, restrained gold edge.
- Exactly one sword, one staff, one lute. All three identifiable at 64 × 64 px without creating a tall or elongated composition.
- No people, hands, faces, armor, shield, bow, arrows, helmet, extra weapons, runes, aura, particles, or ribbon.

BOTTOM LEFT — DONJON, invented from scratch:
- Create one compact near-square ancient dungeon entrance.
- A heavy rounded arch made of broad weathered dark-stone blocks surrounds a deep violet-black opening.
- Exactly three broad stone steps visibly descend inward through the arch.
- Two tiny symmetrical amber torches are integrated tightly into the inner sides of the arch, contained within the shared silhouette.
- A subtle violet point of light deep inside the darkness, contained entirely within the doorway and never forming an external portal aura.
- A few broad cracks and restrained aged-gold torch brackets; no excessive masonry detail.
- The arch's visible width and height must be almost equal.
- It must read as descent and dungeon exploration, not as a castle, city gate, mine, cave, church, prison, fireplace, house door, or magical portal.
- No skull, bones, monster, eye, face, bars, portcullis, chains, weapons, shield, tower, treasure, smoke, or particles.

BOTTOM RIGHT — COFFRE, invented from scratch:
- Create one compact tall-proportioned medieval storage chest with a near-square silhouette.
- Use a high strongly domed lid and a substantial chest body so the visible height nearly equals the visible width; do not make a long flat chest.
- Show the lid closed but lifted by a very narrow gap that reveals one controlled warm amber line from inside.
- Warm dark-walnut planks, broad cool-steel reinforcing bands, restrained antique-gold corner fittings and one large central gold latch.
- Chunky feet, bold readable structure, minimal rivets.
- It represents inventory and storage, not an exploding treasure reward.
- Exactly one chest; no loose coins, gems, weapons, bottles, scrolls, keys, spilling loot, mimic teeth, eyes, chains, detached padlock, aura, or surrounding badge.

Background and extraction contract:
- The entire canvas background must be one perfectly flat, perfectly uniform solid #00ff00 chroma-key color.
- Use #00ff00 only for the background. Never use green in any icon material, reflection, shadow, highlight, gem, flame, or internal light.
- No floor plane, contact shadow, cast shadow, reflection, gradient, vignette, texture, halo, bloom, mist, smoke, particles, or lighting variation in the background.
- All space between the four invisible cells must remain perfectly uniform #00ff00.
- Keep crisp clean antialiased subject edges suitable for deterministic chroma-key removal.

Absolute exclusions:
- No text, letters, words, captions, labels, numbers, visible runes, watermark, signature, logo, visible grid, cell dividers, frames around cells, background panels, shields behind icons, circular badges, ribbons, characters, hands, scenery, ground, landscape, decorative junctions, or fifth object.
- Exactly four isolated icons and only four, in the mandatory quadrant order.
```

## Bornes visibles mesurées dans les cellules source

- Cité : `[104, 48, 475, 573]`.
- Aventuriers : `[78, 141, 428, 479]`.
- Donjon : `[91, 63, 494, 453]`.
- Coffre : `[59, 99, 452, 429]`.

Ces différences sont conservées volontairement par l'extraction commune et
doivent être évaluées en contexte avant tout ajustement individuel.
