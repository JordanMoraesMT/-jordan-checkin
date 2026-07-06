// TeamCheck — aba MAPA: clientes no mapa (GPS real + estimativa por bairro/cidade), "onde estou",
// card do cliente com distância, Traçar rota (Google Maps) e Ficha. Padrão do mapa do Agendor.
import { useState, useEffect, useMemo, useRef } from "react";
import { Crosshair, X, Navigation, ContactRound } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { S, CC, CATS, hav, gps, geoEstimate } from "../lib";

// Jitter determinístico (por id) p/ separar pins estimados que caem no mesmo ponto (bairro/cidade)
function jit(id, amp = 0.004) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const a = ((h % 1000) / 1000 - 0.5) * amp;
  const b = (((h >> 10) % 1000) / 1000 - 0.5) * amp;
  return [a, b];
}
const fmtKm = (km) => km == null ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;

function MapaTab({ visible, orgs, plocs, onOpenFicha, user }) {
  const mapRef = useRef(null);       // instância Leaflet
  const divRef = useRef(null);       // container
  const layerRef = useRef(null);     // layerGroup dos pins
  const meRef = useRef(null);        // marcador da minha posição
  const [sel, setSel] = useState(null);       // cliente selecionado (card)
  const [me, setMe] = useState(null);         // {lat,lng}
  const [locLo, setLocLo] = useState(false);
  const [q, setQ] = useState("");
  const [stFilter, setStFilter] = useState([]); // multi status; vazio = todos
  const [soGps, setSoGps] = useState(false);
  const [nPins, setNPins] = useState(0);

  // Pontos: GPS real (exato) > estimativa por bairro/cidade (aprox)
  const pontos = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/[.\-\/]/g, "");
    const out = [];
    for (const o of (orgs || [])) {
      if (stFilter.length && !stFilter.includes(o.cat)) continue;
      if (s && ![o.name, o.nickname, o.cnpj, o.addr?.city_name, o.addr?.city, o.addr?.district].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(s)) continue;
      const g = plocs?.[o.id];
      if (g && g.lat != null) { out.push({ o, lat: g.lat, lng: g.lng, exato: true }); continue; }
      if (soGps) continue;
      const e = geoEstimate(o);
      if (e) { const [ja, jb] = jit(o.id); out.push({ o, lat: e[0] + ja, lng: e[1] + jb, exato: false }); }
    }
    return out;
  }, [orgs, plocs, q, stFilter, soGps]);

  // Init mapa (uma vez, quando visível)
  useEffect(() => {
    if (!visible || mapRef.current || !divRef.current) return;
    const m = L.map(divRef.current, { zoomControl: true, attributionControl: true }).setView([-15.60, -56.09], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    layerRef.current = L.layerGroup().addTo(m);
    mapRef.current = m;
  }, [visible]);
  // A aba fica display:none — ao voltar a ser visível o Leaflet precisa recalcular o tamanho
  useEffect(() => { if (visible && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 60); }, [visible]);

  // (Re)desenhar pins
  useEffect(() => {
    const m = mapRef.current, lg = layerRef.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const bounds = [];
    for (const p of pontos) {
      const cor = CC[p.o.cat] || "#78716C";
      const mk = L.circleMarker([p.lat, p.lng], {
        radius: p.exato ? 8 : 6, color: "#fff", weight: p.exato ? 2 : 1.2,
        fillColor: cor, fillOpacity: p.exato ? 0.95 : 0.55, dashArray: p.exato ? null : "2 3",
      });
      mk.on("click", () => setSel(p));
      mk.bindTooltip((p.o.nickname || p.o.name || "") + (p.exato ? "" : " (aprox.)"), { direction: "top", offset: [0, -6] });
      mk.addTo(lg);
      bounds.push([p.lat, p.lng]);
    }
    setNPins(pontos.length);
    if (bounds.length && !m._jaEnquadrou) { m.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 }); m._jaEnquadrou = true; }
  }, [pontos, visible]);

  const ondeEstou = async () => {
    setLocLo(true);
    try {
      const g = await gps();
      setMe(g);
      const m = mapRef.current;
      if (m) {
        if (meRef.current) meRef.current.remove();
        meRef.current = L.circleMarker([g.lat, g.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#0AAEE8", fillOpacity: 1 })
          .bindTooltip("Você está aqui", { direction: "top", offset: [0, -8] }).addTo(m);
        m.setView([g.lat, g.lng], 14);
      }
    } catch { alert("GPS indisponível. Ative a localização e tente de novo."); }
    setLocLo(false);
  };

  const dist = sel && me ? hav(me.lat, me.lng, sel.lat, sel.lng) : null;
  const toggleSt = (c) => setStFilter(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  return (<div style={{ display: visible ? "block" : "none" }}>
    {/* Barra de filtros */}
    <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "10px 12px", marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente, cidade, bairro..." style={{ flex: "1 1 180px", minWidth: 150, fontSize: 13 }} />
      <button onClick={ondeEstou} disabled={locLo} style={{ display: "flex", alignItems: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
        <Crosshair size={15} />{locLo ? "Localizando..." : "Onde estou"}
      </button>
      <div style={{ flexBasis: "100%", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {CATS.map(c => { const on = stFilter.includes(c); const cor = CC[c] || "#78716C"; return (
          <button key={c} onClick={() => toggleSt(c)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 14, fontSize: 11, fontWeight: on ? 700 : 500, border: on ? "none" : `1px solid ${S.brd}`, background: on ? cor : S.bg, color: on ? "#fff" : S.ts, cursor: "pointer" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? "#fff" : cor }} />{c}
          </button>); })}
        <button onClick={() => setSoGps(v => !v)} style={{ padding: "4px 9px", borderRadius: 14, fontSize: 11, fontWeight: soGps ? 700 : 500, border: soGps ? "none" : `1px solid ${S.brd}`, background: soGps ? S.acc : S.bg, color: soGps ? "#fff" : S.ts, cursor: "pointer" }}>📍 Só GPS exato</button>
        <span style={{ fontSize: 11, color: S.ts, marginLeft: "auto" }}>{nPins} no mapa · <b style={{ color: S.txt }}>{Object.keys(plocs || {}).length}</b> com GPS exato</span>
      </div>
    </div>

    {/* Mapa */}
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${S.brd}` }}>
      <div ref={divRef} style={{ height: "min(62vh, 560px)", minHeight: 340, background: "#111a28" }} />
      {/* Card do cliente selecionado — padrão Agendor */}
      {sel && <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, zIndex: 1000, background: "var(--card-solid)", border: `1px solid ${S.brd}`, borderRadius: 14, padding: "12px 14px", boxShadow: "0 8px 28px rgba(0,0,0,.45)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: S.txt }}>{sel.o.nickname || sel.o.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: CC[sel.o.cat] || "#78716C", padding: "2px 8px", borderRadius: 6 }}>{sel.o.cat || "—"}</span>
              {!sel.exato && <span style={{ fontSize: 10, color: S.gold, border: `1px solid ${S.gold}55`, padding: "1px 7px", borderRadius: 6 }}>local aproximado</span>}
            </div>
            <div style={{ fontSize: 12, color: S.ts, marginTop: 4 }}>
              {[sel.o.addr?.street, sel.o.addr?.number].filter(Boolean).join(", ")}{sel.o.addr?.district ? ` · ${sel.o.addr.district}` : ""} · {sel.o.addr?.city_name || sel.o.addr?.city || ""}
              {dist != null && <b style={{ color: S.pl }}> · a {fmtKm(dist)}</b>}
            </div>
          </div>
          <button onClick={() => setSel(null)} style={{ background: "transparent", border: "none", color: S.td, cursor: "pointer", padding: 2, flexShrink: 0 }}><X size={17} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`} target="_blank" rel="noopener" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: S.pri, color: "#fff", borderRadius: 9, padding: "10px 8px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <Navigation size={15} />Traçar rota
          </a>
          <button onClick={() => onOpenFicha && onOpenFicha(sel.o)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: S.acc, color: "#fff", border: "none", borderRadius: 9, padding: "10px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <ContactRound size={15} />Ficha
          </button>
        </div>
      </div>}
    </div>
    <p style={{ fontSize: 10.5, color: S.td, margin: "8px 2px 0" }}>Pin cheio = GPS exato (registrado no check-in) · pin claro tracejado = posição aproximada por bairro/cidade. O GPS exato é gravado automaticamente no primeiro check-in de cada cliente.</p>
  </div>);
}

export { MapaTab };
