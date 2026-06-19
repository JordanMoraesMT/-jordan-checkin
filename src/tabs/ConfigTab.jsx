// TeamCheck — aba ConfigTab
import { useState } from "react";
import { HOMES, TZ, S, agF, csv, getBase, getEnd } from "../lib";
import { HotelGeoInput, ProgressBar } from "../components";

function ConfigTab({user,orgs,allOrgs,token,visits,plocs,dayBases,today,syncStatus,syncing,syncMsg,onSync,onLoadHistory,onSyncPull,onShareGPS,onShowDB,onShowEnd,onDeleteGPS,onSaveGPS,onClearVisits,onClearAllGPS,onLogout,doSync}){
  const[gpsSearch,setGpsSearch]=useState("");const[histLoading,setHistLoading]=useState(false);const[shareLoading,setShareLoading]=useState(false);
  const[gpsAddSearch,setGpsAddSearch]=useState("");const[gpsAddTarget,setGpsAddTarget]=useState(null);const[gpsAddLat,setGpsAddLat]=useState(null);const[gpsAddLng,setGpsAddLng]=useState(null);
  const gpsResults=gpsSearch.trim().length>=2?orgs.filter(o=>{const q=gpsSearch.toLowerCase().replace(/[.\-\/]/g,"");return plocs[o.id]&&[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  const gpsAddResults=gpsAddSearch.trim().length>=2?orgs.filter(o=>{const q=gpsAddSearch.toLowerCase().replace(/[.\-\/]/g,"");return[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  return(<div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:15,fontWeight:600,margin:"0 0 4px"}}>{user?.name}</p>
      {HOMES[user?.id]&&<p style={{fontSize:12,color:S.ok}}>Casa: {HOMES[user.id].label}</p>}
      {getBase(dayBases,today,user?.id)&&<p style={{fontSize:11,color:S.ts,margin:"2px 0 0"}}>Base hoje: {getBase(dayBases,today,user?.id)?.label||"Casa"}{getEnd(dayBases,today,user?.id)!==getBase(dayBases,today,user?.id)?` → ${getEnd(dayBases,today,user?.id)?.label||"Casa"}`:""}</p>}
    </div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:12,color:S.ts}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p>
      <p style={{fontSize:11,color:syncStatus.startsWith?.("Erro")?S.dng:S.acc,margin:"4px 0 0"}}>Sync: {syncStatus||"aguardando..."}</p>
      <p style={{fontSize:10,color:S.td,margin:"2px 0 0"}}>User ID: {user?.id} | Polling: 15s | TZ: Cuiabá | v17</p>
    </div>
    <ProgressBar active={syncing||histLoading||shareLoading} msg={syncing?syncMsg:histLoading?"Carregando historico...":"Enviando GPS..."}/>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
      <button onClick={onSync} disabled={syncing} style={{padding:14,fontSize:14,fontWeight:500,background:S.pri,border:"none",position:"relative",overflow:"hidden"}}>{syncing?syncMsg:"🔄 Sincronizar Clientes"}</button>
      <button onClick={async()=>{setHistLoading(true);await onLoadHistory();setHistLoading(false);}} disabled={histLoading} style={{padding:12,fontSize:13,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc,fontWeight:500}}>{histLoading?"⏳ Carregando...":"📥 Carregar historico do Agendor"}</button>
      <button onClick={onSyncPull} style={{padding:12,fontSize:13,background:S.gold+"22",border:`1px solid ${S.gold}`,color:S.gold,fontWeight:500}}>⚡ Forçar sincronização</button>
      <button onClick={async()=>{if(!confirm("Compartilhar GPS com equipe?"))return;setShareLoading(true);await onShareGPS();setShareLoading(false);}} disabled={shareLoading} style={{padding:12,fontSize:13,background:S.ok+"22",border:`1px solid ${S.ok}`,color:S.ok,fontWeight:500}}>{shareLoading?"⏳ Enviando...":"📡 Compartilhar "+Object.keys(plocs).length+" GPS com equipe"}</button>
      <button onClick={onShowDB} style={{padding:12}}>🗺️ Definir jornada (origem e destino)</button>
      <button onClick={onShowEnd} style={{padding:12}}>🏨 Fechar roteiro do dia</button>
      <button onClick={()=>{if(!("Notification"in window)){alert("Navegador nao suporta notificacoes");return;}Notification.requestPermission().then(p=>{if(p==="granted")alert("Notificacoes ativadas! Voce recebera lembretes de tarefas agendadas.");else alert("Notificacoes bloqueadas. Ative nas configuracoes do navegador.");});}} style={{padding:12,background:("Notification"in window&&Notification.permission==="granted")?S.ok+"22":S.gold+"22",border:`1px solid ${("Notification"in window&&Notification.permission==="granted")?S.ok:S.gold}`,color:("Notification"in window&&Notification.permission==="granted")?S.ok:S.gold}}>
        {("Notification"in window&&Notification.permission==="granted")?"🔔 Notificações ativadas":"🔕 Ativar notificações"}
      </button>

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
        {/* Bulk update grupos */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginTop:8}}>
          <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>📋 Atualizar grupos em massa</p>
          <p style={{fontSize:10,color:S.ts,margin:"0 0 8px"}}>CSV com colunas: CNPJ, Grupo</p>
          <input type="file" accept=".csv" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const text=await file.text();const lines=text.split(/\r?\n/).filter(Boolean);const rows=lines.slice(1).map(l=>{const[c,g]=l.split(/[,;]/);return{cnpj:(c||"").replace(/\D/g,""),grupo:(g||"").trim().replace(/^"|"$/g,"")};}).filter(r=>r.cnpj&&r.grupo);if(!rows.length){alert("CSV vazio ou formato inválido.\nFormato: CNPJ,Grupo\n12345678000190,REDE MATEUS");e.target.value="";return;}if(!confirm(`Atualizar grupos em ${rows.length} clientes?\nIsto vai sobrescrever o campo description no Agendor.`)){e.target.value="";return;}let ok=0,fail=0,notfound=0;const log=[];for(const r of rows){const org=allOrgs.find(o=>o.cnpj?.replace(/\D/g,"")===r.cnpj);if(!org){notfound++;log.push(`${r.cnpj}: não encontrado`);continue;}try{await agF(`/organizations/${org.id}`,token,{method:"PUT",body:JSON.stringify({description:`Grupo: ${r.grupo}`,products:[]})});ok++;log.push(`✅ ${org.name.slice(0,30)} → ${r.grupo}`);}catch(x){fail++;log.push(`❌ ${org.name.slice(0,30)}: ${x.message}`);}}alert(`Concluído!\n✅ ${ok} atualizados\n❌ ${fail} falharam\n⚠️ ${notfound} não encontrados\n\nLog:\n${log.slice(0,20).join("\n")}${log.length>20?`\n... +${log.length-20} mais`:""}`);e.target.value="";if(ok)await doSync();}} style={{width:"100%",fontSize:11,padding:6}}/>
        </div>
      </>}
      <button onClick={()=>{if(confirm("Deseja realmente desconectar?\nVoce precisara inserir o token novamente."))onLogout();}} style={{color:S.dng,marginTop:8}}>🚪 Desconectar</button>
    </div>
  </div>);}

export { ConfigTab };
