// TeamCheck — aba RotasTab
import { useState, useEffect, useMemo } from "react";
import { LUNCH_START, LUNCH_END, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hourDec, roadKm, getBase, getEnd, isRealVisit, getVCoord, getVEndCoord, DASH, hav } from "../lib";
import { Kpi, DateField, SegTabs } from "../components";
import { PlanejarRota } from "./PlanejarRota";

// v68: Rotas tem duas visões — PLANEJAR (montar o roteiro) e REALIZADO (o que foi feito no dia)
function RotasTab(props){
  const[modo,setModo]=useState(()=>{try{return localStorage.getItem("jc:rotasModo")||"planejar";}catch{return "planejar";}});
  useEffect(()=>{try{localStorage.setItem("jc:rotasModo",modo);}catch{}},[modo]);
  return(<div>
    <div style={{maxWidth:320,marginBottom:16}}><SegTabs items={[["planejar","Planejar"],["realizado","Realizado"]]} value={modo} onChange={setModo} size={12.5}/></div>
    {modo==="planejar"
      ?<PlanejarRota orgs={props.orgs||[]} plocs={props.plocs} visits={props.visits} rfv={props.rfv} user={props.user} token={props.token} onOpenFicha={props.onOpenFicha} pendMapa={props.pendMapa}/>
      :<RotasRealizado {...props}/>}
  </div>);
}

// v79: planejado (visitas agendadas para o dia) × realizado (check-outs do dia)
function PlanejadoRealizado({token,user,sel,dvAll,plocs}){
  const[tar,setTar]=useState(null);
  useEffect(()=>{if(!token||!sel)return;let vivo=true;setTar(null);
    fetch(`${DASH}/api/crm/tarefas?desde=${sel}&ate=${encodeURIComponent(sel+"T23:59:59-04:00")}&limit=500`,{headers:{"X-Session":token},cache:"no-store"}).then(r=>r.json())
      .then(d=>{if(vivo)setTar((d&&d.tarefas)||[]);}).catch(()=>{if(vivo)setTar([]);});return()=>{vivo=false;};},[token,sel]);
  const nrm=s=>String(s||"").toLowerCase().trim();
  const plan=useMemo(()=>(tar||[]).filter(t=>t.type==="VISITA"&&t.due&&String(t.due).slice(0,10)===sel&&(String(t.userId||"")===String(user?.id)||nrm(t.userName)===nrm(user?.name))).sort((a,b)=>String(a.due).localeCompare(String(b.due))),[tar,sel,user]);
  if(!plan.length)return null;
  const feitosIds=new Set(dvAll.map(v=>String(v.orgId)));const planIds=new Set(plan.map(t=>String(t.orgId)));
  const feitas=plan.filter(t=>feitosIds.has(String(t.orgId))),puladas=plan.filter(t=>!feitosIds.has(String(t.orgId)));
  const esc=v=>/JORDAN REPRESENTA/i.test(v.orgName||"");// check-out no escritório não é visita
  const extras=[];const vistos=new Set();dvAll.forEach(v=>{const k=String(v.orgId);if(!esc(v)&&!planIds.has(k)&&!vistos.has(k)){vistos.add(k);extras.push(v);}});
  const kmDe=pts=>{let k=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(a&&b)k+=hav(a.lat,a.lng,b.lat,b.lng)*1.3;}return k;};
  const kmPlan=kmDe(plan.map(t=>plocs?.[t.orgId]).filter(Boolean));const kmReal=kmDe(dvAll.filter(v=>!esc(v)).map(v=>getVCoord(v,plocs)).filter(Boolean));
  const hora=d=>{const t=String(d||"");const m=t.match(/T(\d\d:\d\d)/)||t.match(/ (\d\d:\d\d)/);return m?m[1]:"";};
  const linha=(nome,sub,cor,txt)=>(<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:`1px solid ${S.brd}`}}><span style={{width:8,height:8,borderRadius:4,background:cor,flexShrink:0}}/><span style={{flex:1,minWidth:0,fontSize:13.5,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nome}</span><span className="num" style={{fontSize:12,color:S.ts}}>{sub}</span><span style={{fontSize:12.5,fontWeight:600,color:cor,width:70,textAlign:"right"}}>{txt}</span></div>);
  return(<section aria-label="Planejado e realizado" style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:8}}>
      <h3 style={{margin:0,fontSize:15,fontWeight:700,color:S.txt}}>Planejado × realizado</h3>
      <span className="num" style={{fontSize:12.5,color:S.ts}}>{feitas.length} de {plan.length} feitas ({Math.round(feitas.length/plan.length*100)}%) · {extras.length} fora do plano · km {Math.round(kmPlan)} → {Math.round(kmReal)} (linha reta ×1,3)</span>
    </div>
    {plan.map(t=>linha(t.org,hora(t.due),feitosIds.has(String(t.orgId))?S.ok:S.dng,feitosIds.has(String(t.orgId))?"Feita":"Pulada"))}
    {extras.map(v=>linha(v.orgName,fT(v.checkinTime),S.gold,"Extra"))}
  </section>);
}

function RotasRealizado({sel,setSel,visits,dayBases,user,plocs,token}){
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
  const dayMarks=useMemo(()=>{const m={};visits.forEach(v=>{if(isRealVisit(v)&&(!v.userName||v.userName===user?.name))m[toLocalDate(v.checkinTime)]=S.acc;});return m;},[visits,user?.name]);// v41: pontinhos nos dias com visita
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,flexWrap:"wrap"}}>
      <DateField value={sel} onChange={d=>setSel(d||todayLocal())} today={todayLocal()} marks={dayMarks} placeholder="Escolher dia" style={{minWidth:220}}/>
      {startBase&&<span style={{fontSize:12.5,color:S.ts}}>Origem: <b style={{color:S.t2}}>{startBase.label||"Casa"}</b>{endBase&&endBase!==startBase?<> · Destino: <b style={{color:S.t2}}>{endBase.label||"Casa"}</b></>:""}</span>}
    </div>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
      <Kpi k="Km" v={totKm.toFixed(1)} u="km"/>
      <Kpi k="Jornada" v={hrsMin(workH)}/>
      <Kpi k="Visitas" v={dv.length}/>
      <Kpi k="Trechos de base" v={routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0).toFixed(1)} u="km"/>
    </div>}
    <PlanejadoRealizado token={token} user={user} sel={sel} dvAll={dvAll} plocs={plocs}/>
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
