import { useState, useEffect, useMemo } from "react";

const API = "https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const HOMES = { 743088:{lat:-15.677694,lng:-55.954778,label:"Casa Jordan"}, 743347:{lat:-15.653611,lng:-56.026833,label:"Casa Alisson"} };
const LUNCH_START=12, LUNCH_END=13;
const TASK_TYPES=[{id:"VISITA",label:"Visita",icon:"📍"},{id:"LIGACAO",label:"Ligação",icon:"📞"},{id:"EMAIL",label:"E-mail",icon:"📧"},{id:"REUNIAO",label:"Reunião",icon:"🤝"},{id:"WHATSAPP",label:"WhatsApp",icon:"💬"},{id:"PROPOSTA",label:"Proposta",icon:"📋"}];
const PAGE_SIZE=20;

// ─── Brand Colors ───
const C={bg:"#0F1B2D",card:"#162236",cardLight:"#1C2E47",primary:"#0578A6",primaryLight:"#0890C2",accent:"#2A9D8F",gold:"#C8964E",danger:"#DC2626",warn:"#D97706",text:"#E8ECF1",textSec:"#8899AB",textDim:"#5A6B7D",border:"#243349",success:"#10B981",white:"#FFFFFF"};

// ─── Helpers ───
const fT=(d)=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fD=(d)=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fDS=(d)=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const fWD=(d)=>new Date(d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin=(m)=>m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m} min`;
const hourDec=(d)=>{const dt=new Date(d);return dt.getHours()+dt.getMinutes()/60;};
const haversine=(lat1,lon1,lat2,lon2)=>{const R=6371,dLat=((lat2-lat1)*Math.PI)/180,dLon=((lon2-lon1)*Math.PI)/180;const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));};
function loadJSON(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v));}
async function roadKm(lat1,lng1,lat2,lng2){try{const r=await fetch(`${OSRM}/${lng1},${lat1};${lng2},${lat2}?overview=false`);const d=await r.json();if(d.code==="Ok"&&d.routes?.[0])return{km:d.routes[0].distance/1000,dur:Math.round(d.routes[0].duration/60)};}catch{}return{km:haversine(lat1,lng1,lat2,lng2)*1.3,dur:0,estimated:true};}
async function agFetch(path,token,opts={}){const clean=path.startsWith("/")?path.slice(1):path;const r=await fetch(`${API}?path=${encodeURIComponent(clean)}`,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
async function fetchOrgs(token){let pg=1,all=[];while(true){const d=await agFetch(`/organizations?page=${pg}&per_page=100`,token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}return all;}
async function postAct(token,orgId,text,type="VISITA",done=true,dueDate=null){const body={text,type,done};if(dueDate)body.due_date=dueDate;return agFetch(`/organizations/${orgId}/tasks`,token,{method:"POST",body:JSON.stringify(body)});}
function getGPS(){return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error("GPS"));navigator.geolocation.getCurrentPosition((p)=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
function exportToCSV(rows,filename){const BOM="\uFEFF";const csv=BOM+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}

// ─── Styled Components ───
const Card=({children,style,...p})=><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,...style}} {...p}>{children}</div>;
const Stat=({icon,label,value,bg})=><div style={{background:bg||C.cardLight,borderRadius:10,padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:11,color:C.textSec}}>{label}</span></div><p style={{fontSize:20,fontWeight:600,margin:0,color:C.text}}>{value}</p></div>;
const Btn=({children,primary,danger,disabled,style,...p})=><button disabled={disabled} style={{padding:"10px 16px",border:primary||danger?"none":`1px solid ${C.border}`,borderRadius:8,background:disabled?C.cardLight:primary?C.primary:danger?C.danger:C.card,color:disabled?C.textDim:C.text,fontWeight:500,cursor:disabled?"default":"pointer",fontSize:13,...style}} {...p}>{children}</button>;

// ─── Login ───
function Login({onLogin}){
  const[tk,setTk]=useState("");const[ld,setLd]=useState(false);const[er,setEr]=useState("");
  const go=async()=>{if(!tk.trim())return;setLd(true);setEr("");try{const d=await agFetch("/users/me",tk.trim());d.data?onLogin(tk.trim(),d.data):setEr("Token invalido.");}catch(e){setEr("Erro: "+e.message);}setLd(false);};
  return(<div style={{padding:"2rem 0",minHeight:"100vh",background:C.bg}}>
    <div style={{textAlign:"center",marginBottom:"2rem"}}>
      <img src="/logo.png" alt="Jordan Representações" style={{height:48,marginBottom:16}}/>
      <h1 style={{fontSize:20,fontWeight:600,margin:"0 0 4px",color:C.text,fontFamily:"'Roboto',sans-serif"}}>Jordan Check-in</h1>
      <p style={{fontSize:13,color:C.textSec,margin:0}}>Inteligência Comercial</p>
    </div>
    <Card style={{padding:"1.25rem",margin:"0 16px"}}>
      <label style={{fontSize:13,color:C.textSec,display:"block",marginBottom:6}}>Token da API Agendor</label>
      <input type="password" value={tk} onChange={e=>setTk(e.target.value)} placeholder="Cole seu token..." style={{width:"100%",boxSizing:"border-box",marginBottom:12,padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,background:C.cardLight,color:C.text}} onKeyDown={e=>e.key==="Enter"&&go()}/>
      <p style={{fontSize:12,color:C.textDim,margin:"0 0 16px"}}>Agendor → Menu → Integrações → Token</p>
      <Btn onClick={go} disabled={ld||!tk.trim()} primary style={{width:"100%",fontSize:15,padding:"12px"}}>{ld?"Conectando...":"Conectar ao Agendor"}</Btn>
      {er&&<p style={{fontSize:13,color:C.danger,margin:"12px 0 0",textAlign:"center"}}>{er}</p>}
    </Card>
  </div>);
}

// ─── Org Card ───
function OrgCard({org,active,onIn,onOut,ldId,pdvLocs}){
  const isA=active?.orgId===org.id;
  const addr=org.address||{};const city=addr.city_name||addr.city||"";const state=addr.state||"";const neighborhood=addr.district||addr.neighborhood||"";
  const savedLoc=pdvLocs[org.id];
  return(<Card style={{padding:"12px 14px",border:isA?`2px solid ${C.primary}`:`1px solid ${C.border}`,background:isA?C.cardLight:C.card}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontWeight:500,fontSize:14,margin:"0 0 3px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{savedLoc&&<span style={{fontSize:10,marginRight:4,color:C.success}}>●</span>}{org.name||org.nickname}</p>
        {org.cnpj&&<p style={{fontSize:11,color:C.textDim,margin:"0 0 2px"}}>CNPJ: {org.cnpj}</p>}
        <p style={{fontSize:11,color:C.textSec,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {[neighborhood,city,state].filter(Boolean).join(" · ")}
        </p>
        {org.category&&<span style={{fontSize:10,color:C.gold,background:C.bg,padding:"2px 6px",borderRadius:4,marginTop:3,display:"inline-block"}}>{org.category}</span>}
      </div>
      {isA?(<Btn onClick={()=>onOut(org)} disabled={ldId===org.id} danger style={{fontSize:12,padding:"6px 14px",whiteSpace:"nowrap"}}>{ldId===org.id?"...":"Check-out"}</Btn>
      ):(<Btn onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} primary={!active} style={{fontSize:12,padding:"6px 14px",whiteSpace:"nowrap",opacity:active?0.4:1}}>{ldId===org.id?"...":"Check-in"}</Btn>)}
    </div>
    {isA&&<p style={{fontSize:12,color:C.primaryLight,margin:"8px 0 0",paddingTop:8,borderTop:`1px solid ${C.border}`}}>Em visita desde {fT(active.checkinTime)}</p>}
  </Card>);
}

// ─── Banner ───
function Banner({v,orgs}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);return(<Card style={{padding:"10px 14px",marginBottom:12,background:C.cardLight,borderColor:C.primary}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:C.success,flexShrink:0}}/><p style={{fontSize:13,fontWeight:500,color:C.primaryLight,margin:0}}>Em visita: {o?.name||o?.nickname}</p></div><p style={{fontSize:12,color:C.textSec,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {el} min</p></Card>);}

// ─── Note Modal ───
function NoteModal({org,onSave,onCancel}){
  const[n,setN]=useState("");const[type,setType]=useState("VISITA");
  const[nextType,setNextType]=useState("VISITA");const[nextDate,setNextDate]=useState("");const[nextTime,setNextTime]=useState("09:00");const[nextDesc,setNextDesc]=useState("");
  const minDate=new Date().toISOString().slice(0,10);const allFilled=n.trim()&&nextDate&&nextDesc.trim();
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50,overflowY:"auto"}}><div style={{background:C.card,borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px",color:C.text}}>Registrar atividade</p>
  <p style={{fontSize:12,color:C.textSec,margin:"0 0 12px"}}>{org?.name||org?.nickname}</p>
  <p style={{fontSize:12,color:C.textSec,margin:"0 0 6px",fontWeight:500}}>O que foi feito?</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>{TASK_TYPES.map(t=>(<button key={t.id} onClick={()=>setType(t.id)} style={{padding:"7px 4px",fontSize:11,border:type===t.id?`2px solid ${C.primary}`:`1px solid ${C.border}`,borderRadius:8,background:type===t.id?C.cardLight:C.bg,color:type===t.id?C.primaryLight:C.textSec,cursor:"pointer",fontWeight:type===t.id?600:400}}>{t.icon} {t.label}</button>))}</div>
  <textarea value={n} onChange={e=>setN(e.target.value)} placeholder="Descreva o que aconteceu (obrigatório)" rows={2} style={{width:"100%",boxSizing:"border-box",marginBottom:12,resize:"vertical",padding:"10px",border:`1px solid ${n.trim()?C.border:C.danger}`,borderRadius:8,fontSize:14,background:C.cardLight,color:C.text}}/>
  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginBottom:8}}>
    <p style={{fontSize:13,fontWeight:600,margin:"0 0 8px",color:C.accent}}>Próximo passo</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>{TASK_TYPES.map(t=>(<button key={t.id} onClick={()=>setNextType(t.id)} style={{padding:"7px 4px",fontSize:11,border:nextType===t.id?`2px solid ${C.accent}`:`1px solid ${C.border}`,borderRadius:8,background:nextType===t.id?C.cardLight:C.bg,color:nextType===t.id?C.accent:C.textSec,cursor:"pointer",fontWeight:nextType===t.id?600:400}}>{t.icon} {t.label}</button>))}</div>
    <div style={{display:"flex",gap:8,marginBottom:10}}>
      <div style={{flex:1}}><input type="date" value={nextDate} min={minDate} onChange={e=>setNextDate(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"8px",border:`1px solid ${nextDate?C.border:C.danger}`,borderRadius:8,fontSize:13,background:C.cardLight,color:C.text}}/></div>
      <div style={{width:100}}><input type="time" value={nextTime} onChange={e=>setNextTime(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.cardLight,color:C.text}}/></div>
    </div>
    <textarea value={nextDesc} onChange={e=>setNextDesc(e.target.value)} placeholder="Próximo contato (obrigatório)" rows={2} style={{width:"100%",boxSizing:"border-box",marginBottom:4,resize:"vertical",padding:"10px",border:`1px solid ${nextDesc.trim()?C.border:C.danger}`,borderRadius:8,fontSize:14,background:C.cardLight,color:C.text}}/>
  </div>
  {!allFilled&&<p style={{fontSize:11,color:C.danger,margin:"4px 0 8px"}}>Preencha todos os campos</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><Btn onClick={onCancel} style={{flex:1}}>Cancelar</Btn><Btn onClick={()=>allFilled&&onSave(n,type,{nextType,nextDate,nextTime,nextDesc})} disabled={!allFilled} primary style={{flex:1}}>Registrar</Btn></div>
</div></div>);}

// ─── Day Base Modal ───
function DayBaseModal({user,onSave,onCancel,title}){
  const home=HOMES[user?.id];const[type,setType]=useState("home");const[loading,setLoading]=useState(false);const[hotelName,setHotelName]=useState("");
  const save=async()=>{if(type==="home"&&home){onSave({type:"home",...home});return;}setLoading(true);try{const g=await getGPS();onSave({type,lat:g.lat,lng:g.lng,label:hotelName||"Hotel/Airbnb"});}catch{alert("GPS indisponivel.");}setLoading(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:C.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:C.text}}>{title||"Inicio da jornada"}</p>
  <p style={{fontSize:13,color:C.textSec,margin:"0 0 16px"}}>De onde esta saindo?</p>
  <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px",border:type==="home"?`2px solid ${C.primary}`:`1px solid ${C.border}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:type==="home"?C.cardLight:C.bg}}><input type="radio" checked={type==="home"} onChange={()=>setType("home")}/><div><p style={{fontWeight:500,fontSize:14,margin:0,color:C.text}}>Casa</p>{home&&<p style={{fontSize:11,color:C.textSec,margin:"2px 0 0"}}>{home.label}</p>}</div></label>
  <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px",border:type==="hotel"?`2px solid ${C.primary}`:`1px solid ${C.border}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:type==="hotel"?C.cardLight:C.bg}}><input type="radio" checked={type==="hotel"} onChange={()=>setType("hotel")}/><div><p style={{fontWeight:500,fontSize:14,margin:0,color:C.text}}>Hotel / Airbnb</p><p style={{fontSize:11,color:C.textSec,margin:"2px 0 0"}}>Captura GPS atual</p></div></label>
  {type==="hotel"&&<input value={hotelName} onChange={e=>setHotelName(e.target.value)} placeholder="Nome do hotel (opcional)" style={{width:"100%",boxSizing:"border-box",marginBottom:12,padding:"10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,background:C.cardLight,color:C.text}}/>}
  <div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={onCancel} style={{flex:1}}>Depois</Btn><Btn onClick={save} disabled={loading} primary style={{flex:1}}>{loading?"Capturando GPS...":"Confirmar"}</Btn></div>
</div></div>);}

// ─── Rotas Tab ───
function RotasTab({visits,dayBases,user}){
  const[selDate,setSelDate]=useState(new Date().toISOString().slice(0,10));
  const[routes,setRoutes]=useState([]);const[loading,setLoading]=useState(false);
  const home=HOMES[user?.id];const dayBase=dayBases[selDate]||home||null;
  const dayVisits=useMemo(()=>{const t=new Date(selDate+"T12:00:00").toDateString();return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));},[visits,selDate]);
  const lunchIdx=useMemo(()=>{for(let i=0;i<dayVisits.length-1;i++){const outH=hourDec(dayVisits[i].checkoutTime);const inH=hourDec(dayVisits[i+1].checkinTime);if(outH>=LUNCH_START&&inH>=LUNCH_START&&inH<=LUNCH_END+1)return i;}return-1;},[dayVisits]);

  useEffect(()=>{
    if(dayVisits.length<1){setRoutes([]);return;}let c=false;setLoading(true);
    (async()=>{const segs=[];
      if(dayBase&&dayVisits[0]?.lat){const r=await roadKm(dayBase.lat,dayBase.lng,dayVisits[0].lat,dayVisits[0].lng);segs.push({from:dayBase.label||"Base",to:dayVisits[0].orgName,type:"base_start",...r});}
      for(let i=0;i<dayVisits.length-1;i++){const a=dayVisits[i],b=dayVisits[i+1];if(a.lat&&b.lat){const r=await roadKm(a.checkoutLat||a.lat,a.checkoutLng||a.lng,b.lat,b.lng);segs.push({from:a.orgName,to:b.orgName,type:i===lunchIdx?"lunch":"transit",...r});}}
      const last=dayVisits[dayVisits.length-1];if(dayBase&&last?.lat){const r=await roadKm(last.checkoutLat||last.lat,last.checkoutLng||last.lng,dayBase.lat,dayBase.lng);segs.push({from:last.orgName,to:dayBase.label||"Base",type:"base_end",...r});}
      if(!c){setRoutes(segs);setLoading(false);}
    })();return()=>{c=true;};
  },[dayVisits,dayBase,lunchIdx]);

  const totalKm=routes.reduce((s,r)=>s+r.km,0);const baseKm=routes.filter(r=>r.type==="base_start"||r.type==="base_end").reduce((s,r)=>s+r.km,0);
  const totalVisitTime=dayVisits.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const workHrs=dayVisits.length>0?mins(dayVisits[0].checkinTime,dayVisits[dayVisits.length-1].checkoutTime):0;
  const daysWithVisits=[...new Set(visits.filter(v=>v.checkoutTime).map(v=>new Date(v.checkinTime).toISOString().slice(0,10)))].sort().reverse().slice(0,30);

  return(<div>
    <select value={selDate} onChange={e=>setSelDate(e.target.value)} style={{width:"100%",marginBottom:14,fontSize:13,padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,background:C.cardLight,color:C.text}}>
      <option value={new Date().toISOString().slice(0,10)}>Hoje — {fD(new Date())}</option>
      {daysWithVisits.filter(d=>d!==new Date().toISOString().slice(0,10)).map(d=>(<option key={d} value={d}>{fWD(d+"T12:00")} — {fD(d+"T12:00")}</option>))}
    </select>
    {dayVisits.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <Stat icon="🛣️" label="Km total" value={`${totalKm.toFixed(1)} km`}/>
      <Stat icon="🏠" label="Base ida+volta" value={`${baseKm.toFixed(1)} km`}/>
      <Stat icon="📍" label="Visitas" value={dayVisits.length}/>
      <Stat icon="⏱" label="Jornada" value={hrsMin(workHrs)} bg={C.primary+"22"}/>
    </div>}
    {loading&&<p style={{fontSize:13,color:C.textSec,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}
    {dayVisits.length===0&&<div style={{textAlign:"center",padding:"3rem 0",color:C.textDim}}><p style={{fontSize:32,marginBottom:8}}>🛣️</p><p style={{fontSize:14,color:C.textSec}}>Nenhuma visita neste dia</p></div>}
    {dayVisits.length>0&&<Card style={{overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}><p style={{fontWeight:500,fontSize:14,margin:0,color:C.text}}>Rota do dia</p></div>
      {routes.find(r=>r.type==="base_start")&&<div style={{padding:"8px 16px",background:C.primary+"15"}}><span style={{fontSize:12,color:C.primaryLight,fontWeight:500}}>🏠 {dayBase?.label} → 1º PDV: {routes.find(r=>r.type==="base_start").km.toFixed(1)} km</span></div>}
      {dayVisits.map((v,i)=>{const seg=routes.find(r=>r.type!=="base_start"&&r.type!=="base_end"&&r.from===v.orgName);const dur=mins(v.checkinTime,v.checkoutTime);return(<div key={i}>
        <div style={{padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.primary+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:12,fontWeight:600,color:C.primaryLight}}>{i+1}</span></div>
          <div style={{flex:1,minWidth:0}}><p style={{fontSize:14,fontWeight:500,margin:"0 0 2px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p><p style={{fontSize:12,color:C.textSec,margin:0}}>{fT(v.checkinTime)} → {fT(v.checkoutTime)} — {dur} min</p></div>
          {v.synced&&<span style={{fontSize:10,color:C.success}}>✓</span>}
        </div>
        {seg&&<div style={{padding:"6px 16px 6px 56px",background:seg.type==="lunch"?C.gold+"15":C.bg}}><span style={{fontSize:12,color:seg.type==="lunch"?C.gold:C.textSec}}>{seg.type==="lunch"?"🍽 Almoço: ":"↓ "}{seg.km.toFixed(1)} km{seg.dur>0&&` — ~${seg.dur} min`}</span></div>}
      </div>);})}
      {routes.find(r=>r.type==="base_end")&&<div style={{padding:"8px 16px",background:C.primary+"15"}}><span style={{fontSize:12,color:C.primaryLight,fontWeight:500}}>📍 Último → {dayBase?.label}: {routes.find(r=>r.type==="base_end").km.toFixed(1)} km</span></div>}
      {totalKm>0&&<div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:500,color:C.textSec}}>Total</span><span style={{fontSize:15,fontWeight:600,color:C.primaryLight}}>{totalKm.toFixed(1)} km</span></div>}
    </Card>}
  </div>);
}

// ─── Relatório Tab ───
function RelatorioTab({visits,dayBases,user}){
  const[startDate,setStartDate]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});
  const[endDate,setEndDate]=useState(new Date().toISOString().slice(0,10));
  const home=HOMES[user?.id];
  const periodVisits=useMemo(()=>visits.filter(v=>{if(!v.checkoutTime)return false;const d=new Date(v.checkinTime).toISOString().slice(0,10);return d>=startDate&&d<=endDate;}).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[visits,startDate,endDate]);
  const byDay=useMemo(()=>{const map={};periodVisits.forEach(v=>{const k=new Date(v.checkinTime).toISOString().slice(0,10);if(!map[k])map[k]=[];map[k].push(v);});return Object.entries(map).sort(([a],[b])=>b.localeCompare(a));},[periodVisits]);
  const totalKm=useMemo(()=>{let km=0;byDay.forEach(([date,dvs])=>{const sorted=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const base=dayBases[date]||home;if(base&&sorted[0]?.lat)km+=haversine(base.lat,base.lng,sorted[0].lat,sorted[0].lng)*1.3;for(let i=1;i<sorted.length;i++){if(sorted[i].lat&&sorted[i-1].lat)km+=haversine(sorted[i-1].checkoutLat||sorted[i-1].lat,sorted[i-1].checkoutLng||sorted[i-1].lng,sorted[i].lat,sorted[i].lng)*1.3;}const last=sorted[sorted.length-1];if(base&&last?.lat)km+=haversine(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)*1.3;});return km;},[byDay,dayBases,home]);
  const totalMin=periodVisits.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const totalWorkHrs=useMemo(()=>byDay.reduce((s,[,dvs])=>{const sorted=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));return s+mins(sorted[0].checkinTime,sorted[sorted.length-1].checkoutTime);},0),[byDay]);
  const avgMin=periodVisits.length>0?Math.round(totalMin/periodVisits.length):0;
  const maxBar=Math.max(1,...byDay.map(([,v])=>v.length));
  const exportExcel=()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km Total","Tempo PDV","Jornada","Clientes"]];byDay.forEach(([date,dvs])=>{const sorted=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const base=dayBases[date]||home;let dayKm=0;if(base&&sorted[0]?.lat)dayKm+=haversine(base.lat,base.lng,sorted[0].lat,sorted[0].lng)*1.3;for(let i=1;i<sorted.length;i++){if(sorted[i].lat&&sorted[i-1].lat)dayKm+=haversine(sorted[i-1].checkoutLat||sorted[i-1].lat,sorted[i-1].checkoutLng||sorted[i-1].lng,sorted[i].lat,sorted[i].lng)*1.3;}const last=sorted[sorted.length-1];if(base&&last?.lat)dayKm+=haversine(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)*1.3;const dayMin=dvs.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);const wh=mins(sorted[0].checkinTime,sorted[sorted.length-1].checkoutTime);rows.push([fD(date+"T12:00"),user?.name||"",base?.label||"",base?.label||"",dvs.length,dayKm.toFixed(1),hrsMin(dayMin),hrsMin(wh),dvs.map(v=>v.orgName).join(", ")]);});rows.push([]);rows.push(["TOTAL","","","",periodVisits.length,totalKm.toFixed(1),hrsMin(totalMin),hrsMin(totalWorkHrs),""]);exportToCSV(rows,`relatorio-${user?.name||""}-${startDate}-a-${endDate}.csv`);};

  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{flex:1,padding:"8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,background:C.cardLight,color:C.text}}/>
      <span style={{color:C.textDim,fontSize:12}}>até</span>
      <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{flex:1,padding:"8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,background:C.cardLight,color:C.text}}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <Stat icon="🛣️" label="Km total" value={`${totalKm.toFixed(0)} km`}/>
      <Stat icon="📍" label="Visitas" value={periodVisits.length}/>
      <Stat icon="📅" label="Dias" value={byDay.length}/>
      <Stat icon="⏱" label="Tempo PDV" value={hrsMin(totalMin)}/>
      <Stat icon="📊" label="Média/visita" value={`${avgMin} min`}/>
      <Stat icon="🕐" label="Jornada total" value={hrsMin(totalWorkHrs)} bg={C.primary+"22"}/>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <Btn onClick={exportExcel} style={{flex:1,fontSize:12}}>📊 Exportar Resumo</Btn>
      <Btn onClick={()=>{const rows=[["Data","Check-in","Check-out","Duração","Cliente","Cidade","Lat","Lng","Tipo","Observação"]];periodVisits.forEach(v=>{rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",v.lat?.toFixed(6)||"",v.lng?.toFixed(6)||"",v.taskType||"VISITA",v.note||""]);});exportToCSV(rows,`visitas-${user?.name||""}-${startDate}-a-${endDate}.csv`);}} style={{flex:1,fontSize:12}}>📋 Exportar Detalhado</Btn>
    </div>
    {byDay.length>0&&<Card style={{padding:"14px 16px",marginBottom:16}}><p style={{fontWeight:500,fontSize:14,marginBottom:12,color:C.text}}>Visitas por dia</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{byDay.map(([date,dvs])=>(<div key={date} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.textSec,width:55,flexShrink:0,textAlign:"right"}}>{fDS(date+"T12:00")}</span><div style={{flex:1,height:20,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(dvs.length/maxBar)*100}%`,background:C.primary,borderRadius:4,minWidth:4}}/></div><span style={{fontSize:12,fontWeight:600,width:24,textAlign:"right",color:C.text}}>{dvs.length}</span></div>))}</div></Card>}
  </div>);
}

// ─── MAIN ───
export default function App(){
  const[token,setToken]=useState(()=>loadJSON("jc:token",""));
  const[user,setUser]=useState(()=>loadJSON("jc:user",null));
  const[orgs,setOrgs]=useState(()=>loadJSON("jc:orgs",[]));
  const[visits,setVisits]=useState(()=>loadJSON("jc:visits",[]));
  const[active,setActive]=useState(()=>loadJSON("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[search,setSearch]=useState("");
  const[syncing,setSyncing]=useState(false);const[ldId,setLdId]=useState(null);
  const[geoErr,setGeoErr]=useState("");const[coTarget,setCoTarget]=useState(null);
  const[lastSync,setLastSync]=useState(localStorage.getItem("jc:lastSync")||"");
  const[pdvLocs,setPdvLocs]=useState(()=>loadJSON("jc:pdvLocs",{}));
  const[dayBases,setDayBases]=useState(()=>loadJSON("jc:dayBases",{}));
  const[showDayBase,setShowDayBase]=useState(false);
  const[showEndDay,setShowEndDay]=useState(false);
  const[visibleCount,setVisibleCount]=useState(PAGE_SIZE);

  useEffect(()=>{saveJSON("jc:visits",visits);},[visits]);
  useEffect(()=>{saveJSON("jc:active",active);},[active]);
  useEffect(()=>{saveJSON("jc:orgs",orgs);},[orgs]);
  useEffect(()=>{saveJSON("jc:pdvLocs",pdvLocs);},[pdvLocs]);
  useEffect(()=>{saveJSON("jc:dayBases",dayBases);},[dayBases]);

  // Ask origin on first visit of the day
  useEffect(()=>{if(token&&user){const today=new Date().toISOString().slice(0,10);if(!dayBases[today])setShowDayBase(true);}},[token,user]);

  // 8 AM alert
  const[morningAlert,setMorningAlert]=useState(false);
  useEffect(()=>{
    if(!token||!user)return;
    const check=()=>{const h=new Date().getHours();const today=new Date().toDateString();const hasToday=visits.some(v=>new Date(v.checkinTime).toDateString()===today)||active;if(h>=8&&h<12&&!hasToday)setMorningAlert(true);else setMorningAlert(false);};
    check();const iv=setInterval(check,300000);return()=>clearInterval(iv);
  },[token,user,visits,active]);

  // Active visit > 2 hours reminder
  const[activeReminder,setActiveReminder]=useState(false);
  useEffect(()=>{if(!active)return setActiveReminder(false);const check=()=>{if(mins(active.checkinTime,new Date())>=120)setActiveReminder(true);};check();const iv=setInterval(check,60000);return()=>clearInterval(iv);},[active]);

  // Previous day unclosed visit
  const[prevDayReminder,setPrevDayReminder]=useState(null);
  useEffect(()=>{if(!token||!user||!active)return;const today=new Date().toDateString();if(new Date(active.checkinTime).toDateString()!==today)setPrevDayReminder(active);},[token,user,active]);

  const loggedIn=!!(token&&user);
  const handleLogin=(t,u)=>{setToken(t);setUser(u);saveJSON("jc:token",t);saveJSON("jc:user",u);syncOrgs(t);};
  const handleLogout=()=>{setToken("");setUser(null);saveJSON("jc:token","");saveJSON("jc:user",null);};
  const syncOrgs=async(t)=>{setSyncing(true);try{const all=await fetchOrgs(t||token);setOrgs(all);const now=new Date().toISOString();setLastSync(now);localStorage.setItem("jc:lastSync",now);}catch(e){console.error(e);}setSyncing(false);};

  const handleCheckin=async(org)=>{
    setLdId(org.id);setGeoErr("");
    try{const geo=await getGPS();const city=org.address?.city_name||org.address?.city||"";
      const v={orgId:org.id,orgName:org.name||org.nickname,city,checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",synced:false};
      if(!pdvLocs[org.id]){setPdvLocs(prev=>({...prev,[org.id]:{lat:geo.lat,lng:geo.lng,date:new Date().toISOString()}}));}
      else{const saved=pdvLocs[org.id];const dist=haversine(saved.lat,saved.lng,geo.lat,geo.lng)*1000;
        if(dist>500){v.distFromSaved=Math.round(dist);const ok=confirm(`Voce esta a ${Math.round(dist)}m do local cadastrado para ${org.name||org.nickname}.\n\nCliente errado ou atendimento remoto?`);if(!ok){setLdId(null);return;}}}
      v.synced=true;setActive(v);
    }catch{setGeoErr("GPS indisponivel.");}setLdId(null);
  };

  const handleCheckout=async(note,type="VISITA",nextStep=null)=>{
    if(!active||ldId)return;setLdId(active.orgId);
    const now=new Date();let geo=null;try{geo=await getGPS();}catch{}
    const done={...active,checkoutTime:now.toISOString(),checkoutLat:geo?.lat,checkoutLng:geo?.lng,note:note||"",taskType:type};
    try{await postAct(token,active.orgId,note,type,true);done.synced=true;}catch{}
    if(nextStep?.nextDate&&nextStep?.nextDesc){try{const dueDate=`${nextStep.nextDate}T${nextStep.nextTime||"09:00"}:00-04:00`;await postAct(token,active.orgId,nextStep.nextDesc,nextStep.nextType||"VISITA",false,dueDate);}catch{}}
    setVisits(prev=>[done,...prev]);setActive(null);setCoTarget(null);setLdId(null);
  };

  const filteredOrgs=orgs.filter(o=>{const q=search.toLowerCase();return(o.name||"").toLowerCase().includes(q)||(o.nickname||"").toLowerCase().includes(q)||(o.cnpj||"").includes(q)||(o.address?.city||"").toLowerCase().includes(q)||(o.address?.city_name||"").toLowerCase().includes(q)||(o.address?.district||"").toLowerCase().includes(q);}).sort((a,b)=>(a.name||a.nickname||"").localeCompare(b.name||b.nickname||""));

  if(!loggedIn)return<Login onLogin={handleLogin}/>;

  const tabs=[{id:"pdvs",icon:"🏪",label:"PDVs"},{id:"rotas",icon:"🛣️",label:"Rotas"},{id:"relatorio",icon:"📊",label:"Relatório"},{id:"config",icon:"⚙️",label:"Config"}];

  return(<div style={{background:C.bg,minHeight:"100vh",paddingBottom:70,color:C.text}}>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <img src="/logo.png" alt="Jordan" style={{height:32}}/>
        <div><p style={{fontSize:14,fontWeight:600,margin:0,color:C.text}}>Check-in</p><p style={{fontSize:11,color:C.textSec,margin:0}}>{user?.name} — {fD(new Date())}</p></div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {!dayBases[new Date().toISOString().slice(0,10)]&&<Btn onClick={()=>setShowDayBase(true)} style={{padding:"6px 10px",fontSize:11,borderColor:C.gold,color:C.gold}}>🏠</Btn>}
        {tab==="pdvs"&&<Btn onClick={()=>syncOrgs()} disabled={syncing} style={{padding:"6px 10px"}}>🔄</Btn>}
      </div>
    </div>

    <div style={{padding:"0 16px"}}>
      {/* Alerts */}
      {morningAlert&&!active&&<Card style={{padding:"12px 14px",marginBottom:12,borderColor:C.warn,background:C.warn+"15"}}><p style={{fontSize:13,fontWeight:500,color:C.gold,margin:0}}>⏰ Bom dia! Suas atividades ainda nao foram iniciadas.</p></Card>}
      {prevDayReminder&&<Card style={{padding:"12px 14px",marginBottom:12,borderColor:C.danger,background:C.danger+"15"}}><p style={{fontSize:13,fontWeight:500,color:C.danger,margin:"0 0 6px"}}>Visita nao fechada: {fD(prevDayReminder.checkinTime)}</p><p style={{fontSize:12,color:C.textSec,margin:"0 0 10px"}}>{prevDayReminder.orgName}</p><div style={{display:"flex",gap:8}}><Btn onClick={()=>{const ct=new Date(prevDayReminder.checkinTime);ct.setHours(18,0,0,0);setVisits(prev=>[{...prevDayReminder,checkoutTime:ct.toISOString(),note:"Check-out automatico",synced:false},...prev]);setActive(null);setPrevDayReminder(null);}} danger style={{flex:1,fontSize:12}}>Fechar 18:00</Btn><Btn onClick={()=>setCoTarget({id:prevDayReminder.orgId,name:prevDayReminder.orgName})} style={{flex:1,fontSize:12}}>Com obs.</Btn></div></Card>}
      {activeReminder&&!prevDayReminder&&<Card style={{padding:"12px 14px",marginBottom:12,borderColor:C.warn,background:C.warn+"15"}}><p style={{fontSize:13,fontWeight:500,color:C.gold,margin:"0 0 4px"}}>⏰ Visita ativa ha mais de 2h</p><p style={{fontSize:12,color:C.textSec,margin:"0 0 8px"}}>{active?.orgName}</p><Btn onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:C.warn,color:C.gold}}>Fazer check-out</Btn></Card>}

      {active&&tab!=="config"&&<Banner v={active} orgs={orgs}/>}

      {/* Tab bar */}
      <div style={{display:"flex",gap:3,marginBottom:14,background:C.cardLight,borderRadius:8,padding:3}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);setVisibleCount(PAGE_SIZE);}} style={{flex:1,border:"none",background:tab===t.id?C.primary:"transparent",borderRadius:6,padding:"8px 4px",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?C.white:C.textSec,cursor:"pointer"}}><span style={{fontSize:16,display:"block",marginBottom:2}}>{t.icon}</span>{t.label}</button>))}
      </div>

      {/* PDVs */}
      {tab==="pdvs"&&<div>
        {syncing&&<p style={{fontSize:13,color:C.textSec,textAlign:"center",padding:"2rem 0"}}>Sincronizando...</p>}
        {!syncing&&orgs.length===0&&<div style={{textAlign:"center",padding:"3rem 0"}}><p style={{fontSize:32,marginBottom:8}}>🏪</p><p style={{fontSize:14,color:C.textSec,marginBottom:12}}>Nenhum cliente</p><Btn onClick={()=>syncOrgs()} primary>Sincronizar</Btn></div>}
        {!syncing&&orgs.length>0&&<>
          <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setVisibleCount(PAGE_SIZE);}} placeholder="Buscar cliente, cidade, CNPJ ou bairro..." style={{width:"100%",boxSizing:"border-box",marginBottom:10,padding:"10px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,background:C.cardLight,color:C.text}}/>
          {geoErr&&<Card style={{padding:"10px 12px",marginBottom:10,borderColor:C.danger,background:C.danger+"15"}}><p style={{fontSize:12,color:C.danger,margin:0}}>{geoErr}</p></Card>}
          <p style={{fontSize:11,color:C.textDim,margin:"0 0 8px"}}>{filteredOrgs.length} PDVs{lastSync&&` — sinc. ${fT(lastSync)}`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredOrgs.slice(0,visibleCount).map(org=><OrgCard key={org.id} org={org} active={active} onIn={handleCheckin} onOut={o=>setCoTarget(o)} ldId={ldId} pdvLocs={pdvLocs}/>)}
          </div>
          {visibleCount<filteredOrgs.length&&<Btn onClick={()=>setVisibleCount(prev=>prev+PAGE_SIZE)} style={{width:"100%",marginTop:12,textAlign:"center"}}>Ver mais ({filteredOrgs.length-visibleCount} restantes)</Btn>}
        </>}
      </div>}

      {tab==="rotas"&&<RotasTab visits={visits} dayBases={dayBases} user={user}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user}/>}

      {tab==="config"&&<div>
        <Card style={{padding:"1rem 1.25rem",marginBottom:12}}>
          <p style={{fontSize:13,color:C.textSec,margin:"0 0 2px"}}>Conectado como</p>
          <p style={{fontSize:15,fontWeight:600,margin:"0 0 4px",color:C.text}}>{user?.name}</p>
          {HOMES[user?.id]&&<p style={{fontSize:12,color:C.success,margin:"4px 0 0"}}>🏠 {HOMES[user.id].label}</p>}
        </Card>
        <Card style={{padding:"1rem 1.25rem",marginBottom:12}}>
          <p style={{fontWeight:500,fontSize:13,marginBottom:8,color:C.text}}>Base de hoje</p>
          {dayBases[new Date().toISOString().slice(0,10)]?<div><p style={{fontSize:12,color:C.success,margin:0}}>✅ {dayBases[new Date().toISOString().slice(0,10)].label}</p><Btn onClick={()=>setShowDayBase(true)} style={{marginTop:8,fontSize:12}}>Alterar</Btn></div>:<Btn onClick={()=>setShowDayBase(true)} style={{width:"100%",borderColor:C.gold,color:C.gold}}>Definir ponto de partida</Btn>}
        </Card>
        <Card style={{padding:"1rem 1.25rem",marginBottom:12}}>
          <p style={{fontWeight:500,fontSize:13,marginBottom:8,color:C.text}}>Dados</p>
          <p style={{fontSize:12,color:C.textSec,margin:"0 0 4px"}}>{orgs.length} clientes • {visits.length} visitas • {Object.keys(pdvLocs).length} PDVs GPS</p>
          {lastSync&&<p style={{fontSize:12,color:C.textSec,margin:0}}>Sinc: {fD(lastSync)} {fT(lastSync)}</p>}
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <Btn onClick={()=>syncOrgs()} disabled={syncing} style={{width:"100%"}}>🔄 {syncing?"Sincronizando...":"Sincronizar clientes"}</Btn>
          {user?.id===743088&&<><Btn onClick={()=>{if(confirm("Limpar visitas?")){{setVisits([]);saveJSON("jc:visits",[]);}}}} style={{width:"100%",color:C.warn}}>🗑 Limpar visitas</Btn><Btn onClick={()=>{if(confirm("Limpar GPS?")){{setPdvLocs({});saveJSON("jc:pdvLocs",{});}}}} style={{width:"100%",color:C.warn}}>📍 Limpar GPS</Btn></>}
          <Btn onClick={handleLogout} style={{width:"100%",color:C.danger}}>🚪 Desconectar</Btn>
        </div>
        <div style={{background:C.cardLight,borderRadius:8,padding:"12px 16px"}}><p style={{fontSize:11,color:C.textDim,lineHeight:1.6}}>Jordan Check-in v4.0 — Agendor + OSRM + Cloudflare. Paleta Jordan Representações MT.</p></div>
      </div>}
    </div>

    {/* Bottom nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"center",zIndex:40}}>
      <div style={{display:"flex",maxWidth:480,width:"100%"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>{setTab(t.id);setVisibleCount(PAGE_SIZE);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?C.primaryLight:C.textDim,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}
      </div>
    </div>

    {coTarget&&<NoteModal org={coTarget} onSave={handleCheckout} onCancel={()=>setCoTarget(null)}/>}
    {showDayBase&&<DayBaseModal user={user} onSave={(base)=>{const today=new Date().toISOString().slice(0,10);setDayBases(prev=>{const n={...prev,[today]:base};saveJSON("jc:dayBases",n);return n;});setShowDayBase(false);}} onCancel={()=>setShowDayBase(false)}/>}
  </div>);
}
