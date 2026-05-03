import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Package, Upload, X, Image as ImageIcon, RotateCcw, Info, AlertTriangle, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";
import { useNavigate } from "@tanstack/react-router";

type Chip = {
  label: string;
  fill?: string;
  submit?: string;
  normalize?: string;
};

type Step = {
  key: "part_links" | "phone" | "email" | "company" | "license_plate" | "address" | "delivery_preference" | "photos";
  apiStep: "part" | "phone" | "email" | "company" | "license_plate" | "address" | "delivery_preference" | "photos";
  ask: string;
  hint: string;
  multiline?: boolean;
  optional?: boolean;
  chips?: Chip[];
  upload?: boolean;
  /** Show a small "why we ask?" tooltip near input. */
  why?: { en: string; pl: string; is: string };
  /** Max characters for the textarea (soft limit + counter). */
  maxLen?: number;
};

const STEPS: Step[] = [
  {
    key: "part_links", apiStep: "part",
    ask: "Hi 👋 Tell us what car part you need.<br><small style='opacity:0.85'>1. <strong>Got a link (or several)?</strong> Paste them all — one per line is perfect. You pay for the parts + shipping (customs clearance included).<br>2. <strong>No link?</strong> <strong>We become your buyer in Europe</strong> — we hunt the part across our trusted EU suppliers, <strong>negotiate the best price on your behalf</strong>, verify it fits your vehicle and handle the paperwork. Sourcing fee <strong>4 960 ISK (incl. VAT)</strong> upfront — credited toward your order if you buy.</small>",
    hint: "Paste one or more links (one per line), OEM number, or describe the part",
    multiline: true,
    maxLen: 2000,
    chips: [
      { label: "🔗 I have link(s)", fill: "" },
      { label: "🔢 OEM number", fill: "OEM number: " },
      { label: "✏️ Describe the part", fill: "" },
    ],
  },
  {
    key: "phone", apiStep: "phone",
    ask: "Got it! Your <strong>phone number</strong>?<br><small style='opacity:0.85'>So we can reach you if we need to confirm details.</small>",
    hint: "e.g. +354 787 8617",
    why: {
      en: "Only used if we need to confirm details. No spam, no marketing — promise.",
      pl: "Używamy tylko, jeśli musimy potwierdzić szczegóły. Bez spamu, bez marketingu.",
      is: "Aðeins notað ef við þurfum að staðfesta atriði. Enginn spam, engin markaðssetning.",
    },
  },
  { key: "email", apiStep: "email", ask: "And your <strong>email</strong>?", hint: "e.g. you@workshop.is" },
  { key: "company", apiStep: "company", ask: "Your <strong>name or company</strong>?", hint: "e.g. Workshop ehf.", maxLen: 120 },
  {
    key: "license_plate", apiStep: "license_plate",
    ask: "<strong>License plate</strong> or <strong>car make, model & year</strong>?<br><small style='opacity:0.85'>Either works — a plate is fastest (we can look the car up from it). Otherwise just type something like \"VW Golf 2015 1.6 TDI\".</small>",
    hint: "e.g. KEF 123  —  or  —  VW Golf 2015 1.6 TDI",
    optional: true,
    maxLen: 120,
    chips: [{ label: "Skip for now", submit: "", normalize: "" }],
  },
  {
    key: "address", apiStep: "address",
    ask: "<strong>Delivery address</strong> in Iceland?",
    hint: "e.g. Hafnarbraut 5, Reykjanesbær",
    optional: true,
    maxLen: 200,
    chips: [{ label: "📦 I'll pick up myself", submit: "Personal pickup", normalize: "Personal pickup" }],
  },
  {
    key: "delivery_preference", apiStep: "delivery_preference",
    ask: "How would you like it shipped?<br><small style='opacity:0.85'>Pick what suits you — we'll quote both if you're not sure.</small>",
    hint: "Tap a button or type your own preference",
    optional: true,
    maxLen: 200,
    chips: [
      { label: "🚚 Standard — cheaper", submit: "Standard (cheaper)", normalize: "Standard (cheaper)" },
      { label: "✈️ Express — fastest", submit: "Express (fastest)", normalize: "Express (fastest)" },
      { label: "🤔 Quote me both", submit: "Quote both options", normalize: "Quote both options" },
    ],
  },
  {
    key: "photos", apiStep: "photos",
    ask: "Last step! 📸 Add <strong>photos of the part or car</strong> (optional but speeds things up a lot).<br><small style='opacity:0.85'>Up to 5 photos, max 10 MB each.</small>",
    hint: "",
    optional: true,
    upload: true,
  },
];

type Bubble = { who: "bot" | "user" | "typing" | "error"; html?: string; text?: string; faded?: boolean; retry?: () => void };

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const STORAGE_KEY = "mas-quote-form-v1";
const MIN_HUMAN_MS = 2500; // anti-bot: form too fast = likely a bot

// ---- Validation helpers ----
const EMAIL_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gnail.com": "gmail.com", "gmil.com": "gmail.com",
  "gmaill.com": "gmail.com", "gmal.com": "gmail.com", "gmail.co": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com",
  "hotnail.com": "hotmail.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com", "outloook.com": "outlook.com",
  "iclud.com": "icloud.com", "icoud.com": "icloud.com",
};
function suggestEmailFix(email: string): string | null {
  const m = email.toLowerCase().match(/^[^@]+@(.+)$/);
  if (!m) return null;
  const dom = m[1];
  if (EMAIL_TYPOS[dom]) return email.replace(/@.+$/, "@" + EMAIL_TYPOS[dom]);
  return null;
}
function isEmailValid(s: string) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) && s.length <= 254;
}
function normalizePhone(s: string): { digits: string; formatted: string; valid: boolean } {
  const raw = s.replace(/[^\d+]/g, "");
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  // Iceland local 7-digit number → prefix +354
  let full = digits;
  if (!hasPlus && digits.length === 7) full = "354" + digits;
  // Sensible international: 8-15 digits
  const valid = full.length >= 8 && full.length <= 15;
  let formatted = "+" + full;
  if (full.startsWith("354") && full.length === 10) {
    formatted = `+354 ${full.slice(3, 6)} ${full.slice(6)}`;
  }
  return { digits: full, formatted, valid };
}

export function ConversationalForm() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [val, setVal] = useState("");
  const [hintMsg, setHintMsg] = useState("");
  const [hintErr, setHintErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [partHistory, setPartHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [partItems, setPartItems] = useState<string[]>([]);
  const [awaitingMoreParts, setAwaitingMoreParts] = useState(false);
  const [dynamicChips, setDynamicChips] = useState<Chip[] | null>(null);
  const [done, setDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [resumePromptShown, setResumePromptShown] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [thinkingLabel, setThinkingLabel] = useState("Thinking…");
  const [copied, setCopied] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSubmitRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Localized small strings
  const L = {
    resumeQ: lang === "pl" ? "Witaj z powrotem 👋 Mamy zapisany Twój postęp. Kontynuować?"
      : lang === "is" ? "Velkomin/n aftur 👋 Við vistuðum framganginn þinn. Halda áfram?"
      : "Welcome back 👋 We saved your progress. Continue?",
    resumeYes: lang === "pl" ? "Tak, kontynuuj" : lang === "is" ? "Já, halda áfram" : "Yes, continue",
    resumeNo: lang === "pl" ? "Zacznij od nowa" : lang === "is" ? "Byrja upp á nýtt" : "Start fresh",
    reset: lang === "pl" ? "Zacznij od nowa" : lang === "is" ? "Byrja upp á nýtt" : "Start over",
    resetConfirm: lang === "pl" ? "Skasować wszystkie odpowiedzi i zacząć od nowa?"
      : lang === "is" ? "Eyða öllum svörum og byrja upp á nýtt?"
      : "Clear all answers and start fresh?",
    netError: lang === "pl" ? "⚠️ Problem z połączeniem. Spróbuj jeszcze raz."
      : lang === "is" ? "⚠️ Tengingarvilla. Vinsamlegast reyndu aftur."
      : "⚠️ Connection problem. Please try again.",
    retry: lang === "pl" ? "🔄 Spróbuj ponownie" : lang === "is" ? "🔄 Reyna aftur" : "🔄 Retry",
    typoSuggest: lang === "pl" ? "Czy chodziło Ci o" : lang === "is" ? "Áttirðu við" : "Did you mean",
    badPhone: lang === "pl" ? "Hmm, ten numer wygląda na za krótki. Podaj 8+ cyfr (z kierunkowym, np. +354)."
      : lang === "is" ? "Þetta númer virðist of stutt. Sláðu inn 8+ tölustafi (með landsnúmeri, t.d. +354)."
      : "Hmm, that number looks too short. Please use 8+ digits (with country code, e.g. +354).",
    badEmail: lang === "pl" ? "Ten e-mail wygląda nieprawidłowo. Sprawdź pisownię."
      : lang === "is" ? "Þetta netfang lítur ekki rétt út. Athugaðu stafsetninguna."
      : "That email doesn't look right. Please check the spelling.",
    tooFast: lang === "pl" ? "Zbyt szybko 🤖 — odczekaj chwilę i spróbuj ponownie."
      : lang === "is" ? "Of hratt 🤖 — bíddu augnablik og reyndu aftur."
      : "Too fast 🤖 — please slow down a moment and try again.",
    why: lang === "pl" ? "Dlaczego pytamy?" : lang === "is" ? "Af hverju spyrjum við?" : "Why we ask?",
    socialProof: lang === "pl" ? "✓ 247 zapytań w tym miesiącu · ⏱ ~2 min na wypełnienie"
      : lang === "is" ? "✓ 247 fyrirspurnir í þessum mánuði · ⏱ ~2 mín að fylla út"
      : "✓ 247 requests this month · ⏱ ~2 min to fill in",
    missingWarn: lang === "pl" ? "⚠️ Bez tego nie damy rady się z Tobą skontaktować."
      : lang === "is" ? "⚠️ Án þessa getum við ekki haft samband við þig."
      : "⚠️ Without this we can't reach you back.",
    copyQuote: lang === "pl" ? "📋 Skopiuj kopię" : lang === "is" ? "📋 Afrita afrit" : "📋 Copy a copy",
    copied: lang === "pl" ? "Skopiowane!" : lang === "is" ? "Afritað!" : "Copied!",
  };

  const thinkingMessages = [
    lang === "pl" ? "Sprawdzam u dostawcy…" : lang === "is" ? "Skoða hjá birgi…" : "Checking with supplier…",
    lang === "pl" ? "Weryfikuję pasujące modele…" : lang === "is" ? "Sannreyni gerðir sem passa…" : "Verifying matching models…",
    lang === "pl" ? "Porównuję OEM vs. zamiennik…" : lang === "is" ? "Ber saman OEM vs. aukaframleiðslu…" : "Comparing OEM vs. aftermarket…",
  ];

  // ---- Persistence ----
  const persist = (next?: Partial<{ step: number; data: Record<string, string>; partItems: string[]; partHistory: typeof partHistory; photoUrls: string[] }>) => {
    try {
      const payload = {
        step: next?.step ?? step,
        data: next?.data ?? data,
        partItems: next?.partItems ?? partItems,
        partHistory: next?.partHistory ?? partHistory,
        photoUrls: next?.photoUrls ?? photoUrls,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* ignore quota */ }
  };
  const clearPersisted = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  };

  useEffect(() => {
    // Try to restore
    let restored = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only restore if <7 days old & has meaningful content
        const fresh = Date.now() - (parsed.savedAt ?? 0) < 7 * 86400 * 1000;
        const hasContent = (parsed.partItems?.length ?? 0) > 0 || Object.keys(parsed.data ?? {}).length > 0;
        if (fresh && hasContent) {
          restored = true;
          setResumePromptShown(true);
          setTimeout(() => {
            setBubbles([
              { who: "bot", html: L.resumeQ },
            ]);
            setDynamicChips([
              { label: L.resumeYes, submit: "__resume__", normalize: "__resume__" },
              { label: L.resumeNo, submit: "__fresh__", normalize: "__fresh__" },
            ]);
            setHintMsg("");
          }, 300);
        }
      }
    } catch { /* ignore */ }
    if (!restored) {
      setTimeout(() => {
        setBubbles([{ who: "bot", html: STEPS[0].ask }]);
        setHintMsg(STEPS[0].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [bubbles]);

  // Cycle "thinking" messages while busy
  useEffect(() => {
    if (busy) {
      let i = 0;
      setThinkingLabel(thinkingMessages[0]);
      thinkingTimerRef.current = setInterval(() => {
        i = (i + 1) % thinkingMessages.length;
        setThinkingLabel(thinkingMessages[i]);
      }, 1800);
    } else {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
      setThinkingLabel("Thinking…");
    }
    return () => { if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, lang]);

  // Email typo detection on the fly when on email step
  useEffect(() => {
    if (STEPS[step]?.key === "email" && val) {
      setEmailSuggestion(suggestEmailFix(val.trim()));
    } else {
      setEmailSuggestion(null);
    }
  }, [val, step]);

  const resumeStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      const restoredData = p.data ?? {};
      const restoredItems = p.partItems ?? [];
      const restoredHistory = p.partHistory ?? [];
      const restoredPhotos = p.photoUrls ?? [];
      const restoredStep = Math.min(p.step ?? 0, STEPS.length - 1);
      setData(restoredData);
      setPartItems(restoredItems);
      setPartHistory(restoredHistory);
      setPhotoUrls(restoredPhotos);
      setStep(restoredStep);
      setDynamicChips(null);
      setBubbles([
        { who: "bot", html: lang === "pl" ? "Świetnie, kontynuujemy! 🚀" : lang === "is" ? "Frábært, höldum áfram! 🚀" : "Great, picking up where you left off! 🚀" },
        { who: "bot", html: STEPS[restoredStep].ask },
      ]);
      setHintMsg(STEPS[restoredStep].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
      setResumePromptShown(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch { /* ignore */ }
  };

  const startFresh = () => {
    clearPersisted();
    setData({});
    setPartItems([]);
    setPartHistory([]);
    setPhotoUrls([]);
    setStep(0);
    setDynamicChips(null);
    setBubbles([{ who: "bot", html: STEPS[0].ask }]);
    setHintMsg(STEPS[0].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
    setResumePromptShown(false);
    setReviewing(false);
    setDone(false);
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReset = () => {
    if (!confirm(L.resetConfirm)) return;
    startFresh();
  };

  const submit = async () => {
    // Anti-bot checks
    if (honeypotRef.current?.value) return; // bot filled hidden field
    if (Date.now() - startTimeRef.current < MIN_HUMAN_MS) {
      setBubbles((b) => [...b, { who: "bot", html: L.tooFast }]);
      return;
    }
    setReviewing(false);
    setDone(true);
    setBubbles((b) => [...b, { who: "bot", html: t("form.allDone") }]);
    try {
      const payload: Record<string, unknown> = {};
      for (const k of ["part_links", "phone", "email", "company", "license_plate", "address", "delivery_preference"] as const) {
        if (data[k]) payload[k] = data[k];
      }
      if (photoUrls.length) payload.photo_urls = photoUrls;
      const { error } = await supabase.from("quotes").insert(payload as never);
      if (error) throw error;
      clearPersisted();
      setTimeout(() => navigate({ to: "/thank-you" }), 800);
    } catch {
      setDone(false);
      setBubbles((b) => [...b, {
        who: "error",
        html: t("form.failed"),
        retry: () => { void submit(); },
      }]);
    }
  };

  const openReview = () => {
    setReviewing(true);
    setBusy(false);
    setDynamicChips(null);
  };

  const editStep = (idx: number) => {
    const k = STEPS[idx].key;
    const newData = { ...data };
    delete newData[k];
    setData(newData);
    if (k === "part_links") {
      setPartItems([]);
      setPartHistory([]);
    }
    if (k === "photos") {
      setPhotoUrls([]);
    }
    setReviewing(false);
    setStep(idx);
    setBubbles((b) => [...b, { who: "bot", html: STEPS[idx].ask }]);
    setHintErr(false);
    setHintMsg(STEPS[idx].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
    persist({ step: idx, data: newData });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const goBack = () => {
    if (busy || step === 0) return;
    const prev = step - 1;
    const prevKey = STEPS[prev].key;
    const newData = { ...data };
    delete newData[prevKey];
    setData(newData);
    if (prevKey === "part_links") {
      setPartItems([]);
      setPartHistory([]);
    }
    setBubbles((b) => {
      const arr = [...b].filter((x) => x.who !== "typing");
      let lastUser = -1;
      for (let i = arr.length - 1; i >= 0; i--) if (arr[i].who === "user") { lastUser = i; break; }
      const trimmed = lastUser === -1 ? arr : arr.slice(0, lastUser);
      return [...trimmed, { who: "bot", html: STEPS[prev].ask }];
    });
    setStep(prev);
    setVal("");
    setDynamicChips(null);
    setAwaitingMoreParts(false);
    setHintErr(false);
    setHintMsg(STEPS[prev].multiline ? "Enter to send · Shift+Enter for new line" : "Press Enter to continue");
    persist({ step: prev, data: newData });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const PLATE_RE = /\b[A-Z]{2,3}[\s-]?\d{2,3}\b/;
  const YEAR_RE = /\b(19|20)\d{2}\b/;
  const MAKE_RE = /\b(toyota|kia|hyundai|vw|volkswagen|skoda|seat|audi|bmw|mercedes|benz|ford|opel|renault|peugeot|citroen|fiat|nissan|mazda|honda|suzuki|subaru|mitsubishi|volvo|saab|jeep|chrysler|dodge|tesla|porsche|land\s?rover|range\s?rover|jaguar|mini|dacia|lexus|infiniti|scania|man|daf|iveco|ursus|massey|john\s?deere|new\s?holland|kubota|jcb|caterpillar|komatsu)\b/i;

  const inferVehicleFromParts = (): string | null => {
    const blob = [...partHistory.map((m) => m.content), ...partItems].join(" \n ");
    const upper = blob.toUpperCase();
    const plateMatch = upper.match(PLATE_RE);
    if (plateMatch) return plateMatch[0].replace(/[\s-]/g, "");
    if (MAKE_RE.test(blob) && YEAR_RE.test(blob)) {
      const line = blob.split(/\n+/).find((l) => MAKE_RE.test(l) && YEAR_RE.test(l));
      return (line ?? blob).trim().slice(0, 120);
    }
    return null;
  };

  const advanceStep = (overrideData?: Record<string, string>) => {
    setDynamicChips(null);
    const baseData = overrideData ?? data;
    let next = step + 1;
    const workingData = { ...baseData };
    while (next < STEPS.length && STEPS[next].key === "license_plate" && !workingData["license_plate"]) {
      const inferred = inferVehicleFromParts();
      if (!inferred) break;
      workingData["license_plate"] = inferred;
      next++;
    }
    setData(workingData);
    if (next < STEPS.length) {
      setTimeout(() => {
        setBubbles((b) => [...b, { who: "bot", html: STEPS[next].ask }]);
        setStep(next);
        const nextStep = STEPS[next];
        setHintMsg(
          nextStep.upload
            ? "Tap to add photos or skip"
            : nextStep.multiline
              ? "Enter to send · Shift+Enter for new line"
              : "Press Enter to continue"
        );
        setBusy(false);
        persist({ step: next, data: workingData });
        if (!nextStep.upload) inputRef.current?.focus();
      }, 350);
    } else {
      setBusy(false);
      persist({ step: next, data: workingData });
      openReview();
    }
  };

  const onNext = async () => {
    if (busy) return;
    // Debounce duplicate submits (rapid Enter)
    const now = Date.now();
    if (now - lastSubmitRef.current < 400) return;
    lastSubmitRef.current = now;

    const cur = STEPS[step];
    const v = val.trim();

    // Resume / fresh chips selection special case
    if (resumePromptShown && (v === "__resume__" || v === "__fresh__")) {
      v === "__resume__" ? resumeStored() : startFresh();
      setVal("");
      return;
    }

    if (!v && cur.optional) {
      const newData = { ...data, [cur.key]: "" };
      setData(newData);
      setBubbles((b) => [...b, { who: "user", text: "Skipped", faded: true }]);
      setVal("");
      advanceStep(newData);
      return;
    }
    if (!v) {
      setHintErr(true); setHintMsg("Please enter a value"); return;
    }

    // Client-side validation BEFORE wasting an AI call
    if (cur.key === "phone") {
      const { formatted, valid } = normalizePhone(v);
      if (!valid) {
        setHintErr(true);
        setHintMsg(L.badPhone);
        return;
      }
      const newData = { ...data, phone: formatted };
      setData(newData);
      setBubbles((b) => [...b, { who: "user", text: formatted }]);
      setVal("");
      advanceStep(newData);
      return;
    }
    if (cur.key === "email") {
      if (!isEmailValid(v)) {
        setHintErr(true);
        setHintMsg(L.badEmail);
        return;
      }
      const fix = suggestEmailFix(v);
      if (fix && fix !== v) {
        // Don't block — just suggest via banner already shown; user can apply
        // Keep going if they really want
      }
      const newData = { ...data, email: v.toLowerCase() };
      setData(newData);
      setBubbles((b) => [...b, { who: "user", text: v }]);
      setVal("");
      advanceStep(newData);
      return;
    }

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
          history: isPart ? newHistory.slice(-8) : undefined,
        },
      });
      setBubbles((b) => b.filter((x) => x.who !== "typing"));
      if (error) throw error;

      const reply: string = res?.reply || "OK!";
      const valid: boolean = !!res?.valid;
      const normalized: string = res?.normalized ?? v;

      setBubbles((b) => [...b, { who: "bot", html: reply }]);

      if (isPart) {
        const cappedHistory = [...newHistory, { role: "assistant" as const, content: reply.replace(/<[^>]+>/g, "") }].slice(-12);
        setPartHistory(cappedHistory);
      }

      if (!valid) {
        const aiChips: Chip[] = Array.isArray(res?.chips)
          ? res.chips
              .filter((c: { label?: string; fill?: string }) => c && typeof c.label === "string")
              .slice(0, 4)
              .map((c: { label: string; fill?: string }) => ({ label: c.label, fill: c.fill ?? "" }))
          : [];
        setDynamicChips(aiChips.length ? aiChips : null);
        setBusy(false);
        inputRef.current?.focus();
        return;
      }

      setDynamicChips(null);
      if (isPart) {
        const updated = [...partItems, normalized];
        setPartItems(updated);
        const newData = { ...data, [cur.key]: updated.join("\n---\n") };
        setData(newData);
        setAwaitingMoreParts(true);
        setBusy(false);
        persist({ data: newData, partItems: updated });
        return;
      }
      const newData = { ...data, [cur.key]: normalized };
      setData(newData);
      advanceStep(newData);
    } catch {
      setBubbles((b) => [
        ...b.filter((x) => x.who !== "typing"),
        { who: "error", html: L.netError, retry: () => { setVal(v); setTimeout(() => onNext(), 50); } },
      ]);
      setBusy(false);
    }
  };

  const onChip = (chip: Chip) => {
    if (busy) return;
    if (chip.fill !== undefined && chip.submit === undefined) {
      setVal(chip.fill);
      inputRef.current?.focus();
      return;
    }
    const cur = STEPS[step];
    const submitVal = chip.submit ?? "";
    // Resume/fresh special path
    if (submitVal === "__resume__") { resumeStored(); return; }
    if (submitVal === "__fresh__") { startFresh(); return; }
    if (chip.normalize !== undefined) {
      const newData = { ...data, [cur.key]: chip.normalize };
      setData(newData);
      setBubbles((b) => [...b, { who: "user", text: chip.label, faded: !chip.normalize }]);
      advanceStep(newData);
      return;
    }
    setVal(submitVal);
    setTimeout(() => onNext(), 0);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (uploading) return;
    setUploading(true);
    const remaining = MAX_PHOTOS - photoUrls.length;
    const list = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];
    for (const file of list) {
      if (file.size > MAX_PHOTO_BYTES) {
        setBubbles((b) => [...b, { who: "bot", html: `<small>⚠️ ${file.name} is over 10 MB and was skipped.</small>` }]);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("quote-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) {
        setBubbles((b) => [...b, { who: "bot", html: `<small>⚠️ Could not upload ${file.name}.</small>` }]);
        continue;
      }
      const { data: pub } = supabase.storage.from("quote-photos").getPublicUrl(path);
      if (pub?.publicUrl) newUrls.push(pub.publicUrl);
    }
    const merged = [...photoUrls, ...newUrls];
    setPhotoUrls(merged);
    setUploading(false);
    persist({ photoUrls: merged });
  };

  const removePhoto = (url: string) => {
    const next = photoUrls.filter((u) => u !== url);
    setPhotoUrls(next);
    persist({ photoUrls: next });
  };

  const finishPhotosStep = () => {
    if (busy || uploading) return;
    setBubbles((b) => [
      ...b,
      photoUrls.length
        ? { who: "user", text: `${photoUrls.length} photo${photoUrls.length > 1 ? "s" : ""} attached` }
        : { who: "user", text: "No photos", faded: true },
    ]);
    advanceStep();
  };

  const copySummary = async () => {
    const lines = STEPS.map((s) => {
      const v = s.key === "photos" ? (photoUrls.length ? `${photoUrls.length} photo(s): ${photoUrls.join(", ")}` : "") : (data[s.key] ?? "");
      return v ? `${s.key}: ${v}` : null;
    }).filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  const cur = STEPS[step] ?? STEPS[STEPS.length - 1];
  const progress = (step / STEPS.length) * 100;
  const charCount = val.length;
  const maxLen = cur.maxLen;
  const overLimit = maxLen ? charCount > maxLen : false;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-mas-orange rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-navy" style={{ fontFamily: "Exo 2" }}>
              {t("form.title")}
            </div>
            <div className="text-[11px] text-slate-600">{L.socialProof}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mounted && !done && step > 0 && !reviewing && (
            <button
              onClick={goBack}
              disabled={busy}
              className="flex items-center gap-1 text-[12px] font-semibold text-navy bg-white hover:bg-slate-100 active:bg-slate-200 transition-colors rounded-full px-3 py-1.5 border border-slate-300 disabled:opacity-50"
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t("form.back") || "Back"}
            </button>
          )}
          {mounted && !done && (step > 0 || partItems.length > 0) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[12px] font-semibold text-slate-600 bg-white hover:bg-slate-100 transition-colors rounded-full px-3 py-1.5 border border-slate-300"
              aria-label={L.reset}
              title={L.reset}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{L.reset}</span>
            </button>
          )}
          <div className="text-[11px] font-bold text-mas-orange bg-orange-50 px-2.5 py-1 rounded-full">
            {t("form.step")} {Math.min(step + 1, STEPS.length)} {t("form.of")} {STEPS.length}
          </div>
        </div>
      </div>
      <div className="h-1 bg-muted">
        <div className="h-1 bg-mas-orange transition-all" style={{ width: `${done ? 100 : progress}%` }} />
      </div>
      <div
        ref={chatRef}
        className="px-4 pt-4 pb-2 flex flex-col gap-2.5"
        style={{ minHeight: 160, maxHeight: "min(340px,40vh)", overflowY: "auto" }}
        aria-live="polite"
        aria-atomic="false"
        role="log"
      >
        {bubbles.map((b, i) =>
          b.who === "bot" ? (
            <div key={i} className="c-bubble-bot" dangerouslySetInnerHTML={{ __html: b.html ?? "" }} />
          ) : b.who === "error" ? (
            <div key={i} className="c-bubble-bot" style={{ borderLeft: "3px solid #ef4444", background: "#fef2f2" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <div dangerouslySetInnerHTML={{ __html: b.html ?? "" }} />
                  {b.retry && (
                    <button
                      onClick={b.retry}
                      className="mt-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full px-3 py-1.5"
                    >
                      {L.retry}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : b.who === "typing" ? (
            <div key={i} className="c-bubble-bot" style={{ display: "inline-flex", gap: 8, width: "fit-content", alignItems: "center" }} aria-label={thinkingLabel}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              <span className="text-xs text-slate-500 ml-1">{thinkingLabel}</span>
            </div>
          ) : (
            <div key={i} className="c-bubble-user" style={{ opacity: b.faded ? 0.45 : 1 }}>{b.text}</div>
          )
        )}
      </div>

      {/* Honeypot — hidden from humans */}
      <input
        ref={honeypotRef}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {/* Review & Confirm */}
      {!done && reviewing && (() => {
        const reviewItems = STEPS.map((s, idx) => {
          let value = "";
          if (s.key === "photos") {
            value = photoUrls.length ? `${photoUrls.length} photo${photoUrls.length > 1 ? "s" : ""}` : "";
          } else {
            value = data[s.key] ?? "";
          }
          const labelMap: Record<string, string> = {
            part_links: lang === "pl" ? "Część / link" : lang === "is" ? "Hlutur / hlekkur" : "Part / link",
            phone: lang === "pl" ? "Telefon" : lang === "is" ? "Sími" : "Phone",
            email: lang === "pl" ? "E-mail" : "Email",
            company: lang === "pl" ? "Imię / firma" : lang === "is" ? "Nafn / fyrirtæki" : "Name / company",
            license_plate: lang === "pl" ? "Tablica / pojazd" : lang === "is" ? "Skráningarn. / ökutæki" : "Plate / vehicle",
            address: lang === "pl" ? "Adres dostawy" : lang === "is" ? "Heimilisfang" : "Delivery address",
            delivery_preference: lang === "pl" ? "Dostawa" : lang === "is" ? "Sending" : "Shipping",
            photos: lang === "pl" ? "Zdjęcia" : lang === "is" ? "Myndir" : "Photos",
          };
          const required = s.key === "phone" || s.key === "email" || s.key === "part_links" || s.key === "company";
          const missing = required && !value;
          return { idx, key: s.key, label: labelMap[s.key], value, missing };
        });
        const heading = lang === "pl"
          ? "Sprawdź swoje odpowiedzi 👇"
          : lang === "is"
            ? "Yfirfarðu svörin þín 👇"
            : "Review your answers 👇";
        const sub = lang === "pl"
          ? "Wszystko się zgadza? Możesz edytować dowolny krok."
          : lang === "is"
            ? "Er allt rétt? Þú getur breytt hverju skrefi."
            : "All correct? You can edit any step.";
        const editLbl = lang === "pl" ? "Edytuj" : lang === "is" ? "Breyta" : "Edit";
        const sendLbl = lang === "pl" ? "✅ Wyślij zapytanie" : lang === "is" ? "✅ Senda beiðni" : "✅ Send request";
        const emptyLbl = lang === "pl" ? "(pominięte)" : lang === "is" ? "(sleppt)" : "(skipped)";
        const hasMissing = reviewItems.some((x) => x.missing);
        return (
          <div className="px-4 pb-3">
            <div className="rounded-xl border-2 border-mas-orange/30 bg-orange-50/50 p-3 mb-3">
              <div className="font-extrabold text-navy text-sm mb-0.5" style={{ fontFamily: "Exo 2" }}>{heading}</div>
              <div className="text-xs text-slate-700">{sub}</div>
            </div>
            <ul className="flex flex-col gap-2">
              {reviewItems.map((it) => (
                <li
                  key={it.key}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${it.missing ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{it.label}</div>
                    <div className={`text-sm mt-0.5 break-words whitespace-pre-wrap ${it.value ? "text-navy" : "text-slate-500 italic"}`}>
                      {it.value || emptyLbl}
                    </div>
                    {it.missing && (
                      <div className="text-[11px] text-red-700 font-semibold mt-1">{L.missingWarn}</div>
                    )}
                    {it.key === "photos" && photoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {photoUrls.map((url) => (
                          <img key={url} src={url} alt="Uploaded part" className="w-10 h-10 rounded object-cover border border-border" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => editStep(it.idx)}
                    className="shrink-0 text-xs font-semibold text-mas-orange hover:underline px-2 py-1"
                    aria-label={`${editLbl} ${it.label}`}
                  >
                    {editLbl}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={copySummary}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy font-semibold text-sm py-3 px-4"
                aria-label={L.copyQuote}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? L.copied : L.copyQuote}
              </button>
              <button
                onClick={submit}
                disabled={hasMissing}
                className="flex-1 rounded-xl bg-mas-orange text-white font-bold text-base py-3.5 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendLbl}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Multi-part loop */}
      {!done && !reviewing && !busy && awaitingMoreParts && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setAwaitingMoreParts(false); setVal(""); inputRef.current?.focus(); }}
            className="text-sm font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-4 py-2 border border-slate-200"
            aria-label={lang === "pl" ? "Dodaj kolejną część" : "Add another part"}
          >➕ Add another part</button>
          <button
            onClick={() => {
              setAwaitingMoreParts(false);
              setVal("");
              setBubbles((b) => [...b, { who: "user", text: "🔗 I'll paste a link instead" }, {
                who: "bot",
                html: lang === "pl"
                  ? "Świetnie! Wklej link do części (lub kilka linków, jeden na linijkę) — opłata wyszukiwania <strong>znika</strong>, płacisz tylko części + wysyłkę."
                  : lang === "is"
                    ? "Frábært! Sendu hlekk á hlutinn (eða nokkra, einn á línu) — leitargjaldið <strong>fellur niður</strong>, þú borgar aðeins varahluti + sendingu."
                    : "Great! Paste the link(s) to the part — one per line. The search fee <strong>disappears</strong>, you only pay parts + shipping.",
              }]);
              inputRef.current?.focus();
            }}
            className="text-sm font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-4 py-2 border border-slate-200"
          >🔗 Paste link instead</button>
          <button
            onClick={() => {
              const info = lang === "pl"
                ? "Wynajmujesz nas jako <strong>swojego kupca w Europie</strong>. Za <strong>4 960 ISK (z VAT)</strong>: kontaktujemy się z naszymi zaufanymi dostawcami (Niemcy, Polska, kraje bałtyckie), <strong>negocjujemy najlepszą cenę w Twoim imieniu</strong>, sprawdzamy dopasowanie do Twojego pojazdu (VIN/OEM), porównujemy OEM vs. dobry zamiennik i przygotowujemy pełną wycenę z transportem i cłem. Płatne z góry — <strong>kwota wlicza się w cenę zamówienia, gdy kupisz</strong>. Wklej link — opłata znika."
                : lang === "is"
                  ? "Þú ert að ráða okkur sem <strong>kaupanda þinn í Evrópu</strong>. Fyrir <strong>4 960 ISK (m. VSK)</strong>: höfum samband við trausta birgja okkar (Þýskaland, Pólland, Eystrasaltsríkin), <strong>semjum besta verðið fyrir þína hönd</strong>, staðfestum að hluturinn passi (VIN/OEM), berum saman OEM vs. góða aukaframleiðslu og útbúum heildartilboð með flutningi og tolli. Greitt fyrirfram — <strong>dregst frá pöntuninni þegar þú kaupir</strong>. Sendu hlekk — gjaldið fellur niður."
                  : "You're hiring us as <strong>your buyer in Europe</strong>. For <strong>4 960 ISK (incl. VAT)</strong>: we contact our trusted EU suppliers (Germany, Poland, Baltics), <strong>negotiate the best price on your behalf</strong>, verify the part fits your vehicle (VIN/OEM), compare OEM vs. quality aftermarket options and prepare a full quote with shipping + customs included. Paid upfront — <strong>credited toward your order when you buy</strong>. Paste a link and the fee disappears.";
              setBubbles((b) => [...b, { who: "user", text: "ℹ️ Tell me more about the fee" }, { who: "bot", html: info }]);
            }}
            className="text-sm font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-4 py-2 border border-slate-200"
          >ℹ️ More about fee</button>
          <button
            onClick={() => { setAwaitingMoreParts(false); advanceStep(); }}
            className="text-[12px] font-bold text-white bg-mas-orange hover:opacity-90 transition rounded-full px-3 py-1.5 border-0"
          >✅ That's all — continue</button>
        </div>
      )}

      {/* Quick-reply chips */}
      {!done && !reviewing && !busy && !awaitingMoreParts && !!(dynamicChips?.length || cur.chips?.length) && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {(dynamicChips?.length ? dynamicChips : cur.chips ?? []).map((chip) => (
            <button
              key={chip.label}
              onClick={() => onChip(chip)}
              className="text-sm font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-4 py-2 border border-slate-200"
              aria-label={chip.label.replace(/^[^\w]+/, "").trim() || chip.label}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Email typo banner */}
      {!done && !reviewing && cur.key === "email" && emailSuggestion && (
        <div className="mx-4 mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs flex items-center justify-between gap-2">
          <span className="text-amber-900">
            {L.typoSuggest} <strong>{emailSuggestion}</strong>?
          </span>
          <button
            onClick={() => { setVal(emailSuggestion); setEmailSuggestion(null); }}
            className="text-amber-900 font-bold underline hover:no-underline"
          >
            {lang === "pl" ? "Zastosuj" : lang === "is" ? "Beita" : "Apply"}
          </button>
        </div>
      )}

      {/* Photos uploader */}
      {!done && !reviewing && cur.upload && (
        <div className="px-5 pb-5 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
          />
          {photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {photoUrls.map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || photoUrls.length >= MAX_PHOTOS}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-mas-orange hover:bg-orange-50 transition-colors py-3 text-sm font-semibold text-navy disabled:opacity-50"
            >
              {uploading ? (
                <>Uploading…</>
              ) : photoUrls.length >= MAX_PHOTOS ? (
                <><ImageIcon className="w-4 h-4" aria-hidden="true" /> Max {MAX_PHOTOS} reached</>
              ) : (
                <><Upload className="w-4 h-4" aria-hidden="true" /> {photoUrls.length === 0 ? "Add photos" : "Add more"}</>
              )}
            </button>
            <button
              onClick={finishPhotosStep}
              disabled={uploading}
              className="px-5 rounded-xl bg-mas-orange text-white font-bold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {photoUrls.length ? "Continue" : "Skip"}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-2">
            {photoUrls.length}/{MAX_PHOTOS} photos · max 10 MB each
          </p>
        </div>
      )}

      {/* Text input */}
      {!done && !reviewing && !cur.upload && (
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
              maxLength={maxLen ? maxLen + 50 : undefined}
              aria-label={cur.hint || cur.key}
              className="w-full rounded-xl py-3.5 pl-4 pr-14 text-base outline-none resize-none border-2 transition-colors box-border disabled:opacity-60"
              style={{ borderColor: hintErr || overLimit ? "#ef4444" : "" }}
            />
            <button
              onClick={onNext}
              disabled={busy || overLimit}
              aria-label="Continue"
              className="absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full bg-mas-orange border-0 cursor-pointer flex items-center justify-center disabled:opacity-60"
              style={{ boxShadow: "0 2px 8px color-mix(in oklab, var(--mas-orange) 40%, transparent)" }}
            >
              <ArrowRight className="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
            <p className="text-xs m-0" style={{ color: hintErr ? "#ef4444" : "#475569" }}>
              {busy ? thinkingLabel : hintMsg}
            </p>
            <div className="flex items-center gap-2">
              {cur.why && (
                <button
                  type="button"
                  onClick={() => setWhyOpen((v) => !v)}
                  className="text-xs text-slate-600 bg-transparent border-0 cursor-pointer flex items-center gap-1 hover:text-mas-orange"
                  aria-expanded={whyOpen}
                >
                  <Info className="w-3 h-3" aria-hidden="true" /> {L.why}
                </button>
              )}
              {maxLen && charCount > maxLen * 0.7 && (
                <span className={`text-xs ${overLimit ? "text-red-600 font-bold" : "text-slate-500"}`}>
                  {charCount}/{maxLen}
                </span>
              )}
              {cur.optional && !busy && (
                <button onClick={() => { setVal(""); onNext(); }} className="text-xs text-slate-600 bg-transparent border-0 cursor-pointer underline px-2 py-1">
                  Skip this step
                </button>
              )}
            </div>
          </div>
          {whyOpen && cur.why && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
              {cur.why[lang]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
