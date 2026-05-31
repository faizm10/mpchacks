"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  Map,
  MapControls,
  MapClusterLayer,
  MapRoute,
  MapArc,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
  type MapArcEvent,
} from "@/components/ui/map";
import { Card } from "./ui";
import {
  TRANSACTIONS,
  complianceResults,
  fleetName,
  fmtMoney,
} from "@/lib/analytics";
import {
  buildTransactionMapData,
  pointsToGeoJSON,
  severityColor,
  type MappedTransaction,
} from "@/lib/transactionMap";
import {
  answerMapQuery,
  MAP_CHAT_SUGGESTIONS,
  type MapChatAction,
  type MapChatMessage,
} from "@/lib/mapChat";

type FleetFilter = "all" | string;
type SeverityFilter = "all" | "flagged";

const NA_VIEW = { center: [-98, 45] as [number, number], zoom: 3.2 };

function sampleArcs<T extends { id: string; severity: string }>(
  arcs: T[],
  max: number,
): T[] {
  if (arcs.length <= max) return arcs;
  const flagged = arcs.filter((a) => a.severity !== "clear" && a.severity !== "low");
  const rest = arcs.filter((a) => a.severity === "clear" || a.severity === "low");
  const budget = Math.max(max - flagged.length, Math.floor(max * 0.4));
  const step = Math.max(1, Math.floor(rest.length / budget));
  const sampled = rest.filter((_, i) => i % step === 0).slice(0, budget);
  return [...flagged, ...sampled].slice(0, max);
}

function MapFlyTo({ target }: { target: MapChatAction["flyTo"] | null }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded || !target) return;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: target.zoom,
      duration: 1400,
      essential: true,
    });
  }, [map, isLoaded, target]);
  return null;
}

export default function FleetTransactionMap() {
  const mapData = useMemo(
    () => buildTransactionMapData(TRANSACTIONS, complianceResults()),
    [],
  );

  const [fleet, setFleet] = useState<FleetFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [showRoutes, setShowRoutes] = useState(true);
  const [showArcs, setShowArcs] = useState(false);
  const [selected, setSelected] = useState<MappedTransaction | null>(null);
  const [hoverArc, setHoverArc] = useState<{
    merchant: string;
    amount: number;
    severity: string;
  } | null>(null);
  const [flyTarget, setFlyTarget] = useState<MapChatAction["flyTo"] | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<MapChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask where a region is or what a merchant/fleet looks like on the map. I'll pan and pin a sample stop.",
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const fleetOptions = useMemo(
    () => mapData.routes.map((r) => ({ code: r.fleetCode, label: r.fleetLabel })),
    [mapData.routes],
  );

  const filteredPoints = useMemo(() => {
    let pts = mapData.points;
    if (fleet !== "all") pts = pts.filter((p) => p.tx.cardCode === fleet);
    if (severity === "flagged") {
      pts = pts.filter((p) => p.severity !== "clear" && p.severity !== "low");
    }
    return pts;
  }, [mapData.points, fleet, severity]);

  const geoJson = useMemo(() => pointsToGeoJSON(filteredPoints), [filteredPoints]);

  const activeRoute = useMemo(
    () => (fleet !== "all" ? mapData.routes.find((r) => r.fleetCode === fleet) : null),
    [mapData.routes, fleet],
  );

  const displayArcs = useMemo(() => {
    if (!showArcs || !activeRoute) return [];
    let arcs = activeRoute.arcs;
    if (severity === "flagged") {
      arcs = arcs.filter((a) => a.severity !== "clear" && a.severity !== "low");
    }
    return sampleArcs(arcs, 280);
  }, [showArcs, activeRoute, severity]);

  const onPointClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>, _coords: [number, number]) => {
      const id = feature.properties?.id as string | undefined;
      if (!id) return;
      const pt = filteredPoints.find((p) => p.tx.id === id) ?? null;
      setSelected(pt);
    },
    [filteredPoints],
  );

  const onArcHover = useCallback((e: MapArcEvent | null) => {
    if (!e) {
      setHoverArc(null);
      return;
    }
    const props = e.arc as {
      merchant?: string;
      amount?: number;
      severity?: string;
    };
    setHoverArc({
      merchant: props.merchant ?? "Transaction",
      amount: props.amount ?? 0,
      severity: props.severity ?? "clear",
    });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo(0, chatScrollRef.current.scrollHeight);
  }, [chatMessages]);

  const applyChatAction = useCallback(
    (action?: MapChatAction) => {
      if (!action) return;
      if (action.flyTo) setFlyTarget({ ...action.flyTo });
      if (action.setFleet) {
        setFleet(action.setFleet);
        setShowArcs(false);
      }
      if (action.setSeverity) setSeverity(action.setSeverity);
      if (action.selectId) {
        const pt =
          mapData.points.find((p) => p.tx.id === action.selectId) ??
          filteredPoints.find((p) => p.tx.id === action.selectId) ??
          null;
        setSelected(pt);
      }
    },
    [mapData.points, filteredPoints],
  );

  const sendChat = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      const { reply, action } = answerMapQuery(q, mapData.points, mapData.routes);
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: reply, action },
      ]);
      setChatInput("");
      applyChatAction(action);
    },
    [mapData.points, mapData.routes, applyChatAction],
  );

  const sub = `${filteredPoints.length.toLocaleString()} mapped · ${mapData.stats.fleetCount} fleet units · click clusters or ask the map`;

  return (
    <Card
      title="Transaction map"
      sub={sub}
      action={
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <select
            className="ux-select"
            value={fleet}
            onChange={(e) => {
              setFleet(e.target.value);
              setSelected(null);
              if (e.target.value === "all") setShowArcs(false);
            }}
            aria-label="Fleet unit"
          >
            <option value="all">All fleets</option>
            {fleetOptions.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="ux-select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as SeverityFilter)}
            aria-label="Severity filter"
          >
            <option value="all">All transactions</option>
            <option value="flagged">Flagged only</option>
          </select>
          <label className="ux-map-toggle">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              disabled={fleet === "all"}
            />
            Routes
          </label>
          <label className="ux-map-toggle">
            <input
              type="checkbox"
              checked={showArcs}
              onChange={(e) => setShowArcs(e.target.checked)}
              disabled={fleet === "all"}
            />
            Flow arcs
          </label>
        </div>
      }
    >
      <div className="ux-map-layout">
        <div className="ux-map-main">
          <div className="ux-map-wrap">
            <Map
              center={NA_VIEW.center}
              zoom={NA_VIEW.zoom}
              minZoom={2}
              maxZoom={12}
              maxBounds={[
                [-135, 22],
                [-50, 58],
              ]}
              className="ux-map-canvas"
            >
              <MapFlyTo target={flyTarget} />
              <MapControls showZoom showFullscreen position="top-right" />

          {showRoutes && activeRoute && activeRoute.coordinates.length > 1 && (
            <MapRoute
              id={`fleet-route-${activeRoute.fleetCode}`}
              coordinates={activeRoute.coordinates}
              color="var(--accent)"
              width={2.5}
              opacity={0.55}
              dashArray={[2, 2]}
            />
          )}

          {displayArcs.length > 0 && (
            <MapArc
              id={`fleet-arcs-${activeRoute?.fleetCode}`}
              data={displayArcs.map((a) => ({
                id: a.id,
                from: a.from,
                to: a.to,
                merchant: a.merchant,
                amount: a.amount,
                severity: a.severity,
              }))}
              curvature={0.15}
              paint={{
                "line-color": [
                  "match",
                  ["get", "severity"],
                  "critical",
                  "#dc2626",
                  "high",
                  "#ea580c",
                  "medium",
                  "#ca8a04",
                  "low",
                  "#2563eb",
                  "#94a3b8",
                ],
                "line-width": 1.5,
                "line-opacity": 0.45,
              }}
              hoverPaint={{
                "line-width": 3,
                "line-opacity": 0.95,
              }}
              onHover={onArcHover}
            />
          )}

          {activeRoute && (
            <MapMarker longitude={activeRoute.hq[0]} latitude={activeRoute.hq[1]}>
              <MarkerContent className="ux-map-hq-marker">HQ</MarkerContent>
              <MarkerPopup closeButton>
                <div className="ux-map-popup">
                  <strong>{activeRoute.fleetLabel}</strong>
                  <span>Fleet home base (centroid)</span>
                </div>
              </MarkerPopup>
            </MapMarker>
          )}

          <MapClusterLayer
            data={geoJson}
            markerStyle="pin"
            clusterRadius={42}
            clusterMaxZoom={10}
            clusterColors={["#2f5fd0", "#0ea5e9", "#ea580c"]}
            clusterThresholds={[50, 400]}
            pointColor="#2f5fd0"
            onPointClick={onPointClick}
          />
        </Map>

        {(selected || hoverArc) && (
          <div className="ux-map-sidebar">
            {hoverArc && !selected && (
              <div className="ux-map-sidebar__block">
                <div className="ux-map-sidebar__label">Route leg</div>
                <div className="ux-map-sidebar__title">{hoverArc.merchant}</div>
                <div className="ux-map-sidebar__meta">
                  {fmtMoney(hoverArc.amount)} ·{" "}
                  <span style={{ color: severityColor(hoverArc.severity as MappedTransaction["severity"]) }}>
                    {hoverArc.severity}
                  </span>
                </div>
              </div>
            )}
            {selected && (
              <div className="ux-map-sidebar__block">
                <div className="ux-map-sidebar__label">Transaction</div>
                <div className="ux-map-sidebar__title">{selected.tx.merchant}</div>
                <div className="ux-map-sidebar__meta">
                  {fmtMoney(selected.tx.amount)} · {selected.tx.txDate}
                </div>
                <div className="ux-map-sidebar__meta">
                  {fleetName(selected.tx.cardCode)} · {selected.tx.city}, {selected.tx.state}{" "}
                  {selected.tx.country}
                </div>
                <div
                  className="ux-map-sidebar__badge"
                  style={{ borderColor: severityColor(selected.severity) }}
                >
                  {selected.severity} · risk {selected.riskScore}
                </div>
                <button
                  type="button"
                  className="ux-btn ux-btn--sm"
                  style={{ marginTop: 8 }}
                  onClick={() => setSelected(null)}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {fleet === "all" && (
          <p className="ux-map-hint">
            Select a fleet unit to draw routes, or ask the map assistant on the right.
          </p>
        )}
          </div>
        </div>

        <aside className="ux-map-chat" aria-label="Map assistant">
          <div className="ux-map-chat__head">
            <span className="ux-map-chat__title">Map assistant</span>
            <span className="ux-map-chat__sub">Where / what on your spend</span>
          </div>
          <div ref={chatScrollRef} className="ux-map-chat__log">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`ux-map-chat__bubble ux-map-chat__bubble--${m.role}`}
              >
                {m.role === "assistant" && <span className="ux-map-chat__spark">✦</span>}
                {m.content}
              </div>
            ))}
          </div>
          <div className="ux-map-chat__chips">
            {MAP_CHAT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="ux-btn ux-btn--sm"
                onClick={() => sendChat(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="ux-map-chat__form"
            onSubmit={(e) => {
              e.preventDefault();
              sendChat(chatInput);
            }}
          >
            <div className="ux-input ux-map-chat__input">
              <span className="ux-input__ico">⌕</span>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Where is Washington? Show PILOT…"
                aria-label="Ask the map"
              />
            </div>
            <button type="submit" className="ux-btn ux-btn--primary" disabled={!chatInput.trim()}>
              Ask
            </button>
          </form>
        </aside>
      </div>
    </Card>
  );
}
