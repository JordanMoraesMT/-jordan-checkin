// TeamCheck — motor da Análise de Visitas (v76)
// Régua da planilha "VISITAS_ALISSON" (Resumo / Jornada / Carteira / Premissas) com as trocas pedidas pelo Jordan:
//  • custo medido em HORAS investidas no cliente (não por visita);
//  • retorno = comissão estimada POR REPRESENTADA (taxa de cada indústria × o que o cliente comprou dela);
//  • o "valor da hora" sai dos próprios dados: comissão gerada ÷ horas de campo do vendedor;
//  • quem não é admin só vê o veredito (rentável / aguardar / não rentável), nunca valores.
// Função pura (sem React/fetch) — conferível fora do app.

export const INDUSTRIAS = ["TRAMONTINA", "PADO", "Zagonel", "Plastilit", "Santana", "Festcolor", "Ruvolo", "Hiper Têxtil"];

export const PREMISSAS_PADRAO = {
  inicio: "2026-07-04",          // início da implantação do TeamCheck
  // Taxa média de comissão por representada (%). Tramontina e Pado = taxa REAL dos extratos (out/25–jun/26):
  // Tramontina 4,16% efetivo (linhas de 3% a 6%); Pado 5% (exceções abaixo). Demais: 5% até ter extrato/motor.
  taxas: { TRAMONTINA: 4.16, PADO: 5, Zagonel: 5, Plastilit: 5, Santana: 5, Festcolor: 5, Ruvolo: 5, "Hiper Têxtil": 5 },
  excecoes: [{ ind: "PADO", razao: "VALE FORMOSO|IRMAOS DOMINGOS|IRMÃOS DOMINGOS", taxa: 1.5 }],
  limitePct: 65,                 // cliente rentável = rende ≥ 65% do valor médio da hora do vendedor
  horaMin: 88,                   // reserva quando o vendedor tem pouca hora registrada (< 40 h): R$ 80/visita ÷ 0,91 h
  intervaloMaxPago: 120,         // se nem 1 visita a cada 120 dias se paga → atender a distância
  tolerancia: 1.5,
  fator: 1.3,
  cnpjEscritorio: "44185799000103",
  classes: [
    { c: "A", min: 2000, ideal: 3, max: 10 },
    { c: "B", min: 800, ideal: 2, max: 15 },
    { c: "C", min: 0.01, ideal: 1, max: 30 },
    { c: "Sem compra", min: 0, ideal: 1, max: 45 },
  ],
};

const DIA_MS = 86400000;
const soDig = x => String(x || "").replace(/\D/g, "");
const k14 = x => soDig(x).padStart(14, "0");
export const msD1 = s => { const t = String(s || ""); if (!t) return NaN; return Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(t) ? t : t.replace(" ", "T") + "Z"); };
export const diaCba = ms => new Date(ms - 4 * 3600000).toISOString().slice(0, 10);
export const horaCba = ms => new Date(ms - 4 * 3600000).toISOString().slice(11, 16);
export const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const diffDias = (a, b) => Math.round((Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / DIA_MS);
const somaDias = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + Math.round(n) * DIA_MS).toISOString().slice(0, 10);

export function classeDe(fatMes, prem) {
  if (!(fatMes > 0)) return prem.classes.find(k => k.c === "Sem compra");
  return prem.classes.filter(k => k.c !== "Sem compra").sort((a, b) => b.min - a.min).find(k => fatMes >= k.min) || prem.classes[2];
}
// taxa (%) de uma indústria para um cliente (aplica exceções por razão social)
export function taxaDe(ind, org, P) {
  const ex = (P.excecoes || []).find(e => e.ind === ind && new RegExp(e.razao, "i").test(`${org?.legalName || ""} ${org?.name || ""}`));
  return ex ? ex.taxa : (P.taxas?.[ind] ?? 5);
}
// comissão estimada de um cliente sobre {industria: valor}
export const comissaoDe = (porInd, org, P) => Object.entries(porInd || {}).reduce((s, [ind, v]) => s + (+v || 0) * taxaDe(ind, org, P) / 100, 0);

export const SAUDE = ["Saudável", "Atenção", "Não se paga", "Sem visita"];
export const VEREDITO = ["Rentável visitar", "Aguardar", "Atender a distância", "Prospecção"];

/**
 * @param visitas  check-outs [{org_id,cnpj,org_nome,criado_em,lat,lng}] do vendedor
 * @param carteira clientes do vendedor
 * @param vendInd  {cnpj14: {industria: valor vendido de início até a última carga}}
 * @param fat12Ind {cnpj14: {industria: valor dos últimos 12 meses}}
 * @param dataVendas "YYYY-MM-DD" — última venda carregada (horas do retorno contam só até aqui)
 */
export function analisar({ visitas, carteira, vendInd, fat12Ind, rfv, prem = PREMISSAS_PADRAO, hoje, dataVendas }) {
  const P = { ...PREMISSAS_PADRAO, ...prem, taxas: { ...PREMISSAS_PADRAO.taxas, ...(prem?.taxas || {}) } };
  const esc = soDig(P.cnpjEscritorio), ini = P.inicio, ateV = dataVendas && dataVendas < hoje ? dataVendas : hoje;
  const vs = (visitas || []).map(v => { const ms = msD1(v.criado_em); return { ...v, ms, dia: diaCba(ms), cn: k14(v.cnpj),
      escritorio: soDig(v.cnpj) === esc || /JORDAN REPRESENTA/i.test(v.org_nome || "") }; })
    .filter(v => !isNaN(v.ms) && v.dia >= ini && v.dia <= hoje).sort((a, b) => a.ms - b.ms);

  // ── jornada por dia (1º → último check-out; o do escritório fecha a jornada, mas não é visita) ──
  const porDia = new Map();
  for (const v of vs) { if (!porDia.has(v.dia)) porDia.set(v.dia, []); porDia.get(v.dia).push(v); }
  const dias = [...porDia.entries()].map(([dia, l]) => {
    const cli = l.filter(v => !v.escritorio);
    const horas = l.length > 1 ? (l[l.length - 1].ms - l[0].ms) / 3600000 : 0;
    let km = 0; for (let i = 1; i < l.length; i++) { const a = l[i - 1], b = l[i]; if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) km += hav(+a.lat, +a.lng, +b.lat, +b.lng) * P.fator; }
    return { dia, dow: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(dia + "T12:00:00Z").getUTCDay()], visitas: cli.length, checkouts: l.length,
      inicio: horaCba(l[0].ms), fim: horaCba(l[l.length - 1].ms), horas, km };
  });
  const diasCampo = dias.filter(d => d.visitas > 0);
  const hTot = diasCampo.reduce((s, d) => s + (d.horas > 0 ? d.horas : 0), 0);
  const vComH = diasCampo.reduce((s, d) => s + (d.horas > 0 ? d.visitas : 0), 0);
  const mediaH = vComH ? hTot / vComH : 1;
  const hDia = new Map(dias.map(d => [d.dia, d.visitas ? (d.horas > 0 ? d.horas / d.visitas : mediaH) : 0]));
  const vCli = vs.filter(v => !v.escritorio);
  const meses = Math.max(diffDias(hoje, ini), 1) / 30.44;

  // ── valor da hora do vendedor = comissão gerada pela carteira ÷ horas de campo (mesma janela das vendas) ──
  const hJanela = diasCampo.filter(d => d.dia <= ateV).reduce((s, d) => s + d.visitas * (hDia.get(d.dia) || 0), 0);
  const comJanela = (carteira || []).reduce((s, o) => s + comissaoDe(vendInd?.[k14(o.cnpj)], o, P), 0);
  const valorHora = hJanela > 0 ? comJanela / hJanela : null;
  const pocaHora = hJanela < 40;
  const limiteHora = !pocaHora && valorHora ? valorHora * P.limitePct / 100 : P.horaMin;
  const custoVisita = limiteHora * mediaH;

  const rfvDe = o => (rfv && (rfv.byCnpj?.[k14(o.cnpj)] || rfv.byOrg?.[o.id])) || null;
  // taxa média ponderada da própria carteira — só para cliente sem detalhe por indústria (ex.: rota de vendas fora do ar)
  let fB = 0, cB = 0; (carteira || []).forEach(o => { const f = fat12Ind?.[k14(o.cnpj)]; if (f) { fB += Object.values(f).reduce((s, v) => s + (+v || 0), 0); cB += comissaoDe(f, o, P); } });
  const taxaMedia = fB > 0 ? cB / fB : (P.taxas.TRAMONTINA + P.taxas.PADO) / 200;
  const linhas = (carteira || []).map(o => {
    const cn = k14(o.cnpj);
    const mv = vCli.filter(v => (v.org_id && String(v.org_id) === String(o.id)) || (soDig(o.cnpj) && v.cn === cn));
    const f12 = fat12Ind?.[cn] || {}; const fat12m = Object.values(f12).reduce((s, v) => s + (+v || 0), 0) || (+rfvDe(o)?.fat12m || 0);
    const fatMes = fat12m / 12; const k = classeDe(fatMes, P);
    const nVis = mv.length, porMes = nVis / meses;
    const ultVis = nVis ? mv[mv.length - 1].dia : null; const diasSem = ultVis ? diffDias(hoje, ultVis) : null;
    const horas = mv.reduce((s, v) => s + (hDia.get(v.dia) || mediaH), 0);
    const horasJanela = mv.filter(v => v.dia <= ateV).reduce((s, v) => s + (hDia.get(v.dia) || mediaH), 0);
    const vendido = Object.values(vendInd?.[cn] || {}).reduce((s, v) => s + (+v || 0), 0);
    const comGerada = comissaoDe(vendInd?.[cn], o, P);
    const comMes = Object.keys(f12).length ? comissaoDe(f12, o, P) / 12 : fatMes * taxaMedia;
    const quePagam = custoVisita > 0 ? comMes / custoVisita : 0;          // visitas/mês que se pagam
    const intervaloPago = quePagam > 0 ? 30.44 / quePagam : Infinity;     // dias entre visitas para se pagar
    const situacao = !nVis ? "Sem visita" : diasSem > k.max ? "Visita atrasada" : "Em dia";
    const diagnostico = !nVis ? (k.c === "Sem compra" ? "Prospectar / avaliar" : "Priorizar visita")
      : (porMes > k.ideal * P.tolerancia && porMes > quePagam) ? "Excesso de visitas"
      : porMes > quePagam ? "Visitas acima do retorno"
      : diasSem > k.max ? "Retomar frequência" : "Adequado";
    const indice = horasJanela > 0 ? comGerada / (horasJanela * limiteHora) : null;
    const saude = indice == null ? "Sem visita" : indice >= 1 ? "Saudável" : indice >= 0.5 ? "Atenção" : "Não se paga";
    // veredito para a PRÓXIMA visita (o que o vendedor vê)
    let veredito, aPartir = null;
    if (!(fat12m > 0)) veredito = "Prospecção";
    else if (intervaloPago > P.intervaloMaxPago) veredito = "Atender a distância";
    else { const prox = Math.max(intervaloPago, 0); if (!ultVis || diasSem >= prox) veredito = "Rentável visitar"; else { veredito = "Aguardar"; aPartir = somaDias(ultVis, prox); } }
    return { id: o.id, org: o, nome: o.nickname || o.name, cnpj: cn, cidade: o.addr?.city_name || o.addr?.city || "", bairro: o.addr?.district || "", status: o.cat || "",
      segmento: o.sector || "", fat12m, fatMes, classe: k.c, ideal: k.ideal, max: k.max, visitas: nVis, porMes, ultVis, diasSem, horas, vendido,
      ultCompra: rfvDe(o)?.ultima || null, quePagam, intervaloPago, situacao, diagnostico, indice, saude, veredito, aPartir };
  });

  const soma = (l, f) => l.reduce((s, x) => s + (f(x) || 0), 0);
  return {
    premissas: P, meses, mediaH, dias, valorHora, limiteHora, pocaHora, hJanela, ateV, taxaMedia,
    resumo: {
      visitas: vCli.length, diasCampo: diasCampo.length, horas: hTot, km: soma(dias, d => d.km),
      fat12m: soma(linhas, x => x.fat12m), vendido: soma(linhas, x => x.vendido), clientes: linhas.length,
      indice: hJanela > 0 ? comJanela / (hJanela * limiteHora) : null,
    },
    linhas,
  };
}

/** Sugestão de próxima visita perto do cliente recém-visitado (balão do check-out).
 *  Usa só dados que o app já tem: GPS dos PDVs, última visita (qualquer usuário), RFV e status de recompra. */
export function sugerirProxima({ origem, orgs, plocs, visits, rfv, excluirId, raioKm = 4, hoje, prem = PREMISSAS_PADRAO }) {
  if (!origem || origem.lat == null) return [];
  const ult = {}; (visits || []).forEach(v => { if (v.checkoutTime && (!ult[v.orgId] || v.checkinTime > ult[v.orgId])) ult[v.orgId] = v.checkinTime; });
  const out = [];
  for (const o of orgs || []) {
    if (o.id === excluirId || o.excluido) continue;
    const g = plocs?.[o.id]; if (!g || g.lat == null) continue;
    const km = hav(origem.lat, origem.lng, +g.lat, +g.lng); if (km > raioKm) continue;
    const r = (rfv && (rfv.byCnpj?.[k14(o.cnpj)] || rfv.byOrg?.[o.id])) || null;
    const fat12m = +r?.fat12m || 0; if (!(fat12m > 0)) continue;              // só quem já compra (potencial comprovado)
    const k = classeDe(fat12m / 12, prem);
    const uv = ult[o.id] ? diaCba(Date.parse(ult[o.id])) : null; const dSem = uv ? diffDias(hoje, uv) : null;
    if (dSem != null && dSem < Math.min(k.max, 15)) continue;                    // visitado há pouco
    let score = Math.log10(fat12m + 10) * 10;
    if (r?.status === "Atrasado") score += 25; else if (r?.status === "Momento de Recompra") score += 18;
    if (dSem == null) score += 15; else if (dSem > k.max) score += Math.min(20, (dSem - k.max) / 2);
    score -= km * 3;
    out.push({ org: o, km, dSem, classe: k.c, recompra: r?.status || null, rfv: r?.rfv || null, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}
