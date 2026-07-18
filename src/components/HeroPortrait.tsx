import React, { useState, useEffect } from "react";
import { Hero } from "../types";
import maleSpritesheet from "../assets/images/human-novice-male.jpg";
import femaleSpritesheet from "../assets/images/human-novice-female.jpg";

// Exact coordinates provided by the user for the 20 heroes
const NOVICE_MALE_SPRITE_SLICES = [
  // row 1
  { x: 64, y: 38, width: 180, height: 280 },
  { x: 296, y: 38, width: 180, height: 280 },
  { x: 530, y: 38, width: 180, height: 280 },
  { x: 764, y: 38, width: 180, height: 280 },
  { x: 1007, y: 38, width: 180, height: 280 },

  // row 2
  { x: 64, y: 328, width: 180, height: 280 },
  { x: 296, y: 328, width: 180, height: 280 },
  { x: 530, y: 328, width: 180, height: 280 },
  { x: 764, y: 328, width: 180, height: 280 },
  { x: 1007, y: 328, width: 180, height: 280 },

  // row 3
  { x: 64, y: 621, width: 180, height: 280 },
  { x: 296, y: 621, width: 180, height: 280 },
  { x: 530, y: 621, width: 180, height: 280 },
  { x: 764, y: 621, width: 180, height: 280 },
  { x: 1007, y: 621, width: 180, height: 280 },

  // row 4
  { x: 64, y: 916, width: 180, height: 280 },
  { x: 296, y: 916, width: 180, height: 280 },
  { x: 530, y: 916, width: 180, height: 280 },
  { x: 764, y: 916, width: 180, height: 280 },
  { x: 1007, y: 916, width: 180, height: 280 }
];

function getStableSpriteIndex(heroId: string): number {
  let hash = 0;
  for (let index = 0; index < heroId.length; index += 1) {
    hash = (hash * 31 + heroId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % NOVICE_MALE_SPRITE_SLICES.length;
}

// Global cache to hold sliced sprites as data URLs (keyed by `${gender}_${index}`)
const spriteCache: { [key: string]: string } = {};
let isProcessingStarted = false;
const processingListeners: (() => void)[] = [];

function addProcessingListener(listener: () => void) {
  processingListeners.push(listener);
}

function removeProcessingListener(listener: () => void) {
  const idx = processingListeners.indexOf(listener);
  if (idx !== -1) processingListeners.splice(idx, 1);
}

function notifyListeners() {
  processingListeners.forEach((l) => l());
}

function loadAndProcessImage(url: string, gender: "Male" | "Female"): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // 1. Create a large canvas to draw and chroma-key the original image
        const mainCanvas = document.createElement("canvas");
        mainCanvas.width = width;
        mainCanvas.height = height;
        const mainCtx = mainCanvas.getContext("2d");
        if (!mainCtx) {
          reject(new Error("Could not get 2d context"));
          return;
        }

        mainCtx.drawImage(img, 0, 0);

        // Chroma-key green background (Canvas-based automated green screen cleaner)
        const imgData = mainCtx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Green background detection logic:
          // Pure/Intense green has a high G value compared to R and B.
          const greenDominance = g - Math.max(r, b);

          if (g > 45 && greenDominance > 25 && g > r * 1.25 && g > b * 1.25) {
            data[i + 3] = 0; // Make pixel fully transparent
          }
        }
        mainCtx.putImageData(imgData, 0, 0);

        // 2. Slice the clean canvas using the precise pixel coordinates provided by the user
        for (let idx = 0; idx < NOVICE_MALE_SPRITE_SLICES.length; idx++) {
          const slice = NOVICE_MALE_SPRITE_SLICES[idx];

          // Create small canvas for this specific sprite
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = slice.width;
          sliceCanvas.height = slice.height;
          const sliceCtx = sliceCanvas.getContext("2d");

          if (sliceCtx) {
            sliceCtx.drawImage(
              mainCanvas,
              slice.x, slice.y, slice.width, slice.height, // Source rectangle
              0, 0, slice.width, slice.height             // Destination rectangle
            );
            spriteCache[`${gender}_${idx}`] = sliceCanvas.toDataURL("image/png");
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load spritesheet from: ${url}`));
    };
  });
}

function processAllSpritesheets() {
  if (isProcessingStarted) {
    if (Object.keys(spriteCache).length > 0) {
      notifyListeners();
    }
    return;
  }
  isProcessingStarted = true;

  Promise.all([
    loadAndProcessImage(maleSpritesheet, "Male"),
    loadAndProcessImage(femaleSpritesheet, "Female")
  ])
    .then(() => {
      notifyListeners();
    })
    .catch((err) => {
      console.error("Error processing spritesheets:", err);
    });
}

interface HeroPortraitProps {
  hero: Hero;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  noBorder?: boolean;
  noBg?: boolean;
  noPadding?: boolean;
}

export default function HeroPortrait({
  hero,
  size = "md",
  className = "",
  noBorder = false,
  noBg = false,
  noPadding = false,
}: HeroPortraitProps) {
  const [isReady, setIsReady] = useState(false);
  const spriteIdx = hero.spriteIndex !== undefined
    ? hero.spriteIndex % NOVICE_MALE_SPRITE_SLICES.length
    : getStableSpriteIndex(hero.id);
  const gender = hero.gender || "Male";
  const cacheKey = `${gender}_${spriteIdx}`;

  useEffect(() => {
    if (spriteCache[cacheKey]) {
      setIsReady(true);
      return;
    }

    const checkCache = () => {
      if (spriteCache[cacheKey]) {
        setIsReady(true);
      }
    };

    addProcessingListener(checkCache);
    processAllSpritesheets();

    return () => {
      removeProcessingListener(checkCache);
    };
  }, [cacheKey]);

  // Sizes mapping
  const sizeClasses = {
    xs: "w-8 h-8 rounded-md",
    sm: "w-10 h-10 rounded-lg",
    md: "w-14 h-14 rounded-xl",
    lg: "w-24 h-24 rounded-2xl",
    xl: "w-40 h-40 rounded-3xl",
  };

  const getClassEmoji = (cls: string) => {
    switch (cls) {
      case "Guerrier": return "⚔️";
      case "Voleur": return "🗡️";
      case "Archer": return "🏹";
      case "Mage": return "🔮";
      case "Acolyte": return "☀️";
      case "Aède": return "🎵";
      case "Druide": return "🍃";
      case "Artificier": return "⚙️";
      case "Pugiliste": return "👊";
      default: return "🧑‍🌾";
    }
  };

  const fallbackEmoji = getClassEmoji(hero.classType);

  const borderClass = noBorder ? "" : "border-2 border-[#caa050]/40";
  const bgClass = noBg ? "" : "bg-[#160f0a]/80";
  const paddingClass = noPadding ? "" : "p-1";

  if ((gender === "Male" || gender === "Female") && isReady && spriteCache[cacheKey]) {
    return (
      <img
        id={`hero-portrait-${hero.id}`}
        src={spriteCache[cacheKey]}
        alt={hero.name}
        className={`object-contain shrink-0 select-none ${borderClass} ${bgClass} ${paddingClass} ${sizeClasses[size]} ${className}`}
        draggable={false}
      />
    );
  }

  // Graceful fallback display (Beautiful retro background card with fallback icon/emoji)
  const fallbackBorderClass = noBorder ? "" : "border-2 border-[#5c402b]/40";
  const fallbackBgClass = noBg ? "" : "bg-gradient-to-br from-[#2c1d12] to-[#160f0a]";

  return (
    <div
      id={`hero-portrait-${hero.id}-fallback`}
      className={`flex items-center justify-center shrink-0 select-none text-2xl font-bold ${fallbackBorderClass} ${fallbackBgClass} ${sizeClasses[size]} ${className}`}
    >
      <span className="drop-shadow-md">{fallbackEmoji}</span>
    </div>
  );
}
