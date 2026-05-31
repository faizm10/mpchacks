import { US_STATE, CA_PROVINCE } from "./geo";
import { fleetName, fmtMoney } from "./analytics";
import type { MappedTransaction, FleetRoute } from "./transactionMap";

export type MapChatAction = {
  flyTo?: { lng: number; lat: number; zoom: number };
  selectId?: string;
  setFleet?: string;
  setSeverity?: "all" | "flagged";
};

export type MapChatMessage = {
  role: "user" | "assistant";
  content: string;
  action?: MapChatAction;
};

const STATE_NAMES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  ontario: "ON",
  quebec: "QC",
  "british columbia": "BC",
  alberta: "AB",
};

export const MAP_CHAT_SUGGESTIONS = [
  "Where is Washington?",
  "Show PILOT transactions",
  "What is fleet 3001?",
  "Flagged spend in Texas",
];

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/[?.!]+$/g, "");
}

function resolveRegion(token: string): { code: string; lng: number; lat: number; label: string } | null {
  const t = token.trim().toUpperCase();
  if (US_STATE[t]) {
    const [lng, lat] = US_STATE[t];
    return { code: t, lng, lat, label: t };
  }
  if (CA_PROVINCE[t]) {
    const [lng, lat] = CA_PROVINCE[t];
    return { code: t, lng, lat, label: t };
  }
  const nameKey = token.trim().toLowerCase();
  const code = STATE_NAMES[nameKey];
  if (code && US_STATE[code]) {
    const [lng, lat] = US_STATE[code];
    return { code, lng, lat, label: nameKey.replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  if (code && CA_PROVINCE[code]) {
    const [lng, lat] = CA_PROVINCE[code];
    return { code, lng, lat, label: nameKey.replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  return null;
}

function extractRegion(q: string): string | null {
  const whereMatch = q.match(/\b(?:where is|where's|show|go to|locate|zoom to|find)\s+(.+)/i);
  if (whereMatch) return whereMatch[1].trim();

  for (const [name] of Object.entries(STATE_NAMES)) {
    if (q.includes(name)) return name;
  }
  const abbr = q.match(/\b([A-Z]{2})\b/);
  if (abbr && (US_STATE[abbr[1]] || CA_PROVINCE[abbr[1]])) return abbr[1];

  return null;
}

function extractMerchant(q: string): string | null {
  const m =
    q.match(/\b(?:show|find|what is|what's|transactions at|stops at|merchant)\s+(.+)/i) ??
    q.match(/\b(pilot|shell|love'?s?|ta\s|petro|chevron|exxon|walmart|costco)\b/i);
  if (!m) return null;
  const term = (m[1] ?? m[0]).trim().replace(/[?.!]+$/g, "");
  return term.length >= 2 ? term : null;
}

function extractFleet(q: string): string | null {
  const m = q.match(/\b(?:fleet|unit|card)\s*#?\s*(\d{3,5})\b/i) ?? q.match(/\b(\d{4})\b/);
  return m?.[1] ?? null;
}

function summarizeRegion(points: MappedTransaction[], region: { code: string; label: string }) {
  const inRegion = points.filter((p) => p.tx.state?.toUpperCase() === region.code);
  const spend = inRegion.reduce((s, p) => s + p.tx.amount, 0);
  const flagged = inRegion.filter((p) => p.severity !== "clear" && p.severity !== "low").length;
  const merchants = new Map<string, number>();
  for (const p of inRegion) {
    merchants.set(p.tx.merchant, (merchants.get(p.tx.merchant) ?? 0) + 1);
  }
  const top = [...merchants.entries()].sort((a, b) => b[1] - a[1])[0];
  return { count: inRegion.length, spend, flagged, topMerchant: top };
}

function summarizeMerchant(points: MappedTransaction[], term: string) {
  const needle = term.toLowerCase();
  const hits = points.filter((p) => p.tx.merchant.toLowerCase().includes(needle));
  const spend = hits.reduce((s, p) => s + p.tx.amount, 0);
  const states = new Map<string, number>();
  for (const p of hits) {
    const st = p.tx.state || "?";
    states.set(st, (states.get(st) ?? 0) + 1);
  }
  const topState = [...states.entries()].sort((a, b) => b[1] - a[1])[0];
  return { hits, spend, topState };
}

export function answerMapQuery(
  raw: string,
  points: MappedTransaction[],
  routes: FleetRoute[],
): { reply: string; action?: MapChatAction } {
  const q = normalize(raw);
  if (!q) {
    return {
      reply: "Ask where a state is, what a merchant is, or which fleet unit to focus on.",
    };
  }

  if (/^(help|what can you do|how)/.test(q)) {
    return {
      reply:
        "Try:\n• “Where is Washington?” — pans the map\n• “Show PILOT” — highlights merchant stops\n• “What is fleet 3001?” — focuses a unit\n• “Flagged in Texas” — filters risk in a region",
    };
  }

  const wantsFlagged = /\b(flagged|critical|high risk|risky|violations?)\b/.test(q);
  const fleetCode = extractFleet(q);
  if (fleetCode) {
    const route = routes.find((r) => r.fleetCode.includes(fleetCode) || r.fleetCode === fleetCode);
    const code = route?.fleetCode ?? fleetCode;
    const unitPoints = points.filter((p) => p.tx.cardCode.includes(code));
    if (!unitPoints.length) {
      return { reply: `No mapped transactions for fleet unit ${fleetCode}. Try 3001, 3002, …` };
    }
    const spend = unitPoints.reduce((s, p) => s + p.tx.amount, 0);
    const [lng, lat] = route?.hq ?? [unitPoints[0].lng, unitPoints[0].lat];
    return {
      reply: `${fleetName(code)} has ${unitPoints.length.toLocaleString()} mapped stops totaling ${fmtMoney(spend)}. HQ centroid selected — routes available in the fleet filter.`,
      action: {
        flyTo: { lng, lat, zoom: 5.5 },
        setFleet: code,
        selectId: unitPoints[0].tx.id,
      },
    };
  }

  const merchantTerm = extractMerchant(q);
  if (merchantTerm && !extractRegion(q)?.includes(merchantTerm)) {
    const { hits, spend, topState } = summarizeMerchant(points, merchantTerm);
    if (!hits.length) {
      return { reply: `No transactions matching “${merchantTerm}” on the map.` };
    }
    const sample = hits[0];
    const isWhat = /\b(what is|what's|tell me about)\b/.test(q);
    const lines = isWhat
      ? [
          `${merchantTerm.toUpperCase()} appears ${hits.length.toLocaleString()} times (${fmtMoney(spend)} total).`,
          topState ? `Most common state: ${topState[0]} (${topState[1]} stops).` : "",
          `Example: ${sample.tx.city}, ${sample.tx.state} on ${sample.tx.txDate}.`,
        ]
      : [`Found ${hits.length.toLocaleString()} ${merchantTerm} stops — ${fmtMoney(spend)} total.`];
    return {
      reply: lines.filter(Boolean).join("\n"),
      action: {
        flyTo: { lng: sample.lng, lat: sample.lat, zoom: 6.5 },
        selectId: sample.tx.id,
        setSeverity: wantsFlagged ? "flagged" : undefined,
      },
    };
  }

  const regionToken = extractRegion(q);
  if (regionToken) {
    const region = resolveRegion(regionToken);
    if (!region) {
      return { reply: `Couldn't place “${regionToken}” on the map. Use a US state or province name/code.` };
    }
    const stats = summarizeRegion(points, region);
    let scoped = points.filter((p) => p.tx.state?.toUpperCase() === region.code);
    if (wantsFlagged) scoped = scoped.filter((p) => p.severity !== "clear" && p.severity !== "low");
    const sample = scoped[0] ?? points.find((p) => p.tx.state?.toUpperCase() === region.code);
    const isWhere = /\b(where|locate|go to|show|zoom|find)\b/.test(q);
    const intro = isWhere
      ? `${region.label} is in the ${region.code} region — ${stats.count.toLocaleString()} mapped transactions (${fmtMoney(stats.spend)}).`
      : `${region.label}: ${stats.count.toLocaleString()} transactions, ${fmtMoney(stats.spend)} spend, ${stats.flagged} flagged.`;
    const extra = stats.topMerchant
      ? `\nTop merchant: ${stats.topMerchant[0]} (${stats.topMerchant[1]} visits).`
      : "";
    return {
      reply: intro + extra + (wantsFlagged ? `\nShowing flagged-only in this view.` : ""),
      action: {
        flyTo: { lng: region.lng, lat: region.lat, zoom: wantsFlagged ? 6 : 5.5 },
        selectId: sample?.tx.id,
        setSeverity: wantsFlagged ? "flagged" : undefined,
      },
    };
  }

  const cityMatch = q.match(/\b(?:in|at|near)\s+([a-z][a-z\s.-]{2,30})\b/i);
  if (cityMatch) {
    const city = cityMatch[1].trim().toLowerCase();
    const hits = points.filter((p) => p.tx.city?.toLowerCase().includes(city));
    if (hits.length) {
      const sample = hits[0];
      return {
        reply: `${hits.length.toLocaleString()} stops in ${sample.tx.city}, ${sample.tx.state}.`,
        action: {
          flyTo: { lng: sample.lng, lat: sample.lat, zoom: 8 },
          selectId: sample.tx.id,
        },
      };
    }
  }

  return {
    reply: "Try “Where is Washington?”, “Show PILOT”, or “What is fleet 3001?” — I'll pan the map and pin a sample stop.",
  };
}
