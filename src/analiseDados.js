// TeamCheck — carga compartilhada da Análise de visitas (v79)
// Uma só leitura (com cache de 10 min) serve a Análise, o Rotas › Planejar, o cartão da semana e o balão "perto daqui".
import { API, DASH } from "./lib";
import { INDUSTRIAS, PREMISSAS_PADRAO } from "./analiseVisitas.js";

const k14 = x => String(x || "").replace(/\D/g, "").padStart(14, "0");
const mesMenos = (ym, n) => { const [y, m] = ym.split("-").map(Number); const t = y * 12 + (m - 1) - n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, "0")}`; };
const DEZ_MIN = 10 * 60 * 1000;
let cacheBase = null, cachePrem = null;

export function carregarPremissas(forcar = false) {
  if (cachePrem && !forcar && Date.now() - cachePrem.t < DEZ_MIN) return cachePrem.p;
  const p = fetch(`${API}?sync=analisePremissas`).then(r => r.json()).then(d => d && d.active && d.active.inicio
    ? { ...PREMISSAS_PADRAO, ...d.active, taxas: { ...PREMISSAS_PADRAO.taxas, ...(d.active.taxas || {}) } } : PREMISSAS_PADRAO).catch(() => PREMISSAS_PADRAO);
  cachePrem = { t: Date.now(), p }; return p;
}
export async function salvarPremissas(p) {
  cachePrem = { t: Date.now(), p: Promise.resolve(p) };
  await fetch(`${API}?sync=analisePremissas`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: p }) });
}

/** check-outs desde o início + vendas por cliente×representada (período e 12 meses) */
export function carregarBase(token, inicio, hoje) {
  const chave = `${inicio}|${hoje}`;
  if (cacheBase && cacheBase.chave === chave && Date.now() - cacheBase.t < DEZ_MIN) return cacheBase.p;
  const H = { headers: { "X-Session": token }, cache: "no-store" };
  const pIni = inicio.slice(0, 7), pFim = hoje.slice(0, 7), p12 = mesMenos(pFim, 11);
  // 1 consulta por indústria + Plastilit só tubos (taxa própria); "Plastilit" = total − tubos
  const consultas = [...INDUSTRIAS.map(ind => [ind, `ind=${encodeURIComponent(ind)}`]), ["Plastilit Tubos", "ind=Plastilit&cat=Tubos"]];
  const porInd = (de, ate) => Promise.all(consultas.map(([conta, q]) => fetch(`${DASH}/api/detalhada?de=${de}&ate=${ate}&${q}`, H).then(r => r.json()).then(d => [conta, (d && d.clients) || null]).catch(() => [conta, null])))
    .then(lst => { const m = {}; let falhou = 0; lst.forEach(([conta, cl]) => { if (!cl) { falhou++; return; } cl.forEach(c => { const k = k14(c.cnpj); (m[k] = m[k] || {})[conta] = +c.fat || 0; }); });
      Object.values(m).forEach(x => { if (x["Plastilit Tubos"]) x.Plastilit = Math.max(0, (x.Plastilit || 0) - x["Plastilit Tubos"]); });
      return { m, falhou }; });
  const p = Promise.all([
    fetch(`${DASH}/api/crm/atividades?tipo=VISITA&desde=${encodeURIComponent(inicio + " 04:00:00")}&limit=2000`, H).then(r => r.json()).catch(() => null),
    porInd(pIni, pFim), porInd(p12, pFim),
  ]).then(([a, v, f]) => {
    const ok = !!(a && a.atividades);
    const r = { visitas: ok ? a.atividades.filter(x => x.origem === "checkout") : [], vendInd: v.m, fat12Ind: f.m, falhouVisitas: !ok, falhouVendas: v.falhou + f.falhou };
    if (!ok || r.falhouVendas) cacheBase = null; // não guarda leitura incompleta
    return r;
  });
  cacheBase = { chave, t: Date.now(), p };
  return p;
}
export const limparCacheAnalise = () => { cacheBase = null; };
