import {
  Home,
  Package,
  Scissors,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Wheat,
  Gem,
  Palette,
  Coffee,
  Leaf,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Shirt,
  Scissors,
  Sparkles,
  Wheat,
  Home,
  Package,
  Gem,
  Palette,
  Coffee,
  Leaf,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && CATEGORY_ICONS[name]) || Package;
  return <Icon className={className} />;
}
