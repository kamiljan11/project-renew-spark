// Looks up an Icelandic car by license plate via autoparts.is public API.
// Returns normalized vehicle data (make, model, year, colour, fuel, VIN).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalizePlate(raw: string): string {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function pretty(s: string | undefined | null): string {
  if (!s) return "";
  const lower = s.toLocaleLowerCase("is-IS");
  return lower.charAt(0).toLocaleUpperCase("is-IS") + lower.slice(1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body: { plate?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const plate = normalizePlate(body.plate ?? "");
  if (plate.length < 4 || plate.length > 7) {
    return json(200, { found: false, reason: "invalid_plate" });
  }

  try {
    const resp = await fetch(`https://www.autoparts.is/api/car-data/${plate}`, {
      headers: {
        "Accept": "application/vnd.api+json, application/json",
        "Accept-Language": "is-IS,is;q=0.9,en;q=0.8",
        "Referer": "https://www.autoparts.is/",
        "Origin": "https://www.autoparts.is",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });

    if (resp.status === 404) {
      return json(200, { found: false, reason: "not_found", plate });
    }
    if (!resp.ok) {
      return json(200, { found: false, reason: "upstream_error", status: resp.status });
    }

    const payload = await resp.json() as {
      data?: {
        permno?: string; vin?: string; make?: string; vehcom?: string;
        color?: string; modelyear?: string; manufacturer?: string;
        vehiclestatus?: string;
        technical?: { engine?: string; capacity?: string; vehgroup?: string };
      };
    };
    const d = payload?.data;
    if (!d) return json(200, { found: false, reason: "empty" });

    const make = pretty(d.make || d.manufacturer || "");
    const model = pretty(d.vehcom || "");
    const year = d.modelyear || "";
    const color = pretty(d.color || "");
    const fuel = pretty(d.technical?.engine || "");
    const summary = [make, model, year].filter(Boolean).join(" ").trim()
      + (color ? ` · ${color}` : "")
      + (fuel ? ` · ${fuel}` : "");

    return json(200, {
      found: true,
      plate: d.permno || plate,
      make,
      model,
      year,
      color,
      fuel,
      vin: d.vin || "",
      status: pretty(d.vehiclestatus || ""),
      summary,
    });
  } catch (e) {
    return json(200, { found: false, reason: "exception", message: String(e) });
  }
});
