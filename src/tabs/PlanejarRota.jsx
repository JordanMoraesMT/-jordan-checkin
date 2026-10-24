// TeamCheck — Rotas › PLANEJAR (v68)
// Escolhe quem visitar (cidade, bairro, status, RFV, recompra, dias sem visita), prioriza,
// e monta o roteiro na ORDEM MAIS CURTA (OSRM /trip — "caixeiro-viajante") a partir de casa
// ou de onde você está. Mostra mapa, km, tempo, horário previsto de chegada, abre no Google Maps
// (em trechos) ou Waze, e pode lançar as visitas como tarefas na Agenda.
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route, Navigation, Home, Crosshair, CalendarPlus, ArrowLeft, X, Check } from "lucide-react";
import { S, CC, CATS, CANAIS, USERS, HOMES, OSRM, DASH, hav, gps, sL, sS, todayLocal, fD, fixMojibake } from "../lib";
import { MultiSelect, Kpi, DateField } from "../components";
import { analisar } from "../analiseVisitas.js";
import { carregarBase, carregarPremissas } from "../analiseDados.js";
const VER_COR = { "Rentável visitar": "#2A9D8F", "Aguardar": "#C8964E", "Atender a distância": "#E28A5B", "Prospecção": "#8C9CAE" };

const TRIP = OSRM.replace("/route/", "/trip/");
const MAX_PARADAS = 30;
const RFV_ORD = ["Campeão", "Leal", "Em Crescimento", "Em Risco", "Inativo"];
const RFV_COR = { "Campeão": "#C8964E", "Leal": "#2A9D8F", "Em Crescimento": "#0AAEE8", "Em Risco": "#FFB020", "Inativo": "#FB4B3A" };
const SR_COR = { "Atrasado": "#FB4B3A", "Momento de Recompra": "#FFB020", "Em Dia": "#12C265" };
const DIAS_OPC = [["todos", "Todos"], ["30", "30d+"], ["60", "60d+"], ["90", "90d+"], ["nunca", "Nunca"]];
const GRANDE_CUIABA = ["Cuiabá", "Várzea Grande"];

// Bairro: agrupa ignorando maiúsculas, acentos e hífen ("CENTRO SUL" = "Centro-Sul")
const bk = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-/.]/g, " ").replace(/\s+/g, " ").trim();
const cidadeDe = o => o.addr?.city_name || o.addr?.city || "";
const diasDesde = iso => iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : null;
const fmtKm = km => km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
const fmtMin = m => { m = Math.round(m); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`; };
const hhmm = min => { min = Math.round(min); const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
const quando = d => d == null ? "nunca" : d === 0 ? "hoje" : d === 1 ? "ontem" : d < 60 ? `há ${d} dias` : d < 730 ? `há ${Math.round(d / 30)} meses` : `há ${Math.floor(d / 365)} anos`;
// Tema claro: cores vivas (amarelo, ciano) perdem contraste como TEXTO → escurece só no claro
const claro = () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light";
const tom = cor => { if (!claro() || !/^#[0-9a-f]{6}$/i.test(cor)) return cor; const n = parseInt(cor.slice(1), 16), f = .58; return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, "0")).join(""); };
const paraMin = t => { const [h, m] = String(t || "08:00").split(":").map(Number); return (h || 0) * 60 + (m || 0); };

// Prioridade: recompra vencendo, cliente em risco e tempo sem visita pesam mais.
function prioridade(r, dias) {
  let s = 0; const mot = [];
  if (r?.status === "Atrasado") { s += 40; mot.push(["Recompra atrasada", SR_COR.Atrasado]); }
  else if (r?.status === "Momento de Recompra") { s += 30; mot.push(["Momento de recompra", SR_COR["Momento de Recompra"]]); }
  if (r?.rfv === "Em Risco") s += 30; else if (r?.rfv === "Campeão") s += 20; else if (r?.rfv === "Leal") s += 15; else if (r?.rfv === "Em Crescimento") s += 10;
  if (dias == null) { s += 35; mot.push(["Nunca visitado", S.purple]); }
  else s += Math.min(dias, 120) / 120 * 40;
  return { s, mot };
}

// Reserva quando o roteador estiver fora: vizinho mais próximo em linha reta (×1,3 p/ estrada)
function ordemLocal(start, pts, voltar) {
  const rest = pts.slice(), ord = []; let cur = start;
  while (rest.length) { let bi = 0, bd = Infinity; rest.forEach((p, i) => { const d = hav(cur.lat, cur.lng, p.lat, p.lng); if (d < bd) { bd = d; bi = i; } }); cur = rest.splice(bi, 1)[0]; ord.push(cur); }
  const seq = [start, ...ord, ...(voltar ? [start] : [])];
  const legs = []; for (let i = 0; i < seq.length - 1; i++) { const km = hav(seq[i].lat, seq[i].lng, seq[i + 1].lat, seq[i + 1].lng) * 1.3; legs.push({ km, min: km / 35 * 60 }); }
  return { ordem: ord, legs, geo: seq.map(p => [p.lat, p.lng]), estimado: true };
}

async function otimizar(start, pts, voltar) {
  const coords = [start, ...pts].map(p => `${p.lng},${p.lat}`).join(";");
  const q = voltar ? "roundtrip=true&source=first" : "roundtrip=false&source=first&destination=any";
  try {
    const r = await fetch(`${TRIP}/${coords}?${q}&overview=full&geometries=geojson`);
    const j = await r.json();
    if (j.code !== "Ok" || !j.trips?.[0]) throw new Error(j.code || "trip");
    const t = j.trips[0];
    // waypoints[i] = posição do ponto de entrada i na viagem; i=0 é a partida
    const ordem = pts.map((p, i) => ({ p, w: j.waypoints[i + 1].waypoint_index })).sort((a, b) => a.w - b.w).map(x => x.p);
    return { ordem, legs: t.legs.map(l => ({ km: l.distance / 1000, min: l.duration / 60 })), geo: t.geometry.coordinates.map(([lng, lat]) => [lat, lng]), estimado: false };
  } catch { return ordemLocal(start, pts, voltar); }
}

function pinNum(n, cor) {
  return L.divIcon({ className: "tc-pin", iconSize: [30, 30], iconAnchor: [15, 15], html: `<div style="width:30px;height:30px;border-radius:50%;background:${cor};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font:800 13px Roboto,sans-serif">${n}</div>` });
}
const pinCasa = L.divIcon({ className: "tc-pin", iconSize: [34, 34], iconAnchor: [17, 17], html: `<div style="width:34px;height:34px;border-radius:50%;background:#0F1B2D;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:16px">🏠</div>` });

function MapaRoteiro({ partida, paradas, geo }) {
  const div = useRef(null), map = useRef(null);
  useEffect(() => {
    if (!div.current) return;
    const m = L.map(div.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const m = map.current; if (!m) return;
    const g = L.layerGroup().addTo(m);
    if (geo?.length) L.polyline(geo, { color: "#0578A6", weight: 5, opacity: .85 }).addTo(g);
    L.marker([partida.lat, partida.lng], { icon: pinCasa }).bindTooltip(partida.label || "Partida").addTo(g);
    paradas.forEach((p, i) => L.marker([p.lat, p.lng], { icon: pinNum(i + 1, RFV_COR[p.rfv?.rfv] || "#0578A6") }).bindTooltip(`${i + 1}. ${p.nome}`).addTo(g));
    const b = [[partida.lat, partida.lng], ...paradas.map(p => [p.lat, p.lng])];
    if (b.length) m.fitBounds(b, { padding: [28, 28], maxZoom: 15 });
    setTimeout(() => m.invalidateSize(), 80);
    return () => { g.remove(); };
  }, [partida, paradas, geo]);
  return <div ref={div} style={{ height: 340, borderRadius: 12, overflow: "hidden", border: `1px solid ${S.brd}`, zIndex: 0, position: "relative" }} />;
}

function Pill({ t, cor }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, color: tom(cor), background: cor + "1c", border: `1px solid ${cor}44`, whiteSpace: "nowrap" }}>{t}</span>;
}

function PlanejarRota({ orgs, plocs, visits, rfv, user, token, onOpenFicha, pendMapa }) {
  const PREF = `jc:rotaPlan:${user?.id || "x"}`;
  const p0 = useMemo(() => sL(PREF, {}), []); // eslint-disable-line
  const mob = typeof window !== "undefined" && window.innerWidth <= 768;

  const [owner, setOwner] = useState(p0.owner || (user?.name ? [user.name] : []));
  const [cid, setCid] = useState(p0.cid || []);
  const [bai, setBai] = useState(p0.bai || []);
  const [cat, setCat] = useState(p0.cat || []);
  const [fRfv, setFRfv] = useState(p0.fRfv || []);
  const [fSr, setFSr] = useState(p0.fSr || []);
  const [canal, setCanal] = useState(p0.canal || []);
  const [dias, setDias] = useState(p0.dias || "todos");
  const [ordem, setOrdem] = useState(p0.ordem || "prio");
  const [sel, setSel] = useState(() => new Set(p0.sel || []));
  const [partidaTipo, setPartidaTipo] = useState(p0.partidaTipo || "casa");
  const [voltar, setVoltar] = useState(p0.voltar !== false);
  const [saida, setSaida] = useState(p0.saida || "08:00");
  const [minVisita, setMinVisita] = useState(p0.minVisita || 30);
  const [dia, setDia] = useState(p0.dia && p0.dia >= todayLocal() ? p0.dia : todayLocal());
  const [aqui, setAqui] = useState(null);
  const [plano, setPlano] = useState(p0.plano || null);
  const [lo, setLo] = useState(false);
  const [msg, setMsg] = useState("");
  const [vc, setVc] = useState(60);
  const [ocultaDist, setOcultaDist] = useState(p0.ocultaDist !== false); // v79: esconde "atender a distância" por padrão
  // v79: veredito da Análise de visitas ("vale nova visita?") — mesma régua, mesmo cache
  const [base, setBase] = useState(null); const [prem, setPrem] = useState(null);
  useEffect(() => { let vivo = true; carregarPremissas().then(p => { if (!vivo) return; setPrem(p); if (token) carregarBase(token, p.inicio, todayLocal()).then(b => { if (vivo) setBase(b); }).catch(() => {}); }); return () => { vivo = false; }; }, [token]);

  useEffect(() => { sS(PREF, { owner, cid, bai, cat, fRfv, fSr, canal, dias, ordem, sel: [...sel], partidaTipo, voltar, saida, minVisita, dia, plano, ocultaDist }); },
    [owner, cid, bai, cat, fRfv, fSr, canal, dias, ordem, sel, partidaTipo, voltar, saida, minVisita, dia, plano, ocultaDist]); // eslint-disable-line

  const rfvDe = useCallback(o => { if (!rfv) return null; const k = (o.cnpj || "").replace(/\D/g, ""); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[o.id] || null; }, [rfv]);
  // Última visita da EQUIPE (qualquer usuário) — a mesma que aparece no cartão do PDV
  const ultVisita = useMemo(() => { const m = {}; (visits || []).forEach(v => { if (v.checkoutTime && (!m[v.orgId] || v.checkinTime > m[v.orgId])) m[v.orgId] = v.checkinTime; }); return m; }, [visits]);

  const casa = HOMES[user?.id] || null;
  const partida = partidaTipo === "aqui" && aqui ? { ...aqui, label: "Onde estou" } : casa ? { ...casa, label: casa.label || "Casa" } : aqui ? { ...aqui, label: "Onde estou" } : null;

  // Opções dos filtros
  const owners = useMemo(() => { const s = new Set(USERS.map(u => u.n)); orgs.forEach(o => o.owner && s.add(o.owner)); return [...s].sort(); }, [orgs]);
  const cidades = useMemo(() => { const m = {}; orgs.forEach(o => { const c = cidadeDe(o); if (c && (!owner.length || owner.includes(o.owner))) m[c] = (m[c] || 0) + 1; }); return Object.keys(m).sort((a, b) => a.localeCompare(b)).map(c => [c, `${c} (${m[c]})`]); }, [orgs, owner]);
  const bairros = useMemo(() => {
    if (!cid.length) return [];
    const g = {};
    orgs.forEach(o => { const c = cidadeDe(o); if (!cid.includes(c) || (owner.length && !owner.includes(o.owner))) return; const b = fixMojibake(o.addr?.district || ""); if (!b) return; const k = `${c}|${bk(b)}`; if (!g[k]) g[k] = { n: 0, nomes: {} }; g[k].n++; g[k].nomes[b] = (g[k].nomes[b] || 0) + 1; });
    const sigla = c => c === "Várzea Grande" ? "VG" : c === "Cuiabá" ? "CBA" : c;
    return Object.entries(g).map(([k, v]) => { const nome = Object.entries(v.nomes).sort((a, b) => b[1] - a[1])[0][0]; const c = k.split("|")[0]; return [k, `${nome}${cid.length > 1 ? " · " + sigla(c) : ""} (${v.n})`, nome]; })
      .sort((a, b) => a[2].localeCompare(b[2])).map(([k, l]) => [k, l]);
  }, [orgs, cid, owner]);
  useEffect(() => { if (bai.length) { const ok = new Set(bairros.map(b => b[0])); const n = bai.filter(b => ok.has(b)); if (n.length !== bai.length) setBai(n); } }, [bairros]); // eslint-disable-line

  // veredito: horas/limite do vendedor (1 responsável filtrado, senão o usuário logado); última visita da equipe conta
  const vereditos = useMemo(() => {
    if (!base || !prem) return null;
    const vend = owner.length === 1 ? owner[0] : user?.name; const U = USERS.find(u => u.n === vend);
    const nrm = s => String(s || "").toLowerCase().trim();
    const vis = base.visitas.filter(v => (U && String(v.user_id || "") === String(U.id)) || nrm(v.user_nome) === nrm(vend));
    const ue = {}; base.visitas.forEach(v => { const d = new Date(Date.parse(String(v.criado_em).replace(" ", "T") + "Z") - 4 * 3600000).toISOString().slice(0, 10); if (v.org_id && (!ue[v.org_id] || d > ue[v.org_id])) ue[v.org_id] = d; });
    let dv = ""; Object.values(rfv?.byCnpj || {}).forEach(r => { if (r.ultima && r.ultima > dv) dv = r.ultima; });
    const A = analisar({ visitas: vis, carteira: orgs, carteiraValor: orgs.filter(o => nrm(o.owner) === nrm(vend)), ultimaEquipe: ue, rfv, vendInd: base.vendInd, fat12Ind: base.fat12Ind, prem, hoje: todayLocal(), dataVendas: dv || null });
    const m = {}; A.linhas.forEach(l => { m[l.id] = { v: l.veredito, aPartir: l.aPartir }; }); return m;
  }, [base, prem, orgs, owner, user?.name, rfv]);

  // Lista filtrada e priorizada
  const lista = useMemo(() => {
    let l = orgs;
    if (owner.length) l = l.filter(o => owner.includes(o.owner));
    if (cid.length) l = l.filter(o => cid.includes(cidadeDe(o)));
    if (bai.length) l = l.filter(o => bai.includes(`${cidadeDe(o)}|${bk(fixMojibake(o.addr?.district || ""))}`));
    if (cat.length) l = l.filter(o => cat.includes(o.cat));
    if (canal.length) l = l.filter(o => canal.includes(o.canal || "Presencial"));
    const out = l.map(o => {
      const r = rfvDe(o); const uv = ultVisita[o.id]; const d = diasDesde(uv); const g = plocs?.[o.id];
      const { s, mot } = prioridade(r, d);
      const ver = vereditos?.[o.id] || null; let pr = s;
      if (ver?.v === "Rentável visitar") pr += 25; else if (ver?.v === "Aguardar") pr -= 15; else if (ver?.v === "Atender a distância") pr -= 40;
      const pend = pendMapa?.[o.id] || null; if (pend) pr += 10;
      return { id: o.id, o, nome: o.nickname || o.name, cidade: cidadeDe(o), bairro: fixMojibake(o.addr?.district || ""), rfv: r, dias: d, uv, lat: g?.lat, lng: g?.lng, geoEst: !!g?.geo, temGps: g?.lat != null && g?.lng != null, prio: pr, mot, ver, pend };
    }).filter(x => {
      if (ocultaDist && x.ver?.v === "Atender a distância") return false;
      if (fRfv.length && !fRfv.includes(x.rfv?.rfv)) return false;
      if (fSr.length && !fSr.includes(x.rfv?.status)) return false;
      if (dias === "nunca") return x.dias == null;
      if (dias !== "todos") return x.dias == null || x.dias >= Number(dias);
      return true;
    });
    if (ordem === "perto" && partida) out.forEach(x => { x.dist = x.temGps ? hav(partida.lat, partida.lng, x.lat, x.lng) : Infinity; });
    out.sort((a, b) => ordem === "az" ? a.nome.localeCompare(b.nome) : ordem === "perto" && partida ? a.dist - b.dist : b.prio - a.prio || a.nome.localeCompare(b.nome));
    return out;
  }, [orgs, owner, cid, bai, cat, canal, fRfv, fSr, dias, ordem, rfvDe, ultVisita, plocs, partida?.lat, partida?.lng, vereditos, ocultaDist, pendMapa]); // eslint-disable-line

  const comGps = lista.filter(x => x.temGps);
  const selLista = useMemo(() => { const m = new Map(lista.map(x => [x.id, x])); const out = []; sel.forEach(id => { const x = m.get(id) || (() => { const o = orgs.find(z => z.id === id); if (!o) return null; const g = plocs?.[id]; const r = rfvDe(o); return { id, o, nome: o.nickname || o.name, cidade: cidadeDe(o), bairro: fixMojibake(o.addr?.district || ""), rfv: r, dias: diasDesde(ultVisita[id]), lat: g?.lat, lng: g?.lng, temGps: g?.lat != null }; })(); if (x) out.push(x); }); return out; }, [sel, lista, orgs, plocs, rfvDe, ultVisita]);
  const selGps = selLista.filter(x => x.temGps);
  const selSemGps = selLista.length - selGps.length;

  const tog = id => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selTodos = () => setSel(s => { const n = new Set(s); comGps.slice(0, MAX_PARADAS).forEach(x => n.add(x.id)); return n; });
  const limparFiltros = () => { setCid([]); setBai([]); setCat([]); setFRfv([]); setFSr([]); setCanal([]); setDias("todos"); };

  const pegarAqui = async () => { setMsg("Obtendo sua localização…"); try { const g = await gps(); setAqui({ lat: g.lat, lng: g.lng }); setPartidaTipo("aqui"); setMsg(""); } catch { setMsg("Não consegui sua localização. Verifique a permissão de GPS."); } };

  const criar = async () => {
    if (!partida) { setMsg("Defina o ponto de partida (casa ou onde estou)."); return; }
    if (!selGps.length) { setMsg("Selecione ao menos um cliente com GPS."); return; }
    if (selGps.length > MAX_PARADAS) { setMsg(`Máximo de ${MAX_PARADAS} paradas por roteiro — você selecionou ${selGps.length}.`); return; }
    setLo(true); setMsg("");
    const pts = selGps.map(x => ({ id: x.id, lat: x.lat, lng: x.lng }));
    const r = await otimizar(partida, pts, voltar);
    // Ganho: compara a ordem em que você marcou com a ordem otimizada, as DUAS na mesma régua (linha reta)
    const linha = seq => { let k = 0, c = partida; seq.forEach(p => { k += hav(c.lat, c.lng, p.lat, p.lng); c = p; }); if (voltar) k += hav(c.lat, c.lng, partida.lat, partida.lng); return k; };
    const ganho = pts.length > 2 ? Math.round((1 - linha(r.ordem) / linha(pts)) * 100) : null;
    setPlano({ ids: r.ordem.map(p => p.id), legs: r.legs, geo: r.geo, estimado: r.estimado, partida, voltar, ganho, em: new Date().toISOString() });
    setLo(false);
  };

  // Plano montado → paradas com ETA
  const roteiro = useMemo(() => {
    if (!plano) return null;
    const m = new Map(orgs.map(o => [o.id, o]));
    let t = paraMin(saida); const mv = Number(minVisita) || 0;
    const paradas = plano.ids.map((id, i) => {
      const o = m.get(id); if (!o) return null; const g = plocs?.[id] || {}; const leg = plano.legs[i] || { km: 0, min: 0 };
      t += leg.min; const chega = t; t += mv;
      return { id, o, nome: o.nickname || o.name, cidade: cidadeDe(o), bairro: fixMojibake(o.addr?.district || ""), lat: g.lat, lng: g.lng, rfv: rfvDe(o), dias: diasDesde(ultVisita[id]), leg, chega, sai: t };
    }).filter(Boolean);
    const volta = plano.voltar ? plano.legs[plano.ids.length] : null;
    if (volta) t += volta.min;
    const km = plano.legs.reduce((s, l) => s + l.km, 0), dir = plano.legs.reduce((s, l) => s + l.min, 0);
    return { paradas, volta, km, dir, fim: t };
  }, [plano, orgs, plocs, saida, minVisita, rfvDe, ultVisita]);

  const tirar = async id => {
    const ids = plano.ids.filter(x => x !== id); setSel(s => { const n = new Set(s); n.delete(id); return n; });
    if (!ids.length) { setPlano(null); return; }
    const pts = ids.filter(i => plocs?.[i]?.lat != null).map(i => ({ id: i, lat: plocs[i].lat, lng: plocs[i].lng }));
    if (!pts.length) { setPlano(null); return; }
    setLo(true);
    const r = await otimizar(plano.partida, pts, plano.voltar);
    setPlano(p => ({ ...p, ids: r.ordem.map(x => x.id), legs: r.legs, geo: r.geo, estimado: r.estimado })); setLo(false);
  };

  // Google Maps aceita ~10 pontos por link (origem + 9). Trechos encadeados: cada um começa onde o anterior
  // terminou; o último leva a volta para casa — sem nunca gerar um trecho só de volta.
  const trechos = useMemo(() => {
    if (!roteiro) return [];
    const ll = p => `${p.lat},${p.lng}`, st = roteiro.paradas, out = [];
    let i = 0, origem = plano.partida;
    while (i < st.length) {
      const resto = st.length - i;
      let cap = 9; if (plano.voltar && resto <= 9) cap = resto === 9 ? 8 : resto; // reserva 1 ponto para a volta
      const bloco = st.slice(i, i + cap), ultimo = i + cap >= st.length;
      const pts = [origem, ...bloco, ...(ultimo && plano.voltar ? [plano.partida] : [])];
      out.push({ de: i + 1, ate: i + bloco.length, volta: ultimo && plano.voltar, url: `https://www.google.com/maps/dir/${pts.map(ll).join("/")}` });
      origem = bloco[bloco.length - 1]; i += cap;
    }
    return out;
  }, [roteiro, plano]);
  const rotTrecho = t => `${t.de === t.ate ? `parada ${t.de}` : `paradas ${t.de}–${t.ate}`}${t.volta ? " + volta" : ""}`;

  const agendar = async () => {
    if (!roteiro?.paradas.length || !token) return;
    if (!confirm(`Lançar ${roteiro.paradas.length} visita(s) na Agenda de ${fD(dia + "T12:00")}, no horário previsto de chegada de cada uma?`)) return;
    setLo(true); let ok = 0;
    for (const [i, p] of roteiro.paradas.entries()) {
      try {
        const r = await fetch(`${DASH}/api/crm/atividades`, { method: "POST", headers: { "X-Session": token, "Content-Type": "application/json" },
          body: JSON.stringify({ org_id: p.id, cnpj: (p.o.cnpj || "").replace(/\D/g, "") || null, org_nome: p.nome, tipo: "VISITA", texto: `Roteiro planejado — parada ${i + 1} de ${roteiro.paradas.length}`, origem: "tarefa", due_em: `${dia}T${hhmm(p.chega)}:00-04:00`, agendor_id: null, user_id: Number(user?.id) || null, user_nome: user?.name || null }) });
        if (r.ok) ok++;
      } catch {}
    }
    setLo(false); setMsg(ok === roteiro.paradas.length ? `✓ ${ok} visita(s) lançadas na Agenda.` : `Lancei ${ok} de ${roteiro.paradas.length}. Toque de novo para tentar o restante.`);
  };

  const card = { background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: mob ? "14px" : "16px 18px", marginBottom: 14 };
  const chip = on => ({ flexShrink: 0, padding: "6px 11px", fontSize: 12, borderRadius: 8, border: `1px solid ${on ? S.pri : S.inpBdr}`, background: on ? S.pri + "1c" : S.inp, color: on ? S.pl : S.ts, fontWeight: on ? 700 : 500, cursor: "pointer" });
  const grid = { display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fit,minmax(170px,1fr))", gap: 8 };

  // ───────── RESULTADO ─────────
  if (plano && roteiro) {
    const ganho = plano.ganho;
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setPlano(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12.5, borderRadius: 9, border: `1px solid ${S.inpBdr}`, background: S.inp, color: S.t2, cursor: "pointer" }}><ArrowLeft size={15} /> Editar seleção</button>
        <span style={{ fontSize: 12.5, color: S.ts }}>Partida: <b style={{ color: S.t2 }}>{plano.partida.label}</b>{plano.voltar ? " · volta ao fim" : " · termina na última parada"}</span>
      </div>
      {plano.estimado && <p style={{ fontSize: 12, color: tom(S.gold), background: S.gold + "14", border: `1px solid ${S.gold}44`, borderRadius: 10, padding: "8px 12px", margin: "0 0 12px" }}>⚠️ O roteador de mapas não respondeu. A ordem e os km são uma estimativa em linha reta — toque em "Recalcular" daqui a pouco.</p>}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
        <Kpi k="Paradas" v={roteiro.paradas.length} />
        <Kpi k="Distância" v={fmtKm(roteiro.km)} u="km" />
        <Kpi k="Dirigindo" v={fmtMin(roteiro.dir)} />
        <Kpi k={plano.voltar ? "Chegada em casa" : "Fim previsto"} v={hhmm(roteiro.fim)} />
      </div>
      {ganho != null && ganho > 0 && <p style={{ fontSize: 12.5, color: tom(S.acc), margin: "0 0 12px" }}>✓ Ordem otimizada: cerca de <b>{ganho}% menos rodagem</b> do que na ordem em que você marcou.</p>}
      <div style={card}>
        <MapaRoteiro partida={plano.partida} paradas={roteiro.paradas} geo={plano.geo} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {trechos.map((t, i) => <a key={i} href={t.url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", fontSize: 12.5, fontWeight: 700, borderRadius: 9, background: "#0578A6", color: "#fff", textDecoration: "none" }}><Navigation size={14} /> Google Maps{trechos.length > 1 ? ` · ${rotTrecho(t)}` : ""}</a>)}
          <button onClick={criar} disabled={lo} style={{ padding: "9px 13px", fontSize: 12.5, borderRadius: 9, border: `1px solid ${S.inpBdr}`, background: S.inp, color: S.t2, cursor: "pointer" }}>{lo ? "…" : "Recalcular"}</button>
        </div>
      </div>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: S.txt, flex: mob ? "1 1 100%" : 1 }}>Ordem das visitas</span>
          <label style={{ fontSize: 11.5, color: S.ts, display: "flex", alignItems: "center", gap: 6 }}>Saída <input type="time" value={saida} onChange={e => setSaida(e.target.value)} style={{ width: 118, fontSize: 12 }} /></label>
          <label style={{ fontSize: 11.5, color: S.ts, display: "flex", alignItems: "center", gap: 6 }}>Min/visita <input type="number" min={5} max={240} step={5} value={minVisita} onChange={e => setMinVisita(e.target.value)} style={{ width: 64, fontSize: 12 }} /></label>
        </div>
        <div style={{ fontSize: 12, color: S.pl, fontWeight: 600, padding: "4px 0 8px", borderBottom: `1px dashed ${S.brd}` }}>🏠 {plano.partida.label} · saída {saida}</div>
        {roteiro.paradas.map((p, i) => (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${S.cl}` }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: RFV_COR[p.rfv?.rfv] || "#0578A6", color: "#fff", fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p onClick={() => onOpenFicha && onOpenFicha(p.o)} style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: S.txt, cursor: onOpenFicha ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: S.ts }}>{[p.bairro, p.cidade].filter(Boolean).join(" · ")}</p>
            <p className="mono" style={{ margin: "3px 0 0", fontSize: 11, color: S.td }}>+{fmtKm(p.leg.km)} km · {fmtMin(p.leg.min)} · chega <b style={{ color: S.t2 }}>{hhmm(p.chega)}</b> · sai {hhmm(p.sai)}{p.dias == null ? " · nunca visitado" : ` · última visita ${quando(p.dias)}`}</p>
          </div>
          <a href={`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`} target="_blank" rel="noopener" title="Abrir no Waze" style={{ padding: "7px 9px", borderRadius: 8, border: `1px solid ${S.inpBdr}`, background: S.inp, color: S.pl, fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}>Waze</a>
          <button onClick={() => tirar(p.id)} disabled={lo} title="Tirar do roteiro" style={{ padding: 6, borderRadius: 8, border: `1px solid ${S.dng}44`, background: "transparent", cursor: "pointer", display: "flex" }}><X size={15} color={S.dng} /></button>
        </div>))}
        {roteiro.volta && <div style={{ fontSize: 12, color: S.pl, fontWeight: 600, padding: "10px 0 2px" }}>🏠 Volta · +{fmtKm(roteiro.volta.km)} km · {fmtMin(roteiro.volta.min)} · chega {hhmm(roteiro.fim)}</div>}
      </div>
      <div style={card}>
        <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: S.txt }}>Lançar na Agenda</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <DateField value={dia} onChange={d => setDia(d || todayLocal())} today={todayLocal()} placeholder="Dia" style={{ minWidth: 200 }} />
          <button onClick={agendar} disabled={lo || !token} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 15px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "none", background: S.acc, color: "#fff", cursor: "pointer" }}><CalendarPlus size={16} /> {lo ? "Lançando…" : `Agendar ${roteiro.paradas.length} visita(s)`}</button>
        </div>
        <p style={{ fontSize: 11, color: S.td, margin: "8px 0 0" }}>Cria uma tarefa de VISITA por cliente, no seu nome, no horário previsto de chegada. Elas aparecem na Agenda e no e-mail de tarefas.</p>
        {msg && <p style={{ fontSize: 12.5, color: msg.startsWith("✓") ? tom(S.acc) : tom(S.gold), margin: "8px 0 0" }}>{msg}</p>}
      </div>
    </div>);
  }

  // ───────── SELEÇÃO ─────────
  return (<div>
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: S.txt, flex: 1 }}>Quem visitar</span>
        <button onClick={() => { setCid(GRANDE_CUIABA); setBai([]); }} style={chip(cid.length === 2 && GRANDE_CUIABA.every(c => cid.includes(c)))}>Cuiabá + VG</button>
        <button onClick={limparFiltros} style={{ ...chip(false), color: S.dng, borderColor: S.dng + "55" }}>✕ Limpar</button>
      </div>
      <div style={grid}>
        <MultiSelect values={owner} onChange={setOwner} placeholder="Responsável" allLabel="Todos" options={owners} />
        <MultiSelect values={cid} onChange={v => { setCid(v); setVc(60); }} placeholder="Cidade" allLabel="Todas" options={cidades} />
        {cid.length > 0 && <MultiSelect values={bai} onChange={v => { setBai(v); setVc(60); }} placeholder="Bairro" allLabel="Todos" options={bairros} />}
        <MultiSelect values={cat} onChange={setCat} placeholder="Status" allLabel="Todos" colorFor={c => CC[c] || S.pri} options={CATS.filter(c => c !== "Excluido")} />
        <MultiSelect values={fRfv} onChange={setFRfv} placeholder="Classe RFV" allLabel="Todas" colorFor={c => RFV_COR[c]} options={RFV_ORD} />
        <MultiSelect values={fSr} onChange={setFSr} placeholder="Recompra" allLabel="Todas" colorFor={c => SR_COR[c]} options={["Atrasado", "Momento de Recompra", "Em Dia"]} />
        <MultiSelect values={canal} onChange={setCanal} placeholder="Canal" allLabel="Todos" options={CANAIS} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, color: S.ts, marginRight: 2 }}>Sem visita:</span>
        {DIAS_OPC.map(([v, l]) => <button key={v} onClick={() => setDias(v)} style={chip(dias === v)}>{l}</button>)}
        <button onClick={() => setOcultaDist(v => !v)} aria-pressed={ocultaDist} title="Clientes cujo retorno não cobre visita presencial" style={chip(ocultaDist)}>{ocultaDist ? "Ocultando \"atender a distância\"" : "Mostrar todos"}</button>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 10px", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, color: S.ts, flex: 1, minWidth: 180 }}><b style={{ color: S.t2 }}>{lista.length}</b> clientes · {comGps.length} com GPS{lista.length - comGps.length > 0 && <span style={{ color: tom(S.gold) }}> · {lista.length - comGps.length} sem GPS</span>}</span>
      <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }}>
        <option value="prio">Ordenar: prioridade</option>
        <option value="perto">Ordenar: mais perto da partida</option>
        <option value="az">Ordenar: A → Z</option>
      </select>
      <button onClick={selTodos} disabled={!comGps.length} style={chip(false)}>Selecionar todos{comGps.length > MAX_PARADAS ? ` (${MAX_PARADAS} primeiros)` : ` (${comGps.length})`}</button>
      {sel.size > 0 && <button onClick={() => setSel(new Set())} style={{ ...chip(false), color: S.dng }}>Limpar seleção</button>}
    </div>

    {!rfv && <p style={{ fontSize: 12, color: S.ts, margin: "0 2px 10px" }}>Carregando RFV… a prioridade fica mais precisa quando terminar.</p>}
    {lista.length === 0 && <p style={{ color: S.ts, textAlign: "center", padding: "2rem 0" }}>Nenhum cliente com esses filtros.</p>}

    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {lista.slice(0, vc).map(x => {
        const on = sel.has(x.id); const r = x.rfv;
        return (<div key={x.id} onClick={() => x.temGps && tog(x.id)} style={{ display: "flex", alignItems: "center", gap: 11, background: on ? S.pri + "12" : S.card, border: `1px solid ${on ? S.pri + "88" : S.brd}`, borderRadius: 12, padding: "10px 12px", cursor: x.temGps ? "pointer" : "default", opacity: x.temGps ? 1 : .62 }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${on ? S.pri : S.inpBdr}`, background: on ? S.pri : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={13} color="#fff" strokeWidth={3} />}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: S.txt }}>{x.nome}</span>
              {x.o.cat && <Pill t={x.o.cat} cor={CC[x.o.cat] || S.ts} />}
              {r?.rfv && <Pill t={r.rfv} cor={RFV_COR[r.rfv] || S.ts} />}
              {x.ver && <Pill t={x.ver.v === "Aguardar" && x.ver.aPartir ? `Aguardar · ${x.ver.aPartir.slice(8, 10)}/${x.ver.aPartir.slice(5, 7)}` : x.ver.v} cor={VER_COR[x.ver.v] || S.ts} />}
              {x.pend && <Pill t={x.pend.length === 1 ? `Pendência: ${x.pend[0]}` : `${x.pend.length} pendências`} cor="#C8964E" />}
              {x.mot.map(([t, c]) => <Pill key={t} t={t} cor={c} />)}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.ts }}>{[x.bairro, x.cidade].filter(Boolean).join(" · ")}{x.dist != null && isFinite(x.dist) ? ` · ${fmtKm(x.dist)} km` : ""}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: x.dias != null && x.dias >= 60 ? tom(S.gold) : S.ts }}>{[x.dias != null ? `Última visita ${quando(x.dias)}` : null, r?.ultima ? `compra em ${fD(r.ultima + "T12:00")}` : null, !x.temGps ? "sem GPS (faça um check-in para capturar)" : x.geoEst ? "GPS estimado" : null].filter(Boolean).join(" · ") || "Sem compra registrada"}</p>
          </div>
        </div>);
      })}
      {lista.length > vc && <button onClick={() => setVc(v => v + 60)} style={{ ...chip(false), alignSelf: "center", marginTop: 6 }}>Mostrar mais ({lista.length - vc})</button>}
    </div>

    {/* Barra presa ao fim da área de conteúdo (.jc-main); no celular fica acima do menu inferior e longe do botão "topo" */}
    {sel.size > 0 && <div style={{ position: "sticky", bottom: mob ? 72 : 0, zIndex: 30, marginTop: 14, padding: mob ? "10px 12px" : "12px 16px", background: "var(--card-solid)", border: `1px solid ${S.pri}55`, borderRadius: 14, boxShadow: "0 -6px 22px rgba(0,0,0,.22)", marginRight: mob ? 52 : 0 }}>
      {(() => {
        const partidaUI = <>
          {!mob && <span style={{ fontSize: 11.5, color: S.ts }}>Partida:</span>}
          {casa && <button onClick={() => setPartidaTipo("casa")} style={chip(partidaTipo === "casa")}><Home size={12} style={{ verticalAlign: -2 }} /> {casa.label || "Casa"}</button>}
          <button onClick={pegarAqui} style={chip(partidaTipo === "aqui" && !!aqui)}><Crosshair size={12} style={{ verticalAlign: -2 }} /> Onde estou</button>
        </>;
        const voltarUI = <label style={{ fontSize: 11.5, color: S.ts, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}><input type="checkbox" checked={voltar} onChange={e => setVoltar(e.target.checked)} /> Voltar ao fim</label>;
        const botao = <button onClick={criar} disabled={lo || !selGps.length} style={{ flex: mob ? 1 : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 18px", fontSize: 13.5, fontWeight: 800, borderRadius: 11, border: "none", background: selGps.length ? "#0578A6" : S.cl, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}><Route size={16} /> {lo ? "Calculando…" : `Criar roteiro (${selGps.length})`}</button>;
        return mob
          ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{partidaUI}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{voltarUI}{botao}</div>
            </div>
          : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", flex: 1, minWidth: 0 }}>{partidaUI}{voltarUI}</div>{botao}
            </div>;
      })()}
      {(msg || selSemGps > 0) && <p style={{ margin: "6px 0 0", fontSize: 11.5, color: tom(S.gold) }}>{msg || `${selSemGps} selecionado(s) sem GPS ficam fora do roteiro.`}</p>}
    </div>}
  </div>);
}

export { PlanejarRota };
