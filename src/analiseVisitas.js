// TeamCheck — motor da Análise de Visitas (v75)
// Mesma régua da planilha "VISITAS_ALISSON" (Resumo / Jornada / Carteira / Premissas), com uma troca
// pedida pelo Jordan: o custo da operação é medido em HORAS investidas no cliente (não por visita) e a
// tela nunca mostra valores de comissão — só o índice de saúde (comissão estimada do vendido ÷ custo das horas).
//
// Função pura (sem React/fetch) para poder ser conferida contra a planilha fora do app.

export const PREMISSAS_PADRAO = {
  inicio: "2026-07-04",          // início da implantação do TeamCheck (planilha: Premissas!B3)
  custoHora: 88,                 // R$ por hora de campo — planilha: R$ 80 por visita ÷ 0,91 h por visita (média real do período)
  comissao: 5,                   // % médio sobre a venda — só entra no índice de saúde, nunca aparece na tela de análise
  tolerancia: 1.5,               // "excesso de visitas" = acima de ideal × tolerância
  fator: 1.3,                    // km real ÷ linha reta
  cnpjEscritorio: "44185799000103",
  classes: [                     // faturamento médio mensal mínimo → visitas/mês ideal e intervalo máximo
    { c: "A", min: 2000, ideal: 3, max: 10 },
    { c: "B", min: 800, ideal: 2, max: 15 },
    { c: "C", min: 0.01, ideal: 1, max: 30 },
    { c: "Sem compra", min: 0, ideal: 1, max: 45 },
  ],
};

const DIA_MS = 86400000;
const soDig = x => String(x || "").replace(/\D/g, "");
// D1 grava "YYYY-MM-DD HH:MM:SS" em UTC sem fuso
export const msD1 = s => { const t = String(s || ""); if (!t) return NaN; return Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(t) ? t : t.replace(" ", "T") + "Z"); };
// dia/hora em Cuiabá (UTC−4, sem horário de verão)
export const diaCba = ms => new Date(ms - 4 * 3600000).toISOString().slice(0, 10);
export const horaCba = ms => new Date(ms - 4 * 3600000).toISOString().slice(11, 16);
const hav = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const diffDias = (a, b) => Math.round((Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / DIA_MS);

export function classeDe(fatMes, prem) {
  if (!(fatMes > 0)) return prem.classes.find(k => k.c === "Sem compra");
  return prem.classes.filter(k => k.c !== "Sem compra").sort((a, b) => b.min - a.min).find(k => fatMes >= k.min) || prem.classes[2];
}

export const SAUDE = [
  { id: "saudavel", l: "Saudável", min: 1 },
  { id: "atencao", l: "Atenção", min: 0.5 },
  { id: "naopaga", l: "Não se paga", min: -Infinity },
];

/**
 * @param visitas   check-outs [{org_id,cnpj,org_nome,criado_em,lat,lng}] do vendedor (origem checkout, tipo VISITA)
 * @param carteira  clientes do vendedor [{id,name,cnpj,cat,sector,addr}]
 * @param rfv       {byCnpj:{cnpj14:{fat12m,ultima}}, byOrg:{}}
 * @param vendido   {cnpj14: valor vendido de inicio até hoje}
 * @param hoje      "YYYY-MM-DD" (data de referência)
 */
export function analisar({ visitas, carteira, rfv, vendido, prem = PREMISSAS_PADRAO, hoje }) {
  const P = { ...PREMISSAS_PADRAO, ...prem };
  const esc = soDig(P.cnpjEscritorio);
  const ini = P.inicio;
  const vs = (visitas || []).map(v => { const ms = msD1(v.criado_em); return { ...v, ms, dia: diaCba(ms), cn: soDig(v.cnpj).padStart(14, "0"),
      escritorio: soDig(v.cnpj) === esc || /JORDAN REPRESENTA/i.test(v.org_nome || "") }; })
    .filter(v => !isNaN(v.ms) && v.dia >= ini && v.dia <= hoje).sort((a, b) => a.ms - b.ms);

  // ── Jornada por dia (1º → último check-out; o do escritório fecha a jornada, mas não é visita) ──
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
  const mediaH = vComH ? hTot / vComH : 1;                       // horas por visita (inclui deslocamento)
  const hDia = new Map(dias.map(d => [d.dia, d.visitas ? (d.horas > 0 ? d.horas / d.visitas : mediaH) : 0]));

  // ── visitas por cliente (casa por org_id e, na falta, CNPJ) ──
  const vCli = vs.filter(v => !v.escritorio);
  const meses = Math.max(diffDias(hoje, ini), 1) / 30.44;      // planilha: (ref − início) / 30,44
  const custoVisita = P.custoHora * mediaH;
  const rfvDe = o => { const k = soDig(o.cnpj).padStart(14, "0"); return (rfv && (rfv.byCnpj?.[k] || rfv.byOrg?.[o.id])) || null; };

  const linhas = (carteira || []).map(o => {
    const cn = soDig(o.cnpj).padStart(14, "0");
    const mv = vCli.filter(v => (v.org_id && String(v.org_id) === String(o.id)) || (soDig(o.cnpj) && v.cn === cn));
    const r = rfvDe(o); const fat12m = r ? +r.fat12m || 0 : 0; const fatMes = fat12m / 12;
    const k = classeDe(fatMes, P);
    const nVis = mv.length, porMes = nVis / meses;
    const ultVis = nVis ? mv[mv.length - 1].dia : null; const diasSem = ultVis ? diffDias(hoje, ultVis) : null;
    const horas = mv.reduce((s, v) => s + (hDia.get(v.dia) || mediaH), 0);
    const vend = +(vendido?.[cn] || 0);
    const quePagam = custoVisita > 0 ? fatMes * (P.comissao / 100) / custoVisita : 0;
    const situacao = !nVis ? "Sem visita" : diasSem > k.max ? "Visita atrasada" : "Em dia";
    const diagnostico = !nVis ? (k.c === "Sem compra" ? "Prospectar / avaliar" : "Priorizar visita")
      : (porMes > k.ideal * P.tolerancia && porMes > quePagam) ? "Excesso de visitas"
      : porMes > quePagam ? "Visitas acima do retorno"
      : diasSem > k.max ? "Retomar frequência" : "Adequado";
    const indice = horas > 0 ? (vend * P.comissao / 100) / (horas * P.custoHora) : null;
    const saude = indice == null ? "Sem visita" : (SAUDE.find(s => indice >= s.min) || SAUDE[2]).l;
    return { id: o.id, org: o, nome: o.nickname || o.name, cnpj: cn, cidade: o.addr?.city_name || o.addr?.city || "", bairro: o.addr?.district || "", status: o.cat || "",
      segmento: o.sector || "", fat12m, fatMes, classe: k.c, ideal: k.ideal, max: k.max, visitas: nVis, porMes, ultVis, diasSem, horas, vendido: vend,
      ultCompra: r?.ultima || null, quePagam, situacao, diagnostico, indice, saude };
  });

  const soma = (l, f) => l.reduce((s, x) => s + (f(x) || 0), 0);
  const horasCarteira = soma(linhas, x => x.horas), vendCarteira = soma(linhas, x => x.vendido);
  return {
    premissas: P, meses, mediaH, dias,
    resumo: {
      visitas: vCli.length, diasCampo: diasCampo.length, horas: hTot, km: soma(dias, d => d.km),
      fat12m: soma(linhas, x => x.fat12m), vendido: vendCarteira, clientes: linhas.length,
      clientesVisitados: linhas.filter(x => x.visitas).length,
      indice: horasCarteira > 0 ? (vendCarteira * P.comissao / 100) / (horasCarteira * P.custoHora) : null,
    },
    linhas,
  };
}
