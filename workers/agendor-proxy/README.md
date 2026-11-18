# agendor-proxy (Cloudflare Worker)

Login/sessão do TeamCheck, catálogos (`/api/config`), sync em KV, consulta de CNPJ, etiquetas das pessoas
(`/api/crm/etiquetas*`) e o e-mail de tarefas (cron seg/qua/sex 07:00 Cuiabá).

- Código: `worker.js` · Configuração: `wrangler.toml` (D1 `DASHBOARD_DB`, KV `SYNC_KV`, `MAIL_FROM`, cron).
- Segredos ficam só no Cloudflare: `ADMIN_KEY`, `RESEND_API_KEY`.
- **Deploy automático:** Cloudflare → Workers e Pages → agendor-proxy → Configurações → Build, ligado a este
  repositório, diretório raiz `workers/agendor-proxy`, comando `npx wrangler deploy`, caminhos monitorados
  `workers/agendor-proxy/*`. Um push que altere esta pasta publica o Worker.

_Deploy automático ligado em 17/11/2026 (Cloudflare Workers Builds, diretório raiz `workers/agendor-proxy`)._
