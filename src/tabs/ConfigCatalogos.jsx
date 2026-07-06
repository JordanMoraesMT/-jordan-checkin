// TeamCheck — Gestão de catálogos (admin): usuários, segmentos, status de clientes, indústrias
import { useState, useEffect, useMemo } from "react";
import { S, cfgApi, API } from "../lib";

const TIPOS = [
  { id: "usuario",   l: "Usuários",   emo: "👤", temEmail: true,  temCor: false },
  { id: "segmento",  l: "Segmentos",  emo: "🏷️", temEmail: false, temCor: false },
  { id: "status",    l: "Status de clientes", emo: "🔖", temEmail: false, temCor: true },
  { id: "industria", l: "Indústrias", emo: "🏭", temEmail: false, temCor: true },
];
const PALETA = ["#0AAEE8","#12C265","#8B5CF6","#06B6D4","#FFB020","#FF4D8D","#FB4B3A","#06C281"];

function ConfigCatalogos({ token }) {
  const [tab, setTab] = useState("usuario");
  const [itens, setItens] = useState([]);
  const [lo, setLo] = useState(false);
  const [err, setErr] = useState("");
  const [novo, setNovo] = useState(false);
  const [edit, setEdit] = useState(null); // item em edição
  const [form, setForm] = useState({ nome: "", email: "", cor: PALETA[0], admin: false });
  const [convLo, setConvLo] = useState(null); // id do item convidando

  // Convite por e-mail: cria o acesso (login) no Worker e envia e-mail com código para definir a senha
  const convidar = async (it) => {
    let ex = {}; try { ex = it.extra ? JSON.parse(it.extra) : {}; } catch {}
    const email = (ex.email || "").trim().toLowerCase();
    if (!email) { alert("Este usuário não tem e-mail cadastrado. Edite e informe o e-mail primeiro."); return; }
    if (!confirm(`Enviar convite de acesso para ${email}?\nO usuário receberá um e-mail com código para criar a própria senha.`)) return;
    setConvLo(it.id);
    try {
      const r = await fetch(`${API}/admin/convidar`, { method: "POST", headers: { "X-Session": token, "Content-Type": "application/json" }, body: JSON.stringify({ email, nome: it.nome, admin: !!ex.admin, catId: it.id, userId: it.agendor_id || null }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { alert(`Convite enviado para ${email}!\nO usuário deve abrir o TeamCheck → "Primeiro acesso / tenho um código" e criar a senha.`); await carregar(); }
      else alert("Não foi possível convidar: " + (d.error || r.status));
    } catch (e) { alert("Erro de conexão: " + e.message); }
    setConvLo(null);
  };

  const meta = useMemo(() => TIPOS.find(t => t.id === tab), [tab]);

  const carregar = async () => {
    setLo(true); setErr("");
    try {
      const r = await cfgApi(token, "GET");
      setItens(Array.isArray(r?.itens) ? r.itens : (Array.isArray(r) ? r : []));
    } catch (e) {
      setErr("Não foi possível carregar os catálogos. Verifique a rota /api/config no Worker.");
      setItens([]);
    }
    setLo(false);
  };
  useEffect(() => { if (token) carregar(); }, [token]);

  const doTipo = itens.filter(i => i.tipo === tab).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  const abrirNovo = () => { setForm({ nome: "", email: "", cor: PALETA[0], admin: false }); setEdit(null); setNovo(true); };
  const abrirEdit = (it) => {
    let ex = {}; try { ex = it.extra ? JSON.parse(it.extra) : {}; } catch {}
    setForm({ nome: it.nome || "", email: ex.email || "", cor: it.cor || PALETA[0], admin: !!ex.admin });
    setEdit(it); setNovo(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { alert("Informe o nome."); return; }
    const extra = {};
    if (meta.temEmail) { extra.email = form.email || null; extra.admin = form.admin ? 1 : 0; }
    const body = {
      op: edit ? "update" : "create",
      id: edit?.id,
      tipo: tab,
      nome: form.nome.trim(),
      cor: meta.temCor ? form.cor : null,
      extra: Object.keys(extra).length ? JSON.stringify(extra) : null,
    };
    try {
      await cfgApi(token, "POST", body);
      setNovo(false); setEdit(null);
      await carregar();
    } catch (e) { alert("Erro ao salvar: " + (e.body || e.message)); }
  };

  const alternarAtivo = async (it) => {
    try { await cfgApi(token, "POST", { op: "toggle", id: it.id, ativo: it.ativo ? 0 : 1 }); await carregar(); }
    catch (e) { alert("Erro: " + (e.body || e.message)); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.txt }}>Cadastros do sistema</div>
          <div style={{ fontSize: 12, color: S.ts, marginTop: 2 }}>
            {err || "Usuários, segmentos, status de clientes e indústrias — a base do CRM"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={carregar} disabled={lo} style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${S.inpBdr}`, background: S.inp, fontSize: 14, padding: 0 }}>{lo ? "…" : "🔄"}</button>
          <button onClick={abrirNovo} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--chrome)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Adicionar</button>
        </div>
      </div>

      {/* Abas dos tipos (segmentado padrão) */}
      <div style={{ display: "flex", gap: 5, background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 11, padding: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {TIPOS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setNovo(false); }} style={{ flex: "1 1 120px", textAlign: "center", padding: "9px 6px", borderRadius: 8, fontSize: 13, fontWeight: tab === t.id ? 600 : 500, background: tab === t.id ? "var(--card-solid)" : "transparent", color: tab === t.id ? S.pl : S.ts, boxShadow: tab === t.id ? "0 1px 2px rgba(3,73,100,.14)" : "none", border: "none", cursor: "pointer" }}>
            {t.emo} {t.l}
          </button>
        ))}
      </div>

      {/* Formulário novo/editar */}
      {novo && (
        <div style={{ background: S.card, border: `1px solid ${S.pri}55`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt, marginBottom: 12 }}>{edit ? "Editar" : "Novo"} — {meta.l.replace(/s$/, "")}</div>
          <div style={{ display: "grid", gridTemplateColumns: meta.temEmail ? "1fr 1fr" : "1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: S.ts, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Nome</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={{ width: "100%", marginTop: 4 }} autoFocus />
            </div>
            {meta.temEmail && (
              <div>
                <label style={{ fontSize: 11, color: S.ts, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>E-mail (login)</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", marginTop: 4 }} />
              </div>
            )}
          </div>
          {meta.temEmail && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: S.t2, cursor: "pointer" }}>
              <input type="checkbox" checked={form.admin} onChange={e => setForm(f => ({ ...f, admin: e.target.checked }))} style={{ width: "auto" }} />
              Administrador (vê comissões, equipe e edita metas)
            </label>
          )}
          {meta.temCor && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, color: S.ts, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Cor</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {PALETA.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, cor: c }))} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: form.cor === c ? "3px solid var(--t1)" : `1px solid ${S.brd}`, cursor: "pointer", padding: 0 }} />
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setNovo(false); setEdit(null); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${S.inpBdr}`, background: "transparent", color: S.t2, fontSize: 13 }}>Cancelar</button>
            <button onClick={salvar} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: S.acc, color: "#fff", fontSize: 13, fontWeight: 600 }}>{edit ? "Salvar alterações" : "Adicionar"}</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {lo && <p style={{ color: S.ts, textAlign: "center", padding: "2rem 0" }}>Carregando…</p>}
      {!lo && !doTipo.length && !err && <p style={{ color: S.ts, textAlign: "center", padding: "2rem 0" }}>Nenhum item cadastrado ainda.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {doTipo.map(it => {
          let ex = {}; try { ex = it.extra ? JSON.parse(it.extra) : {}; } catch {}
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, background: S.card, border: `1px solid ${S.brd}`, borderRadius: 12, padding: "12px 16px", opacity: it.ativo ? 1 : 0.5 }}>
              {meta.temCor && <span style={{ width: 14, height: 14, borderRadius: 4, background: it.cor || S.td, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: S.txt, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {it.nome}
                  {ex.admin ? <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: S.gold + "33", color: S.gold, fontWeight: 700 }}>ADMIN</span> : null}
                  {!it.ativo && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: S.td + "33", color: S.td, fontWeight: 700 }}>INATIVO</span>}
                </div>
                <div style={{ fontSize: 11.5, color: S.td, marginTop: 2 }}>
                  {ex.email ? ex.email + " · " : ""}{it.agendor_id ? `ID origem #${it.agendor_id}` : "cadastro próprio"}
                </div>
              </div>
              {meta.temEmail && <button onClick={() => convidar(it)} disabled={convLo === it.id} title="Enviar convite de acesso por e-mail" style={{ height: 32, borderRadius: 8, border: `1px solid ${S.acc}55`, background: S.inp, color: S.acc, cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "0 10px" }}>{convLo === it.id ? "..." : "✉️ Convidar"}</button>}
              <button onClick={() => abrirEdit(it)} title="Editar" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.inpBdr}`, background: S.inp, cursor: "pointer", fontSize: 13, padding: 0 }}>✏️</button>
              <button onClick={() => alternarAtivo(it)} title={it.ativo ? "Desativar" : "Reativar"} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${it.ativo ? S.dng : S.acc}55`, background: S.inp, color: it.ativo ? S.dng : S.acc, cursor: "pointer", fontSize: 14, padding: 0 }}>{it.ativo ? "⏻" : "↻"}</button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: S.td, marginTop: 16, lineHeight: 1.6 }}>
        Estes cadastros vivem no banco do TeamCheck (D1) e são a base de catálogos do CRM.
        Desativar preserva o histórico — nada é apagado. Itens com "ID origem #" vieram da importação inicial. Em Usuários, o botão ✉️ Convidar cria o acesso de login e envia um e-mail com código para o próprio usuário definir a senha (vale por 48 horas).
      </p>
    </div>
  );
}

export { ConfigCatalogos };
