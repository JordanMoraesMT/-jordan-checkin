// TeamCheck — aba AgendaTab
import { useState, useEffect, useMemo, useRef } from "react";
import { Check } from "lucide-react";
import { DASH, toLocalDate, todayLocal, TYPES, USERS, S, fT, fD, crmFire, gcalUrl } from "../lib";
import { LB, SegTabs, Chip, DateField, MonthCalendar, TarefaModal } from "../components";

function AgendaTab({visible,token,user,allOrgs,onCrmChange,bump}){
  const loadedRef=useRef(false);
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[err,setErr]=useState("");const isAdmin=user?.id===743088;
  const[view,setView]=useState("lista");// lista | calendario
  const[calDay,setCalDay]=useState(todayLocal());// dia selecionado no calendário
  const[filter,setFilter]=useState("pending");// pending | done
  const[period,setPeriod]=useState("all");// all | week | today | custom
  const[customFrom,setCustomFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});
  const[customTo,setCustomTo]=useState(todayLocal);
  const[userFilter,setUserFilter]=useState("all");// "all" | id do usuário (dinâmico via catálogo)
  const[showAdd,setShowAdd]=useState(false);
  const load=async()=>{setLo(true);setErr("");try{
    // Fonte única = D1 (tarefas com prazo).
    let mapped=[];
    try{
      const desde=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
      const r=await fetch(`${DASH}/api/crm/tarefas?desde=${desde}&limit=2000`,{headers:{"X-Session":token},cache:"no-store"});
      if(r.ok){const d=await r.json();if(d&&d.ok&&Array.isArray(d.tarefas))mapped=d.tarefas;}
    }catch(e){console.warn("tarefas D1:",e);}
    setTasks(mapped);setErr(`${mapped.length} tarefas · atualizado ${fT(new Date())}`);
  }catch(e){console.warn("agenda:",e);setErr("Erro: "+e.message);}setLo(false);};
  useEffect(()=>{if(!visible)return;load();const iv=setInterval(()=>{load();},300000);return()=>clearInterval(iv);},[visible,bump]);// recarrega ao abrir e a cada mudança do CRM; auto-refresh 5min enquanto visível
  const markDone=async(t)=>{if(!confirm(`Finalizar "${t.text.slice(0,50)}..."?`))return;try{
    // v24: conclui só no D1 (fonte de verdade). Usa d1_id se houver, senao o id (agendor_id legado).
    const corpo=t.d1_id?{id:t.d1_id}:{agendor_id:t.id};
    try{await fetch(`${DASH}/api/crm/tarefa-concluir`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify(corpo)});}catch(e){console.warn("concluir D1:",e);}
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true,finished:new Date().toISOString()}:x));setErr("Finalizada!");onCrmChange&&onCrmChange();
  }catch(e){console.warn("markDone:",e);alert("Erro: "+e.message);}};
  // Filters
  const today=todayLocal();const dow=new Date().getDay();const weekStart=toLocalDate(new Date(Date.now()-dow*86400000));const weekEnd=toLocalDate(new Date(Date.now()+(6-dow)*86400000));
  // Casa a tarefa ao usuário selecionado (id do catálogo). Prioriza userName (o que o selo mostra); usa userId como reserva.
  const norm=s=>(s||"").toLowerCase().trim();
  const userMatch=(t,uid)=>{if(uid==="all"||uid==null)return true;const U=USERS.find(u=>String(u.id)===String(uid));const tn=norm(t.userName);if(tn&&U){const full=norm(U.n),first=norm(U.n.split(" ")[0]);return tn===full||tn.includes(first);}return t.userId!=null&&String(t.userId)===String(uid);};
  const meWho=String(user.id);
  const filtered=useMemo(()=>{const doneCutoff=toLocalDate(new Date(Date.now()-30*86400000));let list=tasks.filter(t=>filter==="pending"?!t.done:(t.done&&((t.finished||t.created||"").slice(0,10)>=doneCutoff)));
    if(!isAdmin)list=list.filter(t=>userMatch(t,meWho));else if(userFilter!=="all")list=list.filter(t=>userMatch(t,userFilter));
    if(period==="today")list=list.filter(t=>(t.due&&t.due.slice(0,10)===today)||(t.created&&toLocalDate(t.created)===today));
    if(period==="week")list=list.filter(t=>{const d=t.due?t.due.slice(0,10):toLocalDate(t.created);return d>=weekStart&&d<=weekEnd;});
    if(period==="custom")list=list.filter(t=>{const d=t.due?t.due.slice(0,10):toLocalDate(t.created);return d>=customFrom&&d<=customTo;});
    return list.sort((a,b)=>(a.due||a.created||"9").localeCompare(b.due||b.created||"9"));
  },[tasks,filter,period,today,weekStart,weekEnd,customFrom,customTo,userFilter,isAdmin,user.id]);
  const overdue=filtered.filter(t=>!t.done&&t.due&&t.due.slice(0,10)<today);
  const todayT=filtered.filter(t=>t.due&&t.due.slice(0,10)===today);
  const futureT=filtered.filter(t=>!t.done&&t.due&&t.due.slice(0,10)>today);
  const noDueT=filtered.filter(t=>!t.due);
  const doneT=filtered.filter(t=>t.done);
  // Calendário: quem contar para os pontinhos/lista respeita o filtro de equipe
  const calWho=!isAdmin?meWho:userFilter;
  const marks=useMemo(()=>{const m={};tasks.forEach(t=>{if(t.due&&!t.done&&userMatch(t,calWho)){const d=t.due.slice(0,10);if(m[d]!==S.dng)m[d]=t.due.slice(0,10)<today?S.dng:S.gold;}});return m;},[tasks,today,calWho]);
  const dayTasks=useMemo(()=>tasks.filter(t=>{const d=t.due?t.due.slice(0,10):null;if(d!==calDay)return false;return userMatch(t,calWho);}).sort((a,b)=>(a.due||"").localeCompare(b.due||"")),[tasks,calDay,calWho]);
  // Add task: search orgs
  const renderTask=(t)=><div key={t.id} style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:13,padding:"14px 16px",marginBottom:11,display:"flex",gap:16,alignItems:"center"}}>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
        <span style={{fontSize:10,letterSpacing:".05em",textTransform:"uppercase",fontWeight:700,color:"#fff",background:t.type==="Visita"?"var(--chrome)":t.type==="WhatsApp"?S.ok:t.type==="Ligação"||t.type==="LIGACAO"?S.cyan:S.purple,padding:"3px 8px",borderRadius:6}}>{t.type}</span>
        <span style={{fontSize:14,fontWeight:700,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</span>
        {isAdmin&&<span style={{fontSize:10,color:S.acc,background:S.acc+"18",border:`1px solid ${S.acc}44`,padding:"2px 7px",borderRadius:6,fontWeight:600}}>{t.userName?.split(" ")[0]}</span>}
      </div>
      <p style={{fontSize:12.5,color:S.ts,margin:0,lineHeight:1.5,wordBreak:"break-word"}}>{t.text}</p>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:7,flexWrap:"wrap"}}>
        <span className="mono" style={{fontSize:11.5,fontWeight:600,color:t.done?S.td:t.due&&t.due.slice(0,10)<today?S.dng:S.td,textDecoration:t.done?"line-through":"none"}}>{t.due?`Prazo ${fD(t.due)} ${fT(t.due)}`:`Criada ${fD(t.created)}`}</span>
        {t.done&&t.finished&&<><span style={{width:3,height:3,borderRadius:"50%",background:S.td}}/><span className="mono" style={{fontSize:11.5,color:S.ok}}>Finalizada {fD(t.finished)}</span></>}
        {!t.done&&t.due&&<a href={gcalUrl({titulo:`${t.type||"Tarefa"} — ${t.org||""}`,detalhes:t.text||"",inicio:t.due,local:t.org||""})||"#"} target="_blank" rel="noopener" title="Adicionar ao Google Agenda" style={{fontSize:11,fontWeight:600,color:S.pl,textDecoration:"none",border:`1px solid ${S.brd}`,borderRadius:6,padding:"2px 8px"}}>📅 Google Agenda</a>}
      </div>
    </div>
    {/* Caixa de seleção: marca a tarefa como finalizada (padrão Dashboard) */}
    <button onClick={()=>!t.done&&markDone(t)} title={t.done?"Tarefa finalizada":"Marcar como finalizada"} style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,background:t.done?S.ok+"18":S.inp,border:`1px solid ${t.done?S.ok:S.inpBdr}`,borderRadius:8,padding:"8px 12px",cursor:t.done?"default":"pointer"}}>
      <span style={{width:19,height:19,borderRadius:5,flexShrink:0,border:`1.6px solid ${t.done?S.ok:S.td}`,background:t.done?S.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.done&&<Check size={13} color="#fff" strokeWidth={3}/>}</span>
      <span style={{fontSize:12.5,fontWeight:600,color:t.done?S.ok:S.ts}}>{t.done?"Finalizada":"Finalizar"}</span>
    </button>
  </div>;
  return(<div style={{display:visible?"block":"none"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:S.txt}}>Agenda</div>
        <div style={{fontSize:12,color:S.ts,marginTop:2}}>{err||`${filtered.length} tarefa(s)${filter==="pending"?" pendentes":" finalizadas"}`}</div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div style={{minWidth:210}}><SegTabs items={[["lista","📋 Lista"],["calendario","🗓️ Calendário"]]} value={view} onChange={setView} size={12.5}/></div>
        <button onClick={load} disabled={lo} style={{width:38,height:38,borderRadius:9,border:`1px solid ${S.inpBdr}`,background:S.inp,fontSize:14,padding:0}}>{lo?"…":"🔄"}</button>
        <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:7,background:"var(--chrome)",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:500,cursor:"pointer"}}>+ Nova tarefa</button>
      </div>
    </div>
    {/* Barra de filtros (card padrão mockup) */}
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
      {view==="lista"&&<>
        <div style={{minWidth:200}}><SegTabs items={[["pending","Pendentes"],["done","Finalizadas"]]} value={filter} onChange={setFilter} size={12.5}/></div>
        <div style={{width:1,height:22,background:S.brd}}/>
        {[["all","Todas"],["week","Semana"],["today","Hoje"],["custom","Definir"]].map(([k,l])=><Chip key={k} on={period===k} color="var(--chrome)" onClick={()=>setPeriod(k)}>{l}</Chip>)}
      </>}
      {isAdmin&&<><div style={{width:1,height:22,background:S.brd}}/>
      {[["all","Todos"],...USERS.map(u=>[String(u.id),u.n.split(" ")[0]])].map(([k,l])=><Chip key={k} on={String(userFilter)===k} color={S.acc} onClick={()=>setUserFilter(k)}>{l}</Chip>)}</>}
      {view==="lista"&&period==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center",flexBasis:"100%"}}><DateField value={customFrom} onChange={setCustomFrom} today={today} placeholder="De" style={{flex:1}}/><span style={{color:S.td,fontSize:11}}>a</span><DateField value={customTo} onChange={setCustomTo} today={today} placeholder="Até" style={{flex:1}}/></div>}
    </div>
    {/* ── VISÃO CALENDÁRIO ── */}
    {view==="calendario"&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,340px) 1fr",gap:16,alignItems:"start"}}>
      <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"16px 16px 14px"}}>
        <MonthCalendar value={calDay} today={today} marks={marks} onSelect={setCalDay}/>
        <div style={{display:"flex",gap:12,marginTop:12,paddingTop:10,borderTop:`1px solid ${S.cl}`,fontSize:11,color:S.ts}}>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:S.gold}}/>Pendente</span>
          <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:S.dng}}/>Atrasada</span>
        </div>
      </div>
      <div>
        <div style={{fontSize:14,fontWeight:700,color:S.txt,margin:"2px 4px 12px"}}>{fD(calDay+"T12:00")} · {dayTasks.length} tarefa(s)</div>
        {dayTasks.length?dayTasks.map(renderTask):<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"2rem",textAlign:"center",color:S.ts,fontSize:13}}>Nenhuma tarefa neste dia.</div>}
      </div>
    </div>}
    {view==="lista"&&<>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando...</p>}
    {!lo&&filter==="pending"&&<>{overdue.length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"0 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.dng}}>⚠️ Atrasadas ({overdue.length})</span></div>{overdue.map(renderTask)}</>}
      {todayT.filter(t=>!t.done).length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"14px 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.gold}}>📌 Hoje ({todayT.filter(t=>!t.done).length})</span></div>{todayT.filter(t=>!t.done).map(renderTask)}</>}
      {futureT.length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"14px 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.pl}}>🗓️ Próximas ({futureT.length})</span></div>{futureT.map(renderTask)}</>}</>}
    {!lo&&filter==="done"&&<>{doneT.length?doneT.map(renderTask):<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma finalizada no período</p>}</>}
    {!lo&&!filtered.length&&filter==="pending"&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma tarefa pendente</p>}
    </>}
    {/* Add Task Modal */}
    <TarefaModal open={showAdd} onClose={()=>setShowAdd(false)} token={token} user={user} allOrgs={allOrgs} onCreated={()=>{load();onCrmChange&&onCrmChange();}}/>
  </div>);}

export { AgendaTab };
