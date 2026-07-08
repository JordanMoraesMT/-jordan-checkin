// TeamCheck p/ WhatsApp Web — service worker de fundo (v3).
// Responsabilidades:
//  1) Proxy de rede: o fetch do content script é bloqueado pela CSP do web.whatsapp.com;
//     o service worker é imune e usa as host_permissions (*.jordanmt.com).
//  2) SSO: lê o cookie de sessão "ses" que o TeamCheck/Dashboard já gravou em .jordanmt.com
//     (via chrome.cookies — funciona mesmo sendo HttpOnly). Assim NÃO há login na extensão.
const DASH = "https://dashboard.jordanmt.com";

// Lê a sessão compartilhada (cookie "ses" de .jordanmt.com). Retorna string ou null.
async function lerSessao() {
  const tentativas = [
    { url: DASH + "/", name: "ses" },
    { url: "https://teamcheck.jordanmt.com/", name: "ses" },
  ];
  for (const t of tentativas) {
    try {
      const c = await chrome.cookies.get(t);
      if (c && c.value) return c.value;
    } catch (e) {}
  }
  // fallback: qualquer cookie "ses" no domínio jordanmt.com
  try {
    const all = await chrome.cookies.getAll({ domain: "jordanmt.com", name: "ses" });
    if (all && all.length) {
      const comValor = all.find(c => c.value);
      if (comValor) return comValor.value;
    }
  } catch (e) {}
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.tipo === "ping") { sendResponse({ pong: true }); return; }

  if (msg.tipo === "sessao") {
    lerSessao().then((s) => sendResponse({ ok: true, session: s || null }))
               .catch((e) => sendResponse({ ok: false, erro: String(e && e.message || e) }));
    return true; // assíncrono
  }

  if (msg.tipo === "http") {
    (async () => {
      try {
        const r = await fetch(msg.url, msg.opts || {});
        const texto = await r.text();
        let json = null; try { json = JSON.parse(texto); } catch {}
        sendResponse({ ok: r.ok, status: r.status, json, texto: json ? undefined : texto.slice(0, 300) });
      } catch (e) {
        sendResponse({ ok: false, status: 0, erro: String(e && e.message || e) });
      }
    })();
    return true; // resposta assíncrona
  }
});
