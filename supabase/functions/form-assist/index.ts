// Smart form assistant for the part-request conversational form.
// Uses Lovable AI for intelligent parsing/clarification of free-text input.
// Heuristics handle obvious cases first to save calls.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  step: string; // "part" | "phone" | "email" | "company" | "license_plate" | "address"
  value: string;
  lang?: "en" | "pl" | "is";
};

const URL_RE = /https?:\/\/[^\s]+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SKIP_RE = /^(skip|no|nope|none|n\/a|na|yes|ok|okay|sure|idk|hi|hello|hey|hej|halo|czesc|cześć|\-|\.+|x|_|test|asdf+)$/i;

function plateNormalize(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function callAI(system: string, user: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "respond",
            description: "Return validation + reply for the user input",
            parameters: {
              type: "object",
              properties: {
                valid: { type: "boolean", description: "Is the input usable for this step?" },
                reply: { type: "string", description: "Short friendly bot reply (1-2 sentences). HTML <strong> ok. If valid: brief acknowledgement. If invalid: ask for what's missing." },
                normalized: { type: "string", description: "Cleaned/normalized version of the user input to store" },
                make: { type: "string" },
                model: { type: "string" },
                year: { type: "string" },
                part_type: { type: "string" },
              },
              required: ["valid", "reply", "normalized"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "respond" } },
    }),
  });
  if (!r.ok) {
    if (r.status === 429) throw new Error("rate_limited");
    if (r.status === 402) throw new Error("payment_required");
    throw new Error(`ai_error_${r.status}`);
  }
  const data = await r.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) throw new Error("no_tool_call");
  return JSON.parse(tc.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { step, value, lang = "en" }: ReqBody = await req.json();
    const v = (value ?? "").trim();

    // ---------- Heuristic fast-paths (no AI call) ----------
    if (step === "email") {
      const ok = EMAIL_RE.test(v) && !SKIP_RE.test(v);
      return json({
        valid: ok,
        normalized: v.toLowerCase(),
        reply: ok ? "Perfect, got it. ✓" : "Hmm, that doesn't look like a valid email. Try again?",
      });
    }
    if (step === "phone") {
      const digits = v.replace(/\D/g, "");
      const ok = digits.length >= 7 && !SKIP_RE.test(v);
      return json({
        valid: ok,
        normalized: v.replace(/\s+/g, " "),
        reply: ok ? "Great, noted. ✓" : "Please enter a valid phone number (with country code if outside Iceland).",
      });
    }
    if (step === "license_plate") {
      if (!v) return json({ valid: true, normalized: "", reply: "No problem, skipping." });
      const norm = plateNormalize(v);
      const ok = norm.length >= 2 && norm.length <= 8;
      return json({
        valid: ok,
        normalized: norm,
        reply: ok ? `Noted: <strong>${norm}</strong>` : "That doesn't look like a plate. You can also skip.",
      });
    }

    // ---------- AI-assisted steps ----------
    if (step === "part") {
      // If it's clearly just a URL, accept fast.
      if (URL_RE.test(v) && v.length < 500) {
        return json({
          valid: true,
          normalized: v,
          reply: "Got the link! 🔗 I'll send it to our parts team.",
        });
      }
      if (!v || v.length < 4 || SKIP_RE.test(v)) {
        return json({
          valid: false,
          normalized: v,
          reply: "I need a bit more — paste a product link, or tell me the <strong>car (make, model, year)</strong> and the <strong>part</strong> you need.",
        });
      }
      const sys = `You are a friendly parts intake assistant for MAS Parts Iceland (auto parts importer).
The user is describing what part they need. Extract: make, model, year, part_type if present.
Decide if there's enough info to proceed. Minimum acceptable: a recognizable part type AND at least one of (make/model/year) — OR a clear product URL.
If too vague (e.g. "I need a part", "brakes for my car"), set valid=false and politely ask for the missing pieces.
Reply MUST be in language: ${lang}. Keep reply under 25 words. Use <strong> for emphasis. Be warm, slightly playful.
"normalized" = a clean one-line summary like "2019 BMW 320d front brake disc".`;
      try {
        const out = await callAI(sys, v);
        return json(out);
      } catch (e) {
        // Graceful fallback: accept if reasonably long
        const ok = v.length > 8;
        return json({
          valid: ok,
          normalized: v,
          reply: ok ? "Got it, thanks!" : "Could you add the car make, model and year?",
        });
      }
    }

    if (step === "company") {
      if (!v || v.length < 2 || /^\d+$/.test(v) || SKIP_RE.test(v)) {
        return json({ valid: false, normalized: v, reply: "Just your name or company name please 🙂" });
      }
      return json({ valid: true, normalized: v, reply: `Nice to meet you, <strong>${escapeHtml(v)}</strong>!` });
    }

    if (step === "address") {
      if (!v) return json({ valid: true, normalized: "", reply: "OK, skipping for now." });
      const ok = v.length >= 4;
      return json({ valid: ok, normalized: v, reply: ok ? "Address noted. ✓" : "Please give a delivery address in Iceland." });
    }

    return json({ valid: true, normalized: v, reply: "OK!" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    const status = msg === "rate_limited" ? 429 : msg === "payment_required" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(o: unknown) {
  return new Response(JSON.stringify(o), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
