import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Package, Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageContext";
import { useNavigate } from "@tanstack/react-router";

type Chip = {
  label: string;
  /** If set, fills the input with this text and lets the user keep typing. */
  fill?: string;
  /** If set, immediately submits this value (skips AI validation when normalize is provided). */
  submit?: string;
  /** When provided, treats `submit` as already-validated and skips backend call. */
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
  /** Special UI mode — file uploader instead of text input. */
  upload?: boolean;
};

const STEPS: Step[] = [
  {
    key: "part_links", apiStep: "part",
    ask: "Hi 👋 Tell us what car part you need.<br><small style='opacity:0.75'>1. <strong>Got a link (or several)?</strong> Paste them all — one per line is perfect. You pay for the parts + shipping (customs clearance included).<br>2. <strong>No link?</strong> We'll find it for you, we negotiate best deal possible on your behalf — search fee <strong>4 960 ISK (incl. VAT)</strong> is paid upfront before we start searching.</small>",
    hint: "Paste one or more links (one per line), OEM number, or describe the part",
    multiline: true,
    chips: [
      { label: "🔗 I have link(s)", fill: "" },
      { label: "🔢 OEM number", fill: "OEM number: " },
      { label: "✏️ Describe the part", fill: "" },
    ],
  },
  {
    key: "phone", apiStep: "phone",
    ask: "Got it! Your <strong>phone number</strong>?<br><small style='opacity:0.7'>So we can reach you if we need to confirm details.</small>",
    hint: "e.g. +354 787 8617",
  },
  { key: "email", apiStep: "email", ask: "And your <strong>email</strong>?", hint: "e.g. you@workshop.is" },
  { key: "company", apiStep: "company", ask: "Your <strong>name or company</strong>?", hint: "e.g. Workshop ehf." },
  {
    key: "license_plate", apiStep: "license_plate",
    ask: "<strong>License plate</strong> or <strong>car make, model & year</strong>?<br><small style='opacity:0.7'>Either works — a plate is fastest (we can look the car up from it). Otherwise just type something like \"VW Golf 2015 1.6 TDI\".</small>",
    hint: "e.g. KEF 123  —  or  —  VW Golf 2015 1.6 TDI",
    optional: true,
    chips: [
      { label: "Skip for now", submit: "", normalize: "" },
    ],
  },
  {
    key: "address", apiStep: "address",
    ask: "<strong>Delivery address</strong> in Iceland?",
    hint: "e.g. Hafnarbraut 5, Reykjanesbær",
    optional: true,
    chips: [
      { label: "📦 I'll pick up myself", submit: "Personal pickup", normalize: "Personal pickup" },
    ],
  },
  {
    key: "delivery_preference", apiStep: "delivery_preference",
    ask: "How would you like it shipped?<br><small style='opacity:0.7'>Pick what suits you — we'll quote both if you're not sure.</small>",
    hint: "Tap a button or type your own preference",
    optional: true,
    chips: [
      { label: "🚚 Standard — cheaper", submit: "Standard (cheaper)", normalize: "Standard (cheaper)" },
      { label: "✈️ Express — fastest", submit: "Express (fastest)", normalize: "Express (fastest)" },
      { label: "🤔 Quote me both", submit: "Quote both options", normalize: "Quote both options" },
    ],
  },
  {
    key: "photos", apiStep: "photos",
    ask: "Last step! 📸 Add <strong>photos of the part or car</strong> (optional but speeds things up a lot).<br><small style='opacity:0.7'>Up to 5 photos, max 10 MB each.</small>",
    hint: "",
    optional: true,
    upload: true,
  },
];

type Bubble = { who: "bot" | "user" | "typing"; html?: string; text?: string; faded?: boolean };

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [partHistory, setPartHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [partItems, setPartItems] = useState<string[]>([]);
  const [awaitingMoreParts, setAwaitingMoreParts] = useState(false);
  const [dynamicChips, setDynamicChips] = useState<Chip[] | null>(null);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const payload: Record<string, unknown> = {};
      for (const k of ["part_links", "phone", "email", "company", "license_plate", "address", "delivery_preference"] as const) {
        if (data[k]) payload[k] = data[k];
      }
      if (photoUrls.length) payload.photo_urls = photoUrls;
      await supabase.from("quotes").insert(payload as never);
      setTimeout(() => navigate({ to: "/thank-you" }), 800);
    } catch {
      setBubbles((b) => [...b, { who: "bot", html: t("form.failed") }]);
      setDone(false);
    }
  };

  const goBack = () => {
    if (busy || step === 0) return;
    const prev = step - 1;
    const prevKey = STEPS[prev].key;
    delete data[prevKey];
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
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const advanceStep = () => {
    setDynamicChips(null);
    const next = step + 1;
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
        if (!nextStep.upload) inputRef.current?.focus();
      }, 350);
    } else {
      setBusy(false);
      submit();
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
      advanceStep();
      return;
    }
    if (!v) {
      setHintErr(true); setHintMsg("Please enter a value"); return;
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
          history: isPart ? newHistory : undefined,
        },
      });
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
        // Show AI-suggested chips for the follow-up question
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
      // Multi-part loop: after the AI accepts a part, ask if user wants to add more.
      if (isPart) {
        const updated = [...partItems, normalized];
        setPartItems(updated);
        data[cur.key] = updated.join("\n---\n");
        setAwaitingMoreParts(true);
        setBusy(false);
        return;
      }
      data[cur.key] = normalized;
      advanceStep();
    } catch {
      setBubbles((b) => b.filter((x) => x.who !== "typing"));
      data[cur.key] = v;
      advanceStep();
    }
  };

  const onChip = (chip: Chip) => {
    if (busy) return;
    // Pre-fill mode — let user keep typing
    if (chip.fill !== undefined && chip.submit === undefined) {
      setVal(chip.fill);
      inputRef.current?.focus();
      return;
    }
    // Direct submit (skip AI when normalize is provided)
    const cur = STEPS[step];
    const submitVal = chip.submit ?? "";
    if (chip.normalize !== undefined) {
      // Local fast-path: no backend call
      data[cur.key] = chip.normalize;
      setBubbles((b) => [...b, { who: "user", text: chip.label, faded: !chip.normalize }]);
      advanceStep();
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
    setPhotoUrls((cur) => [...cur, ...newUrls]);
    setUploading(false);
  };

  const removePhoto = (url: string) => {
    setPhotoUrls((cur) => cur.filter((u) => u !== url));
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
            <div className="font-extrabold text-sm text-navy" style={{ fontFamily: "Exo 2" }}>
              {t("form.title")}
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

      {/* Multi-part loop: after a part is accepted, let the user add more or move on */}
      {!done && !busy && awaitingMoreParts && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setAwaitingMoreParts(false); setVal(""); inputRef.current?.focus(); }}
            className="text-[12px] font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-3 py-1.5 border border-slate-200"
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
            className="text-[12px] font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-3 py-1.5 border border-slate-200"
          >🔗 Paste link instead</button>
          <button
            onClick={() => {
              const info = lang === "pl"
                ? "<strong>Opłata wyszukiwania 4 960 ISK (z VAT)</strong> pokrywa: research u dostawców w Europie (Niemcy, Polska, kraje bałtyckie), weryfikację zgodności części z Twoim pojazdem (VIN/numer OEM), porównanie cen i przygotowanie najlepszej oferty. Płatna z góry, niezależnie od decyzji o zakupie. <strong>Wklej link — opłata znika.</strong>"
                : lang === "is"
                  ? "<strong>Leitargjald 4 960 ISK (m. VSK)</strong> dekkur: leit hjá birgjum í Evrópu, staðfestingu á að hluturinn passi (VIN/OEM), verðsamanburð og besta tilboð. Greitt fyrirfram, óháð kaupum. <strong>Sendu hlekk — gjaldið fellur niður.</strong>"
                  : "<strong>Search fee 4 960 ISK (incl. VAT)</strong> covers: sourcing across European suppliers (Germany, Poland, Baltics), verifying the part fits your vehicle (VIN / OEM check), price comparison and preparing the best offer. Paid upfront, regardless of whether you buy. <strong>Paste a link and the fee disappears.</strong>";
              setBubbles((b) => [...b, { who: "user", text: "ℹ️ Tell me more about the fee" }, { who: "bot", html: info }]);
            }}
            className="text-[12px] font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-3 py-1.5 border border-slate-200"
          >ℹ️ More about fee</button>
          <button
            onClick={() => { setAwaitingMoreParts(false); advanceStep(); }}
            className="text-[12px] font-bold text-white bg-mas-orange hover:opacity-90 transition rounded-full px-3 py-1.5 border-0"
          >✅ That's all — continue</button>
        </div>
      )}

      {/* Quick-reply chips: AI-suggested (dynamicChips) take priority over static cur.chips */}
      {!done && !busy && !awaitingMoreParts && !!(dynamicChips?.length || cur.chips?.length) && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {(dynamicChips?.length ? dynamicChips : cur.chips ?? []).map((chip) => (
            <button
              key={chip.label}
              onClick={() => onChip(chip)}
              className="text-[12px] font-medium text-navy bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors rounded-full px-3 py-1.5 border border-slate-200"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {!done && cur.upload && (
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
                  <img src={url} alt="upload" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
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
                <><ImageIcon className="w-4 h-4" /> Max {MAX_PHOTOS} reached</>
              ) : (
                <><Upload className="w-4 h-4" /> {photoUrls.length === 0 ? "Add photos" : "Add more"}</>
              )}
            </button>
            <button
              onClick={finishPhotosStep}
              disabled={uploading}
              className="px-5 rounded-xl bg-mas-orange text-white font-bold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {photoUrls.length ? "Send request" : "Skip & send"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {photoUrls.length}/{MAX_PHOTOS} photos · max 10 MB each
          </p>
        </div>
      )}

      {!done && !cur.upload && (
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
