import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Truck, Mail, Send } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/translations";

// ---- Tariff data (ported from kalkulator_exportowy.html) ----
const PLN_TO_ISK = 34;
const PLN_TO_EUR = 0.235;
const VAT = 1.24;

// Poczta Polska – Strefa A2 (Iceland), PLN/parcel; index = kg, max 20
const ppA2 = [0, 76, 92, 105, 115, 129, 132, 140, 148, 157, 164, 171, 181, 188, 194, 202, 211, 221, 231, 238, 250];

// DHL – Zone 4 (Iceland) with customs clearance, PLN
const dhlTab: [number, number][] = [
  [0.5, 115.06], [1, 138.6], [1.5, 160.82], [2, 183.04], [2.5, 203.94],
  [3, 215.38], [3.5, 226.82], [4, 238.26], [4.5, 249.7], [5, 261.14],
  [5.5, 271.26], [6, 281.38], [6.5, 291.5], [7, 301.62], [7.5, 311.74],
  [8, 321.86], [8.5, 331.98], [9, 342.1], [9.5, 352.22], [10, 362.34],
];

function dhlCost(w: number): number | null {
  if (w <= 0) return 0;
  for (const [kg, pln] of dhlTab) if (w <= kg) return pln;
  if (w <= 20) return 362.34 + Math.ceil((w - 10) / 0.5) * 8.58;
  if (w <= 30) return 533.94 + Math.ceil((w - 20) / 0.5) * 7.26;
  if (w <= 70) return 679.14 + Math.ceil(w - 30) * 11.22;
  if (w <= 300) return 1127.94 + Math.ceil(w - 70) * 12.76;
  return null;
}
function ppCost(w: number): number {
  let c = 0;
  while (w > 0) { c += ppA2[Math.min(Math.ceil(w), 20)]; w -= 20; }
  return c;
}

// ---- i18n ----
type T = {
  title: string; addTitle: string; nameLbl: string; priceLbl: string; weightLbl: string;
  dimTitle: string; dimL: string; dimW: string; dimH: string; addBtn: string;
  orderTitle: string; colName: string; colPLN: string; colKg: string; clearBtn: string;
  shipTitle: string; shipNamePP: string; hintPP: string; hintDHL: string;
  rProducts: string; rShip: string; rTotal: string; rTotalNetto: string; footer: string;
  errFields: string; errDhlDim: string; errDhlKg: string; errPPLen: string; errPPGirth: string;
  warnPPSplit: string; errPPItemWeight: string; warnOversize: string;
  orderNow: string; askQuote: string; emptyHint: string; addedHint: string;
};
const TR: Record<Lang, T> = {
  pl: {
    title: "Kalkulator wyceny", addTitle: "Dodaj produkt",
    nameLbl: "Nazwa produktu (opcjonalnie)", priceLbl: "Cena w PL (PLN)", weightLbl: "Waga (kg)",
    dimTitle: "Wymiary opakowania — opcjonalne", dimL: "Dług. cm", dimW: "Szer. cm", dimH: "Wys. cm",
    addBtn: "+ Dodaj do zamówienia",
    orderTitle: "Twoje produkty", colName: "Produkt", colPLN: "PLN", colKg: "kg",
    clearBtn: "↺ Wyczyść",
    shipTitle: "Wysyłka", shipNamePP: "Poczta", hintPP: "Taniej, wolniej", hintDHL: "Szybciej, drożej",
    rProducts: "Produkty", rShip: "Wysyłka", rTotal: "Łącznie z VAT", rTotalNetto: "Łącznie bez VAT",
    footer: "1 PLN ≈ 34 ISK · 1 PLN ≈ 0,235 EUR. Wycena szacunkowa — finalną cenę potwierdzamy po sprawdzeniu dostępności.",
    errFields: "⚠ Podaj cenę (PLN) i wagę (kg).",
    errDhlDim: "❌ Wymiar opakowania przekracza 300 cm – DHL nie przyjmie tej paczki.",
    errDhlKg: "❌ Łączna waga przekracza 300 kg – DHL nie przyjmie zamówienia.",
    errPPLen: "❌ Najdłuższy bok przekracza 150 cm – Poczta Polska nie przyjmie paczki.",
    errPPGirth: "❌ Obwód (L+2·W+2·H) przekracza 300 cm – Poczta Polska nie przyjmie paczki.",
    warnPPSplit: "ℹ Łączna waga > 20 kg – Poczta Polska podzieli przesyłkę na kilka paczek.",
    errPPItemWeight: "❌ Jeden produkt waży ponad 20 kg – Poczta Polska nie wyśle niepodzielnej paczki >20 kg.",
    warnOversize: "ℹ Niestandardowy wymiar DHL (+87 PLN dopłata za każdą taką paczkę).",
    orderNow: "✅ Zamów po tej cenie", askQuote: "💬 Zapytaj o tę wycenę",
    emptyHint: "Wpisz cenę i wagę, aby zobaczyć szacunek dostawy do Islandii.",
    addedHint: "Możesz dodać kolejny produkt powyżej.",
  },
  is: {
    title: "Verðreiknir", addTitle: "Bæta við vöru",
    nameLbl: "Heiti vöru (valfrjálst)", priceLbl: "Verð í PL (PLN)", weightLbl: "Þyngd (kg)",
    dimTitle: "Mál á pakka — valfrjálst", dimL: "Lengd cm", dimW: "Breidd cm", dimH: "Hæð cm",
    addBtn: "+ Bæta við pöntun",
    orderTitle: "Vörurnar þínar", colName: "Vara", colPLN: "PLN", colKg: "kg",
    clearBtn: "↺ Hreinsa",
    shipTitle: "Sending", shipNamePP: "Pósturinn", hintPP: "Ódýrara, hægar", hintDHL: "Hraðar, dýrara",
    rProducts: "Vörur", rShip: "Sending", rTotal: "Samtals m. VSK", rTotalNetto: "Samtals án VSK",
    footer: "1 PLN ≈ 34 ISK · 1 PLN ≈ 0,235 EUR. Áætlað verð — endanlegt verð staðfest eftir að við athugum framboð.",
    errFields: "⚠ Sláðu inn verð (PLN) og þyngd (kg).",
    errDhlDim: "❌ Hlið fer yfir 300 cm – DHL getur ekki sent.",
    errDhlKg: "❌ Þyngd fer yfir 300 kg – DHL getur ekki sent.",
    errPPLen: "❌ Lengsta hlið yfir 150 cm – Pósturinn getur ekki sent.",
    errPPGirth: "❌ Ummál (L+2·W+2·H) yfir 300 cm – Pósturinn getur ekki sent.",
    warnPPSplit: "ℹ Heildaþyngd yfir 20 kg – Pósturinn skiptir í fleiri pakka.",
    errPPItemWeight: "❌ Ein vara yfir 20 kg – Pósturinn getur ekki sent óskiptanlegan pakka.",
    warnOversize: "ℹ Óstaðlað stærð DHL (+87 PLN/pakki).",
    orderNow: "✅ Panta á þessu verði", askQuote: "💬 Spyrja um þetta verð",
    emptyHint: "Sláðu inn verð og þyngd til að sjá áætlað verð til Íslands.",
    addedHint: "Þú getur bætt við annarri vöru að ofan.",
  },
  en: {
    title: "Price calculator", addTitle: "Add product",
    nameLbl: "Product name (optional)", priceLbl: "Price in PL (PLN)", weightLbl: "Weight (kg)",
    dimTitle: "Package dimensions — optional", dimL: "Length cm", dimW: "Width cm", dimH: "Height cm",
    addBtn: "+ Add to order",
    orderTitle: "Your products", colName: "Product", colPLN: "PLN", colKg: "kg",
    clearBtn: "↺ Clear",
    shipTitle: "Shipping", shipNamePP: "Post", hintPP: "Cheaper, slower", hintDHL: "Faster, pricier",
    rProducts: "Products", rShip: "Shipping", rTotal: "Total incl. VAT", rTotalNetto: "Total excl. VAT",
    footer: "1 PLN ≈ 34 ISK · 1 PLN ≈ 0.235 EUR. Estimate only — final price confirmed after we check availability.",
    errFields: "⚠ Enter price (PLN) and weight (kg).",
    errDhlDim: "❌ Package dimension exceeds 300 cm – DHL cannot ship.",
    errDhlKg: "❌ Total weight exceeds 300 kg – DHL cannot ship this order.",
    errPPLen: "❌ Longest side exceeds 150 cm – Poczta Polska cannot ship.",
    errPPGirth: "❌ Girth (L+2·W+2·H) exceeds 300 cm – Poczta Polska cannot ship.",
    warnPPSplit: "ℹ Total weight > 20 kg – Poczta Polska will split into multiple parcels.",
    errPPItemWeight: "❌ One item weighs over 20 kg – Poczta Polska cannot ship a single parcel > 20 kg.",
    warnOversize: "ℹ DHL non-standard size (+87 PLN per parcel).",
    orderNow: "✅ Order at this price", askQuote: "💬 Ask about this quote",
    emptyHint: "Enter price and weight to see your estimate to Iceland.",
    addedHint: "You can add another product above.",
  },
};

// ---- Types ----
export type CalcItem = {
  name: string;
  pricePLN: number;
  weightKg: number;
  L?: number; W?: number; H?: number;
};
export type CalcSnapshot = {
  items: CalcItem[];
  ship: "pp" | "dhl";
  totalCostPLN: number;
  totalKg: number;
  shipBasePLN: number;
  multiplier: number;
  grandISK: number;
  grandPLN: number;
  grandEUR: number;
  nettoISK: number;
};

// ---- Helpers ----
const fmt = (v: number) => Math.round(v).toLocaleString("pl-PL");
const fmtDec = (v: number, dec = 2) =>
  v.toLocaleString("pl-PL", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ---- Component ----
export function PriceCalculator({
  onOrder,
  onAskQuote,
}: {
  onOrder: (snap: CalcSnapshot) => void;
  onAskQuote?: (snap: CalcSnapshot) => void;
}) {
  const { lang } = useLang();
  const t = TR[lang];

  const [items, setItems] = useState<CalcItem[]>([]);
  const [ship, setShip] = useState<"pp" | "dhl">("pp");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [dimsOpen, setDimsOpen] = useState(false);
  const [L, setL] = useState(""); const [W, setW] = useState(""); const [H, setH] = useState("");
  const [fieldErr, setFieldErr] = useState("");

  const addItem = () => {
    const p = parseFloat(price); const w = parseFloat(weight);
    if (!(p > 0) || !(w > 0)) { setFieldErr(t.errFields); return; }
    setItems((arr) => [...arr, {
      name: name.trim() || "—", pricePLN: p, weightKg: w,
      L: parseFloat(L) || 0, W: parseFloat(W) || 0, H: parseFloat(H) || 0,
    }]);
    setName(""); setPrice(""); setWeight(""); setL(""); setW(""); setH(""); setFieldErr("");
  };
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const clearAll = () => setItems([]);

  // Recalculate
  const calc = useMemo(() => {
    if (!items.length) return null;
    const totalCostPLN = items.reduce((s, it) => s + it.pricePLN, 0);
    const totalKg = items.reduce((s, it) => s + it.weightKg, 0);

    const warns: { cls: "error" | "caution" | "info"; msg: string }[] = [];
    let canShip = true;
    let oversizeCnt = 0;
    let ppLenErr = false, ppGirthErr = false, dhlDimErr = false;

    items.forEach((it) => {
      if (!it.L && !it.W && !it.H) return;
      const [d1, d2, d3] = [it.L || 0, it.W || 0, it.H || 0].sort((a, b) => b - a);
      if (ship === "dhl") {
        if (d1 > 300) dhlDimErr = true;
        else if (d1 > 100 || d2 > 80) oversizeCnt++;
      } else {
        const girth = d1 + 2 * d2 + 2 * d3;
        if (d1 > 150) ppLenErr = true;
        if (girth > 300) ppGirthErr = true;
      }
    });

    let shipBasePLN = 0;
    if (ship === "dhl") {
      if (dhlDimErr) { canShip = false; warns.push({ cls: "error", msg: t.errDhlDim }); }
      else if (totalKg > 300) { canShip = false; warns.push({ cls: "error", msg: t.errDhlKg }); }
      else {
        const c = dhlCost(totalKg);
        if (c == null) { canShip = false; warns.push({ cls: "error", msg: t.errDhlKg }); }
        else {
          shipBasePLN = c + oversizeCnt * 87;
          if (oversizeCnt > 0) warns.push({ cls: "caution", msg: t.warnOversize });
        }
      }
    } else {
      if (ppLenErr) { canShip = false; warns.push({ cls: "error", msg: t.errPPLen }); }
      if (ppGirthErr) { canShip = false; warns.push({ cls: "error", msg: t.errPPGirth }); }
      if (canShip && items.some((it) => it.weightKg > 20)) {
        canShip = false; warns.push({ cls: "error", msg: t.errPPItemWeight });
      }
      if (canShip) {
        shipBasePLN = ppCost(totalKg);
        if (totalKg > 20) warns.push({ cls: "info", msg: t.warnPPSplit });
      }
    }

    if (!canShip) return { canShip: false, warns } as const;

    const totalBaseISK = (totalCostPLN + shipBasePLN) * PLN_TO_ISK;
    const mult = totalBaseISK * 1.65 <= 50000 ? 1.65 : 1.5;

    const prodISK = totalCostPLN * PLN_TO_ISK * mult;
    const shipISK = shipBasePLN * PLN_TO_ISK * mult;
    const grandISK = prodISK + shipISK;
    const grandPLN = totalCostPLN * mult + shipBasePLN * mult;
    const grandEUR = grandPLN * PLN_TO_EUR;
    const nettoISK = grandISK / VAT;

    return {
      canShip: true, warns,
      totalCostPLN, totalKg, shipBasePLN, multiplier: mult,
      prodISK, shipISK, grandISK, grandPLN, grandEUR, nettoISK,
    } as const;
  }, [items, ship, t]);

  const snapshot: CalcSnapshot | null =
    calc && calc.canShip
      ? {
          items, ship,
          totalCostPLN: calc.totalCostPLN, totalKg: calc.totalKg, shipBasePLN: calc.shipBasePLN,
          multiplier: calc.multiplier,
          grandISK: calc.grandISK, grandPLN: calc.grandPLN, grandEUR: calc.grandEUR,
          nettoISK: calc.nettoISK,
        }
      : null;

  // Auto-clear field error after 3s
  useEffect(() => { if (!fieldErr) return; const id = setTimeout(() => setFieldErr(""), 3000); return () => clearTimeout(id); }, [fieldErr]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col gap-3">
      {/* Add product */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t.addTitle}</div>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t.nameLbl}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-mas-orange mb-2"
          style={{ fontSize: "16px" }}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number" inputMode="decimal" min="0" step="0.01" value={price}
            onChange={(e) => setPrice(e.target.value)} placeholder={t.priceLbl}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-mas-orange"
            style={{ fontSize: "16px" }}
          />
          <input
            type="number" inputMode="decimal" min="0" step="0.1" value={weight}
            onChange={(e) => setWeight(e.target.value)} placeholder={t.weightLbl}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-mas-orange"
            style={{ fontSize: "16px" }}
          />
        </div>
        <button
          type="button" onClick={() => setDimsOpen((v) => !v)}
          className="mt-2 text-[11px] font-semibold text-slate-500 hover:text-navy"
        >
          {dimsOpen ? "▼" : "▶"} {t.dimTitle}
        </button>
        {dimsOpen && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <input type="number" inputMode="decimal" placeholder={t.dimL} value={L} onChange={(e) => setL(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-mas-orange" style={{ fontSize: "16px" }} />
            <input type="number" inputMode="decimal" placeholder={t.dimW} value={W} onChange={(e) => setW(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-mas-orange" style={{ fontSize: "16px" }} />
            <input type="number" inputMode="decimal" placeholder={t.dimH} value={H} onChange={(e) => setH(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-mas-orange" style={{ fontSize: "16px" }} />
          </div>
        )}
        {fieldErr && <div className="mt-2 text-xs font-semibold text-red-600">{fieldErr}</div>}
        <button
          type="button" onClick={addItem}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-navy text-white text-sm font-bold py-2.5 hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> {t.addBtn}
        </button>
      </div>

      {/* Items list */}
      {items.length > 0 ? (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t.orderTitle}</div>
            <button onClick={clearAll} className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> {t.clearBtn}</button>
          </div>
          <ul className="flex flex-col divide-y divide-slate-100">
            {items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="flex-1 min-w-0 truncate text-navy">{it.name}</span>
                <span className="text-slate-600 tabular-nums">{fmtDec(it.pricePLN)} PLN</span>
                <span className="text-slate-500 tabular-nums w-12 text-right">{it.weightKg.toFixed(1)} kg</span>
                <button onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-500 mt-2">{t.addedHint}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic px-1">{t.emptyHint}</p>
      )}

      {/* Shipping toggle */}
      {items.length > 0 && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t.shipTitle}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button" onClick={() => setShip("pp")}
              className={`rounded-lg border-2 p-2.5 text-center transition-colors ${ship === "pp" ? "border-mas-orange bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <Mail className="w-5 h-5 mx-auto mb-1 text-navy" />
              <div className="text-xs font-bold text-navy">{t.shipNamePP}</div>
              <div className="text-[10px] text-slate-500">{t.hintPP}</div>
            </button>
            <button
              type="button" onClick={() => setShip("dhl")}
              className={`rounded-lg border-2 p-2.5 text-center transition-colors ${ship === "dhl" ? "border-mas-orange bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <Truck className="w-5 h-5 mx-auto mb-1 text-navy" />
              <div className="text-xs font-bold text-navy">DHL Express</div>
              <div className="text-[10px] text-slate-500">{t.hintDHL}</div>
            </button>
          </div>
        </div>
      )}

      {/* Warnings */}
      {calc?.warns?.length ? (
        <div className="flex flex-col gap-1.5">
          {calc.warns.map((w, i) => (
            <div
              key={i}
              className={`rounded-md px-3 py-2 text-xs ${
                w.cls === "error" ? "bg-red-50 border border-red-200 text-red-700 font-semibold" :
                w.cls === "caution" ? "bg-amber-50 border border-amber-200 text-amber-800" :
                "bg-slate-50 border border-slate-200 text-slate-600"
              }`}
            >{w.msg}</div>
          ))}
        </div>
      ) : null}

      {/* Result */}
      {calc?.canShip && (
        <div className="rounded-xl bg-navy text-white p-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[11px] uppercase tracking-wider text-white/60">{t.rProducts}</span>
            <span className="text-sm tabular-nums">{fmt(calc.prodISK)} kr</span>
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[11px] uppercase tracking-wider text-white/60">{t.rShip}</span>
            <span className="text-sm tabular-nums text-amber-300">{fmt(calc.shipISK)} kr</span>
          </div>
          <div className="border-t border-white/15 pt-3 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] uppercase tracking-wider text-white/70">{t.rTotal}</span>
              <span className="text-2xl font-black tabular-nums">{fmt(calc.grandISK)} kr</span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40">{t.rTotalNetto}</span>
              <span className="text-xs tabular-nums text-white/50">{fmt(calc.nettoISK)} kr</span>
            </div>
            <div className="text-[10px] text-white/40 mt-1 text-right">
              ≈ {fmtDec(calc.grandPLN)} PLN · {fmtDec(calc.grandEUR)} EUR
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onAskQuote && (
              <button
                type="button" onClick={() => snapshot && onAskQuote(snapshot)}
                className="flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2.5"
              >
                {t.askQuote}
              </button>
            )}
            <button
              type="button" onClick={() => snapshot && onOrder(snapshot)}
              className="flex items-center justify-center gap-2 rounded-lg bg-mas-orange hover:opacity-90 text-white text-sm font-bold py-2.5 sm:col-start-2"
            >
              <Send className="w-4 h-4" /> {t.orderNow}
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center leading-relaxed">{t.footer}</p>
    </div>
  );
}
