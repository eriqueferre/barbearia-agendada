import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d79a" />
          <stop offset="1" stopColor="#b8862f" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#151311" stroke="url(#lg)" strokeWidth="2" />
      <path d="M16 26l6-10 10 8 10-8 6 10-2 4H18z" fill="url(#lg)" />
      <circle cx="24" cy="44" r="5" fill="none" stroke="url(#lg)" strokeWidth="3" />
      <circle cx="40" cy="44" r="5" fill="none" stroke="url(#lg)" strokeWidth="3" />
      <path d="M27 40l10-8M37 40L27 32" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ name = "Barbearia Imperial" }: { name?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-lg font-semibold tracking-wide">{name.replace(/^Barbearia\s+/i, "")}</span>
        <span className="block text-[10px] uppercase tracking-[0.3em] text-primary">Barbearia</span>
      </span>
    </Link>
  );
}
