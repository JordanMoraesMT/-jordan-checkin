// TeamCheck — aba AgendaTab
import { useState, useEffect, useMemo, useRef } from "react";
import { API, toLocalDate, todayLocal, TYPES, S, fT, fD, agF } from "../lib";
import { LB } from "../components";

function AgendaTab({visible,token,user,allOrgs}){
  const loadedRef=useRef(false);
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[err,setErr]=useState("");const isAdmin=user?.id===743088;
  const[filter,setFilter]=useState("pending");// pending | done
  const[period,setPeriod]=useState("all");// all | week | today | custom
  const[customFrom,setCustomFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});
  const[customTo,setCustomTo]=useState(todayLocal);
  const[userFilter,setUserFilter]=useState("all");// all | jordan | alisson
  const[showAdd,setShowAdd]=useState(false);const[addQ,setAddQ]=useState("");const[addOrg,setAddOrg]=useState(null);
  const[addType,setAddType]=useState("VISITA");const[addText,setAddText]=useState("");const[addDate,setAddDate]=useState("");const[addTime,setAddTime]=useState("09:00");const[addLo,setAddLo]=useState(false);
  const load=async()=>{setLo(true);setErr("");try{
    const now=new Date();let all=[];
    for(let w=0;w<2;w++){const from=new Date(now);from.setDate(from.getDate()-30*(w+1));const to=new Date(now);to.setDate(to.getDate()-30*w);
      setErr(`${all.length} tasks (${w*30}d)...`);
      let pg=1;while(true){const d=await agF(`/tasks?createdDateGt=${from.toISOString()}&createdDateLt=${to.toISOString()}&per_page=100&page=${pg}`,token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}}
    // ONLY tasks with due_date (tarefas agendadas), NOT activities (logs without schedule)
    // done field is ALWAYS null in Agendor API — use finishedAt to determine completion
    const mapped=all.filter(t=>t.due_date||t.dueDate).map(t=>({id:t.id,type:t.type||"?",org:t.organization?.name||"?",orgId:t.organization?.id,text:t.text||"",due:t.due_date||t.dueDate||null,created:t.createdAt,done:!!(t.finishedAt||t.done),finished:t.finishedAt||null,userName:t.user?.name||"?",userId:t.user?.id}));
    setTasks(mapped);setErr(`${mapped.length} tarefas · atualizado ${fT(new Date())}`);
  }catch(e){console.warn("agenda:",e);setErr("Erro: "+e.message);}setLo(false);};
  useEffect(()=>{if(!visible)return;if(!loadedRef.current){loadedRef.current=true;load();}const iv=setInterval(()=>{load();},300000);return()=>clearInterval(iv);},[visible]);// carrega só na 1ª abertura; auto-refresh 5min enquanto visível
  const markDone=async(t)=>{if(!confirm(`Finalizar "${t.text.slice(0,50)}..."?`))return;try{
    // Agendor API ignores done:true on PUT — use DELETE + POST activity
    await agF(`/organizations/${t.orgId}/tasks/${t.id}`,token,{method:"DELETE"});
    await agF(`/organizations/${t.orgId}/tasks`,token,{method:"POST",body:JSON.stringify({text:"[CONCLUIDA] "+t.text,type:t.type,done:true})});
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true,finished:new Date().toISOString()}:x));setErr("Finalizada!");
  }catch(e){console.warn("markDone:",e);alert("Erro: "+e.message);}};
  const addTask=async()=>{if(!addOrg||!addText.trim())return;setAddLo(true);try{const body={text:addText,type:addType,done:false};if(addDate)body.due_date=`${addDate}T${addTime}:00-04:00`;await agF(`/organizations/${addOrg.id}/tasks`,token,{method:"POST",body:JSON.stringify(body)});setShowAdd(false);setAddOrg(null);setAddText("");setAddDate("");await load();}catch(e){alert("Erro: "+e.message);}setAddLo(false);};
  // Filters
  const today=todayLocal();const dow=new Date().getDay();const weekStart=toLocalDate(new Date(Date.now()-dow*86400000));const weekEnd=toLocalDate(new Date(Date.now()+(6-dow)*86400000));
  const filtered=useMemo(()=>{const doneCutoff=toLocalDate(new Date(Date.now()-30*86400000));let list=tasks.filter(t=>filter==="pending"?!t.done:(t.done&&((t.finished||t.created||"").slice(0,10)>=doneCutoff)));
    if(!isAdmin||userFilter!=="all"){const uid=userFilter==="alisson"?743347:userFilter==="jordan"?743088:user.id;list=list.filter(t=>isAdmin&&userFilter==="all"?true:t.userId===uid);}
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
  // Add task: search orgs
  const addResults=addQ.trim().length>=2?allOrgs.filter(o=>[o.name,o.nickname,o.legalName,o.cnpj].filter(Boolean).some(f=>f.toLowerCase().includes(addQ.toLowerCase()))).slice(0,8):[];
  const renderTask=(t)=><div key={t.id} style={{background:S.cl,borderRadius:8,padding:"10px 12px",marginBottom:4,display:"flex",gap:8,alignItems:"flex-start"}}>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#fff",background:t.type==="Visita"?S.acc:t.type==="WhatsApp"?S.ok:S.pri,padding:"1px 6px",borderRadius:4}}>{t.type}</span>
        <p style={{fontSize:12,fontWeight:500,margin:0,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</p>
        {isAdmin&&<span style={{fontSize:9,color:S.acc,background:S.acc+"18",padding:"1px 6px",borderRadius:4}}>{t.userName?.split(" ")[0]}</span>}
      </div>
      <p style={{fontSize:11,color:S.ts,margin:"3px 0",wordBreak:"break-word"}}>{t.text}</p>
      <p style={{fontSize:10,color:t.done?S.ok:t.due&&t.due.slice(0,10)<today?S.dng:S.td,margin:0}}>{t.due?`Prazo: ${fD(t.due)} ${fT(t.due)}`:`Criada: ${fD(t.created)}`}{t.done&&t.finished?` · Finalizada ${fD(t.finished)}`:""}</p>
    </div>
    {!t.done&&<button onClick={()=>markDone(t)} style={{padding:"6px 12px",fontSize:11,background:S.ok+"22",border:`1px solid ${S.ok}`,color:S.ok,borderRadius:6,flexShrink:0,fontWeight:500}}>Finalizar</button>}
    {t.done&&<span style={{fontSize:18,flexShrink:0}}>✅</span>}
  </div>;
  return(<div style={{display:visible?"block":"none"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <p style={{fontWeight:600,fontSize:16,margin:0}}>📅 Agenda</p>
      <div style={{display:"flex",gap:4}}><button onClick={()=>setShowAdd(true)} style={{padding:"6px 12px",fontSize:11,background:S.acc,border:"none",fontWeight:600}}>+ Tarefa</button><button onClick={load} disabled={lo} style={{padding:"6px 12px",fontSize:11,background:S.pri,border:"none"}}>{lo?"...":"🔄"}</button></div>
    </div>
    {/* Pendentes / Finalizadas */}
    <div style={{display:"flex",gap:3,marginBottom:8}}><button onClick={()=>setFilter("pending")} style={{flex:1,padding:8,fontSize:12,border:filter==="pending"?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:filter==="pending"?S.pri+"22":"transparent",color:filter==="pending"?S.pri:S.ts,fontWeight:filter==="pending"?600:400}}>Pendentes</button><button onClick={()=>setFilter("done")} style={{flex:1,padding:8,fontSize:12,border:filter==="done"?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:filter==="done"?S.ok+"22":"transparent",color:filter==="done"?S.ok:S.ts,fontWeight:filter==="done"?600:400}}>Finalizadas</button></div>
    {/* Period filters */}
    <div style={{display:"flex",gap:3,marginBottom:6}}>{[["all","Todas"],["week","Semana"],["today","Hoje"],["custom","Definir"]].map(([k,l])=><button key={k} onClick={()=>setPeriod(k)} style={{flex:1,padding:6,fontSize:10,border:`1px solid ${period===k?S.gold:S.brd}`,background:period===k?S.gold+"18":"transparent",color:period===k?S.gold:S.td,borderRadius:6,fontWeight:period===k?600:400}}>{l}</button>)}</div>
    {period==="custom"&&<div style={{display:"flex",gap:4,marginBottom:6,alignItems:"center"}}><input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{flex:1,fontSize:10,padding:4}}/><span style={{color:S.td,fontSize:10}}>a</span><input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{flex:1,fontSize:10,padding:4}}/></div>}
    {/* User filter (admin) */}
    {isAdmin&&<div style={{display:"flex",gap:3,marginBottom:8}}>{[["all","Todos"],["jordan","Jordan"],["alisson","Alisson"]].map(([k,l])=><button key={k} onClick={()=>setUserFilter(k)} style={{flex:1,padding:5,fontSize:10,border:`1px solid ${userFilter===k?S.acc:S.brd}`,background:userFilter===k?S.acc+"18":"transparent",color:userFilter===k?S.acc:S.td,borderRadius:6}}>{l}</button>)}</div>}
    {err&&<p style={{fontSize:11,color:err.startsWith("Erro")?S.dng:S.acc,margin:"0 0 8px",padding:"4px 10px",background:S.cl,borderRadius:6}}>{err}</p>}
    <p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>{filtered.length} tarefa(s){filter==="pending"?" pendentes":" finalizadas"}</p>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando...</p>}
    {!lo&&filter==="pending"&&<>{overdue.length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.dng,margin:"0 0 4px"}}>⚠️ Atrasadas ({overdue.length})</p>{overdue.map(renderTask)}</>}
      {todayT.filter(t=>!t.done).length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.gold,margin:"8px 0 4px"}}>📌 Hoje ({todayT.filter(t=>!t.done).length})</p>{todayT.filter(t=>!t.done).map(renderTask)}</>}
      {futureT.length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.pri,margin:"8px 0 4px"}}>🗓️ Próximas ({futureT.length})</p>{futureT.map(renderTask)}</>}</>}
    {!lo&&filter==="done"&&<>{doneT.length?doneT.map(renderTask):<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma finalizada no período</p>}</>}
    {!lo&&!filtered.length&&filter==="pending"&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma tarefa pendente</p>}
    {/* Add Task Modal */}
    {showAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
      <p style={{fontWeight:600,fontSize:16,margin:"0 0 8px"}}>+ Nova Tarefa</p>
      {!addOrg?<><input value={addQ} onChange={e=>setAddQ(e.target.value)} placeholder="Buscar cliente..." style={{width:"100%",marginBottom:6,fontSize:13}} autoFocus/>
        {addResults.map(o=><div key={o.id} onClick={()=>{setAddOrg(o);setAddQ("");}} style={{padding:"8px",background:S.cl,borderRadius:6,marginBottom:3,cursor:"pointer",fontSize:12}}><b>{o.name}</b><span style={{color:S.ts,marginLeft:6,fontSize:10}}>{o.addr?.city_name||""}</span></div>)}
        <button onClick={()=>setShowAdd(false)} style={{width:"100%",marginTop:8}}>Cancelar</button>
      </>:<>
        <div style={{background:S.cl,borderRadius:8,padding:8,marginBottom:8}}><p style={{fontSize:13,fontWeight:600,margin:0}}>{addOrg.name}</p><p style={{fontSize:10,color:S.ts,margin:0}}>{addOrg.cnpj||""} · {addOrg.addr?.city_name||""}</p></div>
        <LB t="TIPO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{TYPES.map(t=><button key={t.id} onClick={()=>setAddType(t.id)} style={{padding:5,fontSize:9,border:addType===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:addType===t.id?S.cl:S.bg,color:addType===t.id?S.pl:S.ts}}>{t.l}</button>)}</div></LB>
        <LB t="DESCRIÇÃO *"><textarea value={addText} onChange={e=>setAddText(e.target.value)} rows={2} placeholder="O que precisa ser feito?" style={{width:"100%"}}/></LB>
        <LB t="PRAZO"><div style={{display:"flex",gap:6}}><input type="date" value={addDate} onChange={e=>setAddDate(e.target.value)} style={{flex:1}}/><input type="time" value={addTime} onChange={e=>setAddTime(e.target.value)} style={{width:80}}/></div></LB>
        <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>{setShowAdd(false);setAddOrg(null);}} style={{flex:1}}>Cancelar</button><button onClick={addTask} disabled={addLo||!addText.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{addLo?"...":"Criar Tarefa"}</button></div>
      </>}
    </div></div>}
  </div>);}

export { AgendaTab };
