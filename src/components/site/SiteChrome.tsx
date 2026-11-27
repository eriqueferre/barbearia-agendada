import { Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { formatPhone } from "@/lib/availability";

const NAV = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#galeria", label: "Galeria" },
  { href: "/#barbeiros", label: "Barbeiros" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({ name }: { name?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo {...(name ? { name } : {})} />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">{n.label}</a>
          ))}
          <Link to="/minha-conta" className="transition-colors hover:text-foreground">Meus agendamentos</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden bg-gold text-primary-foreground shadow-gold hover:opacity-90 sm:inline-flex">
            <Link to="/agendar">Agendar</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base hover:bg-muted">{n.label}</a>
            ))}
            <Link to="/minha-conta" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base hover:bg-muted">Meus agendamentos</Link>
            <Button asChild size="lg" className="mt-2 bg-gold text-primary-foreground">
              <Link to="/agendar">Agendar meu horário</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

type S = { shop_name: string; address: string; phone: string; email: string; instagram: string; open_time: string; close_time: string; open_days: number[] };
export function SiteFooter({ settings }: { settings?: S | undefined }) {
  const days = settings?.open_days ?? [];
  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo {...(settings?.shop_name ? { name: settings.shop_name } : {})} />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Tradição, técnica e um atendimento que faz você voltar. Agende online em menos de um minuto.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-foreground">Contato</h4>
          {settings?.address && <p className="flex gap-2 text-muted-foreground"><MapPin className="size-4 shrink-0 text-primary" />{settings.address}</p>}
          {settings?.phone && <p className="flex gap-2 text-muted-foreground"><Phone className="size-4 text-primary" />{formatPhone(settings.phone)}</p>}
          {settings?.email && <p className="flex gap-2 text-muted-foreground"><Mail className="size-4 text-primary" />{settings.email}</p>}
          {settings?.instagram && <p className="flex gap-2 text-muted-foreground"><Instagram className="size-4 text-primary" />{settings.instagram}</p>}
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-foreground">Horário</h4>
          {settings && (
            <p className="flex gap-2 text-muted-foreground"><Clock className="size-4 text-primary" />
              {days.length === 7 ? "Todos os dias" : days.includes(0) ? "Dom a Sáb" : days.length === 6 ? "Segunda a sábado" : `${days.length} dias/semana`}, {settings.open_time.slice(0, 5)} às {settings.close_time.slice(0, 5)}
            </p>
          )}
          <Link to="/minha-conta" className="block text-muted-foreground hover:text-foreground">Meus agendamentos</Link>
          <Link to="/admin" className="block text-muted-foreground hover:text-foreground">Área do proprietário</Link>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.shop_name ?? "Barbearia Imperial"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
