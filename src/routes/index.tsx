import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ConversationalForm } from "@/components/site/ConversationalForm";
import { FloatContact } from "@/components/site/FloatContact";
import { useLang } from "@/i18n/LanguageContext";
import { Truck, Search, FileText, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [contactOpen, setContactOpen] = useState(false);
  const { t } = useLang();

  return (
    <>
      <Header onContact={() => setContactOpen(true)} />

      {/* HERO */}
      <section
        id="order"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--navy) 0%, oklch(0.22 0.05 265) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--mas-orange) 0, transparent 50%), radial-gradient(circle at 80% 80%, var(--mas-orange) 0, transparent 40%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-mas-orange" />
              {t("hero.badge")}
            </span>
            <h1
              className="mt-5 text-4xl md:text-6xl font-black leading-[1.05] tracking-tight"
              style={{ fontFamily: "Exo 2" }}
            >
              {t("hero.title1")}
              <br />
              {t("hero.title2")}{" "}
              <span className="text-mas-orange">{t("hero.title3")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
              {t("hero.lead")}
            </p>
            <ul className="mt-6 space-y-2.5 text-white/85 text-sm">
              {[t("hero.f1"), t("hero.f2"), t("hero.f3")].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-mas-orange shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pl-6">
            <ConversationalForm />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-mas-orange text-sm font-bold uppercase tracking-[0.2em] mb-3 text-center">
            {t("benefits.kicker")}
          </p>
          <h2
            className="text-3xl md:text-5xl font-black text-navy text-center mb-14"
            style={{ fontFamily: "Exo 2" }}
          >
            {t("benefits.titleA")}{" "}
            <span className="text-mas-orange">{t("benefits.titleB")}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, t: t("benefits.b1.t"), d: t("benefits.b1.d") },
              { icon: Search, t: t("benefits.b2.t"), d: t("benefits.b2.d") },
              { icon: FileText, t: t("benefits.b3.t"), d: t("benefits.b3.d") },
              { icon: ShieldCheck, t: t("benefits.b4.t"), d: t("benefits.b4.d") },
            ].map(({ icon: Icon, t: title, d }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-border bg-white hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-mas-orange/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-mas-orange" />
                </div>
                <h3
                  className="font-extrabold text-navy text-lg mb-2"
                  style={{ fontFamily: "Exo 2" }}
                >
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatContact open={contactOpen} setOpen={setContactOpen} />
    </>
  );
}
