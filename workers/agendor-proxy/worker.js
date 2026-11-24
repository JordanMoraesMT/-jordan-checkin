// agendor-proxy — v14 (24/nov/2026)
// Novidade da v14 — o sync confere DE QUEM é a chave (regra no servidor, não só na tela):
//   Vendedor (papel diferente de admin) só lê e grava as chaves pessoais DELE: "<id>", "visits_<id>", "semana_<id>"
//   (id = userId da sessão). Chave pessoal de outro usuário → 403. "analisePremissas" (premissas da Análise, com as
//   taxas de comissão) só o admin grava ou apaga. Chaves compartilhadas (plocs, dayBases) seguem como antes.
//   Admin continua lendo tudo. Sem sessão (só se SYNC_EXIGE_SESSAO não for "1") o comportamento é o antigo.
//   GET /api/config: vendedor deixa de receber homeLat/homeLng (endereço de casa) dos outros usuários.
// --- v13 (18/nov/2026) ---
// Novidade da v13: o evento "uso" do log_acesso NÃO é gravado quando o cabeçalho Origin vem vazio (chamada de
//   servidor para servidor, ex.: o /me que o Dashboard faz pelo Cloudflare). Era ruído com IP do Cloudflare; desde a
//   v360 o próprio Dashboard grava o uso com o IP real. Logins, logout, reset etc. continuam sendo gravados sempre.
// --- v12 (18/nov/2026) ---
// Novidade da v12 — registro de acessos por 6 meses (Marco Civil da Internet, art. 15):
//   Tabela log_acesso no D1 (criada sozinha): evento, e-mail, IP, origem (Origin), navegador (200 caracteres), data/hora.
//   Eventos: login_ok, login_falha, login_bloqueado (429), logout, forgot, reset_ok, reset_falha, convite,
//   encerrar_sessoes e "uso" (no máximo 1 linha por e-mail + IP + dia de Cuiabá, quando uma sessão é validada).
//   NUNCA grava senha, código, token de sessão nem corpo da requisição. Falha ao gravar nunca derruba o login.
//   Retenção: o cron (seg/qua/sex) apaga o que passar de 190 dias (6 meses + margem).
//   GET /admin/log-acesso?email=&dias=30&evento= — só admin logado; até 1.000 linhas, mais recentes primeiro.
// --- v11 (17/nov/2026) ---
// Novidade da v11:
//   POST /admin/criar-acesso (protegida só pela chave fixa ADMIN_KEY / cabeçalho X-Admin-Key) foi REMOVIDA.
//   Nada no TeamCheck, Dashboard, catálogo ou extensão a chamava; o convite por e-mail (/admin/convidar, com sessão
//   de admin) substitui. O segredo ADMIN_KEY pode ser apagado do painel. Agora a rota responde 404.
//   Todo o resto é igual à v10 (travas de tentativa, CORS, sync/cnpj com sessão, etc.).
// --- v10 (17/nov/2026) — SEGURANÇA ---
// Novidades da v10 (auditoria de 17/11/2026):
//   1. /api/config exige sessão (X-Session) em GET e POST. O TeamCheck já enviava a sessão — nada muda no app.
//      op "delete" continua só para admin.
//   2. ?sync= e ?cnpj= — chave SYNC_EXIGE_SESSAO (variável do Worker):
//        · ausente/0 (TRANSIÇÃO): sem sessão ainda funciona (compatível com o app atual); COM sessão, ela é conferida.
//        · "1" (FECHADO): sem sessão válida → 401. Ligar DEPOIS que o TeamCheck passar a mandar X-Session nessas chamadas.
//      Nome da chave do sync limitado a [A-Za-z0-9_.:-] e corpo do PUT a 5 MB. ?cnpj= só aceita 14 dígitos.
//   3. Limite de tentativas (tabela auth_tentativa no D1, criada sozinha):
//        · /login: 6 erros do mesmo e-mail na mesma conexão, 30 do e-mail no total ou 25 da conexão, em 15 min → 429
//          (um estranho não consegue travar o seu login de casa só errando a sua senha de outro lugar)
//        · /forgot: 3 códigos por e-mail ou 10 por IP por hora → 429 (antes dava para pedir códigos sem fim,
//          zerando as 5 tentativas a cada pedido, e encher a caixa de e-mail da pessoa)
//        · /reset: 15 erros por IP em 15 min → 429 (somado às 5 tentativas por código que já existiam)
//        · /admin/criar-acesso: (removida na v11)
//   4. CORS só para os endereços da Jordan (lista ORIGENS + extensão do Chrome + variável CORS_EXTRA, separada por vírgula).
//      Chamadas sem Origin (servidor→servidor) seguem iguais.
//   5. Troca de senha (/reset) encerra as outras sessões daquela pessoa.
//   6. POST /admin/encerrar-sessoes (admin logado) — encerra TODAS as sessões abertas, menos a sua. Body opcional
//      { email } para encerrar só as de uma pessoa.
//   7. E-mails (tarefas, convite, código) escapam o texto vindo do banco — nada de HTML injetado.
//   8. Cron: limpa auth_tentativa com mais de 2 dias.
// Novidade da v9:
//   Etiquetas: a regra "Resolvido" saiu (a etiqueta não existe mais). Entra o fluxo BAZAR / MATCON, igual ao do agente
//   (agente-whatsapp/src/etiquetas.js): COTAÇÃO → AGUARD APROV → PV TRANSFORMAR → FINALIZADO. Ao colocar uma etiqueta,
//   as etapas listadas em TRANSICOES_ETQ são encerradas (removido_em) na mesma pessoa. As demais não interferem.
// Novidade da v8:
//   B. Rotas das ETIQUETAS das pessoas (mesma sessão X-Session do app, mesmo D1):
//      GET  /api/crm/etiquetas?cnpj=…  |  ?contato_id=…  |  ?ids=1,2,3   → etiquetas ATIVAS (com cor do catálogo)
//      GET  /api/crm/etiquetas-todas                                      → todas as ativas (filtro/contadores)
//      POST /api/crm/etiqueta { contato_id, cnpj?, etiqueta, remover?, obs? }
//        · etiqueta precisa existir no catálogo (tipo 'etiqueta', ativo=1) para ser colocada
//        · remover = preenche removido_em (nunca DELETE; o histórico fica)
//        · (v9) fluxo BAZAR/MATCON: ao colocar, encerra as etapas de TRANSICOES_ETQ
//        · origem 'teamcheck', user_nome = usuário da sessão
//   A. Catálogo "etiqueta" (etiquetas das pessoas/contatos, iguais às do WhatsApp Business).
//      A trava do op:"delete" agora conta uso em crm_contato_etiqueta (etiquetas ativas) — etiqueta em uso não é apagada.
//      Os nomes ficam em config_catalogo (tipo='etiqueta'); o agente de WhatsApp lê essa mesma lista.
// Novidades da v7:
//   A. Sync durável também para "analisePremissas" (premissas da Análise de visitas) e "semana_*" (lista da semana).
//      Antes ficavam com validade de 1 dia e sumiam.
//   B. E-mail de SEGUNDA-FEIRA ganha a seção "Valem visita esta semana" — lista que o próprio app calcula
//      (TeamCheck v79) e guarda em visit:semana_{userId}. Só nomes, bairro/cidade e dias sem visita; nenhum valor.
//      Na segunda, o e-mail sai mesmo se a pessoa não tiver tarefa pendente, desde que haja lista.
// Da v6:
//   1. v6: catálogo "cargo_industria" (contatos de empresas com segmento "Indústria" ficam fora dos cargos de PDV).
//   2. v5: a trava de uso do op:"delete" compara UPPER(TRIM(...)) — "GERENTE" conta como uso de "Gerente".
//   3. POST /api/config  op:"delete"  — admin logado exclui um cadastro do catálogo de vez.
//      Trava de uso: item referenciado por clientes/contatos/vendas NÃO é apagado (409 com a contagem).
//      Usuário com login só sai se vier { removerAcesso: true } (apaga também auth:user:{email} do KV).
// Da v3 (mantido igual):
//   - POST /admin/convidar — admin logado convida novo usuário: cria o acesso e envia e-mail
//     com código de 48h para o próprio usuário definir a senha (tela "Primeiro acesso" do app).
//   - E-mail de alerta de tarefas pendentes (segunda/quarta/sexta) via Acionador Cron:
//     handler `scheduled` — cron "0 11 * * 1,3,5" (= 07:00 de Cuiabá).
//   - POST /admin/testar-alerta — dispara o e-mail de tarefas agora.
//   - login/logout/me/forgot/reset/config/sync/cnpj/gps-migrar inalterados (criar-acesso removida na v11).

// v9: fluxo das etiquetas BAZAR (Tramontina, Ruvolo, Festcolor, Hiper Têxtil) / MATCON (Santana, Pado, Zagonel,
// Plastilit, Dacar). Ao colocar a chave, encerra as etiquetas ativas listadas. Igual ao agente-whatsapp/src/etiquetas.js.
const ETQ_COT = ["BAZAR COTAÇÃO", "MATCON - COTAÇÃO"];
const ETQ_AGU = ["BAZAR AGUARD APROV", "MATCON AGUARD APROV"];
const TRANSICOES_ETQ = {
  "BAZAR COTAÇÃO": ["BAZAR FINALIZADO"],
  "BAZAR AGUARD APROV": ["BAZAR COTAÇÃO"],
  "BAZAR FINALIZADO": ["BAZAR COTAÇÃO", "BAZAR AGUARD APROV", "PV TRANSFORMAR"],
  "MATCON - COTAÇÃO": ["MATCON FINALIZADO"],
  "MATCON AGUARD APROV": ["MATCON - COTAÇÃO"],
  "MATCON FINALIZADO": ["MATCON - COTAÇÃO", "MATCON AGUARD APROV", "PV TRANSFORMAR"],
  "PV TRANSFORMAR": [...ETQ_COT, ...ETQ_AGU],
};

// v10 — origens que podem chamar este Worker pelo navegador (CORS). Outras origens não recebem o cabeçalho
// e o navegador bloqueia a resposta. Para incluir um endereço sem mexer no código: variável CORS_EXTRA.
const ORIGENS = [
  "https://teamcheck.jordanmt.com",
  "https://jordan-checkin.vercel.app",
  "https://dashboard.jordanmt.com",
  "https://catalogo.jordanmt.com",
  "https://promocoes.jordanmt.com",
  "http://localhost:5173",
  "http://localhost:3000",
];
function corsPara(request, env) {
  const o = request.headers.get("Origin") || "";
  const extra = String(env.CORS_EXTRA || "").split(",").map(s => s.trim()).filter(Boolean);
  const base = { "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session", "Vary": "Origin" };
  if (!o) return base;                                     // servidor→servidor: CORS não se aplica
  if (ORIGENS.includes(o) || extra.includes(o) || o.startsWith("chrome-extension://")) return { ...base, "Access-Control-Allow-Origin": o };
  return null;                                             // origem desconhecida
}
const SYNC_CHAVE_OK = /^[A-Za-z0-9_.:-]{1,120}$/;
const SYNC_MAX_BYTES = 5 * 1024 * 1024;

export default {
  async fetch(request, env) {
    const corsOk = corsPara(request, env);
    if (request.method === "OPTIONS") return corsOk ? new Response(null, { status: 204, headers: corsOk }) : new Response(null, { status: 403 });
    const cors = corsOk || { "Vary": "Origin" };
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get("CF-Connecting-IP") || "";

    // ===== AUTH: login =====
    if (path === "/login") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      let body; try { body = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password) return json({ error: "Informe e-mail e senha" }, cors, 400);
      // v10: trava de tentativa e erro (por e-mail e por conexão)
      if (await excedeu(env, "login", [["par", email + "|" + ip, 6], ["email", email, 30], ["ip", ip, 25]], 15)) {
        await logAcesso(env, request, "login_bloqueado", email);
        return json({ error: "Muitas tentativas. Aguarde 15 minutos e tente de novo." }, cors, 429);
      }
      const raw = await env.SYNC_KV.get("auth:user:" + email);
      if (!raw) { await registrar(env, "login", email, ip); await logAcesso(env, request, "login_falha", email); return json({ error: "E-mail ou senha incorretos" }, cors, 401); }
      const u = JSON.parse(raw);
      const calc = await pbkdf2(password, u.pw.salt, u.pw.iter);
      if (!eqHex(calc, u.pw.hash)) { await registrar(env, "login", email, ip); await logAcesso(env, request, "login_falha", email); return json({ error: "E-mail ou senha incorretos" }, cors, 401); }
      const session = randHex(32);
      await env.SYNC_KV.put("auth:session:" + session, JSON.stringify({ email }), { expirationTtl: 60 * 60 * 24 * 30 });
      await logAcesso(env, request, "login_ok", email);
      return json({ ok: true, session, name: u.name, role: u.role, userId: u.userId, email }, cors);
    }

    // ===== AUTH: logout =====
    if (path === "/logout") {
      const s = request.headers.get("X-Session");
      if (s) {
        let em = null; try { const sr = await env.SYNC_KV.get("auth:session:" + s); em = sr ? JSON.parse(sr).email : null; } catch {}
        await env.SYNC_KV.delete("auth:session:" + s);
        await logAcesso(env, request, "logout", em);
      }
      return json({ ok: true }, cors);
    }

    // ===== AUTH: me (validar sessão) =====
    if (path === "/me") {
      const s = request.headers.get("X-Session");
      if (!s) return json({ error: "Sem sessao" }, cors, 401);
      const sr = await env.SYNC_KV.get("auth:session:" + s);
      if (!sr) return json({ error: "Sessao expirada" }, cors, 401);
      const ur = await env.SYNC_KV.get("auth:user:" + JSON.parse(sr).email);
      if (!ur) return json({ error: "Usuario nao encontrado" }, cors, 401);
      const u = JSON.parse(ur);
      await usoDiario(env, request, u.email || JSON.parse(sr).email);
      return json({ ok: true, name: u.name, role: u.role, userId: u.userId, email: u.email || JSON.parse(sr).email }, cors);
    }

    // ===== AUTH: forgot (envia código de 6 dígitos por e-mail) =====
    if (path === "/forgot") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      let body; try { body = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return json({ error: "Informe o e-mail" }, cors, 400);
      // v10: no máximo 3 códigos por e-mail (10 por conexão) por hora — conta TODO pedido, exista o e-mail ou não
      if (await excedeu(env, "forgot", [["email", email, 3], ["ip", ip, 10]], 60)) {
        return json({ error: "Você já pediu vários códigos. Use o último que chegou ou aguarde 1 hora." }, cors, 429);
      }
      await registrar(env, "forgot", email, ip);
      await logAcesso(env, request, "forgot", email);
      const raw = await env.SYNC_KV.get("auth:user:" + email);
      // Resposta genérica se não existe (não revela cadastro)
      if (!raw) return json({ ok: true }, cors);
      const u = JSON.parse(raw);
      const code = gen6();
      const salt = randHex(16);
      const hash = await pbkdf2(code, salt, 100000);
      const exp = Date.now() + 15 * 60 * 1000;
      await env.SYNC_KV.put("auth:reset:" + email, JSON.stringify({ hash, salt, iter: 100000, exp, tries: 0 }), { expirationTtl: 900 });
      const sent = await sendResetEmail(env, email, u.name || "", code);
      if (!sent) return json({ ok: false, error: "Não consegui enviar o e-mail agora. Tente de novo em instantes." }, cors, 502);
      return json({ ok: true }, cors);
    }

    // ===== AUTH: reset (valida código e troca a senha) — serve também para o 1º acesso do convidado =====
    if (path === "/reset") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      let body; try { body = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "").trim();
      const password = String(body.password || "");
      if (!email || !code || !password) return json({ error: "Preencha e-mail, código e nova senha" }, cors, 400);
      if (password.length < 8) return json({ error: "A nova senha precisa ter ao menos 8 caracteres" }, cors, 400);
      if (await excedeu(env, "reset", [["ip", ip, 15]], 15)) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, cors, 429);
      const rr = await env.SYNC_KV.get("auth:reset:" + email);
      if (!rr) { await logAcesso(env, request, "reset_falha", email); return json({ error: "Código expirado ou inválido. Peça um novo." }, cors, 400); }
      const rec = JSON.parse(rr);
      const now = Date.now();
      if (!rec.exp || rec.exp <= now) { await env.SYNC_KV.delete("auth:reset:" + email); return json({ error: "Código expirado. Peça um novo." }, cors, 400); }
      if ((rec.tries || 0) >= 5) { await env.SYNC_KV.delete("auth:reset:" + email); return json({ error: "Muitas tentativas. Peça um novo código." }, cors, 429); }
      const calc = await pbkdf2(code, rec.salt, rec.iter);
      if (!eqHex(calc, rec.hash)) {
        const tries = (rec.tries || 0) + 1;
        const left = 5 - tries;
        const ttl = Math.max(60, Math.floor((rec.exp - now) / 1000));
        await registrar(env, "reset", email, ip);
        await logAcesso(env, request, "reset_falha", email);
        if (left <= 0) { await env.SYNC_KV.delete("auth:reset:" + email); return json({ error: "Muitas tentativas. Peça um novo código." }, cors, 429); }
        await env.SYNC_KV.put("auth:reset:" + email, JSON.stringify({ ...rec, tries }), { expirationTtl: ttl });
        return json({ error: "Código incorreto. Tentativas restantes: " + left }, cors, 400);
      }
      // Código certo → grava nova senha
      const ur = await env.SYNC_KV.get("auth:user:" + email);
      if (!ur) return json({ error: "Usuário não encontrado" }, cors, 404);
      const u = JSON.parse(ur);
      const nsalt = randHex(16);
      const nhash = await pbkdf2(password, nsalt, 100000);
      u.pw = { salt: nsalt, hash: nhash, iter: 100000 };
      await env.SYNC_KV.put("auth:user:" + email, JSON.stringify(u));
      await env.SYNC_KV.delete("auth:reset:" + email);
      // v10: senha nova derruba as sessões antigas dessa pessoa (quem tinha a senha antiga perde o acesso)
      await encerrarSessoes(env, email, null);
      await logAcesso(env, request, "reset_ok", email);
      return json({ ok: true }, cors);
    }

    // ===== ADMIN: encerrar sessões (v10) — requer sessão de ADMIN =====
    // Sem body: encerra TODAS as sessões, menos a de quem chamou. { email }: só as dessa pessoa.
    if (path === "/admin/encerrar-sessoes") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      const adm = await sessaoAdmin(request, env);
      if (!adm) return json({ error: "apenas administrador logado" }, cors, 403);
      let b = {}; try { b = await request.json(); } catch {}
      const alvo = b && b.email ? String(b.email).trim().toLowerCase() : null;
      const n = await encerrarSessoes(env, alvo, request.headers.get("X-Session"));
      await logAcesso(env, request, "encerrar_sessoes", adm.email);
      return json({ ok: true, encerradas: n, alvo: alvo || "todas (menos a sua)" }, cors);
    }

    // ===== ADMIN: consultar o registro de acessos (v12) — requer sessão de ADMIN =====
    // GET /admin/log-acesso?email=&dias=30&evento=   (dias: 1 a 190; até 1.000 linhas, mais recentes primeiro)
    if (path === "/admin/log-acesso") {
      if (request.method !== "GET") return json({ error: "method" }, cors, 405);
      const adm = await sessaoAdmin(request, env);
      if (!adm) return json({ error: "apenas administrador logado" }, cors, 403);
      const dias = Math.min(190, Math.max(1, parseInt(url.searchParams.get("dias") || "30", 10) || 30));
      const em = String(url.searchParams.get("email") || "").trim().toLowerCase();
      const ev = String(url.searchParams.get("evento") || "").trim();
      try {
        await garantirLog(env);
        const conds = ["criado_em > datetime('now', ?)"], binds = [`-${dias} days`];
        if (em) { conds.push("email=?"); binds.push(em); }
        if (ev) { conds.push("evento=?"); binds.push(ev); }
        const { results } = await env.DASHBOARD_DB.prepare(
          "SELECT id, evento, email, ip, origem, user_agent, criado_em FROM log_acesso WHERE " + conds.join(" AND ") + " ORDER BY criado_em DESC, id DESC LIMIT 1000"
        ).bind(...binds).all();
        return json({ ok: true, dias, total: (results || []).length, acessos: results || [] }, cors);
      } catch (e) {
        return json({ error: String(e.message || e) }, cors, 500);
      }
    }

    // ===== ADMIN: convidar por e-mail — requer sessão de ADMIN =====
    // Cria o acesso com senha aleatória + envia e-mail com código (48h) para o usuário
    // definir a própria senha em "Primeiro acesso — tenho um código" na tela de login.
    if (path === "/admin/convidar") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      const adm = await sessaoAdmin(request, env);
      if (!adm) return json({ error: "apenas administrador logado pode convidar" }, cors, 403);
      let body; try { body = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
      const email = String(body.email || "").trim().toLowerCase();
      const nome = String(body.nome || "").trim();
      const admin = !!body.admin;
      const catId = body.catId != null ? Number(body.catId) : null;
      let userId = body.userId != null && body.userId !== "" ? Number(body.userId) : null;
      if (!email || !email.includes("@") || !nome) return json({ error: "informe nome e e-mail válidos" }, cors, 400);

      // userId: usa o existente (agendor_id) ou gera um id próprio (900000 + id do catálogo)
      // e grava de volta no config_catalogo para o app reconhecer o usuário nos filtros.
      if (!userId && catId) {
        userId = 900000 + catId;
        try {
          await env.DASHBOARD_DB.prepare(
            "UPDATE config_catalogo SET agendor_id=?, atualizado_em=datetime('now') WHERE id=? AND (agendor_id IS NULL OR agendor_id='')"
          ).bind(userId, catId).run();
        } catch (e) { /* segue mesmo assim */ }
      }

      // Se o acesso já existe, não recria — apenas (re)envia o código de definição de senha.
      const existente = await env.SYNC_KV.get("auth:user:" + email);
      if (!existente) {
        const salt = randHex(16);
        const hash = await pbkdf2(randHex(24), salt, 100000); // senha aleatória inutilizável
        const rec = { name: nome, email, role: admin ? "admin" : "user", userId, pw: { salt, hash, iter: 100000 } };
        await env.SYNC_KV.put("auth:user:" + email, JSON.stringify(rec));
      }

      const code = gen6();
      const salt2 = randHex(16);
      const hash2 = await pbkdf2(code, salt2, 100000);
      const exp = Date.now() + 48 * 60 * 60 * 1000; // 48 horas
      await env.SYNC_KV.put("auth:reset:" + email, JSON.stringify({ hash: hash2, salt: salt2, iter: 100000, exp, tries: 0 }), { expirationTtl: 48 * 3600 });
      const sent = await sendConviteEmail(env, email, nome, code, adm.name || "o administrador");
      if (!sent) return json({ ok: false, error: "Acesso criado, mas não consegui enviar o e-mail. Tente reenviar." }, cors, 502);
      await logAcesso(env, request, "convite", adm.email);
      return json({ ok: true, email, userId, reenvio: !!existente }, cors);
    }

    // ===== ADMIN: testar o e-mail de alerta de tarefas agora — requer sessão de ADMIN =====
    if (path === "/admin/testar-alerta") {
      if (request.method !== "POST") return json({ error: "method" }, cors, 405);
      const adm = await sessaoAdmin(request, env);
      if (!adm) return json({ error: "apenas administrador logado" }, cors, 403);
      const resultado = await enviarAlertasTarefas(env);
      return json({ ok: true, ...resultado }, cors);
    }

    // ===== CONFIG: catálogos do CRM — D1 =====
    if (path === "/api/config") {
      // v10: antes era aberto a qualquer pessoa (lia usuários/e-mails e criava/renomeava cadastros sem login)
      const usrCfg = await sessaoUsuario(request, env);
      if (!usrCfg) return json({ error: "sessao" }, cors, 401);
      const DB = env.DASHBOARD_DB;
      try {
        if (request.method === "GET") {
          const { results } = await DB.prepare(
            "SELECT id,tipo,nome,agendor_id,cor,extra,ativo,ordem FROM config_catalogo ORDER BY tipo, ordem, nome"
          ).all();
          // v14: vendedor não recebe o endereço de casa (homeLat/homeLng) dos OUTROS usuários; o admin recebe tudo.
          let itens = results || [];
          if (usrCfg.role !== "admin") itens = itens.map(x => {
            if (x.tipo !== "usuario" || String(x.agendor_id) === String(usrCfg.userId) || !x.extra) return x;
            try { const e = JSON.parse(x.extra); if (e && (e.homeLat != null || e.homeLng != null)) { delete e.homeLat; delete e.homeLng; return { ...x, extra: JSON.stringify(e) }; } } catch (er) {}
            return x;
          });
          return json({ itens }, cors);
        }
        if (request.method === "POST") {
          let b; try { b = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
          const op = b.op || "create";
          if (op === "create") {
            if (!b.tipo || !b.nome) return json({ error: "tipo e nome obrigatorios" }, cors, 400);
            const { results: mx } = await DB.prepare(
              "SELECT COALESCE(MAX(ordem),0)+1 AS prox FROM config_catalogo WHERE tipo=?"
            ).bind(b.tipo).all();
            const ordem = (mx && mx[0] && mx[0].prox) || 1;
            await DB.prepare(
              "INSERT OR IGNORE INTO config_catalogo (tipo,nome,cor,extra,ordem,ativo,atualizado_em) VALUES (?,?,?,?,?,1,datetime('now'))"
            ).bind(b.tipo, b.nome, b.cor || null, b.extra || null, ordem).run();
            return json({ ok: true }, cors);
          }
          if (op === "update") {
            if (!b.id) return json({ error: "id obrigatorio" }, cors, 400);
            await DB.prepare(
              "UPDATE config_catalogo SET nome=?, cor=?, extra=?, atualizado_em=datetime('now') WHERE id=?"
            ).bind(b.nome, b.cor || null, b.extra || null, b.id).run();
            return json({ ok: true }, cors);
          }
          if (op === "toggle") {
            if (!b.id) return json({ error: "id obrigatorio" }, cors, 400);
            await DB.prepare(
              "UPDATE config_catalogo SET ativo=?, atualizado_em=datetime('now') WHERE id=?"
            ).bind(b.ativo ? 1 : 0, b.id).run();
            return json({ ok: true }, cors);
          }
          if (op === "delete") {
            // Excluir de vez. Só admin logado. Item EM USO não é apagado — a saída é "Desativar".
            const adm = await sessaoAdmin(request, env);
            if (!adm) return json({ error: "Apenas o administrador pode excluir cadastros." }, cors, 403);
            if (!b.id) return json({ error: "id obrigatorio" }, cors, 400);
            const it = await DB.prepare("SELECT id,tipo,nome,extra FROM config_catalogo WHERE id=?").bind(b.id).first();
            if (!it) return json({ error: "cadastro nao encontrado" }, cors, 404);

            // Quantos registros ainda apontam para este item?
            // Comparação por UPPER(TRIM(...)) dos dois lados: "GERENTE" conta como uso de "Gerente".
            const USO = {
              status:    ["SELECT COUNT(*) n FROM clientes WHERE UPPER(TRIM(categoria_nome))=UPPER(TRIM(?))", "cliente(s) com este status"],
              segmento:  ["SELECT COUNT(*) n FROM clientes WHERE UPPER(TRIM(segmento))=UPPER(TRIM(?))",       "cliente(s) neste segmento"],
              canal:     ["SELECT COUNT(*) n FROM clientes WHERE UPPER(TRIM(canal))=UPPER(TRIM(?))",          "cliente(s) neste canal"],
              // Cargo de PDV: ignora contatos de empresas com segmento "Indústria" (eles usam cargo_industria)
              cargo:     ["SELECT COUNT(*) n FROM crm_contato t LEFT JOIN clientes c ON c.cnpj=t.cnpj WHERE t.excluido=0 AND UPPER(TRIM(t.cargo))=UPPER(TRIM(?)) AND COALESCE(c.segmento,'')<>'Indústria'", "contato(s) de PDV com este cargo"],
              cargo_industria: ["SELECT COUNT(*) n FROM crm_contato t JOIN clientes c ON c.cnpj=t.cnpj WHERE t.excluido=0 AND UPPER(TRIM(t.cargo))=UPPER(TRIM(?)) AND c.segmento='Indústria'", "contato(s) de indústria com este cargo"],
              industria: ["SELECT COUNT(*) n FROM itens WHERE UPPER(TRIM(industria))=UPPER(TRIM(?))",         "venda(s) desta indústria"],
              usuario:   ["SELECT (SELECT COUNT(*) FROM clientes WHERE UPPER(TRIM(vendedor))=UPPER(TRIM(?1))) + (SELECT COUNT(*) FROM crm_atividade WHERE excluido=0 AND UPPER(TRIM(user_nome))=UPPER(TRIM(?1))) n", "registro(s) deste usuário"],
              etiqueta:  ["SELECT COUNT(*) n FROM crm_contato_etiqueta WHERE removido_em IS NULL AND UPPER(TRIM(etiqueta))=UPPER(TRIM(?))", "pessoa(s) com esta etiqueta ativa"],
            };
            const regra = USO[it.tipo];
            if (regra) {
              const r = await DB.prepare(regra[0]).bind(it.nome).first();
              const n = (r && r.n) || 0;
              if (n > 0) return json({ error: `Não dá para excluir "${it.nome}": existem ${n} ${regra[1]}. Use "Desativar" — o histórico continua legível e o item some das listas.`, emUso: n }, cors, 409);
            }
            // Usuário com acesso de login: só sai se remover o acesso junto
            if (it.tipo === "usuario") {
              let ex = {}; try { ex = it.extra ? JSON.parse(it.extra) : {}; } catch {}
              const email = String(b.email || ex.email || "").trim().toLowerCase();
              if (email && await env.SYNC_KV.get("auth:user:" + email)) {
                if (!b.removerAcesso) return json({ error: `"${it.nome}" ainda tem acesso de login (${email}). Confirme a remoção do acesso para excluir.`, precisaAcesso: 1 }, cors, 409);
                await env.SYNC_KV.delete("auth:user:" + email);
              }
            }
            await DB.prepare("DELETE FROM config_catalogo WHERE id=?").bind(b.id).run();
            return json({ ok: true, excluido: it.nome }, cors);
          }
          return json({ error: "op desconhecida" }, cors, 400);
        }
        return json({ error: "metodo nao suportado" }, cors, 405);
      } catch (e) {
        return json({ error: String(e.message || e) }, cors, 500);
      }
    }

    // ===== ETIQUETAS das pessoas (v8) — mesmas regras do agente de WhatsApp =====
    if (path === "/api/crm/etiquetas" || path === "/api/crm/etiquetas-todas" || path === "/api/crm/etiqueta") {
      const usr = await sessaoUsuario(request, env);
      if (!usr) return json({ error: "sessao" }, cors, 401);
      const DB = env.DASHBOARD_DB;
      const SEL = "SELECT e.id, e.contato_id, e.cnpj, e.etiqueta, e.origem, e.user_nome, e.obs, e.criado_em, c.cor " +
        "FROM crm_contato_etiqueta e LEFT JOIN config_catalogo c ON c.tipo='etiqueta' AND c.nome=e.etiqueta WHERE e.removido_em IS NULL";
      try {
        if (path === "/api/crm/etiquetas-todas" && request.method === "GET") {
          const { results } = await DB.prepare(SEL + " ORDER BY e.criado_em DESC LIMIT 5000").all();
          return json({ ok: true, etiquetas: results || [] }, cors);
        }
        if (path === "/api/crm/etiquetas" && request.method === "GET") {
          const cnpj = (url.searchParams.get("cnpj") || "").replace(/\D/g, "");
          const cid = parseInt(url.searchParams.get("contato_id") || "0", 10) || 0;
          const ids = (url.searchParams.get("ids") || "").split(",").map(x => parseInt(x, 10)).filter(n => n > 0).slice(0, 200);
          if (!cnpj && !cid && !ids.length) return json({ error: "informe cnpj, contato_id ou ids" }, cors, 400);
          const conds = [], binds = [];
          if (cnpj) { conds.push("e.cnpj=?"); binds.push(cnpj); }
          if (cid) { conds.push("e.contato_id=?"); binds.push(cid); }
          if (ids.length) { conds.push("e.contato_id IN (" + ids.map(() => "?").join(",") + ")"); binds.push(...ids); }
          const { results } = await DB.prepare(SEL + " AND (" + conds.join(" OR ") + ") ORDER BY e.criado_em DESC").bind(...binds).all();
          return json({ ok: true, etiquetas: results || [] }, cors);
        }
        if (path === "/api/crm/etiqueta" && request.method === "POST") {
          let b; try { b = await request.json(); } catch { return json({ error: "json invalido" }, cors, 400); }
          const contatoId = parseInt(b.contato_id, 10) || 0;
          const nomeIn = String(b.etiqueta || "").trim();
          if (!contatoId || !nomeIn) return json({ error: "informe contato_id e etiqueta" }, cors, 400);
          const ctt = await DB.prepare("SELECT id, cnpj FROM crm_contato WHERE id=?").bind(contatoId).first();
          if (!ctt) return json({ error: "contato nao encontrado" }, cors, 404);
          const cnpj = String(b.cnpj || ctt.cnpj || "").replace(/\D/g, "") || null;
          // v9: compara no JS (o UPPER do D1 não converte letras acentuadas: "cotação" ≠ "COTAÇÃO")
          const chave = x => String(x || "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
          const { results: catLista } = await DB.prepare("SELECT nome, ativo FROM config_catalogo WHERE tipo='etiqueta'").all();
          const cat = (catLista || []).find(c => chave(c.nome) === chave(nomeIn)) || null;
          const etq = cat ? cat.nome : nomeIn;
          if (b.remover) {
            await DB.prepare("UPDATE crm_contato_etiqueta SET removido_em=datetime('now') WHERE contato_id=? AND etiqueta=? AND removido_em IS NULL").bind(contatoId, etq).run();
          } else {
            if (!cat || !cat.ativo) return json({ error: `Etiqueta "${nomeIn}" não existe ou está desativada no catálogo.` }, cors, 400);
            await DB.prepare("INSERT OR IGNORE INTO crm_contato_etiqueta (contato_id, cnpj, etiqueta, origem, user_nome, obs) VALUES (?,?,?,?,?,?)")
              .bind(contatoId, cnpj, etq, "teamcheck", usr.name || usr.email || null, b.obs ? String(b.obs).slice(0, 300) : null).run();
            // v9: fluxo BAZAR/MATCON — encerra as etapas anteriores/conflitantes da mesma pessoa
            for (const outra of TRANSICOES_ETQ[etq] || []) {
              await DB.prepare("UPDATE crm_contato_etiqueta SET removido_em=datetime('now') WHERE contato_id=? AND etiqueta=? AND removido_em IS NULL").bind(contatoId, outra).run();
            }
          }
          const { results } = await DB.prepare(SEL + " AND e.contato_id=? ORDER BY e.criado_em DESC").bind(contatoId).all();
          return json({ ok: true, contato_id: contatoId, etiquetas: results || [] }, cors);
        }
        return json({ error: "metodo nao suportado" }, cors, 405);
      } catch (e) {
        return json({ error: String(e.message || e) }, cors, 500);
      }
    }

    // ===== MIGRACAO GPS: KV(visit:plocs) -> D1(crm_gps) (inalterado) =====
    if (path === "/api/crm/gps-migrar") {
      const s = request.headers.get("X-Session");
      const sr = s ? await env.SYNC_KV.get("auth:session:" + s) : null;
      if (!sr) return json({ error: "sessao" }, cors, 401);
      try { await usoDiario(env, request, JSON.parse(sr).email); } catch {}
      let nome = null; try { const ur = await env.SYNC_KV.get("auth:user:" + JSON.parse(sr).email); nome = ur ? JSON.parse(ur).name : null; } catch {}
      const raw = await env.SYNC_KV.get("visit:plocs");
      let obj = {};
      try { const p = raw ? JSON.parse(raw) : {}; obj = p.active || p || {}; } catch {}
      const ids = Object.keys(obj);
      let ok = 0, skip = 0;
      for (const oid of ids) {
        const g = obj[oid] || {};
        if (g.lat == null || g.lng == null) { skip++; continue; }
        try {
          await env.DASHBOARD_DB.prepare(
            "INSERT INTO crm_gps (org_id,cnpj,lat,lng,precisao,user_nome,atualizado_em) VALUES (?,?,?,?,?,?,datetime('now')) " +
            "ON CONFLICT(org_id) DO UPDATE SET lat=excluded.lat, lng=excluded.lng, precisao=excluded.precisao, atualizado_em=excluded.atualizado_em"
          ).bind(Number(oid), null, Number(g.lat), Number(g.lng), (g.acc != null ? Number(g.acc) : null), nome).run();
          ok++;
        } catch (e) { skip++; }
      }
      return json({ ok: true, total: ids.length, migrados: ok, ignorados: skip }, cors);
    }

    // ===== v10: portão do SYNC e do CNPJ =====
    // SYNC_EXIGE_SESSAO="1" → sessão obrigatória. Sem a variável (transição) → sessão conferida SE vier.
    let usuarioSync = null;   // v14
    if (url.searchParams.has("sync") || url.searchParams.has("cnpj")) {
      const temSessao = !!request.headers.get("X-Session");
      const exige = String(env.SYNC_EXIGE_SESSAO || "") === "1";
      if (temSessao || exige) {
        const u = await sessaoUsuario(request, env);
        if (!u) return json({ error: "sessao" }, cors, 401);
        usuarioSync = u;
      }
    }

    // ===== SYNC (KV) =====
    if (url.searchParams.has("sync")) {
      const uid = url.searchParams.get("sync");
      if (!uid) return json({ error: "missing sync id" }, cors);
      if (!SYNC_CHAVE_OK.test(uid)) return json({ error: "sync id invalido" }, cors, 400);
      // v14: dono da chave
      if (usuarioSync && usuarioSync.role !== "admin") {
        const pessoal = uid.match(/^(?:visits_|semana_)?(\d+)$/);
        if (pessoal && String(pessoal[1]) !== String(usuarioSync.userId)) return json({ error: "sem permissao para esta chave" }, cors, 403);
        if (uid === "analisePremissas" && request.method !== "GET") return json({ error: "apenas admin" }, cors, 403);
      }
      if (request.method === "PUT" && Number(request.headers.get("Content-Length") || 0) > SYNC_MAX_BYTES) return json({ error: "conteudo grande demais" }, cors, 413);
      try {
        if (request.method === "GET") {
          const d = await env.SYNC_KV.get("visit:" + uid);
          return json(d ? JSON.parse(d) : { active: null }, cors);
        }
        if (request.method === "PUT") {
          const body = await request.text();
          if (body.length > SYNC_MAX_BYTES) return json({ error: "conteudo grande demais" }, cors, 413);
          const durable = (uid === "dayBases" || uid === "plocs" || uid.startsWith("visits_") || uid === "analisePremissas" || uid.startsWith("semana_"));
          await env.SYNC_KV.put("visit:" + uid, body, durable ? {} : { expirationTtl: 86400 });
          return json({ ok: true }, cors);
        }
        if (request.method === "DELETE") {
          await env.SYNC_KV.delete("visit:" + uid);
          return json({ ok: true }, cors);
        }
      } catch (e) {
        return json({ error: e.message }, cors, 500);
      }
    }

    // ===== CNPJ (BrasilAPI) — v10: só 14 dígitos (antes repassava qualquer texto para a BrasilAPI) =====
    if (url.searchParams.has("cnpj")) {
      const cnpjQ = String(url.searchParams.get("cnpj") || "").replace(/\D/g, "");
      if (cnpjQ.length !== 14) return json({ error: "cnpj invalido" }, cors, 400);
      try {
        const r = await fetch("https://brasilapi.com.br/api/cnpj/v1/" + cnpjQ);
        const data = await r.text();
        return new Response(data, { status: r.status, headers: { "Content-Type": "application/json", ...cors } });
      } catch (e) {
        return json({ error: e.message }, cors, 500);
      }
    }

    return json({ error: "rota nao encontrada" }, cors, 404);
  },

  // ===== CRON: e-mail de alerta de tarefas pendentes (segunda/quarta/sexta) =====
  // Acionador Cron: "0 11 * * 1,3,5"  (11:00 UTC = 07:00 em Cuiabá)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(enviarAlertasTarefas(env));
    // v10: limpeza do registro de tentativas
    ctx.waitUntil((async () => { try { await garantirTentativa(env); await env.DASHBOARD_DB.prepare("DELETE FROM auth_tentativa WHERE criado_em < datetime('now','-2 days')").run(); } catch (e) {} })());
    // v12: registro de acessos fica 190 dias (Marco Civil pede 6 meses)
    ctx.waitUntil((async () => { try { await garantirLog(env); await env.DASHBOARD_DB.prepare("DELETE FROM log_acesso WHERE criado_em < datetime('now','-190 days')").run(); } catch (e) {} })());
  },
};

// ───────────────────────── v10: trava de tentativas (D1) ─────────────────────────
// Uma linha por tentativa que conta (erro de login, pedido de código, erro de código, chave admin errada).
let _tentativaPronta = false;
async function garantirTentativa(env) {
  if (_tentativaPronta || !env.DASHBOARD_DB) return;
  await env.DASHBOARD_DB.prepare(
    "CREATE TABLE IF NOT EXISTS auth_tentativa (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, email TEXT, ip TEXT, criado_em TEXT DEFAULT (datetime('now')))"
  ).run();
  await env.DASHBOARD_DB.prepare("CREATE INDEX IF NOT EXISTS ix_auth_tentativa ON auth_tentativa (tipo, criado_em)").run();
  _tentativaPronta = true;
}
async function registrar(env, tipo, email, ip) {
  try { await garantirTentativa(env); await env.DASHBOARD_DB.prepare("INSERT INTO auth_tentativa (tipo,email,ip) VALUES (?,?,?)").bind(tipo, email || "", ip || "").run(); } catch (e) {}
}
// regras: [["email"|"ip", valor, limite], ...] dentro da janela (minutos). Falha do D1 nunca bloqueia o login.
async function excedeu(env, tipo, regras, minutos) {
  try {
    await garantirTentativa(env);
    for (const [campo, valor, limite] of regras) {
      if (!valor) continue;
      const r = await env.DASHBOARD_DB.prepare(
        campo === "par"
          ? "SELECT COUNT(*) n FROM auth_tentativa WHERE tipo=? AND (email || '|' || ip)=? AND criado_em > datetime('now', ?)"
          : `SELECT COUNT(*) n FROM auth_tentativa WHERE tipo=? AND ${campo === "ip" ? "ip" : "email"}=? AND criado_em > datetime('now', ?)`
      ).bind(tipo, valor, `-${minutos} minutes`).first();
      if (((r && r.n) || 0) >= limite) return true;
    }
  } catch (e) {}
  return false;
}
// Encerra sessões no KV. email=null → todas; exceto = token que fica.
async function encerrarSessoes(env, email, exceto) {
  let cursor, n = 0;
  do {
    const l = await env.SYNC_KV.list({ prefix: "auth:session:", cursor });
    for (const k of l.keys) {
      const tok = k.name.slice("auth:session:".length);
      if (exceto && tok === exceto) continue;
      if (email) {
        const v = await env.SYNC_KV.get(k.name);
        let em = ""; try { em = JSON.parse(v || "{}").email || ""; } catch {}
        if (em !== email) continue;
      }
      await env.SYNC_KV.delete(k.name); n++;
    }
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);
  return n;
}
function escH(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// ─────────────────────────────────────────────────────────────────────────────

// ───────────────────────── v12: registro de acessos (Marco Civil, art. 15) ─────────────────────────
// Só metadados: evento, e-mail, IP, Origin e navegador. Nunca senha, código, token ou corpo. Erro aqui nunca derruba nada.
let _logPronto = false;
async function garantirLog(env) {
  if (_logPronto || !env.DASHBOARD_DB) return;
  await env.DASHBOARD_DB.prepare(
    "CREATE TABLE IF NOT EXISTS log_acesso (id INTEGER PRIMARY KEY AUTOINCREMENT, evento TEXT NOT NULL, email TEXT, ip TEXT, origem TEXT, user_agent TEXT, criado_em TEXT DEFAULT (datetime('now')))"
  ).run();
  await env.DASHBOARD_DB.prepare("CREATE INDEX IF NOT EXISTS ix_log_acesso_data ON log_acesso (criado_em)").run();
  await env.DASHBOARD_DB.prepare("CREATE INDEX IF NOT EXISTS ix_log_acesso_email ON log_acesso (email, criado_em)").run();
  _logPronto = true;
}
function metaReq(request) {
  return {
    ip: request.headers.get("CF-Connecting-IP") || "",
    origem: (request.headers.get("Origin") || "").slice(0, 120),
    ua: (request.headers.get("User-Agent") || "").slice(0, 200),
  };
}
async function logAcesso(env, request, evento, email) {
  try {
    await garantirLog(env);
    const m = metaReq(request);
    await env.DASHBOARD_DB.prepare("INSERT INTO log_acesso (evento, email, ip, origem, user_agent) VALUES (?,?,?,?,?)")
      .bind(evento, email ? String(email).toLowerCase().slice(0, 200) : null, m.ip, m.origem, m.ua).run();
  } catch (e) {}
}
// "uso": no máximo 1 linha por e-mail + IP + dia (dia de Cuiabá, UTC−4). Memória do isolate evita ir ao D1 a cada chamada.
const _usoVisto = new Set();
async function usoDiario(env, request, email) {
  try {
    if (!email) return;
    const em = String(email).toLowerCase().slice(0, 200);
    const m = metaReq(request);
    if (!m.origem) return;   // v13: servidor→servidor (sem Origin) não conta como uso
    const dia = new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10);
    const chave = em + "|" + m.ip + "|" + dia;
    if (_usoVisto.has(chave)) return;
    await garantirLog(env);
    // início do dia de Cuiabá em UTC = dia 04:00:00
    await env.DASHBOARD_DB.prepare(
      "INSERT INTO log_acesso (evento, email, ip, origem, user_agent) SELECT 'uso', ?1, ?2, ?3, ?4 " +
      "WHERE NOT EXISTS (SELECT 1 FROM log_acesso WHERE evento='uso' AND email=?1 AND ip=?2 AND criado_em >= ?5)"
    ).bind(em, m.ip, m.origem, m.ua, dia + " 04:00:00").run();
    if (_usoVisto.size > 5000) _usoVisto.clear();
    _usoVisto.add(chave);
  } catch (e) {}
}

// v8: sessão válida (qualquer papel) → registro do usuário; senão null
async function sessaoUsuario(request, env) {
  const s = request.headers.get("X-Session");
  if (!s) return null;
  const sr = await env.SYNC_KV.get("auth:session:" + s);
  if (!sr) return null;
  const em = JSON.parse(sr).email;
  const ur = await env.SYNC_KV.get("auth:user:" + em);
  if (!ur) return null;
  const u = JSON.parse(ur);
  await usoDiario(env, request, u.email || em);
  return { ...u, email: u.email || em };
}

// Sessão válida E papel admin → retorna o registro do usuário; senão null
async function sessaoAdmin(request, env) {
  const s = request.headers.get("X-Session");
  if (!s) return null;
  const sr = await env.SYNC_KV.get("auth:session:" + s);
  if (!sr) return null;
  const ur = await env.SYNC_KV.get("auth:user:" + JSON.parse(sr).email);
  if (!ur) return null;
  const u = JSON.parse(ur);
  await usoDiario(env, request, u.email || JSON.parse(sr).email);
  return u.role === "admin" ? { ...u, email: u.email || JSON.parse(sr).email } : null;
}

// Monta e envia o e-mail de tarefas pendentes para cada usuário com acesso e e-mail
async function enviarAlertasTarefas(env) {
  const enviados = [], pulados = [];
  // Lista todos os acessos (auth:user:*) no KV.
  // O e-mail é a própria chave (auth:user:{email}); usamos ele quando o registro não traz u.email.
  let cursor = undefined; const usuarios = [];
  do {
    const l = await env.SYNC_KV.list({ prefix: "auth:user:", cursor });
    for (const k of l.keys) {
      const raw = await env.SYNC_KV.get(k.name);
      if (raw) { try { const o = JSON.parse(raw); o._emailChave = k.name.slice("auth:user:".length); usuarios.push(o); } catch {} }
    }
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);

  const segunda = new Date(Date.now() - 4 * 3600000).getUTCDay() === 1;
  for (const u of usuarios) {
    const email = ((u.email || u._emailChave || "").trim()).toLowerCase();
    if (!email) { pulados.push({ user: u.name, motivo: "sem e-mail" }); continue; }
    // Tarefas pendentes do usuário (casa por user_id OU pelo nome — atividades migradas têm user_id nulo)
    let tarefas = [];
    try {
      const { results } = await env.DASHBOARD_DB.prepare(
        "SELECT org_nome, tipo, texto, due_em FROM crm_atividade " +
        "WHERE origem='tarefa' AND concluida=0 AND excluido=0 AND (user_id=? OR (user_id IS NULL AND user_nome=?)) " +
        "ORDER BY (due_em IS NULL), due_em LIMIT 60"
      ).bind(u.userId || -1, u.name || "").all();
      tarefas = results || [];
    } catch (e) { pulados.push({ user: u.name, motivo: "erro D1: " + e.message }); continue; }
    // v7: lista "valem visita esta semana" (calculada pelo app) — só na segunda e se tiver até 7 dias
    let semana = null;
    if (segunda && u.userId) {
      try { const sr = await env.SYNC_KV.get("visit:semana_" + u.userId); const sd = sr ? JSON.parse(sr) : null; const a = sd && (sd.active || sd);
        if (a && Array.isArray(a.itens) && a.itens.length && a.gerado && (Date.now() - Date.parse(a.gerado + "T12:00:00Z")) < 8 * 86400000) semana = a; } catch {}
    }
    if (!tarefas.length && !semana) { pulados.push({ user: u.name, motivo: "sem tarefas pendentes" }); continue; }
    const ok = await sendTarefasEmail(env, email, u.name || "", tarefas, semana);
    (ok ? enviados : pulados).push(ok ? { user: u.name, email, tarefas: tarefas.length } : { user: u.name, motivo: "falha no envio" });
  }
  return { enviados, pulados };
}

function json(obj, cors, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });
}
function buf2hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join(""); }
function hex2buf(hex) { const a = new Uint8Array(hex.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16); return a; }
function randHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return buf2hex(a); }
function gen6() { const a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000).padStart(6, "0"); }
async function pbkdf2(password, saltHex, iter) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: hex2buf(saltHex), iterations: iter, hash: "SHA-256" }, key, 256);
  return buf2hex(bits);
}
function eqHex(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

// Datas do D1/app → exibição em Cuiabá (UTC−4, sem horário de verão)
function fmtCuiaba(iso) {
  if (!iso) return "";
  try {
    let d;
    if (/[+-]\d\d:\d\d$/.test(iso) || iso.endsWith("Z")) d = new Date(iso);
    else d = new Date(iso.replace(" ", "T") + "Z"); // datetime('now') do D1 é UTC sem sufixo
    if (isNaN(d)) return iso;
    const c = new Date(d.getTime() - 4 * 3600000);
    const p = n => String(n).padStart(2, "0");
    return `${p(c.getUTCDate())}/${p(c.getUTCMonth() + 1)}/${c.getUTCFullYear()} ${p(c.getUTCHours())}:${p(c.getUTCMinutes())}`;
  } catch { return iso; }
}
function hojeCuiaba() {
  const c = new Date(Date.now() - 4 * 3600000);
  const p = n => String(n).padStart(2, "0");
  return `${c.getUTCFullYear()}-${p(c.getUTCMonth() + 1)}-${p(c.getUTCDate())}`;
}

async function mandaResend(env, to, subject, html) {
  if (!env.RESEND_API_KEY) return false;
  const from = env.MAIL_FROM || "TeamCheck <nao-responda@send.jordanmt.com>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

function casca(inner) {
  return `<!doctype html><html><body style="margin:0;background:#0F1B2D;font-family:Arial,Helvetica,sans-serif;color:#E8ECF1;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#162236;border:1px solid #243349;border-radius:14px;padding:28px">
    <h1 style="margin:0 0 4px;font-size:20px;color:#E8ECF1;text-align:center">TeamCheck</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#8899AB;text-align:center">Jordan Representações</p>
    ${inner}
  </div></body></html>`;
}

async function sendResetEmail(env, toEmail, toName, code) {
  const nome = toName ? (" " + escH(toName.split(" ")[0])) : "";
  const html = casca(`
    <p style="margin:0 0 14px;font-size:14px;color:#E8ECF1;text-align:center">Olá${nome}, use o código abaixo para redefinir sua senha:</p>
    <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#0578A6;background:#0F1B2D;border:1px solid #243349;border-radius:10px;padding:16px 0;margin:0 0 14px;text-align:center">${code}</div>
    <p style="margin:0;font-size:12px;color:#8899AB;text-align:center">O código vale por 15 minutos. Se você não pediu, ignore este e-mail.</p>`);
  return mandaResend(env, toEmail, "TeamCheck — código para redefinir senha", html);
}

async function sendConviteEmail(env, toEmail, toName, code, quemConvidou) {
  const nome = toName ? (" " + escH(toName.split(" ")[0])) : "";
  const html = casca(`
    <p style="margin:0 0 12px;font-size:14px;color:#E8ECF1">Olá${nome}! <b>${escH(quemConvidou)}</b> criou um acesso para você no <b>TeamCheck</b>, o app de campo e CRM da Jordan Representações.</p>
    <p style="margin:0 0 8px;font-size:13px;color:#8899AB">Para criar sua senha:</p>
    <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#E8ECF1;line-height:1.8">
      <li>Abra <a href="https://jordan-checkin.vercel.app" style="color:#0AAEE8">jordan-checkin.vercel.app</a></li>
      <li>Digite seu e-mail (<b>${escH(toEmail)}</b>) e toque em <b>"Primeiro acesso — tenho um código"</b></li>
      <li>Informe o código abaixo e crie sua senha</li>
    </ol>
    <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#2A9D8F;background:#0F1B2D;border:1px solid #243349;border-radius:10px;padding:16px 0;margin:0 0 14px;text-align:center">${code}</div>
    <p style="margin:0;font-size:12px;color:#8899AB;text-align:center">O código vale por 48 horas. Depois de entrar, use "Instalar aplicativo" em Configurações para ter o TeamCheck na tela inicial do celular.</p>`);
  return mandaResend(env, toEmail, "TeamCheck — seu convite de acesso", html);
}

async function sendTarefasEmail(env, toEmail, toName, tarefas, semana) {
  const nome = toName ? (" " + escH(toName.split(" ")[0])) : "";
  const hoje = hojeCuiaba();
  const linha = (t, corPrazo) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #243349;font-size:12.5px;color:#E8ECF1"><b>${escH(t.org_nome || "—")}</b><br><span style="color:#8899AB">${escH((t.texto || "").slice(0, 120))}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #243349;font-size:12px;color:${corPrazo};white-space:nowrap;text-align:right">${t.due_em ? fmtCuiaba(t.due_em) : "sem prazo"}</td>
    </tr>`;
  const grupo = (titulo, cor, lista) => lista.length ? `
    <p style="margin:16px 0 6px;font-size:13px;font-weight:bold;color:${cor}">${titulo} (${lista.length})</p>
    <table style="width:100%;border-collapse:collapse;background:#0F1B2D;border:1px solid #243349;border-radius:10px">${lista.map(t => linha(t, cor)).join("")}</table>` : "";
  const atrasadas = tarefas.filter(t => t.due_em && String(t.due_em).slice(0, 10) < hoje);
  const doDia = tarefas.filter(t => t.due_em && String(t.due_em).slice(0, 10) === hoje);
  const proximas = tarefas.filter(t => t.due_em && String(t.due_em).slice(0, 10) > hoje);
  const semPrazo = tarefas.filter(t => !t.due_em);
  const esc = x => String(x || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const blocoSemana = semana ? `
    <p style="margin:16px 0 6px;font-size:13px;font-weight:bold;color:#2A9D8F">Valem visita esta semana (${semana.total || semana.itens.length})</p>
    <table style="width:100%;border-collapse:collapse;background:#0F1B2D;border:1px solid #243349;border-radius:10px">${semana.itens.slice(0, 15).map(i => `
      <tr><td style="padding:8px 10px;border-bottom:1px solid #243349;font-size:12.5px;color:#E8ECF1"><b>${esc(i.nome)}</b><br><span style="color:#8899AB">${esc(i.local)}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #243349;font-size:12px;color:#8899AB;white-space:nowrap;text-align:right">${i.dias == null ? "nunca visitado" : "última visita há " + i.dias + "d"}</td></tr>`).join("")}</table>
    <p style="margin:6px 0 0;font-size:11.5px;color:#8899AB">Lista do TeamCheck (Análise de visitas), calculada em ${esc(String(semana.gerado).split("-").reverse().join("/"))}. No app: PDVs → "Planejar rota com eles".</p>` : "";
  const html = casca(`
    <p style="margin:0 0 6px;font-size:14px;color:#E8ECF1">Bom dia${nome}! ${tarefas.length ? `Você tem <b>${tarefas.length} tarefa(s) pendente(s)</b> no TeamCheck:` : "Sem tarefas pendentes hoje."}</p>
    ${blocoSemana}
    ${grupo("⚠️ Atrasadas", "#FB4B3A", atrasadas)}
    ${grupo("📌 Para hoje", "#C8964E", doDia)}
    ${grupo("🗓️ Próximas", "#0AAEE8", proximas)}
    ${grupo("📋 Sem prazo", "#8899AB", semPrazo)}
    <p style="margin:18px 0 0;font-size:12px;color:#8899AB;text-align:center">Abra o TeamCheck → <b>Agenda</b> para finalizar ou reagendar. Este lembrete sai segunda, quarta e sexta às 07:00.</p>`);
  const assunto = tarefas.length ? `TeamCheck — ${tarefas.length} tarefa(s) pendente(s)${semana ? " · valem visita esta semana" : ""}` : "TeamCheck — valem visita esta semana";
  return mandaResend(env, toEmail, assunto, html);
}
