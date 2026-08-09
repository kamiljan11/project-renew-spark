// Direct browser lookup against autoparts.is national vehicle registry.
// No CORS, no auth — replaces the previous edge-function bridge.

export interface VehicleData {
  plate: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  fuel: string;
  engineCc: number;
  powerKw: number;
  powerHp: number;
  color: string;
  tecdocId: number | null;
  driveType: string;
  engineCode: string;
}

export interface VehicleLookupResult {
  success: boolean;
  data?: VehicleData;
  error?: string;
}

function pretty(s: string | undefined | null): string {
  if (!s) return "";
  const lower = s.toLocaleLowerCase("is-IS");
  return lower.charAt(0).toLocaleUpperCase("is-IS") + lower.slice(1);
}

export function vehicleSummary(v: VehicleData): string {
  const head = [pretty(v.make), pretty(v.model), v.year || ""].filter(Boolean).join(" ").trim();
  const extras: string[] = [];
  if (v.color) extras.push(pretty(v.color));
  if (v.fuel) extras.push(pretty(v.fuel));
  if (v.engineCc) extras.push(`${v.engineCc}cc`);
  if (v.powerHp) extras.push(`${v.powerHp}HP`);
  return extras.length ? `${head} · ${extras.join(" · ")}` : head;
}

export async function lookupVehicle(plate: string): Promise<VehicleLookupResult> {
  const cleanPlate = plate.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleanPlate) return { success: false, error: "No plate provided" };

  try {
    const response = await fetch(`https://www.autoparts.is/api/car-data/${cleanPlate}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return { success: false, error: "Vehicle not found" };

    const json = await response.json();
    const d = json?.data;
    if (!d) return { success: false, error: "No data returned" };

    let tecdocId: number | null = null;
    let driveType = "";
    let powerHp = 0;

    if (d.cars) {
      const prime = Object.values(d.cars as Record<string, unknown>).find(
        (c) => (c as { prime?: boolean })?.prime === true,
      ) as
        | {
            record?: {
              vehicleDetails?: { carId?: number; impulsionType?: string; powerHpFrom?: number };
            };
          }
        | undefined;
      const vd = prime?.record?.vehicleDetails;
      if (vd) {
        tecdocId = vd.carId ?? null;
        driveType = vd.impulsionType ?? "";
        powerHp = vd.powerHpFrom ?? 0;
      }
    }

    const year = d.firstregdate ? parseInt(String(d.firstregdate).split(".")[2]) : 0;

    return {
      success: true,
      data: {
        plate: (d.regno ?? d.car_number ?? cleanPlate).toString().toUpperCase(),
        make: d.make ?? "",
        model: d.vehcom ?? "",
        year: Number.isFinite(year) ? year : 0,
        vin: d.vin ?? "",
        fuel: d.technical?.engine ?? "",
        engineCc: d.technical?.capacity ? parseInt(d.technical.capacity) : 0,
        powerKw: d.technical?.maxnetpow ? parseFloat(d.technical.maxnetpow) : 0,
        powerHp,
        color: d.color ?? "",
        tecdocId,
        driveType,
        engineCode: d.technical?.enginecode ?? "",
      },
    };
  } catch {
    return { success: false, error: "Network error" };
  }
}
