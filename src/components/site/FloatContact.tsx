import { useState } from "react";
import { MessageCircle, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";

export function FloatContact({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const submit = async () => {
    const e: Record<string, boolean> = {};
    if (!phone.trim()) e.phone = true;
    if (!email.trim() || !email.includes("@")) e.email = true;
    if (!msg.trim()) e.msg = true;
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);
    try {
      await supabase.from("quotes").insert({
        company: name || "Quick message",
        phone, email, part_links: msg, part: msg,
      });
    } catch {}
    setSending(false);
    setSent(true);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
          right: 20,
          zIndex: 49,
          width: 320,
          maxWidth: "calc(100vw - 40px)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: open ? 1 : 0,
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: open ? "auto" : "none",
          overflow: "hidden",
        }}
      >
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-mas-orange flex items-center justify-center">
              <MessageCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm m-0" style={{ fontFamily: "Exo 2" }}>{t("float.title")}</p>
              <p className="text-white/60 text-xs m-0">{t("float.sub")}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="bg-transparent border-0 text-white/60 cursor-pointer text-2xl leading-none p-0">×</button>
        </div>
        {!sent ? (
          <div className="p-5">
            <p className="text-muted-foreground text-sm mb-3">{t("float.lead")}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("float.name")} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-mas-orange" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("float.phone")} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-mas-orange border" style={{ borderColor: errors.phone ? "#ef4444" : "" }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("float.email")} className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-mas-orange border" style={{ borderColor: errors.email ? "#ef4444" : "" }} />
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("float.msg")} rows={3} className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-mas-orange resize-none border" style={{ borderColor: errors.msg ? "#ef4444" : "" }} />
            <button onClick={submit} disabled={sending} className="btn-glow w-full rounded-lg py-3 font-bold text-sm uppercase tracking-wide cursor-pointer border-0">
              {sending ? t("form.sending") : t("float.send")}
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2.5">parts@masgroup.is</p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-13 h-13 mx-auto mb-3 rounded-full bg-mas-orange flex items-center justify-center" style={{ width: 52, height: 52 }}>
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <p className="font-bold text-navy text-base mb-1" style={{ fontFamily: "Exo 2" }}>{t("float.sent")}</p>
            <p className="text-muted-foreground text-sm">{t("float.sentSub")}</p>
          </div>
        )}
      </div>

      <button onClick={() => setOpen(!open)} className="mas-float-btn" title={t("nav.contact")}>
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </>
  );
}
