"use client";

import { useState } from "react";
import {
  Sparkles,
  Home,
  Building2,
  Truck,
  Warehouse,
  Car,
  Trees,
  Droplets,
  ShieldCheck,
  Flame,
  Wrench,
  Star,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  home: Home,
  building: Building2,
  truck: Truck,
  warehouse: Warehouse,
  car: Car,
  trees: Trees,
  droplets: Droplets,
  shield: ShieldCheck,
  flame: Flame,
  wrench: Wrench,
  star: Star,
};

const LABELS: Record<string, string> = {
  sparkles: "Sparkles — restoration, deep clean",
  home: "House",
  building: "Office or commercial",
  truck: "Moving, transition",
  warehouse: "Garage, storage",
  car: "Vehicle",
  trees: "Outdoor",
  droplets: "Cleaning, general",
  shield: "Trust, insured",
  flame: "Emergency, urgent",
  wrench: "Maintenance",
  star: "Featured",
};

export function IconSelect({ name, initial }: { name: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const Preview = value ? SERVICE_ICONS[value] : null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-input bg-mist text-forest">
        {Preview ? <Preview className="size-5" strokeWidth={1.75} /> : <span className="text-xs text-sage">None</span>}
      </div>
      <select
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem]"
      >
        <option value="">No icon</option>
        {Object.keys(SERVICE_ICONS).map((key) => (
          <option key={key} value={key}>{LABELS[key]}</option>
        ))}
      </select>
    </div>
  );
}
