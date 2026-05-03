import { useEffect, useRef, useState } from "react";
import { ArrowRight, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";
import { useNavigate } from "@tanstack/react-router";

const SKIP = /^(skip|no|nope|none|n\/a|na|yes|ok|okay|sure|idk|hi|hello|hey|\-|\.+|x|_)$/i;

type Step = {
  ask: string; hint: string; key: string; multiline?: boolean; optional?: boolean;
  validate?: (v: string) => boolean; errMsg?: (v: string) => string;
};

const STEPS: Step[] = [
  {
    ask: "Hi! 👋 What part are you looking for?<br><small style='opacity:0.7'><strong>Have a link?</strong> Paste it. <strong>No link?</strong> Describe the part: make, model, year.</small>",
    hint: "Paste a link or describe the part",
    key: "part_links", multiline: true,
    validate: (v) => !SKIP.test(v) && v.length > 4,
    errMsg: (v) => SKIP.test(v) ? "Please paste a link or describe the part." : "Try something like \"2019 BMW 320d brake disc\".",
  },
  {
    ask: "Got it! Your <strong>phone number</strong>?<br><small style='opacity:0.7'>We'll send the quote here.</small>",
    hint: "e.g. +354 787 8617", key: "phone",
    validate: (v) => !SKIP.test(v) && v.replace(/\D/g, "").length >= 7,
    errMsg: () => "Please enter a valid phone number.",
  },
  {
    ask: "And your <strong>email</strong>?",
    hint: "e.g. you@workshop.is", key: "email",
    validate: (v) => !SKIP.test(v) && v.includes("@") && v.lastIndexOf(".") > v.indexOf("@"),
    errMsg: () => "Please enter a valid email.",
  },
  {
    ask: "Your <strong>name or company</strong>?",
    hint: "e.g. Workshop ehf.", key: "company",
    validate: (v) => !SKIP.test(v) && v.length > 1 && !/^\d+$/.test(v),
    errMsg: () => "Please enter your name or company.",
  },
  { ask: "<strong>License plate</strong>? <small style='opacity:0.7'>You can skip.</small>", hint: "e.g. KEF 123", key: "license_plate", optional: true },
  { ask: "Last one! <strong>Delivery address</strong> in Iceland?", hint: "e.g. Hafnarbraut 5, Reykjanesbær", key: "address", optional: true },
];

type Bubble = { who: "bot" | "user"; html?: string; text?: string; faded?: boolean };

export function ConversationalForm() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [val, setVal] = useState("");
  const [hintMsg, setHintMsg] = useState("");
  const [hintErr, setHintErr] = useState(false);
  const [data] = useState<Record<string, string>>({});
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

  const advance = (userText?: string, faded?: boolean) => {
    const cur = STEPS[step];
    if (userText !== undefined) data[cur.key] = userText;

    const next = step + 1;
    setBubbles((b) => [
      ...b,
      ...(userText !== undefined ? [{ who: "user" as const, text: userText || "Skipped", faded }] : []),
    ]);

    setVal("");
    setHintErr(false);

    if (next < STEPS.length) {
      const isFirstNoLink = step === 0 && userText && !/^https?:\/\//i.test(userText);
      setTimeout(() => {
        if (isFirstNoLink) {
          setBubbles((b) => [...b, { who: "bot", html: "No link — no problem! There's a <strong>5,000 ISK</strong> search fee." }]);
          setTimeout(() => {
            setBubbles((b) => [...b, { who: "bot", html: STEPS[next].ask }]);
            setStep(next);
            setHintMsg(STEPS[next].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
            inputRef.current?.focus();
          }, 700);
        } else {
          setBubbles((b) => [...b, { who: "bot", html: STEPS[next].ask }]);
          setStep(next);
          setHintMsg(STEPS[next].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
          inputRef.current?.focus();
        }
      }, 350);
    } else {
      submit();
    }
  };

  const submit = async () => {
    setDone(true);
    setBubbles((b) => [...b, { who: "bot", html: t("form.allDone") }]);
    try {
      await supabase.from("quotes").insert(data);
      setTimeout(() => navigate({ to: "/thank-you" }), 800);
    } catch {
      setBubbles((b) => [...b, { who: "bot", html: t("form.failed") }]);
      setDone(false);
    }
  };

  const onNext = () => {
    const cur = STEPS[step];
    const v = val.trim();
    if (!v && cur.optional) { advance("", true); return; }
    if (!cur.optional && cur.validate && !cur.validate(v)) {
      setHintErr(true);
      setHintMsg(cur.errMsg ? cur.errMsg(v) : "Required");
      return;
    }
    advance(v);
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
            <div className="font-extrabold text-sm text-navy" style={{ fontFamily: "Exo 2" }}>{t("form.title")}</div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && (!cur.multiline || !e.shiftKey)) { e.preventDefault(); onNext(); }
              }}
              placeholder={cur.hint}
              rows={cur.multiline ? 3 : 1}
              className="w-full rounded-xl py-3 pl-3.5 pr-12 text-sm outline-none resize-none border-2 transition-colors box-border"
              style={{ borderColor: hintErr ? "#ef4444" : "" }}
            />
            <button onClick={onNext} className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-full bg-mas-orange border-0 cursor-pointer flex items-center justify-center" style={{ boxShadow: "0 2px 8px color-mix(in oklab, var(--mas-orange) 40%, transparent)" }}>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] m-0" style={{ color: hintErr ? "#ef4444" : "var(--muted-foreground)" }}>{hintMsg}</p>
            {cur.optional && <button onClick={() => advance("", true)} className="text-[11px] text-muted-foreground bg-transparent border-0 cursor-pointer underline">Skip this step</button>}
          </div>
        </div>
      )}
    </div>
  );
}
