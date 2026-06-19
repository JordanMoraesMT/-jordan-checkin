// TeamCheck — aba RotasTab
import { useState, useEffect, useMemo } from "react";
import { LUNCH_START, LUNCH_END, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hourDec, roadKm, getBase, getEnd, isRealVisit, getVCoord, getVEndCoord } from "../lib";

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
  return(<div><select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:12}}><option value={todayLocal()}>Hoje — {fD(new Date())}</option>{days.filter(d=>d!==todayLocal()).map(d=><option key={d} value={d}>{fD(d+"T12:00")}</option>)}</select>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[["Km",totKm.toFixed(1)],["Jornada",hrsMin(workH)],["Visitas",dv.length],["Base",routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0).toFixed(1)+" km"]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}</div>}
    {startBase&&<p style={{fontSize:10,color:S.ts,margin:"0 0 4px"}}>Origem: {startBase.label||"Casa"} {endBase&&endBase!==startBase?`| Destino: ${endBase.label||"Casa"}`:""}</p>}
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}{!dvAll.length&&!lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita</p>}
    {dvAll.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>{routes.find(r=>r.tp==="bs")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>{startBase?.label||"Casa"} → 1º PDV: {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</span></div>}{dvAll.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}><div style={{padding:"10px 14px",display:"flex",gap:10,background:v.divergent?S.dng+"18":"transparent"}}><div style={{width:22,height:22,borderRadius:"50%",background:v.divergent?S.dng+"33":S.pri+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:600,color:v.divergent?S.dng:S.pl}}>{v.divergent?"⚠️":i+1}</span></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}{v.divergent&&<span style={{fontSize:10,color:S.dng,marginLeft:6}}>(deslocado {v.divDist}m)</span>}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{fT(v.checkinTime)}→{fT(v.checkoutTime)} {hrsMin(mins(v.checkinTime,v.checkoutTime))}{v.divergent?" · não contabilizada":""}</p></div></div>{seg&&<div style={{padding:"3px 14px 3px 46px",background:seg.tp==="lch"?S.gold+"15":S.bg}}><span style={{fontSize:11,color:seg.tp==="lch"?S.gold:S.td}}>{seg.tp==="lch"?"Almoco ":"↓ "}{seg.km.toFixed(1)}km</span></div>}</div>);})}
      {routes.find(r=>r.tp==="be")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Ultimo → {endBase?.label||"Casa"}: {routes.find(r=>r.tp==="be").km.toFixed(1)} km</span></div>}
      <div style={{padding:"10px 14px",borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"space-between"}}><span style={{color:S.ts}}>Total</span><span style={{fontSize:15,fontWeight:600,color:S.pl}}>{totKm.toFixed(1)} km</span></div>
      {startBase&&dv.length>0&&<a href={`https://www.google.com/maps/dir/${startBase.lat},${startBase.lng}/${dv.map(v=>`${v.lat},${v.lng}`).join("/")}/${(endBase||startBase).lat},${(endBase||startBase).lng}`} target="_blank" rel="noopener" style={{display:"block",padding:"10px",background:S.acc+"22",textAlign:"center",textDecoration:"none",color:S.acc,fontWeight:500,fontSize:13}}>Abrir no Google Maps</a>}
    </div>}</div>);}

export { RotasTab };
