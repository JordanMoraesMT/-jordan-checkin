// TeamCheck — aba MAPA (v41): clientes no mapa com TODOS os filtros de PDVs (mesmas funcionalidades),
// Responsável pré-selecionado com o usuário logado, e ranking dos principais clientes (matriz RFV)
// quando há filtros ativos. Card do cliente com distância, Traçar rota e Ficha (padrão Agendor).
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Crosshair, X, Navigation, ContactRound, Trophy, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
const RFV_CORES = { "Campeão": "#C8964E", "Leal": "#2A9D8F", "Em Crescimento": "#0AAEE8", "Em Risco": "#FFB020", "Inativo": "#FB4B3A" };

function MapaTab({ visible, orgs, plocs, onOpenFicha, user, rfv }) {
  const mapRef = useRef(null); const divRef = useRef(null); const layerRef = useRef(null); const meRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [me, setMe] = useState(null); const [locLo, setLocLo] = useState(false);
  const [nPins, setNPins] = useState(0);
  const [soGps, setSoGps] = useState(false);

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
  const filtrados = useMemo(() => { let list = orgs;
    if (catSel.length) list = list.filter(o => catSel.includes(o.cat));
    if (ufSel.length) list = list.filter(o => ufSel.includes(o.addr?.state));
    if (citySel.length) list = list.filter(o => citySel.includes(o.addr?.city_name || o.addr?.city));
    if (segSel.length) list = list.filter(o => segSel.includes(o.sector));
    if (ownerSel.length) list = list.filter(o => ownerSel.includes(o.owner));
    if (grupoSel.length) list = list.filter(o => grupoSel.includes((o.grupo || "").replace("Grupo: ", "")));
    if (fRfv.length || fSr.length || fInd.length) { list = list.filter(o => { const r = rfvDe(o); if (!r) return false; if (fRfv.length && !fRfv.includes(r.rfv)) return false; if (fSr.length && !fSr.includes(r.status)) return false; if (fInd.length && !(r.inds || "").split(",").some(i => fInd.includes(i.trim()))) return false; return true; }); }
    if (search.trim()) { const q = search.toLowerCase().replace(/[.\-\/]/g, ""); const casa = o => [o.name, o.nickname, o.legalName, o.cnpj?.replace(/[.\-\/]/g, ""), o.addr?.city, o.addr?.city_name, o.addr?.district, o.addr?.state, o.cat, o.sector, o.products, o.people].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(q); list = list.filter(casa); }
    return list;
  }, [orgs, search, catSel, ufSel, citySel, segSel, ownerSel, grupoSel, fRfv, fSr, fInd, rfvDe]);

  // Pontos no mapa: GPS real (exato) > estimativa por bairro/cidade (aprox)
  const pontos = useMemo(() => { const out = [];
    for (const o of filtrados) {
      const g = plocs?.[o.id];
      if (g && g.lat != null) { out.push({ o, lat: g.lat, lng: g.lng, exato: true }); continue; }
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
    const m = L.map(divRef.current, { zoomControl: true, attributionControl: true }).setView([-15.60, -56.09], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    layerRef.current = L.layerGroup().addTo(m);
    mapRef.current = m;
  }, [visible]);
  useEffect(() => { if (visible && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 60); }, [visible]);

  // (Re)desenhar pins
  useEffect(() => {
    const m = mapRef.current, lg = layerRef.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const bounds = [];
    for (const p of pontos) {
      const cor = CC[p.o.cat] || "#78716C";
      const mk = L.circleMarker([p.lat, p.lng], { radius: p.exato ? 8 : 6, color: "#fff", weight: p.exato ? 2 : 1.2, fillColor: cor, fillOpacity: p.exato ? 0.95 : 0.55, dashArray: p.exato ? null : "2 3" });
      mk.on("click", () => setSel(p));
      mk.bindTooltip((p.o.nickname || p.o.name || "") + (p.exato ? "" : " (aprox.)"), { direction: "top", offset: [0, -6] });
      mk.addTo(lg);
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

  return (<div style={{ display: visible ? "block" : "none" }}>
    {/* ── Card de filtros (mesmo padrão de PDVs) ── */}
    <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "14px 14px 12px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: S.inp, border: `1px solid ${S.inpBdr}`, borderRadius: 10, padding: "2px 12px", marginBottom: 11 }}>
        <Search size={16} strokeWidth={1.9} color="var(--t4)" style={{ flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome, razão social, CNPJ, cidade, segmento…" style={{ flex: 1, border: "none", background: "transparent", padding: "9px 0" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 11, alignItems: "center", flexWrap: "wrap" }}>
        <MultiSelect values={catSel} onChange={setCatSel} placeholder="Status" allLabel="Todos" style={{ flex: 1, minWidth: 200 }} colorFor={c => CC[c] || S.pri} options={CATS} />
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
        <span style={{ fontSize: 11.5, color: S.ts, marginLeft: "auto" }}>Exibindo <b style={{ color: S.txt }}>{nPins}</b> de {orgs.length} no mapa · <b style={{ color: S.txt }}>{Object.keys(plocs || {}).length}</b> com GPS exato</span>
      </div>
    </div>

    {/* ── Mapa ── */}
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1px solid ${S.brd}` }}>
      <div ref={divRef} style={{ height: "min(56vh, 520px)", minHeight: 320, background: "#111a28" }} />
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
