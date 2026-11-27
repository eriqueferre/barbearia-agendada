import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { addDays, computeSlots, dateToLocal, localToDate, type ShopRules } from "./availability";

const ACTIVE = ["pending", "confirmed", "completed"] as const;

export async function loadRules(): Promise<ShopRules & Record<string, unknown>> {
  const { data, error } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("Configurações indisponíveis");
  return data as ShopRules & Record<string, unknown>;
}

async function barbersFor(serviceId: string, barberId: string | null) {
  const { data, error } = await supabaseAdmin
    .from("barber_services")
    .select("barber_id, barbers!inner(id, active)")
    .eq("service_id", serviceId)
    .eq("barbers.active", true);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.barber_id);
  return barberId ? ids.filter((i) => i === barberId) : ids;
}

/** slots per date per barber in [from, to] */
export async function availabilityRange(serviceId: string, barberId: string | null, from: string, to: string) {
  const rules = await loadRules();
  const { data: service } = await supabaseAdmin
    .from("services").select("duration_min, active").eq("id", serviceId).single();
  if (!service || !service.active) throw new Error("Serviço indisponível");
  const ids = await barbersFor(serviceId, barberId);
  const result: Record<string, Record<string, number[]>> = {};
  if (ids.length === 0) return { rules, result };

  const [hours, blocks, appts] = await Promise.all([
    supabaseAdmin.from("working_hours").select("*").in("barber_id", ids),
    supabaseAdmin.from("blocked_dates").select("*").gte("date", from).lte("date", to),
    supabaseAdmin
      .from("appointments")
      .select("barber_id, starts_at, ends_at")
      .in("barber_id", ids)
      .in("status", [...ACTIVE])
      .gte("starts_at", localToDate(from, 0).toISOString())
      .lt("starts_at", localToDate(addDays(to, 1), 0).toISOString()),
  ]);
  const now = new Date();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    result[d] = {};
    for (const id of ids) {
      const h = (hours.data ?? []).find((x) => x.barber_id === id && x.weekday === wd) ?? null;
      const bl = (blocks.data ?? []).filter((b) => b.date === d && (!b.barber_id || b.barber_id === id));
      const busy = (appts.data ?? [])
        .filter((a) => a.barber_id === id && dateToLocal(new Date(a.starts_at)).date === d)
        .map((a) => {
          const s = dateToLocal(new Date(a.starts_at)).minutes;
          return { start: s, end: s + (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000 };
        });
      result[d]![id] = computeSlots({ date: d, duration: service.duration_min, rules, barberHours: h, blocks: bl, busy, now });
    }
  }
  return { rules, result, duration: service.duration_min };
}
