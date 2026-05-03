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
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={LOGO} alt="MAS Parts Iceland" className="h-9 md:h-11 w-auto object-contain" />
          </Link>

          {/* Center nav */}
          <nav className="hidden xl:flex items-center gap-7 mx-auto text-[13px] font-bold uppercase tracking-wider text-navy">
            {navLinks.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-mas-orange transition-colors">{n.label}</a>
            ))}
            <button onClick={onContact} className="hover:text-mas-orange transition-colors bg-transparent border-0 cursor-pointer font-bold uppercase tracking-wider text-[13px] text-navy">
              {t("nav.contact")}
            </button>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto xl:ml-0 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 border-l pl-2 md:pl-3 border-border">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  title={l.label}
                  aria-label={l.label}
                  className="transition-all border-0 bg-transparent p-0.5 cursor-pointer"
                  style={{
                    filter: lang === l.code ? "none" : "grayscale(100%)",
                    opacity: lang === l.code ? 1 : 0.55,
                    transform: lang === l.code ? "scale(1.05)" : "none",
                  }}
                >
                  <img src={l.flag} width={20} alt={l.code.toUpperCase()} className="rounded-sm block" />
                </button>
              ))}
            </div>
            <a href="/#order" className="btn-glow px-3.5 py-2 md:px-5 md:py-2.5 rounded-lg font-bold text-[11px] md:text-xs uppercase tracking-wide whitespace-nowrap">
              {t("cta.quote")}
            </a>
            <button onClick={() => setOpen(!open)} className="xl:hidden p-1.5 text-navy bg-transparent border-0 cursor-pointer" aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="absolute top-16 md:top-20 left-0 w-full bg-white border-b border-border shadow-xl xl:hidden">
            <div className="flex flex-col p-5 gap-1 max-w-7xl mx-auto">
              {navLinks.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="font-bold uppercase tracking-wider py-3 px-2 text-sm hover:text-mas-orange hover:bg-muted/50 rounded-md text-navy">
                  {n.label}
                </a>
              ))}
              <button onClick={() => { setOpen(false); onContact?.(); }} className="text-left font-bold uppercase tracking-wider py-3 px-2 text-sm text-navy bg-transparent border-0 cursor-pointer hover:bg-muted/50 rounded-md">
                {t("nav.contact")}
              </button>
              <div className="flex sm:hidden items-center gap-2 px-2 pt-3 mt-2 border-t border-border">
                {LANGS.map((l) => (
                  <button key={l.code} onClick={() => setLang(l.code)} className="border-0 bg-transparent p-1 cursor-pointer"
                    style={{ filter: lang === l.code ? "none" : "grayscale(100%)", opacity: lang === l.code ? 1 : 0.55 }}>
                    <img src={l.flag} width={22} alt={l.code} className="rounded-sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
      <div className="h-16 md:h-20" />
    </>
  );
}

