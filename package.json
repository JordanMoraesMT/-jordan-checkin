// TeamCheck — aba MAPA (v41): clientes no mapa com TODOS os filtros de PDVs (mesmas funcionalidades),
// Responsável pré-selecionado com o usuário logado, e ranking dos principais clientes (matriz RFV)
// quando há filtros ativos. Card do cliente com distância, Traçar rota e Ficha (padrão Agendor).
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Crosshair, X, Navigation, ContactRound, Trophy, Search, Maximize2, Minimize2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { S, CC, CATS, USERS, SECTORS, hav, gps, geoEstimate, fixMojibake } from "../lib";
import { MultiSelect } from "../components";

// Jitter determinístico (por id) p/ separar pins estimados que caem no mesmo ponto (bairro/cidade)
function jit(id, amp = 0.004) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const a = ((h % 1000) / 1000 - 0.5) * amp;
  const b = (((h >> 10) % 1000) / 1000 - 0.5) * amp;
  return [a, b];
}
const fmtKm = (km) => km == null ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
const ORD = { "Campeão": 5, "Leal": 4, "Em Crescimento": 3, "Em Risco": 2, "Inativo": 1 };
// Pin no formato clássico de ponto de localização (gota), maior, na cor do status
function pinIcon(cor, exato) {
  const op = exato ? 1 : 0.62;
  const svg = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 1C8.2 1 1 8.1 1 16.8 1 28.4 17 43 17 43S33 28.4 33 16.8C33 8.1 25.8 1 17 1Z"
      fill="${cor}" fill-opacity="${op}" stroke="#fff" stroke-width="2.4"${exato ? "" : ` stroke-dasharray="4 3"`}/>
    <circle cx="17" cy="16.5" r="6.2" fill="#fff" fill-opacity="${exato ? 1 : 0.85}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "tc-pin", iconSize: [34, 44], iconAnchor: [17, 43], tooltipAnchor: [0, -40] });
}
// Bolha do agrupamento com a CONTAGEM TOTAL do filtro (padrão Agendor)
function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const d = n >= 100 ? 52 : n >= 10 ? 46 : 40;
  return L.divIcon({
    html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:#0578A6;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${n >= 100 ? 14 : 13.5}px;font-family:Roboto,sans-serif">${n}</div>`,
    className: "tc-cluster", iconSize: [d, d], iconAnchor: [d / 2, d / 2],
  });
}
const RFV_CORES = { "Campeão": "#C8964E", "Leal": "#2A9D8F", "Em Crescimento": "#0AAEE8", "Em Risco": "#FFB020", "Inativo": "#FB4B3A" };

function MapaTab({ visible, orgs, plocs, onOpenFicha, user, rfv, excl }) {
  const mob = typeof window !== "undefined" && window.innerWidth <= 768;
  const mapRef = useRef(null); const divRef = useRef(null); const layerRef = useRef(null); const meRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [me, setMe] = useState(null); const [locLo, setLocLo] = useState(false);
  const [nPins, setNPins] = useState(0);
  const [soGps, setSoGps] = useState(false);
  const [fs, setFs] = useState(false);            // v46: tela cheia
  const [comExcluidos, setComExcluidos] = useState(false); // v46: mostrar excluídos

  // ── Filtros: os MESMOS de PDVs. Responsável já vem pré-selecionado com o usuário logado. ──
  const [search, setSearch] = useState("");
  const [catSel, setCatSel] = useState([]); const [ufSel, setUfSel] = useState([]); const [citySel, setCitySel] = useState([]);
  const [segSel, setSegSel] = useState([]); const [grupoSel, setGrupoSel] = useState([]);
  const [ownerSel, setOwnerSel] = useState(() => user?.name ? [user.name] : []); // pré-seleção pelo usuário
  const [fRfv, setFRfv] = useState([]); const [fSr, setFSr] = useState([]); const [fInd, setFInd] = useState([]);

  const rfvDe = useCallback(o => { if (!rfv) return null; const k = (o.cnpj || "").replace(/\D/g, ""); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[o.id] || null; }, [rfv]);
  const cities = useMemo(() => { const s = new Set(); orgs.forEach(o => { const c = o.addr?.city_name || o.addr?.city; if (c) s.add(c); }); return [...s].sort(); }, [orgs]);
  const states = useMemo(() => { const s = new Set(); orgs.forEach(o => { if (o.addr?.state) s.add(o.addr.state); }); return [...s].sort(); }, [orgs]);
  const segments = useMemo(() => { const s = new Set(SECTORS.map(x => x.n)); orgs.forEach(o => { if (o.sector) s.add(o.sector); }); return [...s].sort(); }, [orgs]);
  const owners = useMemo(() => { const s = new Set(USERS.map(u => u.n)); orgs.forEach(o => { if (o.owner) s.add(o.owner); }); return [...s].sort(); }, [orgs]);
  const grupos = useMemo(() => { const s = new Set(); orgs.forEach(o => { const g = fixMojibake((o.grupo || "").replace("Grupo: ", "").trim()); if (g) s.add(g); }); return [...s].sort(); }, [orgs]);
  const cityOpts = useMemo(() => ufSel.length ? cities.filter(c => orgs.some(o => (o.addr?.city_name || o.addr?.city) === c && ufSel.includes(o.addr?.state))) : cities, [cities, ufSel, orgs]);

  const temFiltro = !!(catSel.length || ufSel.length || citySel.length || segSel.length || ownerSel.length || grupoSel.length || fRfv.length || fSr.length || fInd.length || search.trim());
  const limparTudo = () => { setCatSel([]); setUfSel([]); setCitySel([]); setSegSel([]); setOwnerSel([]); setGrupoSel([]); setFRfv([]); setFSr([]); setFInd([]); setSearch(""); setSoGps(false); };

  // Lista filtrada (mesma lógica de PDVs)
  const baseOrgs = useMemo(() => comExcluidos ? [...orgs, ...(excl || []).map(o => ({ ...o, _exc: true }))] : orgs, [orgs, excl, comExcluidos]);
  const filtrados = useMemo(() => { let list = baseOrgs;
    if (catSel.length) list = list.filter(o => catSel.includes(o.cat));
    if (ufSel.length) list = list.filter(o => ufSel.includes(o.addr?.state));
    if (citySel.length) list = list.filter(o => citySel.includes(o.addr?.city_name || o.addr?.city));
    if (segSel.length) list = list.filter(o => segSel.includes(o.sector));
    if (ownerSel.length) list = list.filter(o => ownerSel.includes(o.owner));
    if (grupoSel.length) list = list.filter(o => grupoSel.includes((o.grupo || "").replace("Grupo: ", "")));
    if (fRfv.length || fSr.length || fInd.length) { list = list.filter(o => { const r = rfvDe(o); if (!r) return false; if (fRfv.length && !fRfv.includes(r.rfv)) return false; if (fSr.length && !fSr.includes(r.status)) return false; if (fInd.length && !(r.inds || "").split(",").some(i => fInd.includes(i.trim()))) return false; return true; }); }
    if (search.trim()) { const q = search.toLowerCase().replace(/[.\-\/]/g, ""); const casa = o => [o.name, o.nickname, o.legalName, o.cnpj?.replace(/[.\-\/]/g, ""), o.addr?.city, o.addr?.city_name, o.addr?.district, o.addr?.state, o.cat, o.sector, o.products, o.people].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(q); list = list.filter(casa); }
    return list;
  }, [baseOrgs, search, catSel, ufSel, citySel, segSel, ownerSel, grupoSel, fRfv, fSr, fInd, rfvDe]);

  // Pontos no mapa: GPS real (exato) > estimativa por bairro/cidade (aprox)
  const pontos = useMemo(() => { const out = [];
    for (const o of filtrados) {
      const g = plocs?.[o.id];
      if (g && g.lat != null) { out.push({ o, lat: g.lat, lng: g.lng, exato: true, geo: !!g.geo }); continue; }
      if (soGps) continue;
      const e = geoEstimate(o);
      if (e) { const [ja, jb] = jit(o.id); out.push({ o, lat: e[0] + ja, lng: e[1] + jb, exato: false }); }
    }
    return out;
  }, [filtrados, plocs, soGps]);
  const pontoPorId = useMemo(() => { const m = {}; pontos.forEach(p => { m[p.o.id] = p; }); return m; }, [pontos]);

  // Ranking RFV dos filtrados (Campeão → Inativo, depois score e faturamento) — aparece quando há filtro
  const ranking = useMemo(() => {
    if (!temFiltro || !rfv) return [];
    return filtrados.map(o => ({ o, r: rfvDe(o) })).filter(x => x.r)
      .sort((a, b) => (ORD[b.r.rfv] || 0) - (ORD[a.r.rfv] || 0) || (b.r.score || 0) - (a.r.score || 0) || (b.r.total || 0) - (a.r.total || 0))
      .slice(0, 10);
  }, [temFiltro, filtrados, rfvDe, rfv]);

  // Init mapa
  useEffect(() => {
    if (!visible || mapRef.current || !divRef.current) return;
    const m = L.map(divRef.current, { zoomControl: true, attributionControl: true, doubleClickZoom: false }).setView([-15.60, -56.09], 11);
    m.on("dblclick", () => setFs(v => !v)); // v46: duplo clique alterna tela cheia
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    // v48: localização atual do aparelho aparece automaticamente (sem precisar tocar em "Onde estou")
    gps().then(g => { setMe(g); if (meRef.current) meRef.current.remove(); meRef.current = L.circleMarker([g.lat, g.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#0AAEE8", fillOpacity: 1 }).bindTooltip("Você está aqui", { direction: "top", offset: [0, -8] }).addTo(m); }).catch(() => {});
    layerRef.current = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 52, spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon,
    }).addTo(m);
    mapRef.current = m;
  }, [visible]);
  useEffect(() => { if (visible && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 60); }, [visible, fs]);
  useEffect(() => { if (!fs) return; const h = (e) => { if (e.key === "Escape") setFs(false); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [fs]);

  // (Re)desenhar pins
  useEffect(() => {
    const m = mapRef.current, lg = layerRef.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const bounds = [];
    for (const p of pontos) {
      const cor = p.o._exc ? "#57534E" : (CC[p.o.cat] || "#78716C");
      const mk = L.marker([p.lat, p.lng], { icon: pinIcon(cor, p.exato) });
      mk.on("click", () => setSel(p));
      mk.bindTooltip((p.o.nickname || p.o.name || "") + (p.o._exc ? " (excluído)" : "") + (p.exato ? "" : " (aprox.)"), { direction: "top" });
      lg.addLayer(mk);
      bounds.push([p.lat, p.lng]);
    }
    setNPins(pontos.length);
    if (bounds.length && !m._jaEnquadrou) { m.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 }); m._jaEnquadrou = true; }
  }, [pontos, visible]);

  const focar = (o) => { const p = pontoPorId[o.id]; if (!p) return; setSel(p); mapRef.current?.setView([p.lat, p.lng], 14); };
  const ondeEstou = async () => {
    setLocLo(true);
    try { const g = await gps(); setMe(g);
      const m = mapRef.current;
      if (m) { if (meRef.current) meRef.current.remove();
        meRef.current = L.circleMarker([g.lat, g.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#0AAEE8", fillOpacity: 1 }).bindTooltip("Você está aqui", { direction: "top", offset: [0, -8] }).addTo(m);
        m.setView([g.lat, g.lng], 14); }
    } catch { alert("GPS indisponível. Ative a localização e tente de novo."); }
    setLocLo(false);
  };

  const dist = sel && me ? hav(me.lat, me.lng, sel.lat, sel.lng) : null;

  return (<div style={{ display: visible ? "block" : "none", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
    {/* ── Card de filtros (mesmo padrão de PDVs) ── */}
    <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "14px 14px 12px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: S.inp, border: `1px solid ${S.inpBdr}`, borderRadius: 10, padding: "2px 12px", marginBottom: 11 }}>
        <Search size={16} strokeWidth={1.9} color="var(--t4)" style={{ flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, razão social, CNPJ, cidade, segmento…" style={{ flex: 1, border: "none", background: "transparent", padding: "9px 0" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 11, alignItems: "center", flexWrap: "wrap" }}>
        <MultiSelect values={catSel} onChange={setCatSel} placeholder="Status" allLabel="Todos" style={{ flex: 1, minWidth: mob ? 130 : 200 }} colorFor={c => CC[c] || S.pri} options={CATS} />
        <button onClick={ondeEstou} disabled={locLo} style={{ display: "flex", alignItems: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "9px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}><Crosshair size={15} />{locLo ? "Localizando..." : "Onde estou"}</button>
        <button onClick={limparTudo} style={{ padding: "8px 13px", fontSize: 12, border: `1px solid ${S.dng}44`, color: S.dng, borderRadius: 10, background: "transparent", whiteSpace: "nowrap", cursor: "pointer" }}>✕ Limpar</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginBottom: 11 }}>
        <MultiSelect values={ufSel} onChange={v => { setUfSel(v); setCitySel([]); }} placeholder="UF" allLabel="Todas" options={states} />
        <MultiSelect values={citySel} onChange={setCitySel} placeholder="Cidade" allLabel="Todas" options={cityOpts} />
        <MultiSelect values={segSel} onChange={setSegSel} placeholder="Segmento" allLabel="Todos" options={segments} />
        <MultiSelect values={ownerSel} onChange={setOwnerSel} placeholder="Responsável" allLabel="Todos" options={owners} />
        <MultiSelect values={grupoSel} onChange={setGrupoSel} placeholder="Grupo" allLabel="Todos" options={grupos} />
        <MultiSelect values={fRfv} onChange={setFRfv} placeholder="Classe RFV" allLabel="Todas" options={["Campeão", "Leal", "Em Crescimento", "Em Risco", "Inativo"]} />
        <MultiSelect values={fSr} onChange={setFSr} placeholder="Recompra" allLabel="Todos" options={["Em Dia", "Momento de Recompra", "Atrasado"]} />
        <MultiSelect values={fInd} onChange={setFInd} placeholder="Indústria" allLabel="Todas" options={["TRAMONTINA", "PADO", "Zagonel", "Ruvolo", "Santana", "Festcolor", "Plastilit", "Hiper Têxtil"]} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setSoGps(v => !v)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: soGps ? 600 : 400, border: `1px solid ${soGps ? S.acc : S.inpBdr}`, background: soGps ? S.acc + "18" : S.inp, color: soGps ? S.acc : S.ts, cursor: "pointer" }}>📍 Só GPS exato</button>
        <button onClick={() => setComExcluidos(v => !v)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: comExcluidos ? 600 : 400, border: `1px solid ${comExcluidos ? S.dng : S.inpBdr}`, background: comExcluidos ? S.dng + "18" : S.inp, color: comExcluidos ? S.dng : S.ts, cursor: "pointer" }}>🗑 Mostrar excluídos{comExcluidos && excl ? ` (${(excl || []).length})` : ""}</button>
        <span style={{ fontSize: 11.5, color: S.ts, marginLeft: mob ? 0 : "auto", flexBasis: mob ? "100%" : "auto" }}>Exibindo <b style={{ color: S.txt }}>{nPins}</b> de {orgs.length} no mapa · <b style={{ color: S.txt }}>{Object.keys(plocs || {}).length}</b> com GPS exato</span>
      </div>
    </div>

    {/* ── Mapa (⛶ tela cheia: botão ou duplo clique) ── */}
    <div style={fs ? { position: "fixed", inset: 0, zIndex: 80, background: "var(--bg)" } : { position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${S.brd}` }}>
      <div ref={divRef} style={{ height: fs ? "100vh" : "min(56vh, 520px)", minHeight: fs ? undefined : 320, background: "#111a28" }} />
      <button onClick={() => setFs(v => !v)} title={fs ? "Sair da tela cheia (Esc)" : "Tela cheia (ou duplo clique no mapa)"} style={{ position: "absolute", right: 12, bottom: fs ? 18 : 12, zIndex: 1001, width: 42, height: 42, borderRadius: 12, background: "var(--card-solid)", border: `1px solid ${S.brd}`, color: S.txt, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 12px rgba(0,0,0,.35)" }}>{fs ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button>
      {sel && <div style={
        /* SEMPRE dentro do contêiner do mapa (absolute): imune ao zoom do body no iPhone
           (position:fixed + zoom posiciona errado no Safari e o card caía atrás da barra de navegação) */
        { position: "absolute", left: 10, right: 10, bottom: fs ? "calc(env(safe-area-inset-bottom, 0px) + 16px)" : 10, zIndex: 1000, maxHeight: fs ? "42vh" : "min(46%, 300px)", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--card-solid)", border: `1px solid ${S.brd}`, borderRadius: 14, padding: "12px 14px", boxShadow: "0 8px 28px rgba(0,0,0,.5)" }
      }>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: S.txt }}>{sel.o.nickname || sel.o.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: CC[sel.o.cat] || "#78716C", padding: "2px 8px", borderRadius: 6 }}>{sel.o.cat || "—"}</span>
              {sel.o._exc && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#57534E", padding: "2px 8px", borderRadius: 6 }}>EXCLUÍDO</span>}{!sel.exato && <span style={{ fontSize: 10, color: S.gold, border: `1px solid ${S.gold}55`, padding: "1px 7px", borderRadius: 6 }}>local aproximado</span>}{sel.exato && sel.geo && <span style={{ fontSize: 10, color: S.pl, border: `1px solid ${S.pl}55`, padding: "1px 7px", borderRadius: 6 }} title="Localizado pelo endereço do cadastro — o primeiro check-in no local ajusta automaticamente">📍 por endereço</span>}
            </div>
            <div style={{ fontSize: 12, color: S.ts, marginTop: 4 }}>
              {[sel.o.addr?.street, sel.o.addr?.number].filter(Boolean).join(", ")}{sel.o.addr?.district ? ` · ${sel.o.addr.district}` : ""} · {sel.o.addr?.city_name || sel.o.addr?.city || ""}
              {dist != null && <b style={{ color: S.pl }}> · a {fmtKm(dist)}</b>}
            </div>
          </div>
          <button onClick={() => setSel(null)} style={{ background: "transparent", border: "none", color: S.td, cursor: "pointer", padding: 2, flexShrink: 0 }}><X size={17} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`} target="_blank" rel="noopener" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: S.pri, color: "#fff", borderRadius: 9, padding: "10px 8px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}><Navigation size={15} />Traçar rota</a>
          <button onClick={() => onOpenFicha && onOpenFicha(sel.o)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: S.acc, color: "#fff", border: "none", borderRadius: 9, padding: "10px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><ContactRound size={15} />Ficha</button>
        </div>
      </div>}
    </div>

    {/* ── Principais clientes do filtro (matriz RFV) ── */}
    {ranking.length > 0 && <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "12px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Trophy size={15} color={S.gold} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: S.txt }}>Principais clientes do filtro</span>
        <span style={{ fontSize: 11, color: S.ts }}>· matriz RFV (Campeão → Inativo)</span>
      </div>
      {ranking.map(({ o, r }, i) => <div key={o.id} onClick={() => focar(o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderTop: i ? `1px solid ${S.cl}` : "none", cursor: pontoPorId[o.id] ? "pointer" : "default" }}>
        <span style={{ width: 22, textAlign: "center", fontSize: 12, fontWeight: 800, color: i < 3 ? S.gold : S.td }}>{i + 1}º</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: S.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nickname || o.name}</div>
          <div style={{ fontSize: 10.5, color: S.ts }}>{o.addr?.city_name || o.addr?.city || ""}{o.owner ? ` · ${o.owner.split(" ")[0]}` : ""}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: RFV_CORES[r.rfv] || S.td, padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>{r.rfv}</span>
        {pontoPorId[o.id] && <span style={{ fontSize: 10.5, color: S.pl, flexShrink: 0 }}>ver no mapa ›</span>}
      </div>)}
    </div>}
    <p style={{ fontSize: 10.5, color: S.td, margin: "8px 2px 0" }}>Pin cheio = GPS exato (registrado no check-in) · pin claro tracejado = posição aproximada por bairro/cidade. Filtros iguais aos de PDVs — o Responsável já abre selecionado no seu usuário.</p>
  </div>);
}

export { MapaTab };
