// TeamCheck — aba AgendaTab
import { useState, useEffect, useMemo, useRef } from "react";
import { API, toLocalDate, todayLocal, TYPES, S, fT, fD, agF, crmFire } from "../lib";
import { LB, SegTabs, Chip } from "../components";

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
    crmFire(token,"/api/crm/tarefa-concluir",{agendor_id:t.id},"PUT");setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true,finished:new Date().toISOString()}:x));setErr("Finalizada!");
  }catch(e){console.warn("markDone:",e);alert("Erro: "+e.message);}};
  const addTask=async()=>{if(!addOrg||!addText.trim())return;setAddLo(true);try{const body={text:addText,type:addType,done:false};if(addDate)body.due_date=`${addDate}T${addTime}:00-04:00`;const rT=await agF(`/organizations/${addOrg.id}/tasks`,token,{method:"POST",body:JSON.stringify(body)});crmFire(token,"/api/crm/atividades",{org_id:addOrg.id,cnpj:(addOrg.cnpj||"").replace(/\D/g,"")||null,org_nome:addOrg.nickname||addOrg.name,tipo:addType,texto:addText,origem:"tarefa",due_em:body.due_date||null,agendor_id:rT?.data?.id||null});setShowAdd(false);setAddOrg(null);setAddText("");setAddDate("");await load();}catch(e){alert("Erro: "+e.message);}setAddLo(false);};
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
  const renderTask=(t)=><div key={t.id} style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:13,padding:"14px 16px",marginBottom:11,display:"flex",gap:16,alignItems:"center"}}>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
        <span style={{fontSize:10,letterSpacing:".05em",textTransform:"uppercase",fontWeight:700,color:"#fff",background:t.type==="Visita"?"var(--chrome)":t.type==="WhatsApp"?S.ok:t.type==="Ligação"||t.type==="LIGACAO"?S.cyan:S.purple,padding:"3px 8px",borderRadius:6}}>{t.type}</span>
        <span style={{fontSize:14,fontWeight:700,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</span>
        {isAdmin&&<span style={{fontSize:10,color:S.acc,background:S.acc+"18",border:`1px solid ${S.acc}44`,padding:"2px 7px",borderRadius:6,fontWeight:600}}>{t.userName?.split(" ")[0]}</span>}
      </div>
      <p style={{fontSize:12.5,color:S.ts,margin:0,lineHeight:1.5,wordBreak:"break-word"}}>{t.text}</p>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:7,flexWrap:"wrap"}}>
        <span className="mono" style={{fontSize:11.5,fontWeight:600,color:t.done?S.ok:t.due&&t.due.slice(0,10)<today?S.dng:S.td}}>{t.due?`Prazo ${fD(t.due)} ${fT(t.due)}`:`Criada ${fD(t.created)}`}</span>
        {t.done&&t.finished&&<><span style={{width:3,height:3,borderRadius:"50%",background:S.td}}/><span className="mono" style={{fontSize:11.5,color:S.ok}}>Finalizada {fD(t.finished)}</span></>}
      </div>
    </div>
    {!t.done&&<button onClick={()=>markDone(t)} style={{background:S.inp,border:`1px solid ${S.ok}66`,color:S.ok,borderRadius:8,padding:"9px 16px",fontSize:12.5,fontWeight:600,cursor:"pointer",flexShrink:0}}>Finalizar</button>}
    {t.done&&<span style={{fontSize:18,flexShrink:0}}>✅</span>}
  </div>;
  return(<div style={{display:visible?"block":"none"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:S.txt}}>Agenda</div>
        <div style={{fontSize:12,color:S.ts,marginTop:2}}>{err||`${filtered.length} tarefa(s)${filter==="pending"?" pendentes":" finalizadas"}`}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={load} disabled={lo} style={{width:38,height:38,borderRadius:9,border:`1px solid ${S.inpBdr}`,background:S.inp,fontSize:14,padding:0}}>{lo?"…":"🔄"}</button>
        <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:7,background:"var(--chrome)",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:500,cursor:"pointer"}}>+ Nova tarefa</button>
      </div>
    </div>
    {/* Barra de filtros (card padrão mockup) */}
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
      <div style={{minWidth:200}}><SegTabs items={[["pending","Pendentes"],["done","Finalizadas"]]} value={filter} onChange={setFilter} size={12.5}/></div>
      <div style={{width:1,height:22,background:S.brd}}/>
      {[["all","Todas"],["week","Semana"],["today","Hoje"],["custom","Definir"]].map(([k,l])=><Chip key={k} on={period===k} color="var(--chrome)" onClick={()=>setPeriod(k)}>{l}</Chip>)}
      {isAdmin&&<><div style={{width:1,height:22,background:S.brd}}/>
      {[["all","Todos"],["jordan","Jordan"],["alisson","Alisson"]].map(([k,l])=><Chip key={k} on={userFilter===k} color={S.acc} onClick={()=>setUserFilter(k)}>{l}</Chip>)}</>}
      {period==="custom"&&<div style={{display:"flex",gap:6,alignItems:"center",flexBasis:"100%"}}><input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} className="mono" style={{flex:1,fontSize:12,padding:"7px 8px"}}/><span style={{color:S.td,fontSize:11}}>a</span><input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} className="mono" style={{flex:1,fontSize:12,padding:"7px 8px"}}/></div>}
    </div>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando...</p>}
    {!lo&&filter==="pending"&&<>{overdue.length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"0 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.dng}}>⚠️ Atrasadas ({overdue.length})</span></div>{overdue.map(renderTask)}</>}
      {todayT.filter(t=>!t.done).length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"14px 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.gold}}>📌 Hoje ({todayT.filter(t=>!t.done).length})</span></div>{todayT.filter(t=>!t.done).map(renderTask)}</>}
      {futureT.length>0&&<><div style={{display:"flex",alignItems:"center",gap:9,margin:"14px 4px 12px"}}><span style={{fontSize:13,fontWeight:700,color:S.pl}}>🗓️ Próximas ({futureT.length})</span></div>{futureT.map(renderTask)}</>}</>}
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
