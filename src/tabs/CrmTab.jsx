// TeamCheck — Aba CRM (v14)
// CRM próprio: histórico de atividades, contatos, fotos/arquivos da loja e GPS.
// Fonte de verdade: D1 (via Worker do Dashboard). Agendor segue como espelho.
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ArrowLeft, MapPin, Phone, MessageCircle, Mail, Users2, FileText, Camera, Paperclip, Trash2, RefreshCw, ExternalLink, BarChart3, Pencil, StickyNote, Handshake, PhoneCall, Send, Clock, Building2, Plus, X, Download, Navigation, Star, Calendar } from "lucide-react";
import { S, CC, fT, fD, gps, sL, sS, CATS, USERS, crmFire, csv, todayLocal } from "../lib";
import { SearchSelect, MultiSelect, DateField } from "../components";

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
const fDH = (iso) => { // datetime UTC do D1 -> Cuiabá
  try { const d = new Date(iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z")); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Cuiaba" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" }); } catch { return iso; }
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
function AtvCard({ a, onOrg, onDel, canDel }) {
  const t = tipoDe(a.tipo);
  return (<Crd style={{ padding: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: S.cl, borderBottom: `1px solid ${S.brd}` }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.c + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><t.I size={15} color={t.c} /></div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.txt, letterSpacing: 0.4 }}>{t.l.toUpperCase()}{a.origem === "checkout" && <span style={{ fontWeight: 400, color: S.ts }}> · check-out</span>}</p>
      <p style={{ margin: "0 0 0 auto", fontSize: 11, color: S.ts, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fDH(a.criado_em)}</p>
      {canDel && <button onClick={() => onDel(a)} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><Trash2 size={14} color={S.td} /></button>}
    </div>
    <div style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 12, color: S.ts }}>{a.user_nome || "—"}</p>
        {a.org_nome && <button onClick={() => onOrg && onOrg(a)} style={{ background: "transparent", border: "none", padding: 0, cursor: onOrg ? "pointer" : "default", display: "flex", alignItems: "center", gap: 4, color: S.pri, fontSize: 12, fontWeight: 600, textAlign: "right" }}><Building2 size={12} />{a.org_nome}</button>}
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: S.txt, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{a.texto}</p>
    </div>
  </Crd>);
}

// ─────────────────────────────────────────────────────────────
//  Tela do cliente — cabeçalho + Histórico | Contatos | Fotos | Dados
// ─────────────────────────────────────────────────────────────
function ClienteCRM({ org, token, user, visits, plocs, onBack, onEdit, onPerson, rfv, onCrmChange }) {
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
  const salvaAtv = async () => { if (!nTxt.trim() || salvando) return; setSalvando(true); setMsg("");
    try {
      await crm(token, "/api/crm/atividades", { method: "POST", body: JSON.stringify({ org_id: org.id, cnpj: cnpjN || null, org_nome: org.nickname || org.name, tipo: nTipo, texto: nTxt.trim() }) });
      setNTxt(""); carregaAtvs();
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
  const delCtt = async (c) => { if (!confirm(`Excluir contato ${c.nome}?`)) return; try { await crm(token, `/api/crm/contatos?id=${c.id}`, { method: "DELETE" }); carregaCtts(); } catch (e) { alert("Erro: " + e.message); } };

  // ── arquivos/fotos ──
  const fotoRef = useRef(); const arqRef = useRef(); const [subindo, setSubindo] = useState("");
  const upload = async (file) => { if (!file) return; setSubindo(file.name); setMsg("");
    try { const f = await comprime(file);
      const fd = new FormData(); fd.append("file", f, f.name); fd.append("org_id", String(org.id)); if (cnpjN) fd.append("cnpj", cnpjN);
      await crm(token, "/api/crm/arquivos", { method: "POST", body: fd }); carregaArqs();
    } catch (e) { setMsg("Upload: " + e.message); }
    setSubindo(""); };
  const delArq = async (a) => { if (!confirm(`Excluir ${a.nome}?`)) return; try { await crm(token, `/api/crm/arquivos?id=${a.id}`, { method: "DELETE" }); setArqs(p => p.filter(x => x.id !== a.id)); } catch (e) { alert("Erro: " + e.message); } };
  const baixaArq = async (a) => { try { const r = await fetch(`${DASH}/api/crm/arquivo?id=${a.id}`, { headers: { "X-Session": token } }); const b = await r.blob(); const u = URL.createObjectURL(b); const el = document.createElement("a"); el.href = u; el.download = a.nome || "arquivo"; el.click(); setTimeout(() => URL.revokeObjectURL(u), 5000); } catch (e) { alert("Erro: " + e.message); } };
  const [preview, setPreview] = useState(null);

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
      {(org.addr?.street||org.addr?.city_name) && <p style={{ margin: "0 0 4px", fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"flex-start" }}><MapPin size={13} style={{marginTop:2, flexShrink:0}}/>{[ [org.addr?.street, org.addr?.number].filter(Boolean).join(", "), org.addr?.district, [org.addr?.city_name||org.addr?.city, org.addr?.state].filter(Boolean).join("/") ].filter(Boolean).join(" · ")}</p>}
      {org.phone && <p style={{ margin: "0 0 4px", fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"center" }}><Phone size={13}/>{org.phone}
        <a href={`https://wa.me/55${String(org.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{color:S.ok, fontWeight:700, textDecoration:"none"}}>WhatsApp</a>
        <a href={`tel:${String(org.phone).replace(/\D/g,"")}`} style={{color:S.pl, fontWeight:700, textDecoration:"none"}}>Ligar</a></p>}
      {org.email && <p style={{ margin: 0, fontSize: 12, color: S.ts, display:"flex", gap:6, alignItems:"center" }}><Mail size={13}/><a href={`mailto:${org.email}`} style={{color:S.pl, textDecoration:"none"}}>{org.email}</a></p>}
      {!org.phone && !org.email && !(org.addr?.street||org.addr?.city_name) && <p style={{margin:0, fontSize:12, color:S.td}}>Sem contato no cadastro — use Editar para preencher.</p>}
    </Crd>);

  return (<div>
    <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: S.pri, fontSize: 13, fontWeight: 700, padding: "2px 0 10px", cursor: "pointer" }}><ArrowLeft size={16} />Voltar ao CRM</button>

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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button onClick={salvaAtv} disabled={salvando || !nTxt.trim()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: nTxt.trim() ? S.acc : S.cl, color: nTxt.trim() ? "#fff" : S.td, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Send size={14} />{salvando ? "Salvando..." : "Registrar"}</button>
        </div>
      </Crd>
      {ldA && <p style={{ fontSize: 12, color: S.ts }}>Carregando histórico...</p>}
      {!ldA && !atvs.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Nenhuma atividade registrada ainda.</p></Crd>}
      {atvs.map(a => <AtvCard key={a.id} a={a} canDel={user?.role === "admin" || a.user_id === user?.id} onDel={delAtv} />)}
    </div>}

    {/* ── CONTATOS ── */}
    {sub === "ctt" && <div>
      {!cttForm && <button onClick={() => setCttForm({ ...cttVazio })} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.acc, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, marginBottom: 10, cursor: "pointer" }}><Plus size={16} />Novo contato</button>}
      {cttForm && <Crd>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{cttForm.id ? "Editar contato" : "Novo contato"}</p><button onClick={() => setCttForm(null)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={16} color={S.ts} /></button></div>
        <div style={{ display: "grid", gap: 8 }}>
          <input style={inp} placeholder="Nome *" value={cttForm.nome} onChange={e => setCttForm(f => ({ ...f, nome: e.target.value }))} />
          <input style={inp} placeholder="Cargo (comprador, gerente...)" value={cttForm.cargo || ""} onChange={e => setCttForm(f => ({ ...f, cargo: e.target.value }))} />
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
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: S.txt }}>{c.nome}</p>
            {c.cargo && <p style={{ margin: "1px 0 0", fontSize: 12, color: S.ts }}>{c.cargo}</p>}
            {(c.telefone || c.whatsapp || c.email) && <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.td, wordBreak: "break-word" }}>{[c.telefone, c.whatsapp && "WA " + c.whatsapp, c.email].filter(Boolean).join(" · ")}</p>}
            {c.obs && <p style={{ margin: "3px 0 0", fontSize: 11.5, color: S.ts }}>{c.obs}</p>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexShrink: 0 }}>
            {c.whatsapp && <a href={`https://wa.me/55${soDig(c.whatsapp)}`} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: "#25D36622", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageCircle size={17} color="#25D366" /></a>}
            {c.telefone && <a href={`tel:${soDig(c.telefone)}`} style={{ width: 36, height: 36, borderRadius: 10, background: S.pl + "22", display: "flex", alignItems: "center", justifyContent: "center" }}><Phone size={16} color={S.pl} /></a>}
            <button onClick={() => setCttForm({ ...c })} style={{ width: 36, height: 36, borderRadius: 10, background: S.cl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Pencil size={14} color={S.ts} /></button>
            <button onClick={() => delCtt(c)} style={{ width: 36, height: 36, borderRadius: 10, background: S.dng + "18", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} color={S.dng} /></button>
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
        <input ref={fotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={arqRef} type="file" style={{ display: "none" }} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {subindo && <p style={{ fontSize: 12, color: S.pri, margin: "0 0 8px" }}>Enviando {subindo}...</p>}
      {ldF && <p style={{ fontSize: 12, color: S.ts }}>Carregando arquivos...</p>}
      {!ldF && !arqs.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Nenhuma foto ou arquivo desta loja ainda.</p></Crd>}
      {/* grade de fotos */}
      {arqs.some(a => a.tipo === "foto") && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: 8, marginBottom: 12 }}>
        {arqs.filter(a => a.tipo === "foto").map(a => <div key={a.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${S.brd}`, background: S.cl, aspectRatio: "1" }}>
          {thumbs[a.id] ? <img src={thumbs[a.id]} alt={a.nome} onClick={() => setPreview(a)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={20} color={S.td} /></div>}
          <button onClick={() => delArq(a)} style={{ position: "absolute", top: 4, right: 4, width: 26, height: 26, borderRadius: 8, background: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={13} color="#fff" /></button>
        </div>)}
      </div>}
      {/* lista de arquivos não-imagem */}
      {arqs.filter(a => a.tipo !== "foto").map(a => <Crd key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FileText size={18} color={S.pri} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: S.txt, wordBreak: "break-all" }}>{a.nome}</p>
          <p style={{ margin: 0, fontSize: 11, color: S.td }}>{(a.tamanho / 1024).toFixed(0)} KB · {a.user_nome || "—"} · {fDH(a.criado_em)}</p>
        </div>
        <button onClick={() => baixaArq(a)} style={{ width: 36, height: 36, borderRadius: 10, background: S.pl + "22", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Download size={15} color={S.pl} /></button>
        <button onClick={() => delArq(a)} style={{ width: 36, height: 36, borderRadius: 10, background: S.dng + "18", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} color={S.dng} /></button>
      </Crd>)}
      {preview && <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <img src={thumbs[preview.id]} alt={preview.nome} style={{ maxWidth: "100%", maxHeight: "82vh", borderRadius: 10 }} />
        <p style={{ color: "#fff", fontSize: 12, margin: "10px 0 0" }}>{preview.nome} · {preview.user_nome || "—"} · {fDH(preview.criado_em)} — toque para fechar</p>
      </div>}
    </div>}

    {/* ── DADOS ── */}
    {sub === "dados" && <div>
    {infoContato}
      <Crd>
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: S.txt }}>Cadastro</p>
        {[["Razão social", org.legalName], ["CNPJ", org.cnpj && fCnpj(org.cnpj)], ["Categoria", org.cat], ["Setor", org.sector], ["Responsável", org.owner], ["Grupo", org.grupo], ["Marcas", org.products],
          ["Endereço", [org.addr?.street, org.addr?.number].filter(Boolean).join(", ")], ["Bairro", org.addr?.district], ["Cidade", (org.addr?.city_name || org.addr?.city || "") + (org.addr?.state ? "/" + org.addr.state : "")]]
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
function PessoasView({ token, allOrgs, excl, onOpenOrg }) {
  const [lista, setLista] = useState(null); const [q, setQ] = useState(""); const [vc, setVc] = useState(60);
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
          {(c.whatsapp || c.telefone) && <a href={`https://wa.me/55${soDig(c.whatsapp || c.telefone)}`} target="_blank" rel="noreferrer" style={{ background: S.ok + "18", border: `1px solid ${S.ok}55`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><MessageCircle size={14} color={S.ok}/></a>}
          {c.telefone && <a href={`tel:${soDig(c.telefone)}`} style={{ background: S.pri + "18", border: `1px solid ${S.pri}55`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><Phone size={14} color={S.pri}/></a>}
          {c.email && <a href={`mailto:${c.email}`} style={{ background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><Mail size={14} color={S.ts}/></a>}
        </div>
      </div>
    </Crd>); })}
    {vc < filtrada.length && <button onClick={() => setVc(v => v + 60)} style={{ width: "100%", marginTop: 4, padding: 12, fontSize: 13, background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 10, color: S.txt }}>Ver mais ({filtrada.length - vc})</button>}
  </div>);
}

function EmpresasView({ allOrgs, excl, rfv, onOpen, onEdit, onNovaEmpresa }) {
  const rfvDe = (o) => { if (!rfv) return null; const k = soDig(o.cnpj); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[o.id] || null; };
  const PREF = "jc:empresas-prefs";
  const p0 = sL(PREF, {});
  const arr = v => Array.isArray(v) ? v : [];
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState(arr(p0.fCat)); const [fResp, setFResp] = useState(arr(p0.fResp));
  const [fRfv, setFRfv] = useState(arr(p0.fRfv)); const [fAbc, setFAbc] = useState(arr(p0.fAbc)); const [fSr, setFSr] = useState(arr(p0.fSr)); const [fCid, setFCid] = useState(arr(p0.fCid));
  useEffect(() => { sS(PREF, { fCat, fResp, fRfv, fAbc, fSr, fCid }); }, [fCat, fResp, fRfv, fAbc, fSr, fCid]);
  const [ordem, setOrdem] = useState(1); // 1 = A→Z, -1 = Z→A
  const [vc, setVc] = useState(60);
  const resps = useMemo(() => { const s = new Set(USERS.map(u => u.n)); (allOrgs||[]).forEach(o => { if (o.owner) s.add(o.owner); }); return [...s].sort(); }, [allOrgs]);
  const cidades = useMemo(() => { const s = new Set(); (allOrgs||[]).forEach(o => { const c = o.addr?.city_name || o.addr?.city; if (c) s.add(c); }); return [...s].sort(); }, [allOrgs]);
  const lista = useMemo(() => {
    let l = (q.trim() || fCat.includes("Excluido")) ? [ ...(allOrgs || []), ...(excl || []) ] : (allOrgs || []);
    if (q.trim()) { const n = q.toLowerCase().replace(/[.\-\/]/g, "");
      const casa = o => [o.name, o.nickname, o.legalName, soDig(o.cnpj), o.addr?.city_name, o.email, o.phone].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g, "").includes(n);
      l = l.filter(casa); }
    if (fCat.length) l = l.filter(o => fCat.includes(o.cat));
    if (fResp.length) l = l.filter(o => fResp.includes(o.owner));
    if (fCid.length) l = l.filter(o => fCid.includes(o.addr?.city_name || o.addr?.city));
    if (fRfv.length || fAbc.length || fSr.length) l = l.filter(o => { const r = rfvDe(o); if (!r) return false;
      if (fRfv.length && !fRfv.includes(r.rfv)) return false; if (fAbc.length && !fAbc.includes(r.abc)) return false; if (fSr.length && !fSr.includes(r.status)) return false; return true; });
    return [...l].sort((a, b) => ordem * (a.nickname || a.name || "").localeCompare(b.nickname || b.name || ""));
  }, [allOrgs, excl, q, fCat, fResp, fCid, fRfv, fAbc, fSr, ordem, rfv]);
  const th = { textAlign: "left", padding: "8px 10px", fontSize: 10.5, fontWeight: 800, color: S.ts, textTransform: "uppercase", letterSpacing: .4, whiteSpace: "nowrap", borderBottom: `2px solid ${S.brd}` };
  const td = { padding: "9px 10px", fontSize: 12, color: S.txt, borderBottom: `1px solid ${S.cl}`, whiteSpace: "nowrap", verticalAlign: "middle" };
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: S.ts }}>Exibindo <b style={{ color: S.txt }}>{Math.min(vc, lista.length)}</b> de <b style={{ color: S.txt }}>{lista.length}</b> empresas</p>
      <button onClick={onNovaEmpresa} style={{ display: "flex", alignItems: "center", gap: 5, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={14}/>Adicionar empresa</button>
    </div>
    <div style={{ position: "relative", marginBottom: 8 }}>
      <Search size={15} color={S.td} style={{ position: "absolute", left: 12, top: 12 }} />
      <input value={q} onChange={e => { setQ(e.target.value); setVc(60); }} placeholder="Buscar por nome, CNPJ, cidade, e-mail ou telefone..." style={{ ...inp, paddingLeft: 34 }} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <MultiSelect values={fCat} onChange={v => { setFCat(v); setVc(60); }} placeholder="Categoria" allLabel="todas" style={{ flex: 1 }} colorFor={c => CC[c] || S.pri} options={[...CATS, "Excluido"]} />
      <MultiSelect values={fResp} onChange={v => { setFResp(v); setVc(60); }} placeholder="Responsável" allLabel="todos" style={{ flex: 1 }} options={resps} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <MultiSelect values={fRfv} onChange={v => { setFRfv(v); setVc(60); }} placeholder="Classe RFV" allLabel="todas" style={{ flex: 1 }} options={["Campeão", "Leal", "Em Crescimento", "Em Risco", "Inativo"]} />
      <MultiSelect values={fAbc} onChange={v => { setFAbc(v); setVc(60); }} placeholder="Curva ABC" allLabel="todas" style={{ flex: 1 }} options={["A", "B", "C"]} />
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <MultiSelect values={fSr} onChange={v => { setFSr(v); setVc(60); }} placeholder="Status Recompra" allLabel="todos" style={{ flex: 1 }} options={["Em Dia", "Momento de Recompra", "Atrasado"]} />
      <MultiSelect values={fCid} onChange={v => { setFCid(v); setVc(60); }} placeholder="Cidade" allLabel="todas" style={{ flex: 1 }} options={cidades} />
      <button onClick={() => { setFCat([]); setFResp([]); setFRfv([]); setFAbc([]); setFSr([]); setFCid([]); setQ(""); setVc(60); }} style={{ padding: "8px 10px", fontSize: 12, color: S.dng, border: `1px solid ${S.dng}44`, borderRadius: 10, background: "transparent", whiteSpace: "nowrap" }}>✕ Limpar</button>
    </div>
    <div style={{ overflowX: "auto", background: S.card, border: `1px solid ${S.brd}`, borderRadius: 12, boxShadow: S.shadow }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
        <thead><tr>
          <th style={{ ...th, cursor: "pointer" }} onClick={() => setOrdem(o => -o)}>Nome {ordem === 1 ? "▲" : "▼"}</th>
          <th style={th}>Categoria</th><th style={th}>Cidade</th><th style={th}>UF</th><th style={th}>RFV</th><th style={th}>Responsável</th><th style={th}>E-mail</th><th style={th}>Telefone</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {lista.slice(0, vc).map(o => { const cor = CC[o.cat] || S.ts; return (<tr key={o.id}>
            <td style={{ ...td, maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis" }}>
              <button onClick={() => onOpen(o)} style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: S.pl }}>{o.nickname || o.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: S.td }}>{[o.addr?.city_name || o.addr?.city, o.cnpj].filter(Boolean).join(" · ")}</span>
              </button></td>
            <td style={td}>{o.cat && <span style={{ fontSize: 10.5, color: "#fff", background: cor, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{o.cat}</span>}</td>
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
    <button onClick={() => { const rows = [["Nome","CNPJ","Cidade","UF","Categoria","Classe RFV","Curva ABC","Status Recompra","Responsável","E-mail","Telefone"]];
      lista.forEach(o => { const r = rfvDe(o); rows.push([o.nickname || o.name, o.cnpj || "", o.addr?.city_name || o.addr?.city || "", o.addr?.state || "", o.cat || "", r ? r.rfv : "", r ? r.abc : "", r ? r.status : "", o.owner || "", o.email || "", o.phone || ""]); });
      csv(rows, `empresas-${new Date().toISOString().slice(0,10)}.csv`); }} style={{ width: "100%", marginTop: 10, padding: 12, fontSize: 13, background: S.pri + "22", border: `1px solid ${S.pri}55`, color: S.pl, fontWeight: 600, borderRadius: 10 }}>📊 Exportar {lista.length} empresas (Excel)</button>
    {vc < lista.length && <button onClick={() => setVc(v => v + 60)} style={{ width: "100%", marginTop: 10, padding: 12, fontSize: 13, background: S.cl, border: `1px solid ${S.brd}`, borderRadius: 10, color: S.txt, cursor: "pointer" }}>Ver mais ({lista.length - vc})</button>}
  </div>);
}

// ─────────────────────────────────────────────────────────────
//  Aba principal: busca de cliente + feed de atividades (Início)
// ─────────────────────────────────────────────────────────────
export function CrmTab({ visible, secao = "inicio", bump, focus, onCrmChange, token, user, allOrgs, visits, plocs, onEdit, onPerson, rfv, onNovaEmpresa, excl }) {
  // secao controlada pelo menu lateral do App: inicio | empresas | pessoas
  const [sel, setSel] = useState(null);
  // Abrir a ficha de um cliente vindo de outra tela (ex.: clique no card em PDVs)
  useEffect(() => { if (focus && focus.org) setSel(focus.org); }, [focus?.t]);
  const [q, setQ] = useState("");
  const [feed, setFeed] = useState([]); const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fTipo, setFTipo] = useState(""); const [fUser, setFUser] = useState(""); const [fDias, setFDias] = useState(90);

  const carregaFeed = async () => { setLd(true); setErro("");
    try {
      const desde = new Date(Date.now() - fDias * 86400000).toISOString().slice(0, 10);
      const ps = new URLSearchParams({ limit: "1000", desde });
      if (fTipo) ps.set("tipo", fTipo); if (fUser) ps.set("user_id", fUser);
      const d = await crm(token, "/api/crm/atividades?" + ps.toString());
      setFeed(d.atividades || []);
    } catch (e) { setErro(e.message); }
    setLd(false); };
  useEffect(() => { if (visible && token) carregaFeed(); }, [visible, fTipo, fUser, fDias, bump]);

  const achados = useMemo(() => { const t = q.trim().toLowerCase(); if (t.length < 2) return [];
    const casa = o => (o.nickname || o.name || "").toLowerCase().includes(t) || soDig(o.cnpj).includes(soDig(t)) || (o.addr?.city_name || "").toLowerCase().includes(t);
    return [ ...(allOrgs || []).filter(casa), ...(excl || []).filter(casa) ].slice(0, 12);
  }, [q, allOrgs, excl]);

  const abrePorFeed = (a) => { const o = (allOrgs || []).find(x => x.id === a.org_id) || (a.cnpj ? (allOrgs || []).find(x => soDig(x.cnpj) === a.cnpj) : null); if (o) { setSel(o); setQ(""); } else alert("Cliente não está na base sincronizada. Sincronize os clientes."); };

  if (!visible) return null;
  if (sel) return <ClienteCRM org={sel} token={token} user={user} visits={visits} plocs={plocs} rfv={rfv} onBack={() => { setSel(null); carregaFeed(); }} onEdit={onEdit} onPerson={onPerson} onCrmChange={onCrmChange} />;

  return (<div>
    {secao === "empresas" && <EmpresasView allOrgs={allOrgs} excl={excl} rfv={rfv} onOpen={o => setSel(o)} onEdit={onEdit} onNovaEmpresa={onNovaEmpresa} />}
    {secao === "pessoas" && <PessoasView token={token} allOrgs={allOrgs} excl={excl} onOpenOrg={o => setSel(o)} />}
    {secao === "inicio" && <div>
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
      <Chip on={!fTipo} onClick={() => setFTipo("")}>Todos</Chip>
      {TIPOS.map(t => <Chip key={t.id} on={fTipo === t.id} color={t.c} onClick={() => setFTipo(fTipo === t.id ? "" : t.id)}>{t.l}</Chip>)}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
      <SearchSelect value={fUser} onChange={setFUser} placeholder="Equipe" style={{ flex: 1 }} options={[["", "Toda a equipe"], ["743088", "Jordan"], ["743347", "Alisson"]]} />
      <SearchSelect value={String(fDias)} onChange={v => setFDias(+v)} placeholder="Período" style={{ flex: 1 }} options={[["7", "7 dias"], ["30", "30 dias"], ["90", "3 meses"], ["180", "6 meses"], ["365", "12 meses"]]} />
      <button onClick={carregaFeed} style={{ width: 38, height: 38, borderRadius: 10, background: S.pl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><RefreshCw size={16} color="#fff" className={ld ? "spin" : ""} /></button>
    </div>

    <p style={{ fontSize: 12, color: S.ts, margin: "0 0 8px" }}>{ld ? "Carregando atividades..." : `${feed.length} atividade(s) no período`}</p>
    {erro && <Crd style={{ borderColor: S.dng + "66" }}><p style={{ margin: 0, fontSize: 12.5, color: S.dng }}>Erro ao carregar o feed: {erro}</p><p style={{ margin: "4px 0 0", fontSize: 11.5, color: S.ts }}>Verifique se o Dashboard está no ar (rotas CRM) e se você está logado.</p></Crd>}
    {!ld && !erro && !feed.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Sem atividades no período. Elas aparecem aqui a cada check-out, ligação, WhatsApp ou registro manual na tela do cliente.</p></Crd>}
    {feed.map(a => <AtvCard key={a.id} a={a} onOrg={abrePorFeed} canDel={user?.role === "admin" || a.user_id === user?.id} onDel={async (x) => { if (!confirm("Excluir esta atividade do CRM?")) return; try { await crm(token, `/api/crm/atividades?id=${x.id}`, { method: "DELETE" }); setFeed(p => p.filter(y => y.id !== x.id)); } catch (e) { alert("Erro: " + e.message); } }} />)}
  </div>}
  </div>);
}
