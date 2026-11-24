// v135: a tabela de taxa de comissão Tramontina POR CLIENTE saiu do código do app.
// O código do TeamCheck é público (qualquer um baixa o JavaScript do site, sem login), então dado de comissão
// não pode morar aqui. A taxa por cliente vem só da rota /api/crm/tram-taxas do Dashboard (com sessão);
// sem ela, vale a taxa média da representada (premissas).
export const TRAM_GERADO = null;
export const TRAM_TAXA_CLIENTE = {};
