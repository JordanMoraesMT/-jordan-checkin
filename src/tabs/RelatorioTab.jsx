// TeamCheck — aba RelatorioTab
import { useState, useMemo } from "react";
import { HOMES, toLocalDate, todayLocal, USERS, S, fT, fD, fDS, mins, hrsMin, hav, csv, getBase, getEnd, getVCoord, getVEndCoord } from "../lib";
import { BaseEditInline } from "../components";

function RelatorioTab({visits,dayBases,user,token,plocs,onEditBase}){
  const[sd,setSd]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return toLocalDate(d);});
  const[ed,setEd]=useState(todayLocal());
  const[selUser,setSelUser]=useState("me");
  const[editDay,setEditDay]=useState(null);
  const otherId=user.id===743088?743347:743088;
  const repUserId=selUser==="me"?user.id:otherId;
  const repUserName=selUser==="me"?user.name:(USERS.find(u=>u.id===otherId)?.n||"Alisson");
  // DEFINITIVE: Use SAME visits array for both modes (KV-synced, single source of truth)
  // Filter by userName to separate Jordan's visits from Alisson's
  const pvAll=useMemo(()=>{
    const filtered=visits.filter(v=>{
      if(!v.checkoutTime)return false;
      if(v.taskType&&v.taskType!=="VISITA")return false;
      if(selUser==="me"&&v.userName&&v.userName!==user.name)return false;
      if(selUser==="team"&&v.userName!==repUserName)return false;
      const d=toLocalDate(v.checkinTime);
      return d>=sd&&d<=ed;
    });
    const map=new Map();
    for(const v of filtered){
      const key=v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime);
      const existing=map.get(key);
      if(!existing){map.set(key,v);continue;}
      const exDur=new Date(existing.checkoutTime)-new Date(existing.checkinTime);
      const vDur=new Date(v.checkoutTime)-new Date(v.checkinTime);
      if(vDur>exDur)map.set(key,v);
    }
    return Array.from(map.values()).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
  },[visits,sd,ed,selUser,user.name,repUserName]);
  // pv = only VALID visits (used for counts, km, jornada)
  const pv=useMemo(()=>pvAll.filter(v=>!v.divergent),[pvAll]);
  // bdAll = grouped by day including divergent (for visual display with ⚠️ flag)
  const bdAll=useMemo(()=>{const m={};pvAll.forEach(v=>{const k=toLocalDate(v.checkinTime);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pvAll]);
  const bd=useMemo(()=>{const m={};pv.forEach(v=>{const k=toLocalDate(v.checkinTime);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pv]);
  // FIX: when team, check for admin-set base (keyed as "userId_date"), fallback to team home
  const getRepBase=(dt)=>{if(selUser==="team"){const k=repUserId+"_"+dt;if(dayBases[k]?.start)return dayBases[k].start;if(dayBases[k])return dayBases[k];return HOMES[repUserId]||null;}return getBase(dayBases,dt,repUserId);};
  const getRepEnd=(dt)=>{if(selUser==="team"){const k=repUserId+"_"+dt;if(dayBases[k]?.end)return dayBases[k].end;return getRepBase(dt);}return getEnd(dayBases,dt,repUserId);};
  // FIX: use repUserId (correct user) for base resolution
  const calcDayKm=(dvs,dt)=>{if(!dvs?.length)return 0;let km=0;const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
    const b2=getRepBase(dt);const eb=getRepEnd(dt);
    const fc=getVCoord(s[0],plocs);
    if(b2&&fc)km+=hav(b2.lat,b2.lng,fc.lat,fc.lng)*1.3;
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId)continue;const ca=getVEndCoord(s[i-1],plocs);const cb=getVCoord(s[i],plocs);if(ca&&cb)km+=hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3;}
    const l=s[s.length-1];const endB=eb||b2;const lc=getVEndCoord(l,plocs);
    if(endB&&lc)km+=hav(lc.lat,lc.lng,endB.lat,endB.lng)*1.3;
    return km;};
  // FIX: calculate km segments for detailed export
  const calcSegKm=(dvs,dt)=>{if(!dvs?.length)return[];const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
    const b2=getRepBase(dt);const eb=getRepEnd(dt);
    const segs=[];const fc=getVCoord(s[0],plocs);
    segs.push(b2&&fc?hav(b2.lat,b2.lng,fc.lat,fc.lng)*1.3:0);// first: base→pdv
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId){segs.push(0);continue;}
      const ca=getVEndCoord(s[i-1],plocs);const cb=getVCoord(s[i],plocs);
      segs.push(ca&&cb?hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3:0);}
    return segs;};
  const totKm=useMemo(()=>bd.reduce((acc,[dt,dvs])=>acc+calcDayKm(dvs,dt),0),[bd,dayBases,plocs,repUserId]);
  const workH=bd.reduce((s,[,d])=>{if(!d||!d.length)return s;const sr=[...d].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));if(!sr[0]?.checkinTime||!sr[sr.length-1]?.checkoutTime)return s;const raw=mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime);return s+Math.max(0,raw-60);},0);
  const mx=Math.max(1,...bd.map(([,v])=>v.length));
    const firstCheckin=pv.length&&pv[0]?.checkinTime?fT(pv[0].checkinTime):"-";
    const lastCheckout=pv.length&&pv[pv.length-1]?.checkoutTime?fT(pv[pv.length-1].checkoutTime):"-";
    return(<div>
    {user?.id===743088&&<div style={{display:"flex",gap:4,marginBottom:8}}><button onClick={()=>setSelUser("me")} style={{flex:1,padding:8,fontSize:12,border:selUser==="me"?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:selUser==="me"?S.pri+"22":"transparent",color:selUser==="me"?S.pri:S.ts,fontWeight:selUser==="me"?600:400}}>Meus dados</button><button onClick={()=>setSelUser("team")} style={{flex:1,padding:8,fontSize:12,border:selUser==="team"?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:selUser==="team"?S.acc+"22":"transparent",color:selUser==="team"?S.acc:S.ts,fontWeight:selUser==="team"?600:400}}>Alisson Henrique</button></div>}
    <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}><input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{flex:1,fontSize:12}}/><span style={{color:S.td}}>ate</span><input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{flex:1,fontSize:12}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>{[["Visitas",pv.length],["Dias",bd.length],["Jornada",hrsMin(workH)],["Km",totKm.toFixed(0)],["1º Check-in",firstCheckin],["Último",lastCheckout]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:16,fontWeight:600,margin:0}}>{v}</p></div>)}</div>
    {bd.length>0&&(selUser==="me"||user?.id===743088)&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
      <p style={{fontWeight:500,fontSize:12,margin:"0 0 8px",color:S.ts}}>Origem / Destino {selUser==="team"?"(Alisson)":""} por dia (toque para corrigir)</p>
      {bd.map(([dt])=>{const sb=getRepBase(dt);const eb=getRepEnd(dt);return(
        <div key={dt} onClick={()=>setEditDay(editDay===dt?null:dt)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${S.brd}`,cursor:"pointer"}}>
          <span style={{fontSize:11,color:S.ts}}>{fDS(dt+"T12:00")}</span>
          <span style={{fontSize:11,color:S.pl}}>{sb?.label||"Casa"} → {eb?.label||"Casa"}</span>
          <span style={{fontSize:10,color:S.acc}}>✏️</span>
        </div>);})}
    </div>}
    {editDay&&<BaseEditInline day={editDay} dayBases={dayBases} userId={repUserId} dayKey={selUser==="team"?repUserId+"_"+editDay:editDay} plocs={plocs} lastVisitCoord={bd.find(([d])=>d===editDay)?getVEndCoord([...bd.find(([d])=>d===editDay)[1]].sort((a,b)=>new Date(b.checkinTime)-new Date(a.checkinTime))[0],plocs):null} onSave={(d,start,end)=>{onEditBase(d,start,end,selUser==="team"?repUserId:null);setEditDay(null);}} onCancel={()=>setEditDay(null)}/>}
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {/* FIX: Export with correct user name and bases */}
      <button onClick={()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km","Jornada","Clientes"]];bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));if(!sr.length)return;const b2=getRepBase(dt);const eb=getRepEnd(dt);const dk=calcDayKm(dvs,dt);rows.push([fD(dt+"T12:00"),repUserName,b2?.label||"Casa",eb?.label||"Casa",dvs.length,dk.toFixed(1),hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)),dvs.map(v=>v.orgName).join(", ")]);});rows.push([],["TOTAL","","","",pv.length,totKm.toFixed(1),hrsMin(workH),""]);csv(rows,`km-${repUserName}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:11}}>Exportar Resumo</button>
      {/* FIX: Detailed export with Km column */}
      <button onClick={()=>{const rows=[["Data","In","Out","Min","Cliente","Cidade","Km Trecho","Tipo","Obs","Venda"]];
        bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const segs=calcSegKm(sr,dt);const b2=getRepBase(dt);const eb=getRepEnd(dt);
          sr.forEach((v,i)=>{const segKm=segs[i]||0;
            rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",segKm>0?segKm.toFixed(1):"0",v.taskType||"VISITA",v.note||"",v.sale?`${v.sale.brand} R$${v.sale.value}`:""])});
          const last=sr[sr.length-1];const lc=getVEndCoord(last,plocs);const endB=eb||b2;
          if(endB&&lc){const retKm=hav(lc.lat,lc.lng,endB.lat,endB.lng)*1.3;rows.push([fD(dt+"T12:00"),"","","","→ "+(endB?.label||"Casa"),"",retKm.toFixed(1),"RETORNO","",""]);}
        });
        csv(rows,`visitas-${repUserName}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:11}}>Exportar Detalhado</button>
    </div>
    {bd.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <p style={{fontWeight:500,marginBottom:8,fontSize:13}}>Visitas/dia</p>
      {bd.map(([dt,dvs])=>{
        const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
        const sb=getRepBase(dt);const eb=getRepEnd(dt);
        // Build waypoints from GPS
        const waypoints=sr.map(v=>getVCoord(v,plocs)).filter(Boolean);
        const uniqueWP=[];const seenOrg=new Set();
        sr.forEach(v=>{const c=getVCoord(v,plocs);if(c&&!seenOrg.has(v.orgId)){uniqueWP.push(c);seenOrg.add(v.orgId);}});
        const hasRoute=uniqueWP.length>0&&sb;
        const mapsUrl=hasRoute?`https://www.google.com/maps/dir/${sb.lat},${sb.lng}/${uniqueWP.map(w=>`${w.lat},${w.lng}`).join("/")}${eb?`/${eb.lat},${eb.lng}`:""}`:"";
        const dayKm=calcDayKm(dvs,dt);
        return(<div key={dt} style={{marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${S.brd}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:11,color:S.ts,width:42,textAlign:"right",flexShrink:0}}>{fDS(dt+"T12:00")}</span>
            <div style={{flex:1,height:14,background:S.bg,borderRadius:3}}><div style={{height:"100%",width:`${(dvs.length/mx)*100}%`,background:S.pri,borderRadius:3,minWidth:3}}/></div>
            <span style={{fontSize:11,fontWeight:600,width:16,textAlign:"right",flexShrink:0}}>{dvs.length}</span>
          </div>
          <div style={{display:"flex",gap:4,marginLeft:48}}>
            <span style={{fontSize:10,color:S.acc,fontWeight:500}}>{sr[0]?fT(sr[0].checkinTime):"-"}</span>
            <span style={{fontSize:10,color:S.ts}}>{dayKm>0?`· ${dayKm.toFixed(0)}km`:""} · {sr.length>=1?hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)):"-"}</span>
            {hasRoute&&<a href={mapsUrl} target="_blank" rel="noopener" style={{fontSize:10,color:S.acc,textDecoration:"none",fontWeight:600,marginLeft:"auto"}}>📍 Ver Rota</a>}
          </div>
          {/* Rota detalhada do dia */}
          <div style={{marginLeft:48,marginTop:4}}>
            {sb&&<span style={{fontSize:9,color:S.td,display:"block"}}>{sb.label||"Casa"} →</span>}
            {sr.map((v,i)=>{const c=getVCoord(v,plocs);const samePrev=i>0&&v.orgId===sr[i-1].orgId;
              return !samePrev&&<span key={i} style={{fontSize:9,color:c?S.pl:S.td,display:"inline"}}>{i>0?" → ":""}{v.orgName}{!c?" ⚠️":""}</span>;
            })}
            {eb&&<span style={{fontSize:9,color:S.td}}> → {eb.label||"Casa"}</span>}
          </div>
        </div>);
      })}
    </div>}
  </div>);}

export { RelatorioTab };
