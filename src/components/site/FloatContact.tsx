import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";

type Bubble = { who: "bot" | "user" | "typing"; html?: string; text?: string };

const GREETINGS: Record<string, string> = {
  en: "Hi! 👋 I'm the MAS Parts assistant — happy to answer quick questions.<br><br>👉 Looking to <strong>order a part</strong>? Please use the <strong>request form on the homepage</strong> — it's the fastest way to get a price.",
  pl: "Cześć! 👋 Jestem asystentem MAS Parts — chętnie odpowiem na krótkie pytania.<br><br>👉 Chcesz <strong>zamówić część</strong>? Skorzystaj z <strong>formularza na stronie głównej</strong> — to najszybszy sposób na wycenę.",
  is: "Halló! 👋 Ég er aðstoðarmaður MAS Parts — svara fúslega stuttum spurningum.<br><br>👉 Viltu <strong>panta varahlut</strong>? Notaðu <strong>beiðniformið á forsíðunni</strong> — fljótlegasta leiðin að tilboði.",
};

export function FloatContact({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const { t, lang } = useLang();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"chat" | "details" | "done">("chat");
  const [pendingMsg, setPendingMsg] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", license_plate: "" });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && bubbles.length === 0) {
      setBubbles([{ who: "bot", html: GREETINGS[lang] ?? GREETINGS.en }]);
    }
  }, [open, lang, bubbles.length]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, stage]);

  const send = async () => {
    const v = val.trim();
    if (!v || busy) return;
    const newHistory = [...history, { role: "user" as const, content: v }];
    setHistory(newHistory);
    setBubbles((b) => [...b, { who: "user", text: v }, { who: "typing" }]);
    setVal("");
    setBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke("form-assist", {
        body: { step: "freeform", value: v, lang, history: newHistory },
      });
      setBubbles((b) => b.filter((x) => x.who !== "typing"));
      if (error) {
        const status = (error as { context?: { status?: number } } | null)?.context?.status;
        const msg =
          status === 429
            ? lang === "pl"
              ? "Za dużo wiadomości na raz — spróbuj za chwilę."
              : "Too many messages — try again in a moment."
            : status === 402
              ? lang === "pl"
                ? "Asystent AI chwilowo niedostępny. Napisz: parts@masgroup.is"
                : "AI assistant temporarily unavailable. Email: parts@masgroup.is"
              : lang === "pl"
                ? "Problem z połączeniem — napisz na parts@masgroup.is"
                : "Connection issue — email parts@masgroup.is";
        setBubbles((b) => [...b, { who: "bot", html: msg }]);
        return;
      }
      const reply = data?.reply || "OK!";
      setBubbles((b) => [...b, { who: "bot", html: reply }]);
      setHistory((h) => [...h, { role: "assistant", content: reply.replace(/<[^>]*>/g, "") }]);
      if (data?.submit) {
        setPendingMsg(data.normalized || v);
        setTimeout(() => {
          setBubbles((b) => [
            ...b,
            {
              who: "bot",
              html:
                lang === "pl"
                  ? "Świetnie! Zostaw <strong>telefon i email</strong>, a odezwiemy się z wyceną. ⬇️"
                  : lang === "is"
                    ? "Frábært! Skildu eftir <strong>síma og netfang</strong> og við sendum tilboð. ⬇️"
                    : "Great! Leave your <strong>phone and email</strong> and we'll get back with a quote. ⬇️",
            },
          ]);
          setStage("details");
        }, 400);
      }
    } catch {
      setBubbles((b) => b.filter((x) => x.who !== "typing"));
      setBubbles((b) => [
        ...b,
        {
          who: "bot",
          html: "Connection issue — try again, or email <strong>parts@masgroup.is</strong>.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const e: Record<string, boolean> = {};
    if (!contact.phone.trim()) e.phone = true;
    if (!contact.email.includes("@")) e.email = true;
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await supabase.from("quotes").insert({
        company: contact.name || "Quick chat",
        phone: contact.phone,
        email: contact.email,
        license_plate: contact.license_plate || null,
        part_links: pendingMsg,
        part: pendingMsg,
      } as never);
      setStage("done");
    } catch {
      setBubbles((b) => [
        ...b,
        { who: "bot", html: "Couldn't save — please email parts@masgroup.is" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setBubbles([{ who: "bot", html: GREETINGS[lang] ?? GREETINGS.en }]);
    setVal("");
    setPendingMsg("");
    setContact({ name: "", phone: "", email: "", license_plate: "" });
    setErrors({});
    setStage("chat");
    setHistory([]);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
          right: 20,
          zIndex: 49,
          width: 360,
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
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p
                className="text-white font-bold text-sm m-0 flex items-center gap-1.5"
                style={{ fontFamily: "Exo 2" }}
              >
                {t("float.title")}
                <span className="inline-flex items-center gap-0.5 text-[10px] text-mas-orange font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> AI
                </span>
              </p>
              <p className="text-white/60 text-xs m-0">{t("float.sub")}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="bg-transparent border-0 text-white/60 cursor-pointer text-2xl leading-none p-0"
          >
            ×
          </button>
        </div>

        <div
          ref={chatRef}
          className="flex flex-col gap-2.5 px-4 pt-4 pb-2"
          style={{ minHeight: 200, maxHeight: "min(360px, 50vh)", overflowY: "auto" }}
        >
          {bubbles.map((b, i) =>
            b.who === "bot" ? (
              <div
                key={i}
                className="c-bubble-bot"
                dangerouslySetInnerHTML={{ __html: b.html ?? "" }}
              />
            ) : b.who === "typing" ? (
              <div
                key={i}
                className="c-bubble-bot"
                style={{ display: "inline-flex", gap: 4, width: "fit-content" }}
              >
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            ) : (
              <div key={i} className="c-bubble-user">
                {b.text}
              </div>
            ),
          )}
        </div>

        {stage === "chat" && (
          <div className="px-4 pb-4">
            <div className="relative">
              <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  lang === "pl"
                    ? "Napisz wiadomość…"
                    : lang === "is"
                      ? "Skrifaðu skilaboð…"
                      : "Type a message…"
                }
                rows={2}
                className="w-full rounded-xl py-2.5 pl-3 pr-11 text-sm outline-none resize-none border-2 border-border focus:border-mas-orange transition-colors box-border disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={busy}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-mas-orange border-0 cursor-pointer flex items-center justify-center disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground mt-2">parts@masgroup.is</p>
          </div>
        )}

        {stage === "details" && (
          <div className="px-4 pb-4 space-y-2">
            <input
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
              placeholder={t("float.name")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-mas-orange"
            />
            <input
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder={t("float.phone")}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-mas-orange border"
              style={{ borderColor: errors.phone ? "#ef4444" : "" }}
            />
            <input
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder={t("float.email")}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-mas-orange border"
              style={{ borderColor: errors.email ? "#ef4444" : "" }}
            />
            <input
              value={contact.license_plate}
              onChange={(e) =>
                setContact({ ...contact, license_plate: e.target.value.toUpperCase() })
              }
              placeholder={
                lang === "pl"
                  ? "Nr rejestracyjny (opcjonalnie)"
                  : lang === "is"
                    ? "Bílnúmer (valfrjálst)"
                    : "License plate (optional)"
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-mas-orange"
            />
            <button
              onClick={submit}
              disabled={busy}
              className="btn-glow w-full rounded-lg py-2.5 font-bold text-xs uppercase tracking-wide cursor-pointer border-0"
            >
              {busy ? "…" : t("float.send")}
            </button>
          </div>
        )}

        {stage === "done" && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mas-orange flex items-center justify-center">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <p className="font-bold text-navy text-base mb-1" style={{ fontFamily: "Exo 2" }}>
              {t("float.sent")}
            </p>
            <p className="text-muted-foreground text-sm mb-4">{t("float.sentSub")}</p>
            <button onClick={reset} className="text-xs text-mas-orange underline">
              New message
            </button>
          </div>
        )}
      </div>

      <button onClick={() => setOpen(!open)} className="mas-float-btn" title={t("nav.contact")}>
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </>
  );
}
