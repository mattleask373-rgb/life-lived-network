import {
  Compass,
  Hammer,
  Music,
  Palette,
  TreePine,
  UserRound,
  Users,
  Utensils,
  type LucideProps,
} from "lucide-react";

import type { LayerIconKey } from "@/lib/world-data";

const ICONS = {
  hammer: Hammer,
  compass: Compass,
  music: Music,
  palette: Palette,
  users: Users,
  person: UserRound,
  tree: TreePine,
  utensils: Utensils,
} satisfies Record<LayerIconKey, React.ComponentType<LucideProps>>;

export function LayerIcon({ icon, ...props }: { icon: LayerIconKey } & LucideProps) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" {...props} />;
}