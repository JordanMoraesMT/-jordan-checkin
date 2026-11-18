// TeamCheck v118 — Etiquetas das pessoas (contatos), iguais às do WhatsApp Business.
// Dados: D1 crm_contato_etiqueta (ativa = removido_em IS NULL) · lista oficial: config_catalogo tipo 'etiqueta'.
// API: agendor-proxy v8 — GET /api/crm/etiquetas?ids=… | /api/crm/etiquetas-todas · POST /api/crm/etiqueta
// Regras (v119, iguais às do agente e do proxy v9): fluxo BAZAR/MATCON — COTAÇÃO → AGUARD APROV → PV TRANSFORMAR →
// FINALIZADO; ao avançar, as etapas anteriores saem sozinhas (feito no proxy). As outras etiquetas não interferem.
import { useState } from "react";
import { createPortal } from "react-dom";
import { Tag, X } from "lucide-react";
import { S, API, etiquetasCat, corEtiqueta } from "./lib";

export const AGENTE = "Agente IA (WhatsApp)";
// CT carregados pelo histórico de vendas (o agente atualiza todo dia 1º)
export const CARGA = "carga-historico";
export const PARA_TRANSMITIR = "PV TRANSFORMAR";
const icone = e => e.user_nome === AGENTE ? "🤖" : e.origem === CARGA ? "📊" : null;
const quem = e => e.user_nome === AGENTE ? "🤖 colocada pelo Agente IA (WhatsApp)" : e.origem === CARGA ? "📊 carga automática (vendas 12 meses)" : `colocada por ${e.user_nome || "—"}`;
async function etq(token, path, body) {
  const r = await fetch(API + path, { method: body ? "POST" : "GET", cache: "no-store", headers: { "X-Session": token, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || ("HTTP " + r.status));
  return d;
}
export const etqDosContatos = (token, ids) => ids.length ? etq(token, "/api/crm/etiquetas?ids=" + ids.slice(0, 200).join(",")).then(d => d.etiquetas || []) : Promise.resolve([]);
export const etqTodas = token => etq(token, "/api/crm/etiquetas-todas").then(d => d.etiquetas || []);
export const etqMarcar = (token, contato, etiqueta, remover) => etq(token, "/api/crm/etiqueta", { contato_id: contato.id, cnpj: (contato.cnpj || "").replace(/\D/g, "") || undefined, etiqueta, ...(remover ? { remover: true } : {}) }).then(d => d.etiquetas || []);
// agrupa a lista por contato_id
export const porContato = lista => { const m = new Map(); (lista || []).forEach(e => { const a = m.get(e.contato_id) || []; a.push(e); m.set(e.contato_id, a); }); return m; };
// criado_em do D1 é UTC sem sufixo → Cuiabá (UTC−4)
export const quandoCba = iso => { if (!iso) return ""; const d = new Date(String(iso).replace(" ", "T") + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? "" : "Z")); if (isNaN(d)) return iso;
  const c = new Date(d.getTime() - 4 * 3600000), p = n => String(n).padStart(2, "0"); return `${p(c.getUTCDate())}/${p(c.getUTCMonth() + 1)}/${c.getUTCFullYear()} ${p(c.getUTCHours())}:${p(c.getUTCMinutes())}`; };

export function EtqChip({ e, small }) {
  const cor = e.cor || corEtiqueta(e.etiqueta);
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "1px 7px" : "2px 8px", borderRadius: 999, fontSize: small ? 10.5 : 11.5, fontWeight: 700, color: cor, background: cor + "22", border: `1px solid ${cor}66`, whiteSpace: "nowrap" }}>{icone(e)}{e.etiqueta}</span>;
}
// chips clicáveis: tocar mostra quem colocou, quando e a obs
export function EtqChips({ lista, small }) {
  const [ab, setAb] = useState(null);
  if (!lista || !lista.length) return null;
  const sel = lista.find(e => e.id === ab);
  return <div style={{ marginTop: 5 }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {lista.map(e => <button key={e.id} onClick={ev => { ev.stopPropagation(); setAb(a => a === e.id ? null : e.id); }} title={`${e.etiqueta} · ${e.user_nome || "—"} · ${quandoCba(e.criado_em)}`} aria-expanded={ab === e.id}
        style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}><EtqChip e={e} small={small} /></button>)}
    </div>
    {sel && <p style={{ margin: "5px 0 0", fontSize: 11.5, color: S.ts, lineHeight: 1.45 }}>
      <b style={{ color: S.txt }}>{sel.etiqueta}</b> · {quem(sel)} em {quandoCba(sel.criado_em)}{sel.obs ? ` · ${sel.obs}` : ""}</p>}
  </div>;
}

// janela "🏷️ Etiquetas" — lista do catálogo com marcar/desmarcar
export function EtqModal({ token, contato, ativas, onFechar, onMudou }) {
  const [atuais, setAtuais] = useState(ativas || []);
  const [lo, setLo] = useState(""); const [err, setErr] = useState("");
  const cat = etiquetasCat();
  const on = n => atuais.some(e => e.etiqueta === n);
  const tog = async n => {
    setLo(n); setErr("");
    try { const l = await etqMarcar(token, contato, n, on(n)); setAtuais(l); onMudou && onMudou(contato.id, l); }
    catch (e) { setErr("Não foi possível gravar: " + e.message); }
    setLo("");
  };
  return createPortal(<div onMouseDown={e => { if (e.target === e.currentTarget && !lo) onFechar(); }} style={{ position: "fixed", inset: 0, background: "rgba(4,10,18,.66)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
    <div role="dialog" aria-label={`Etiquetas de ${contato.nome}`} style={{ width: "100%", maxWidth: 420, maxHeight: "calc(100vh - 24px)", overflowY: "auto", background: "var(--card-solid)", border: `1px solid ${S.brd}`, borderRadius: 16, padding: 16, boxShadow: "0 18px 50px rgba(0,0,0,.45)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <Tag size={18} color={S.pl} style={{ marginTop: 2 }} /><span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: S.txt }}>Etiquetas · {contato.nome}</span>
        <button onClick={onFechar} disabled={!!lo} aria-label="Fechar" style={{ padding: 6, border: "none", display: "flex", background: "transparent" }}><X size={17} color={S.ts} /></button>
      </div>
      <p style={{ margin: "0 0 12px 26px", fontSize: 12, color: S.ts }}>BAZAR/MATCON: ao avançar (cotação → aguard. aprov. → PV transformar → finalizado), as etapas anteriores saem sozinhas. O histórico fica guardado.</p>
      {!cat.length && <p style={{ fontSize: 12.5, color: S.ts }}>Nenhuma etiqueta ativa no catálogo (Configurações › Cadastros › Etiquetas).</p>}
      <div style={{ display: "grid", gap: 6 }}>
        {cat.map(c => { const m = on(c.nome); const e = atuais.find(x => x.etiqueta === c.nome);
          return <label key={c.nome} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${m ? c.cor + "88" : S.inpBdr}`, background: m ? c.cor + "18" : "transparent", cursor: lo ? "wait" : "pointer" }}>
            <input type="checkbox" checked={m} disabled={!!lo} onChange={() => tog(c.nome)} style={{ width: 17, height: 17, accentColor: c.cor }} />
            <span style={{ width: 10, height: 10, borderRadius: 5, background: c.cor, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: m ? 700 : 500, color: S.txt }}>{c.nome}</span>
            {lo === c.nome ? <span style={{ fontSize: 11, color: S.ts }}>gravando…</span> : e ? <span style={{ fontSize: 10.5, color: S.ts, textAlign: "right" }}>{e.user_nome === AGENTE ? "🤖 Agente" : e.origem === CARGA ? "📊 Carga" : (e.user_nome || "").split(" ")[0]}<br />{quandoCba(e.criado_em).slice(0, 10)}</span> : null}
          </label>; })}
      </div>
      {err && <p role="alert" style={{ margin: "10px 0 0", fontSize: 12.5, color: S.dng }}>{err}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button onClick={onFechar} disabled={!!lo} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "none", background: S.pri, color: "#fff", cursor: "pointer" }}>Pronto</button>
      </div>
    </div>
  </div>, document.body);
}
