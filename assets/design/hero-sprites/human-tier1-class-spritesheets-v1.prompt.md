# Sprites humains par classe T1 — prompts V1

## Périmètre

- Outil prévu : édition ImageGen, une édition par sexe et par classe.
- Référence homme : `src/assets/images/human-novice-male.jpg`.
- Référence femme : `src/assets/images/human-novice-female.jpg`.
- Livrables prévus : 18 planches, soit neuf classes T1 pour chacun des deux
  sexes.
- Les deux planches Novice existantes restent les sources canoniques et ne sont
  pas régénérées.

Pour chaque génération, concaténer le bloc commun ci-dessous au prompt de
classe concerné. Utiliser uniquement la planche Novice du sexe correspondant
comme image d'entrée.

## Direction artistique commune obligatoire — toutes les classes et les deux sexes

```text
Shared Tier 1 direction: do not preserve the original small shoulder bag as a repeated default. Remove the original shoulder satchels from most characters; most characters must have no bag at all, and only a small minority may have a tiny, varied belt pouch when it strongly supports the class. The 20 outfits must not look like one repeated uniform: vary garment cuts, layer placement, sleeve lengths, belts, boots, gloves and the distribution of compact class details from character to character. Keep every outfit deliberately simple, modest and beginner-level because this is Tier 1, while retaining one or two immediately readable visual characteristics of the selected class. Use no veteran, elite, ornate or high-tier equipment.
```

## Homme — Guerrier

> **Prompt historique remplacé par CDI-137.** Ne pas le réutiliser comme
> direction autoritaire ; les vingt identités Guerrier validées sont dans
> `assets/design/hero-sprites/cdi-137/validated-{male,female}-v1/`.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied but clearly recognizable early Tier 1 Warrior outfits. Keep the equipment modest and beginner-level, not a matching uniform: distribute distinct combinations of simple padded tunics, plain reinforced gambesons, light leather jerkins, occasional small chainmail panels, compact bracers, broad belts and sturdy boots. Only a minority may have one small shoulder guard; avoid full armor. Use restrained ochre, brown, dark red, beige and muted steel accents while preserving each character's visual individuality. Remove the original large shoulder satchels; a few characters may instead have different tiny belt pouches, while most have no bag. Do not add held weapons.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, bags and compact body-worn class details below the hairline; give the 20 characters visibly different clothing arrangements while retaining one simple Warrior vocabulary; preserve the original character order; exactly 20 characters; no text, labels, symbols, weapons in hands, shields, helmets, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: repeated identical outfits, a bag on every character, veteran or high-tier armor, full plate, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, enlarged armor, oversized pauldrons, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Voleur

> **Prompt historique remplacé par CDI-138.** Ne pas le réutiliser comme
> direction autoritaire ; les vingt identités Voleur validées sont dans
> `assets/design/hero-sprites/cdi-138/validated-{male,female}-v1/`.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied but clearly recognizable early Tier 1 Rogue outfits with the visual language of novice scouts, burglars and street thieves, never martial artists. Distribute simple combinations of buttoned or buckled leather vests, practical overshirts, narrow collars, short split-tail jerkins, close trousers, slim utility belts, soft boots, subtle hidden-pocket seams and occasional muted violet accents. Use varied straight or slightly irregular medieval garment cuts, but no wrap-front tunics, crossed kimono-like lapels, waist sashes, martial-arts uniforms, sleeveless dojo silhouettes or hand wraps. Keep the gear restrained and beginner-level, not a matching uniform. Keep every hairstyle fully visible: no hood, mask or head covering. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny belt pouch. Do not add held weapons.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, symbols, weapons in hands, hoods, masks, helmets, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: martial-artist appearance, monk or pugilist clothing, wrap-front tunics, crossed lapels, gi or kimono cuts, waist sashes, hand or forearm wraps, repeated identical outfits, a bag on every character, veteran or high-tier equipment, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, assassin clichés, oversized knives, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Archer

> **Prompt historique remplacé par CDI-139.** Ne pas réutiliser ses contraintes
> de petit carquois dorsal ou d’interdiction du carquois de hanche. La direction
> validée et les vingt identités autoritaires sont documentées dans
> `assets/design/hero-sprites/cdi-139/archer-identities-and-inspirations.md` :
> aucune arme tenue ou portée, carquois et accessoires de tir fortement lisibles,
> inspirations historiques variées et accessoires sans lien avec l’équipement réel.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied, unmistakable early Tier 1 Archer outfits while preserving the visual richness and adventurous polish of the Novice designs. Match the approved Druid V2 sheets' level of detail: layered materials, crisp edging, visible wear and individualized construction without making the equipment high-tier. Every character must combine three strong Archer markers: one small back-mounted quiver behind a shoulder with only two or three fletchings visible, one fitted reinforced archery bracer on a single forearm, and one asymmetric reinforced shoulder, collar or upper-chest panel on the drawing side. The quiver is the only mandatory carried container. It must sit close to the back and never become a hip quiver or a belt pouch containing arrows. Distribute additional compact details such as arrowhead-shaped belt clasps, chevron or fletching embroidery, bowstring-inspired chest lacing, secured finger tabs and pointed split hems. Use a genuinely varied natural palette across the 20 characters: tan, ochre, chestnut, russet, dark brown, muted blue, slate grey, beige and olive; forest green or olive must be an accent or belong to only a minority, never the default color. Remove the original shoulder satchels and ordinary bags. Most characters must have no belt pouch at all; at most four of the twenty may carry one tiny, closed utility pouch, with no arrow, shaft or fletching visible in it. Do not add a bow, crossbow or held arrow.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, hard pixel edges, outlines, shading, lighting and medieval-fantasy finish, with detail density equal to the approved Druid V2 sheets.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, compact back quivers and body-worn Archer details below the hairline; preserve the original character order; exactly 20 characters; every sprite must show the back quiver, single-forearm bracer and asymmetric upper-body reinforcement; no text, labels, held weapons, bows, crossbows, held arrows, hip quivers, arrows or fletchings in belt pouches, hats, hoods, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: a belt pouch on every character, generic traveler appearance, missing or oversized back quiver, duplicate quivers, arrows stored at the waist, symmetrical shoulders, repeated identical outfits, camouflage patterns, all-green palette, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, oversized gear, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Mage

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Mage outfits. Use layered midnight-blue robes and short tunics, compact cloth mantles that do not cover the hair, narrow belts, small component pouches and restrained pale-blue arcane embroidery. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny spell-component pouch at the belt. Do not add a staff, wand, spellbook, orb or magical effect.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, readable runes, weapons, books, orbs, hats, hoods, particles, glow, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, oversized robes, star patterns, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Acolyte

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Acolyte outfits. Use practical cream and muted teal vestments, a short protective tabard, simple layered cloth, modest leather belts and boots, and one small body-worn sun medallion. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny healer's pouch at the belt. Do not add held religious objects or weapons.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, staffs, books, halos, hats, hoods, particles, glow, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, ornate priest crowns, oversized symbols, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Aède

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Bard outfits. Use elegant but practical burgundy, dusty rose and deep-blue tunics, asymmetric fabric panels, fine gold-thread trim, compact shoulder mantles that leave all hair visible, fitted belts and polished travel boots. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny performer's pouch at the belt. Do not add an instrument or musical effects.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, lute, lyre, notes, weapons, hats, hoods, long capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, jester costume, excessive jewelry, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Druide

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Druid outfits. Use layered moss-green, bark-brown and muted beige cloth, soft leather, restrained leaf-shaped clasps, natural-fiber wraps and subtle bark-textured bracers. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny herbalist's pouch at the belt. Do not add a staff, animal, antlers, branches or magical effects.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, staffs, antlers, animal parts, hats, hoods, foliage silhouette, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, wild overgrowth, oversized leaves, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Artificier

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Artificer outfits. Use practical rust-orange and charcoal workshop coats, short reinforced leather aprons, compact tool belts, sturdy gloves, boots and restrained brass buckles or fittings. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny engineer's tool pouch at the belt. Do not add goggles on the head, held tools, firearms, gears outside the clothing or mechanical effects.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, held tools, weapons, guns, goggles over face or hair, hats, smoke, sparks, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, steampunk excess, oversized machinery, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Homme — Pugiliste

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact male Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Pugilist outfits. Use sleeveless or short-sleeved red-brown training tunics, lightweight layered waist cloth, flexible trousers, broad cloth hand wraps, simple leather belts and light reinforced boots. Keep arm and hand geometry exactly unchanged; the wraps must follow the existing hands. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny training pouch at the belt. Do not add weapons.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, hand wraps, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, oversized gauntlets, helmets, capes, impact effects, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, exaggerated muscles, boxing gloves, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Guerrière

> **Prompt historique remplacé par CDI-137.** Ne pas le réutiliser comme
> direction autoritaire ; les vingt identités Guerrier validées sont dans
> `assets/design/hero-sprites/cdi-137/validated-{male,female}-v1/`.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied but clearly recognizable early Tier 1 Warrior outfits. Keep the equipment modest and beginner-level, not a matching uniform: distribute distinct combinations of simple padded tunics, plain reinforced gambesons, light leather jerkins, occasional small chainmail panels, compact bracers, broad belts and sturdy boots. Only a minority may have one small shoulder guard; avoid full armor. Use restrained ochre, brown, dark red, beige and muted steel accents while preserving each character's visual individuality. Remove the original large shoulder satchels; a few characters may instead have different tiny belt pouches, while most have no bag. Do not add held weapons; keep every outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, bags and compact body-worn class details below the hairline; give the 20 characters visibly different clothing arrangements while retaining one simple Warrior vocabulary; preserve the original character order; exactly 20 characters; no text, labels, symbols, weapons in hands, shields, helmets, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: repeated identical outfits, a bag on every character, veteran or high-tier armor, full plate, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized armor, breastplate exaggeration, enlarged armor, oversized pauldrons, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Voleuse

> **Prompt historique remplacé par CDI-138.** Ne pas le réutiliser comme
> direction autoritaire ; les vingt identités Voleur validées sont dans
> `assets/design/hero-sprites/cdi-138/validated-{male,female}-v1/`.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied but clearly recognizable early Tier 1 Rogue outfits with the visual language of novice scouts, burglars and street thieves, never martial artists. Distribute simple combinations of buttoned or buckled leather vests, practical overshirts, narrow collars, short split-tail jerkins, close trousers, slim utility belts, soft boots, subtle hidden-pocket seams and occasional muted violet accents. Use varied straight or slightly irregular medieval garment cuts, but no wrap-front tunics, crossed kimono-like lapels, waist sashes, martial-arts uniforms, sleeveless dojo silhouettes or hand wraps. Keep the gear restrained and beginner-level, not a matching uniform. Keep every hairstyle fully visible: no hood, mask or head covering. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny belt pouch. Do not add held weapons; keep every outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, symbols, weapons in hands, hoods, masks, helmets, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: martial-artist appearance, monk or pugilist clothing, wrap-front tunics, crossed lapels, gi or kimono cuts, waist sashes, hand or forearm wraps, repeated identical outfits, a bag on every character, veteran or high-tier equipment, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, corset armor, assassin clichés, oversized knives, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Archère

> **Prompt historique remplacé par CDI-139.** Ne pas réutiliser ses contraintes
> de petit carquois dorsal ou d’interdiction du carquois de hanche. La direction
> validée et les vingt identités autoritaires sont documentées dans
> `assets/design/hero-sprites/cdi-139/archer-identities-and-inspirations.md` :
> aucune arme tenue ou portée, carquois et accessoires de tir fortement lisibles,
> inspirations historiques variées et accessoires sans lien avec l’équipement réel.

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into varied, unmistakable early Tier 1 Archer outfits while preserving the visual richness and adventurous polish of the Novice designs. Match the approved Druid V2 sheets' level of detail: layered materials, crisp edging, visible wear and individualized construction without making the equipment high-tier. Every character must combine three strong Archer markers: one small back-mounted quiver behind a shoulder with only two or three fletchings visible, one fitted reinforced archery bracer on a single forearm, and one asymmetric reinforced shoulder, collar or upper-chest panel on the drawing side. The quiver is the only mandatory carried container. It must sit close to the back and never become a hip quiver or a belt pouch containing arrows. Distribute additional compact details such as arrowhead-shaped belt clasps, chevron or fletching embroidery, bowstring-inspired chest lacing, secured finger tabs and pointed split hems. Use a genuinely varied natural palette across the 20 characters: tan, ochre, chestnut, russet, dark brown, muted blue, slate grey, beige and olive; forest green or olive must be an accent or belong to only a minority, never the default color. Remove the original shoulder satchels and ordinary bags. Most characters must have no belt pouch at all; at most four of the twenty may carry one tiny, closed utility pouch, with no arrow, shaft or fletching visible in it. Do not add a bow, crossbow or held arrow; keep every outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, hard pixel edges, outlines, shading, lighting and medieval-fantasy finish, with detail density equal to the approved Druid V2 sheets.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, compact back quivers and body-worn Archer details below the hairline; preserve the original character order; exactly 20 characters; every sprite must show the back quiver, single-forearm bracer and asymmetric upper-body reinforcement; no text, labels, held weapons, bows, crossbows, held arrows, hip quivers, arrows or fletchings in belt pouches, hats, hoods, capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: a belt pouch on every character, generic traveler appearance, missing or oversized back quiver, duplicate quivers, arrows stored at the waist, symmetrical shoulders, repeated identical outfits, sexualized clothing, camouflage patterns, all-green palette, face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, oversized gear, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Mage

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Mage outfits. Use layered midnight-blue robes and short tunics, compact cloth mantles that do not cover the hair, narrow belts, small component pouches and restrained pale-blue arcane embroidery. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny spell-component pouch at the belt. Do not add a staff, wand, spellbook, orb or magical effect; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, readable runes, weapons, books, orbs, hats, hoods, particles, glow, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, oversized robes, star patterns, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Acolyte

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Acolyte outfits. Use practical cream and muted teal vestments, a short protective tabard, simple layered cloth, modest leather belts and boots, and one small body-worn sun medallion. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny healer's pouch at the belt. Do not add held religious objects or weapons; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, staffs, books, halos, hats, hoods, particles, glow, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, ornate priest crowns, oversized symbols, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Aède

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Bard outfits. Use elegant but practical burgundy, dusty rose and deep-blue tunics, asymmetric fabric panels, fine gold-thread trim, compact shoulder mantles that leave all hair visible, fitted belts and polished travel boots. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny performer's pouch at the belt. Do not add an instrument or musical effects; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, lute, lyre, notes, weapons, hats, hoods, long capes, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, jester costume, excessive jewelry, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Druide

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Druid outfits. Use layered moss-green, bark-brown and muted beige cloth, soft leather, restrained leaf-shaped clasps, natural-fiber wraps and subtle bark-textured bracers. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny herbalist's pouch at the belt. Do not add a staff, animal, antlers, branches or magical effects; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, staffs, antlers, animal parts, hats, hoods, foliage silhouette, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, wild overgrowth, oversized leaves, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Artificière

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Artificer outfits. Use practical rust-orange and charcoal workshop coats, short reinforced leather aprons, compact tool belts, sturdy gloves, boots and restrained brass buckles or fittings. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny engineer's tool pouch at the belt. Do not add goggles on the head, held tools, firearms, gears outside the clothing or mechanical effects; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, gloves, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, held tools, weapons, guns, goggles over face or hair, hats, smoke, sparks, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, steampunk excess, oversized machinery, photorealism, smooth illustration, antialiasing, blur, watermark.
```

## Femme — Pugiliste

```text
Use case: identity-preserve
Asset type: complete 5-by-4 pixel-art human adventurer spritesheet for a fantasy idle RPG
Input images: Image 1 is the exact female Novice spritesheet and the edit target.
Primary request: change only the clothing and wearable equipment of all 20 adventurers into coherent Tier 1 Pugilist outfits. Use sleeveless or short-sleeved red-brown training tunics, lightweight layered waist cloth, flexible trousers, broad cloth hand wraps, simple leather belts and light reinforced boots. Keep arm and hand geometry exactly unchanged; the wraps must follow the existing hands. Remove the original shoulder satchels; most characters must have no bag, while only a few may have a different tiny training pouch at the belt. Do not add weapons; keep the outfit practical and non-sexualized.
Style/medium: preserve exactly the source pixel-art rendering, pixel density, outlines, shading, lighting and medieval-fantasy finish.
Composition/framing: preserve the exact square canvas, green background, 5 columns by 4 rows, all 20 character positions, spacing, scale, orientation and full-body framing.
Identity lock: preserve every character case by case; keep the exact face, facial expression, eyes, hair shape, hairstyle, hair color, skin color, head shape, body proportions, pose, gaze, hand position, limb position and silhouette alignment from Image 1.
Constraints: change only garments, footwear, hand wraps, belts, satchels and compact body-worn class details below the hairline; preserve the original character order; exactly 20 characters; no text, labels, weapons, oversized gauntlets, helmets, capes, impact effects, particles, scenery or extra objects; no character may be added, removed, duplicated or reordered.
Avoid: face changes, hair changes, skin changes, pose drift, position drift, anatomy changes, gender changes, sexualized clothing, exaggerated anatomy, boxing gloves, photorealism, smooth illustration, antialiasing, blur, watermark.
```
