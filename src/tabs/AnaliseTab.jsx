// TeamCheck — Gestão › Análise de visitas (v75, só admin)
// Versão viva da planilha VISITAS_ALISSON: Resumo, Situação, Diagnóstico, Saúde (horas × retorno), Carteira e Jornada.
// Regra do Jordan: nenhum valor de comissão aparece na tela — a comissão média só entra no índice de saúde.
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Download, SlidersHorizontal } from "lucide-react";
import { S, USERS, API, DASH, todayLocal, fD, csv } from "../lib";
import { SearchSelect, MultiSelect, DateField, Kpi } from "../components";
import { analisar, PREMISSAS_PADRAO } from "../analiseVisitas";

const brl = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const n1 = v => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hm = h => { const m = Math.round((h || 0) * 60); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`; };
const dBR = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "—";
const SIT = [["Em dia", S.ok], ["Visita atrasada", S.gold], ["Sem visita", S.dng]];
const DIAG = [["Adequado", S.ok], ["Excesso de visitas", "#B5718E"], ["Visitas acima do retorno", S.gold], ["Retomar frequência", "#E28A5B"], ["Priorizar visita", S.dng], ["Prospectar / avaliar", "var(--t3)"]];
const SAU = [["Saudável", S.ok], ["Atenção", S.gold], ["Não se paga", S.dng], ["Sem visita", "var(--t3)"]];
const corDe = (lista, v) => (lista.find(x => x[0] === v) || [null, S.ts])[1];

function Quadro({ titulo, itens, linhas, campo, ativo, onPick, extra }) {
  const tot = linhas.length || 1;
  return (<section style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px", flex: "1 1 280px", minWidth: 0 }}>
    <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: S.txt }}>{titulo}</h3>
    {itens.map(([l, c]) => { const n = linhas.filter(x => x[campo] === l).length; const on = ativo === l;
      return (<button key={l} onClick={() => onPick(on ? null : l)} aria-pressed={on} style={{ width: "100%", display: "grid", gridTemplateColumns: "10px minmax(0,1fr) auto auto", gap: 10, alignItems: "center", padding: "8px 6px", minHeight: 40, border: "none", borderRadius: 6, background: on ? S.cl : "transparent", textAlign: "left" }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
        <span style={{ fontSize: 14, color: S.txt, fontWeight: on ? 600 : 400 }}>{l}</span>
        <span className="num" style={{ fontSize: 14, color: S.txt, fontWeight: 600 }}>{n}</span>
        <span className="num" style={{ fontSize: 12, color: S.ts, width: 40, textAlign: "right" }}>{Math.round(n / tot * 100)}%</span>
      </button>); })}
    {extra}
  </section>);
}

export function AnaliseTab({ token, allOrgs, rfv, user, onOpenFicha }) {
  const [prem, setPrem] = useState(PREMISSAS_PADRAO);
  const [premAberta, setPremAberta] = useState(false);
  const [premEd, setPremEd] = useState(null);
  const [uid, setUid] = useState(() => String((USERS.find(u => String(u.id) !== String(user?.id)) || USERS[0] || { id: 743347 }).id));
  const selUser = USERS.find(u => String(u.id) === String(uid)) || { n: "—" };
  const [desde, setDesde] = useState(null);
  const [cidades, setCidades] = useState([]);
  const [visitas, setVisitas] = useState([]); const [vendido, setVendido] = useState({}); const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fSit, setFSit] = useState(null); const [fDiag, setFDiag] = useState(null); const [fSau, setFSau] = useState(null);
  const [ord, setOrd] = useState({ k: "fat12m", d: -1 }); const [verJornada, setVerJornada] = useState(false);
  const hoje = todayLocal();
  const inicio = desde || prem.inicio;

  // premissas: KV compartilhado (mesmo serviço de sync do app)
  useEffect(() => { fetch(`${API}?sync=analisePremissas`).then(r => r.json()).then(d => { if (d && d.active && d.active.inicio) setPrem({ ...PREMISSAS_PADRAO, ...d.active }); }).catch(() => {}); }, []);
  const salvaPrem = async (p) => { setPrem(p); setPremEd(null); try { await fetch(`${API}?sync=analisePremissas`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: p }) }); } catch (e) { alert("Não consegui salvar as premissas: " + e.message); } };

  // dados: check-outs (D1) desde o início + vendido no período por CNPJ (mesma rota da tela Detalhada do Dashboard)
  useEffect(() => { if (!token) return; let vivo = true; setLd(true); setErro("");
    const deUTC = inicio + " 04:00:00", pIni = inicio.slice(0, 7), pFim = hoje.slice(0, 7);
    Promise.all([
      fetch(`${DASH}/api/crm/atividades?tipo=VISITA&desde=${encodeURIComponent(deUTC)}&limit=2000`, { headers: { "X-Session": token }, cache: "no-store" }).then(r => r.json()),
      fetch(`${DASH}/api/detalhada?de=${pIni}&ate=${pFim}`, { headers: { "X-Session": token }, cache: "no-store" }).then(r => r.json()),
    ]).then(([a, d]) => { if (!vivo) return;
      setVisitas(((a && a.atividades) || []).filter(x => x.origem === "checkout"));
      const m = {}; ((d && d.clients) || []).forEach(c => { m[String(c.cnpj || "").replace(/\D/g, "").padStart(14, "0")] = +c.fat || 0; }); setVendido(m);
      if (!(a && a.atividades)) setErro("Não consegui ler as visitas."); else if (!(d && d.clients)) setErro("Não consegui ler as vendas do período (Dashboard).");
    }).catch(e => { if (vivo) setErro(String(e.message || e)); }).finally(() => { if (vivo) setLd(false); });
    return () => { vivo = false; }; }, [token, inicio]);

  const nrm = s => String(s || "").toLowerCase().trim();
  const carteiraBase = useMemo(() => (allOrgs || []).filter(o => !o.excluido && nrm(o.owner) === nrm(selUser.n)), [allOrgs, selUser.n]);
  const cidadeOpts = useMemo(() => [...new Set(carteiraBase.map(o => o.addr?.city_name || o.addr?.city).filter(Boolean))].sort(), [carteiraBase]);
  const carteira = useMemo(() => cidades.length ? carteiraBase.filter(o => cidades.includes(o.addr?.city_name || o.addr?.city)) : carteiraBase, [carteiraBase, cidades]);
  const vUser = useMemo(() => visitas.filter(v => String(v.user_id || "") === String(uid) || nrm(v.user_nome) === nrm(selUser.n)), [visitas, uid, selUser.n]);
  const A = useMemo(() => analisar({ visitas: vUser, carteira, rfv, vendido, prem: { ...prem, inicio }, hoje }), [vUser, carteira, rfv, vendido, prem, inicio, hoje]);

  const linhasF = useMemo(() => { let l = A.linhas;
    if (fSit) l = l.filter(x => x.situacao === fSit); if (fDiag) l = l.filter(x => x.diagnostico === fDiag); if (fSau) l = l.filter(x => x.saude === fSau);
    const k = ord.k; return [...l].sort((a, b) => { const va = a[k], vb = b[k]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * ord.d; });
  }, [A, fSit, fDiag, fSau, ord]);
  const horasPorSaude = l => A.linhas.filter(x => x.saude === l).reduce((s, x) => s + x.horas, 0);
  const R = A.resumo; const saudeGeral = R.indice == null ? "—" : R.indice >= 1 ? "Saudável" : R.indice >= 0.5 ? "Atenção" : "Não se paga";

  const exportar = () => { const rows = [["CNPJ", "Cliente", "Cidade", "Bairro", "Status", "Segmento", "Faturamento 12m", "Vendido no período", "Última compra", "Fat. médio mensal", "Classe", "Visitas", "Visitas/mês", "Visitas/mês ideal", "Intervalo máx. (dias)", "Última visita", "Dias sem visita", "Horas investidas", "Situação", "Diagnóstico", "Saúde", "Índice"]];
    linhasF.forEach(x => rows.push([x.cnpj, x.nome, x.cidade, x.bairro, x.status, x.segmento, Math.round(x.fat12m), Math.round(x.vendido), x.ultCompra ? dBR(x.ultCompra) : "", Math.round(x.fatMes), x.classe, x.visitas, n1(x.porMes), x.ideal, x.max, x.ultVis ? dBR(x.ultVis) : "", x.diasSem ?? "", n1(x.horas), x.situacao, x.diagnostico, x.saude, x.indice == null ? "" : n1(x.indice)]));
    csv(rows, `analise-visitas-${(selUser.n || "").split(" ")[0].toLowerCase()}-${hoje}.csv`); };

  const th = (k, l, right) => <th scope="col" onClick={() => setOrd(o => ({ k, d: o.k === k ? -o.d : (typeof A.linhas[0]?.[k] === "string" ? 1 : -1) }))} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: ord.k === k ? S.txt : S.t2, textAlign: right ? "right" : "left", borderBottom: `1px solid ${S.brd}`, cursor: "pointer", whiteSpace: "nowrap", position: "sticky", top: 0, background: S.cardSolid }}>{l}{ord.k === k ? (ord.d > 0 ? " ↑" : " ↓") : ""}</th>;
  const td = { padding: "9px 10px", borderBottom: `1px solid ${S.brd}`, fontSize: 13.5, color: S.txt, verticalAlign: "top" };
  const tdn = { ...td, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, whiteSpace: "nowrap" };
  const filtrosAtivos = [fSit, fDiag, fSau].filter(Boolean);

  return (<div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", color: S.txt }}>Visitas e carteira — {selUser.n}</h1>
        <p className="num" style={{ margin: "3px 0 0", fontSize: 12.5, color: S.ts }}>{dBR(inicio)} a {dBR(hoje)} · {n1(A.meses)} meses · {R.clientes} clientes na carteira</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SearchSelect value={String(uid)} onChange={setUid} placeholder="Vendedor" style={{ width: 190 }} options={USERS.map(u => [String(u.id), u.n])} />
        <DateField value={inicio} onChange={v => setDesde(v)} today={hoje} placeholder="Desde" style={{ width: 160 }} />
        <MultiSelect values={cidades} onChange={setCidades} placeholder="Cidade" allLabel="Todas" options={cidadeOpts} style={{ width: 190 }} />
      </div>
    </div>
    {ld && <p style={{ fontSize: 13, color: S.ts, margin: "0 0 10px" }}>Carregando visitas e vendas…</p>}
    {erro && <p style={{ fontSize: 13, color: S.dng, margin: "0 0 10px" }}>{erro}</p>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))", gap: 10, marginBottom: 14 }}>
      <Kpi k="Visitas realizadas" v={R.visitas} />
      <Kpi k="Dias em campo" v={R.diasCampo} />
      <Kpi k="Horas em campo" v={hm(R.horas)} />
      <Kpi k="Km rodado (est.)" v={Math.round(R.km)} u="km" />
      <Kpi k="Vendido no período" v={brl(R.vendido)} />
      <Kpi k="Faturamento 12m" v={brl(R.fat12m)} />
      <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, color: S.t2, marginBottom: 6 }}>Saúde da operação</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: corDe(SAU, saudeGeral), lineHeight: 1.1 }}>{saudeGeral}</div>
        {R.indice != null && <div className="num" style={{ fontSize: 12, color: S.ts, marginTop: 3 }}>retorno do tempo {n1(R.indice)}x</div>}
      </div>
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <Quadro titulo="Situação das visitas" itens={SIT} linhas={A.linhas} campo="situacao" ativo={fSit} onPick={setFSit} />
      <Quadro titulo="Diagnóstico de eficiência" itens={DIAG} linhas={A.linhas} campo="diagnostico" ativo={fDiag} onPick={setFDiag} />
      <Quadro titulo="Saúde do cliente (horas × retorno)" itens={SAU} linhas={A.linhas} campo="saude" ativo={fSau} onPick={setFSau}
        extra={<p className="num" style={{ margin: "8px 6px 0", fontSize: 12, color: S.ts }}>horas em clientes que não se pagam: {hm(horasPorSaude("Não se paga"))}</p>} />
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", margin: "4px 0 8px" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.txt }}>Carteira <span className="num" style={{ fontSize: 13, fontWeight: 400, color: S.ts }}>{linhasF.length} de {A.linhas.length}</span></h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {filtrosAtivos.length > 0 && <button onClick={() => { setFSit(null); setFDiag(null); setFSau(null); }} style={{ height: 36, padding: "0 12px", fontSize: 13 }}>Limpar ({filtrosAtivos.join(" · ")})</button>}
        <button onClick={exportar} style={{ height: 36, padding: "0 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Exportar</button>
      </div>
    </div>
    <div style={{ overflow: "auto", maxHeight: "70vh", border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, marginBottom: 16 }}>
      <table style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse" }}>
        <thead><tr>
          {th("nome", "Cliente")}{th("classe", "Classe")}{th("visitas", "Visitas", 1)}{th("porMes", "Por mês · ideal", 1)}{th("diasSem", "Última visita", 1)}{th("horas", "Horas", 1)}
          {th("vendido", "Vendido período", 1)}{th("fat12m", "Fat. 12m", 1)}{th("situacao", "Situação")}{th("diagnostico", "Diagnóstico")}{th("indice", "Saúde", 1)}
        </tr></thead>
        <tbody>{linhasF.map(x => <tr key={x.id}>
          <td style={{ ...td, minWidth: 230, maxWidth: 300 }}><button onClick={() => onOpenFicha && onOpenFicha(x.org)} style={{ border: "none", padding: 0, background: "transparent", color: S.txt, fontWeight: 600, fontSize: 13.5, textAlign: "left" }}>{x.nome}</button>
            <div style={{ fontSize: 12, color: S.ts }}>{[x.bairro, x.cidade].filter(Boolean).join(" · ")}{x.status ? " · " + x.status : ""}</div></td>
          <td style={td}>{x.classe}</td>
          <td style={tdn}>{x.visitas}</td>
          <td style={{ ...tdn, color: x.porMes > x.ideal * prem.tolerancia ? S.gold : S.txt }}>{n1(x.porMes)} · {x.ideal}</td>
          <td style={{ ...tdn, color: x.situacao === "Visita atrasada" ? S.gold : x.situacao === "Sem visita" ? S.dng : S.txt }}>{x.ultVis ? `${x.diasSem}d` : "nunca"}<div style={{ fontSize: 11, color: S.ts }}>{x.ultVis ? dBR(x.ultVis) : ""}</div></td>
          <td style={tdn}>{x.horas ? hm(x.horas) : "—"}</td>
          <td style={tdn}>{x.vendido ? brl(x.vendido) : "—"}</td>
          <td style={tdn}>{x.fat12m ? brl(x.fat12m) : "—"}<div style={{ fontSize: 11, color: S.ts }}>{x.ultCompra ? "últ. " + dBR(x.ultCompra) : ""}</div></td>
          <td style={{ ...td, color: corDe(SIT, x.situacao), whiteSpace: "nowrap" }}>{x.situacao}</td>
          <td style={{ ...td, color: corDe(DIAG, x.diagnostico) }}>{x.diagnostico}</td>
          <td style={{ ...tdn, color: corDe(SAU, x.saude) }}>{x.saude}{x.indice != null && <div style={{ fontSize: 11, color: S.ts }}>{n1(x.indice)}x</div>}</td>
        </tr>)}</tbody>
      </table>
    </div>

    <button onClick={() => setVerJornada(v => !v)} aria-expanded={verJornada} style={{ width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Jornada por dia ({A.dias.length} dias){verJornada ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
    {verJornada && <div style={{ overflowX: "auto", border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, marginBottom: 16 }}>
      <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
        <thead><tr>{["Data", "Dia", "Visitas", "Check-outs", "Início", "Fim", "Horas", "Km (est.)"].map((h, i) => <th key={h} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: S.t2, textAlign: i > 1 ? "right" : "left", borderBottom: `1px solid ${S.brd}` }}>{h}</th>)}</tr></thead>
        <tbody>{[...A.dias].reverse().map(d => <tr key={d.dia} style={{ opacity: d.visitas ? 1 : 0.6 }}>
          <td style={{ ...td, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5 }}>{dBR(d.dia)}</td><td style={td}>{d.dow}</td>
          <td style={tdn}>{d.visitas}</td><td style={tdn}>{d.checkouts}</td><td style={tdn}>{d.inicio}</td><td style={tdn}>{d.fim}</td><td style={tdn}>{d.horas ? hm(d.horas) : "—"}</td><td style={tdn}>{d.km ? n1(d.km) : "—"}</td>
        </tr>)}</tbody>
      </table>
    </div>}

    <button onClick={() => { setPremAberta(v => !v); setPremEd(premEd || prem); }} aria-expanded={premAberta} style={{ width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: 14, fontWeight: 600, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><SlidersHorizontal size={15} />Premissas</span>{premAberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
    {premAberta && premEd && <div style={{ border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        {[["inicio", "Início do TeamCheck", "date"], ["custoHora", "Custo da hora de campo (R$)"], ["comissao", "Retorno médio sobre a venda (%)"], ["tolerancia", "Tolerância acima do ideal (x)"], ["fator", "Fator rodoviário (km)"]].map(([k, l, t]) => <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12.5, color: S.t2 }}>{l}</span>
          {t === "date" ? <DateField value={premEd.inicio} onChange={v => setPremEd(p => ({ ...p, inicio: v }))} today={hoje} placeholder="Data" />
            : <input type="number" step="0.1" value={premEd[k]} onChange={e => setPremEd(p => ({ ...p, [k]: +e.target.value }))} className="num" style={{ height: 42, boxSizing: "border-box" }} />}
        </label>)}
      </div>
      <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", minWidth: 420 }}>
        <thead><tr>{["Classe", "Fat. médio mensal mínimo (R$)", "Visitas/mês ideal", "Intervalo máx. (dias)"].map(h => <th key={h} style={{ padding: "6px 8px", fontSize: 12, color: S.t2, textAlign: "left", fontWeight: 600 }}>{h}</th>)}</tr></thead>
        <tbody>{premEd.classes.map((c, i) => <tr key={c.c}><td style={{ padding: "4px 8px", fontSize: 13.5, color: S.txt }}>{c.c}</td>
          {["min", "ideal", "max"].map(f => <td key={f} style={{ padding: "4px 8px" }}><input type="number" value={c[f]} disabled={c.c === "Sem compra" && f === "min"} onChange={e => setPremEd(p => ({ ...p, classes: p.classes.map((x, j) => j === i ? { ...x, [f]: +e.target.value } : x) }))} className="num" style={{ width: 110, height: 38, boxSizing: "border-box" }} /></td>)}</tr>)}</tbody>
      </table></div>
      <p style={{ margin: 0, fontSize: 12, color: S.ts, lineHeight: 1.5 }}>Horas = jornada do dia (1º → último check-out, o do escritório fecha o dia) dividida pelas visitas do dia; dia com uma visita só usa a média do período. Saúde = retorno estimado do que o cliente comprou no período ÷ custo das horas investidas nele (≥ 1x saudável · 0,5–1x atenção · &lt; 0,5x não se paga). Vendas por mês de faturamento, a partir do mês de início.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button onClick={() => setPremEd({ ...PREMISSAS_PADRAO })} style={{ height: 40, padding: "0 12px", fontSize: 13.5 }}>Voltar ao padrão</button>
        <button onClick={() => salvaPrem(premEd)} style={{ height: 40, padding: "0 16px", fontSize: 13.5, fontWeight: 600, background: S.pri, border: "none", color: "#fff" }}>Salvar e recalcular</button>
      </div>
    </div>}
  </div>);
}
