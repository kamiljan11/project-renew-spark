import { Link } from "@tanstack/react-router";
import { MapPin, Mail, Phone } from "lucide-react";
import { useLang } from "@/i18n/useLang";

const LOGO =
  "https://d1yei2z3i6k35z.cloudfront.net/15618994/694407658cab3_694317fd7b14d_Untitleddesign.jpg";

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-[#0f172a] text-white pt-20 pb-10 px-6 border-t border-white/5">
      <div className="max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center p-2 shadow-lg mb-6">
              <img
                src={LOGO}
                alt="MAS Parts"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h4 className="text-xl font-black italic mb-4 text-white">
              MAS <span className="text-mas-orange">PARTS</span>
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h5 className="font-bold mb-6 tracking-wider text-xs uppercase text-white">
              {t("footer.nav")}
            </h5>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li>
                <a href="/#order" className="hover:text-mas-orange transition-colors">
                  {t("footer.send")}
                </a>
              </li>
              <li>
                <a href="/#about" className="hover:text-mas-orange transition-colors">
                  {t("footer.about")}
                </a>
              </li>
              <li>
                <a href="/#proces" className="hover:text-mas-orange transition-colors">
                  {t("footer.how")}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h5 className="font-bold mb-6 tracking-wider text-xs uppercase text-white">
              {t("footer.info")}
            </h5>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li>
                <Link to="/terms" className="hover:text-mas-orange transition-colors">
                  {t("footer.claims")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-mas-orange transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-mas-orange transition-colors">
                  {t("footer.claimForm")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-mas-orange transition-colors">
                  {t("footer.install")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-mas-orange transition-colors">
                  {t("footer.checklist")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h5 className="font-bold mb-6 tracking-wider text-xs uppercase text-white">
              {t("footer.contact")}
            </h5>
            <ul className="space-y-4 text-slate-400 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 mt-1 text-mas-orange" />
                <span>Reykjanesbær, Iceland</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0 text-mas-orange" />
                <a
                  href="mailto:parts@masgroup.is"
                  className="hover:text-mas-orange transition-colors"
                >
                  parts@masgroup.is
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 shrink-0 mt-1 text-mas-orange" />
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-white font-bold text-xs uppercase tracking-wider mb-1">
                    Arkadiusz
                  </span>
                  <a
                    href="tel:+48570421341"
                    className="hover:text-mas-orange transition-colors block"
                  >
                    +48 570 421 341
                  </a>
                  <a
                    href="tel:+3547878617"
                    className="hover:text-mas-orange transition-colors block"
                  >
                    +354 787 8617
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-500 text-xs">
            {t("footer.copy")}
            {/* [ukryte 2026-07-21] {" · "}built by{" "}
            <a href="https://kamiljan.com" target="_blank" rel="noopener noreferrer" className="hover:text-mas-orange transition-colors">Kamil Jan</a> */}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-xs uppercase font-bold tracking-widest">
                {t("footer.support")}
              </span>
              <div className="w-8 h-px bg-slate-700" />
              <span className="font-black italic text-xs uppercase text-mas-orange">
                {t("footer.iceland")}
              </span>
            </div>
            <a
              href="/admin"
              className="text-slate-600 text-xs font-medium opacity-30 hover:opacity-100 transition-opacity"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
