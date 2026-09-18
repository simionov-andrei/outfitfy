import type { ClothingCategory } from "./types";

// Deterministic SVG "product photography" placeholders so the app is fully
// functional offline / without any AI or image-hosting API keys configured.
// Real pipelines (vision tagging, segmentation, VTO) swap these data URLs
// for actual model output when API keys are present — see src/lib/ai/*.

function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const CATEGORY_PATHS: Record<ClothingCategory, string> = {
  Outerwear:
    "M40 20 L60 20 L72 32 L64 40 L64 90 L36 90 L36 40 L28 32 Z M36 40 L28 55 M64 40 L72 55",
  Tops: "M35 22 L65 22 L78 34 L68 42 L68 88 L32 88 L32 42 L22 34 Z",
  Knitwear: "M33 24 L67 24 L80 36 L69 44 L69 88 L31 88 L31 44 L20 36 Z",
  Dresses: "M38 20 L62 20 L70 34 L60 40 L66 90 L34 90 L40 40 L30 34 Z",
  Bottoms: "M36 20 L64 20 L66 90 L52 90 L50 48 L48 90 L34 90 Z",
  Denim: "M34 18 L66 18 L68 90 L53 90 L50 50 L47 90 L32 90 Z",
  Activewear: "M35 22 L65 22 L76 33 L67 41 L67 88 L33 88 L33 41 L24 33 Z",
  Footwear: "M22 62 Q22 50 38 50 L60 50 Q78 50 82 66 L82 72 L22 72 Z",
  Bags: "M30 40 L70 40 L74 88 L26 88 Z M38 40 Q38 24 50 24 Q62 24 62 40",
  Accessories: "M50 24 A22 22 0 1 1 49.9 24 Z M50 40 A6 6 0 1 1 49.9 40 Z",
  Jewelry: "M50 26 A16 16 0 1 1 49.9 26 Z",
};

const PALETTE: Record<string, string> = {
  black: "#232323",
  white: "#f4f4f2",
  ivory: "#f2ead9",
  cream: "#f0e6d2",
  beige: "#d8c6a8",
  tan: "#c9a679",
  brown: "#6b4a30",
  camel: "#c19a6b",
  navy: "#1f2a44",
  blue: "#3a6ea5",
  "light blue": "#a7c7e7",
  denim: "#4a6b8a",
  red: "#b23a48",
  burgundy: "#6c1f3a",
  pink: "#e7a6c1",
  "dusty pink": "#d9a8ad",
  green: "#4c6b4f",
  olive: "#707a4a",
  sage: "#a3ad8e",
  yellow: "#e0b84b",
  mustard: "#c99a2e",
  orange: "#d17a3e",
  purple: "#6a4c93",
  lavender: "#c3b1e1",
  grey: "#8b8b8b",
  gray: "#8b8b8b",
  charcoal: "#3d3d3d",
  silver: "#c6c6c6",
  gold: "#c9a227",
};

function colorToHex(name: string) {
  return PALETTE[name.toLowerCase()] ?? "#9a8c98";
}

export function garmentPlaceholder(
  category: ClothingCategory,
  colors: string[],
  seed: string = category
) {
  const path = CATEGORY_PATHS[category] ?? CATEGORY_PATHS.Tops;
  const primary = colorToHex(colors[0] ?? "beige");
  const secondary = colorToHex(colors[1] ?? colors[0] ?? "beige");
  const h = hashSeed(seed);
  const rotate = (h % 6) - 3;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f7f5f2"/>
        <stop offset="100%" stop-color="#ece7e0"/>
      </linearGradient>
      <linearGradient id="fill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="10" fill="url(#bg)"/>
    <g transform="rotate(${rotate} 50 50)">
      <path d="${path}" fill="url(#fill)" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" stroke-linejoin="round"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function lookPlaceholder(seed: string, tags: string[] = []) {
  const h = hashSeed(seed);
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 45% 88%)"/>
        <stop offset="100%" stop-color="hsl(${hue2} 40% 72%)"/>
      </linearGradient>
    </defs>
    <rect width="300" height="380" fill="url(#g)"/>
    <g opacity="0.5" fill="none" stroke="white" stroke-width="2">
      <path d="M110 90 L190 90 L210 120 L192 135 L192 300 L108 300 L108 135 L90 120 Z"/>
      <circle cx="150" cy="60" r="24"/>
    </g>
    <text x="20" y="355" fill="white" font-family="sans-serif" font-size="13" opacity="0.85">${tags[0] ?? ""}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function modelPlaceholder(seed: string) {
  const h = hashSeed(seed);
  const hue = h % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 30% 92%)"/>
        <stop offset="100%" stop-color="hsl(${hue} 20% 78%)"/>
      </linearGradient>
    </defs>
    <rect width="300" height="500" fill="url(#g)"/>
    <g fill="none" stroke="rgba(60,50,50,0.35)" stroke-width="2.5">
      <circle cx="150" cy="95" r="42"/>
      <path d="M90 460 L95 220 Q95 170 150 170 Q205 170 205 220 L210 460"/>
      <path d="M95 250 L55 340 M205 250 L245 340"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
