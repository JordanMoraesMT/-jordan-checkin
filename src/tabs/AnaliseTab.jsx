// TeamCheck — Gestão › Análise de visitas (v76)
// Versão viva da planilha VISITAS_ALISSON. Admin vê tudo (valores, saúde, premissas).
// Vendedor vê a própria carteira SEM nenhum valor: só situação da visita e se vale investir uma nova visita.
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Download, SlidersHorizontal } from "lucide-react";
import { S, USERS, API, DASH, todayLocal, csv } from "../lib";
import { SearchSelect, MultiSelect, DateField, Kpi } from "../components";
import { analisar, PREMISSAS_PADRAO, INDUSTRIAS, CONTAS, ROTULO_CONTA } from "../analiseVisitas";

const brl = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const n1 = v => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hm = h => { const m = Math.round((h || 0) * 60); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`; };
const dBR = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "—";
const dCurta = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "";
const k14 = x => String(x || "").replace(/\D/g, "").padStart(14, "0");
const mesMenos = (ym, n) => { const [y, m] = ym.split("-").map(Number); const t = y * 12 + (m - 1) - n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const SIT = [["Em dia", S.ok], ["Visita atrasada", S.gold], ["Sem visita", S.dng]];
const VER = [["Rentável visitar", S.ok], ["Aguardar", S.gold], ["Atender a distância", "#E28A5B"], ["Prospecção", "var(--t3)"]];
const DIAG = [["Adequado", S.ok], ["Excesso de visitas", "#B5718E"], ["Visitas acima do retorno", S.gold], ["Retomar frequência", "#E28A5B"], ["Priorizar visita", S.dng], ["Prospectar / avaliar", "var(--t3)"]];
const SAU = [["Saudável", S.ok], ["Atenção", S.gold], ["Não se paga", S.dng], ["Sem visita", "var(--t3)"]];
const corDe = (lista, v) => (lista.find(x => x[0] === v) || [null, S.ts])[1];

function Quadro({ titulo, sub, itens, linhas, campo, ativo, onPick, extra }) {
  const tot = linhas.length || 1;
  return (<section style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px", flex: "1 1 260px", minWidth: 0 }}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.txt }}>{titulo}</h3>
    {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: S.ts }}>{sub}</p>}
    <div style={{ marginTop: 6 }}>{itens.map(([l, c]) => { const n = linhas.filter(x => x[campo] === l).length; const on = ativo === l;
      return (<button key={l} onClick={() => onPick(on ? null : l)} aria-pressed={on} style={{ width: "100%", display: "grid", gridTemplateColumns: "10px minmax(0,1fr) auto auto", gap: 10, alignItems: "center", padding: "8px 6px", minHeight: 40, border: "none", borderRadius: 6, background: on ? S.cl : "transparent", textAlign: "left" }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />
        <span style={{ fontSize: 14, color: S.txt, fontWeight: on ? 600 : 400 }}>{l}</span>
        <span className="num" style={{ fontSize: 14, color: S.txt, fontWeight: 600 }}>{n}</span>
        <span className="num" style={{ fontSize: 12, color: S.ts, width: 40, textAlign: "right" }}>{Math.round(n / tot * 100)}%</span>
      </button>); })}</div>
    {extra}
  </section>);
}

export function AnaliseTab({ token, allOrgs, rfv, user, isAdmin, onOpenFicha }) {
  const [prem, setPrem] = useState(PREMISSAS_PADRAO);
  const [premAberta, setPremAberta] = useState(false); const [premEd, setPremEd] = useState(null);
  const [uid, setUid] = useState(() => isAdmin ? String((USERS.find(u => String(u.id) !== String(user?.id)) || USERS[0] || { id: 743347 }).id) : String(user?.id));
  const uidEf = isAdmin ? uid : String(user?.id);
  const selUser = USERS.find(u => String(u.id) === uidEf) || { n: user?.name || "—" };
  const [desde, setDesde] = useState(null); const [cidades, setCidades] = useState([]);
  const [visitas, setVisitas] = useState([]); const [vendInd, setVendInd] = useState({}); const [fat12Ind, setFat12Ind] = useState({});
  const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fSit, setFSit] = useState(null); const [fVer, setFVer] = useState(null); const [fDiag, setFDiag] = useState(null); const [fSau, setFSau] = useState(null);
  const [ord, setOrd] = useState({ k: isAdmin ? "fat12m" : "veredito", d: isAdmin ? -1 : 1 }); const [verJornada, setVerJornada] = useState(false);
  const hoje = todayLocal(); const inicio = desde || prem.inicio;

  // premissas: serviço de sync do app (KV) — compartilhadas
  useEffect(() => { fetch(`${API}?sync=analisePremissas`).then(r => r.json()).then(d => { if (d && d.active && d.active.inicio) setPrem({ ...PREMISSAS_PADRAO, ...d.active, taxas: { ...PREMISSAS_PADRAO.taxas, ...(d.active.taxas || {}) } }); }).catch(() => {}); }, []);
  const salvaPrem = async (p) => { setPrem(p); setPremEd(null); setPremAberta(false); try { await fetch(`${API}?sync=analisePremissas`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: p }) }); } catch (e) { alert("Não consegui salvar as premissas: " + e.message); } };

  // dados: check-outs (D1) + vendas por cliente e por representada (rota Detalhada do Dashboard, 1 chamada por indústria)
  useEffect(() => { if (!token) return; let vivo = true; setLd(true); setErro("");
    const H = { headers: { "X-Session": token }, cache: "no-store" };
    const pIni = inicio.slice(0, 7), pFim = hoje.slice(0, 7), p12 = mesMenos(pFim, 11);
    // 1 chamada por indústria + 1 para Plastilit só tubos (taxa própria); "Plastilit" fica = total − tubos
    const consultas = [...INDUSTRIAS.map(ind => [ind, `ind=${encodeURIComponent(ind)}`]), ["Plastilit Tubos", "ind=Plastilit&cat=Tubos"]];
    const porInd = (de, ate) => Promise.all(consultas.map(([conta, q]) => fetch(`${DASH}/api/detalhada?de=${de}&ate=${ate}&${q}`, H).then(r => r.json()).then(d => [conta, (d && d.clients) || null]).catch(() => [conta, null])))
      .then(lst => { const m = {}; let falhou = 0; lst.forEach(([conta, cl]) => { if (!cl) { falhou++; return; } cl.forEach(c => { const k = k14(c.cnpj); (m[k] = m[k] || {})[conta] = +c.fat || 0; }); });
        Object.values(m).forEach(x => { if (x["Plastilit Tubos"]) x.Plastilit = Math.max(0, (x.Plastilit || 0) - x["Plastilit Tubos"]); });
        return { m, falhou }; });
    Promise.all([
      fetch(`${DASH}/api/crm/atividades?tipo=VISITA&desde=${encodeURIComponent(inicio + " 04:00:00")}&limit=2000`, H).then(r => r.json()),
      porInd(pIni, pFim), porInd(p12, pFim),
    ]).then(([a, v, f]) => { if (!vivo) return;
      setVisitas(((a && a.atividades) || []).filter(x => x.origem === "checkout")); setVendInd(v.m); setFat12Ind(f.m);
      if (!(a && a.atividades)) setErro("Não consegui ler as visitas."); else if (v.falhou || f.falhou) setErro("Parte das vendas por representada não carregou — o cálculo usa a média da carteira para o que faltou.");
    }).catch(e => { if (vivo) setErro(String(e.message || e)); }).finally(() => { if (vivo) setLd(false); });
    return () => { vivo = false; }; }, [token, inicio]);

  const nrm = s => String(s || "").toLowerCase().trim();
  const carteiraBase = useMemo(() => (allOrgs || []).filter(o => !o.excluido && nrm(o.owner) === nrm(selUser.n)), [allOrgs, selUser.n]);
  const cidadeOpts = useMemo(() => [...new Set(carteiraBase.map(o => o.addr?.city_name || o.addr?.city).filter(Boolean))].sort(), [carteiraBase]);
  const carteira = useMemo(() => cidades.length ? carteiraBase.filter(o => cidades.includes(o.addr?.city_name || o.addr?.city)) : carteiraBase, [carteiraBase, cidades]);
  const vUser = useMemo(() => visitas.filter(v => String(v.user_id || "") === uidEf || nrm(v.user_nome) === nrm(selUser.n)), [visitas, uidEf, selUser.n]);
  const dataVendas = useMemo(() => { let m = ""; Object.values(rfv?.byCnpj || {}).forEach(r => { if (r.ultima && r.ultima > m) m = r.ultima; }); return m || null; }, [rfv]);
  const A = useMemo(() => analisar({ visitas: vUser, carteira, rfv, vendInd, fat12Ind, prem: { ...prem, inicio }, hoje, dataVendas }), [vUser, carteira, rfv, vendInd, fat12Ind, prem, inicio, hoje, dataVendas]);

  const ORDV = { "Rentável visitar": 0, "Aguardar": 1, "Atender a distância": 2, "Prospecção": 3 };
  const linhasF = useMemo(() => { let l = A.linhas;
    if (fSit) l = l.filter(x => x.situacao === fSit); if (fVer) l = l.filter(x => x.veredito === fVer); if (fDiag) l = l.filter(x => x.diagnostico === fDiag); if (fSau) l = l.filter(x => x.saude === fSau);
    const k = ord.k; return [...l].sort((a, b) => {
      if (k === "veredito") return ((ORDV[a.veredito] - ORDV[b.veredito]) || ((b.diasSem ?? 9999) - (a.diasSem ?? 9999))) * ord.d;
      const va = a[k], vb = b[k]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * ord.d; });
  }, [A, fSit, fVer, fDiag, fSau, ord]);
  const R = A.resumo; const saudeGeral = R.indice == null ? "—" : R.indice >= 1 ? "Saudável" : R.indice >= 0.5 ? "Atenção" : "Não se paga";
  const horasNaoPaga = A.linhas.filter(x => x.saude === "Não se paga").reduce((s, x) => s + x.horas, 0);
  const verTxt = x => x.veredito === "Aguardar" && x.aPartir ? `Aguardar · a partir de ${dCurta(x.aPartir)}` : x.veredito;

  const exportar = () => {
    const cab = ["CNPJ", "Cliente", "Cidade", "Bairro", "Status", "Segmento", "Classe", "Visitas", "Visitas/mês", "Visitas/mês ideal", "Última visita", "Dias sem visita", "Horas investidas", "Situação", "Vale nova visita?"];
    const rows = [isAdmin ? [...cab, "Diagnóstico", "Saúde", "Índice", "Faturamento 12m", "Vendido no período", "Última compra"] : cab];
    linhasF.forEach(x => { const b = [x.cnpj, x.nome, x.cidade, x.bairro, x.status, x.segmento, x.classe, x.visitas, n1(x.porMes), x.ideal, x.ultVis ? dBR(x.ultVis) : "", x.diasSem ?? "", n1(x.horas), x.situacao, verTxt(x)];
      rows.push(isAdmin ? [...b, x.diagnostico, x.saude, x.indice == null ? "" : n1(x.indice), Math.round(x.fat12m), Math.round(x.vendido), x.ultCompra ? dBR(x.ultCompra) : ""] : b); });
    csv(rows, `analise-visitas-${(selUser.n || "").split(" ")[0].toLowerCase()}-${hoje}.csv`); };

  const th = (k, l, right) => <th scope="col" onClick={() => setOrd(o => ({ k, d: o.k === k ? -o.d : (k === "veredito" || typeof A.linhas[0]?.[k] === "string" ? 1 : -1) }))} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: ord.k === k ? S.txt : S.t2, textAlign: right ? "right" : "left", borderBottom: `1px solid ${S.brd}`, cursor: "pointer", whiteSpace: "nowrap", position: "sticky", top: 0, background: S.cardSolid, zIndex: 1 }}>{l}{ord.k === k ? (ord.d > 0 ? " ↑" : " ↓") : ""}</th>;
  const td = { padding: "9px 10px", borderBottom: `1px solid ${S.brd}`, fontSize: 13.5, color: S.txt, verticalAlign: "top" };
  const tdn = { ...td, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, whiteSpace: "nowrap" };
  const filtrosAtivos = [fSit, fVer, fDiag, fSau].filter(Boolean);
  const pe = premEd || prem;
  const setPe = f => setPremEd(p => f(p || prem));

  return (<div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", color: S.txt }}>Visitas e carteira — {selUser.n}</h1>
        <p className="num" style={{ margin: "3px 0 0", fontSize: 12.5, color: S.ts }}>{dBR(inicio)} a {dBR(hoje)} · {n1(A.meses)} meses · {R.clientes} clientes na carteira</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isAdmin && <SearchSelect value={String(uid)} onChange={setUid} placeholder="Vendedor" style={{ width: 190 }} options={USERS.map(u => [String(u.id), u.n])} />}
        <DateField value={inicio} onChange={v => setDesde(v)} today={hoje} placeholder="Desde" style={{ width: 160 }} />
        <MultiSelect values={cidades} onChange={setCidades} placeholder="Cidade" allLabel="Todas" options={cidadeOpts} style={{ width: 190 }} />
      </div>
    </div>
    {ld && <p style={{ fontSize: 13, color: S.ts, margin: "0 0 10px" }}>Carregando visitas e vendas…</p>}
    {erro && <p style={{ fontSize: 13, color: S.dng, margin: "0 0 10px" }}>{erro}</p>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 14 }}>
      <Kpi k="Visitas realizadas" v={R.visitas} />
      <Kpi k="Dias em campo" v={R.diasCampo} />
      <Kpi k="Horas em campo" v={hm(R.horas)} />
      <Kpi k="Km rodado (est.)" v={Math.round(R.km)} u="km" />
      <Kpi k="Rentável visitar agora" v={A.linhas.filter(x => x.veredito === "Rentável visitar").length} u="clientes" />
      {isAdmin && <Kpi k="Vendido no período" v={brl(R.vendido)} />}
      {isAdmin && <Kpi k="Faturamento 12m" v={brl(R.fat12m)} />}
      {isAdmin && <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, color: S.t2, marginBottom: 6 }}>Valor da hora em campo</div>
        <div className="num" style={{ fontSize: 22, fontWeight: 600, color: S.txt, lineHeight: 1.1 }}>{A.valorHora ? brl(A.valorHora) : "—"}<span style={{ fontSize: 12, color: S.ts, fontWeight: 400 }}>/h</span></div>
        <div className="num" style={{ fontSize: 11.5, color: S.ts, marginTop: 3 }}>{A.pocaHora ? `pouca hora registrada · limite ${brl(A.limiteHora)}/h` : `limite rentável ${brl(A.limiteHora)}/h (${prem.limitePct}%)`}</div>
      </div>}
      {isAdmin && <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, color: S.t2, marginBottom: 6 }}>Saúde da operação</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: corDe(SAU, saudeGeral), lineHeight: 1.1 }}>{saudeGeral}</div>
        {R.indice != null && <div className="num" style={{ fontSize: 11.5, color: S.ts, marginTop: 3 }}>{n1(R.indice)}x o limite · horas até {dCurta(A.ateV)}</div>}
      </div>}
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <Quadro titulo="Vale uma nova visita?" sub="retorno esperado do cliente × horas que a visita consome" itens={VER} linhas={A.linhas} campo="veredito" ativo={fVer} onPick={setFVer} />
      <Quadro titulo="Situação das visitas" itens={SIT} linhas={A.linhas} campo="situacao" ativo={fSit} onPick={setFSit} />
      {isAdmin && <Quadro titulo="Diagnóstico de eficiência" itens={DIAG} linhas={A.linhas} campo="diagnostico" ativo={fDiag} onPick={setFDiag} />}
      {isAdmin && <Quadro titulo="Saúde do cliente (horas × retorno)" itens={SAU} linhas={A.linhas} campo="saude" ativo={fSau} onPick={setFSau}
        extra={<p className="num" style={{ margin: "8px 6px 0", fontSize: 12, color: S.ts }}>horas em clientes que não se pagam: {hm(horasNaoPaga)}</p>} />}
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", margin: "4px 0 8px" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.txt }}>Carteira <span className="num" style={{ fontSize: 13, fontWeight: 400, color: S.ts }}>{linhasF.length} de {A.linhas.length}</span></h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {filtrosAtivos.length > 0 && <button onClick={() => { setFSit(null); setFVer(null); setFDiag(null); setFSau(null); }} style={{ height: 36, padding: "0 12px", fontSize: 13 }}>Limpar ({filtrosAtivos.join(" · ")})</button>}
        <button onClick={exportar} style={{ height: 36, padding: "0 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Exportar</button>
      </div>
    </div>
    <div style={{ overflow: "auto", maxHeight: "70vh", border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, marginBottom: 16 }}>
      <table style={{ width: "100%", minWidth: isAdmin ? 1240 : 780, borderCollapse: "collapse" }}>
        <thead><tr>
          {th("nome", "Cliente")}{th("veredito", "Vale nova visita?")}{th("classe", "Classe")}{th("visitas", "Visitas", 1)}{th("porMes", "Por mês · ideal", 1)}{th("diasSem", "Última visita", 1)}{th("horas", "Horas", 1)}{th("situacao", "Situação")}
          {isAdmin && <>{th("diagnostico", "Diagnóstico")}{th("indice", "Saúde", 1)}{th("vendido", "Vendido período", 1)}{th("fat12m", "Fat. 12m", 1)}</>}
        </tr></thead>
        <tbody>{linhasF.map(x => <tr key={x.id}>
          <td style={{ ...td, minWidth: 220, maxWidth: 300 }}><button onClick={() => onOpenFicha && onOpenFicha(x.org)} style={{ border: "none", padding: 0, background: "transparent", color: S.txt, fontWeight: 600, fontSize: 13.5, textAlign: "left" }}>{x.nome}</button>
            <div style={{ fontSize: 12, color: S.ts }}>{[x.bairro, x.cidade].filter(Boolean).join(" · ")}{x.status ? " · " + x.status : ""}</div></td>
          <td style={{ ...td, color: corDe(VER, x.veredito), fontWeight: 600, whiteSpace: "nowrap" }}>{x.veredito}{x.veredito === "Aguardar" && x.aPartir && <div className="num" style={{ fontSize: 11.5, color: S.ts, fontWeight: 400 }}>a partir de {dCurta(x.aPartir)}</div>}</td>
          <td style={td}>{x.classe}</td>
          <td style={tdn}>{x.visitas}</td>
          <td style={{ ...tdn, color: x.porMes > x.ideal * prem.tolerancia ? S.gold : S.txt }}>{n1(x.porMes)} · {x.ideal}</td>
          <td style={{ ...tdn, color: x.situacao === "Visita atrasada" ? S.gold : x.situacao === "Sem visita" ? S.dng : S.txt }}>{x.ultVis ? `${x.diasSem}d` : "nunca"}<div style={{ fontSize: 11, color: S.ts }}>{x.ultVis ? dBR(x.ultVis) : ""}</div></td>
          <td style={tdn}>{x.horas ? hm(x.horas) : "—"}</td>
          <td style={{ ...td, color: corDe(SIT, x.situacao), whiteSpace: "nowrap" }}>{x.situacao}</td>
          {isAdmin && <>
            <td style={{ ...td, color: corDe(DIAG, x.diagnostico) }}>{x.diagnostico}</td>
            <td style={{ ...tdn, color: corDe(SAU, x.saude) }}>{x.saude}{x.indice != null && <div style={{ fontSize: 11, color: S.ts }}>{n1(x.indice)}x</div>}</td>
            <td style={tdn}>{x.vendido ? brl(x.vendido) : "—"}</td>
            <td style={tdn}>{x.fat12m ? brl(x.fat12m) : "—"}<div style={{ fontSize: 11, color: S.ts }}>{x.ultCompra ? "últ. " + dBR(x.ultCompra) : ""}</div></td>
          </>}
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

    {!isAdmin && <p style={{ fontSize: 12.5, color: S.ts, lineHeight: 1.5, margin: "4px 0 16px" }}>"Vale nova visita?" compara o retorno que o cliente costuma trazer com as horas que uma visita consome (com deslocamento). Aguardar = ainda é cedo; Atender a distância = o retorno não cobre visitas presenciais — use ligação/WhatsApp; Prospecção = ainda não compra.</p>}

    {isAdmin && <>
      <button onClick={() => { setPremAberta(v => !v); setPremEd(prem); }} aria-expanded={premAberta} style={{ width: "100%", height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: 14, fontWeight: 600, marginBottom: 8 }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><SlidersHorizontal size={15} />Premissas (só admin)</span>{premAberta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      {premAberta && <div style={{ border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: S.txt }}>Taxa média por representada (%)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
            {CONTAS.map(ind => <label key={ind} style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 12.5, color: S.t2 }}>{ROTULO_CONTA[ind] || ind}</span>
              <input type="number" step="0.01" value={pe.taxas[ind] ?? 5} onChange={e => setPe(p => ({ ...p, taxas: { ...p.taxas, [ind]: +e.target.value } }))} className="num" style={{ height: 40, boxSizing: "border-box" }} /></label>)}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: S.ts }}>Tramontina 4,16% e Pado 5% vêm dos extratos (out/25–jun/26); Pado 1,5% para Vale Formoso e Irmãos Domingos. Plastilit: tubos (categoria "Tubos") a 3% e o resto a 4% — a soma item a item dá o ponderado de cada pedido.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 12.5, color: S.t2 }}>Início do TeamCheck</span><DateField value={pe.inicio} onChange={v => setPe(p => ({ ...p, inicio: v }))} today={hoje} placeholder="Data" /></label>
          {[["limitePct", "Rentável a partir de (% do valor da hora)"], ["horaMin", "Valor da hora se faltar dado (R$/h)"], ["intervaloMaxPago", "Atender a distância se a visita só se paga a cada (dias)"], ["tolerancia", "Tolerância acima do ideal (x)"], ["fator", "Fator rodoviário (km)"]].map(([k, l]) => <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12.5, color: S.t2 }}>{l}</span>
            <input type="number" step="0.1" value={pe[k]} onChange={e => setPe(p => ({ ...p, [k]: +e.target.value }))} className="num" style={{ height: 42, boxSizing: "border-box" }} /></label>)}
        </div>
        <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", minWidth: 420 }}>
          <thead><tr>{["Classe", "Fat. médio mensal mínimo (R$)", "Visitas/mês ideal", "Intervalo máx. (dias)"].map(h => <th key={h} style={{ padding: "6px 8px", fontSize: 12, color: S.t2, textAlign: "left", fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>{pe.classes.map((c, i) => <tr key={c.c}><td style={{ padding: "4px 8px", fontSize: 13.5, color: S.txt }}>{c.c}</td>
            {["min", "ideal", "max"].map(f => <td key={f} style={{ padding: "4px 8px" }}><input type="number" value={c[f]} disabled={c.c === "Sem compra" && f === "min"} onChange={e => setPe(p => ({ ...p, classes: p.classes.map((x, j) => j === i ? { ...x, [f]: +e.target.value } : x) }))} className="num" style={{ width: 110, height: 38, boxSizing: "border-box" }} /></td>)}</tr>)}</tbody>
        </table></div>
        <p style={{ margin: 0, fontSize: 12, color: S.ts, lineHeight: 1.5 }}>Valor da hora = comissão estimada da carteira (vendas de cada representada × taxa) ÷ horas de campo, até a última venda carregada. Horas = jornada do dia (1º → último check-out) dividida pelas visitas do dia. Saúde = comissão gerada pelo cliente ÷ (horas investidas × limite). Vale nova visita = a comissão mensal esperada do cliente já cobre mais uma visita desde a última?</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={() => setPremEd({ ...PREMISSAS_PADRAO })} style={{ height: 40, padding: "0 12px", fontSize: 13.5 }}>Voltar ao padrão</button>
          <button onClick={() => salvaPrem(pe)} style={{ height: 40, padding: "0 16px", fontSize: 13.5, fontWeight: 600, background: S.pri, border: "none", color: "#fff" }}>Salvar e recalcular</button>
        </div>
      </div>}
    </>}
  </div>);
}
