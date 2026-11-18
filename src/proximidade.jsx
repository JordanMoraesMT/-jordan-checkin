// v121 — "Check-in sugerido" por proximidade (e check-out sugerido).
// Nunca faz check-in/out sozinho: só mostra um cartão; quem confirma é o vendedor (o botão chama o checkin(org)
// / setCoTarget(org) que já existem no App).
//
// Regras:
//  · só com o app aberto e VISÍVEL (watchPosition liga/desliga no visibilitychange);
//  · só seg–sáb, 7h–19h de Cuiabá (UTC−4); reavalia a cada minuto;
//  · posições ficam SÓ na memória (nada de trajeto gravado — LGPD: mínimo necessário);
//  · leitura com precisão pior que 100 m é ignorada; avalia no máximo a cada 20 s;
//  · raio 150 m (GPS real) / 300 m (só endereço geocodificado, plocs.geo); sem plocs → fora;
//  · chegada confirmada = 2 leituras seguidas dentro do raio com ≥ 40 s entre a primeira e a atual;
//  · não sugere com visita aberta, cliente já visitado hoje, cliente Excluido, ou dispensado nas últimas 2 h
//    (sessionStorage);
//  · vários no raio → os 3 mais próximos;
//  · bateria < 15% → enableHighAccuracy: false;
//  · check-out sugerido: visita aberta e 2 leituras seguidas a mais de 400 m do cliente, com ≥ 3 min entre elas.
import { useEffect, useMemo, useRef, useState } from "react";
import { S, hav, sS, toLocalDate, todayLocal } from "./lib";

const RAIO_REAL = 150, RAIO_GEO = 300, ACC_MAX = 100, INTERVALO = 20000, CONFIRMA_IN = 40000;
const SAIDA_M = 400, CONFIRMA_OUT = 180000, DISPENSA_MS = 2 * 3600000, MAX_SUG = 3;
const K_DISP = "jc:sug-dispensa";

export const chaveSugCheckin = user => "jc:sugCheckin:" + (user?.id ?? "x");
// lê direto do localStorage: o sL() troca `false` pelo padrão (usa ||), e aqui false é um valor válido
export const sugCheckinLigado = user => { try { return localStorage.getItem(chaveSugCheckin(user)) !== "false"; } catch { return true; } };

// seg–sáb, 7h–19h em Cuiabá (UTC−4, sem horário de verão)
export function noHorarioDeTrabalho(agora = Date.now()) {
  const c = new Date(agora - 4 * 3600000);
  const dia = c.getUTCDay(), h = c.getUTCHours();
  return dia >= 1 && dia <= 6 && h >= 7 && h < 19;
}

function lerDispensas() { try { return JSON.parse(sessionStorage.getItem(K_DISP) || "{}") || {}; } catch { return {}; } }
function gravarDispensas(o) { try { sessionStorage.setItem(K_DISP, JSON.stringify(o)); } catch {} }
const dispensado = (chave, agora) => { const t = lerDispensas()[chave]; return t && agora - t < DISPENSA_MS; };

const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10 || Math.round(m)} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;

export function useSugestaoVisita({ ligado, user, orgs, plocs, active, visits }) {
  const [visivel, setVisivel] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");
  const [horario, setHorario] = useState(() => noHorarioDeTrabalho());
  const [bateriaBaixa, setBateriaBaixa] = useState(false);
  const [sug, setSug] = useState(null); // {tipo:"in", itens:[{org,dist}]} | {tipo:"out", org, dist}
  const ult = useRef(0);                 // última avaliação (ms)
  const dentro = useRef(new Map());      // orgId → ms da 1ª leitura dentro do raio (sequência atual)
  const foraDesde = useRef(null);        // ms da 1ª leitura fora (>400 m) com visita aberta
  const ultIds = useRef("");
  const ctx = useRef({});

  const hoje = todayLocal();
  const visitadosHoje = useMemo(() => {
    const s = new Set();
    for (const v of visits || []) if (v && v.orgId != null && toLocalDate(v.checkinTime) === hoje) s.add(String(v.orgId));
    return s;
  }, [visits, hoje]);
  const candidatos = useMemo(() => {
    const out = [];
    for (const o of orgs || []) {
      if (!o || o.cat === "Excluido" || o.excluido) continue;
      const g = plocs?.[o.id];
      if (!g || g.lat == null || g.lng == null) continue;
      out.push({ o, lat: +g.lat, lng: +g.lng, raio: g.geo ? RAIO_GEO : RAIO_REAL });
    }
    return out;
  }, [orgs, plocs]);
  ctx.current = { candidatos, visitadosHoje, active, plocs, orgs };

  // visibilidade da aba / app
  useEffect(() => {
    const f = () => setVisivel(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);
  // horário de trabalho (reavalia a cada minuto)
  useEffect(() => { const iv = setInterval(() => setHorario(noHorarioDeTrabalho()), 60000); return () => clearInterval(iv); }, []);
  // bateria
  useEffect(() => {
    let bat = null, vivo = true;
    const f = () => { if (bat && vivo) setBateriaBaixa(bat.level < 0.15 && !bat.charging); };
    try { navigator.getBattery?.().then(b => { bat = b; f(); b.addEventListener?.("levelchange", f); b.addEventListener?.("chargingchange", f); }).catch(() => {}); } catch {}
    return () => { vivo = false; try { bat?.removeEventListener?.("levelchange", f); bat?.removeEventListener?.("chargingchange", f); } catch {} };
  }, []);

  const avaliar = (lat, lng, agora) => {
    const { candidatos, visitadosHoje, active, plocs, orgs } = ctx.current;
    // ── visita aberta: só o check-out sugerido ──
    if (active) {
      dentro.current.clear();
      const ref = plocs?.[active.orgId];
      const base = ref && !ref.geo && ref.lat != null ? { lat: +ref.lat, lng: +ref.lng } : (active.lat != null ? { lat: +active.lat, lng: +active.lng } : null);
      if (!base) { foraDesde.current = null; setSug(null); return; }
      const d = hav(base.lat, base.lng, lat, lng) * 1000;
      if (d <= SAIDA_M) { foraDesde.current = null; setSug(s => s?.tipo === "out" ? null : s); return; }
      if (foraDesde.current == null) { foraDesde.current = agora; return; }
      const chave = "out:" + active.orgId + ":" + active.checkinTime;
      if (agora - foraDesde.current >= CONFIRMA_OUT && !dispensado(chave, agora)) {
        const org = (orgs || []).find(o => String(o.id) === String(active.orgId)) || { id: active.orgId, name: active.orgName, addr: { city_name: active.city } };
        setSug({ tipo: "out", org, dist: Math.round(d), chave });
      }
      return;
    }
    foraDesde.current = null;
    // ── check-in sugerido ──
    const perto = [];
    for (const c of candidatos) {
      if (visitadosHoje.has(String(c.o.id))) continue;
      const d = hav(c.lat, c.lng, lat, lng) * 1000;
      if (d <= c.raio) perto.push({ org: c.o, dist: Math.round(d) });
    }
    const novo = new Map();
    for (const p of perto) novo.set(p.org.id, dentro.current.get(p.org.id) ?? agora);
    dentro.current = novo;
    const confirmados = perto
      .filter(p => agora - novo.get(p.org.id) >= CONFIRMA_IN && !dispensado("in:" + p.org.id, agora))
      .sort((a, b) => a.dist - b.dist).slice(0, MAX_SUG);
    if (!confirmados.length) { setSug(s => s?.tipo === "in" ? null : s); ultIds.current = ""; return; }
    const ids = confirmados.map(p => p.org.id).join(",");
    if (ids !== ultIds.current) { try { navigator.vibrate?.(200); } catch {} }
    ultIds.current = ids;
    setSug({ tipo: "in", itens: confirmados });
  };

  // acompanhamento do GPS
  const ativo = !!(ligado && user && visivel && horario && typeof navigator !== "undefined" && navigator.geolocation);
  useEffect(() => {
    if (!ativo) { dentro.current.clear(); foraDesde.current = null; ultIds.current = ""; setSug(null); return; }
    let id = null;
    try {
      id = navigator.geolocation.watchPosition(p => {
        const agora = Date.now();
        if (!p || !p.coords) return;
        if (p.coords.accuracy != null && p.coords.accuracy > ACC_MAX) return;   // GPS impreciso: ignora
        if (agora - ult.current < INTERVALO) return;                            // no máximo a cada 20 s
        ult.current = agora;
        avaliar(p.coords.latitude, p.coords.longitude, agora);
      }, () => {}, { enableHighAccuracy: !bateriaBaixa, maximumAge: 20000, timeout: 60000 });
    } catch {}
    return () => { try { if (id != null) navigator.geolocation.clearWatch(id); } catch {} ult.current = 0; };
  }, [ativo, bateriaBaixa]); // eslint-disable-line

  // visita aberta/fechada ou cliente visitado → some a sugestão que não vale mais
  useEffect(() => {
    setSug(s => {
      if (!s) return s;
      if (s.tipo === "in" && active) return null;
      if (s.tipo === "out" && (!active || String(active.orgId) !== String(s.org.id))) return null;
      if (s.tipo === "in") { const it = s.itens.filter(i => !visitadosHoje.has(String(i.org.id))); return it.length ? (it.length === s.itens.length ? s : { ...s, itens: it }) : null; }
      return s;
    });
  }, [active, visitadosHoje]);

  const dispensar = () => {
    setSug(s => {
      if (!s) return s;
      const d = lerDispensas(), agora = Date.now();
      for (const k of Object.keys(d)) if (agora - d[k] >= DISPENSA_MS) delete d[k];
      if (s.tipo === "in") s.itens.forEach(i => { d["in:" + i.org.id] = agora; });
      else d[s.chave] = agora;
      gravarDispensas(d);
      return null;
    });
    ultIds.current = "";
  };
  const limpar = () => { setSug(null); ultIds.current = ""; };
  return { sug, dispensar, limpar, ativo };
}

export function CartaoSugestao({ sug, onCheckin, onCheckout, onDispensar, ldId }) {
  if (!sug) return null;
  const cidade = o => o?.addr?.city_name || o?.addr?.city || o?.city || "";
  const nome = o => o?.nickname || o?.name || "Cliente";
  const btn = (cor, cheio) => ({ padding: "9px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: `1px solid ${cor}`, background: cheio ? cor : "transparent", color: cheio ? "#fff" : cor, minHeight: 40 });
  const caixa = { position: "sticky", top: 0, zIndex: 30, background: "var(--card-solid, #162236)", border: `1.5px solid ${S.ok}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, boxShadow: "0 6px 18px rgba(0,0,0,.25)" };
  if (sug.tipo === "out") {
    return (
      <div role="status" aria-live="polite" data-sugestao="checkout" style={{ ...caixa, borderColor: S.gold }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: S.txt }}>📍 Você saiu do <b>{nome(sug.org)}</b>{cidade(sug.org) ? ` (${cidade(sug.org)})` : ""}. Fazer check-out?</p>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: S.ts }}>Está a {fmtDist(sug.dist)} do cliente.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => onCheckout(sug.org)} style={btn(S.gold, true)}>Fazer check-out</button>
          <button onClick={onDispensar} style={btn(S.ts, false)}>Agora não</button>
        </div>
      </div>
    );
  }
  const um = sug.itens.length === 1;
  return (
    <div role="status" aria-live="polite" data-sugestao="checkin" style={caixa}>
      <p style={{ margin: "0 0 8px", fontSize: 14, color: S.txt }}>
        📍 {um ? <>Você chegou no <b>{nome(sug.itens[0].org)}</b>{cidade(sug.itens[0].org) ? ` (${cidade(sug.itens[0].org)})` : ""}, a {fmtDist(sug.itens[0].dist)}. Fazer check-in?</> : <>Você está perto de {sug.itens.length} clientes. Em qual vai fazer check-in?</>}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {sug.itens.map(i => (
          <button key={i.org.id} disabled={ldId === i.org.id} onClick={() => onCheckin(i.org)} style={{ ...btn(S.ok, true), opacity: ldId === i.org.id ? .6 : 1, textAlign: "left" }}>
            {um ? "Fazer check-in" : <>{nome(i.org)} · {fmtDist(i.dist)}</>}
          </button>
        ))}
        <button onClick={onDispensar} style={btn(S.ts, false)}>Agora não</button>
      </div>
    </div>
  );
}

// interruptor de Configurações (salvo por usuário neste aparelho)
export function InterruptorSugestao({ user, valor, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <input type="checkbox" role="switch" checked={valor} aria-checked={valor} onChange={e => { sS(chaveSugCheckin(user), e.target.checked); onChange(e.target.checked); }} style={{ width: 20, height: 20, accentColor: S.ok }} />
      <span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: S.txt }}>📍 Sugerir check-in ao chegar no cliente</span>
        <span style={{ display: "block", fontSize: 11.5, color: S.td, marginTop: 2 }}>Com o app aberto, seg–sáb das 7h às 19h. Só sugere: você confirma. O trajeto não é gravado.</span>
      </span>
    </label>
  );
}
