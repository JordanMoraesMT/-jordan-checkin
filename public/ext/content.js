// TeamCheck para WhatsApp Web — painel lateral com a ficha do cliente (v5).
// SSO (sem login) · detecção: telefone → nome do chat → busca manual (🔍).
// v5: ficha/empresas com LINK direto (deep-link /?cliente=CNPJ), seletor quando o
// telefone divide pessoas diferentes, EXCLUIR contato errado, CADASTRAR contato
// novo e VINCULAR a outra empresa — tudo pelas rotas já existentes do CRM.
(function () {
  const DASH = "https://dashboard.jordanmt.com";
  const TC = "https://teamcheck.jordanmt.com";
  let session = null, aberto = true, contatos = null, ultimaChave = "", bootOk = false;
  let chaveAtual = ""; // chave da conversa aberta (telefone ou "n:"+nome)

  // ── 📌 fixação: lembra qual contato é o certo para cada conversa (fica salvo no navegador) ──
  const FIXKEY = "tcxFix";
  const fixAll = () => new Promise(r => { try { chrome.storage.local.get(FIXKEY, d => r((d && d[FIXKEY]) || {})); } catch (e) { r({}); } });
  async function fixGet(ch) { if (!ch) return null; const m = await fixAll(); return m[ch] || null; }
  async function fixSet(ch, dados) { if (!ch) return; const m = await fixAll(); m[ch] = dados; return new Promise(r => { try { chrome.storage.local.set({ [FIXKEY]: m }, r); } catch (e) { r(); } }); }
  async function fixDel(ch) { if (!ch) return; const m = await fixAll(); delete m[ch]; return new Promise(r => { try { chrome.storage.local.set({ [FIXKEY]: m }, r); } catch (e) { r(); } }); }

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const dig = (s) => String(s || "").replace(/\D/g, "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const fichaUrl = (cnpj) => dig(cnpj) ? `${TC}/?cliente=${dig(cnpj)}` : TC;

  // ── mensageria resiliente com o service worker ──
  function sendOnce(msg) {
    return new Promise((res, rej) => {
      let done = false;
      try {
        chrome.runtime.sendMessage(msg, (r) => {
          done = true;
          if (chrome.runtime.lastError) return rej(new Error(chrome.runtime.lastError.message));
          if (!r) return rej(new Error("sem resposta do fundo"));
          res(r);
        });
      } catch (e) { return rej(new Error(String(e && e.message || e))); }
      setTimeout(() => { if (!done) rej(new Error("tempo esgotado")); }, 4000);
    });
  }
  async function sendBG(msg, tries = 4) {
    let ultimo;
    for (let i = 0; i < tries; i++) {
      try { return await sendOnce(msg); }
      catch (e) { ultimo = e; await sleep(250 + i * 350); }
    }
    throw ultimo || new Error("falha ao falar com o fundo");
  }
  async function http(url, opts) {
    const r = await sendBG({ tipo: "http", url, opts });
    if (!r.ok) { const m = (r.json && (r.json.error || r.json.erro)) || r.erro || ("HTTP " + r.status); const err = new Error(String(m)); err.status = r.status; throw err; }
    return r.json;
  }
  async function crm(path, opts) {
    return http(DASH + path, { ...(opts || {}), headers: { "X-Session": session || "", "Content-Type": "application/json", ...((opts || {}).headers || {}) } });
  }
  async function carregaSessao() {
    try { const r = await sendBG({ tipo: "sessao" }); return (r && r.session) || null; }
    catch (e) { return null; }
  }

  // ── telefones BR ──
  const fim8 = (t) => dig(t).slice(-8);
  function casaTel(a, b) { const x = fim8(a), y = fim8(b); return x && y && x === y; }

  // ── camada 1: telefone no data-id ──
  function extraiTelDeDataId(id) {
    const m = String(id || "").match(/(\d{10,15})@(?:c\.us|s\.whatsapp\.net)/);
    return m ? m[1] : "";
  }
  function telefoneDoChat() {
    const escopos = [$("#main"), $('[data-tab="1"]'), $('[role="application"]'), document];
    for (const sc of escopos) {
      if (!sc) continue;
      for (const n of $$("[data-id]", sc)) {
        const tel = extraiTelDeDataId(n.getAttribute("data-id"));
        if (tel) return tel;
      }
    }
    return "";
  }
  // ── camada 2: nome do chat ──
  function nomeDoChat() {
    const header = $("#main header");
    if (!header) return "";
    const cands = $$("span[title], span[dir='auto']", header);
    for (const c of cands) {
      const t = (c.getAttribute("title") || c.textContent || "").trim();
      if (t && t.length >= 2 && !/^(online|digitando|gravando|visto por último|clique aqui)/i.test(t)) return t;
    }
    return "";
  }
  function candidatosPorNome(nome, cts) {
    const tokens = norm(nome).split(/[^a-z0-9]+/).filter(t => t.length >= 3);
    if (!tokens.length) return [];
    const pont = [];
    for (const c of cts) {
      const campo = norm((c.nome || "") + " " + (c.empresa || ""));
      let sc = 0;
      for (const t of tokens) if (campo.includes(t)) sc++;
      if (sc >= 2 || (tokens.length === 1 && sc === 1)) pont.push([sc, c]);
    }
    pont.sort((a, b) => b[0] - a[0]);
    if (!pont.length) return [];
    const top = pont[0][0];
    return pont.filter(p => p[0] === top || p[0] >= top - 1).map(p => p[1]).slice(0, 12);
  }

  // ── painel ──
  const VER = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || "?";
  const painel = el("div", "tcx-painel");
  painel.innerHTML = `
    <div class="tcx-top">
      <span class="tcx-logo">TeamCheck <small style="opacity:.6;font-size:10px">v${VER}</small></span>
      <span class="tcx-top-btns">
        <button class="tcx-btn-min" id="tcx-lupa" title="Buscar cliente">🔍</button>
        <button class="tcx-btn-min" id="tcx-tgl" title="Expandir / recolher">⇔</button>
      </span>
    </div>
    <div class="tcx-corpo"><div class="tcx-msg">Carregando…</div></div>`;
  document.body.appendChild(painel);
  const corpo = $(".tcx-corpo", painel);
  function setAberto(v) { aberto = v; painel.classList.toggle("tcx-fechado", !aberto); }
  $("#tcx-tgl", painel).onclick = (e) => { e.stopPropagation(); setAberto(!aberto); };
  $("#tcx-lupa", painel).onclick = (e) => { e.stopPropagation(); telaBusca(""); };
  // faixa inteira clicável quando recolhido — um clique expande
  painel.addEventListener("click", () => { if (!aberto) setAberto(true); });
  function msg(html) { corpo.innerHTML = `<div class="tcx-msg">${html}</div>`; }

  // ── histórico simples de navegação (botão ‹ Voltar) ──
  const pilha = [];
  function pushView(chave, fn) {
    const topo = pilha[pilha.length - 1];
    if (topo && topo.k === chave) { topo.f = fn; return; } // re-render da mesma tela não empilha
    pilha.push({ k: chave, f: fn });
    if (pilha.length > 12) pilha.shift();
  }
  function temVolta() { return pilha.length > 1; }
  function voltar() {
    pilha.pop();
    const ant = pilha[pilha.length - 1];
    if (ant) ant.f(); else atualiza(true);
  }
  function btnVoltarHtml() { return temVolta() ? `<button class="tcx-mini" id="tcx-back" style="margin:0 0 8px;padding:0">‹ Voltar</button>` : ""; }
  function ligaVoltar() { const b = $("#tcx-back", corpo); if (b) b.onclick = voltar; }

  function telaSemSessao(detalhe) {
    corpo.innerHTML = `
      <div class="tcx-login">
        <p class="tcx-t">Entrar automaticamente</p>
        <div class="tcx-msg" style="text-align:left;padding:0 0 8px">
          Esta extensão usa a sua sessão já aberta do TeamCheck. ${detalhe ? `<br><br><span style="color:#FB9A8F">${esc(detalhe)}</span>` : ""}
          <br><br>Abra o TeamCheck ou o Dashboard neste mesmo navegador, faça login e volte aqui.
        </div>
        <a class="tcx-btn" href="${TC}" target="_blank">Abrir o TeamCheck ›</a>
        <a class="tcx-btn tcx-link" href="${DASH}" target="_blank">Abrir o Dashboard ›</a>
        <button class="tcx-sec" id="tcx-retry">Já entrei — tentar de novo</button>
      </div>`;
    const b = $("#tcx-retry", corpo); if (b) b.onclick = () => boot(true);
  }

  async function carregaContatos(forca) {
    if (contatos && !forca) return contatos;
    const d = await crm("/api/crm/contatos-todos?limit=3000");
    contatos = d.contatos || [];
    return contatos;
  }
  async function trata401() {
    session = await carregaSessao();
    contatos = null;
    if (!session) { telaSemSessao("Sua sessão expirou ou você saiu do TeamCheck."); return false; }
    return true;
  }
  async function detalhesEmpresa(nome, orgId) {
    try {
      const dl = await crm(`/api/crm/clientes?q=${encodeURIComponent(String(nome || "").toLowerCase())}&limit=5`);
      const arr = dl.clientes || [];
      return arr.find(o => o.id === orgId) || arr[0] || null;
    } catch (e) { return null; }
  }

  // ── FICHA: contato + empresas (com links) + ações ──
  async function renderFicha(achados, origem, telCtx) {
    pushView("ficha:" + (achados[0] && achados[0].id), () => renderFicha(achados, origem, telCtx));
    const pessoa = achados[0];
    const _fx = await fixGet(chaveAtual);
    const fixadoAqui = !!(_fx && pessoa.id && _fx.id === pessoa.id);
    const vistos = new Set(), empresas = [];
    for (const c of achados) {
      const chave = String(c.org_id || c.cnpj || c.empresa || "");
      if (!chave || vistos.has(chave)) continue;
      vistos.add(chave); empresas.push(c);
    }
    let atvs = [];
    try {
      const da = await crm(`/api/crm/atividades?${pessoa.org_id ? "org_id=" + pessoa.org_id : "cnpj=" + dig(pessoa.cnpj || "")}&limit=6`);
      atvs = da.atividades || [];
    } catch (e) { if (e.status === 401) { if (await trata401()) return atualiza(true); return; } }
    // + empresas VINCULADAS (crm_contato_vinculo) — rota nova do worker; falha silenciosa se o Dashboard for antigo
    try {
      const vs = await Promise.all(achados.map(c => c.id ? crm(`/api/crm/contato-vinculos?contato_id=${c.id}`).catch(() => null) : null));
      for (const r of vs) for (const v of ((r && r.vinculos) || [])) {
        const chave = String(v.org_id || v.cnpj || v.empresa || "");
        if (!chave || vistos.has(chave)) continue;
        vistos.add(chave);
        empresas.push({ org_id: v.org_id, cnpj: v.cnpj, empresa: v.empresa, vinculado: 1 });
      }
    } catch (e) {}
    const lista = empresas.slice(0, 8);
    const dets = await Promise.all(lista.map(c => detalhesEmpresa(c.empresa || c.org_nome, c.org_id)));
    const cnpjPrincipal = dig(pessoa.cnpj || (dets[0] && dets[0].cnpj) || "");
    const empHtml = lista.map((c, i) => {
      const o = dets[i] || {};
      const nome = c.empresa || o.name || c.org_nome || "(sem nome)";
      const cat = o.cat || "", cid = o.addr ? (o.addr.city_name || o.addr.city || "") : "";
      const marcas = o.products ? String(o.products).split(",").map(x => x.trim()).filter(Boolean) : [];
      const cnpj = dig(c.cnpj || o.cnpj || "");
      return `<a class="tcx-emp${cnpj ? " tcx-emp-link" : ""}" ${cnpj ? `href="${fichaUrl(cnpj)}" target="_blank" title="Abrir a ficha de ${esc(nome)}"` : ""}>
        <p class="tcx-emp-nome">${esc(nome)} ${c.vinculado ? '<span class="tcx-vinc-tag">vínculo</span>' : ""} ${cnpj ? "›" : ""}</p>
        <p class="tcx-emp-sub">${cat ? `<span class="tcx-pill">${esc(cat)}</span>` : ""}${cid ? " " + esc(cid) : ""}</p>
        ${marcas.length ? `<p class="tcx-marcas">${marcas.map(m => `<span class="tcx-marca">${esc(m)}</span>`).join("")}</p>` : ""}
      </a>`;
    }).join("");
    corpo.innerHTML = `
      <div class="tcx-ficha">
        ${btnVoltarHtml()}
        ${origem ? `<p class="tcx-data" style="margin:0 0 8px">${esc(origem)}</p>` : ""}
        ${fixadoAqui ? `<div class="tcx-msg" style="text-align:left;padding:6px 10px;margin:0 0 8px;background:rgba(200,150,78,.12);border-radius:8px;font-size:11.5px">📌 <b>${esc(pessoa.nome || "")}</b> está fixado como o cliente desta conversa. <button id="tcx-unfix" style="background:none;border:none;color:#C8964E;font-weight:700;cursor:pointer;padding:0;font-size:11.5px;text-decoration:underline">Desfazer</button></div>` : (chaveAtual ? `<button class="tcx-mini" id="tcx-fix" title="Da próxima vez que esta conversa abrir, vou direto para esta ficha">📌 Fixar ${esc((pessoa.nome || "este cliente").split(" ")[0])} como o cliente desta conversa</button>` : "")}
        <div class="tcx-bloco">
          <p class="tcx-bt">Contato</p>
          <p class="tcx-nome" style="font-size:15px;margin:0 0 2px">${esc(pessoa.nome || "")}</p>
          <p class="tcx-li">${pessoa.cargo ? esc(pessoa.cargo) : ""}</p>
          ${pessoa.telefone ? `<p class="tcx-li">📞 ${esc(pessoa.telefone)}</p>` : ""}${pessoa.email ? `<p class="tcx-li">✉️ ${esc(pessoa.email)}</p>` : ""}
          <a class="tcx-mini" href="${TC}/?pessoa=${encodeURIComponent(pessoa.nome || "")}" target="_blank" style="text-decoration:underline;display:block">✏️ Editar ${esc((pessoa.nome || "contato").split(" ")[0])} no TeamCheck</a>
          ${telCtx ? `<button class="tcx-mini" id="tcx-ger">Não é essa pessoa? Gerenciar contatos deste número</button>` : ""}
        </div>
        <div class="tcx-bloco">
          <p class="tcx-bt">Empresas deste contato (${empresas.length})</p>
          ${empHtml || `<p class="tcx-li tcx-vazio">—</p>`}
          ${empresas.length > lista.length ? `<p class="tcx-li tcx-vazio">+${empresas.length - lista.length} outra(s)…</p>` : ""}
          <button class="tcx-mini" id="tcx-vinc">＋ Vincular ${esc((pessoa.nome || "contato").split(" ")[0])} a outra empresa</button>
        </div>
        <div class="tcx-bloco">
          <p class="tcx-bt">Últimas atividades · ${esc(pessoa.empresa || "")}</p>
          ${atvs.length ? atvs.map(a => `<p class="tcx-li"><span class="tcx-tipo">${esc(a.tipo)}</span> ${esc((a.texto || "").slice(0, 90))}<br><span class="tcx-data">${esc((a.criado_em || "").slice(0, 16).replace("T", " "))} · ${esc(a.user_nome || "")}</span></p>`).join("") : `<p class="tcx-li tcx-vazio">Sem atividades recentes.</p>`}
        </div>
        <textarea class="tcx-inp" id="tcx-nota" rows="2" placeholder="Registrar nota rápida (em ${esc(pessoa.empresa || "principal")})…"></textarea>
        <button class="tcx-btn" id="tcx-salvar">Salvar nota</button>
        <button class="tcx-sec" id="tcx-agendar">📅 Agendar tarefa</button>
        <a class="tcx-btn tcx-link" href="${fichaUrl(cnpjPrincipal)}" target="_blank">Abrir ficha completa ${cnpjPrincipal ? "de " + esc(pessoa.empresa || "") : "no TeamCheck"} ›</a>
      </div>`;
    ligaVoltar();
    $("#tcx-salvar", corpo).onclick = async () => {
      const t = $("#tcx-nota", corpo).value.trim(); if (!t) return;
      try {
        await crm("/api/crm/atividades", { method: "POST", body: JSON.stringify({ org_id: pessoa.org_id || null, cnpj: dig(pessoa.cnpj || "") || null, org_nome: pessoa.empresa || pessoa.nome, tipo: "WHATSAPP", texto: t }) });
        $("#tcx-nota", corpo).value = ""; renderFicha(achados, origem, telCtx);
      } catch (e) { if (e.status === 401) { await trata401(); } else alert("Erro ao salvar: " + e.message); }
    };
    const g = $("#tcx-ger", corpo); if (g) g.onclick = () => telaGerenciar(telCtx);
    const ag = $("#tcx-agendar", corpo); if (ag) ag.onclick = () => telaAgendar(pessoa, () => renderFicha(achados, origem, telCtx));
    const v = $("#tcx-vinc", corpo); if (v) v.onclick = () => telaVincular(pessoa, () => { contatos = null; telCtx ? mostraFichaTel(telCtx) : renderFicha(achados, origem, telCtx); });
    const fx = $("#tcx-fix", corpo); if (fx) fx.onclick = async () => { await fixSet(chaveAtual, { id: pessoa.id, nome: pessoa.nome || "" }); renderFicha(achados, origem, telCtx); };
    const ufx = $("#tcx-unfix", corpo); if (ufx) ufx.onclick = async () => { await fixDel(chaveAtual); renderFicha(achados, origem, telCtx); };
  }

  // agrupa registros por PESSOA (nome normalizado)
  function agrupaPorPessoa(achados) {
    const g = new Map();
    for (const c of achados) {
      const k = norm(c.nome) || "(sem nome)";
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(c);
    }
    return Array.from(g.values());
  }

  // ficha a partir do TELEFONE
  async function mostraFichaTel(tel) {
    msg("Buscando cliente…");
    let cts;
    try { cts = await carregaContatos(); }
    catch (e) { if (e.status === 401) { if (await trata401()) return atualiza(true); return; } return msg("Erro ao buscar: " + esc(e.message)); }
    const achados = cts.filter(c => casaTel(c.telefone, tel) || casaTel(c.whatsapp, tel));
    if (!achados.length) return telaNaoEncontrado(tel, nomeDoChat());
    const grupos = agrupaPorPessoa(achados);
    if (grupos.length > 1) return telaPessoas(grupos, tel);
    renderFicha(achados, "", tel);
  }
  async function mostraFichaContato(c, origem) {
    const cts = await carregaContatos().catch(() => null);
    let achados = [c], tel = c.telefone || c.whatsapp || "";
    if (cts && tel) {
      const rel = cts.filter(x => (casaTel(x.telefone, tel) || casaTel(x.whatsapp, tel)) && norm(x.nome) === norm(c.nome));
      if (rel.length) achados = rel;
    }
    renderFicha(achados, origem || "", tel);
  }

  // telefone dividido entre pessoas diferentes → escolher (e poder excluir o errado)
  function telaPessoas(grupos, tel) {
    pushView("pessoas:" + tel, () => telaPessoas(grupos, tel));
    corpo.innerHTML = `
      <div class="tcx-ficha">
        <p class="tcx-data" style="margin:0 0 8px">O número <b style="color:#12303F">${esc(tel)}</b> está em <b style="color:#12303F">${grupos.length} contatos diferentes</b>. Toque no certo — ou exclua o errado (🗑).</p>
        ${grupos.map((g, i) => `
          <div class="tcx-pessoa">
            <button class="tcx-opt tcx-pessoa-btn" data-i="${i}">
              <span>${esc(g[0].nome || "(sem nome)")}</span>
              <span class="tcx-opt-sub">${g.map(x => esc(x.empresa || "")).filter(Boolean).join(" · ") || "—"}</span>
            </button>
            <button class="tcx-del" data-del="${i}" title="Excluir este contato do CRM">🗑</button>
          </div>`).join("")}
        <button class="tcx-sec" id="tcx-busca2">🔍 Buscar outro nome</button>
        <button class="tcx-sec" id="tcx-cad-p">➕ Cadastrar novo contato</button>
      </div>`;
    $$(".tcx-pessoa-btn", corpo).forEach(b => b.onclick = () => renderFicha(grupos[Number(b.dataset.i)], "", tel));
    $$(".tcx-del", corpo).forEach(b => b.onclick = () => excluiPessoa(grupos[Number(b.dataset.del)], tel));
    $("#tcx-busca2", corpo).onclick = () => telaBusca("");
    const cp = $("#tcx-cad-p", corpo); if (cp) cp.onclick = () => telaNovoContato(nomeDoChat() || "", tel);
  }
  async function excluiPessoa(grupo, tel) {
    const nome = grupo[0].nome || "(sem nome)";
    const emp = grupo.map(x => x.empresa || "").filter(Boolean).join(", ");
    if (!confirm(`Excluir o contato "${nome}"${emp ? " (" + emp + ")" : ""} do CRM?\n\nIsso remove ${grupo.length} registro(s). A empresa NÃO é apagada — só a pessoa.`)) return;
    msg("Excluindo…");
    try {
      for (const c of grupo) await crm(`/api/crm/contatos?id=${c.id}`, { method: "DELETE" });
      contatos = null;
      mostraFichaTel(tel);
    } catch (e) { if (e.status === 401) { await trata401(); } else msg("Erro ao excluir: " + esc(e.message)); }
  }
  // gerenciar todos os registros de um número (excluir errados um a um)
  async function telaGerenciar(tel) {
    pushView("gerenciar:" + tel, () => telaGerenciar(tel));
    let cts;
    try { cts = await carregaContatos(true); } catch (e) { return msg("Erro: " + esc(e.message)); }
    const achados = cts.filter(c => casaTel(c.telefone, tel) || casaTel(c.whatsapp, tel));
    if (!achados.length) return telaNaoEncontrado(tel, nomeDoChat());
    corpo.innerHTML = `
      <div class="tcx-ficha">
        <p class="tcx-data" style="margin:0 0 8px">Registros com o número <b style="color:#12303F">${esc(tel)}</b> (${achados.length}). Exclua os errados:</p>
        ${achados.map((c, i) => `
          <div class="tcx-pessoa">
            <button class="tcx-opt tcx-pessoa-btn" data-i="${i}">
              <span>${esc(c.nome || "(sem nome)")}</span>
              <span class="tcx-opt-sub">${esc(c.empresa || "—")}</span>
            </button>
            <button class="tcx-del" data-del="${i}" title="Excluir este registro">🗑</button>
          </div>`).join("")}
        <button class="tcx-sec" id="tcx-cad-g">➕ Cadastrar novo contato com este número</button>
        <button class="tcx-sec" id="tcx-volta">‹ Voltar</button>
      </div>`;
    $$(".tcx-pessoa-btn", corpo).forEach(b => b.onclick = async () => {
      const c = achados[Number(b.dataset.i)];
      if (chaveAtual && c.id) await fixSet(chaveAtual, { id: c.id, nome: c.nome || "" });
      mostraFichaContato(c, chaveAtual ? "📌 Salvo para esta conversa" : "");
    });
    $$(".tcx-del", corpo).forEach(b => b.onclick = async () => {
      const c = achados[Number(b.dataset.del)];
      if (!confirm(`Excluir "${c.nome}"${c.empresa ? " (" + c.empresa + ")" : ""} do CRM?`)) return;
      try { await crm(`/api/crm/contatos?id=${c.id}`, { method: "DELETE" }); contatos = null; telaGerenciar(tel); }
      catch (e) { alert("Erro ao excluir: " + e.message); }
    });
    $("#tcx-volta", corpo).onclick = () => mostraFichaTel(tel);
    const cg = $("#tcx-cad-g", corpo); if (cg) cg.onclick = () => telaNovoContato(nomeDoChat() || "", tel);
  }

  // contato não encontrado → cadastrar numa empresa
  function telaNaoEncontrado(tel, nomeChat) {
    pushView("naoencontrado:" + tel, () => telaNaoEncontrado(tel, nomeChat));
    corpo.innerHTML = `
      <div class="tcx-ficha">
        <div class="tcx-msg" style="text-align:left;padding:0 0 8px">Nenhum contato com o telefone <b>${esc(tel)}</b> no CRM.</div>
        <button class="tcx-btn" id="tcx-cad">➕ Cadastrar este contato</button>
        <button class="tcx-sec" id="tcx-busca3">🔍 Buscar por nome</button>
      </div>`;
    $("#tcx-cad", corpo).onclick = () => telaNovoContato(nomeChat || "", tel);
    $("#tcx-busca3", corpo).onclick = () => telaBusca(nomeChat || "");
  }
  function limpaNomeChat(n) {
    // tira prefixos "CT ", "CP ", "RP " e sufixos genéricos comuns
    return String(n || "").replace(/^(ct|cp|rp)\s+/i, "").trim();
  }
  async function telaNovoContato(nomeChat, tel) {
    pushView("novo:" + tel + nomeChat, () => telaNovoContato(nomeChat, tel));
    corpo.innerHTML = `
      <div class="tcx-ficha">
        <p class="tcx-bt" style="margin-bottom:8px">Novo contato</p>
        <input class="tcx-inp" id="tcx-nc-nome" placeholder="Nome da pessoa" value="${esc(limpaNomeChat(nomeChat))}">
        <input class="tcx-inp" id="tcx-nc-tel" placeholder="Telefone" value="${esc(tel || "")}">
        <input class="tcx-inp" id="tcx-nc-q" placeholder="Buscar a EMPRESA (nome ou CNPJ)…">
        <div id="tcx-nc-res"></div>
        <button class="tcx-sec" id="tcx-nc-volta">‹ Voltar</button>
      </div>`;
    const q = $("#tcx-nc-q", corpo), res = $("#tcx-nc-res", corpo);
    let t;
    q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(buscaEmp, 350); });
    q.addEventListener("keydown", e => { if (e.key === "Enter") buscaEmp(); });
    $("#tcx-nc-volta", corpo).onclick = () => (tel ? mostraFichaTel(tel) : telaBusca(""));
    async function buscaEmp() {
      const termo = q.value.trim(); if (termo.length < 2) { res.innerHTML = ""; return; }
      res.innerHTML = `<div class="tcx-msg">Buscando empresas…</div>`;
      try {
        const dl = await crm(`/api/crm/clientes?q=${encodeURIComponent(termo.toLowerCase())}&limit=8`);
        const arr = (dl.clientes || []).filter(o => !o.excluido);
        if (!arr.length) { res.innerHTML = `<div class="tcx-msg">Nenhuma empresa encontrada.</div>`; return; }
        res.innerHTML = arr.map((o, i) => `
          <button class="tcx-opt" data-i="${i}">
            <span>${esc(o.name)}</span>
            <span class="tcx-opt-sub">${esc((o.addr && (o.addr.city_name || o.addr.city)) || "")}${o.cat ? " · " + esc(o.cat) : ""}</span>
          </button>`).join("");
        $$("button[data-i]", res).forEach(b => b.onclick = async () => {
          const o = arr[Number(b.dataset.i)];
          const nome = $("#tcx-nc-nome", corpo).value.trim();
          const telv = $("#tcx-nc-tel", corpo).value.trim();
          if (!nome) return alert("Informe o nome da pessoa.");
          res.innerHTML = `<div class="tcx-msg">Cadastrando…</div>`;
          try {
            await crm("/api/crm/contatos", { method: "POST", body: JSON.stringify({ org_id: o.id || null, cnpj: dig(o.cnpj || "") || null, nome, telefone: telv || null, whatsapp: telv || null }) });
            contatos = null;
            telv ? mostraFichaTel(telv) : telaBusca(nome);
          } catch (e) { if (e.status === 401) { await trata401(); } else res.innerHTML = `<div class="tcx-msg">Erro: ${esc(e.message)}</div>`; }
        });
      } catch (e) { res.innerHTML = `<div class="tcx-msg">${esc(e.message)}</div>`; }
    }
  }

  // agendar TAREFA na empresa do contato (aparece na Agenda do TeamCheck)
  async function telaAgendar(pessoa, aoVoltar) {
    pushView("agendar:" + pessoa.id, () => telaAgendar(pessoa, aoVoltar));
    const hoje = new Date(); const amanha = new Date(hoje.getTime() + 86400000);
    const dIso = (d) => d.toISOString().slice(0, 10);
    const TIPOS = ["VISITA", "LIGACAO", "EMAIL", "REUNIAO", "WHATSAPP", "PROPOSTA", "NOTA"];
    corpo.innerHTML = `
      <div class="tcx-ficha">
        ${btnVoltarHtml()}
        <p class="tcx-bt" style="margin-bottom:8px">Agendar tarefa · ${esc(pessoa.empresa || "")}</p>
        <select class="tcx-inp" id="tcx-ag-tipo">${TIPOS.map(t => `<option value="${t}"${t === "VISITA" ? " selected" : ""}>${t}</option>`).join("")}</select>
        <textarea class="tcx-inp" id="tcx-ag-txt" rows="2" placeholder="O que precisa ser feito?"></textarea>
        <div style="display:flex;gap:8px">
          <input class="tcx-inp" id="tcx-ag-data" type="date" value="${dIso(amanha)}" style="flex:1.4">
          <input class="tcx-inp" id="tcx-ag-hora" type="time" value="09:00" style="flex:1">
        </div>
        <button class="tcx-btn" id="tcx-ag-go">Criar tarefa</button>
        <button class="tcx-sec" id="tcx-ag-volta">‹ Voltar</button>
      </div>`;
    ligaVoltar();
    $("#tcx-ag-volta", corpo).onclick = aoVoltar;
    $("#tcx-ag-go", corpo).onclick = async () => {
      const txt = $("#tcx-ag-txt", corpo).value.trim();
      const dt = $("#tcx-ag-data", corpo).value, hr = $("#tcx-ag-hora", corpo).value || "09:00";
      if (!txt) return alert("Descreva a tarefa.");
      if (!dt) return alert("Escolha a data.");
      const b = $("#tcx-ag-go", corpo); b.disabled = true; b.textContent = "Criando…";
      try {
        await crm("/api/crm/atividades", { method: "POST", body: JSON.stringify({ org_id: pessoa.org_id || null, cnpj: dig(pessoa.cnpj || "") || null, org_nome: pessoa.empresa || pessoa.nome, tipo: $("#tcx-ag-tipo", corpo).value, texto: txt, origem: "tarefa", due_em: `${dt}T${hr}:00-04:00` } ) });
        b.textContent = "✓ Tarefa criada!";
        setTimeout(aoVoltar, 700);
      } catch (e) { b.disabled = false; b.textContent = "Criar tarefa"; if (e.status === 401) { await trata401(); } else alert("Erro: " + e.message); }
    };
  }

  // vincular o contato a OUTRA empresa (rede/comprador único)
  async function telaVincular(pessoa, aoVoltar) {
    pushView("vincular:" + pessoa.id, () => telaVincular(pessoa, aoVoltar));
    corpo.innerHTML = `
      <div class="tcx-ficha">
        <p class="tcx-bt" style="margin-bottom:8px">Vincular ${esc(pessoa.nome || "")} a outra empresa</p>
        <input class="tcx-inp" id="tcx-vc-q" placeholder="Buscar a empresa (nome ou CNPJ)…">
        <div id="tcx-vc-res"></div>
        <button class="tcx-sec" id="tcx-vc-volta">‹ Voltar</button>
      </div>`;
    const q = $("#tcx-vc-q", corpo), res = $("#tcx-vc-res", corpo);
    let t;
    q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(busca, 350); });
    q.addEventListener("keydown", e => { if (e.key === "Enter") busca(); });
    $("#tcx-vc-volta", corpo).onclick = aoVoltar;
    async function busca() {
      const termo = q.value.trim(); if (termo.length < 2) { res.innerHTML = ""; return; }
      res.innerHTML = `<div class="tcx-msg">Buscando empresas…</div>`;
      try {
        const dl = await crm(`/api/crm/clientes?q=${encodeURIComponent(termo.toLowerCase())}&limit=8`);
        const arr = (dl.clientes || []).filter(o => !o.excluido);
        if (!arr.length) { res.innerHTML = `<div class="tcx-msg">Nenhuma empresa encontrada.</div>`; return; }
        res.innerHTML = arr.map((o, i) => `
          <button class="tcx-opt" data-i="${i}">
            <span>${esc(o.name)}</span>
            <span class="tcx-opt-sub">${esc((o.addr && (o.addr.city_name || o.addr.city)) || "")}${o.cat ? " · " + esc(o.cat) : ""}</span>
          </button>`).join("");
        $$("button[data-i]", res).forEach(b => b.onclick = async () => {
          const o = arr[Number(b.dataset.i)];
          res.innerHTML = `<div class="tcx-msg">Vinculando…</div>`;
          try {
            await crm("/api/crm/contato-vincular", { method: "POST", body: JSON.stringify({ contato_id: pessoa.id, org_id: o.id || null, cnpj: dig(o.cnpj || "") || null }) });
            aoVoltar();
          } catch (e) { if (e.status === 401) { await trata401(); } else res.innerHTML = `<div class="tcx-msg">Erro: ${esc(e.message)}</div>`; }
        });
      } catch (e) { res.innerHTML = `<div class="tcx-msg">${esc(e.message)}</div>`; }
    }
  }

  // busca manual (🔍)
  async function telaBusca(inicial, aviso, fixarChave) {
    pushView("busca:" + (inicial || ""), () => telaBusca(inicial, aviso, fixarChave));
    corpo.innerHTML = `
      <div class="tcx-ficha">
        ${aviso ? `<div class="tcx-msg" style="text-align:left;padding:0 0 8px">${aviso}</div>` : ""}
        <input class="tcx-inp" id="tcx-q" placeholder="Nome, empresa ou telefone…" value="${esc(inicial || "")}">
        <button class="tcx-btn" id="tcx-go">Buscar no CRM</button>
        <div id="tcx-res"></div>
      </div>`;
    const q = $("#tcx-q", corpo), go = $("#tcx-go", corpo), res = $("#tcx-res", corpo);
    const roda = async () => {
      const termo = q.value.trim(); if (!termo) return;
      res.innerHTML = `<div class="tcx-msg">Buscando…</div>`;
      let cts;
      try { cts = await carregaContatos(); }
      catch (e) { if (e.status === 401) { if (await trata401()) return; } res.innerHTML = `<div class="tcx-msg">${esc(e.message)}</div>`; return; }
      let cands;
      if (dig(termo).length >= 8) cands = cts.filter(c => casaTel(c.telefone, termo) || casaTel(c.whatsapp, termo));
      else cands = candidatosPorNome(termo, cts);
      if (!cands.length) { res.innerHTML = `<div class="tcx-msg">Nada encontrado para <b>${esc(termo)}</b>.</div><button class="tcx-btn" id="tcx-cad2">➕ Cadastrar novo contato</button>`; const c2 = $("#tcx-cad2", res); if (c2) c2.onclick = () => telaNovoContato(termo, dig(termo).length >= 8 ? termo : ""); return; }
      if (cands.length === 1) return mostraFichaContato(cands[0], "Busca: " + termo);
      res.innerHTML = cands.slice(0, 10).map((c, i) => `
        <button class="tcx-opt" data-i="${i}">
          <span>${esc(c.nome || "")}</span>
          <span class="tcx-opt-sub">${esc(c.empresa || "")}</span>
        </button>`).join("");
      res.insertAdjacentHTML("beforeend", `<button class="tcx-sec" id="tcx-cad-l">➕ Nenhum é o certo — cadastrar novo contato</button>`);
      $$("button[data-i]", res).forEach(b => b.onclick = async () => {
        const c = cands[Number(b.dataset.i)];
        if (fixarChave && c.id) await fixSet(fixarChave, { id: c.id, nome: c.nome || "" }); // escolheu = fica salvo
        mostraFichaContato(c, fixarChave ? "📌 Salvo para esta conversa" : "Busca: " + termo);
      });
      const cl = $("#tcx-cad-l", res); if (cl) cl.onclick = () => telaNovoContato(termo, dig(termo).length >= 8 ? termo : (telefoneDoChat() || ""));
    };
    go.onclick = roda;
    q.addEventListener("keydown", e => { if (e.key === "Enter") roda(); });
    if (inicial) roda();
  }

  // ── orquestração ──
  async function atualiza(forca) {
    if (!session) return telaSemSessao();
    const tel = telefoneDoChat();
    const nome = nomeDoChat();
    const chave = tel || ("n:" + nome);
    if (!tel && !nome) { if (forca || !ultimaChave) msg("Abra uma conversa para ver a ficha do cliente."); ultimaChave = ""; return; }
    if (chave === ultimaChave && !forca) return;
    ultimaChave = chave; chaveAtual = chave;
    pilha.length = 0; // conversa mudou → zera o histórico do Voltar
    // 📌 escolha salva? vai direto — sem perguntar de novo
    const fx = await fixGet(chave);
    if (fx && fx.id) {
      try {
        const cts0 = await carregaContatos();
        const c0 = cts0.find(x => x.id === fx.id);
        if (c0) return mostraFichaContato(c0, "📌 Fixado para esta conversa");
        await fixDel(chave); // contato foi excluído do CRM → limpa e segue o fluxo normal
      } catch (e) { if (e.status === 401) { if (await trata401()) return atualiza(true); return; } }
    }
    if (tel) return mostraFichaTel(tel);
    if (dig(nome).length >= 10) return mostraFichaTel(dig(nome));
    msg(`Procurando <b>${esc(nome)}</b> no CRM…`);
    let cts;
    try { cts = await carregaContatos(); }
    catch (e) { if (e.status === 401) { if (await trata401()) return atualiza(true); return; } return msg("Erro: " + esc(e.message)); }
    const cands = candidatosPorNome(nome, cts);
    if (!cands.length) return telaBusca(nome, `Não achei <b>${esc(nome)}</b> automaticamente. Ajuste a busca ou cadastre:`);
    const tels = new Set(cands.map(c => fim8(c.telefone || c.whatsapp)).filter(Boolean));
    if (cands.length === 1 || tels.size === 1) return mostraFichaContato(cands[0], "Conversa: " + nome);
    // vários — reusar a lista da busca
    corpo.innerHTML = "";
    telaBusca(nome, `Conversa: <b>${esc(nome)}</b> — escolha o cliente <span style="opacity:.75">(a escolha fica salva)</span>:`, chave);
  }

  const obs = new MutationObserver(() => { clearTimeout(obs._t); obs._t = setTimeout(() => { if (bootOk) atualiza(false); }, 600); });
  obs.observe(document.body, { childList: true, subtree: true });

  async function boot(forcaMsg) {
    msg("Conectando…");
    session = await carregaSessao();
    if (!session) { bootOk = false; return telaSemSessao(forcaMsg ? "Ainda não encontrei uma sessão ativa." : ""); }
    bootOk = true; contatos = null; ultimaChave = "";
    atualiza(true);
  }
  boot(false);
})();
