// Pure availability rules shared by server and tests. Times are minutes from local midnight
// in the shop's timezone (America/Sao_Paulo, fixed UTC-3).
export const TZ_OFFSET_MIN = -180;

export type ShopRules = {
  open_time: string;
  close_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  open_days: number[];
  slot_interval_min: number;
  buffer_min: number;
  min_advance_hours: number;
  max_days_ahead: number;
};
export type Range = { start: number; end: number };
export type BlockRule = { start_time: string | null; end_time: string | null };

export function toMin(t: string): number {
  const [h, m] = t.split(":");
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}
export function minToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
/** Weekday (0=Sun) of a YYYY-MM-DD date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}
/** Absolute instant for a local date + minutes. */
export function localToDate(date: string, minutes: number): Date {
  const base = Date.parse(`${date}T00:00:00Z`);
  return new Date(base + (minutes - TZ_OFFSET_MIN) * 60000);
}
/** Local YYYY-MM-DD and minutes for an instant. */
export function dateToLocal(d: Date): { date: string; minutes: number } {
  const shifted = new Date(d.getTime() + TZ_OFFSET_MIN * 60000);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;

/** Free start times (minutes) for one barber on one date. */
export function computeSlots(args: {
  date: string;
  duration: number;
  rules: ShopRules;
  barberHours: { start_time: string; end_time: string } | null;
  blocks: BlockRule[];
  busy: Range[];
  now: Date;
}): number[] {
  const { date, duration, rules, barberHours, blocks, busy, now } = args;
  const today = dateToLocal(now).date;
  if (date < today || date > addDays(today, rules.max_days_ahead)) return [];
  if (!rules.open_days.includes(weekdayOf(date)) || !barberHours) return [];
  if (blocks.some((b) => !b.start_time || !b.end_time)) return [];

  const winStart = Math.max(toMin(rules.open_time), toMin(barberHours.start_time));
  const winEnd = Math.min(toMin(rules.close_time), toMin(barberHours.end_time));
  const blocked: Range[] = blocks.map((b) => ({ start: toMin(b.start_time!), end: toMin(b.end_time!) }));
  if (rules.lunch_start && rules.lunch_end)
    blocked.push({ start: toMin(rules.lunch_start), end: toMin(rules.lunch_end) });
  const taken = busy.map((r) => ({ start: r.start - rules.buffer_min, end: r.end + rules.buffer_min }));
  const earliest = now.getTime() + rules.min_advance_hours * 3600000;
  const step = Math.max(5, rules.slot_interval_min);

  const out: number[] = [];
  for (let t = winStart; t + duration <= winEnd; t += step) {
    const r = { start: t, end: t + duration };
    if (localToDate(date, t).getTime() < earliest) continue;
    if (blocked.some((b) => overlaps(r, b))) continue;
    if (taken.some((b) => overlaps(r, b))) continue;
    out.push(t);
  }
  return out;
}

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}
/** Brazilian phone: DDD + 8 or 9 digits (mobile starts with 9). */
export function isValidPhone(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length === 11) return /^[1-9]{2}9\d{8}$/.test(d);
  if (d.length === 10) return /^[1-9]{2}[2-8]\d{7}$/.test(d);
  return false;
}
export function formatPhone(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
