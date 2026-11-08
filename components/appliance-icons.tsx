import {
  AirVent,
  Cctv,
  Coffee,
  CookingPot,
  Droplets,
  Fan,
  Heater,
  Laptop,
  Lightbulb,
  Microwave,
  Plug,
  Refrigerator,
  Router,
  Shirt,
  Smartphone,
  Snowflake,
  Tv,
  WashingMachine,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pump: Droplets,
  "boiler-pump": Waves,
  "led-light": Lightbulb,
  tv: Tv,
  laptop: Laptop,
  router: Router,
  phone: Smartphone,
  "washing-machine": WashingMachine,
  dishwasher: CookingPot,
  microwave: Microwave,
  kettle: Coffee,
  iron: Shirt,
  vacuum: Fan,
  "hair-dryer": Wind,
  ac: AirVent,
  fan: Fan,
  heater: Heater,
  security: Cctv,
};

const GRADIENTS: Record<string, string> = {
  cold: "from-sky-400 to-blue-600",
  water: "from-cyan-400 to-teal-600",
  kitchen: "from-amber-400 to-orange-600",
  light: "from-yellow-300 to-amber-500",
  climate: "from-teal-400 to-emerald-600",
  tech: "from-indigo-400 to-violet-600",
  other: "from-slate-400 to-slate-600",
};

export function applianceIcon(id: string): LucideIcon {
  return ICONS[id] ?? Plug;
}

export function categoryGradient(category: string): string {
  return GRADIENTS[category] ?? GRADIENTS.other!;
}
