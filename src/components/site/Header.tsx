import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { LANGS } from "@/i18n/translations";

const LOGO = "https://d1yei2z3i6k35z.cloudfront.net/15618994/694407658cab3_694317fd7b14d_Untitleddesign.jpg";

export function Header({ onContact }: { onContact?: () => void }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/#order", label: t("nav.order") },
    { href: "/#benefits", label: t("nav.advantage") },
    { href: "/#proces", label: t("nav.how") },
    { href: "/#reviews", label: t("nav.reviews") },
    { href: "/#about", label: t("nav.about") },
    { href: "/#faq", label: t("nav.faq") },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/" className="h-10 md:h-14 flex items-center">
              <img src={LOGO} alt="MAS Parts Iceland" className="h-full object-contain" style={{ maxHeight: 50 }} />
            </Link>
            <div className="flex items-center gap-2 md:gap-3 border-l pl-3 md:pl-6 border-border">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  title={l.label}
                  className="transition-all border-0 bg-transparent p-0 cursor-pointer"
                  style={{
                    filter: lang === l.code ? "none" : "grayscale(100%)",
                    opacity: lang === l.code ? 1 : 0.6,
                    transform: lang === l.code ? "scale(1.1)" : "none",
                  }}
                >
                  <img src={l.flag} width={24} alt={l.code.toUpperCase()} className="rounded-sm" />
                </button>
              ))}
            </div>
          </div>

          <nav className="hidden lg:flex gap-6 text-sm font-bold uppercase tracking-wider text-navy">
            {navLinks.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-mas-orange transition-colors">{n.label}</a>
            ))}
            <button onClick={onContact} className="hover:text-mas-orange transition-colors bg-transparent border-0 cursor-pointer font-bold uppercase tracking-wider text-sm text-navy">
              {t("nav.contact")}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/#order" className="btn-glow px-3 py-1.5 lg:px-6 lg:py-2.5 rounded lg:rounded-lg font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wide whitespace-nowrap">
              {t("cta.quote")}
            </a>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-navy bg-transparent border-0 cursor-pointer">
              {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="absolute top-20 left-0 w-full bg-white border-b border-border shadow-xl lg:hidden">
            <div className="flex flex-col p-6 gap-4 text-center">
              {navLinks.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="font-bold uppercase tracking-wider py-2 hover:text-mas-orange text-navy">{n.label}</a>
              ))}
              <button onClick={() => { setOpen(false); onContact?.(); }} className="font-bold uppercase tracking-wider py-2 text-navy bg-transparent border-0 cursor-pointer">
                {t("nav.contact")}
              </button>
              <a href="/#order" onClick={() => setOpen(false)} className="btn-glow px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider w-full">
                {t("cta.quote")}
              </a>
            </div>
          </div>
        )}
      </header>
      <div style={{ height: 80 }} />
    </>
  );
}
