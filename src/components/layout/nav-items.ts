import {
  LayoutDashboard,
  Shirt,
  UploadCloud,
  Sparkles,
  Wand2,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Wardrobe overview & cost insights" },
  { href: "/closet", label: "Digital Closet", icon: Shirt, description: "Browse & filter your wardrobe" },
  { href: "/ingest", label: "Ingest", icon: UploadCloud, description: "Upload photos or import Pinterest boards" },
  { href: "/inspiration", label: "Inspiration", icon: Sparkles, description: "Curated looks to try on or clone" },
  { href: "/try-on", label: "Try-On Studio", icon: Wand2, description: "Layer outfits on your model photo" },
  { href: "/planner", label: "Weekly Planner", icon: CalendarDays, description: "AI-generated 7-day outfit plan" },
];
