// TeamCheck — Gestão › Análise de visitas (v76)
// Versão viva da planilha VISITAS_ALISSON. Admin vê tudo (valores, saúde, premissas).
// Vendedor vê a própria carteira SEM nenhum valor: só situação da visita e se vale investir uma nova visita.
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Download, SlidersHorizontal, Search, X } from "lucide-react";
import { S, USERS, API, DASH, todayLocal, csv, CC, CATS, CANAIS } from "../lib";
import { SearchSelect, MultiSelect, DateField, Kpi } from "../components";
import { analisar, PREMISSAS_PADRAO, CONTAS, ROTULO_CONTA, tramTaxasInfo } from "../analiseVisitas.js";
import { carregarBase, carregarPremissas, salvarPremissas } from "../analiseDados.js";
import { TRAM_GERADO } from "../tramTaxas.js";

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

function Quadro({ titulo, sub, itens, linhas, campo, ativos, onPick, extra }) {
  const tot = linhas.length || 1;
  return (<section style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "12px 14px", flex: "1 1 260px", minWidth: 0 }}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.txt }}>{titulo}</h3>
    {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: S.ts }}>{sub}</p>}
    <div style={{ marginTop: 6 }}>{itens.map(([l, c]) => { const n = linhas.filter(x => x[campo] === l).length; const on = (ativos || []).includes(l);
      return (<button key={l} onClick={() => onPick(l)} aria-pressed={on} style={{ width: "100%", display: "grid", gridTemplateColumns: "10px minmax(0,1fr) auto auto", gap: 10, alignItems: "center", padding: "8px 6px", minHeight: 40, border: "none", borderRadius: 6, background: on ? S.cl : "transparent", textAlign: "left" }}>
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
  // v83: admin escolhe um ou mais vendedores (nomes); vendedor vê só a própria carteira
  const [vends, setVends] = useState(() => isAdmin ? [(USERS.find(u => String(u.id) !== String(user?.id)) || USERS[0] || { n: "Alisson Henrique" }).n] : [user?.name]);
  const sels = useMemo(() => { const nomes = isAdmin ? (vends.length ? vends : USERS.map(u => u.n)) : [user?.name];
    return nomes.map(n => USERS.find(u => u.n === n) || { id: n === user?.name ? user?.id : null, n }); }, [vends, isAdmin, user?.name, user?.id]);
  const selUser = { n: sels.length === 1 ? sels[0].n : sels.length === USERS.length ? "Equipe" : sels.map(u => u.n.split(" ")[0]).join(" + ") };
  const [desde, setDesde] = useState(null);
  // v81: filtros como nas demais telas (busca + "Filtros · N" + etiquetas). Não mudam o cálculo, só o que aparece.
  const [q, setQ] = useState(""); const [filtAberto, setFiltAberto] = useState(false);
  const [fCid, setFCid] = useState([]); const [fCat, setFCat] = useState([]); const [fSeg, setFSeg] = useState([]); const [fCanal, setFCanal] = useState([]); const [fClasse, setFClasse] = useState([]);
  const [visitas, setVisitas] = useState([]); const [vendInd, setVendInd] = useState({}); const [fat12Ind, setFat12Ind] = useState({});
  const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fSit, setFSit] = useState([]); const [fVer, setFVer] = useState([]); const [fDiag, setFDiag] = useState([]); const [fSau, setFSau] = useState([]);
  const tog = set => v => set(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  const [ord, setOrd] = useState({ k: isAdmin ? "fat12m" : "veredito", d: isAdmin ? -1 : 1 }); const [verJornada, setVerJornada] = useState(false);
  const hoje = todayLocal(); const inicio = desde || prem.inicio;

  // premissas (KV, compartilhadas) e dados (cache de 10 min, o mesmo do Planejar e do balão)
  useEffect(() => { carregarPremissas().then(setPrem); }, []);
  const salvaPrem = async (p) => { setPrem(p); setPremEd(null); setPremAberta(false); try { await salvarPremissas(p); } catch (e) { alert("Não consegui salvar as premissas: " + e.message); } };
  useEffect(() => { if (!token) return; let vivo = true; setLd(true); setErro("");
    carregarBase(token, inicio, hoje).then(r => { if (!vivo) return;
      setVisitas(r.visitas); setVendInd(r.vendInd); setFat12Ind(r.fat12Ind);
      if (r.falhouVisitas) setErro("Não consegui ler as visitas."); else if (r.falhouVendas) setErro("Parte das vendas por representada não carregou — o cálculo usa a média da carteira para o que faltou.");
    }).catch(e => { if (vivo) setErro(String(e.message || e)); }).finally(() => { if (vivo) setLd(false); });
    return () => { vivo = false; }; }, [token, inicio]);

  const nrm = s => String(s || "").toLowerCase().trim();
  const nomesSel = sels.map(u => nrm(u.n));
  const carteiraBase = useMemo(() => (allOrgs || []).filter(o => !o.excluido && nomesSel.includes(nrm(o.owner))), [allOrgs, nomesSel.join("|")]);
  const cidadeOpts = useMemo(() => [...new Set(carteiraBase.map(o => o.addr?.city_name || o.addr?.city).filter(Boolean))].sort(), [carteiraBase]);
  const carteira = carteiraBase;
  const segOpts = useMemo(() => [...new Set(carteiraBase.map(o => o.sector).filter(Boolean))].sort(), [carteiraBase]);
  const dataVendas = useMemo(() => { let m = ""; Object.values(rfv?.byCnpj || {}).forEach(r => { if (r.ultima && r.ultima > m) m = r.ultima; }); return m || null; }, [rfv]);
  const ultimaEquipe = useMemo(() => { const m = {}; visitas.forEach(v => { const d = v.criado_em ? new Date(Date.parse(String(v.criado_em).replace(" ", "T") + "Z") - 4 * 3600000).toISOString().slice(0, 10) : null; if (d && v.org_id && (!m[v.org_id] || d > m[v.org_id])) m[v.org_id] = d; }); return m; }, [visitas]);
  // um cálculo por vendedor (jornada/hora são de cada um) e depois soma
  const A = useMemo(() => {
    const partes = sels.map(u => { const nu = nrm(u.n);
      const cart = carteiraBase.filter(o => nrm(o.owner) === nu);
      const vis = visitas.filter(v => (u.id != null && String(v.user_id || "") === String(u.id)) || nrm(v.user_nome) === nu);
      const r = analisar({ visitas: vis, carteira: cart, carteiraValor: cart, ultimaEquipe, rfv, vendInd, fat12Ind, prem: { ...prem, inicio }, hoje, dataVendas });
      return { u, r: { ...r, linhas: r.linhas.map(l => ({ ...l, vendedor: u.n })), dias: r.dias.map(d => ({ ...d, vendedor: u.n })) } }; });
    if (partes.length === 1) return partes[0].r;
    const soma = f => partes.reduce((t, x) => t + (f(x.r) || 0), 0);
    const h = soma(r => r.hJanela), com = soma(r => r.valorHora ? r.valorHora * r.hJanela : 0), custo = soma(r => r.hJanela * r.limiteHora);
    const base = partes[0].r;
    return { ...base, linhas: partes.flatMap(x => x.r.linhas), dias: partes.flatMap(x => x.r.dias).sort((a, b) => a.dia.localeCompare(b.dia) || a.vendedor.localeCompare(b.vendedor)),
      hJanela: h, valorHora: h > 0 ? com / h : null, limiteHora: h > 0 ? custo / h : base.limiteHora, pocaHora: h < 40, ateV: base.ateV,
      resumo: { visitas: soma(r => r.resumo.visitas), diasCampo: soma(r => r.resumo.diasCampo), horas: soma(r => r.resumo.horas), km: soma(r => r.resumo.km),
        fat12m: soma(r => r.resumo.fat12m), vendido: soma(r => r.resumo.vendido), clientes: soma(r => r.resumo.clientes), indice: custo > 0 ? com / custo : null } };
  }, [sels, carteiraBase, visitas, ultimaEquipe, rfv, vendInd, fat12Ind, prem, inicio, hoje, dataVendas]); // eslint-disable-line
  // vendas entram 1× por mês (carga do dia 1º): só avisa se a carga do mês não chegou até o dia 5
  const cargaAtrasada = !!dataVendas && dataVendas < hoje.slice(0, 7) + "-01" && Number(hoje.slice(8, 10)) > 5;

  const ORDV = { "Rentável visitar": 0, "Aguardar": 1, "Atender a distância": 2, "Prospecção": 3 };
  const norm = x => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // linhas que entram nos quadros: busca + filtros de cadastro
  const linhasBase = useMemo(() => { let l = A.linhas; const t = norm(q).replace(/[.\-\/]/g, "");
    if (t) l = l.filter(x => norm([x.nome, x.org?.legalName, x.cnpj, x.bairro, x.cidade, x.segmento].join(" ")).replace(/[.\-\/]/g, "").includes(t));
    if (fCid.length) l = l.filter(x => fCid.includes(x.cidade)); if (fCat.length) l = l.filter(x => fCat.includes(x.status));
    if (fSeg.length) l = l.filter(x => fSeg.includes(x.segmento)); if (fCanal.length) l = l.filter(x => fCanal.includes(x.org?.canal || "Presencial"));
    if (fClasse.length) l = l.filter(x => fClasse.includes(x.classe)); return l; }, [A, q, fCid, fCat, fSeg, fCanal, fClasse]);
  const linhasF = useMemo(() => { let l = linhasBase;
    if (fSit.length) l = l.filter(x => fSit.includes(x.situacao)); if (fVer.length) l = l.filter(x => fVer.includes(x.veredito));
    if (fDiag.length) l = l.filter(x => fDiag.includes(x.diagnostico)); if (fSau.length) l = l.filter(x => fSau.includes(x.saude));
    const k = ord.k; return [...l].sort((a, b) => {
      if (k === "veredito") return ((ORDV[a.veredito] - ORDV[b.veredito]) || ((b.diasSem ?? 9999) - (a.diasSem ?? 9999))) * ord.d;
      const va = a[k], vb = b[k]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * ord.d; });
  }, [linhasBase, fSit, fVer, fDiag, fSau, ord]);
  const chips = useMemo(() => { const out = []; const add = (arr, set, pref = "") => arr.forEach(v => out.push({ k: pref + v, l: pref + v, tira: () => set(a => a.filter(x => x !== v)) }));
    add(fCid, setFCid); add(fCat, setFCat); add(fSeg, setFSeg); add(fCanal, setFCanal); add(fClasse, setFClasse, "Classe "); add(fVer, setFVer); add(fSit, setFSit); add(fDiag, setFDiag); add(fSau, setFSau, "Saúde: ");
    return out; }, [fCid, fCat, fSeg, fCanal, fClasse, fVer, fSit, fDiag, fSau]);
  const limparFiltros = () => { setQ(""); [setFCid, setFCat, setFSeg, setFCanal, setFClasse, setFVer, setFSit, setFDiag, setFSau].forEach(f => f([])); };
  const R = A.resumo; const saudeGeral = R.indice == null ? "—" : R.indice >= 1 ? "Saudável" : R.indice >= 0.5 ? "Atenção" : "Não se paga";
  const horasNaoPaga = linhasBase.filter(x => x.saude === "Não se paga").reduce((s, x) => s + x.horas, 0);
  const verTxt = x => x.veredito === "Aguardar" && x.aPartir ? `Aguardar · a partir de ${dCurta(x.aPartir)}` : x.veredito;

  const exportar = () => {
    const cab = ["CNPJ", "Cliente", "Responsável", "Cidade", "Bairro", "Status", "Segmento", "Classe", "Visitas", "Visitas/mês", "Visitas/mês ideal", "Última visita", "Dias sem visita", "Horas investidas", "Situação", "Vale nova visita?"];
    const rows = [isAdmin ? [...cab, "Diagnóstico", "Saúde", "Índice", "Faturamento 12m", "Vendido no período", "Última compra"] : cab];
    linhasF.forEach(x => { const b = [x.cnpj, x.nome, x.vendedor || "", x.cidade, x.bairro, x.status, x.segmento, x.classe, x.visitas, n1(x.porMes), x.ideal, x.ultVis ? dBR(x.ultVis) : "", x.diasSem ?? "", n1(x.horas), x.situacao, verTxt(x)];
      rows.push(isAdmin ? [...b, x.diagnostico, x.saude, x.indice == null ? "" : n1(x.indice), Math.round(x.fat12m), Math.round(x.vendido), x.ultCompra ? dBR(x.ultCompra) : ""] : b); });
    csv(rows, `analise-visitas-${(selUser.n || "").split(" ")[0].toLowerCase()}-${hoje}.csv`); };

  const th = (k, l, right) => <th scope="col" onClick={() => setOrd(o => ({ k, d: o.k === k ? -o.d : (k === "veredito" || typeof A.linhas[0]?.[k] === "string" ? 1 : -1) }))} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: ord.k === k ? S.txt : S.t2, textAlign: right ? "right" : "left", borderBottom: `1px solid ${S.brd}`, cursor: "pointer", whiteSpace: "nowrap", position: "sticky", top: 0, background: S.cardSolid, zIndex: 1 }}>{l}{ord.k === k ? (ord.d > 0 ? " ↑" : " ↓") : ""}</th>;
  const td = { padding: "9px 10px", borderBottom: `1px solid ${S.brd}`, fontSize: 13.5, color: S.txt, verticalAlign: "top" };
  const tdn = { ...td, textAlign: "right", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, whiteSpace: "nowrap" };
  const pe = premEd || prem;
  const setPe = f => setPremEd(p => f(p || prem));

  return (<div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", color: S.txt }}>Visitas e carteira — {selUser.n}</h1>
        <p className="num" style={{ margin: "3px 0 0", fontSize: 12.5, color: S.ts }}>{dBR(inicio)} a {dBR(hoje)} · {n1(A.meses)} meses · {R.clientes} clientes na carteira</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isAdmin && <MultiSelect values={vends} onChange={setVends} placeholder="Vendedor" allLabel="Todos" style={{ width: 220 }} options={USERS.map(u => u.n)} />}
        <DateField value={inicio} onChange={v => setDesde(v)} today={hoje} placeholder="Desde" style={{ width: 160 }} />
      </div>
    </div>
    {ld && <p style={{ fontSize: 13, color: S.ts, margin: "0 0 10px" }}>Carregando visitas e vendas…</p>}
    {cargaAtrasada && <p style={{ fontSize: 13, color: S.gold, margin: "0 0 10px", padding: "8px 12px", border: `1px solid ${S.gold}55`, borderRadius: 8, background: S.gold + "12" }}>A carga mensal de vendas deste mês ainda não entrou — as vendas vão até {dBR(dataVendas)}. Atualize no Dashboard.</p>}
    {!cargaAtrasada && dataVendas && isAdmin && <p className="num" style={{ fontSize: 12, color: S.ts, margin: "0 0 10px" }}>vendas até {dBR(dataVendas)} · próxima carga no dia 1º</p>}
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

    <div style={{ display: "flex", alignItems: "center", gap: 10, background: S.card, border: `1px solid ${S.brd}`, borderRadius: 8, padding: "0 12px", height: 46, marginBottom: 10 }}>
      <Search size={17} strokeWidth={1.8} color="var(--t3)" style={{ flexShrink: 0 }} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cliente, CNPJ, bairro, cidade, segmento" aria-label="Buscar cliente" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", padding: 0, fontSize: 15 }} />
      {q && <button onClick={() => setQ("")} aria-label="Limpar busca" style={{ border: "none", padding: 4, color: S.ts, display: "flex" }}><X size={16} /></button>}
    </div>
    <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", paddingBottom: 2, marginBottom: filtAberto ? 10 : 12 }}>
      <button onClick={() => setFiltAberto(v => !v)} aria-expanded={filtAberto} style={{ flexShrink: 0, height: 36, padding: "0 12px", borderRadius: 18, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, border: `1px solid ${filtAberto || chips.length ? S.txt : S.inpBdr}`, background: filtAberto || chips.length ? S.txt : "transparent", color: filtAberto || chips.length ? S.bg : S.txt }}><SlidersHorizontal size={14} strokeWidth={2} />Filtros{chips.length ? ` · ${chips.length}` : ""}</button>
      {chips.map(c => <button key={c.k} onClick={c.tira} title="Remover filtro" style={{ flexShrink: 0, height: 36, padding: "0 10px 0 12px", borderRadius: 18, display: "flex", alignItems: "center", gap: 6, fontSize: 13, border: `1px solid ${S.inpBdr}`, background: "transparent", color: S.txt, whiteSpace: "nowrap" }}>{c.l}<X size={12} strokeWidth={2.2} color="var(--t3)" /></button>)}
      {(chips.length > 1 || q) && <button onClick={limparFiltros} style={{ flexShrink: 0, height: 36, padding: "0 8px", border: "none", background: "transparent", color: S.ts, fontSize: 13 }}>Limpar</button>}
    </div>
    {filtAberto && <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: 12, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
        <MultiSelect values={fVer} onChange={setFVer} placeholder="Vale nova visita?" allLabel="Todos" options={VER.map(x => x[0])} />
        <MultiSelect values={fSit} onChange={setFSit} placeholder="Situação" allLabel="Todas" options={SIT.map(x => x[0])} />
        <MultiSelect values={fCid} onChange={setFCid} placeholder="Cidade" allLabel="Todas" options={cidadeOpts} />
        <MultiSelect values={fCat} onChange={setFCat} placeholder="Status" allLabel="Todos" colorFor={c => CC[c] || S.pri} options={CATS} />
        <MultiSelect values={fSeg} onChange={setFSeg} placeholder="Segmento" allLabel="Todos" options={segOpts} />
        <MultiSelect values={fCanal} onChange={setFCanal} placeholder="Canal" allLabel="Todos" options={CANAIS} />
        <MultiSelect values={fClasse} onChange={setFClasse} placeholder="Classe" allLabel="Todas" options={["A", "B", "C", "Sem compra"]} />
        {isAdmin && <MultiSelect values={fDiag} onChange={setFDiag} placeholder="Diagnóstico" allLabel="Todos" options={DIAG.map(x => x[0])} />}
        {isAdmin && <MultiSelect values={fSau} onChange={setFSau} placeholder="Saúde" allLabel="Todas" options={SAU.map(x => x[0])} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button onClick={limparFiltros} style={{ height: 40, padding: "0 14px", fontSize: 13.5, color: S.t2 }}>Limpar tudo</button>
        <button onClick={() => setFiltAberto(false)} style={{ height: 40, padding: "0 18px", fontSize: 13.5, fontWeight: 600, background: S.pri, border: "none", color: "#fff" }}>Ver {linhasF.length} clientes</button>
      </div>
    </div>}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <Quadro titulo="Vale uma nova visita?" sub="retorno esperado do cliente × horas que a visita consome" itens={VER} linhas={linhasBase} campo="veredito" ativos={fVer} onPick={tog(setFVer)} />
      <Quadro titulo="Situação das visitas" itens={SIT} linhas={linhasBase} campo="situacao" ativos={fSit} onPick={tog(setFSit)} />
      {isAdmin && <Quadro titulo="Diagnóstico de eficiência" itens={DIAG} linhas={linhasBase} campo="diagnostico" ativos={fDiag} onPick={tog(setFDiag)} />}
      {isAdmin && <Quadro titulo="Saúde do cliente (horas × retorno)" itens={SAU} linhas={linhasBase} campo="saude" ativos={fSau} onPick={tog(setFSau)}
        extra={<p className="num" style={{ margin: "8px 6px 0", fontSize: 12, color: S.ts }}>horas em clientes que não se pagam: {hm(horasNaoPaga)}</p>} />}
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", margin: "4px 0 8px" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.txt }}>Carteira <span className="num" style={{ fontSize: 13, fontWeight: 400, color: S.ts }}>{linhasF.length} de {A.linhas.length}</span></h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={exportar} style={{ height: 36, padding: "0 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Exportar</button>
      </div>
    </div>
    <div style={{ overflow: "auto", maxHeight: "70vh", border: `1px solid ${S.brd}`, borderRadius: 10, background: S.card, marginBottom: 16 }}>
      <table style={{ width: "100%", minWidth: isAdmin ? 1240 : 780, borderCollapse: "collapse" }}>
        <thead><tr>
          {th("nome", "Cliente")}{sels.length > 1 && th("vendedor", "Responsável")}{th("veredito", "Vale nova visita?")}{th("classe", "Classe")}{th("visitas", "Visitas", 1)}{th("porMes", "Por mês · ideal", 1)}{th("diasSem", "Última visita", 1)}{th("horas", "Horas", 1)}{th("situacao", "Situação")}
          {isAdmin && <>{th("diagnostico", "Diagnóstico")}{th("indice", "Saúde", 1)}{th("vendido", "Vendido período", 1)}{th("fat12m", "Fat. 12m", 1)}</>}
        </tr></thead>
        <tbody>{linhasF.map(x => <tr key={x.id}>
          <td style={{ ...td, minWidth: 220, maxWidth: 300 }}><button onClick={() => onOpenFicha && onOpenFicha(x.org)} style={{ border: "none", padding: 0, background: "transparent", color: S.txt, fontWeight: 600, fontSize: 13.5, textAlign: "left" }}>{x.nome}</button>
            <div style={{ fontSize: 12, color: S.ts }}>{[x.bairro, x.cidade].filter(Boolean).join(" · ")}{x.status ? " · " + x.status : ""}</div></td>
          {sels.length > 1 && <td style={{ ...td, whiteSpace: "nowrap" }}>{(x.vendedor || "").split(" ")[0]}</td>}
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
        <thead><tr>{[...(sels.length > 1 ? ["Vendedor"] : []), "Data", "Dia", "Visitas", "Check-outs", "Início", "Fim", "Horas", "Km (est.)"].map((h, i) => <th key={h} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 600, color: S.t2, textAlign: i > (sels.length > 1 ? 2 : 1) ? "right" : "left", borderBottom: `1px solid ${S.brd}` }}>{h}</th>)}</tr></thead>
        <tbody>{[...A.dias].reverse().map(d => <tr key={d.dia + (d.vendedor || "")} style={{ opacity: d.visitas ? 1 : 0.6 }}>
          {sels.length > 1 && <td style={td}>{(d.vendedor || "").split(" ")[0]}</td>}
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
          <p style={{ margin: "6px 0 0", fontSize: 12, color: S.ts }}>Tramontina 4,16% e Pado 5% vêm dos extratos (out/25–jun/26); Pado 1,5% para Vale Formoso e Irmãos Domingos. Plastilit: tubos (categoria "Tubos") a 3% e o resto a 4% — a soma item a item dá o ponderado de cada pedido. Tramontina: usa a taxa real de cada cliente nos extratos quando existe ({(() => { const t = tramTaxasInfo(); const mm = x => x ? x.split("-").reverse().join("/") : "?"; return t ? `${t.total} clientes, extratos ${mm(t.desde)} a ${mm(t.ate)}, atualiza sozinho a cada extrato novo` : `152 clientes, foto de ${TRAM_GERADO.split("-").reverse().join("/")}`; })()}); os demais, a média acima.</p>
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
