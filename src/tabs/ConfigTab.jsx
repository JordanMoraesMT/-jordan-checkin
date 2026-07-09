// TeamCheck — aba ConfigTab
import { useState } from "react";
import { HOMES, TZ, S, DASH, API, csv, getBase, getEnd, sL, sS } from "../lib";
import { HotelGeoInput, ProgressBar } from "../components";
import { ConfigCatalogos } from "./ConfigCatalogos";

// Parser de CSV que respeita aspas ("") — casa com o export do helper csv() (delimitador ; e aspas)
function parseCSV(text){
  const lines=text.replace(/\r\n?/g,"\n").split("\n").filter(l=>l.length);
  if(!lines.length)return[];
  const semi=(lines[0].match(/;/g)||[]).length,comma=(lines[0].match(/,/g)||[]).length;
  const delim=semi>=comma?";":",";
  const rows=[];
  for(const line of lines){
    const out=[];let cur="",inQ=false;
    for(let i=0;i<line.length;i++){const ch=line[i];
      if(inQ){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++;}else inQ=false;}else cur+=ch;}
      else{if(ch==='"')inQ=true;else if(ch===delim){out.push(cur);cur="";}else cur+=ch;}
    }
    out.push(cur);rows.push(out.map(s=>s.trim()));
  }
  return rows;
}
const soDig=x=>String(x||"").replace(/\D/g,"");

// Botões de ação no formato dos cards do Início do Dashboard (proporções menores)
const ASETA=<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const ARow=({emo,t,d,onClick,disabled,color})=>{const cor=color||S.pri;return(
  <div onClick={disabled?undefined:onClick} role="button"
    style={{position:"relative",background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"12px 14px 10px",overflow:"hidden",cursor:disabled?"default":"pointer",opacity:disabled?.6:1,transition:"border-color .18s"}}
    onMouseEnter={e=>{if(disabled)return;e.currentTarget.style.borderColor=cor;const b=e.currentTarget.querySelector(".cf-bar");if(b)b.style.transform="scaleX(1)";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="";e.currentTarget.style.border=`1px solid ${S.brd}`;const b=e.currentTarget.querySelector(".cf-bar");if(b)b.style.transform="scaleX(0)";}}>
    <div style={{width:36,height:36,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",background:cor+"1c",fontSize:17,marginBottom:9}}>{emo}</div>
    <div style={{fontSize:13.5,fontWeight:700,letterSpacing:"-.01em",color:S.txt}}>{t}</div>
    {d&&<div style={{fontSize:11.5,color:S.td,marginTop:4,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{d}</div>}
    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,fontSize:11,fontWeight:600,color:cor}}>Abrir {ASETA}</div>
    <span className="cf-bar" style={{position:"absolute",left:0,bottom:0,height:3,width:"100%",background:cor,transform:"scaleX(0)",transformOrigin:"left",transition:"transform .3s"}}/>
  </div>
);};
function ConfigTab({instEvt,user,orgs,allOrgs,token,visits,plocs,dayBases,today,syncStatus,syncing,syncMsg,onSync,onLoadHistory,onSyncPull,onShareGPS,onShowDB,onShowEnd,onDeleteGPS,onSaveGPS,onClearVisits,onClearAllGPS,onLogout,doSync}){
  const[gpsSearch,setGpsSearch]=useState("");const[histLoading,setHistLoading]=useState(false);const[shareLoading,setShareLoading]=useState(false);
  const[gpsAddSearch,setGpsAddSearch]=useState("");const[gpsAddTarget,setGpsAddTarget]=useState(null);const[gpsAddLat,setGpsAddLat]=useState(null);const[gpsAddLng,setGpsAddLng]=useState(null);
  const gpsResults=gpsSearch.trim().length>=2?orgs.filter(o=>{const q=gpsSearch.toLowerCase().replace(/[.\-\/]/g,"");return plocs[o.id]&&[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  const gpsAddResults=gpsAddSearch.trim().length>=2?orgs.filter(o=>{const q=gpsAddSearch.toLowerCase().replace(/[.\-\/]/g,"");return[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  const[tema,setTema]=useState(()=>sL("jc:theme","dark"));
  const trocaTema=(t)=>{setTema(t);sS("jc:theme",t);document.documentElement.dataset.theme=t;};
  const isAdmin=user?.id===743088;
  const[sub,setSub]=useState("acoes"); // acoes | cadastros
  const jaInstalado=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;
  const ehIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  // v43: reconstrói o GPS dos clientes a partir das coordenadas das visitas de campo (KV visits_*)
  const[gpsRec,setGpsRec]=useState("");
  const recuperaGps=async()=>{
    const cand={};
    (visits||[]).forEach(v=>{if(v.orgId&&v.lat&&v.lng&&!plocs[v.orgId]){if(!cand[v.orgId]||v.checkinTime>cand[v.orgId].t)cand[v.orgId]={lat:v.lat,lng:v.lng,t:v.checkinTime};}});
    const ids=Object.keys(cand);
    if(!ids.length){alert("Nenhuma localização nova encontrada nas visitas — tudo que as visitas têm já está salvo.");return;}
    if(!confirm(`Encontrei ${ids.length} cliente(s) com GPS nas visitas antigas que NÃO está salvo hoje.\nRecuperar e salvar?`))return;
    setGpsRec("Salvando 0/"+ids.length);
    const np={...plocs};let n=0;
    for(const oid of ids){const g=cand[oid];np[oid]={lat:g.lat,lng:g.lng};n++;setGpsRec(`Salvando ${n}/${ids.length}`);
      try{await fetch(`${DASH}/api/crm/gps`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:Number(oid),lat:g.lat,lng:g.lng})});}catch(e){}}
    try{await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:np})});}catch(e){}
    setGpsRec("");onSyncPull&&onSyncPull();alert(`${ids.length} localização(ões) recuperadas! Abra o Mapa para conferir.`);
  };
  // ── Extensão do WhatsApp ──
  // Instalação com 1 clique só existe via Chrome Web Store (o Chrome bloqueia instalação automática
  // por site). Assim que a extensão for publicada (modo "Não listado"), cole o link dela aqui:
  const EXT_STORE_URL=""; // ex.: "https://chromewebstore.google.com/detail/abcdefghijklmnop"
  const EXT_ARQS=["manifest.json","background.js","content.js","panel.css","icon128.png"];
  const[extMsg,setExtMsg]=useState("");
  const baixarExtensao=async()=>{
    if(!window.showDirectoryPicker){
      alert("A instalação automática funciona no Chrome do computador.\n\nAbra o TeamCheck no Chrome (Windows/Mac/Linux) e toque de novo neste card.");
      return;
    }
    let raiz;
    try{ raiz=await window.showDirectoryPicker({mode:"readwrite"}); }catch{ return; } // cancelou
    try{
      setExtMsg("Gravando arquivos...");
      const pasta=await raiz.getDirectoryHandle("TeamCheck-Extensao",{create:true});
      for(const nome of EXT_ARQS){
        const r=await fetch(`/ext/${nome}`,{cache:"no-store"});
        if(!r.ok) throw new Error(nome+" ("+r.status+")");
        const bytes=await r.arrayBuffer();
        const arq=await pasta.getFileHandle(nome,{create:true});
        const w=await arq.createWritable(); await w.write(bytes); await w.close();
      }
      setExtMsg("");
      alert("Pronto! A pasta TeamCheck-Extensao foi criada no local escolhido.\n\nAgora no Chrome:\n1. Abra chrome://extensions\n2. Ligue o \"Modo do desenvolvedor\" (canto superior direito)\n3. Clique em \"Carregar sem compactação\"\n4. Selecione a pasta TeamCheck-Extensao\n\nNão precisa descompactar nada.");
    }catch(e){ setExtMsg(""); alert("Não consegui gravar a extensão: "+e.message); }
  };
  const instalar=async()=>{
    if(instEvt){try{instEvt.prompt();const r=await instEvt.userChoice;if(r?.outcome==="accepted")alert("Aplicativo instalado! Procure o ícone TeamCheck na tela inicial.");}catch{}}
    else if(ehIOS)alert("No iPhone/iPad:\n1. Toque no botão Compartilhar (quadrado com seta) na barra do Safari\n2. Role e toque em \"Adicionar à Tela de Início\"\n3. Toque em \"Adicionar\"\n\nO TeamCheck vira um app com ícone próprio.");
    else alert("No Android (Chrome): toque nos 3 pontinhos ⋮ e depois em \"Instalar aplicativo\" (ou \"Adicionar à tela inicial\").\nNo computador: ícone de instalação na barra de endereço.");
  };
  return(<div>
    {isAdmin&&<div style={{display:"flex",gap:5,background:S.cl,border:`1px solid ${S.brd}`,borderRadius:11,padding:4,marginBottom:16,maxWidth:420}}>
      {[["acoes","⚙️ Ações & Sync"],["cadastros","🗂️ Cadastros"]].map(([id,l])=>
        <button key={id} onClick={()=>setSub(id)} style={{flex:1,textAlign:"center",padding:"9px 6px",borderRadius:8,fontSize:13,fontWeight:sub===id?600:500,background:sub===id?"var(--card-solid)":"transparent",color:sub===id?S.pl:S.ts,boxShadow:sub===id?"0 1px 2px rgba(3,73,100,.14)":"none",border:"none",cursor:"pointer"}}>{l}</button>)}
    </div>}
    {isAdmin&&sub==="cadastros"?<ConfigCatalogos token={token}/>:<div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12,boxShadow:S.shadow}}>
      <p style={{fontSize:13,fontWeight:700,color:S.txt,margin:"0 0 8px"}}>🎨 Tema</p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>trocaTema("dark")} style={{flex:1,padding:"10px",fontSize:13,fontWeight:tema==="dark"?700:400,background:tema==="dark"?S.pri:"transparent",color:tema==="dark"?"#fff":S.ts,border:`1px solid ${tema==="dark"?S.pri:S.brd}`,borderRadius:10}}>🌙 Escuro</button>
        <button onClick={()=>trocaTema("light")} style={{flex:1,padding:"10px",fontSize:13,fontWeight:tema==="light"?700:400,background:tema==="light"?S.pri:"transparent",color:tema==="light"?"#fff":S.ts,border:`1px solid ${tema==="light"?S.pri:S.brd}`,borderRadius:10}}>☀️ Claro</button>
      </div>
      <p style={{fontSize:11,color:S.td,margin:"8px 0 0"}}>Mesmo sistema de temas do Dashboard. A escolha fica salva neste aparelho.</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:12}}>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"16px 18px"}}>
      <p style={{fontSize:14,fontWeight:700,margin:"0 0 6px",color:S.txt}}>{user?.name}</p>
      {HOMES[user?.id]&&<p style={{fontSize:12,color:S.pl,margin:0}}>Casa: <b>{HOMES[user.id].label}</b></p>}
      {getBase(dayBases,today,user?.id)&&<p style={{fontSize:12,color:S.ts,margin:"2px 0 0"}}>Base hoje: {getBase(dayBases,today,user?.id)?.label||"Casa"}{getEnd(dayBases,today,user?.id)!==getBase(dayBases,today,user?.id)?` → ${getEnd(dayBases,today,user?.id)?.label||"Casa"}`:""}</p>}
    </div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"16px 18px"}}>
      <p style={{fontSize:12.5,color:S.t2,margin:0}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p>
      <p className="mono" style={{fontSize:11.5,color:syncStatus.startsWith?.("Erro")?S.dng:S.pl,margin:"6px 0 0"}}>Sync {syncStatus||"aguardando..."}</p>
      <p className="mono" style={{fontSize:11,color:S.td,margin:"3px 0 0"}}>User {user?.id} · Polling 15s · TZ Cuiabá · v60</p>
    </div>
    </div>
    <ProgressBar active={syncing||histLoading||shareLoading} msg={syncing?syncMsg:histLoading?"Carregando historico...":"Enviando GPS..."}/>
    <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10}}>
      <ARow emo="⚡" t="Forçar sincronização" d="Baixa a carteira, o histórico e o estado da equipe/GPS" onClick={async()=>{setHistLoading(true);await onSync();await onLoadHistory();setHistLoading(false);onSyncPull();}} disabled={syncing||histLoading}/>
      <ARow emo="📡" t={shareLoading?"Enviando GPS...":`Compartilhar ${Object.keys(plocs).length} GPS com equipe`} d="Publica as localizações salvas neste aparelho" onClick={async()=>{if(!confirm("Compartilhar GPS com equipe?"))return;setShareLoading(true);await onShareGPS();setShareLoading(false);}} disabled={shareLoading}/>
      <ARow emo="🗺️" t="Definir jornada" d="Origem e destino do dia (casa, hotel...)" onClick={onShowDB}/>
      <ARow emo="🏨" t="Fechar roteiro do dia" d="Define o ponto final e conclui o dia" onClick={onShowEnd}/>
      <ARow emo={("Notification"in window&&Notification.permission==="granted")?"🔔":"🔕"} t={("Notification"in window&&Notification.permission==="granted")?"Notificações ativadas":"Ativar notificações"} d="Lembretes de tarefas agendadas" color={("Notification"in window&&Notification.permission==="granted")?S.ok:S.gold} onClick={()=>{if(!("Notification"in window)){alert("Navegador nao suporta notificacoes");return;}Notification.requestPermission().then(p=>{if(p==="granted")alert("Notificacoes ativadas! Voce recebera lembretes de tarefas agendadas.");else alert("Notificacoes bloqueadas. Ative nas configuracoes do navegador.");});}}/>
      {user?.role==="admin"&&<ARow emo="🛰️" t={gpsRec||"Recuperar GPS das visitas"} d="Reconstrói a localização de clientes (Sinop, Sorriso, Lucas, Nova Mutum...) a partir das coordenadas das visitas antigas" onClick={gpsRec?undefined:recuperaGps} disabled={!!gpsRec}/>}
      <ARow emo="📲" t={jaInstalado?"Aplicativo instalado ✓":"Instalar aplicativo no celular"} d={jaInstalado?"Você já está usando o TeamCheck instalado":"Ícone próprio na tela inicial — funciona como app (Android e iPhone)"} color={jaInstalado?S.ok:undefined} onClick={jaInstalado?undefined:instalar} disabled={jaInstalado}/>
      {EXT_STORE_URL
        ? <ARow emo="🧩" t="Instalar extensão do WhatsApp" d="1 clique: abre a Chrome Web Store e é só tocar em 'Usar no Chrome'." color={S.gold} onClick={()=>window.open(EXT_STORE_URL,"_blank")}/>
        : <ARow emo="🧩" t={extMsg||"Baixar extensão do WhatsApp"} d="Grava a pasta pronta no seu computador (sem zip, sem descompactar). Depois é só 'Carregar sem compactação' no Chrome." color={S.gold} onClick={extMsg?undefined:baixarExtensao} disabled={!!extMsg}/>}
      </div>

      {/* Admin area (Jordan only) */}
      {user?.id===743088&&<>
        <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:12,marginTop:4}}>
          <p style={{fontSize:12,fontWeight:600,color:S.gold,margin:"0 0 8px"}}>⚙️ Administrador</p>
        </div>
        {/* GPS manual save */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>📍 Salvar GPS de cliente</p>
          <input value={gpsAddSearch} onChange={e=>{setGpsAddSearch(e.target.value);setGpsAddTarget(null);setGpsAddLat(null);setGpsAddLng(null);}} placeholder="Buscar cliente por nome, CNPJ..." style={{width:"100%",marginBottom:6,fontSize:12}}/>
          {!gpsAddTarget&&gpsAddResults.length>0&&<div style={{maxHeight:160,overflowY:"auto"}}>
            {gpsAddResults.map(o=><div key={o.id} onClick={()=>{setGpsAddTarget(o);if(plocs[o.id]){setGpsAddLat(plocs[o.id].lat);setGpsAddLng(plocs[o.id].lng);}}} style={{padding:"6px 0",borderBottom:`1px solid ${S.brd}`,cursor:"pointer"}}>
              <p style={{fontSize:12,fontWeight:500,margin:0}}>{plocs[o.id]?"🟢 ":"⚪ "}{o.name}</p>
              <p style={{fontSize:10,color:S.ts,margin:0}}>{o.cnpj||""} · {o.addr?.city_name||o.addr?.city||""}{plocs[o.id]?` · GPS: ${plocs[o.id].lat.toFixed(4)},${plocs[o.id].lng.toFixed(4)}`:""}</p>
            </div>)}
          </div>}
          {gpsAddTarget&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <p style={{fontSize:12,fontWeight:600,margin:0}}>{gpsAddTarget.name}</p>
              <button onClick={()=>{setGpsAddTarget(null);setGpsAddLat(null);setGpsAddLng(null);}} style={{fontSize:10,padding:"2px 8px",color:S.td}}>✕</button>
            </div>
            <HotelGeoInput name={gpsAddTarget.addr?.city_name||gpsAddTarget.name} onNameChange={()=>{}} lat={gpsAddLat} lng={gpsAddLng} onCoordsChange={(la,ln)=>{setGpsAddLat(la);setGpsAddLng(ln);}} label="Buscar localização no Maps"/>
            <button onClick={()=>{if(!gpsAddLat||!gpsAddLng){alert("Defina as coordenadas primeiro.");return;}if(confirm(`Salvar GPS de ${gpsAddTarget.name}?\n${gpsAddLat.toFixed(5)}, ${gpsAddLng.toFixed(5)}`)){onSaveGPS(gpsAddTarget.id,gpsAddLat,gpsAddLng);setGpsAddTarget(null);setGpsAddSearch("");setGpsAddLat(null);setGpsAddLng(null);}}} disabled={!gpsAddLat||!gpsAddLng} style={{width:"100%",marginTop:6,padding:8,fontSize:12,background:gpsAddLat?S.ok:S.cl,border:"none",fontWeight:600}}>💾 Salvar GPS</button>
          </div>}
        </div>
        {/* GPS delete per client */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px"}}>
          <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>🗑️ Apagar GPS de cliente</p>
          <input value={gpsSearch} onChange={e=>setGpsSearch(e.target.value)} placeholder="Buscar por nome, CNPJ..." style={{width:"100%",marginBottom:6,fontSize:12}}/>
          {gpsResults.length>0&&<div style={{maxHeight:200,overflowY:"auto"}}>
            {gpsResults.map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${S.brd}`}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</p>
                <p style={{fontSize:10,color:S.ts,margin:0}}>{o.cnpj||""} · GPS: {plocs[o.id]?.lat?.toFixed(4)},{plocs[o.id]?.lng?.toFixed(4)}</p>
              </div>
              <button onClick={()=>{if(confirm(`Apagar GPS de ${o.name}?`)){onDeleteGPS(o.id);setGpsSearch("");}}} style={{padding:"4px 10px",fontSize:10,background:S.dng+"22",border:`1px solid ${S.dng}`,color:S.dng,flexShrink:0}}>Apagar</button>
            </div>)}
          </div>}
          {gpsSearch.trim().length>=2&&!gpsResults.length&&<p style={{fontSize:11,color:S.ts}}>Nenhum cliente com GPS encontrado</p>}
        </div>
        <button onClick={()=>{const dt=prompt("Data para limpar visitas (DD/MM/AAAA):");if(!dt)return;const[d,m,y]=dt.split("/");const target=`${y}-${m}-${d}`;const count=visits.filter(v=>v.checkinTime?.startsWith(target)).length;if(!count){alert("Nenhuma visita nessa data.");return;}if(confirm(`Tem certeza que deseja excluir ${count} visitas de ${dt}?\nEssa ação não pode ser desfeita.`))onClearVisits(target);}} style={{color:S.gold}}>🗓️ Limpar visitas (por data)</button>
        <button onClick={async()=>{if(!confirm("Forçar reload completo?\nIsto vai limpar cache e re-sincronizar todos os dados.\nVocê não perderá nada.\n\nUsado para corrigir caracteres especiais corrompidos."))return;try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}}catch{}localStorage.removeItem("jc:prefill");window.location.reload(true);}} style={{color:S.acc}}>♻️ Forçar reload (corrigir caracteres)</button>
        <button onClick={()=>{if(confirm(`Tem certeza que deseja apagar TODOS os ${Object.keys(plocs).length} GPS salvos?\nEssa ação não pode ser desfeita.`))onClearAllGPS();}} style={{color:S.gold}}>📍 Limpar todos GPS PDVs</button>
        {/* Bulk update grupos (empresas) — com modelo pré-preenchido */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginTop:8}}>
          <p style={{fontSize:12,fontWeight:600,margin:"0 0 4px",color:S.txt}}>🏢 Atualizar grupos em massa</p>
          <p style={{fontSize:10.5,color:S.ts,margin:"0 0 8px"}}>Baixe o modelo já preenchido com sua carteira, edite a coluna <b>Grupo</b> e reenvie. Colunas: CNPJ · Empresa · Grupo.</p>
          <button onClick={()=>{const rows=[["CNPJ","Empresa","Grupo"]];[...allOrgs].sort((a,b)=>(a.name||a.nickname||"").localeCompare(b.name||b.nickname||"")).forEach(o=>rows.push([o.cnpj||"",o.name||o.nickname||"",(o.grupo||"").replace(/^Grupo:\s*/i,"").trim()]));csv(rows,`Jordan_Modelo_Grupos_${new Date().toISOString().slice(0,10)}.csv`);}} style={{width:"100%",marginBottom:8,padding:"9px",fontSize:12,fontWeight:600,background:S.pri+"18",border:`1px solid ${S.pri}66`,color:S.pl,borderRadius:9,cursor:"pointer"}}>📥 Baixar modelo (empresas)</button>
          <input type="file" accept=".csv" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const text=await file.text();const rows=parseCSV(text);const body=rows.slice(1).map(cols=>({cnpj:soDig(cols[0]),grupo:(cols[cols.length-1]||"").trim()})).filter(r=>r.cnpj&&r.grupo);if(!body.length){alert("CSV vazio ou inválido.\nUse o modelo baixado (CNPJ · Empresa · Grupo).");e.target.value="";return;}if(!confirm(`Atualizar grupos em ${body.length} clientes no cadastro (D1)?`)){e.target.value="";return;}let ok=0,fail=0,notfound=0;const log=[];for(const r of body){const org=allOrgs.find(o=>soDig(o.cnpj)===r.cnpj);if(!org){notfound++;log.push(`${r.cnpj}: não encontrado`);continue;}try{await fetch(`${DASH}/api/crm/cliente-upsert`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:org.id,cnpj:soDig(org.cnpj)||null,grupo:r.grupo})});ok++;log.push(`✅ ${(org.name||"").slice(0,30)} → ${r.grupo}`);}catch(x){fail++;log.push(`❌ ${(org.name||"").slice(0,30)}: ${x.message}`);}}alert(`Concluído!\n✅ ${ok} atualizados\n❌ ${fail} falharam\n⚠️ ${notfound} não encontrados\n\n${log.slice(0,20).join("\n")}${log.length>20?`\n... +${log.length-20} mais`:""}`);e.target.value="";if(ok)await doSync();}} style={{width:"100%",fontSize:11,padding:6}}/>
        </div>
        {/* Bulk update pessoas (contatos) — com modelo pré-preenchido */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginTop:8}}>
          <p style={{fontSize:12,fontWeight:600,margin:"0 0 4px",color:S.txt}}>👥 Atualizar pessoas em massa</p>
          <p style={{fontSize:10.5,color:S.ts,margin:"0 0 8px"}}>Baixe o modelo com os contatos, edite e reenvie. Linhas com <b>ID</b> são atualizadas; linhas sem ID (com CNPJ) criam contato novo. Colunas: ID · Nome · Empresa · CNPJ · Cargo · Telefone · WhatsApp · Email.</p>
          <button onClick={async()=>{try{const r=await fetch(`${DASH}/api/crm/contatos-todos`,{headers:{"X-Session":token},cache:"no-store"});const d=await r.json();const cts=(d&&d.contatos)||[];const rows=[["ID","Nome","Empresa","CNPJ","Cargo","Telefone","WhatsApp","Email"]];cts.forEach(c=>rows.push([c.id||"",c.nome||"",c.empresa||"",c.cnpj||"",c.cargo||"",c.telefone||"",c.whatsapp||"",c.email||""]));csv(rows,`Jordan_Modelo_Pessoas_${new Date().toISOString().slice(0,10)}.csv`);}catch(x){alert("Não consegui baixar os contatos: "+x.message);}}} style={{width:"100%",marginBottom:8,padding:"9px",fontSize:12,fontWeight:600,background:S.pri+"18",border:`1px solid ${S.pri}66`,color:S.pl,borderRadius:9,cursor:"pointer"}}>📥 Baixar modelo (pessoas)</button>
          <input type="file" accept=".csv" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const text=await file.text();const rows=parseCSV(text);const hdr=(rows[0]||[]).map(h=>h.toLowerCase());const ix=n=>hdr.findIndex(h=>h.includes(n));const iId=ix("id"),iNome=ix("nome"),iCnpj=ix("cnpj"),iCargo=ix("cargo"),iTel=ix("telefone"),iWa=ix("whats"),iMail=ix("mail");const body=rows.slice(1).map(c=>({id:iId>=0?(c[iId]||"").trim():"",nome:iNome>=0?(c[iNome]||"").trim():"",cnpj:iCnpj>=0?soDig(c[iCnpj]):"",cargo:iCargo>=0?(c[iCargo]||"").trim():"",telefone:iTel>=0?(c[iTel]||"").trim():"",whatsapp:iWa>=0?(c[iWa]||"").trim():"",email:iMail>=0?(c[iMail]||"").trim():""})).filter(r=>r.id||(r.nome&&r.cnpj));if(!body.length){alert("CSV vazio ou inválido.\nUse o modelo baixado (Pessoas).");e.target.value="";return;}if(!confirm(`Processar ${body.length} contatos?\nCom ID = atualizar · sem ID = criar novo.`)){e.target.value="";return;}let upd=0,cri=0,fail=0,notfound=0;const log=[];for(const r of body){try{if(r.id){await fetch(`${DASH}/api/crm/contatos`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({id:r.id,nome:r.nome,cargo:r.cargo,telefone:r.telefone,whatsapp:r.whatsapp,email:r.email})});upd++;log.push(`✏️ ${r.nome.slice(0,28)}`);}else{const org=allOrgs.find(o=>soDig(o.cnpj)===r.cnpj);if(!org){notfound++;log.push(`⚠️ ${r.nome.slice(0,24)}: CNPJ ${r.cnpj} não achado`);continue;}await fetch(`${DASH}/api/crm/contatos`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({nome:r.nome,cargo:r.cargo,telefone:r.telefone,whatsapp:r.whatsapp,email:r.email,org_id:org.id,cnpj:r.cnpj||null})});cri++;log.push(`➕ ${r.nome.slice(0,28)} → ${(org.name||"").slice(0,20)}`);}}catch(x){fail++;log.push(`❌ ${r.nome.slice(0,24)}: ${x.message}`);}}alert(`Concluído!\n✏️ ${upd} atualizados\n➕ ${cri} criados\n❌ ${fail} falharam\n⚠️ ${notfound} sem CNPJ\n\n${log.slice(0,20).join("\n")}${log.length>20?`\n... +${log.length-20} mais`:""}`);e.target.value="";}} style={{width:"100%",fontSize:11,padding:6}}/>
        </div>
      </>}
      <button onClick={()=>{if(confirm("Deseja realmente desconectar?\nVoce precisara inserir o token novamente."))onLogout();}} style={{color:S.dng,marginTop:8}}>🚪 Desconectar</button>
    </div>
    </div>}
  </div>);}

export { ConfigTab };
