import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addDays, dateToLocal, isValidPhone, localToDate, minToHHMM, onlyDigits } from "./availability";

const phoneSchema = z.string().transform(onlyDigits).refine(isValidPhone, "Telefone inválido");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const registerClient = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(3).max(100),
      phone: phoneSchema,
      email: z.union([z.literal(""), z.string().trim().email().max(255)]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("clients")
      .upsert(
        { name: data.name, phone: data.phone, email: data.email || null, updated_at: new Date().toISOString() },
        { onConflict: "phone" },
      )
      .select("id, name, phone, email")
      .single();
    if (error || !row) throw new Error("Não foi possível salvar seus dados");
    return row;
  });

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ serviceId: z.string().uuid(), barberId: z.string().uuid().nullable(), from: dateSchema, to: dateSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { availabilityRange } = await import("./booking.server");
    const { result } = await availabilityRange(data.serviceId, data.barberId, data.from, data.to);
    // date -> sorted unique HH:MM
    const out: Record<string, string[]> = {};
    for (const [d, per] of Object.entries(result)) {
      const set = new Set<number>();
      Object.values(per).forEach((l) => l.forEach((m) => set.add(m)));
      out[d] = [...set].sort((a, b) => a - b).map(minToHHMM);
    }
    return out;
  });

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      clientId: z.string().uuid(),
      phone: phoneSchema,
      serviceId: z.string().uuid(),
      barberId: z.string().uuid().nullable(),
      date: dateSchema,
      time: z.string().regex(/^\d{2}:\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { availabilityRange } = await import("./booking.server");
    const { data: client } = await supabaseAdmin.from("clients").select("id").eq("id", data.clientId).eq("phone", data.phone).single();
    if (!client) return { ok: false as const, error: "Cadastro não encontrado. Volte e informe seus dados." };
    const { result, duration } = await availabilityRange(data.serviceId, data.barberId, data.date, data.date);
    const [h, m] = data.time.split(":");
    const minutes = Number(h) * 60 + Number(m);
    const free = Object.entries(result[data.date] ?? {}).filter(([, l]) => l.includes(minutes)).map(([id]) => id);
    if (free.length === 0 || !duration) return { ok: false as const, error: "Esse horário acabou de ser reservado. Escolha outro, por favor." };
    const { data: svc } = await supabaseAdmin.from("services").select("price").eq("id", data.serviceId).single();
    const start = localToDate(data.date, minutes);
    for (const barberId of free) {
      const { data: appt, error } = await supabaseAdmin
        .from("appointments")
        .insert({
          client_id: client.id, service_id: data.serviceId, barber_id: barberId,
          starts_at: start.toISOString(), ends_at: new Date(start.getTime() + duration * 60000).toISOString(),
          status: "confirmed", price: svc?.price ?? 0,
        })
        .select("code").single();
      if (appt) return { ok: true as const, code: appt.code };
      if (error && error.code !== "23P01") return { ok: false as const, error: "Não foi possível concluir o agendamento." };
    }
    return { ok: false as const, error: "Esse horário acabou de ser reservado. Escolha outro, por favor." };
  });

async function apptsView(clientId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("id, code, starts_at, ends_at, status, price, reschedule_requested, services(name), barbers(name)")
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });
  return (data ?? []).map((a) => ({
    id: a.id, code: a.code, starts_at: a.starts_at, ends_at: a.ends_at, status: a.status,
    price: Number(a.price), reschedule_requested: a.reschedule_requested,
    service: a.services?.name ?? "", barber: a.barbers?.name ?? "",
  }));
}

export const getConfirmation = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ code: z.string().trim().toUpperCase().length(6) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: a } = await supabaseAdmin
      .from("appointments")
      .select("code, starts_at, ends_at, status, price, clients(name), services(name, duration_min), barbers(name)")
      .eq("code", data.code).maybeSingle();
    if (!a) return null;
    // Only first name: the code alone must not reveal contact data.
    return {
      code: a.code, starts_at: a.starts_at, ends_at: a.ends_at, status: a.status, price: Number(a.price),
      firstName: (a.clients?.name ?? "").split(" ")[0] ?? "", service: a.services?.name ?? "",
      duration: a.services?.duration_min ?? 0, barber: a.barbers?.name ?? "",
    };
  });

const authSchema = z.object({ phone: phoneSchema, code: z.string().trim().toUpperCase().length(6) });
async function verifyClient(phone: string, code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("appointments").select("client_id, clients!inner(phone)").eq("code", code).eq("clients.phone", phone).maybeSingle();
  return data?.client_id ?? null;
}

export const clientPortal = createServerFn({ method: "POST" })
  .inputValidator((d) => authSchema.parse(d))
  .handler(async ({ data }) => {
    const clientId = await verifyClient(data.phone, data.code);
    if (!clientId) return { ok: false as const, error: "Telefone ou código não conferem." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin.from("clients").select("name, phone, email").eq("id", clientId).single();
    const { data: s } = await supabaseAdmin.from("settings").select("cancel_min_hours").eq("id", 1).single();
    return { ok: true as const, client: c!, appointments: await apptsView(clientId), cancelMinHours: s?.cancel_min_hours ?? 2 };
  });

export const clientAction = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    authSchema.extend({
      action: z.enum(["cancel", "reschedule", "profile"]),
      appointmentId: z.string().uuid().optional(),
      name: z.string().trim().min(3).max(100).optional(),
      email: z.union([z.literal(""), z.string().trim().email().max(255)]).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const clientId = await verifyClient(data.phone, data.code);
    if (!clientId) return { ok: false as const, error: "Acesso inválido." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "profile") {
      const patch: { name?: string; email?: string | null; updated_at: string } = { updated_at: new Date().toISOString() };
      if (data.name) patch.name = data.name;
      if (data.email !== undefined) patch.email = data.email || null;
      await supabaseAdmin.from("clients").update(patch).eq("id", clientId);
      return { ok: true as const };
    }
    const { data: a } = await supabaseAdmin.from("appointments").select("id, starts_at, status")
      .eq("id", data.appointmentId ?? "").eq("client_id", clientId).maybeSingle();
    if (!a || !["pending", "confirmed"].includes(a.status)) return { ok: false as const, error: "Agendamento não pode ser alterado." };
    const { data: s } = await supabaseAdmin.from("settings").select("cancel_min_hours").eq("id", 1).single();
    const limit = (s?.cancel_min_hours ?? 2) * 3600000;
    if (new Date(a.starts_at).getTime() - Date.now() < limit)
      return { ok: false as const, error: `Alterações só com ${s?.cancel_min_hours ?? 2}h de antecedência. Fale com a barbearia.` };
    if (data.action === "cancel")
      await supabaseAdmin.from("appointments").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", a.id);
    else await supabaseAdmin.from("appointments").update({ reschedule_requested: true }).eq("id", a.id);
    return { ok: true as const };
  });

export const hasAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return (count ?? 0) > 0;
});

export function todayLocal() {
  return dateToLocal(new Date()).date;
}
export { addDays };
