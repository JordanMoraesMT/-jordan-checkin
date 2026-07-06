// TeamCheck — aba EquipeTab
import { useState, useEffect } from "react";
import { toLocalDate, todayLocal, geoEstimate, S, fT, fD, mins, hrsMin, hav, DASH, csv, getBase, getEnd } from "../lib";
import { LB, Kpi, DateField } from "../components";

function EquipeTab({sel,setSel,token,plocs,orgs,dayBases}){
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[routeKm,setRouteKm]=useState(null);const[err,setErr]=useState("");
  const getCoord=(oid)=>{if(plocs[oid])return[plocs[oid].lat,plocs[oid].lng];const o=orgs.find(x=>x.id===oid);if(o){const g=geoEstimate(o);if(g)return g;}return null;};
  const load=async()=>{setLo(true);setRouteKm(null);setErr("");try{
    // FIX: use both createdDateGt AND createdDateLt for EXACT day
    const dtStart=sel+"T00:00:00Z";
    const nextDay=new Date(sel+"T12:00:00");nextDay.setDate(nextDay.getDate()+1);
    const dtEnd=toLocalDate(nextDay)+"T00:00:00Z";
    setErr("Buscando...");
    const r=await fetch(`${DASH}/api/crm/atividades?user_id=743347&desde=${sel}&limit=2000`,{headers:{"X-Session":token},cache:"no-store"});
    const d=await r.json();const all=(d&&d.atividades)||[];
    // visita REGISTRADA do dia = tipo Visita, sem prazo, criada em 'sel'
    const visitas=all.filter(t=>(t.tipo==="Visita"||t.tipo==="VISITA")&&!t.due_em&&(t.criado_em||"").slice(0,10)===sel);
    const seen=new Set();const deduped=[];
    for(const t of visitas){const key=(t.org_id||"")+"|"+(t.criado_em||"").slice(0,10);if(seen.has(key))continue;seen.add(key);deduped.push(t);}
    const alisson=deduped.map(t=>({type:t.tipo||"?",org:t.org_nome||"?",orgId:t.org_id,text:t.texto||"",time:t.criado_em,done:t.concluida}));
    setTasks(alisson);setErr(`${alisson.length} visitas`);
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:S.txt}}>Produtividade — Alisson Henrique</div>
        {err&&<div style={{fontSize:12,color:err.startsWith("ERRO")?S.dng:S.ts,marginTop:2}}>{err}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <DateField value={sel} onChange={setSel} today={todayLocal()} placeholder="Data" style={{width:170}}/>
        <button onClick={load} disabled={lo} style={{background:"var(--chrome)",color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:500}}>{lo?"Carregando...":"Atualizar"}</button>
      </div>
    </div>
    {tasks.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
      <Kpi k="Atividades" v={tasks.length}/>
      <Kpi k="Visitas" v={visitTasks.length}/>
      <Kpi k="Início" v={firstTime?fT(firstTime):"-"}/>
      <Kpi k="Jornada" v={hrsMin(workH)}/>
      <Kpi k="Km estimado" v={routeKm!=null?routeKm.toFixed(1):"-"} u={routeKm!=null?"km":""}/>
      <Kpi k="Localização" v={`${withGps}📍 ${withEst-withGps}🏙️`}/>
    </div>}
    {tasks.length>0&&<button onClick={()=>{const rows=[["Data","Hora","Cliente","Tipo","Observação","GPS"]];tasks.forEach(t=>rows.push([fD(t.time),fT(t.time),t.org,t.type,t.text.slice(0,80),plocs[t.orgId]?"Sim":"Nao"]));rows.push([],["Km estimado",routeKm!=null?routeKm.toFixed(1):"-"],["Jornada",hrsMin(workH)],["Visitas",visitTasks.length]);csv(rows,`alisson-${sel}.csv`);}} style={{width:"100%",marginBottom:16,padding:10,fontSize:12.5,fontWeight:500,background:"transparent",border:`1px solid ${S.inpBdr}`,color:S.pl,borderRadius:8}}>📊 Exportar relatório do Alisson</button>}
    {!lo&&!tasks.length&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma atividade nesta data</p>}
    {tasks.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"18px 20px"}}>
      <div style={{fontSize:14,fontWeight:600,color:S.txt,marginBottom:12}}>Rota do dia</div>
      <div style={{position:"relative",paddingLeft:4}}>
        <div style={{position:"absolute",left:15,top:18,bottom:18,width:2,background:S.brd}}/>
        {tasks.sort((a,b)=>a.time.localeCompare(b.time)).map((t,i)=><div key={i} style={{position:"relative",display:"flex",gap:12,padding:"10px 2px"}}>
          <div style={{position:"relative",zIndex:1,width:24,height:24,borderRadius:"50%",background:plocs[t.orgId]?"var(--chrome)":S.cl,color:plocs[t.orgId]?"#fff":S.td,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 0 3px var(--card-solid)"}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10}}>
              <span style={{fontSize:13.5,fontWeight:600,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</span>
              <span className="mono" style={{fontSize:11.5,color:S.td,flexShrink:0}}>{fT(t.time)}</span>
            </div>
            <p style={{fontSize:12,color:S.ts,margin:"3px 0 0",lineHeight:1.5,wordBreak:"break-word"}}>{t.type} — {t.text}</p>
          </div>
        </div>)}
      </div>
    </div>}
  </div>);}

export { EquipeTab };
