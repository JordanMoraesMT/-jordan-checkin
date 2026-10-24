// TeamCheck — atendimentos a distância (escritório) num período — usado no Relatório (v79)
// Regra: atividade registrada no app (origem "teamcheck") que não seja nota.
import { useState, useEffect, useMemo } from "react";
import { S, DASH, fT } from "../lib";
import { Kpi } from "../components";

const isoZ = s => { const t = String(s || ""); return /[zZ]$|[+-]\d\d:\d\d$/.test(t) ? t : t.replace(" ", "T") + "Z"; };
const diaCba = s => new Date(Date.parse(isoZ(s)) - 4 * 3600000).toISOString().slice(0, 10);
const TL = { LIGACAO: "Ligação", WHATSAPP: "WhatsApp", EMAIL: "E-mail", REUNIAO: "Reunião", PROPOSTA: "Proposta", VISITA: "Visita" };

export function EscritorioResumo({ token, uid, nome, de, ate, bump }) {
  const [lista, setLista] = useState([]); const [ld, setLd] = useState(false); const [erro, setErro] = useState(""); const [aberto, setAberto] = useState(false);
  useEffect(() => { if (!token || !de || !ate) return; let vivo = true; setLd(true); setErro("");
    const d0 = new Date(de + "T04:00:00Z"), d1 = new Date(new Date(ate + "T04:00:00Z").getTime() + 86400000); const f = d => d.toISOString().slice(0, 19).replace("T", " ");
    fetch(`${DASH}/api/crm/atividades?desde=${encodeURIComponent(f(d0))}&ate=${encodeURIComponent(f(d1))}&limit=2000`, { headers: { "X-Session": token }, cache: "no-store" })
      .then(r => r.json()).then(d => { if (vivo) setLista((d && d.atividades) || []); }).catch(e => { if (vivo) setErro(String(e.message || e)); }).finally(() => { if (vivo) setLd(false); });
    return () => { vivo = false; }; }, [token, de, ate, bump]);
  const nrm = s => String(s || "").toLowerCase().trim();
  const meu = a => String(a.user_id || "") === String(uid) || nrm(a.user_nome) === nrm(nome);
  const rem = useMemo(() => lista.filter(a => meu(a) && a.origem === "teamcheck" && a.tipo !== "NOTA").sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em))), [lista, uid, nome]);
  const resolv = useMemo(() => lista.filter(a => meu(a) && (a.origem === "teamcheck" || a.origem === "checkout")).reduce((n, a) => n + ((String(a.texto || "").match(/✓ Pendência resolvida/g) || []).length), 0), [lista, uid, nome]);
  const porTipo = useMemo(() => { const m = {}; rem.forEach(a => { m[a.tipo] = (m[a.tipo] || 0) + 1; }); return m; }, [rem]);
  const porDia = useMemo(() => { const m = {}; rem.forEach(a => { const d = diaCba(a.criado_em); m[d] = (m[d] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0])); }, [rem]);
  return (<section aria-label="Atendimentos a distância" style={{ marginTop: 18 }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.txt }}>Escritório — atendimentos a distância</h2>
      <span style={{ fontSize: 12.5, color: S.ts }}>sem check-in · ligação, WhatsApp, e-mail, reunião, proposta</span>
    </div>
    {ld && <p style={{ fontSize: 13, color: S.ts, margin: "0 0 10px" }}>Carregando…</p>}
    {erro && <p style={{ fontSize: 13, color: S.dng, margin: "0 0 10px" }}>Não consegui ler os atendimentos: {erro}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 12 }}>
      <Kpi k="Atendimentos" v={rem.length} />
      <Kpi k="Dias com atendimento" v={porDia.length} />
      <Kpi k="Ligações" v={porTipo.LIGACAO || 0} />
      <Kpi k="WhatsApp" v={porTipo.WHATSAPP || 0} />
      <Kpi k="E-mail / outros" v={rem.length - (porTipo.LIGACAO || 0) - (porTipo.WHATSAPP || 0)} />
      <Kpi k="Pendências resolvidas" v={resolv} />
    </div>
    {!ld && !rem.length && <p style={{ color: S.ts, fontSize: 14, margin: 0 }}>Nenhum atendimento a distância no período.</p>}
    {rem.length > 0 && <>
      <button onClick={() => setAberto(v => !v)} aria-expanded={aberto} style={{ width: "100%", height: 42, fontSize: 13.5, fontWeight: 600, marginBottom: 8, textAlign: "left", padding: "0 12px" }}>{aberto ? "Esconder" : "Ver"} os {rem.length} atendimentos</button>
      {aberto && <div style={{ border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card }}>
        {[...rem].reverse().map((a, i) => <div key={a.id} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: "0 10px", padding: "10px 12px", borderTop: i ? `1px solid ${S.brd}` : "none" }}>
          <span className="num" style={{ fontSize: 12, color: S.ts, paddingTop: 2 }}>{diaCba(a.criado_em).slice(8, 10)}/{diaCba(a.criado_em).slice(5, 7)} {fT(isoZ(a.criado_em))}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, color: S.txt }}><b style={{ fontWeight: 600 }}>{a.org_nome || "—"}</b><span style={{ color: S.ts }}> · {TL[a.tipo] || a.tipo}</span></p>
            {a.texto && <p style={{ margin: "2px 0 0", fontSize: 13, color: S.t2, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{String(a.texto).slice(0, 220)}</p>}
          </div>
        </div>)}
      </div>}
    </>}
  </section>);
}
