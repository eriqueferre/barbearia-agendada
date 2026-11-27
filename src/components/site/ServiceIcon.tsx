import { Crown, Droplet, Scissors, Sparkles, Wind } from "lucide-react";

const MAP = { scissors: Scissors, razor: Wind, crown: Crown, sparkles: Sparkles, droplet: Droplet };
export const SERVICE_ICONS = Object.keys(MAP);
export function ServiceIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const I = MAP[name as keyof typeof MAP] ?? Scissors;
  return <I className={className} />;
}
