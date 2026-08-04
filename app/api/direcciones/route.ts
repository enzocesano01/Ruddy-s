// Autocompletado de direcciones para el checkout.
//
// Hace de proxy a Photon (geocodificador abierto sobre OpenStreetMap) para que
// el cliente no dependa de CORS ni tenga que conocer el proveedor. Si más
// adelante se pasa a Google Places, sólo cambia este archivo: el contrato con
// el cliente (`{ suggestions: [{ id, label, detail, lat, lon }] }`) queda igual.

const PHOTON = "https://photon.komoot.io/api/";

// Sesgo hacia San Miguel de Tucumán y recorte a la provincia, para que escribir
// "Paraguay 2086" no devuelva una calle homónima de Buenos Aires.
const BIAS = { lat: -26.8241, lon: -65.2226 };
const BBOX = [-66.3, -28.1, -64.4, -25.9] as const;

// Photon no interpola alturas: tiene la calle "Paraguay" pero no el 2086. Así
// que buscamos la calle y le devolvemos pegada la altura que escribió la
// persona. Las direcciones que sí existen como nodo en OSM se priorizan.
const HOUSE_NUMBER = /\s+(\d{1,5})\s*$/;

// Zona de reparto: estos partidos van primero en la lista.
const CORE_AREAS = ["san miguel de tucumán", "yerba buena", "tafí viejo", "banda del río salí"];

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    locality?: string;
    state?: string;
    type?: string;
    osm_id?: number;
    osm_type?: string;
  };
};

export type AddressSuggestion = {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lon: number;
};

async function photon(query: string): Promise<PhotonFeature[]> {
  const url = new URL(PHOTON);
  url.searchParams.set("q", query);
  // Photon sólo acepta lang default/de/en/fr — omitirlo devuelve los nombres
  // locales, que es justo lo que queremos.
  url.searchParams.set("limit", "8");
  url.searchParams.set("lat", String(BIAS.lat));
  url.searchParams.set("lon", String(BIAS.lon));
  url.searchParams.set("bbox", BBOX.join(","));

  const response = await fetch(url, {
    headers: { "User-Agent": "ruddys-web/1.0 (pedidos)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`photon ${response.status}`);
  const body = (await response.json()) as { features?: PhotonFeature[] };
  return body.features ?? [];
}

function areaOf(p: NonNullable<PhotonFeature["properties"]>) {
  return p.city ?? p.locality ?? p.district ?? "";
}

// Photon no encuentra "Muñecas" pero sí "Munecas": su índice para esta zona no
// guarda algunos diacríticos. Consultar la versión sin acentos es seguro — las
// calles que sí están acentuadas responden igual.
const fold = (value: string) =>
  value
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function toSuggestion(feature: PhotonFeature, fallbackNumber: string): AddressSuggestion | null {
  const p = feature.properties ?? {};
  const coords = feature.geometry?.coordinates;
  if (!coords) return null;
  if (p.type && p.type !== "street" && p.type !== "house") return null;

  const street = p.street ?? p.name ?? "";
  if (!street) return null;

  const number = p.housenumber ?? fallbackNumber;
  const label = number ? `${street} ${number}` : street;
  const state = p.state?.toLowerCase().includes("tucum") ? "Tucumán" : p.state;
  const detail = [areaOf(p), state].filter(Boolean).join(", ");

  return {
    id: `${p.osm_type ?? "x"}${p.osm_id ?? ""}-${label}`,
    label,
    detail,
    lon: coords[0],
    lat: coords[1],
  };
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) return Response.json({ suggestions: [] });

  const match = query.match(HOUSE_NUMBER);
  const number = match ? match[1] : "";
  const streetOnly = match ? query.slice(0, match.index).trim() : query;

  // Con altura consultamos dos formas: la exacta (por si el nodo existe en OSM)
  // y la calle sola sin acentos, que es la que responde de forma confiable.
  const queries = number && streetOnly.length >= 3
    ? [query, fold(streetOnly)]
    : [...new Set([query, fold(query)])];

  try {
    const batches = await Promise.all(queries.map((q) => photon(q).catch(() => [])));

    const seen = new Set<string>();
    const found: (AddressSuggestion & { exact: boolean; core: boolean })[] = [];

    for (const [batchIndex, features] of batches.entries()) {
      for (const feature of features) {
        const state = feature.properties?.state?.toLowerCase() ?? "";
        if (state && !state.includes("tucum")) continue;

        const suggestion = toSuggestion(feature, batchIndex === 0 ? "" : number);
        if (!suggestion) continue;

        const key = `${suggestion.label}|${suggestion.detail}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const area = areaOf(feature.properties ?? {}).toLowerCase();
        found.push({
          ...suggestion,
          exact: Boolean(feature.properties?.housenumber),
          core: CORE_AREAS.some((a) => area.includes(a)),
        });
      }
    }

    // Direcciones exactas primero, después la zona de reparto.
    found.sort((a, b) => Number(b.exact) - Number(a.exact) || Number(b.core) - Number(a.core));

    const suggestions = found
      .slice(0, 6)
      .map(({ exact: _exact, core: _core, ...rest }) => rest);

    return Response.json({ suggestions });
  } catch {
    return Response.json({ error: "geocoder", suggestions: [] }, { status: 502 });
  }
}
