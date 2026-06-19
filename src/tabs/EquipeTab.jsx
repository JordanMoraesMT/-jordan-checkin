// TeamCheck — aba EquipeTab
import { useState, useEffect } from "react";
import { toLocalDate, geoEstimate, S, fT, fD, mins, hrsMin, hav, agF, csv, getBase, getEnd } from "../lib";
import { LB } from "../components";

function EquipeTab({sel,setSel,token,plocs,orgs,dayBases}){
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[routeKm,setRouteKm]=useState(null);const[err,setErr]=useState("");
  const getCoord=(oid)=>{if(plocs[oid])return[plocs[oid].lat,plocs[oid].lng];const o=orgs.find(x=>x.id===oid);if(o){const g=geoEstimate(o);if(g)return g;}return null;};
  const load=async()=>{setLo(true);setRouteKm(null);setErr("");try{
    // FIX: use both createdDateGt AND createdDateLt for EXACT day
    const dtStart=sel+"T00:00:00Z";
    const nextDay=new Date(sel+"T12:00:00");nextDay.setDate(nextDay.getDate()+1);
    const dtEnd=toLocalDate(nextDay)+"T00:00:00Z";
    setErr("Buscando...");
    const d=await agF(`/tasks?createdDateGt=${dtStart}&createdDateLt=${dtEnd}&per_page=100`,token);
    const all=d.data||[];
    // FIX: only Visita activities (no due_date = visit log, not scheduled task)
    const visitas=all.filter(t=>t.user?.id===743347&&(t.type==="Visita"||t.type==="VISITA")&&!t.due_date&&!t.dueDate);
    // DEDUP: max 1 per orgId+date (eliminates checkout+next-step duplicates)
    const seen=new Set();const deduped=[];
    for(const t of visitas){const key=t.organization?.id+"|"+t.createdAt?.slice(0,10);if(seen.has(key))continue;seen.add(key);deduped.push(t);}
    const alisson=deduped.map(t=>({type:t.type||"?",org:t.organization?.name||"?",orgId:t.organization?.id,text:t.text||"",time:t.createdAt,done:t.done}));
    setTasks(alisson);setErr(`${alisson.length} visitas (${all.length} total)`);
    if(alisson.length>=1){const sorted=[...alisson].sort((a,b)=>a.time.localeCompare(b.time));let km=0;const startB=getBase(dayBases,sel,743347);const endB=getEnd(dayBases,sel,743347);const fc=getCoord(sorted[0].orgId),lc=getCoord(sorted[sorted.length-1].orgId);
      if(startB&&fc)km+=hav(startB.lat,startB.lng,fc[0],fc[1])*1.3;
      for(let i=0;i<sorted.length-1;i++){
        if(sorted[i].orgId===sorted[i+1].orgId)continue;
        const a=getCoord(sorted[i].orgId),b=getCoord(sorted[i+1].orgId);if(a&&b)km+=hav(a[0],a[1],b[0],b[1])*1.3;}
      if(endB&&lc)km+=hav(lc[0],lc[1],endB.lat,endB.lng)*1.3;
      setRouteKm(km);}
  }catch(e){setErr("ERRO: "+e.message);}setLo(false);};
  useEffect(()=>{load();},[sel]);
  const visitTasks=tasks.filter(t=>t.type==="Visita"||t.type==="VISITA");
  const firstTime=tasks.length?tasks.reduce((m,t)=>t.time<m?t.time:m,tasks[0].time):null;
  const lastTime=tasks.length?tasks.reduce((m,t)=>t.time>m?t.time:m,tasks[0].time):null;
  const workH=firstTime&&lastTime?Math.max(0,mins(firstTime,lastTime)-60):0;
  const withGps=tasks.filter(t=>plocs[t.orgId]).length;const withEst=tasks.filter(t=>getCoord(t.orgId)).length;
  return(<div>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px"}}>Produtividade — Alisson Henrique</p>
    <LB t="DATA"><input type="date" value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:8}}/></LB>
    <button onClick={load} disabled={lo} style={{width:"100%",marginBottom:8,padding:12,background:S.pri,border:"none",fontWeight:500}}>{lo?"Carregando...":"Atualizar"}</button>
    {err&&<p style={{fontSize:11,color:err.startsWith("ERRO")?S.dng:S.acc,margin:"0 0 12px",padding:"6px 10px",background:S.cl,borderRadius:6}}>{err}</p>}
    {tasks.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      {[["Atividades",tasks.length],["Visitas",visitTasks.length],["Inicio",firstTime?fT(firstTime):"-"],["Jornada",hrsMin(workH)],["Km estimado",routeKm!=null?routeKm.toFixed(1):"-"],["Localização",`${withGps}📍 ${withEst-withGps}🏙️`]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}
    </div>}
    {tasks.length>0&&<button onClick={()=>{const rows=[["Data","Hora","Cliente","Tipo","Observação","GPS"]];tasks.forEach(t=>rows.push([fD(t.time),fT(t.time),t.org,t.type,t.text.slice(0,80),plocs[t.orgId]?"Sim":"Nao"]));rows.push([],["Km estimado",routeKm!=null?routeKm.toFixed(1):"-"],["Jornada",hrsMin(workH)],["Visitas",visitTasks.length]);csv(rows,`alisson-${sel}.csv`);}} style={{width:"100%",marginBottom:14,padding:10,fontSize:12,background:S.pri+"22",border:`1px solid ${S.pri}55`,color:S.pl}}>📊 Exportar relatório Alisson</button>}
    {!lo&&!tasks.length&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma atividade nesta data</p>}
    {tasks.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${S.brd}`}}><p style={{fontWeight:500,margin:0,fontSize:13}}>Rota do dia</p></div>
      {tasks.sort((a,b)=>a.time.localeCompare(b.time)).map((t,i)=><div key={i} style={{padding:"10px 14px",borderBottom:i<tasks.length-1?`1px solid ${S.brd}`:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:plocs[t.orgId]?S.acc+"33":S.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:600,color:plocs[t.orgId]?S.acc:S.td}}>{i+1}</span></div>
            <p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</p>
          </div>
          <span style={{fontSize:11,color:S.ts,flexShrink:0,marginLeft:8}}>{fT(t.time)}</span>
        </div>
        <p style={{fontSize:11,color:S.ts,margin:"2px 0 0 30px",wordBreak:"break-word"}}>{t.type} — {t.text}</p>
      </div>)}
    </div>}
  </div>);}

export { EquipeTab };
