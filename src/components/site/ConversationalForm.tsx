import { useEffect, useRef, useState } from "react";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";
import { useNavigate } from "@tanstack/react-router";

type Step = {
  key: "part_links" | "phone" | "email" | "company" | "license_plate" | "address";
  apiStep: "part" | "phone" | "email" | "company" | "license_plate" | "address";
  ask: string;
  hint: string;
  multiline?: boolean;
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    key: "part_links", apiStep: "part",
    ask: "Hi! 👋 What part are you looking for?<br><small style='opacity:0.7'><strong>Have a link?</strong> Paste it. <strong>No link?</strong> Describe the part: make, model, year.</small>",
    hint: "Paste a link or describe the part", multiline: true,
  },
  { key: "phone", apiStep: "phone", ask: "Got it! Your <strong>phone number</strong>?<br><small style='opacity:0.7'>We'll send the quote here.</small>", hint: "e.g. +354 787 8617" },
  { key: "email", apiStep: "email", ask: "And your <strong>email</strong>?", hint: "e.g. you@workshop.is" },
  { key: "company", apiStep: "company", ask: "Your <strong>name or company</strong>?", hint: "e.g. Workshop ehf." },
  { key: "license_plate", apiStep: "license_plate", ask: "<strong>License plate</strong>? <small style='opacity:0.7'>You can skip.</small>", hint: "e.g. KEF 123", optional: true },
  { key: "address", apiStep: "address", ask: "Last one! <strong>Delivery address</strong> in Iceland?", hint: "e.g. Hafnarbraut 5, Reykjanesbær", optional: true },
];

type Bubble = { who: "bot" | "user" | "typing"; html?: string; text?: string; faded?: boolean };

export function ConversationalForm() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [val, setVal] = useState("");
  const [hintMsg, setHintMsg] = useState("");
  const [hintErr, setHintErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data] = useState<Record<string, string>>({});
  const [partHistory, setPartHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setBubbles([{ who: "bot", html: STEPS[0].ask }]);
      setHintMsg(STEPS[0].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
    }, 400);
  }, []);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [bubbles]);

  const submit = async () => {
    setDone(true);
    setBubbles((b) => [...b, { who: "bot", html: t("form.allDone") }]);
    try {
      // Build payload with only known columns
      const payload: Record<string, string> = {};
      for (const k of ["part_links", "phone", "email", "company", "license_plate", "address"] as const) {
        if (data[k]) payload[k] = data[k];
      }
      await supabase.from("quotes").insert(payload as never);
      setTimeout(() => navigate({ to: "/thank-you" }), 800);
    } catch {
      setBubbles((b) => [...b, { who: "bot", html: t("form.failed") }]);
      setDone(false);
    }
  };

  const onNext = async () => {
    if (busy) return;
    const cur = STEPS[step];
    const v = val.trim();
    if (!v && cur.optional) {
      data[cur.key] = "";
      setBubbles((b) => [...b, { who: "user", text: "Skipped", faded: true }]);
      setVal("");
      goNext();
      return;
    }
    if (!v) {
      setHintErr(true); setHintMsg("Please enter a value"); return;
    }

    // Show user message immediately
    setBubbles((b) => [...b, { who: "user", text: v }, { who: "typing" }]);
    setVal("");
    setBusy(true);
    setHintErr(false);

    try {
      const isPart = cur.apiStep === "part";
      const newHistory = isPart ? [...partHistory, { role: "user" as const, content: v }] : partHistory;
      const { data: res, error } = await supabase.functions.invoke("form-assist", {
        body: {
          step: cur.apiStep,
          value: v,
          lang,
          history: isPart ? newHistory : undefined,
        },
      });
      // remove typing bubble
      setBubbles((b) => b.filter((x) => x.who !== "typing"));

      if (error) throw error;

      const reply: string = res?.reply || "OK!";
      const valid: boolean = !!res?.valid;
      const normalized: string = res?.normalized ?? v;

      setBubbles((b) => [...b, { who: "bot", html: reply }]);

      if (isPart) {
        setPartHistory([...newHistory, { role: "assistant", content: reply.replace(/<[^>]+>/g, "") }]);
      }

      if (!valid) {
        setBusy(false);
        inputRef.current?.focus();
        return;
      }

      data[cur.key] = normalized;
      goNext();
    } catch (e) {
      setBubbles((b) => b.filter((x) => x.who !== "typing"));
      // Fallback: accept on minimal validation so user isn't blocked
      data[cur.key] = v;
      goNext();
    }
  };

  const goNext = () => {
    const next = step + 1;
    if (next < STEPS.length) {
      setTimeout(() => {
        setBubbles((b) => [...b, { who: "bot", html: STEPS[next].ask }]);
        setStep(next);
        setHintMsg(STEPS[next].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
        setBusy(false);
        inputRef.current?.focus();
      }, 350);
    } else {
      setBusy(false);
      submit();
    }
  };

  const cur = STEPS[step] ?? STEPS[STEPS.length - 1];
  const progress = (step / STEPS.length) * 100;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-mas-orange rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-navy flex items-center gap-1.5" style={{ fontFamily: "Exo 2" }}>
              {t("form.title")}
              <span title="AI-assisted" className="inline-flex items-center gap-0.5 text-[10px] text-mas-orange font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">{t("form.sub")}</div>
          </div>
        </div>
        <div className="text-[11px] font-bold text-mas-orange bg-orange-50 px-2.5 py-1 rounded-full">
          {t("form.step")} {Math.min(step + 1, STEPS.length)} {t("form.of")} {STEPS.length}
        </div>
      </div>
      <div className="h-1 bg-muted">
        <div className="h-1 bg-mas-orange transition-all" style={{ width: `${done ? 100 : progress}%` }} />
      </div>
      <div ref={chatRef} className="px-4 pt-4 pb-2 flex flex-col gap-2.5" style={{ minHeight: 160, maxHeight: "min(340px,40vh)", overflowY: "auto" }}>
        {bubbles.map((b, i) =>
          b.who === "bot" ? (
            <div key={i} className="c-bubble-bot" dangerouslySetInnerHTML={{ __html: b.html ?? "" }} />
          ) : b.who === "typing" ? (
            <div key={i} className="c-bubble-bot" style={{ display: "inline-flex", gap: 4, width: "fit-content" }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          ) : (
            <div key={i} className="c-bubble-user" style={{ opacity: b.faded ? 0.45 : 1 }}>{b.text}</div>
          )
        )}
      </div>
      {!done && (
        <div className="px-5 pb-5">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (!cur.multiline || !e.shiftKey)) { e.preventDefault(); onNext(); }
              }}
              placeholder={cur.hint}
              rows={cur.multiline ? 3 : 1}
              className="w-full rounded-xl py-3 pl-3.5 pr-12 text-sm outline-none resize-none border-2 transition-colors box-border disabled:opacity-60"
              style={{ borderColor: hintErr ? "#ef4444" : "" }}
            />
            <button onClick={onNext} disabled={busy} className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full bg-mas-orange border-0 cursor-pointer flex items-center justify-center disabled:opacity-60" style={{ boxShadow: "0 2px 8px color-mix(in oklab, var(--mas-orange) 40%, transparent)" }}>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] m-0" style={{ color: hintErr ? "#ef4444" : "var(--muted-foreground)" }}>{busy ? "Thinking…" : hintMsg}</p>
            {cur.optional && !busy && (
              <button onClick={() => { setVal(""); onNext(); }} className="text-[11px] text-muted-foreground bg-transparent border-0 cursor-pointer underline">Skip this step</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
