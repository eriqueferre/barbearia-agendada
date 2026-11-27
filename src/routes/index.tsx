import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, Clock, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ServiceIcon } from "@/components/site/ServiceIcon";
import { photoSrc, shopQuery, WEEKDAYS } from "@/lib/public-data";
import { brl, formatPhone } from "@/lib/availability";
import hero from "@/assets/hero.jpg";
import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g3 from "@/assets/g3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Imperial — Seu estilo começa aqui" },
      { name: "description", content: "Cortes, degradê e barba com padrão premium. Agende seu horário online em poucos passos." },
      { property: "og:title", content: "Barbearia Imperial — Seu estilo começa aqui" },
      { property: "og:description", content: "Cortes, degradê e barba com padrão premium. Agende online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  component: Index,
});

const REVIEWS = [
  { name: "Marcelo S.", text: "Melhor degradê que já fiz. Agendei pelo celular em 1 minuto e fui atendido na hora.", stars: 5 },
  { name: "André P.", text: "Ambiente top, café, atendimento impecável. A barba com toalha quente é outro nível.", stars: 5 },
  { name: "Thiago R.", text: "Pontualidade e capricho. Virei cliente fiel, recomendo de olhos fechados.", stars: 5 },
];

function Index() {
  const { data } = useSuspenseQuery(shopQuery);
  const { settings, services, barbers } = data;
  return (
    <div className="min-h-screen">
      <SiteHeader name={settings.shop_name} />

      {/* Banner */}
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Interior da barbearia" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover opacity-60" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-b from-transparent to-background" />
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="max-w-2xl fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Star className="size-3.5 fill-primary" /> Barbearia premium
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] md:text-7xl">
              Seu estilo <span className="text-gold italic">começa aqui.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Agende seu horário e tenha uma experiência diferenciada — técnica, cuidado e um ambiente feito para você.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 bg-gold px-8 text-base font-semibold tracking-wide text-primary-foreground shadow-gold transition-transform hover:scale-[1.02] hover:opacity-95">
                <Link to="/agendar"><CalendarCheck /> AGENDAR MEU HORÁRIO</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 border-foreground/20 bg-background/40 px-8 text-base backdrop-blur">
                <a href="#servicos">Conhecer nossos serviços</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <SectionTitle kicker="Serviços & preços" title="Feito sob medida para você" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link key={s.id} to="/agendar" className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/50">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary"><ServiceIcon name={s.icon} className="size-6" /></span>
                <span className="font-display text-2xl text-gold">{brl(s.price)}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" />{s.duration_min} min</span>
                <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">Agendar <ArrowRight className="size-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="scroll-mt-20 bg-sidebar py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Galeria" title="Nosso trabalho fala por nós" />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
            {[g1, g2, g3, hero].map((src, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl ${i === 0 ? "row-span-2" : ""} ${i === 3 ? "md:col-span-2" : ""}`}>
                <img src={src} alt="Trabalho da barbearia" loading="lazy" className="size-full min-h-48 object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barbeiros */}
      <section id="barbeiros" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <SectionTitle kicker="A equipe" title="Mestres da navalha" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="aspect-square overflow-hidden bg-muted">
                {photoSrc(b.photo_url) && <img src={photoSrc(b.photo_url)!} alt={b.name} loading="lazy" className="size-full object-cover" />}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold">{b.name}</h3>
                <p className="mt-1 text-sm text-primary">{b.specialty}</p>
                <p className="mt-3 text-sm text-muted-foreground">{b.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Avaliações */}
      <section className="bg-sidebar py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Avaliações" title="Quem senta na cadeira, volta" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 text-primary">{Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="size-4 fill-primary" />)}</div>
                <blockquote className="mt-4 text-foreground/90">“{r.text}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">— {r.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <div className="grid gap-8 rounded-3xl border border-primary/30 bg-card p-8 md:grid-cols-2 md:p-12">
          <div>
            <SectionTitle kicker="Visite-nos" title="Estamos te esperando" align="left" />
            <div className="mt-8 space-y-4 text-muted-foreground">
              <p className="flex gap-3"><MapPin className="size-5 shrink-0 text-primary" />{settings.address}</p>
              <p className="flex gap-3"><Phone className="size-5 text-primary" />{formatPhone(settings.phone)}</p>
            </div>
            <Button asChild size="lg" className="mt-8 h-14 bg-gold px-8 text-primary-foreground shadow-gold">
              <Link to="/agendar">AGENDAR MEU HORÁRIO</Link>
            </Button>
          </div>
          <div className="rounded-2xl bg-muted/50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Clock className="size-5 text-primary" />Horário de funcionamento</h3>
            <ul className="mt-4 divide-y divide-border text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className="flex justify-between py-2.5">
                  <span>{WEEKDAYS[d]}</span>
                  <span className={settings.open_days.includes(d) ? "text-foreground" : "text-muted-foreground"}>
                    {settings.open_days.includes(d) ? `${settings.open_time.slice(0, 5)} – ${settings.close_time.slice(0, 5)}` : "Fechado"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </div>
  );
}

function SectionTitle({ kicker, title, align = "center" }: { kicker: string; title: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold md:text-5xl">{title}</h2>
    </div>
  );
}
