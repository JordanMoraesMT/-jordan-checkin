// TeamCheck — aba RotasTab
import { useState, useEffect, useMemo } from "react";
import { LUNCH_START, LUNCH_END, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hourDec, roadKm, getBase, getEnd, isRealVisit, getVCoord, getVEndCoord } from "../lib";
import { Kpi } from "../components";

function RotasTab({sel,setSel,visits,dayBases,user,plocs}){
  const[routes,setRoutes]=useState([]);const[lo,setLo]=useState(false);
  const startBase=getBase(dayBases,sel,user?.id);
  const endBase=getEnd(dayBases,sel,user?.id);
  // FIX: only real visits from current user
  const dvAll=useMemo(()=>{
    const t=new Date(sel+"T12:00:00").toDateString();
    return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime&&(!v.taskType||v.taskType==="VISITA")&&(!v.userName||v.userName===user?.name))
      .sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
  },[visits,sel,user?.name]);
  const dv=useMemo(()=>dvAll.filter(v=>!v.divergent),[dvAll]);
  useEffect(()=>{if(!dv.length){setRoutes([]);return;}let c=false;setLo(true);(async()=>{const s=[];
    const fc=getVCoord(dv[0],plocs);
    // Start base → first PDV
    if(startBase&&fc)s.push({f:startBase.label||"Base",t:dv[0].orgName,tp:"bs",...await roadKm(startBase.lat,startBase.lng,fc.lat,fc.lng)});
    // Between PDVs — skip same orgId consecutive
    for(let i=0;i<dv.length-1;i++){const a=dv[i],b=dv[i+1];
      if(a.orgId===b.orgId)continue;
      const ca=getVEndCoord(a,plocs),cb=getVCoord(b,plocs);
      if(ca&&cb)s.push({f:a.orgName,t:b.orgName,tp:hourDec(a.checkoutTime)>=LUNCH_START&&hourDec(b.checkinTime)<=LUNCH_END+1?"lch":"tr",...await roadKm(ca.lat,ca.lng,cb.lat,cb.lng)});}
    // Last PDV → end base
    const last=dv[dv.length-1];const eb=endBase||startBase;
    const lc=getVEndCoord(last,plocs);
    if(eb&&lc)s.push({f:last.orgName,t:eb.label||"Base",tp:"be",...await roadKm(lc.lat,lc.lng,eb.lat,eb.lng)});
    if(!c){setRoutes(s);setLo(false);}})();return()=>{c=true;};},[dv,startBase,endBase,plocs]);
  const totKm=routes.reduce((s,r)=>s+r.km,0);
  // FIX: Jornada = primeiro check-in ao último check-out
  const workH=dv.length?mins(dv[0].checkinTime,dv[dv.length-1].checkoutTime):0;
  const days=[...new Set(visits.filter(v=>isRealVisit(v)&&(!v.userName||v.userName===user?.name)).map(v=>toLocalDate(v.checkinTime)))].sort().reverse().slice(0,30);
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{fontSize:13.5,fontWeight:600,padding:"10px 14px",borderRadius:9,minWidth:220}}><option value={todayLocal()}>Hoje — {fD(new Date())}</option>{days.filter(d=>d!==todayLocal()).map(d=><option key={d} value={d}>{fD(d+"T12:00")}</option>)}</select>
      {startBase&&<span style={{fontSize:12.5,color:S.ts}}>Origem: <b style={{color:S.t2}}>{startBase.label||"Casa"}</b>{endBase&&endBase!==startBase?<> · Destino: <b style={{color:S.t2}}>{endBase.label||"Casa"}</b></>:""}</span>}
    </div>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
      <Kpi k="Km" v={totKm.toFixed(1)} u="km"/>
      <Kpi k="Jornada" v={hrsMin(workH)}/>
      <Kpi k="Visitas" v={dv.length}/>
      <Kpi k="Trechos de base" v={routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0).toFixed(1)} u="km"/>
    </div>}
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}{!dvAll.length&&!lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita</p>}
    {dvAll.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"18px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:14,fontWeight:600,color:S.txt}}>Roteiro do dia</span>
        {startBase&&dv.length>0&&<a href={`https://www.google.com/maps/dir/${startBase.lat},${startBase.lng}/${dv.map(v=>`${v.lat},${v.lng}`).join("/")}/${(endBase||startBase).lat},${(endBase||startBase).lng}`} target="_blank" rel="noopener" style={{fontSize:12.5,fontWeight:500,color:S.pl,textDecoration:"none"}}>📍 Abrir no Google Maps</a>}
      </div>
      {routes.find(r=>r.tp==="bs")&&<div style={{fontSize:12,color:S.pl,fontWeight:600,padding:"6px 0 10px",borderBottom:`1px dashed ${S.brd}`,marginBottom:6}}>{startBase?.label||"Casa"} → 1º PDV · {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</div>}
      <div style={{position:"relative",paddingLeft:4}}>
        <div style={{position:"absolute",left:15,top:16,bottom:16,width:2,background:S.brd}}/>
        {dvAll.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}>
          <div style={{position:"relative",display:"flex",alignItems:"center",gap:12,padding:"9px 2px",background:v.divergent?S.dng+"12":"transparent",borderRadius:8}}>
            <div style={{position:"relative",zIndex:1,width:24,height:24,borderRadius:"50%",background:v.divergent?S.dng:"var(--chrome)",color:"#fff",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 0 3px var(--card-solid)"}}>{v.divergent?"!":i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13.5,fontWeight:600,margin:0,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}{v.divergent&&<span style={{fontSize:10,color:S.dng,marginLeft:6,fontWeight:500}}>(deslocado {v.divDist}m)</span>}</p>
              <p className="mono" style={{fontSize:11,color:S.td,margin:"2px 0 0"}}>{fT(v.checkinTime)} → {fT(v.checkoutTime)} · {hrsMin(mins(v.checkinTime,v.checkoutTime))}{v.divergent?" · não contabilizada":""}</p>
            </div>
            {seg&&<span className="mono" style={{fontSize:12,fontWeight:600,color:seg.tp==="lch"?S.gold:S.t2,flexShrink:0}}>{seg.tp==="lch"?"🍽 ":""}{seg.km.toFixed(1)} km</span>}
          </div>
        </div>);})}
      </div>
      {routes.find(r=>r.tp==="be")&&<div style={{fontSize:12,color:S.pl,fontWeight:600,padding:"10px 0 6px",borderTop:`1px dashed ${S.brd}`,marginTop:6}}>Último → {endBase?.label||"Casa"} · {routes.find(r=>r.tp==="be").km.toFixed(1)} km</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:S.cl,borderRadius:10,padding:"12px 16px",marginTop:10}}>
        <span style={{fontSize:13,fontWeight:600,color:S.t2}}>Total percorrido</span>
        <span className="mono" style={{fontSize:18,fontWeight:700,color:S.txt}}>{totKm.toFixed(1)} km</span>
      </div>
    </div>}</div>);}

export { RotasTab };
