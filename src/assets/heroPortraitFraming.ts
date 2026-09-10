export interface HeroPortraitOpaqueBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeroPortraitFramePlacement {
  source: HeroPortraitOpaqueBounds;
  destination: HeroPortraitOpaqueBounds;
}

const TARGET_HEIGHT_RATIO = 0.9;
const TARGET_WIDTH_RATIO = 0.94;
const BOTTOM_PADDING_RATIO = 0.015;

export function findHeroPortraitOpaqueBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): HeroPortraitOpaqueBounds | null {
  if (pixels.length !== width * height * 4) throw new Error("HERO_PORTRAIT_PIXEL_BUFFER_INVALID");
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] === 0) continue;
    const pixel = (index - 3) / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function fitHeroPortraitToFrame(
  source: HeroPortraitOpaqueBounds,
  frameWidth: number,
  frameHeight: number,
): HeroPortraitFramePlacement {
  const targetWidth = frameWidth * TARGET_WIDTH_RATIO;
  const targetHeight = frameHeight * TARGET_HEIGHT_RATIO;
  const scale = Math.min(targetWidth / source.width, targetHeight / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  const bottom = frameHeight * (1 - BOTTOM_PADDING_RATIO);
  return {
    source,
    destination: {
      x: (frameWidth - width) / 2,
      y: bottom - height,
      width,
      height,
    },
  };
}
