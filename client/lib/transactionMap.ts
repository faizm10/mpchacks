import { geocodeLocation, inNorthAmerica, type GeoPoint } from "./geo";
import {
  analyzeTransactions,
  type ComplianceResult,
  type Transaction,
} from "./compliance";
import { fleetName } from "./analytics";

export type MappedTransaction = {
  tx: Transaction;
  lng: number;
  lat: number;
  severity: "clear" | "low" | "medium" | "high" | "critical";
  riskScore: number;
};

export type FleetRoute = {
  fleetCode: string;
  fleetLabel: string;
  hq: [number, number];
  coordinates: [number, number][];
  arcs: Array<{
    id: string;
    from: [number, number];
    to: [number, number];
    amount: number;
    merchant: string;
    severity: MappedTransaction["severity"];
  }>;
};

export type TransactionMapData = {
  points: MappedTransaction[];
  routes: FleetRoute[];
  stats: {
    total: number;
    mapped: number;
    skipped: number;
    fleetCount: number;
  };
};

function severityOf(result: ComplianceResult | undefined): MappedTransaction["severity"] {
  if (!result?.overallSeverity) return "clear";
  return result.overallSeverity;
}

function complianceById(results: ComplianceResult[]): Map<string, ComplianceResult> {
  return new Map(results.map((r) => [r.tx.id, r]));
}

function fleetHq(points: MappedTransaction[]): [number, number] {
  if (!points.length) return [-95, 40];
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  return [lng, lat];
}

export function buildTransactionMapData(
  transactions: Transaction[],
  compliance?: ComplianceResult[],
): TransactionMapData {
  const results = compliance ?? analyzeTransactions(transactions);
  const byId = complianceById(results);

  const points: MappedTransaction[] = [];
  let skipped = 0;

  for (const tx of transactions) {
    const geo = geocodeLocation(tx.city, tx.state, tx.country);
    if (!geo || !inNorthAmerica(geo.lng, geo.lat)) {
      skipped += 1;
      continue;
    }
    const result = byId.get(tx.id);
    points.push({
      tx,
      lng: geo.lng,
      lat: geo.lat,
      severity: severityOf(result),
      riskScore: result?.riskScore ?? 0,
    });
  }

  const byFleet = new Map<string, MappedTransaction[]>();
  for (const p of points) {
    const list = byFleet.get(p.tx.cardCode) ?? [];
    list.push(p);
    byFleet.set(p.tx.cardCode, list);
  }

  const routes: FleetRoute[] = [];

  for (const [fleetCode, fleetPoints] of byFleet) {
    const sorted = [...fleetPoints].sort((a, b) =>
      a.tx.txDate.localeCompare(b.tx.txDate),
    );
    const hq = fleetHq(sorted);
    const coordinates: [number, number][] = [hq, ...sorted.map((p) => [p.lng, p.lat] as [number, number])];

    const arcs: FleetRoute["arcs"] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const from: [number, number] = i === 0 ? hq : [sorted[i - 1].lng, sorted[i - 1].lat];
      const to: [number, number] = [p.lng, p.lat];
      arcs.push({
        id: `${fleetCode}-${p.tx.id}`,
        from,
        to,
        amount: p.tx.amount,
        merchant: p.tx.merchant,
        severity: p.severity,
      });
    }

    routes.push({
      fleetCode,
      fleetLabel: fleetName(fleetCode),
      hq,
      coordinates,
      arcs,
    });
  }

  routes.sort((a, b) => b.coordinates.length - a.coordinates.length);

  return {
    points,
    routes,
    stats: {
      total: transactions.length,
      mapped: points.length,
      skipped,
      fleetCount: routes.length,
    },
  };
}

export function severityColor(severity: MappedTransaction["severity"]): string {
  switch (severity) {
    case "critical":
      return "#dc2626";
    case "high":
      return "#ea580c";
    case "medium":
      return "#ca8a04";
    case "low":
      return "#2563eb";
    default:
      return "#2f5fd0";
  }
}

export function pointsToGeoJSON(
  points: MappedTransaction[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat] as [number, number],
      },
      properties: {
        id: p.tx.id,
        merchant: p.tx.merchant,
        amount: p.tx.amount,
        fleet: p.tx.cardCode,
        severity: p.severity,
        riskScore: p.riskScore,
        txDate: p.tx.txDate,
        state: p.tx.state,
        country: p.tx.country,
      },
    })),
  };
}
