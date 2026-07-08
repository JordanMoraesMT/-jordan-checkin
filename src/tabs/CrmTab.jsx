// TeamCheck — Aba CRM (v14)
// CRM próprio: histórico de atividades, contatos, fotos/arquivos da loja e GPS.
// Fonte de verdade: D1 (via Worker do Dashboard). Agendor segue como espelho.
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Unlink, Search, ArrowLeft, MapPin, Phone, MessageCircle, Mail, Users2, FileText, Camera, Paperclip, Trash2, RefreshCw, ExternalLink, BarChart3, Pencil, StickyNote, Handshake, PhoneCall, Send, Clock, Building2, Plus, X, Download, Navigation, Star, Calendar, Check } from "lucide-react";
import {CARGOS,  S, CC, fT, fD, gps, sL, sS, CATS, USERS, crmFire, csv, txtCel, todayLocal } from "../lib";
import { SearchSelect, MultiSelect, DateField, TarefaModal } from "../components";

const DASH = "https://dashboard.jordanmt.com";
const TIPOS = [
  { id: "NOTA",     l: "Nota",     I: StickyNote,    c: "#8B5CF6" },
  { id: "VISITA",   l: "Visita",   I: MapPin,        c: "#12C265" },
  { id: "LIGACAO",  l: "Ligação",  I: PhoneCall,     c: "#0AAEE8" },
  { id: "WHATSAPP", l: "WhatsApp", I: MessageCircle, c: "#25D366" },
  { id: "EMAIL",    l: "E-mail",   I: Mail,          c: "#F59E0B" },
  { id: "REUNIAO",  l: "Reunião",  I: Handshake,     c: "#FF4D8D" },
  { id: "PROPOSTA", l: "Proposta", I: FileText,      c: "#FFB020" },
];
const tipoDe = (id) => TIPOS.find(t => t.id === id) || TIPOS[0];
const soDig = (x) => String(x || "").replace(/\D/g, "");
const fCnpj = (c) => { const d = soDig(c).padStart(14, "0"); return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"); };
const fCep = (c) => { const d = soDig(c); return d.length === 8 ? d.slice(0, 5) + "-" + d.slice(5) : (c || ""); };

// ─── Planilhas de EMPRESAS — padrão único: CNPJ é SEMPRE a 1ª coluna ───
const COLS_IMP = ["CNPJ", "Nome Fantasia", "Razão Social", "Grupo", "UF", "Cidade", "Bairro", "Endereço", "CEP", "Categoria", "Responsável", "Telefone", "E-mail"];
const COLS_EMP = [...COLS_IMP.slice(0, 11), "Contato Principal", "Cargo", "Telefone", "E-mail", "Pessoa 2", "Telefone 2", "Pessoa 3", "Telefone 3", "Pessoa 4", "Telefone 4"];
const norm = (s) => String(s || "").replace(/^\uFEFF/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Parser de CSV que respeita aspas — casa com o export (delimitador ; e aspas)
function parseCSVEmp(text) {
  const linhas = String(text).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").filter(l => l.length);
  if (!linhas.length) return [];
  const pv = (linhas[0].match(/;/g) || []).length, vg = (linhas[0].match(/,/g) || []).length;
  const dl = pv >= vg ? ";" : ",";
  return linhas.map(linha => {
    const out = []; let cur = "", inQ = false;
    for (let i = 0; i < linha.length; i++) { const ch = linha[i];
      if (inQ) { if (ch === '"') { if (linha[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
      else { if (ch === '"') inQ = true; else if (ch === dl) { out.push(cur); cur = ""; } else cur += ch; }
    }
    out.push(cur); return out.map(x => x.trim());
  });
}
const fDH = (iso) => { // datetime do D1 -> Cuiabá (aceita "YYYY-MM-DD HH:MM:SS" UTC ou ISO com fuso)
  try { const s = String(iso); const temFuso = /[zZ]$|[+\-]\d{2}:?\d{2}$/.test(s.slice(10)); const d = new Date(temFuso ? s : (s.replace(" ", "T") + "Z")); if (isNaN(d)) return s; return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Cuiaba" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" }); } catch { return String(iso); }
};

// fetch autenticado por sessão (mesma sessão do proxy) — JSON
async function crm(token, path, opts = {}) {
  const headers = { "X-Session": token, ...(opts.headers || {}) };
  if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const r = await fetch(DASH + path, { ...opts, headers, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.erro) throw new Error(d.erro || d.detalhe || ("HTTP " + r.status));
  return d;
}

// comprime imagem no aparelho antes do upload (máx 1600px, webp)
function comprime(file) {
  return new Promise((res) => {
    if (!file.type.startsWith("image/")) return res(file);
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600; let { width: w, height: h } = img;
      if (w > max || h > max) { const k = Math.min(max / w, max / h); w = Math.round(w * k); h = Math.round(h * k); }
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cv.toBlob((b) => { URL.revokeObjectURL(url); if (!b || b.size >= file.size) return res(file);
        res(new File([b], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" })); }, "image/webp", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(file); };
    img.src = url;
  });
}

const Crd = ({ children, style }) => <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, boxShadow: S.shadow, ...style }}>{children}</div>;
const Chip = ({ on, onClick, children, color }) => <button onClick={onClick} style={{ border: `1px solid ${on ? (color || S.pri) : S.brd}`, background: on ? (color || S.pri) : S.card, color: on ? "#fff" : S.ts, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: on ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>;
const inp = { width: "100%", boxSizing: "border-box", background: "var(--inp)", border: `1px solid ${S.brd}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: S.txt };

// ─────────────────────────────────────────────────────────────
//  Card de atividade (timeline — mesmo desenho do início do Agendor)
// ─────────────────────────────────────────────────────────────
function AtvCard({ a, onOrg, onDel, canDel, onFinish }) {
  const t = tipoDe(a.tipo);
  const isTask = a.origem === "tarefa"; const done = !!a.concluida;
  const atrasada = isTask && !done && a.due_em && a.due_em.slice(0, 10) < todayLocal();
  return (<Crd style={{ padding: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: S.cl, borderBottom: `1px solid ${S.brd}` }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.c + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><t.I size={15} color={t.c} /></div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.txt, letterSpacing: 0.4 }}>{t.l.toUpperCase()}{a.origem === "checkout" && <span style={{ fontWeight: 400, color: S.ts }}> · check-out</span>}{isTask && <span style={{ fontWeight: 700, color: done ? S.ok : atrasada ? S.dng : S.gold, marginLeft: 6, fontSize: 10 }}>· {done ? "TAREFA OK" : "TAREFA"}</span>}</p>
      <p style={{ margin: "0 0 0 auto", fontSize: 11, color: S.ts, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fDH(a.criado_em)}</p>
      {canDel && <button onClick={() => onDel(a)} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><Trash2 size={14} color={S.td} /></button>}
    </div>
    <div style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 12, color: S.ts }}>{a.user_nome || "—"}</p>
        {a.org_nome && <button onClick={() => onOrg && onOrg(a)} style={{ background: "transparent", border: "none", padding: 0, cursor: onOrg ? "pointer" : "default", display: "flex", alignItems: "center", gap: 4, color: S.pri, fontSize: 12, fontWeight: 600, textAlign: "right" }}><Building2 size={12} />{a.org_nome}</button>}
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: S.txt, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{a.texto}</p>
      {isTask && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {a.due_em ? <span style={{ fontSize: 11.5, fontFamily: "monospace", color: done ? S.ts : atrasada ? S.dng : S.gold }}>Prazo {fD(a.due_em)} {fT(a.due_em)}</span> : <span />}
        <button onClick={() => !done && onFinish && onFinish(a)} disabled={done || !onFinish} title={done ? "Tarefa finalizada" : "Marcar como finalizada"} style={{ display: "flex", alignItems: "center", gap: 8, background: done ? S.ok + "18" : S.inp, border: `1px solid ${done ? S.ok : S.inpBdr}`, borderRadius: 8, padding: "7px 12px", cursor: done ? "default" : (onFinish ? "pointer" : "default") }}>
          <span style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${done ? S.ok : S.inpBdr}`, background: done ? S.ok : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{done && <Check size={12} color="#fff" strokeWidth={3} />}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: done ? S.ok : S.ts }}>{done ? "Finalizada" : "Finalizar"}</span>
        </button>
      </div>}
    </div>
  </Crd>);
}

// ─────────────────────────────────────────────────────────────
//  Tela do cliente — cabeçalho + Histórico | Contatos | Fotos | Dados
// ─────────────────────────────────────────────────────────────
function ClienteCRM({ org, token, user, visits, plocs, onBack, onEdit, onPerson, rfv, onCrmChange, backLabel }) {
  const [sub, setSub] = useState("hist");
  const [info, setInfo] = useState(null);           // /api/crm/cliente
  const [atvs, setAtvs] = useState([]); const [ldA, setLdA] = useState(false);
  const [ctts, setCtts] = useState([]); const [ldC, setLdC] = useState(false);
  const [arqs, setArqs] = useState([]); const [ldF, setLdF] = useState(false);
  const [thumbs, setThumbs] = useState({});         // id -> objectURL
  const [msg, setMsg] = useState("");
  const cnpjN = soDig(org.cnpj);
  const idQS = `org_id=${org.id}${cnpjN ? `&cnpj=${cnpjN}` : ""}`;

  const carregaInfo = async () => { try { const d = await crm(token, `/api/crm/cliente?${cnpjN ? "cnpj=" + cnpjN : "org_id=" + org.id}`); setInfo(d); } catch (e) { setInfo({ erro: e.message }); } };
  const carregaAtvs = async () => { setLdA(true); try {
    // Histórico COMPLETO do cliente (sem filtro de data). limit alto p/ nunca truncar.
    const r1 = await crm(token, `/api/crm/atividades?org_id=${org.id}&limit=1000`);
    let lista = r1.atividades || [];
    if (cnpjN) { try { const r2 = await crm(token, `/api/crm/atividades?cnpj=${cnpjN}&limit=1000`); const ids = new Set(lista.map(a => a.id)); lista = [...lista, ...(r2.atividades || []).filter(a => !ids.has(a.id))]; } catch {} }
    lista.sort((a, b) => (b.criado_em || "").localeCompare(a.criado_em || "") || b.id - a.id);
    setAtvs(lista);
  } catch (e) { setMsg("Histórico: " + e.message); } setLdA(false); };
  const carregaCtts = async () => { setLdC(true); try { const d = await crm(token, `/api/crm/contatos?${idQS}`); setCtts(d.contatos || []); } catch (e) { setMsg("Contatos: " + e.message); } setLdC(false); };
  const carregaArqs = async () => { setLdF(true); try { const d = await crm(token, `/api/crm/arquivos?${idQS}`); setArqs(d.arquivos || []); } catch (e) { setMsg("Arquivos: " + e.message); } setLdF(false); };
  useEffect(() => { setMsg(""); carregaInfo(); carregaAtvs(); carregaCtts(); carregaArqs(); }, [org.id]);

  // thumbs das fotos (fetch autenticado -> objectURL)
  useEffect(() => { let vivo = true; (async () => {
    for (const a of arqs.filter(x => x.tipo === "foto" && !thumbs[x.id])) {
      try { const r = await fetch(`${DASH}/api/crm/arquivo?id=${a.id}`, { headers: { "X-Session": token } });
        if (!r.ok) continue; const b = await r.blob(); if (!vivo) return;
        setThumbs(p => ({ ...p, [a.id]: URL.createObjectURL(b) }));
      } catch {} }
  })(); return () => { vivo = false; }; }, [arqs]);

  // ── composer do histórico ──
  const [nTipo, setNTipo] = useState("NOTA"); const [nTxt, setNTxt] = useState(""); const [espelha, setEspelha] = useState(true); const [salvando, setSalvando] = useState(false);
  const [nUsers, setNUsers] = useState(() => [String(user?.id)]);// responsáveis do registro (igual à Agenda)
  const salvaAtv = async () => { if (!nTxt.trim() || salvando) return; if (!nUsers.length) { alert("Escolha ao menos um responsável."); return; } setSalvando(true); setMsg("");
    try {
      for (const uid of nUsers) { const U = USERS.find(u => String(u.id) === String(uid));
        await crm(token, "/api/crm/atividades", { method: "POST", body: JSON.stringify({ org_id: org.id, cnpj: cnpjN || null, org_nome: org.nickname || org.name, tipo: nTipo, texto: nTxt.trim(), user_id: Number(uid) || null, user_nome: U ? U.n : null }) }); }
      setNTxt(""); carregaAtvs(); onCrmChange && onCrmChange();
    } catch (e) { setMsg("Erro ao salvar: " + e.message); }
    setSalvando(false); };
  const delAtv = async (a) => { if (!confirm("Excluir esta atividade do CRM?")) return; try { await crm(token, `/api/crm/atividades?id=${a.id}`, { method: "DELETE" }); setAtvs(p => p.filter(x => x.id !== a.id)); } catch (e) { alert("Erro: " + e.message); } };

  // ── contatos ──
  const cttVazio = { nome: "", cargo: "", telefone: "", whatsapp: "", email: "", obs: "" };
  const [cttForm, setCttForm] = useState(null); // null | {..., id?}
  const salvaCtt = async () => { const f = cttForm; if (!f?.nome?.trim()) return alert("Informe o nome.");
    try {
      if (f.id) await crm(token, "/api/crm/contatos", { method: "PUT", body: JSON.stringify(f) });
      else await crm(token, "/api/crm/contatos", { method: "POST", body: JSON.stringify({ ...f, org_id: org.id, cnpj: cnpjN || null }) });
      setCttForm(null); carregaCtts();
    } catch (e) { alert("Erro: " + e.message); } };
  const delCtt = async (c) => {
    const aviso = c.vinculado
      ? `EXCLUIR ${c.nome} do CRM?\n\nEsta pessoa está VINCULADA a mais de uma empresa — excluir some com ela de TODAS.\nSe você só quer tirá-la desta loja, use o botão 🔗 (dourado).`
      : `Excluir o contato ${c.nome} do CRM?\n\nPara só tirá-lo desta empresa (mantendo em Pessoas), use o botão 🔗 (dourado).`;
    if (!confirm(aviso)) return;
    try { await crm(token, `/api/crm/contatos?id=${c.id}`, { method: "DELETE" }); carregaCtts(); } catch (e) { alert("Erro: " + e.message); } };
  const desvProprio = async (c) => { if (!confirm(`Tirar ${c.nome} desta empresa?\n\nO contato NÃO é excluído do CRM — só perde o vínculo com a empresa (fica em Pessoas, sem empresa).`)) return; try { await crm(token, "/api/crm/contato-desvincular", { method: "PUT", body: JSON.stringify({ id: c.id }) }); carregaCtts(); } catch (e) { alert("Erro: " + e.message); } };
  // v42: vincular pessoa JÁ EXISTENTE (rede com comprador único — editar uma vez reflete em todas as lojas)
  const [vincBusca, setVincBusca] = useState(null); // null | "" | texto
  const [vincRes, setVincRes] = useState([]); const [vincLo, setVincLo] = useState(false);
  useEffect(() => { if (vincBusca === null || vincBusca.trim().length < 2) { setVincRes([]); return; }
    const t = setTimeout(async () => { setVincLo(true);
      try { const d = await crm(token, "/api/crm/contatos-todos?limit=1500"); const q = vincBusca.trim().toLowerCase();
        setVincRes((d.contatos || []).filter(c => c.id && !ctts.some(x => x.id === c.id) && [c.nome, c.cargo, c.org_nome, c.empresa, c.telefone, c.whatsapp, c.email].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 10));
      } catch (e) { setVincRes([]); }
      setVincLo(false); }, 300);
    return () => clearTimeout(t); }, [vincBusca, ctts]);
  const vincular = async (c) => { try { await crm(token, "/api/crm/contato-vincular", { method: "POST", body: JSON.stringify({ contato_id: c.id, org_id: org.id, cnpj: cnpjN || null }) }); setVincBusca(null); carregaCtts(); } catch (e) { alert("Erro: " + (e.body || e.message)); } };
  const desvincular = async (c) => { if (!confirm(`Desvincular ${c.nome} desta empresa? (a pessoa continua nas demais)`)) return; try { await crm(token, `/api/crm/contato-vincular?contato_id=${c.id}&org_id=${org.id}`, { method: "DELETE" }); carregaCtts(); } catch (e) { alert("Erro: " + e.message); } };

  // ── arquivos/fotos ──
  const fotoRef = useRef(); const arqRef = useRef(); const [subindo, setSubindo] = useState("");
  // v41: vários arquivos de uma vez · v42: após o envio abre o campo de DESCRIÇÃO de cada um
  const [descrevendo, setDescrevendo] = useState(null); // null | [{id, nome, descricao}]
  const upload = async (files) => { const lista = Array.from(files || []).filter(Boolean); if (!lista.length) return; setMsg("");
    let falhas = 0; const enviados = [];
    for (let i = 0; i < lista.length; i++) { const file = lista[i];
      setSubindo(lista.length > 1 ? `${i + 1}/${lista.length} — ${file.name}` : file.name);
      try { const f = await comprime(file);
        const fd = new FormData(); fd.append("file", f, f.name); fd.append("org_id", String(org.id)); if (cnpjN) fd.append("cnpj", cnpjN);
        const d = await crm(token, "/api/crm/arquivos", { method: "POST", body: fd });
        if (d && d.id) enviados.push({ id: d.id, nome: f.name, descricao: "" });
      } catch (e) { falhas++; setMsg(`Upload de ${file.name}: ` + e.message); }
    }
    setSubindo(""); carregaArqs();
    if (falhas && lista.length > 1) setMsg(`${lista.length - falhas} de ${lista.length} enviados — ${falhas} falharam.`);
    if (enviados.length) setDescrevendo(enviados); };
  const salvaDescricoes = async () => { const itens = descrevendo || [];
    for (const it of itens) { if ((it.descricao || "").trim()) { try { await crm(token, "/api/crm/arquivos", { method: "PUT", body: JSON.stringify({ id: it.id, descricao: it.descricao.trim() }) }); } catch (e) { alert("Descrição de " + it.nome + ": " + e.message); } } }
    setDescrevendo(null); carregaArqs(); };
  const editaDescricao = async (a) => { const nova = prompt("Descrição do arquivo:", a.descricao || ""); if (nova === null) return;
    try { await crm(token, "/api/crm/arquivos", { method: "PUT", body: JSON.stringify({ id: a.id, descricao: nova.trim() }) }); carregaArqs(); } catch (e) { alert("Erro: " + e.message); } };
  const delArq = async (a) => { if (!confirm(`Excluir ${a.nome}?`)) return; try { await crm(token, `/api/crm/arquivos?id=${a.id}`, { method: "DELETE" }); setArqs(p => p.filter(x => x.id !== a.id)); } catch (e) { alert("Erro: " + e.message); } };
  const baixaArq = async (a) => { try { const r = await fetch(`${DASH}/api/crm/arquivo?id=${a.id}`, { headers: { "X-Session": token } }); const b = await r.blob(); const u = URL.createObjectURL(b); const el = document.createElement("a"); el.href = u; el.download = a.nome || "arquivo"; el.click(); setTimeout(() => URL.revokeObjectURL(u), 5000); } catch (e) { alert("Erro: " + e.message); } };
  const [preview, setPreview] = useState(null);
  // v42: navegação entre fotos pelas setas do teclado (e botões na tela)
  const fotosOrd = useMemo(() => arqs.filter(a => a.tipo === "foto"), [arqs]);
  const navFoto = useCallback((delta) => { setPreview(p => { if (!p) return p; const i = fotosOrd.findIndex(x => x.id === p.id); if (i < 0) return p; const j = (i + delta + fotosOrd.length) % fotosOrd.length; return fotosOrd[j]; }); }, [fotosOrd]);
  useEffect(() => { if (!preview) return; const h = (e) => { if (e.key === "ArrowRight") { e.preventDefault(); navFoto(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); navFoto(-1); } else if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [preview, navFoto]);

  // ── GPS ──
  const gpsD1 = info?.gps; const gpsKV = plocs?.[org.id];
  const gpsAtual = gpsD1 || gpsKV || null;
  const salvaGPS = async () => { try { const g = await gps();
      await crm(token, "/api/crm/gps", { method: "PUT", body: JSON.stringify({ org_id: org.id, cnpj: cnpjN || null, lat: g.lat, lng: g.lng, precisao: g.acc }) });
      carregaInfo(); alert(`GPS salvo (±${g.acc}m).`);
    } catch (e) { alert("GPS: " + (e.message || e)); } };

  // Agendar tarefa: cria tarefa com prazo no D1 (aparece na Agenda)
  const [agTask, setAgTask] = useState(false);
  const [agTipo, setAgTipo] = useState("VISITA"); const [agTxt, setAgTxt] = useState("");
  const [agData, setAgData] = useState(""); const [agHora, setAgHora] = useState("09:00"); const [agLo, setAgLo] = useState(false);
  const [agUsers, setAgUsers] = useState(() => [String(user?.id)]); // responsáveis (permite atribuir a outro)
  const salvaTarefa = async () => { if (!agTxt.trim() || !agData) { alert("Preencha descrição e data."); return; } if (!agUsers.length) { alert("Escolha ao menos um responsável."); return; } setAgLo(true);
    try {
      for (const uid of agUsers) { const U = USERS.find(u => String(u.id) === String(uid));
        await fetch(`${DASH}/api/crm/atividades`, { method: "POST", headers: { "X-Session": token, "Content-Type": "application/json" }, body: JSON.stringify({ org_id: org.id, cnpj: cnpjN || null, org_nome: org.nickname || org.name, tipo: agTipo, texto: agTxt, origem: "tarefa", due_em: `${agData}T${agHora}:00-04:00`, agendor_id: null, user_id: Number(uid) || null, user_nome: U ? U.n : null }) }).catch(() => {}); }
      alert("Tarefa agendada!"); setAgTask(false); setAgTxt(""); setAgData(""); onCrmChange && onCrmChange();
    } catch (e) { alert("Erro: " + (e.message || e)); } setAgLo(false); };
  const catCor = CC[org.cat] || S.ts;
  // Matriz RFV consolidada (mesma régua do Dashboard)
  const rfvInfo = useMemo(() => { if (!rfv) return null; const k = soDig(org.cnpj); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[org.id] || null; }, [rfv, org.id, org.cnpj]);
  const RFVC = { "Campeão": S.gold, "Leal": S.ok, "Em Crescimento": S.pri, "Em Risco": "#E76F51", "Inativo": S.td };
  const SRC_ = { "Em Dia": S.ok, "Momento de Recompra": S.gold, "Atrasado": S.dng };
  const ultimaVisita = useMemo(() => (visits || []).filter(v => v.orgId === org.id && v.checkoutTime).sort((a, b) => b.checkinTime.localeCompare(a.checkinTime))[0], [visits, org.id]);
  const subs = [["hist", "Histórico"], ["ctt", "Contatos"], ["arq", "Fotos & Arquivos"], ["dados", "Dados"]];
  const infoContato = (
    <Crd>
      <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 800, color: S.txt }}>Informações para contato</p>
      {(org.addr?.street||org.addr?.city_name) && <p style={{ margin: "0 0 4px", fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"flex-start" }}><MapPin size={13} style={{marginTop:2, flexShrink:0}}/>{[ [org.addr?.street, org.addr?.number].filter(Boolean).join(", "), org.addr?.district, [org.addr?.city_name||org.addr?.city, org.addr?.state].filter(Boolean).join("/"), org.addr?.zip && ("CEP " + fCep(org.addr.zip)) ].filter(Boolean).join(" · ")}</p>}
      {org.phone && <p style={{ margin: "0 0 4px", fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"center" }}><Phone size={13}/>{org.phone}
        <a href={`https://wa.me/55${String(org.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{color:S.ok, fontWeight:700, textDecoration:"none"}}>WhatsApp</a>
        <a href={`tel:${String(org.phone).replace(/\D/g,"")}`} style={{color:S.pl, fontWeight:700, textDecoration:"none"}}>Ligar</a></p>}
      {org.email && <p style={{ margin: 0, fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"center" }}><Mail size={13}/><a href={`mailto:${org.email}`} style={{color:S.pl, textDecoration:"none"}}>{org.email}</a></p>}
      {!org.phone && !org.email && !(org.addr?.street||org.addr?.city_name) && <p style={{margin:0, fontSize:12, color:S.td}}>Sem contato no cadastro — use Editar para preencher.</p>}
    </Crd>);

  return (<div>
    <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: S.pri, fontSize: 13, fontWeight: 700, padding: "2px 0 10px", cursor: "pointer" }}><ArrowLeft size={16} />{backLabel || "Voltar ao CRM"}</button>

    {/* Cabeçalho do cliente */}
    <Crd>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: S.txt, lineHeight: 1.2 }}>{org.nickname || org.name}</p>
          {(org.ranking||0)>0 && <p style={{ margin: "2px 0 0", fontSize: 12, color: S.gold, letterSpacing: 1 }}>{"★".repeat(org.ranking)}{"☆".repeat(Math.max(0,5-org.ranking))}</p>}
          {org.legalName && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: S.ts }}>{org.legalName}</p>}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: S.ts, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <MapPin size={12} />{org.addr?.city_name || org.addr?.city || "—"}{org.addr?.state ? "/" + org.addr.state : ""}
            {org.sector && <span>· {org.sector}</span>}{org.owner && <span>· Resp.: {org.owner}</span>}
            {org.products && <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", verticalAlign: "middle" }}>{String(org.products).split(",").map(m => m.trim()).filter(Boolean).map(m => <span key={m} style={{ fontSize: 9.5, fontWeight: 700, color: S.gold, border: `1px solid ${S.gold}55`, padding: "1px 7px", borderRadius: 6 }}>{m}</span>)}</span>}
          </p>
          {org.cnpj && <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.td }}>CNPJ {fCnpj(org.cnpj)}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
          {org.cat && <span style={{ background: catCor + "22", color: catCor, border: `1px solid ${catCor}55`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{org.cat}</span>}
          {rfvInfo && <span style={{ background: (RFVC[rfvInfo.rfv] || S.ts) + "18", color: RFVC[rfvInfo.rfv] || S.ts, border: `1px solid ${(RFVC[rfvInfo.rfv] || S.ts)}55`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>RFV: {rfvInfo.rfv}</span>}
          {rfvInfo && rfvInfo.status && <span style={{ fontSize: 10, color: SRC_[rfvInfo.status] || S.ts, whiteSpace: "nowrap" }}>{rfvInfo.status}</span>}
          <button onClick={() => setAgTask(v=>!v)} style={{ display:"flex", alignItems:"center", gap:5, background:S.pri, color:"#fff", border:"none", borderRadius:20, padding:"5px 11px", fontSize:11, fontWeight:700, cursor:"pointer" }}><Calendar size={13}/>Agendar tarefa</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {cnpjN && <button onClick={() => window.open(`${DASH}/?cliente=${cnpjN}`, "_blank", "noopener")} style={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><BarChart3 size={15} />Dashboard</button>}
        <button onClick={() => onEdit && onEdit(org)} style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.card, color: S.txt, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Pencil size={14} />Editar</button>
        <button onClick={() => onPerson && onPerson(org)} style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.card, color: S.txt, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Users2 size={14} />Pessoas</button>
      </div>
    </Crd>

    {/* GPS */}
    <Crd style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Navigation size={18} color={gpsAtual ? S.acc : S.td} />
      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: S.txt }}>GPS do PDV</p>
        <p style={{ margin: 0, fontSize: 11.5, color: S.ts }}>{gpsAtual ? `${(+gpsAtual.lat).toFixed(6)}, ${(+gpsAtual.lng).toFixed(6)}${gpsD1?.atualizado_em ? " · " + fDH(gpsD1.atualizado_em) : gpsKV ? " · do app" : ""}` : "sem coordenada registrada"}</p>
      </div>
      {gpsAtual && <button onClick={() => window.open(`https://www.google.com/maps?q=${gpsAtual.lat},${gpsAtual.lng}`, "_blank", "noopener")} style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: S.pri, cursor: "pointer" }}>Maps</button>}
      <button onClick={salvaGPS} style={{ background: S.acc, border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Salvar GPS atual</button>
    </Crd>

    {msg && <p style={{ fontSize: 12, color: S.dng, margin: "0 0 8px" }}>{msg}</p>}

    {/* Sub-abas */}
    <div style={{ display: "flex", gap: 3, marginBottom: 12, background: S.cl, borderRadius: 8, padding: 3 }}>
    {agTask && <Crd style={{ borderColor: S.pri + "66" }}>
      <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 800, color: S.txt }}>Agendar tarefa</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {TIPOS.filter(x=>x.id!=="NOTA").map(x => <Chip key={x.id} on={agTipo===x.id} color={x.c} onClick={()=>setAgTipo(x.id)}>{x.l}</Chip>)}
      </div>
      <textarea value={agTxt} onChange={e=>setAgTxt(e.target.value)} placeholder="Descrição da tarefa..." rows={2} style={{ ...inp, resize: "vertical", marginBottom: 8 }}/>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <DateField value={agData} onChange={setAgData} today={todayLocal()} placeholder="Data" style={{ flex: 2 }}/>
        <input type="time" value={agHora} onChange={e=>setAgHora(e.target.value)} style={{ ...inp, flex: 1 }}/>
      </div>
      <p style={{ margin: "0 0 5px", fontSize: 11, color: S.ts, fontWeight: 600 }}>Responsável(eis)</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{USERS.map(u => { const on = agUsers.includes(String(u.id)); return <button key={u.id} type="button" onClick={() => setAgUsers(p => on ? p.filter(x => x !== String(u.id)) : [...p, String(u.id)])} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: on ? 700 : 500, border: on ? "none" : `1px solid ${S.brd}`, background: on ? S.acc : S.card, color: on ? "#fff" : S.ts, cursor: "pointer" }}>{u.n.split(" ")[0]}</button>; })}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvaTarefa} disabled={agLo} style={{ flex: 1, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{agLo ? "Salvando..." : "Agendar"}</button>
        <button onClick={()=>setAgTask(false)} style={{ background: "transparent", color: S.dng, border: `1px solid ${S.dng}55`, borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
      </div>
    </Crd>}
      {subs.map(([id, l]) => <button key={id} onClick={() => setSub(id)} style={{ flex: 1, border: "none", background: sub === id ? S.pri : "transparent", borderRadius: 6, padding: "8px 2px", fontSize: 11.5, fontWeight: sub === id ? 700 : 400, color: sub === id ? "#fff" : S.ts, cursor: "pointer" }}>{l}</button>)}
    </div>

    {/* ── HISTÓRICO ── */}
    {sub === "hist" && <div>
      <Crd>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>{TIPOS.map(t => <Chip key={t.id} on={nTipo === t.id} color={t.c} onClick={() => setNTipo(t.id)}>{t.l}</Chip>)}</div>
        <textarea value={nTxt} onChange={e => setNTxt(e.target.value)} rows={3} placeholder="Escreva a atividade / observação..." style={{ ...inp, resize: "vertical", marginTop: 4 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: S.ts, fontWeight: 600, marginRight: 2 }}>Responsável:</span>
          {USERS.map(u => { const on = nUsers.includes(String(u.id)); return <button key={u.id} type="button" onClick={() => setNUsers(p => on ? p.filter(x => x !== String(u.id)) : [...p, String(u.id)])} style={{ padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: on ? 700 : 500, border: on ? "none" : `1px solid ${S.brd}`, background: on ? S.acc : S.card, color: on ? "#fff" : S.ts, cursor: "pointer" }}>{u.n.split(" ")[0]}</button>; })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button onClick={salvaAtv} disabled={salvando || !nTxt.trim() || !nUsers.length} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: nTxt.trim() ? S.acc : S.cl, color: nTxt.trim() ? "#fff" : S.td, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Send size={14} />{salvando ? "Salvando..." : "Registrar"}</button>
        </div>
      </Crd>
      {ldA && <p style={{ fontSize: 12, color: S.ts }}>Carregando histórico...</p>}
      {!ldA && !atvs.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Nenhuma atividade registrada ainda.</p></Crd>}
      {atvs.map(a => <AtvCard key={a.id} a={a} onFinish={async (x) => { if (!confirm("Finalizar esta tarefa?")) return; try { await crm(token, "/api/crm/tarefa-concluir", { method: "PUT", body: JSON.stringify({ id: x.id }) }); setAtvs(p => p.map(y => y.id === x.id ? { ...y, concluida: 1 } : y)); onCrmChange && onCrmChange(); } catch (e) { alert("Erro: " + e.message); } }} canDel={user?.role === "admin" || a.user_id === user?.id} onDel={delAtv} />)}
    </div>}

    {/* ── CONTATOS ── */}
    {sub === "ctt" && <div>
      {!cttForm && <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => { setCttForm({ ...cttVazio }); setVincBusca(null); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.acc, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Plus size={16} />Novo contato</button>
        <button onClick={() => setVincBusca(vincBusca === null ? "" : null)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: vincBusca !== null ? S.pri : S.card, color: vincBusca !== null ? "#fff" : S.txt, border: vincBusca !== null ? "none" : `1px solid ${S.brd}`, borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔗 Vincular pessoa existente</button>
      </div>}
      {vincBusca !== null && !cttForm && <Crd>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13.5 }}>Vincular pessoa de outra empresa</p>
        <p style={{ margin: "0 0 8px", fontSize: 11.5, color: S.ts }}>Para redes com comprador único: a MESMA pessoa fica em várias lojas — editar os dados dela em qualquer loja atualiza todas.</p>
        <input style={inp} autoFocus placeholder="Buscar por nome, cargo, empresa, telefone..." value={vincBusca} onChange={e => setVincBusca(e.target.value)} />
        {vincLo && <p style={{ fontSize: 11.5, color: S.ts, margin: "8px 0 0" }}>Buscando...</p>}
        {vincRes.map(c => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderTop: `1px solid ${S.cl}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: S.txt }}>{c.nome}{c.cargo ? <span style={{ fontWeight: 400, color: S.ts }}> · {c.cargo}</span> : null}</p>
            <p style={{ margin: 0, fontSize: 11, color: S.td }}>{[c.org_nome || c.empresa, c.whatsapp || c.telefone].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={() => vincular(c)} style={{ background: S.pri, color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Vincular</button>
        </div>)}
        {vincBusca.trim().length >= 2 && !vincLo && !vincRes.length && <p style={{ fontSize: 11.5, color: S.td, margin: "8px 0 0" }}>Ninguém encontrado. Cadastre como novo contato.</p>}
      </Crd>}
      {cttForm && <Crd>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{cttForm.id ? "Editar contato" : "Novo contato"}</p><button onClick={() => setCttForm(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={16} color={S.ts} /></button></div>
        <div style={{ display: "grid", gap: 8 }}>
          <input style={inp} placeholder="Nome *" value={cttForm.nome} onChange={e => setCttForm(f => ({ ...f, nome: e.target.value }))} />
          <input style={inp} list="tc-cargos" placeholder="Cargo (toque para escolher da lista)" value={cttForm.cargo || ""} onChange={e => setCttForm(f => ({ ...f, cargo: e.target.value }))} />
          <datalist id="tc-cargos">{CARGOS.map(c => <option key={c} value={c} />)}</datalist>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input style={inp} placeholder="Telefone" inputMode="tel" value={cttForm.telefone || ""} onChange={e => setCttForm(f => ({ ...f, telefone: e.target.value }))} />
            <input style={inp} placeholder="WhatsApp" inputMode="tel" value={cttForm.whatsapp || ""} onChange={e => setCttForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
          <input style={inp} placeholder="E-mail" inputMode="email" value={cttForm.email || ""} onChange={e => setCttForm(f => ({ ...f, email: e.target.value }))} />
          <input style={inp} placeholder="Observações" value={cttForm.obs || ""} onChange={e => setCttForm(f => ({ ...f, obs: e.target.value }))} />
          <button onClick={salvaCtt} style={{ background: S.acc, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Salvar contato</button>
        </div>
      </Crd>}
      {ldC && <p style={{ fontSize: 12, color: S.ts }}>Carregando contatos...</p>}
      {!ldC && !ctts.length && !cttForm && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Nenhum contato no CRM. Use “Novo contato”.</p></Crd>}
      {ctts.map(c => <Crd key={c.id}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: S.txt }}>{c.nome}{c.vinculado ? <span style={{ marginLeft: 8, fontSize: 9.5, fontWeight: 700, color: S.pl, border: `1px solid ${S.pl}55`, padding: "2px 7px", borderRadius: 6, verticalAlign: "middle" }}>🔗 vinculada</span> : null}</p>
            {c.cargo && <p style={{ margin: "1px 0 0", fontSize: 12, color: S.ts }}>{c.cargo}</p>}
            {(c.telefone || c.whatsapp || c.email) && <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.td, wordBreak: "break-word" }}>{[c.telefone, c.whatsapp && "WA " + c.whatsapp, c.email].filter(Boolean).join(" · ")}</p>}
            {c.obs && <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.ts }}>{c.obs}</p>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexShrink: 0 }}>
            {c.whatsapp && <a href={`https://wa.me/55${soDig(c.whatsapp)}`} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: "#25D36622", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageCircle size={17} color="#25D366" /></a>}
            {c.telefone && <a href={`tel:${soDig(c.telefone)}`} style={{ width: 36, height: 36, borderRadius: 10, background: S.pl + "22", display: "flex", alignItems: "center", justifyContent: "center" }}><Phone size={16} color={S.pl} /></a>}
            <button onClick={() => setCttForm({ ...c })} title={c.vinculado ? "Editar (atualiza em TODAS as empresas vinculadas)" : "Editar"} style={{ width: 36, height: 36, borderRadius: 10, background: S.cl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Pencil size={14} color={S.ts} /></button>
            <button onClick={() => c.vinculado ? desvincular(c) : desvProprio(c)} title="Tirar desta empresa (o contato continua no CRM)" style={{ width: 36, height: 36, borderRadius: 10, background: S.gold + "18", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Unlink size={14} color={S.gold} /></button>
            <button onClick={() => delCtt(c)} title="Excluir contato do CRM (some de todas as empresas)" style={{ width: 36, height: 36, borderRadius: 10, background: S.dng + "18", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} color={S.dng} /></button>
          </div>
        </div>
      </Crd>)}
      {org.people && <p style={{ fontSize: 11.5, color: S.td, margin: "4px 2px" }}>Pessoas: {org.people}</p>}
    </div>}

    {/* ── FOTOS & ARQUIVOS ── */}
    {sub === "arq" && <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => fotoRef.current?.click()} disabled={!!subindo} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Camera size={16} />Foto da loja</button>
        <button onClick={() => arqRef.current?.click()} disabled={!!subindo} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.card, color: S.txt, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Paperclip size={16} />Arquivo</button>
        <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { upload(e.target.files); e.target.value = ""; }} />
        <input ref={arqRef} type="file" multiple style={{ display: "none" }} onChange={e => { upload(e.target.files); e.target.value = ""; }} />
      </div>
      {subindo && <p style={{ fontSize: 12, color: S.pri, margin: "0 0 8px" }}>Enviando {subindo}...</p>}
      {ldF && <p style={{ fontSize: 12, color: S.ts }}>Carregando arquivos...</p>}
      {!ldF && !arqs.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Nenhuma foto ou arquivo desta loja ainda.</p></Crd>}
      {/* v42: fotos numa faixa horizontal rolável, com a descrição sob a miniatura */}
      {fotosOrd.length > 0 && <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
        {fotosOrd.map(a => <div key={a.id} style={{ flexShrink: 0, width: 130 }}>
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${S.brd}`, background: S.cl, width: 130, height: 130 }}>
            {thumbs[a.id] ? <img src={thumbs[a.id]} alt={a.nome} onClick={() => setPreview(a)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={20} color={S.td} /></div>}
            <button onClick={() => delArq(a)} style={{ position: "absolute", top: 4, right: 4, width: 26, height: 26, borderRadius: 8, background: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={13} color="#fff" /></button>
          </div>
          <p onClick={() => editaDescricao(a)} title="Toque para editar a descrição" style={{ margin: "5px 1px 0", fontSize: 10.5, lineHeight: 1.35, color: a.descricao ? S.ts : S.td, cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: a.descricao ? "normal" : "italic" }}>{a.descricao || "＋ descrição"}</p>
        </div>)}
      </div>}
      {/* lista de arquivos não-imagem */}
      {arqs.filter(a => a.tipo !== "foto").map(a => <Crd key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FileText size={18} color={S.pri} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: S.txt, wordBreak: "break-all" }}>{a.nome}</p>
          {a.descricao && <p style={{ margin: "1px 0 0", fontSize: 11.5, color: S.ts }}>{a.descricao}</p>}
          <p style={{ margin: 0, fontSize: 11, color: S.td }}>{(a.tamanho / 1024).toFixed(0)} KB · {a.user_nome || "—"} · {fDH(a.criado_em)}</p>
        </div>
        <button onClick={() => editaDescricao(a)} title="Descrição" style={{ width: 36, height: 36, borderRadius: 10, background: S.cl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Pencil size={14} color={S.ts} /></button>
        <button onClick={() => baixaArq(a)} style={{ width: 36, height: 36, borderRadius: 10, background: S.pl + "22", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Download size={15} color={S.pl} /></button>
        <button onClick={() => delArq(a)} style={{ width: 36, height: 36, borderRadius: 10, background: S.dng + "18", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} color={S.dng} /></button>
      </Crd>)}
      {preview && <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <img src={thumbs[preview.id]} alt={preview.nome} onClick={e => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "76vh", borderRadius: 10 }} />
        {fotosOrd.length > 1 && <>
          <button onClick={e => { e.stopPropagation(); navFoto(-1); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.14)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); navFoto(1); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.14)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
        </>}
        {preview.descricao && <p style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, margin: "12px 0 0", textAlign: "center", maxWidth: 640 }}>{preview.descricao}</p>}
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "6px 0 0", textAlign: "center" }}>{fotosOrd.findIndex(x => x.id === preview.id) + 1} de {fotosOrd.length} · {preview.nome} · {preview.user_nome || "—"} · {fDH(preview.criado_em)}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "4px 0 0" }}>← → navegam · Esc ou toque fora fecha</p>
      </div>}
      {/* v42: modal de descrição pós-upload */}
      {descrevendo && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "var(--card-solid)", border: `1px solid ${S.brd}`, borderRadius: 16, padding: "1.3rem", width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto" }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>Descrever {descrevendo.length > 1 ? `os ${descrevendo.length} arquivos` : "o arquivo"}</p>
          <p style={{ fontSize: 11.5, color: S.ts, margin: "0 0 12px" }}>A descrição aparece sob a miniatura e no visualizador. Pode deixar em branco.</p>
          {descrevendo.map((it, i) => <div key={it.id} style={{ marginBottom: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: S.td, wordBreak: "break-all" }}>{it.nome}</p>
            <input style={inp} autoFocus={i === 0} placeholder="Ex.: gôndola Tramontina reposta, fachada, nota fiscal..." value={it.descricao} onChange={e => setDescrevendo(p => p.map(x => x.id === it.id ? { ...x, descricao: e.target.value } : x))} onKeyDown={e => { if (e.key === "Enter" && i === descrevendo.length - 1) salvaDescricoes(); }} />
          </div>)}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setDescrevendo(null)} style={{ flex: 1 }}>Pular</button>
            <button onClick={salvaDescricoes} style={{ flex: 2, background: S.acc, border: "none", fontWeight: 600, color: "#fff" }}>Salvar descrições</button>
          </div>
        </div>
      </div>}
    </div>}

    {/* ── DADOS ── */}
    {sub === "dados" && <div>
    {infoContato}
      <Crd>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: S.txt }}>Cadastro</p>
        {[["Razão social", org.legalName], ["CNPJ", org.cnpj && fCnpj(org.cnpj)], ["Categoria", org.cat], ["Setor", org.sector], ["Responsável", org.owner], ["Grupo", org.grupo], ["Marcas", org.products],
          ["Endereço", [org.addr?.street, org.addr?.number].filter(Boolean).join(", ")], ["Bairro", org.addr?.district], ["CEP", org.addr?.zip && fCep(org.addr.zip)], ["Cidade", (org.addr?.city_name || org.addr?.city || "") + (org.addr?.state ? "/" + org.addr.state : "")]]
          .filter(([, v]) => v).map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: `1px solid ${S.cl}` }}>
            <span style={{ fontSize: 12, color: S.ts, flexShrink: 0 }}>{k}</span><span style={{ fontSize: 12.5, color: S.txt, textAlign: "right", wordBreak: "break-word" }}>{v}</span></div>)}
      </Crd>
      <Crd>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: S.txt }}>Resumo comercial</p>
        {info?.compras ? <>
          {[["Última compra", info.compras.ultima_compra ? fD(info.compras.ultima_compra + "T12:00:00") : "—"],
            ["Faturamento 12m", info.compras.fat_12m != null ? "R$ " + Number(info.compras.fat_12m).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—"],
            ["Pedidos (total)", info.compras.pedidos ?? "—"], ["Indústrias", info.compras.industrias || "—"],
            ["Última visita", ultimaVisita ? fD(ultimaVisita.checkinTime) + " (" + (ultimaVisita.userName || "—") + ")" : "—"]]
            .map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: `1px solid ${S.cl}` }}>
              <span style={{ fontSize: 12, color: S.ts }}>{k}</span><span style={{ fontSize: 12.5, color: S.txt, textAlign: "right" }}>{v}</span></div>)}
          {cnpjN && <button onClick={() => window.open(`${DASH}/?cliente=${cnpjN}`, "_blank", "noopener")} style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><ExternalLink size={14} />Ficha completa no Dashboard</button>}
        </> : <p style={{ margin: 0, fontSize: 12, color: S.ts }}>{info?.erro ? "Erro: " + info.erro : "Carregando..."}</p>}
      </Crd>
    </div>}
  </div>);
}

// ─────────────────────────────────────────────────────────────
//  EMPRESAS — relação de clientes fiel à tela do Agendor:
//  tabela Nome | Categoria | Responsável | E-mail | Telefone |
//  Ranking | Editar, com busca, filtros e "Exibindo X de N".
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
//  PESSOAS — lista global de contatos (menu Pessoas do Agendor):
//  todos os contatos do CRM (D1), com empresa, cargo e ações
//  WhatsApp/Ligar/E-mail. Enche de vez com a importação do backup.
// ─────────────────────────────────────────────────────────────
function PessoasView({ token, allOrgs, excl, onOpenOrg, onPerson, q0 }) {
  const [lista, setLista] = useState(null); const [q, setQ] = useState(q0 || ""); const [vc, setVc] = useState(60);
  const carrega = async () => { try { const d = await crm(token, "/api/crm/contatos-todos"); setLista(d.contatos || []); } catch (e) { setLista([]); console.warn("pessoas:", e); } };
  useEffect(() => { carrega(); }, []);
  const achaOrg = (c) => { const k = soDig(c.cnpj); const tudo = [ ...(allOrgs || []), ...(excl || []) ];
    return tudo.find(o => (c.org_id && o.id === c.org_id) || (k && soDig(o.cnpj) === k)) || null; };
  const filtrada = useMemo(() => { if (!lista) return []; const n = q.trim().toLowerCase(); if (!n) return lista;
    return lista.filter(c => [c.nome, c.empresa, c.cargo, c.telefone, c.whatsapp, c.email].filter(Boolean).join(" ").toLowerCase().includes(n)); }, [lista, q]);
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: S.ts }}>Exibindo <b style={{ color: S.txt }}>{Math.min(vc, filtrada.length)}</b> de <b style={{ color: S.txt }}>{filtrada.length}</b> pessoas</p>
      <button onClick={carrega} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${S.brd}`, borderRadius: 10, padding: "7px 10px", fontSize: 12, color: S.ts }}><RefreshCw size={13}/>Atualizar</button>
    </div>
    <div style={{ position: "relative", marginBottom: 10 }}>
      <Search size={15} color={S.td} style={{ position: "absolute", left: 12, top: 12 }} />
      <input value={q} onChange={e => { setQ(e.target.value); setVc(60); }} placeholder="Buscar pessoa, empresa, cargo, telefone ou e-mail..." style={{ ...inp, paddingLeft: 34 }} />
    </div>
    {lista === null && <p style={{ color: S.ts, textAlign: "center", padding: "1.5rem 0" }}>Carregando pessoas...</p>}
    {lista !== null && filtrada.length === 0 && <Crd><p style={{ margin: 0, fontSize: 12.5, color: S.ts, textAlign: "center" }}>Nenhuma pessoa encontrada.{!q && " A lista enche com os contatos criados no CRM e com a importação inicial."}</p></Crd>}
    {filtrada.slice(0, vc).map(c => { const o = achaOrg(c); return (<Crd key={c.id} style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: S.txt }}>{c.nome}{c.cargo && <span style={{ fontWeight: 400, color: S.ts, fontSize: 11.5 }}> · {c.cargo}</span>}</p>
          {(c.empresa || o) && <button onClick={() => o && onOpenOrg(o)} disabled={!o} style={{ background: "transparent", border: "none", padding: 0, margin: "2px 0 0", fontSize: 11.5, color: o ? S.pl : S.td, cursor: o ? "pointer" : "default", display: "flex", alignItems: "center", gap: 4, textAlign: "left" }}><Building2 size={12}/>{c.empresa || (o && (o.nickname || o.name))}</button>}
          <p style={{ margin: "3px 0 0", fontSize: 11, color: S.td }}>{[c.telefone, c.whatsapp, c.email].filter(Boolean).join(" · ") || "sem contato"}</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {onPerson && o && <button onClick={() => onPerson(o)} title="Editar pessoas desta empresa" style={{ background: S.gold + "18", border: `1px solid ${S.gold}55`, borderRadius: 8, padding: "6px 8px", display: "flex", cursor: "pointer" }}><Pencil size={14} color={S.gold}/></button>}
          {!o && <button onClick={async () => { if (!confirm(`Excluir o contato ${c.nome}?\n\nEle não está vinculado a nenhuma empresa da base.`)) return; try { await crm(token, `/api/crm/contatos?id=${c.id}`, { method: "DELETE" }); carrega(); } catch (e) { alert("Erro: " + e.message); } }} title="Excluir contato (sem empresa vinculada)" style={{ background: S.dng + "18", border: `1px solid ${S.dng}55`, borderRadius: 8, padding: "6px 8px", display: "flex", cursor: "pointer" }}><Trash2 size={14} color={S.dng}/></button>}
          {(c.whatsapp || c.telefone) && <a href={`https://wa.me/55${soDig(c.whatsapp || c.telefone)}`} target="_blank" rel="noreferrer" style={{ background: S.ok + "18", border: `1px solid ${S.ok}55`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><MessageCircle size={14} color={S.ok}/></a>}
          {c.telefone && <a href={`tel:${soDig(c.telefone)}`} style={{ background: S.pri + "18", border: `1px solid ${S.pri}55`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><Phone size={14} color={S.pri}/></a>}
          {c.email && <a href={`mailto:${c.email}`} style={{ background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><Mail size={14} color={S.ts}/></a>}
        </div>
      </div>
    </Crd>); })}
    {vc < filtrada.length && <button onClick={() => setVc(v => v + 60)} style={{ width: "100%", marginTop: 4, padding: 12, fontSize: 13, background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 10, color: S.txt }}>Ver mais ({filtrada.length - vc})</button>}
  </div>);
}

function EmpresasView({ token, allOrgs, excl, rfv, onOpen, onEdit, onNovaEmpresa, user, onCrmChange }) {
  const rfvDe = (o) => { if (!rfv) return null; const k = soDig(o.cnpj); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[o.id] || null; };
  const PREF = "jc:empresas-prefs";
  const p0 = sL(PREF, {});
  const arr = v => Array.isArray(v) ? v : [];
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState(arr(p0.fCat)); const [fResp, setFResp] = useState(() => p0.fResp !== undefined ? arr(p0.fResp) : (user?.name ? [user.name] : []));/* v43: pré-seleção do usuário */
  const [fRfv, setFRfv] = useState(arr(p0.fRfv)); const [fGrp, setFGrp] = useState(arr(p0.fGrp)); const [fSr, setFSr] = useState(arr(p0.fSr)); const [fCid, setFCid] = useState(arr(p0.fCid)); // v41: Grupo no lugar da Curva ABC
  useEffect(() => { sS(PREF, { fCat, fResp, fRfv, fGrp, fSr, fCid }); }, [fCat, fResp, fRfv, fGrp, fSr, fCid]);
  const [ordem, setOrdem] = useState(1); // 1 = A→Z, -1 = Z→A
  const [vc, setVc] = useState(60);
  const resps = useMemo(() => { const s = new Set(USERS.map(u => u.n)); (allOrgs||[]).forEach(o => { if (o.owner) s.add(o.owner); }); return [...s].sort(); }, [allOrgs]);
  const cidades = useMemo(() => { const s = new Set(); (allOrgs||[]).forEach(o => { const c = o.addr?.city_name || o.addr?.city; if (c) s.add(c); }); return [...s].sort(); }, [allOrgs]);
  const gruposE = useMemo(() => { const s = new Set(); (allOrgs||[]).forEach(o => { const g = ((o.grupo || "").replace("Grupo: ", "")).trim(); if (g) s.add(g); }); return [...s].sort(); }, [allOrgs]);
  const lista = useMemo(() => {
    let l = (q.trim() || fCat.includes("Excluido")) ? [ ...(allOrgs || []), ...(excl || []) ] : (allOrgs || []);
    if (q.trim()) { const n = q.toLowerCase().replace(/[.\-\/]/g, "");
      const casa = o => [o.name, o.nickname, o.legalName, soDig(o.cnpj), o.addr?.district, o.addr?.city_name, o.email, o.phone].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(n);
      l = l.filter(casa); }
    if (fCat.length) l = l.filter(o => fCat.includes(o.cat));
    if (fResp.length) l = l.filter(o => fResp.includes(o.owner));
    if (fCid.length) l = l.filter(o => fCid.includes(o.addr?.city_name || o.addr?.city));
    if (fGrp.length) l = l.filter(o => fGrp.includes(((o.grupo || "").replace("Grupo: ", "")).trim()));
    if (fRfv.length || fSr.length) l = l.filter(o => { const r = rfvDe(o); if (!r) return false;
      if (fRfv.length && !fRfv.includes(r.rfv)) return false; if (fSr.length && !fSr.includes(r.status)) return false; return true; });
    return [...l].sort((a, b) => ordem * (a.nickname || a.name || "").localeCompare(b.nickname || b.name || ""));
  }, [allOrgs, excl, q, fCat, fResp, fCid, fRfv, fGrp, fSr, ordem, rfv]);
  const th = { textAlign: "left", padding: "8px 10px", fontSize: 10.5, fontWeight: 800, color: S.ts, textTransform: "uppercase", letterSpacing: .4, whiteSpace: "nowrap", borderBottom: `2px solid ${S.brd}` };
  const td = { padding: "9px 10px", fontSize: 12, color: S.txt, borderBottom: `1px solid ${S.cl}`, whiteSpace: "nowrap", verticalAlign: "middle" };

  // ── Planilhas: CNPJ SEMPRE na 1ª coluna, gravado como TEXTO (preserva o zero à esquerda) ──
  const [importar, setImportar] = useState(false);
  const [impMsg, setImpMsg] = useState("");
  const [impLog, setImpLog] = useState([]);

  const exportar = async () => {
    let ctts = [], vincs = [];
    try { const d = await crm(token, "/api/crm/contatos-todos?limit=5000"); ctts = d.contatos || []; } catch (e) { alert("Não consegui carregar os contatos: " + e.message); }
    try { const v = await crm(token, "/api/crm/contato-vinculos-todos"); vincs = v.vinculos || []; } catch (e) {}
    const porId = new Map(ctts.map(c => [c.id, c]));
    const prio = (c) => { const g = (c.cargo || "").toLowerCase(); if (/comprad/.test(g)) return 0; if (/propriet|dono|s[oó]ci/.test(g)) return 1; return 2; };
    const deOrg = (o) => {
      const k = soDig(o.cnpj);
      const proprios = ctts.filter(c => (c.org_id && c.org_id === o.id) || (k && soDig(c.cnpj) === k));
      const ids = new Set(proprios.map(c => c.id));
      const ligados = vincs.filter(v => ((v.org_id && Number(v.org_id) === Number(o.id)) || (k && soDig(v.cnpj) === k)) && !ids.has(v.contato_id))
        .map(v => porId.get(v.contato_id)).filter(Boolean);
      return [...proprios, ...ligados].sort((a, b) => prio(a) - prio(b));
    };
    const fmtP = (c) => c ? (c.nome + (c.cargo ? " (" + c.cargo + ")" : "")) : "";
    const rows = [COLS_EMP.slice()];
    lista.forEach(o => { const ps = deOrg(o); const p1 = ps[0];
      rows.push([txtCel(soDig(o.cnpj)), o.nickname || o.name, o.legalName || "", (o.grupo || "").replace("Grupo: ", ""), o.addr?.state || "", o.addr?.city_name || o.addr?.city || "", o.addr?.district || "", o.addr?.street || "", txtCel(soDig(o.addr?.zip)),
        o.cat || "", o.owner || "",
        p1 ? p1.nome : "", p1 ? (p1.cargo || "") : "", txtCel(p1 ? (p1.telefone || p1.whatsapp || o.phone || "") : (o.phone || "")), p1 ? (p1.email || o.email || "") : (o.email || ""),
        fmtP(ps[1]), txtCel(ps[1] ? (ps[1].telefone || ps[1].whatsapp || "") : ""),
        fmtP(ps[2]), txtCel(ps[2] ? (ps[2].telefone || ps[2].whatsapp || "") : ""),
        fmtP(ps[3]), txtCel(ps[3] ? (ps[3].telefone || ps[3].whatsapp || "") : "")]); });
    csv(rows, `empresas-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const baixarModelo = () => {
    const rows = [COLS_IMP.slice()];
    [...(allOrgs || [])].sort((a, b) => (a.nickname || a.name || "").localeCompare(b.nickname || b.name || "")).forEach(o =>
      rows.push([txtCel(soDig(o.cnpj)), o.nickname || o.name || "", o.legalName || "", (o.grupo || "").replace("Grupo: ", ""), o.addr?.state || "", o.addr?.city_name || o.addr?.city || "", o.addr?.district || "", o.addr?.street || "", txtCel(soDig(o.addr?.zip)), o.cat || "", o.owner || "", txtCel(o.phone || ""), o.email || ""]));
    csv(rows, `Jordan_Modelo_Empresas_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const importarArquivo = async (file) => {
    const texto = await file.text();
    const linhas = parseCSVEmp(texto);
    if (linhas.length < 2) { alert("Planilha vazia. Use o modelo (CNPJ na 1ª coluna)."); return; }
    const hdr = linhas[0].map(h => norm(h));
    const ix = (...alvos) => hdr.findIndex(h => alvos.some(a => h.includes(a)));
    const iCnpj = 0; // padronizado: CNPJ é sempre a 1ª coluna
    if (!/cnpj/.test(hdr[0] || "")) { alert("A 1ª coluna precisa se chamar CNPJ.\nBaixe o modelo e use o mesmo cabeçalho."); return; }
    const iFant = ix("nome fantasia", "fantasia"), iRaz = ix("razao social", "razao"), iGrp = ix("grupo"),
      iUf = ix("uf"), iCid = ix("cidade"), iBai = ix("bairro"), iEnd = ix("endereco"), iCep = ix("cep"),
      iCat = ix("categoria"), iResp = ix("responsavel"), iTel = ix("telefone"), iMail = ix("mail");
    const val = (cols, i) => (i >= 0 ? String(cols[i] ?? "").replace(/^="?|"?$/g, "").trim() : "");
    const body = linhas.slice(1).map(c => ({
      cnpj: soDig(val(c, iCnpj).replace(/^=/, "")), fantasia: val(c, iFant), razao: val(c, iRaz), grupo: val(c, iGrp),
      uf: val(c, iUf), cidade: val(c, iCid), bairro: val(c, iBai), endereco: val(c, iEnd), cep: soDig(val(c, iCep)),
      categoria: val(c, iCat), responsavel: val(c, iResp), telefone: val(c, iTel), email: val(c, iMail),
    })).filter(r => r.cnpj.length === 14);
    if (!body.length) { alert("Nenhuma linha com CNPJ válido (14 dígitos) na 1ª coluna."); return; }
    if (!confirm(`Processar ${body.length} empresa(s)?\nCNPJ existente = atualizar · CNPJ novo = cadastrar.`)) return;
    setImpLog([]); let ok = 0, novos = 0, falhas = 0; const log = [];
    for (let i = 0; i < body.length; i++) {
      const r = body[i];
      setImpMsg(`Processando ${i + 1} de ${body.length}...`);
      const org = (allOrgs || []).find(o => soDig(o.cnpj) === r.cnpj) || (excl || []).find(o => soDig(o.cnpj) === r.cnpj);
      const corpo = { cnpj: r.cnpj, fantasia: r.fantasia || null, razao: r.razao || null, cidade: r.cidade || null, uf: r.uf || null,
        grupo: r.grupo || null, categoria_nome: r.categoria || null, vendedor: r.responsavel || null,
        endereco: r.endereco || null, bairro: r.bairro || null, cep: r.cep || null, telefone: r.telefone || null, email: r.email || null };
      try {
        if (org) { await crm(token, "/api/crm/cliente-upsert", { method: "POST", body: JSON.stringify({ ...corpo, org_id: org.id }) }); ok++; log.push(`✏️ ${(r.fantasia || r.cnpj).slice(0, 34)}`); }
        else { await crm(token, "/api/crm/cliente-criar", { method: "POST", body: JSON.stringify({ ...corpo, rua: r.endereco || null }) }); novos++; log.push(`➕ ${(r.fantasia || r.cnpj).slice(0, 34)}`); }
      } catch (e) { falhas++; log.push(`❌ ${(r.fantasia || r.cnpj).slice(0, 28)}: ${e.message}`); }
      setImpLog([...log]);
    }
    setImpMsg("");
    alert(`Concluído!\n✏️ ${ok} atualizadas\n➕ ${novos} cadastradas\n❌ ${falhas} falharam\n\nToque em 🔄 (sincronizar) no topo para ver na lista.`);
    onCrmChange && onCrmChange();
  };

  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: S.ts }}>Exibindo <b style={{ color: S.txt }}>{Math.min(vc, lista.length)}</b> de <b style={{ color: S.txt }}>{lista.length}</b> empresas</p>
      <button onClick={onNovaEmpresa} style={{ display: "flex", alignItems: "center", gap: 5, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={14}/>Adicionar empresa</button>
    </div>
    <div style={{ position: "relative", marginBottom: 8 }}>
      <Search size={15} color={S.td} style={{ position: "absolute", left: 12, top: 12 }} />
      <input value={q} onChange={e => { setQ(e.target.value); setVc(60); }} placeholder="Buscar por nome, CNPJ, bairro, cidade, e-mail ou telefone..." style={{ ...inp, paddingLeft: 34 }} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <MultiSelect values={fCat} onChange={v => { setFCat(v); setVc(60); }} placeholder="Categoria" allLabel="todas" style={{ flex: 1 }} colorFor={c => CC[c] || S.pri} options={[...CATS, "Excluido"]} />
      <MultiSelect values={fResp} onChange={v => { setFResp(v); setVc(60); }} placeholder="Responsável" allLabel="todos" style={{ flex: 1 }} options={resps} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <MultiSelect values={fRfv} onChange={v => { setFRfv(v); setVc(60); }} placeholder="Classe RFV" allLabel="todas" style={{ flex: 1 }} options={["Campeão", "Leal", "Em Crescimento", "Em Risco", "Inativo"]} />
      <MultiSelect values={fGrp} onChange={v => { setFGrp(v); setVc(60); }} placeholder="Grupo" allLabel="todos" style={{ flex: 1 }} options={gruposE} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <MultiSelect values={fSr} onChange={v => { setFSr(v); setVc(60); }} placeholder="Status Recompra" allLabel="todos" style={{ flex: 1 }} options={["Em Dia", "Momento de Recompra", "Atrasado"]} />
      <MultiSelect values={fCid} onChange={v => { setFCid(v); setVc(60); }} placeholder="Cidade" allLabel="todas" style={{ flex: 1 }} options={cidades} />
      <button onClick={() => { setFCat([]); setFResp([]); setFRfv([]); setFGrp([]); setFSr([]); setFCid([]); setQ(""); setVc(60); }} style={{ padding: "8px 10px", fontSize: 12, color: S.dng, border: `1px solid ${S.dng}44`, borderRadius: 10, background: "transparent", whiteSpace: "nowrap" }}>✕ Limpar</button>
    </div>
    <div style={{ overflowX: "auto", background: S.card, border: `1px solid ${S.brd}`, borderRadius: 12, boxShadow: S.shadow }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 940 }}>
        <thead><tr>
          <th style={{ ...th, cursor: "pointer" }} onClick={() => setOrdem(o => -o)}>Nome {ordem === 1 ? "▲" : "▼"}</th>
          <th style={th}>Categoria</th><th style={th}>Bairro</th><th style={th}>Cidade</th><th style={th}>UF</th><th style={th}>RFV</th><th style={th}>Responsável</th><th style={th}>E-mail</th><th style={th}>Telefone</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {lista.slice(0, vc).map(o => { const cor = CC[o.cat] || S.ts; return (<tr key={o.id}>
            <td style={{ ...td, maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis" }}>
              <button onClick={() => onOpen(o)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: S.pl }}>{o.nickname || o.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: S.td }}>{[o.addr?.city_name || o.addr?.city, o.cnpj].filter(Boolean).join(" · ")}</span>
              </button></td>
            <td style={td}>{o.cat && <span style={{ fontSize: 10.5, color: "#fff", background: cor, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{o.cat}</span>}</td>
            <td style={{ ...td, fontSize: 11.5, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }} title={o.addr?.district || ""}>{o.addr?.district || "—"}</td>
            <td style={{ ...td, fontSize: 11.5 }}>{o.addr?.city_name || o.addr?.city || "—"}</td>
            <td style={{ ...td, fontSize: 11.5, color: S.ts }}>{o.addr?.state || "—"}</td>
            <td style={td}>{(() => { const r = rfvDe(o); if (!r) return "—"; const rc = { "Campeão": S.gold, "Leal": S.ok, "Em Crescimento": S.pri, "Em Risco": "#E76F51", "Inativo": S.td }[r.rfv] || S.ts; return <span style={{ fontSize: 10.5, color: rc, border: `1px solid ${rc}66`, background: rc + "18", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{r.rfv}</span>; })()}</td>
            <td style={{ ...td, fontSize: 11.5 }}>{o.owner || "—"}</td>
            <td style={{ ...td, fontSize: 11.5 }}>{o.email ? <a href={`mailto:${o.email}`} style={{ color: S.pl, textDecoration: "none" }}>{o.email}</a> : "—"}</td>
            <td style={{ ...td, fontSize: 11.5 }}>{o.phone ? <a href={`https://wa.me/55${String(o.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: S.ok, textDecoration: "none", fontWeight: 600 }}>{o.phone}</a> : "—"}</td>
            <td style={td}><button onClick={() => onEdit(o)} title="Editar empresa" style={{ background: "transparent", border: `1px solid ${S.gold}66`, color: S.gold, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Pencil size={14}/></button></td>
          </tr>); })}
        </tbody>
      </table>
    </div>
    {/* Barra de planilhas: exportar (CNPJ na 1ª coluna, como texto) e importar/cadastrar em massa */}
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <button onClick={exportar} disabled={!!impMsg} style={{ flex: 1, minWidth: 200, padding: 12, fontSize: 13, background: S.pri + "22", border: `1px solid ${S.pri}55`, color: S.pl, fontWeight: 600, borderRadius: 10, cursor: "pointer" }}>📊 Exportar {lista.length} empresas (Excel)</button>
      <button onClick={() => setImportar(v => !v)} style={{ flex: 1, minWidth: 200, padding: 12, fontSize: 13, background: importar ? S.acc : S.acc + "18", border: `1px solid ${S.acc}66`, color: importar ? "#fff" : S.acc, fontWeight: 600, borderRadius: 10, cursor: "pointer" }}>📥 Cadastrar empresas por planilha</button>
    </div>

    {importar && <Crd style={{ marginTop: 10, borderColor: S.acc + "66" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13.5, color: S.txt }}>Cadastrar / atualizar empresas por planilha</p>
      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: S.ts, lineHeight: 1.5 }}>
        O <b>CNPJ é sempre a 1ª coluna</b> — mesmo padrão do arquivo exportado. Linhas com CNPJ que <b>já existe</b> são <b>atualizadas</b>; CNPJ novo <b>cria</b> a empresa.
        Campos em branco não apagam o que já está no cadastro. Colunas lidas: CNPJ · Nome Fantasia · Razão Social · Grupo · UF · Cidade · Bairro · Endereço · CEP · Categoria · Responsável · Telefone · E-mail.
      </p>
      <button onClick={() => baixarModelo()} style={{ width: "100%", marginBottom: 8, padding: "9px", fontSize: 12, fontWeight: 600, background: S.pri + "18", border: `1px solid ${S.pri}66`, color: S.pl, borderRadius: 9, cursor: "pointer" }}>📄 Baixar modelo (cabeçalho + carteira atual)</button>
      <input type="file" accept=".csv,text/csv" disabled={!!impMsg} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importarArquivo(f); }} style={{ width: "100%", fontSize: 11, padding: 6 }} />
      {impMsg && <p style={{ margin: "8px 0 0", fontSize: 12, color: S.pri, fontWeight: 600 }}>{impMsg}</p>}
      {impLog.length > 0 && <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto", background: S.cl, borderRadius: 8, padding: "8px 10px" }}>
        {impLog.map((l, i) => <p key={i} style={{ margin: 0, fontSize: 11, color: S.ts, fontFamily: "monospace", wordBreak: "break-word" }}>{l}</p>)}
      </div>}
    </Crd>}

    {vc < lista.length && <button onClick={() => setVc(v => v + 60)} style={{ width: "100%", marginTop: 10, padding: 12, fontSize: 13, background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 10, color: S.txt, cursor: "pointer" }}>Ver mais ({lista.length - vc})</button>}
  </div>);
}

// ─────────────────────────────────────────────────────────────
//  Aba principal: busca de cliente + feed de atividades (Início)
// ─────────────────────────────────────────────────────────────
export function CrmTab({ visible, secao = "inicio", bump, focus, onCrmChange, token, user, allOrgs, visits, plocs, onEdit, onPerson, rfv, onNovaEmpresa, excl, pessoasQ }) {
  // secao controlada pelo menu lateral do App: inicio | empresas | pessoas
  const [sel, setSel] = useState(null);
  // Abrir a ficha de um cliente vindo de outra tela (ex.: clique no card em PDVs)
  useEffect(() => { if (focus && focus.org) setSel(focus.org); }, [focus?.t]);
  const [q, setQ] = useState("");
  const [feed, setFeed] = useState([]); const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fTipo, setFTipo] = useState([]); const [fUser, setFUser] = useState([]); const [fDias, setFDias] = useState(90); // v41: multi (combináveis)
  const [showTarefa, setShowTarefa] = useState(false);// modal "Nova tarefa" no Início (mesmo da Agenda)

  const carregaFeed = async () => { setLd(true); setErro("");
    try {
      const desde = new Date(Date.now() - fDias * 86400000).toISOString().slice(0, 10);
      const ps = new URLSearchParams({ limit: "1000", desde });
      const d = await crm(token, "/api/crm/atividades?" + ps.toString());
      setFeed(d.atividades || []);
    } catch (e) { setErro(e.message); }
    setLd(false); };
  useEffect(() => { if (visible && token) carregaFeed(); }, [visible, fDias, bump]);
  // v41: tipo e equipe filtram no aparelho (combináveis entre si)
  const feedF = useMemo(() => feed.filter(a => (!fTipo.length || fTipo.includes(a.tipo)) && (!fUser.length || fUser.includes(String(a.user_id)) || fUser.some(uid => { const U = USERS.find(u => String(u.id) === uid); return U && (a.user_nome || "") && (a.user_nome === U.n || a.user_nome.includes(U.n.split(" ")[0])); }))), [feed, fTipo, fUser]);

  const achados = useMemo(() => { const t = q.trim().toLowerCase(); if (t.length < 2) return [];
    const casa = o => (o.nickname || o.name || "").toLowerCase().includes(t) || soDig(o.cnpj).includes(soDig(t)) || (o.addr?.city_name || "").toLowerCase().includes(t);
    return [ ...(allOrgs || []).filter(casa), ...(excl || []).filter(casa) ].slice(0, 12);
  }, [q, allOrgs, excl]);

  const abrePorFeed = async (a) => {
    // Robusto contra: (1) base local ainda sincronizando (corrida na abertura do app);
    // (2) atividade apontando para cliente EXCLUÍDO (não entra em allOrgs);
    // (3) diferença de tipo número/texto no org_id.
    const nid = a.org_id != null ? Number(a.org_id) : null;
    const cn = soDig(a.cnpj || "");
    const acha = (arr) => (arr || []).find(x => (nid != null && Number(x.id) === nid) || (cn && soDig(x.cnpj) === cn));
    let o = acha(allOrgs) || acha(excl);
    if (!o) { // fallback: busca direto no D1 (independe da sincronização local)
      try {
        const q = cn || (a.org_nome || "").trim().toLowerCase();
        if (q) {
          const r = await crm(token, `/api/crm/clientes?q=${encodeURIComponent(q)}&limit=6`);
          const arr = r.clientes || [];
          o = arr.find(x => nid != null && Number(x.id) === nid) || arr.find(x => cn && soDig(x.cnpj) === cn) || (arr.length === 1 ? arr[0] : null);
        }
      } catch {}
    }
    if (o) { setSel(o); setQ(""); }
    else alert("Cliente não encontrado. Toque em 🔄 (Sincronizar) no topo e tente novamente.");
  };

  if (!visible) return null;
  if (sel) return <ClienteCRM org={sel} token={token} user={user} visits={visits} plocs={plocs} rfv={rfv} onBack={() => { setSel(null); carregaFeed(); }} onEdit={onEdit} onPerson={onPerson} onCrmChange={onCrmChange} backLabel={secao === "pessoas" ? "Voltar a Pessoas" : "Voltar ao CRM"} />;

  return (<div>
    {secao === "empresas" && <EmpresasView token={token} allOrgs={allOrgs} excl={excl} rfv={rfv} user={user} onOpen={o => setSel(o)} onEdit={onEdit} onNovaEmpresa={onNovaEmpresa} onCrmChange={onCrmChange} />}
    {secao === "pessoas" && <PessoasView token={token} allOrgs={allOrgs} excl={excl} onOpenOrg={o => setSel(o)} onPerson={onPerson} q0={pessoasQ} />}
    {secao === "inicio" && <div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
      <button onClick={() => setShowTarefa(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--chrome)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Calendar size={15}/> Nova tarefa</button>
    </div>
    <TarefaModal open={showTarefa} onClose={() => setShowTarefa(false)} token={token} user={user} allOrgs={allOrgs} onCreated={() => { carregaFeed(); onCrmChange && onCrmChange(); }} />
    {/* Busca de cliente */}
    <div style={{ position: "relative", marginBottom: 10 }}>
      <Search size={16} color={S.td} style={{ position: "absolute", left: 12, top: 12 }} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Abrir cliente: nome, CNPJ ou cidade..." style={{ ...inp, paddingLeft: 36 }} />
      {achados.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: S.card, border: `1px solid ${S.brd}`, borderRadius: 12, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        {achados.map(o => <button key={o.id} onClick={() => { setSel(o); setQ(""); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: `1px solid ${S.cl}`, padding: "10px 12px", cursor: "pointer" }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: S.txt }}>{o.nickname || o.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: S.ts }}>{[o.addr?.city_name || o.addr?.city, o.cat].filter(Boolean).join(" · ")}</p>
        </button>)}
      </div>}
    </div>

    {/* Filtros do feed */}
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
      <Chip on={!fTipo.length} onClick={() => setFTipo([])}>Todos</Chip>
      {TIPOS.map(t => <Chip key={t.id} on={fTipo.includes(t.id)} color={t.c} onClick={() => setFTipo(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])}>{t.l}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
      <MultiSelect values={fUser} onChange={setFUser} placeholder="Equipe" allLabel="toda" style={{ flex: 1 }} options={USERS.map(u => [String(u.id), u.n.split(" ")[0]])} />
      <SearchSelect value={String(fDias)} onChange={v => setFDias(+v)} placeholder="Período" style={{ flex: 1 }} options={[["7", "7 dias"], ["30", "30 dias"], ["90", "3 meses"], ["180", "6 meses"], ["365", "12 meses"]]} />
      <button onClick={carregaFeed} style={{ width: 38, height: 38, borderRadius: 10, background: S.pl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><RefreshCw size={16} color="#fff" className={ld ? "spin" : ""} /></button>
    </div>

    <p style={{ fontSize: 12, color: S.ts, margin: "0 0 8px" }}>{ld ? "Carregando atividades..." : `${feedF.length} atividade(s) no período`}</p>
    {erro && <Crd style={{ borderColor: S.dng + "66" }}><p style={{ margin: 0, fontSize: 12.5, color: S.dng }}>Erro ao carregar o feed: {erro}</p><p style={{ margin: "4px 0 0", fontSize: 11.5, color: S.ts }}>Verifique se o Dashboard está no ar (rotas CRM) e se você está logado.</p></Crd>}
    {!ld && !erro && !feedF.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Sem atividades no período. Elas aparecem aqui a cada check-out, ligação, WhatsApp ou registro manual na tela do cliente.</p></Crd>}
    {feedF.map(a => <AtvCard key={a.id} a={a} onOrg={abrePorFeed} onFinish={async (x) => { if (!confirm("Finalizar esta tarefa?")) return; try { await crm(token, "/api/crm/tarefa-concluir", { method: "PUT", body: JSON.stringify({ id: x.id }) }); setFeed(p => p.map(y => y.id === x.id ? { ...y, concluida: 1 } : y)); onCrmChange && onCrmChange(); } catch (e) { alert("Erro: " + e.message); } }} canDel={user?.role === "admin" || a.user_id === user?.id} onDel={async (x) => { if (!confirm("Excluir esta atividade do CRM?")) return; try { await crm(token, `/api/crm/atividades?id=${x.id}`, { method: "DELETE" }); setFeed(p => p.filter(y => y.id !== x.id)); } catch (e) { alert("Erro: " + e.message); } }} />)}
  </div>}
  </div>);
}
