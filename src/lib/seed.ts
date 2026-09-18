import { db } from "./db";
import { garmentPlaceholder, lookPlaceholder } from "./placeholder";
import { mockTieredMatches } from "./mockRetail";
import type {
  ClosetItem,
  ClothingCategory,
  InspirationLook,
  Season,
} from "./types";

interface SeedGarment {
  name: string;
  category: ClothingCategory;
  colors: string[];
  fabric: string;
  pattern: string;
  seasons: Season[];
}

const LOOKS: { title: string; aesthetic: string; tags: string[]; items: SeedGarment[] }[] = [
  {
    title: "Quiet Luxury Office",
    aesthetic: "Old Money",
    tags: ["minimal", "tailored", "neutral"],
    items: [
      { name: "Wool Tailored Blazer", category: "Outerwear", colors: ["camel"], fabric: "Wool", pattern: "Solid", seasons: ["Fall", "Winter"] },
      { name: "Silk Button-Up Shirt", category: "Tops", colors: ["ivory"], fabric: "Silk", pattern: "Solid", seasons: ["Spring", "Fall"] },
      { name: "Straight Wool Trousers", category: "Bottoms", colors: ["black"], fabric: "Wool", pattern: "Solid", seasons: ["Fall", "Winter"] },
      { name: "Leather Loafers", category: "Footwear", colors: ["brown"], fabric: "Leather", pattern: "Solid", seasons: ["Fall", "Winter", "Spring"] },
      { name: "Structured Tote", category: "Bags", colors: ["camel"], fabric: "Leather", pattern: "Solid", seasons: ["Spring", "Summer", "Fall", "Winter"] },
    ],
  },
  {
    title: "Off-Duty Streetwear",
    aesthetic: "Streetwear",
    tags: ["oversized", "layered", "graphic"],
    items: [
      { name: "Oversized Graphic Hoodie", category: "Knitwear", colors: ["grey"], fabric: "Cotton", pattern: "Graphic print", seasons: ["Fall", "Winter"] },
      { name: "Cargo Trousers", category: "Bottoms", colors: ["olive"], fabric: "Cotton", pattern: "Solid", seasons: ["Fall", "Spring"] },
      { name: "Chunky Trainers", category: "Footwear", colors: ["white", "black"], fabric: "Leather", pattern: "Solid", seasons: ["Spring", "Summer", "Fall"] },
      { name: "Nylon Crossbody Bag", category: "Bags", colors: ["black"], fabric: "Polyester blend", pattern: "Solid", seasons: ["Spring", "Summer", "Fall", "Winter"] },
    ],
  },
  {
    title: "Coastal Linen Days",
    aesthetic: "Coastal",
    tags: ["breezy", "linen", "summer"],
    items: [
      { name: "Linen Wrap Dress", category: "Dresses", colors: ["ivory"], fabric: "Linen", pattern: "Solid", seasons: ["Summer"] },
      { name: "Woven Sun Hat", category: "Accessories", colors: ["tan"], fabric: "Cotton", pattern: "Solid", seasons: ["Summer"] },
      { name: "Leather Strap Sandals", category: "Footwear", colors: ["tan"], fabric: "Leather", pattern: "Solid", seasons: ["Summer"] },
      { name: "Woven Basket Bag", category: "Bags", colors: ["beige"], fabric: "Cotton", pattern: "Solid", seasons: ["Summer"] },
    ],
  },
  {
    title: "Dark Academia Layers",
    aesthetic: "Dark Academia",
    tags: ["vintage", "layered", "moody"],
    items: [
      { name: "Herringbone Overcoat", category: "Outerwear", colors: ["brown"], fabric: "Wool", pattern: "Herringbone", seasons: ["Fall", "Winter"] },
      { name: "Cable Knit Sweater Vest", category: "Knitwear", colors: ["burgundy"], fabric: "Wool", pattern: "Solid", seasons: ["Fall", "Winter"] },
      { name: "Pleated Wool Skirt", category: "Bottoms", colors: ["charcoal"], fabric: "Wool", pattern: "Checked", seasons: ["Fall", "Winter"] },
      { name: "Knee-High Leather Boots", category: "Footwear", colors: ["black"], fabric: "Leather", pattern: "Solid", seasons: ["Fall", "Winter"] },
    ],
  },
  {
    title: "Scandi Minimalist",
    aesthetic: "Minimalist",
    tags: ["clean lines", "monochrome"],
    items: [
      { name: "Boxy Cotton Tee", category: "Tops", colors: ["white"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Summer"] },
      { name: "Wide-Leg Trousers", category: "Bottoms", colors: ["grey"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Fall"] },
      { name: "Minimal Leather Sneakers", category: "Footwear", colors: ["white"], fabric: "Leather", pattern: "Solid", seasons: ["Spring", "Summer", "Fall"] },
      { name: "Gold Pendant Necklace", category: "Jewelry", colors: ["gold"], fabric: "Metal", pattern: "Solid", seasons: ["Spring", "Summer", "Fall", "Winter"] },
    ],
  },
  {
    title: "Après-Ski Glam",
    aesthetic: "Winter Luxe",
    tags: ["cozy", "statement", "winter"],
    items: [
      { name: "Shearling Puffer Jacket", category: "Outerwear", colors: ["ivory"], fabric: "Wool", pattern: "Solid", seasons: ["Winter"] },
      { name: "Turtleneck Knit Sweater", category: "Knitwear", colors: ["cream"], fabric: "Cashmere", pattern: "Solid", seasons: ["Winter"] },
      { name: "Straight Denim Jeans", category: "Denim", colors: ["denim"], fabric: "Denim", pattern: "Solid", seasons: ["Fall", "Winter"] },
      { name: "Suede Ankle Boots", category: "Footwear", colors: ["tan"], fabric: "Leather", pattern: "Solid", seasons: ["Fall", "Winter"] },
    ],
  },
];

export async function seedInspirationGallery() {
  const existing = await db.inspirationLooks.count();
  if (existing > 0) return;

  const looks: InspirationLook[] = LOOKS.map((look) => ({
    id: crypto.randomUUID(),
    title: look.title,
    aesthetic: look.aesthetic,
    imageUrl: lookPlaceholder(look.title, look.tags),
    tags: look.tags,
    items: look.items.map((item) => ({
      ...item,
      imageUrl: garmentPlaceholder(item.category, item.colors, `${look.title}-${item.name}`),
      retailMatches: mockTieredMatches(item.category, item.colors, item.name),
    })),
  }));

  await db.inspirationLooks.bulkAdd(looks);
}

export async function cloneInspirationLookToCloset(lookId: string) {
  const look = await db.inspirationLooks.get(lookId);
  if (!look) return [];

  const items: ClosetItem[] = look.items.map((item) => ({
    id: crypto.randomUUID(),
    name: item.name,
    category: item.category,
    colors: item.colors,
    fabric: item.fabric,
    pattern: item.pattern,
    seasons: item.seasons,
    description: `A ${item.pattern.toLowerCase()} ${item.colors.join(" and ")} ${item.fabric.toLowerCase()} ${item.name.toLowerCase()}.`,
    imageUrl: item.imageUrl,
    sourceType: "inspiration",
    sourceUrl: look.title,
    retailMatches: item.retailMatches,
    estimatedValue: item.retailMatches.find((m) => m.tier === "premium")?.price ?? 0,
    wearCount: 0,
    favorite: false,
    createdAt: new Date().toISOString(),
  }));

  await db.closetItems.bulkAdd(items);
  return items;
}

const DEMO_ITEMS: SeedGarment[] = [
  { name: "Merino Crewneck", category: "Knitwear", colors: ["navy"], fabric: "Wool", pattern: "Solid", seasons: ["Fall", "Winter", "Spring"] },
  { name: "White Poplin Shirt", category: "Tops", colors: ["white"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Summer", "Fall"] },
  { name: "Slim Chinos", category: "Bottoms", colors: ["beige"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Summer", "Fall"] },
  { name: "Raw Denim Jeans", category: "Denim", colors: ["denim"], fabric: "Denim", pattern: "Solid", seasons: ["Fall", "Winter", "Spring"] },
  { name: "Trench Coat", category: "Outerwear", colors: ["beige"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Fall"] },
  { name: "Leather Chelsea Boots", category: "Footwear", colors: ["black"], fabric: "Leather", pattern: "Solid", seasons: ["Fall", "Winter"] },
  { name: "Canvas Sneakers", category: "Footwear", colors: ["white"], fabric: "Cotton", pattern: "Solid", seasons: ["Spring", "Summer"] },
  { name: "Silk Slip Dress", category: "Dresses", colors: ["burgundy"], fabric: "Silk", pattern: "Solid", seasons: ["Summer", "Fall"] },
  { name: "Leather Crossbody", category: "Bags", colors: ["tan"], fabric: "Leather", pattern: "Solid", seasons: ["Spring", "Summer", "Fall", "Winter"] },
  { name: "Wool Overcoat", category: "Outerwear", colors: ["charcoal"], fabric: "Wool", pattern: "Solid", seasons: ["Winter"] },
  { name: "Striped Tee", category: "Tops", colors: ["navy", "white"], fabric: "Cotton", pattern: "Striped", seasons: ["Spring", "Summer"] },
  { name: "Pleated Midi Skirt", category: "Bottoms", colors: ["sage"], fabric: "Polyester blend", pattern: "Solid", seasons: ["Spring", "Summer"] },
];

export async function seedDemoClosetItems() {
  const items: ClosetItem[] = DEMO_ITEMS.map((item, i) => {
    const wearCount = Math.floor(Math.random() * 6);
    const daysAgo = 3 + i * 5;
    return {
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category,
      colors: item.colors,
      fabric: item.fabric,
      pattern: item.pattern,
      seasons: item.seasons,
      description: `A ${item.pattern.toLowerCase()} ${item.colors.join(" and ")} ${item.fabric.toLowerCase()} ${item.name.toLowerCase()}.`,
      imageUrl: garmentPlaceholder(item.category, item.colors, item.name),
      sourceType: "manual",
      retailMatches: mockTieredMatches(item.category, item.colors, item.name),
      estimatedValue: 0,
      wearCount,
      lastWornAt: wearCount > 0 ? new Date(Date.now() - daysAgo * 86400000).toISOString() : undefined,
      favorite: i % 5 === 0,
      createdAt: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
    };
  });

  for (const item of items) {
    item.estimatedValue = item.retailMatches.find((m) => m.tier === "premium")?.price ?? 0;
  }

  await db.closetItems.bulkAdd(items);
  return items;
}
