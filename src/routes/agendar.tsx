import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Clock, Loader2, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Logo } from "@/components/site/Logo";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { photoSrc, shopQuery } from "@/lib/public-data";
import { addDays, brl, formatPhone, isValidPhone, minToHHMM, onlyDigits, toMin } from "@/lib/availability";
import { createAppointment, getAvailability, registerClient, todayLocal } from "@/lib/booking.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — Barbearia Imperial" },
      { name: "description", content: "Escolha o serviço, o barbeiro, a data e o horário. Rápido e fácil." },
      { property: "og:title", content: "Agendar horário — Barbearia Imperial" },
      { property: "og:description", content: "Agende seu corte ou barba online em poucos passos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  component: BookingPage,
});

type Client = { id: string; name: string; phone: string; email: string | null };
const STEPS = ["Seus dados", "Serviço", "Barbeiro", "Data", "Horário", "Confirmar"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
}
export function formatDateLong(iso: string) {
  return fromISO(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function BookingPage() {
  const { data: shop } = useSuspenseQuery(shopQuery);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [client, setClient] = useState<Client | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null); // null = qualquer
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("bi-client");
    if (raw) try { setClient(JSON.parse(raw) as Client); } catch { /* ignore */ }
  }, []);

  const service = shop.services.find((s) => s.id === serviceId);
  const barbersForService = useMemo(
    () => shop.barbers.filter((b) => shop.links.some((l) => l.barber_id === b.id && l.service_id === serviceId)),
    [shop, serviceId],
  );
  const skipBarber = barbersForService.length <= 1;
  const barber = shop.barbers.find((b) => b.id === barberId);

  const today = todayLocal();
  const last = addDays(today, shop.settings.max_days_ahead);
  const fetchAvail = useServerFn(getAvailability);
  const avail = useQuery({
    queryKey: ["availability", serviceId, barberId, today, last],
    queryFn: () => fetchAvail({ data: { serviceId: serviceId!, barberId, from: today, to: last } }),
    enabled: !!serviceId && step >= 3,
    refetchInterval: step === 4 ? 20_000 : false,
  });

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const back = () => go(step === 3 && skipBarber ? 1 : step - 1);

  const chooseService = (id: string) => {
    setServiceId(id); setDate(null); setTime(null);
    const list = shop.barbers.filter((b) => shop.links.some((l) => l.barber_id === b.id && l.service_id === id));
    if (list.length <= 1) { setBarberId(list[0]?.id ?? null); go(3); } else { setBarberId(null); go(2); }
  };

  const visibleStep = step;
  const progress = ((visibleStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo name={shop.settings.shop_name} />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao site</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {step + 1} de {STEPS.length}</span>
          <span className="font-medium text-primary">{STEPS[step]}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 hidden justify-between sm:flex">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("flex items-center gap-1.5 text-xs", i <= step ? "text-foreground" : "text-muted-foreground/60")}>
              <span className={cn("grid size-5 place-items-center rounded-full text-[10px]", i < step ? "bg-primary text-primary-foreground" : i === step ? "border border-primary text-primary" : "border border-border")}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>{s}
            </span>
          ))}
        </div>

        {step > 0 && (
          <Button variant="ghost" size="sm" className="mt-6 -ml-2" onClick={back}><ArrowLeft /> Voltar</Button>
        )}

        <div key={step} className="fade-up mt-4">
          {step === 0 && <ClientStep initial={client} onDone={(c) => { setClient(c); sessionStorage.setItem("bi-client", JSON.stringify(c)); go(1); }} />}

          {step === 1 && (
            <StepShell title="Qual serviço você deseja?" subtitle="Toque em um serviço para continuar.">
              <div className="grid gap-4 sm:grid-cols-2">
                {shop.services.map((s) => (
                  <button key={s.id} onClick={() => chooseService(s.id)}
                    className={cn("rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60", serviceId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border")}>
                    <div className="flex items-start justify-between">
                      <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary"><ServiceIcon name={s.icon} /></span>
                      <span className="font-display text-xl text-gold">{brl(s.price)}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />{s.duration_min} min</p>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Escolha o barbeiro" subtitle="Ou deixe que a gente escolha o primeiro disponível.">
              <div className="grid gap-4 sm:grid-cols-2">
                <button onClick={() => { setBarberId(null); setDate(null); setTime(null); go(3); }}
                  className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/50 bg-accent/40 p-5 text-left transition-all hover:border-primary">
                  <span className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary"><Users className="size-7" /></span>
                  <span><span className="block text-lg font-semibold">Qualquer barbeiro</span><span className="text-sm text-muted-foreground">Mais horários disponíveis</span></span>
                </button>
                {barbersForService.map((b) => (
                  <button key={b.id} onClick={() => { setBarberId(b.id); setDate(null); setTime(null); go(3); }}
                    className={cn("flex items-center gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:border-primary/60", barberId === b.id ? "border-primary" : "border-border")}>
                    {photoSrc(b.photo_url) ? <img src={photoSrc(b.photo_url)!} alt={b.name} className="size-16 rounded-full object-cover" />
                      : <span className="grid size-16 place-items-center rounded-full bg-muted"><User /></span>}
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold">{b.name}</span>
                      <span className="block text-sm text-primary">{b.specialty}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {shop.services.filter((s) => shop.links.some((l) => l.barber_id === b.id && l.service_id === s.id)).map((s) => s.name).join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Escolha a data" subtitle="Os dias em destaque têm horários livres.">
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-6">
                {avail.isLoading ? <LoadingBox /> : (
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={date ? fromISO(date) : undefined}
                    onSelect={(d) => { if (d) { setDate(toISO(d)); setTime(null); go(4); } }}
                    startMonth={fromISO(today)}
                    endMonth={fromISO(last)}
                    disabled={(d) => { const iso = toISO(d); return iso < today || iso > last || !(avail.data?.[iso]?.length); }}
                    modifiers={{ available: (d) => !!avail.data?.[toISO(d)]?.length }}
                    modifiersClassNames={{ available: "[&>button]:text-primary [&>button]:font-semibold" }}
                    className="pointer-events-auto mx-auto w-full p-0 [--cell-size:2.75rem] sm:[--cell-size:3.25rem]"
                  />
                )}
                <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" />Disponível</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/30" />Indisponível / fechado</span>
                </div>
              </div>
            </StepShell>
          )}

          {step === 4 && date && (
            <StepShell title="Escolha o horário" subtitle={formatDateLong(date)}>
              {avail.isLoading ? <LoadingBox /> : (
                <TimeGrid
                  free={avail.data?.[date] ?? []}
                  open={shop.settings.open_time} close={shop.settings.close_time}
                  interval={shop.settings.slot_interval_min} duration={service?.duration_min ?? 30}
                  selected={time}
                  onSelect={(t) => { setTime(t); go(5); }}
                />
              )}
            </StepShell>
          )}

          {step === 5 && client && service && date && time && (
            <ConfirmStep
              rows={[
                ["Cliente", client.name], ["Telefone", formatPhone(client.phone)], ["Serviço", service.name],
                ["Barbeiro", barber?.name ?? "Primeiro disponível"], ["Data", formatDateLong(date)], ["Horário", time],
                ["Duração", `${service.duration_min} min`], ["Valor", brl(service.price)],
              ]}
              onConfirm={async (create) => {
                const r = await create({ data: { clientId: client.id, phone: client.phone, serviceId: service.id, barberId, date, time } });
                if (r.ok) { navigate({ to: "/agendamento/$code", params: { code: r.code } }); }
                else { toast.error(r.error); setTime(null); await avail.refetch(); go(4); }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="text-3xl font-semibold capitalize-first md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground first-letter:uppercase">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}
function LoadingBox() {
  return <div className="flex h-60 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Consultando agenda…</div>;
}

function ClientStep({ initial, onDone }: { initial: Client | null; onDone: (c: Client) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial ? formatPhone(initial.phone) : "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const register = useServerFn(registerClient);
  useEffect(() => { if (initial) { setName(initial.name); setPhone(formatPhone(initial.phone)); setEmail(initial.email ?? ""); } }, [initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().split(/\s+/).length < 2 || name.trim().length < 3) errs["name"] = "Informe seu nome e sobrenome.";
    if (!isValidPhone(phone)) errs["phone"] = "Confira o número com DDD, ex: (11) 98765-4321.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs["email"] = "E-mail inválido.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const c = await register({ data: { name: name.trim(), phone: onlyDigits(phone), email: email.trim() } });
      onDone(c);
    } catch { toast.error("Não conseguimos salvar seus dados. Tente novamente."); }
    finally { setBusy(false); }
  };

  return (
    <StepShell title="Vamos começar" subtitle="Só precisamos de algumas informações para reservar seu horário.">
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8" noValidate>
        <Field label="Nome completo" error={errors["name"]}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João da Silva" autoComplete="name" maxLength={100} className="h-12 text-base" />
        </Field>
        <Field label="Telefone / WhatsApp" error={errors["phone"]}>
          <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 98765-4321" inputMode="tel" autoComplete="tel" className="h-12 text-base" />
        </Field>
        <Field label="E-mail (opcional)" error={errors["email"]}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" type="email" autoComplete="email" maxLength={255} className="h-12 text-base" />
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="h-14 w-full bg-gold text-base font-semibold text-primary-foreground shadow-gold">
          {busy ? <Loader2 className="animate-spin" /> : null} Continuar
        </Button>
        <p className="text-center text-xs text-muted-foreground">Já é cliente? Use o mesmo telefone — seus dados serão atualizados.</p>
      </form>
    </StepShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function TimeGrid({ free, open, close, interval, duration, selected, onSelect }: {
  free: string[]; open: string; close: string; interval: number; duration: number; selected: string | null; onSelect: (t: string) => void;
}) {
  const all: string[] = [];
  for (let t = toMin(open); t + duration <= toMin(close); t += Math.max(5, interval)) all.push(minToHHMM(t));
  free.forEach((f) => { if (!all.includes(f)) all.push(f); });
  all.sort();
  const groups = [
    { label: "Manhã", list: all.filter((t) => t < "12:00") },
    { label: "Tarde", list: all.filter((t) => t >= "12:00" && t < "18:00") },
    { label: "Noite", list: all.filter((t) => t >= "18:00") },
  ].filter((g) => g.list.length);
  if (!free.length) return <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Não há horários livres neste dia. Volte e escolha outra data.</p>;
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {g.list.map((t) => {
              const ok = free.includes(t);
              return (
                <button key={t} disabled={!ok} onClick={() => onSelect(t)}
                  aria-label={ok ? `Horário ${t}` : `${t} indisponível`}
                  className={cn("h-12 rounded-xl border text-base font-medium transition-all",
                    selected === t ? "border-primary bg-gold text-primary-foreground" :
                    ok ? "border-border bg-card hover:border-primary hover:text-primary" :
                    "cursor-not-allowed border-transparent bg-muted/40 text-muted-foreground/40 line-through")}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmStep({ rows, onConfirm }: { rows: [string, string][]; onConfirm: (fn: ReturnType<typeof useServerFn<typeof createAppointment>>) => Promise<void> }) {
  const create = useServerFn(createAppointment);
  const [busy, setBusy] = useState(false);
  return (
    <StepShell title="Confira seu agendamento" subtitle="Está tudo certo? É só confirmar.">
      <div className="overflow-hidden rounded-2xl border border-primary/40 bg-card">
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-4 px-6 py-4">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className={cn("text-right font-medium first-letter:uppercase", k === "Valor" && "font-display text-xl text-gold")}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Button size="lg" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(create); } catch { toast.error("Algo deu errado. Tente novamente."); } finally { setBusy(false); } }}
        className="mt-6 h-14 w-full bg-gold text-base font-semibold tracking-wide text-primary-foreground shadow-gold">
        {busy ? <Loader2 className="animate-spin" /> : <Check />} CONFIRMAR AGENDAMENTO
      </Button>
    </StepShell>
  );
}
