import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import b1 from "@/assets/b1.jpg";
import b2 from "@/assets/b2.jpg";

export const ASSET_PHOTOS: Record<string, string> = { "asset:b1": b1, "asset:b2": b2 };
export function photoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return ASSET_PHOTOS[url] ?? url;
}

export const shopQuery = queryOptions({
  queryKey: ["public", "shop"],
  queryFn: async () => {
    const [settings, services, barbers, links] = await Promise.all([
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("services").select("*").eq("active", true).order("sort_order"),
      supabase.from("barbers").select("id, name, photo_url, specialty, bio").eq("active", true).order("created_at"),
      supabase.from("barber_services").select("barber_id, service_id"),
    ]);
    if (settings.error) throw new Error(settings.error.message);
    return {
      settings: settings.data,
      services: (services.data ?? []).map((s) => ({ ...s, price: Number(s.price) })),
      barbers: barbers.data ?? [],
      links: links.data ?? [],
    };
  },
  staleTime: 60_000,
});

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};
export const STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/40",
  confirmed: "bg-info/15 text-info border-info/40",
  completed: "bg-success/15 text-success border-success/40",
  cancelled: "bg-destructive/15 text-destructive border-destructive/40",
  no_show: "bg-muted text-muted-foreground border-border",
};
export const METHOD_LABEL: Record<string, string> = { pix: "Pix", cash: "Dinheiro", credit: "Crédito", debit: "Débito" };
