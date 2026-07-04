// TeamCheck — Aba CRM (v14)
// CRM próprio: histórico de atividades, contatos, fotos/arquivos da loja e GPS.
// Fonte de verdade: D1 (via Worker do Dashboard). Agendor segue como espelho.
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ArrowLeft, MapPin, Phone, MessageCircle, Mail, Users2, FileText, Camera, Paperclip, Trash2, RefreshCw, ExternalLink, BarChart3, Pencil, StickyNote, Handshake, PhoneCall, Send, Clock, Building2, Plus, X, Download, Navigation } from "lucide-react";
import { S, CC, fT, fD, gps, postTask, sL, sS } from "../lib";

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
  try { const d = new Date(iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z")); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Cuiaba" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Cuiaba" }); } catch { return iso; }
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

const Crd = ({ children, style }) => <div style={{ background: S.card, border: `1px solid ${S.brd}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, ...style }}>{children}</div>;
const Chip = ({ on, onClick, children, color }) => <button onClick={onClick} style={{ border: `1px solid ${on ? (color || S.pri) : S.brd}`, background: on ? (color || S.pri) : S.card, color: on ? "#fff" : S.ts, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: on ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>;
const inp = { width: "100%", boxSizing: "border-box", background: "#fff", border: `1px solid ${S.brd}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: S.txt };

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
function ClienteCRM({ org, token, user, visits, plocs, onBack, onEdit, onPerson, rfv }) {
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
    const r1 = await crm(token, `/api/crm/atividades?org_id=${org.id}&limit=200`);
    let lista = r1.atividades || [];
    if (cnpjN) { try { const r2 = await crm(token, `/api/crm/atividades?cnpj=${cnpjN}&limit=200`); const ids = new Set(lista.map(a => a.id)); lista = [...lista, ...(r2.atividades || []).filter(a => !ids.has(a.id))]; } catch {} }
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
      if (espelha && nTipo !== "NOTA") { try { await postTask(token, org.id, nTxt.trim(), nTipo, true); } catch (e) { setMsg("Gravado no CRM; espelho Agendor falhou: " + e.message); } }
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

  const catCor = CC[org.cat] || S.ts;
  // Matriz RFV consolidada (mesma régua do Dashboard)
  const rfvInfo = useMemo(() => { if (!rfv) return null; const k = soDig(org.cnpj); if (k && rfv.byCnpj[k.padStart(14, "0")]) return rfv.byCnpj[k.padStart(14, "0")]; return rfv.byOrg[org.id] || null; }, [rfv, org.id, org.cnpj]);
  const RFVC = { "Campeão": S.gold, "Leal": S.ok, "Em Crescimento": S.pri, "Em Risco": "#E76F51", "Inativo": S.td };
  const SRC_ = { "Em Dia": S.ok, "Momento de Recompra": S.gold, "Atrasado": S.dng };
  const ultimaVisita = useMemo(() => (visits || []).filter(v => v.orgId === org.id && v.checkoutTime).sort((a, b) => b.checkinTime.localeCompare(a.checkinTime))[0], [visits, org.id]);
  const subs = [["hist", "Histórico"], ["ctt", "Contatos"], ["arq", "Fotos & Arquivos"], ["dados", "Dados"]];

  return (<div>
    <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: S.pri, fontSize: 13, fontWeight: 700, padding: "2px 0 10px", cursor: "pointer" }}><ArrowLeft size={16} />Voltar ao CRM</button>

    {/* Cabeçalho do cliente */}
    <Crd>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: S.txt, lineHeight: 1.2 }}>{org.nickname || org.name}</p>
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
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {cnpjN && <button onClick={() => window.open(`${DASH}/?cliente=${cnpjN}`, "_blank", "noopener")} style={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.pri, color: "#fff", border: "none", borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><BarChart3 size={15} />Dashboard</button>}
        <button onClick={() => onEdit && onEdit(org)} style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.card, color: S.txt, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Pencil size={14} />Editar</button>
        <button onClick={() => onPerson && onPerson(org)} style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: S.card, color: S.txt, border: `1px solid ${S.brd}`, borderRadius: 10, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}><Users2 size={14} />Agendor</button>
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
      {subs.map(([id, l]) => <button key={id} onClick={() => setSub(id)} style={{ flex: 1, border: "none", background: sub === id ? S.pri : "transparent", borderRadius: 6, padding: "8px 2px", fontSize: 11.5, fontWeight: sub === id ? 700 : 400, color: sub === id ? "#fff" : S.ts, cursor: "pointer" }}>{l}</button>)}
    </div>

    {/* ── HISTÓRICO ── */}
    {sub === "hist" && <div>
      <Crd>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>{TIPOS.map(t => <Chip key={t.id} on={nTipo === t.id} color={t.c} onClick={() => setNTipo(t.id)}>{t.l}</Chip>)}</div>
        <textarea value={nTxt} onChange={e => setNTxt(e.target.value)} rows={3} placeholder="Escreva a atividade / observação..." style={{ ...inp, resize: "vertical", marginTop: 4 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: nTipo === "NOTA" ? S.td : S.ts }}>
            <input type="checkbox" checked={espelha && nTipo !== "NOTA"} disabled={nTipo === "NOTA"} onChange={e => setEspelha(e.target.checked)} />Espelhar no Agendor
          </label>
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
      {org.people && <p style={{ fontSize: 11.5, color: S.td, margin: "4px 2px" }}>Pessoas no Agendor: {org.people}</p>}
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
//  Aba principal: busca de cliente + feed de atividades (Início)
// ─────────────────────────────────────────────────────────────
export function CrmTab({ visible, token, user, allOrgs, visits, plocs, onEdit, onPerson, rfv }) {
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [feed, setFeed] = useState([]); const [ld, setLd] = useState(false); const [erro, setErro] = useState("");
  const [fTipo, setFTipo] = useState(""); const [fUser, setFUser] = useState(""); const [fDias, setFDias] = useState(30);

  const carregaFeed = async () => { setLd(true); setErro("");
    try {
      const desde = new Date(Date.now() - fDias * 86400000).toISOString().slice(0, 10);
      const ps = new URLSearchParams({ limit: "150", desde });
      if (fTipo) ps.set("tipo", fTipo); if (fUser) ps.set("user_id", fUser);
      const d = await crm(token, "/api/crm/atividades?" + ps.toString());
      setFeed(d.atividades || []);
    } catch (e) { setErro(e.message); }
    setLd(false); };
  useEffect(() => { if (visible && token) carregaFeed(); }, [visible, fTipo, fUser, fDias]);

  const achados = useMemo(() => { const t = q.trim().toLowerCase(); if (t.length < 2) return [];
    return (allOrgs || []).filter(o => (o.nickname || o.name || "").toLowerCase().includes(t) || soDig(o.cnpj).includes(soDig(t)) || (o.addr?.city_name || "").toLowerCase().includes(t)).slice(0, 12);
  }, [q, allOrgs]);

  const abrePorFeed = (a) => { const o = (allOrgs || []).find(x => x.id === a.org_id) || (a.cnpj ? (allOrgs || []).find(x => soDig(x.cnpj) === a.cnpj) : null); if (o) { setSel(o); setQ(""); } else alert("Cliente não está na base sincronizada. Sincronize os clientes."); };

  if (!visible) return null;
  if (sel) return <ClienteCRM org={sel} token={token} user={user} visits={visits} plocs={plocs} rfv={rfv} onBack={() => { setSel(null); carregaFeed(); }} onEdit={onEdit} onPerson={onPerson} />;

  return (<div>
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
      <select value={fUser} onChange={e => setFUser(e.target.value)} style={{ ...inp, width: "auto", flex: 1, padding: "8px 10px", fontSize: 12.5 }}>
        <option value="">Toda a equipe</option><option value="743088">Jordan</option><option value="743347">Alisson</option>
      </select>
      <select value={fDias} onChange={e => setFDias(+e.target.value)} style={{ ...inp, width: "auto", flex: 1, padding: "8px 10px", fontSize: 12.5 }}>
        <option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option><option value={365}>12 meses</option>
      </select>
      <button onClick={carregaFeed} style={{ width: 38, height: 38, borderRadius: 10, background: S.pl, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><RefreshCw size={16} color="#fff" className={ld ? "spin" : ""} /></button>
    </div>

    <p style={{ fontSize: 12, color: S.ts, margin: "0 0 8px" }}>{ld ? "Carregando atividades..." : `${feed.length} atividade(s) no período`}</p>
    {erro && <Crd style={{ borderColor: S.dng + "66" }}><p style={{ margin: 0, fontSize: 12.5, color: S.dng }}>Erro ao carregar o feed: {erro}</p><p style={{ margin: "4px 0 0", fontSize: 11.5, color: S.ts }}>Verifique se o Dashboard está na v185+ (rotas CRM) e se você está logado.</p></Crd>}
    {!ld && !erro && !feed.length && <Crd><p style={{ margin: 0, fontSize: 13, color: S.ts, textAlign: "center" }}>Sem atividades no período. Elas aparecem aqui a cada check-out, ligação, WhatsApp ou registro manual na tela do cliente.</p></Crd>}
    {feed.map(a => <AtvCard key={a.id} a={a} onOrg={abrePorFeed} canDel={user?.role === "admin" || a.user_id === user?.id} onDel={async (x) => { if (!confirm("Excluir esta atividade do CRM?")) return; try { await crm(token, `/api/crm/atividades?id=${x.id}`, { method: "DELETE" }); setFeed(p => p.filter(y => y.id !== x.id)); } catch (e) { alert("Erro: " + e.message); } }} />)}
  </div>);
}
