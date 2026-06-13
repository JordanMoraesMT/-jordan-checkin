import { useState, useEffect, useMemo } from "react";

const API = "https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const HOMES = {
  743088: { lat: -15.677694, lng: -55.954778, label: "Casa Jordan" },
  743347: { lat: -15.653611, lng: -56.026833, label: "Casa Alisson" },
};
const LUNCH_START = 12, LUNCH_END = 13; // 12:00-13:00

// ─── Helpers ───
const fT = (d) => new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fD = (d) => new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fDS = (d) => new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const fWD = (d) => new Date(d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
const mins = (a,b) => Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin = (m) => m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m} min`;
const hourDec = (d) => { const dt=new Date(d); return dt.getHours()+dt.getMinutes()/60; };
const haversine = (lat1,lon1,lat2,lon2) => { const R=6371,dLat=((lat2-lat1)*Math.PI)/180,dLon=((lon2-lon1)*Math.PI)/180; const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); };

function loadJSON(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v));}

async function roadKm(lat1,lng1,lat2,lng2){
  try{const r=await fetch(`${OSRM}/${lng1},${lat1};${lng2},${lat2}?overview=false`);const d=await r.json();if(d.code==="Ok"&&d.routes?.[0])return{km:d.routes[0].distance/1000,dur:Math.round(d.routes[0].duration/60)};}catch{}
  return{km:haversine(lat1,lng1,lat2,lng2)*1.3,dur:0,estimated:true};
}

async function agFetch(path,token,opts={}){
  const clean=path.startsWith("/")?path.slice(1):path;
  const r=await fetch(`${API}?path=${encodeURIComponent(clean)}`,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});
  if(!r.ok)throw new Error(`${r.status}`);return r.json();
}
async function fetchOrgs(token){let pg=1,all=[];while(true){const d=await agFetch(`/organizations?page=${pg}&per_page=100`,token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}return all;}
async function postAct(token,orgId,text){return agFetch(`/organizations/${orgId}/tasks`,token,{method:"POST",body:JSON.stringify({text,type:"VISITA",done:true})});}
function getGPS(){return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error("GPS"));navigator.geolocation.getCurrentPosition((p)=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),rej,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}

// ─── Excel Export ───
function exportToCSV(rows, filename) {
  const BOM = "\uFEFF";
  const csv = BOM + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Components ───
function Stat({icon,label,value,bg,color}){return(<div style={{background:bg,borderRadius:10,padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:11,color}}>{label}</span></div><p style={{fontSize:20,fontWeight:600,margin:0}}>{value}</p></div>);}

function Login({onLogin}){
  const[tk,setTk]=useState("");const[ld,setLd]=useState(false);const[er,setEr]=useState("");
  const go=async()=>{if(!tk.trim())return;setLd(true);setEr("");try{const d=await agFetch("/users/me",tk.trim());d.data?onLogin(tk.trim(),d.data):setEr("Token inválido.");}catch(e){setEr("Erro: "+e.message);}setLd(false);};
  return(<div style={{padding:"2rem 0"}}><div style={{textAlign:"center",marginBottom:"2rem"}}><div style={{width:64,height:64,borderRadius:"50%",background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>📍</div><h1 style={{fontSize:22,fontWeight:600,margin:"0 0 4px"}}>Jordan Check-in</h1><p style={{fontSize:14,color:"#6B7280",margin:0}}>Conecte ao CRM Agendor</p></div><div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"1.25rem"}}><label style={{fontSize:13,color:"#6B7280",display:"block",marginBottom:6}}>Token da API Agendor</label><input type="password" value={tk} onChange={(e)=>setTk(e.target.value)} placeholder="Cole seu token aqui..." style={{width:"100%",boxSizing:"border-box",marginBottom:12,padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:14}} onKeyDown={(e)=>e.key==="Enter"&&go()}/><p style={{fontSize:12,color:"#9CA3AF",margin:"0 0 16px",lineHeight:1.5}}>Agendor → Menu (☰) → Integrações → Token da API</p><button onClick={go} disabled={ld||!tk.trim()} style={{width:"100%",background:"#1D4ED8",color:"#fff",border:"none",fontWeight:500,fontSize:15,padding:"12px",borderRadius:8,cursor:"pointer"}}>{ld?"Conectando...":"Conectar ao Agendor"}</button>{er&&<p style={{fontSize:13,color:"#DC2626",margin:"12px 0 0",textAlign:"center"}}>{er}</p>}</div></div>);
}

function OrgCard({org,active,onIn,onOut,ldId,pdvLocs}){
  const isA=active?.orgId===org.id;
  const addr=[org.address?.street,org.address?.city_name||org.address?.city,org.address?.state].filter(Boolean).join(", ");
  const savedLoc=pdvLocs[org.id];
  return(<div style={{background:isA?"#EFF6FF":"#fff",border:isA?"2px solid #3B82F6":"1px solid #E5E7EB",borderRadius:12,padding:"12px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1,minWidth:0}}><p style={{fontWeight:500,fontSize:14,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{savedLoc&&<span title="GPS salvo" style={{fontSize:10,marginRight:4}}>🟢</span>}{org.name||org.nickname}</p>{addr&&<p style={{fontSize:12,color:"#6B7280",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {addr}</p>}</div>{isA?(<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{background:"#DC2626",color:"#fff",border:"none",fontSize:12,fontWeight:500,padding:"8px 14px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap"}}>{ldId===org.id?"...":"Check-out"}</button>):(<button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{background:active?"#F3F4F6":"#059669",color:active?"#9CA3AF":"#fff",border:"none",fontSize:12,fontWeight:500,padding:"8px 14px",borderRadius:8,cursor:active?"default":"pointer",whiteSpace:"nowrap",opacity:active?0.5:1}}>{ldId===org.id?"...":"Check-in"}</button>)}</div>{isA&&<p style={{fontSize:12,color:"#1D4ED8",margin:"8px 0 0",paddingTop:8,borderTop:"1px solid #BFDBFE"}}>⏱ Desde {fT(active.checkinTime)}{active.lat&&` — GPS ${active.lat.toFixed(4)}, ${active.lng.toFixed(4)}`}</p>}</div>);
}

function Banner({v,orgs}){const o=orgs.find((x)=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);return(<div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:12,padding:"10px 14px",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#059669",flexShrink:0}}/><p style={{fontSize:13,fontWeight:500,color:"#1D4ED8",margin:0}}>Em visita: {o?.name||o?.nickname}</p></div><p style={{fontSize:12,color:"#3B82F6",margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {el} min</p></div>);}

function NoteModal({org,onSave,onCancel}){const[n,setN]=useState("");return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div style={{background:"#fff",borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480}}><p style={{fontWeight:500,fontSize:15,margin:"0 0 4px"}}>Observações do check-out</p><p style={{fontSize:12,color:"#6B7280",margin:"0 0 12px"}}>{org?.name||org?.nickname}</p><textarea value={n} onChange={(e)=>setN(e.target.value)} placeholder="Descreva o que aconteceu nesta visita (obrigatório)" rows={3} style={{width:"100%",boxSizing:"border-box",marginBottom:4,resize:"vertical",padding:"10px",border:`1px solid ${n.trim()?"#D1D5DB":"#FCA5A5"}`,borderRadius:8,fontSize:14}}/>{!n.trim()&&<p style={{fontSize:11,color:"#DC2626",margin:"0 0 8px"}}>Preencha a observação para finalizar</p>}<div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer"}}>Cancelar</button><button onClick={()=>n.trim()&&onSave(n)} disabled={!n.trim()} style={{flex:1,background:n.trim()?"#DC2626":"#F3F4F6",color:n.trim()?"#fff":"#9CA3AF",border:"none",fontWeight:500,padding:"10px",borderRadius:8,cursor:n.trim()?"pointer":"default"}}>Finalizar</button></div></div></div>);}

function DayBaseModal({user,onSave,onCancel}){
  const home=HOMES[user?.id];
  const[type,setType]=useState("home");const[loading,setLoading]=useState(false);const[hotelName,setHotelName]=useState("");
  const save=async()=>{
    if(type==="home"&&home){onSave({type:"home",...home});return;}
    setLoading(true);
    try{const g=await getGPS();onSave({type,lat:g.lat,lng:g.lng,label:hotelName||"Hotel/Airbnb"});}
    catch{alert("Não foi possível capturar GPS.");}
    setLoading(false);
  };
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:"#fff",borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>🚗 Início da jornada</p><p style={{fontSize:13,color:"#6B7280",margin:"0 0 16px"}}>De onde você está saindo hoje?</p>
  <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px",border:type==="home"?"2px solid #1D4ED8":"1px solid #E5E7EB",borderRadius:10,marginBottom:8,cursor:"pointer",background:type==="home"?"#EFF6FF":"#fff"}}><input type="radio" checked={type==="home"} onChange={()=>setType("home")}/><div><p style={{fontWeight:500,fontSize:14,margin:0}}>🏠 Minha casa</p>{home&&<p style={{fontSize:11,color:"#6B7280",margin:"2px 0 0"}}>{home.label}</p>}</div></label>
  <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px",border:type==="hotel"?"2px solid #1D4ED8":"1px solid #E5E7EB",borderRadius:10,marginBottom:8,cursor:"pointer",background:type==="hotel"?"#EFF6FF":"#fff"}}><input type="radio" checked={type==="hotel"} onChange={()=>setType("hotel")}/><div><p style={{fontWeight:500,fontSize:14,margin:0}}>🏨 Hotel / Airbnb</p><p style={{fontSize:11,color:"#6B7280",margin:"2px 0 0"}}>Captura GPS atual</p></div></label>
  {type==="hotel"&&<input value={hotelName} onChange={e=>setHotelName(e.target.value)} placeholder="Nome do hotel (opcional)" style={{width:"100%",boxSizing:"border-box",marginBottom:12,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:14}}/>}
  <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer"}}>Depois</button><button onClick={save} disabled={loading} style={{flex:1,background:"#1D4ED8",color:"#fff",border:"none",fontWeight:500,padding:"10px",borderRadius:8,cursor:"pointer"}}>{loading?"Capturando GPS...":"Confirmar"}</button></div></div></div>);
}

// ─── Rotas Tab ───
function RotasTab({visits,fuelPrice,dayBases,user}){
  const[selDate,setSelDate]=useState(new Date().toISOString().slice(0,10));
  const[routes,setRoutes]=useState([]);const[loading,setLoading]=useState(false);
  const home=HOMES[user?.id];
  const dayBase=dayBases[selDate]||home||null;

  const dayVisits=useMemo(()=>{const t=new Date(selDate+"T12:00:00").toDateString();return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));},[visits,selDate]);

  // Detect lunch
  const lunchIdx=useMemo(()=>{for(let i=0;i<dayVisits.length-1;i++){const outH=hourDec(dayVisits[i].checkoutTime);const inH=hourDec(dayVisits[i+1].checkinTime);if(outH>=LUNCH_START&&outH<=LUNCH_END&&inH>=LUNCH_START&&inH<=LUNCH_END+1)return i;}return-1;},[dayVisits]);

  useEffect(()=>{
    if(dayVisits.length<1){setRoutes([]);return;}
    let c=false;setLoading(true);
    (async()=>{
      const segs=[];
      // Home/hotel → first PDV
      if(dayBase&&dayVisits[0]?.lat){const r=await roadKm(dayBase.lat,dayBase.lng,dayVisits[0].lat,dayVisits[0].lng);segs.push({from:dayBase.label||"Base",to:dayVisits[0].orgName,type:"base_start",...r});}
      // Between PDVs
      for(let i=0;i<dayVisits.length-1;i++){
        const a=dayVisits[i],b=dayVisits[i+1];
        if(a.lat&&b.lat){const r=await roadKm(a.checkoutLat||a.lat,a.checkoutLng||a.lng,b.lat,b.lng);segs.push({from:a.orgName,to:b.orgName,type:i===lunchIdx?"lunch":"transit",...r});}
      }
      // Last PDV → home/hotel
      const last=dayVisits[dayVisits.length-1];
      if(dayBase&&last?.lat){const r=await roadKm(last.checkoutLat||last.lat,last.checkoutLng||last.lng,dayBase.lat,dayBase.lng);segs.push({from:last.orgName,to:dayBase.label||"Base",type:"base_end",...r});}
      if(!c){setRoutes(segs);setLoading(false);}
    })();
    return()=>{c=true;};
  },[dayVisits,dayBase,lunchIdx]);

  const totalKm=routes.reduce((s,r)=>s+r.km,0);
  const transitKm=routes.filter(r=>r.type==="transit"||r.type==="lunch").reduce((s,r)=>s+r.km,0);
  const baseKm=routes.filter(r=>r.type==="base_start"||r.type==="base_end").reduce((s,r)=>s+r.km,0);
  const lunchKm=routes.filter(r=>r.type==="lunch").reduce((s,r)=>s+r.km,0);
  const fuelCost=(totalKm/10)*fuelPrice;
  const totalVisitTime=dayVisits.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const daysWithVisits=[...new Set(visits.filter(v=>v.checkoutTime).map(v=>new Date(v.checkinTime).toISOString().slice(0,10)))].sort().reverse().slice(0,30);

  const segLabel={base_start:"🏠→📍",transit:"📍→📍",lunch:"🍽 Almoço",base_end:"📍→🏠"};
  const segColor={base_start:"#1D4ED8",transit:"#6B7280",lunch:"#D97706",base_end:"#1D4ED8"};

  return(<div>
    <select value={selDate} onChange={e=>setSelDate(e.target.value)} style={{width:"100%",marginBottom:14,fontSize:13,padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8}}>
      <option value={new Date().toISOString().slice(0,10)}>Hoje — {fD(new Date())}</option>
      {daysWithVisits.filter(d=>d!==new Date().toISOString().slice(0,10)).map(d=>(<option key={d} value={d}>{fWD(d+"T12:00")} — {fD(d+"T12:00")}</option>))}
    </select>
    {dayVisits.length>0&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <Stat icon="🛣️" label="Km total" value={`${totalKm.toFixed(1)} km`} bg="#EFF6FF" color="#1D4ED8"/>
      <Stat icon="⛽" label="Combustível" value={`R$ ${fuelCost.toFixed(0)}`} bg="#FFFBEB" color="#D97706"/>
      <Stat icon="🏠" label="Base ida+volta" value={`${baseKm.toFixed(1)} km`} bg="#ECFDF5" color="#059669"/>
      {lunchKm>0&&<Stat icon="🍽" label="Almoço" value={`${lunchKm.toFixed(1)} km`} bg="#FFFBEB" color="#D97706"/>}
      <Stat icon="📍" label="Visitas" value={dayVisits.length} bg="#ECFDF5" color="#059669"/>
      <Stat icon="⏱" label="Tempo PDV" value={hrsMin(totalVisitTime)} bg="#EFF6FF" color="#1D4ED8"/>
    </div>)}
    {loading&&<p style={{fontSize:13,color:"#6B7280",textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}
    {dayVisits.length===0&&<div style={{textAlign:"center",padding:"3rem 0",color:"#9CA3AF"}}><p style={{fontSize:32,marginBottom:8}}>🛣️</p><p style={{fontSize:14}}>Nenhuma visita neste dia</p></div>}
    {dayVisits.length>0&&(<div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid #E5E7EB"}}><p style={{fontWeight:500,fontSize:14,margin:0}}>Rota completa do dia</p></div>
      {/* Base start segment */}
      {routes.find(r=>r.type==="base_start")&&(<div style={{padding:"8px 16px",background:"#EFF6FF"}}><span style={{fontSize:12,color:"#1D4ED8",fontWeight:500}}>🏠 {dayBase?.label||"Base"} → primeiro PDV: {routes.find(r=>r.type==="base_start").km.toFixed(1)} km</span></div>)}
      {dayVisits.map((v,i)=>{
        const seg=routes.find(r=>r.type!=="base_start"&&r.type!=="base_end"&&r.from===v.orgName);
        const dur=mins(v.checkinTime,v.checkoutTime);
        return(<div key={i}>
          <div style={{padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:12,fontWeight:600,color:"#1D4ED8"}}>{i+1}</span></div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:14,fontWeight:500,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p>
              <p style={{fontSize:12,color:"#6B7280",margin:0}}>{fT(v.checkinTime)} → {fT(v.checkoutTime)} — {dur} min</p>
              {v.note&&<p style={{fontSize:11,color:"#9CA3AF",margin:"2px 0 0",fontStyle:"italic"}}>{v.note}</p>}
            </div>
            {v.synced&&<span style={{fontSize:10,color:"#059669",whiteSpace:"nowrap"}}>✓ Agendor</span>}
          </div>
          {seg&&(<div style={{padding:"6px 16px 6px 56px",background:seg.type==="lunch"?"#FFFBEB":"#F9FAFB"}}>
            <span style={{fontSize:12,color:segColor[seg.type]||"#6B7280",fontWeight:seg.type==="lunch"?500:400}}>
              {seg.type==="lunch"?"🍽 Almoço: ":"↓ "}{seg.km.toFixed(1)} km{seg.dur>0&&` — ~${seg.dur} min`}
            </span></div>)}
        </div>);
      })}
      {routes.find(r=>r.type==="base_end")&&(<div style={{padding:"8px 16px",background:"#EFF6FF"}}><span style={{fontSize:12,color:"#1D4ED8",fontWeight:500}}>📍 Último PDV → {dayBase?.label||"Base"}: {routes.find(r=>r.type==="base_end").km.toFixed(1)} km</span></div>)}
      {totalKm>0&&(<div style={{padding:"12px 16px",borderTop:"1px solid #E5E7EB",background:"#F9FAFB",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:500}}>Total</span><span style={{fontSize:15,fontWeight:600,color:"#1D4ED8"}}>{totalKm.toFixed(1)} km</span></div>)}
    </div>)}
  </div>);
}

// ─── Relatório Tab ───
function RelatorioTab({visits,dayBases,user}){
  const[period,setPeriod]=useState("week");
  const home=HOMES[user?.id];
  const now=new Date();
  const periodVisits=useMemo(()=>visits.filter(v=>{if(!v.checkoutTime)return false;const d=new Date(v.checkinTime);if(period==="today")return d.toDateString()===now.toDateString();if(period==="week"){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w;}if(period==="month"){const m=new Date(now);m.setDate(m.getDate()-30);return d>=m;}return true;}).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[visits,period]);

  const byDay=useMemo(()=>{const map={};periodVisits.forEach(v=>{const k=new Date(v.checkinTime).toISOString().slice(0,10);if(!map[k])map[k]=[];map[k].push(v);});return Object.entries(map).sort(([a],[b])=>b.localeCompare(a));},[periodVisits]);

  // Calculate km including base
  const totalKm=useMemo(()=>{let km=0;byDay.forEach(([date,dvs])=>{const sorted=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const base=dayBases[date]||home;
    if(base&&sorted[0]?.lat)km+=haversine(base.lat,base.lng,sorted[0].lat,sorted[0].lng)*1.3;
    for(let i=1;i<sorted.length;i++){if(sorted[i].lat&&sorted[i-1].lat)km+=haversine(sorted[i-1].checkoutLat||sorted[i-1].lat,sorted[i-1].checkoutLng||sorted[i-1].lng,sorted[i].lat,sorted[i].lng)*1.3;}
    const last=sorted[sorted.length-1];if(base&&last?.lat)km+=haversine(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)*1.3;
  });return km;},[byDay,dayBases,home]);

  const totalMin=periodVisits.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const avgMin=periodVisits.length>0?Math.round(totalMin/periodVisits.length):0;
  const maxBar=Math.max(1,...byDay.map(([,v])=>v.length));

  // Excel export
  const exportExcel=()=>{
    const rows=[["Data","Vendedor","Origem","Destino (retorno)","Qtd Visitas","Km Total (est.)","Tempo em PDV","Média/Visita","Clientes Visitados"]];
    byDay.forEach(([date,dvs])=>{
      const sorted=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
      const base=dayBases[date]||home;
      let dayKm=0;
      if(base&&sorted[0]?.lat)dayKm+=haversine(base.lat,base.lng,sorted[0].lat,sorted[0].lng)*1.3;
      for(let i=1;i<sorted.length;i++){if(sorted[i].lat&&sorted[i-1].lat)dayKm+=haversine(sorted[i-1].checkoutLat||sorted[i-1].lat,sorted[i-1].checkoutLng||sorted[i-1].lng,sorted[i].lat,sorted[i].lng)*1.3;}
      const last=sorted[sorted.length-1];if(base&&last?.lat)dayKm+=haversine(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)*1.3;
      const dayMin=dvs.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
      const clients=dvs.map(v=>v.orgName).join(", ");
      const origin=base?.label||"N/A";const dest=base?.label||"N/A";
      rows.push([fD(date+"T12:00"),user?.name||"",origin,dest,dvs.length,dayKm.toFixed(1),hrsMin(dayMin),dvs.length>0?Math.round(dayMin/dvs.length)+" min":"",clients]);
    });
    rows.push([]);
    rows.push(["TOTAL","","","",periodVisits.length,totalKm.toFixed(1),hrsMin(totalMin),avgMin+" min",""]);
    exportToCSV(rows,`relatorio-km-${user?.name||"vendedor"}-${period}.csv`);
  };

  // Detail export (every visit)
  const exportDetail=()=>{
    const rows=[["Data","Horário Check-in","Horário Check-out","Duração (min)","Cliente","Cidade","Latitude","Longitude","Observações","Sincronizado"]];
    periodVisits.forEach(v=>{rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",v.lat?.toFixed(6)||"",v.lng?.toFixed(6)||"",v.note||"",v.synced?"Sim":"Não"]);});
    exportToCSV(rows,`visitas-detalhado-${user?.name||"vendedor"}-${period}.csv`);
  };

  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:14,background:"#F3F4F6",borderRadius:8,padding:3}}>
      {[["today","Hoje"],["week","7 dias"],["month","30 dias"]].map(([k,l])=>(<button key={k} onClick={()=>setPeriod(k)} style={{flex:1,border:"none",background:period===k?"#fff":"transparent",borderRadius:6,padding:"8px 4px",fontSize:12,fontWeight:period===k?600:400,color:period===k?"#111827":"#6B7280",cursor:"pointer",boxShadow:period===k?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>{l}</button>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <Stat icon="🛣️" label="Km total" value={`${totalKm.toFixed(0)} km`} bg="#EFF6FF" color="#1D4ED8"/>
      <Stat icon="📍" label="Visitas" value={periodVisits.length} bg="#ECFDF5" color="#059669"/>
      <Stat icon="📅" label="Dias" value={byDay.length} bg="#EFF6FF" color="#1D4ED8"/>
      <Stat icon="⏱" label="Tempo PDV" value={hrsMin(totalMin)} bg="#ECFDF5" color="#059669"/>
      <Stat icon="📊" label="Média/visita" value={`${avgMin} min`} bg="#FFFBEB" color="#D97706"/>
      <Stat icon="📏" label="Km/dia" value={byDay.length>0?`${(totalKm/byDay.length).toFixed(0)} km`:"-"} bg="#FFFBEB" color="#D97706"/>
    </div>
    {/* Export buttons */}
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <button onClick={exportExcel} style={{flex:1,padding:"10px",fontSize:13,border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:500,color:"#059669"}}>📊 Exportar Resumo</button>
      <button onClick={exportDetail} style={{flex:1,padding:"10px",fontSize:13,border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:500,color:"#1D4ED8"}}>📋 Exportar Detalhado</button>
    </div>
    {/* Daily bar chart */}
    {byDay.length>0&&(<div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"14px 16px",marginBottom:16}}><p style={{fontWeight:500,fontSize:14,marginBottom:12}}>Visitas por dia</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{byDay.slice(0,14).map(([date,dvs])=>(<div key={date} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"#6B7280",width:55,flexShrink:0,textAlign:"right"}}>{fDS(date+"T12:00")}</span><div style={{flex:1,height:20,background:"#F3F4F6",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(dvs.length/maxBar)*100}%`,background:"#3B82F6",borderRadius:4,minWidth:4}}/></div><span style={{fontSize:12,fontWeight:600,width:24,textAlign:"right"}}>{dvs.length}</span></div>))}</div></div>)}
  </div>);
}

// ─── MAIN ───
export default function App(){
  const[token,setToken]=useState(()=>loadJSON("jc:token",""));
  const[user,setUser]=useState(()=>loadJSON("jc:user",null));
  const[orgs,setOrgs]=useState(()=>loadJSON("jc:orgs",[]));
  const[visits,setVisits]=useState(()=>loadJSON("jc:visits",[]));
  const[active,setActive]=useState(()=>loadJSON("jc:active",null));
  const[tab,setTab]=useState("pdvs");
  const[search,setSearch]=useState("");
  const[syncing,setSyncing]=useState(false);
  const[ldId,setLdId]=useState(null);
  const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);
  const[lastSync,setLastSync]=useState(localStorage.getItem("jc:lastSync")||"");
  const[fuelPrice,setFuelPrice]=useState(()=>loadJSON("jc:fuelPrice",6.5));
  const[pdvLocs,setPdvLocs]=useState(()=>loadJSON("jc:pdvLocs",{}));
  const[dayBases,setDayBases]=useState(()=>loadJSON("jc:dayBases",{}));
  const[showDayBase,setShowDayBase]=useState(false);

  useEffect(()=>{saveJSON("jc:visits",visits);},[visits]);
  useEffect(()=>{saveJSON("jc:active",active);},[active]);
  useEffect(()=>{saveJSON("jc:orgs",orgs);},[orgs]);
  useEffect(()=>{saveJSON("jc:pdvLocs",pdvLocs);},[pdvLocs]);
  useEffect(()=>{saveJSON("jc:dayBases",dayBases);},[dayBases]);

  // Check if day base is set for today
  useEffect(()=>{
    if(token&&user){const today=new Date().toISOString().slice(0,10);if(!dayBases[today])setShowDayBase(true);}
  },[token,user]);

  // Reminder: active visit > 2 hours
  const[activeReminder,setActiveReminder]=useState(false);
  useEffect(()=>{
    if(!active)return setActiveReminder(false);
    const check=()=>{const elapsed=mins(active.checkinTime,new Date());if(elapsed>=120)setActiveReminder(true);};
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[active]);

  // Reminder: unclosed visits from previous days
  const[prevDayReminder,setPrevDayReminder]=useState(null);
  useEffect(()=>{
    if(!token||!user)return;
    const today=new Date().toDateString();
    if(active&&new Date(active.checkinTime).toDateString()!==today){
      setPrevDayReminder(active);
    }
  },[token,user,active]);

  const loggedIn=!!(token&&user);
  const handleLogin=(t,u)=>{setToken(t);setUser(u);saveJSON("jc:token",t);saveJSON("jc:user",u);syncOrgs(t);};
  const handleLogout=()=>{setToken("");setUser(null);saveJSON("jc:token","");saveJSON("jc:user",null);};

  const syncOrgs=async(t)=>{setSyncing(true);try{const all=await fetchOrgs(t||token);setOrgs(all);const now=new Date().toISOString();setLastSync(now);localStorage.setItem("jc:lastSync",now);}catch(e){console.error(e);}setSyncing(false);};

  const handleCheckin=async(org)=>{
    setLdId(org.id);setGeoErr("");
    try{
      const geo=await getGPS();const city=org.address?.city_name||org.address?.city||"";
      const v={orgId:org.id,orgName:org.name||org.nickname,city,checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",synced:false};
      // Save PDV location on first visit
      if(!pdvLocs[org.id]){setPdvLocs(prev=>({...prev,[org.id]:{lat:geo.lat,lng:geo.lng,date:new Date().toISOString()}}));}
      else{const saved=pdvLocs[org.id];const dist=haversine(saved.lat,saved.lng,geo.lat,geo.lng)*1000;if(dist>500){v.distFromSaved=Math.round(dist);}}
      try{const now=new Date();await postAct(token,org.id,`📍 CHECK-IN — ${fD(now)} ${fT(now)}\nLocal: ${v.orgName}\nGPS: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}\nPrecisão: ${geo.acc}m${v.distFromSaved?`\n⚠️ ${v.distFromSaved}m do local cadastrado`:""}`);v.synced=true;}catch{}
      setActive(v);
    }catch{setGeoErr("GPS indisponível. Verifique permissões.");}
    setLdId(null);
  };

  const handleCheckout=async(note)=>{
    if(!active)return;setLdId(active.orgId);
    const now=new Date();let geo=null;try{geo=await getGPS();}catch{}
    const duration=mins(active.checkinTime,now);
    const done={...active,checkoutTime:now.toISOString(),checkoutLat:geo?.lat,checkoutLng:geo?.lng,note:note||""};
    try{const lines=[`🏁 CHECK-OUT — ${fD(now)} ${fT(now)}`,`Local: ${active.orgName}`,`Duração: ${duration} min`,`In: ${fT(active.checkinTime)} | Out: ${fT(now)}`];if(geo)lines.push(`GPS saída: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}`);if(note)lines.push(`Obs: ${note}`);await postAct(token,active.orgId,lines.join("\n"));done.synced=true;}catch{}
    setVisits(prev=>[done,...prev]);setActive(null);setCoTarget(null);setLdId(null);
  };

  const filteredOrgs=orgs.filter(o=>{const q=search.toLowerCase();return(o.name||"").toLowerCase().includes(q)||(o.nickname||"").toLowerCase().includes(q)||(o.cnpj||"").includes(q)||(o.address?.city||"").toLowerCase().includes(q)||(o.address?.city_name||"").toLowerCase().includes(q);}).sort((a,b)=>(a.name||a.nickname||"").localeCompare(b.name||b.nickname||""));

  if(!loggedIn)return<Login onLogin={handleLogin}/>;

  const tabs=[{id:"pdvs",icon:"🏪",label:"PDVs"},{id:"rotas",icon:"🛣️",label:"Rotas"},{id:"relatorio",icon:"📊",label:"Relatório"},{id:"config",icon:"⚙️",label:"Config"}];

  return(<div style={{paddingBottom:70}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",marginBottom:4}}>
      <div><h1 style={{fontSize:18,fontWeight:600,margin:0}}>📍 Jordan Check-in</h1><p style={{fontSize:12,color:"#6B7280",margin:"2px 0 0 26px"}}>{user?.name} — {fD(new Date())}</p></div>
      <div style={{display:"flex",gap:6}}>
        {!dayBases[new Date().toISOString().slice(0,10)]&&<button onClick={()=>setShowDayBase(true)} style={{padding:"6px 10px",fontSize:11,border:"1px solid #D97706",borderRadius:8,background:"#FFFBEB",color:"#D97706",cursor:"pointer"}}>🏠 Base</button>}
        {tab==="pdvs"&&<button onClick={()=>syncOrgs()} disabled={syncing} style={{padding:"6px 10px",fontSize:12,border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer"}}>🔄</button>}
      </div>
    </div>

    {active&&tab!=="config"&&<Banner v={active} orgs={orgs}/>}

    {/* Reminder: previous day unclosed visit */}
    {prevDayReminder&&(<div style={{background:"#FEF2F2",border:"1px solid #FEE2E2",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <p style={{fontSize:13,fontWeight:500,color:"#DC2626",margin:"0 0 6px"}}>⚠️ Visita não fechada de {fD(prevDayReminder.checkinTime)}</p>
      <p style={{fontSize:12,color:"#6B7280",margin:"0 0 10px"}}>{prevDayReminder.orgName} — check-in às {fT(prevDayReminder.checkinTime)}</p>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{
          const closeTime=new Date(prevDayReminder.checkinTime);closeTime.setHours(18,0,0,0);
          const done={...prevDayReminder,checkoutTime:closeTime.toISOString(),note:"Check-out automático (esquecido)",synced:false};
          setVisits(prev=>[done,...prev]);setActive(null);setPrevDayReminder(null);
        }} style={{flex:1,padding:"8px",fontSize:12,border:"none",borderRadius:8,background:"#DC2626",color:"#fff",cursor:"pointer",fontWeight:500}}>Fechar como 18:00</button>
        <button onClick={()=>setCoTarget({id:prevDayReminder.orgId,name:prevDayReminder.orgName})} style={{flex:1,padding:"8px",fontSize:12,border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",fontWeight:500}}>Fechar com obs.</button>
      </div>
    </div>)}

    {/* Reminder: active visit > 2 hours */}
    {activeReminder&&!prevDayReminder&&(<div style={{background:"#FFFBEB",border:"1px solid #FEF3C7",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <p style={{fontSize:13,fontWeight:500,color:"#D97706",margin:"0 0 4px"}}>⏰ Visita ativa há mais de 2 horas</p>
      <p style={{fontSize:12,color:"#6B7280",margin:"0 0 8px"}}>{active?.orgName} — desde {fT(active?.checkinTime)}</p>
      <button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",padding:"8px",fontSize:12,border:"1px solid #D97706",borderRadius:8,background:"#FFFBEB",color:"#D97706",cursor:"pointer",fontWeight:500}}>Fazer check-out agora</button>
    </div>)}

    {/* PDVs */}
    {tab==="pdvs"&&(<div>
      {syncing&&<p style={{fontSize:13,color:"#6B7280",textAlign:"center",padding:"2rem 0"}}>Sincronizando...</p>}
      {!syncing&&orgs.length===0&&<div style={{textAlign:"center",padding:"3rem 0",color:"#9CA3AF"}}><p style={{fontSize:32,marginBottom:8}}>🏪</p><p style={{fontSize:14,marginBottom:12}}>Nenhum cliente</p><button onClick={()=>syncOrgs()}>Sincronizar</button></div>}
      {!syncing&&orgs.length>0&&(<>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar cliente, cidade ou CNPJ..." style={{width:"100%",boxSizing:"border-box",marginBottom:10,padding:"10px 12px",border:"1px solid #D1D5DB",borderRadius:8,fontSize:14}}/>
        {geoErr&&<div style={{background:"#FEF2F2",border:"1px solid #FEE2E2",borderRadius:8,padding:"10px 12px",marginBottom:10}}><p style={{fontSize:12,color:"#DC2626",margin:0}}>{geoErr}</p></div>}
        <p style={{fontSize:11,color:"#9CA3AF",margin:"0 0 8px"}}>{filteredOrgs.length} de {orgs.length} PDVs{lastSync&&` — sinc. ${fT(lastSync)}`}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filteredOrgs.slice(0,50).map(org=><OrgCard key={org.id} org={org} active={active} onIn={handleCheckin} onOut={o=>setCoTarget(o)} ldId={ldId} pdvLocs={pdvLocs}/>)}
          {filteredOrgs.length>50&&<p style={{fontSize:12,color:"#9CA3AF",textAlign:"center",padding:"8px 0"}}>Mostrando 50 de {filteredOrgs.length}</p>}
        </div>
      </>)}
    </div>)}

    {tab==="rotas"&&<RotasTab visits={visits} fuelPrice={fuelPrice} dayBases={dayBases} user={user}/>}
    {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user}/>}

    {tab==="config"&&(<div>
      <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <p style={{fontSize:13,color:"#6B7280",margin:"0 0 2px"}}>Conectado como</p>
        <p style={{fontSize:15,fontWeight:600,margin:"0 0 4px"}}>{user?.name} (ID: {user?.id})</p>
        {user?.email&&<p style={{fontSize:12,color:"#6B7280",margin:0}}>{user.contact?.email}</p>}
        {HOMES[user?.id]&&<p style={{fontSize:12,color:"#059669",margin:"6px 0 0"}}>🏠 Base: {HOMES[user.id].label} ({HOMES[user.id].lat.toFixed(4)}, {HOMES[user.id].lng.toFixed(4)})</p>}
      </div>
      <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <p style={{fontWeight:500,fontSize:13,marginBottom:8}}>Base de hoje</p>
        {dayBases[new Date().toISOString().slice(0,10)]?(<div><p style={{fontSize:12,color:"#059669",margin:0}}>✅ {dayBases[new Date().toISOString().slice(0,10)].type==="home"?"Casa":"Hotel/Airbnb"}: {dayBases[new Date().toISOString().slice(0,10)].label}</p><button onClick={()=>setShowDayBase(true)} style={{marginTop:8,fontSize:12,padding:"6px 12px",border:"1px solid #D1D5DB",borderRadius:6,background:"#fff",cursor:"pointer"}}>Alterar</button></div>):(<button onClick={()=>setShowDayBase(true)} style={{width:"100%",padding:"10px",fontSize:13,border:"1px solid #D97706",borderRadius:8,background:"#FFFBEB",color:"#D97706",cursor:"pointer"}}>🏠 Definir ponto de partida</button>)}
      </div>
      <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"1rem 1.25rem",marginBottom:12}}>
        <p style={{fontWeight:500,fontSize:13,marginBottom:8}}>Dados</p>
        <p style={{fontSize:12,color:"#6B7280",margin:"0 0 4px"}}>{orgs.length} clientes • {visits.length} visitas • {Object.keys(pdvLocs).length} PDVs com GPS salvo</p>
        {lastSync&&<p style={{fontSize:12,color:"#6B7280",margin:0}}>Sinc: {fD(lastSync)} {fT(lastSync)}</p>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        <button onClick={()=>syncOrgs()} disabled={syncing} style={{width:"100%",fontSize:13,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer"}}>🔄 {syncing?"Sincronizando...":"Sincronizar clientes"}</button>
        {user?.id===743088&&<><button onClick={()=>{if(confirm("Limpar todas as visitas?")){{setVisits([]);saveJSON("jc:visits",[]);}}}} style={{width:"100%",fontSize:13,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",color:"#D97706"}}>🗑 Limpar visitas</button>
        <button onClick={()=>{if(confirm("Limpar GPS de todos os PDVs?")){{setPdvLocs({});saveJSON("jc:pdvLocs",{});}}}} style={{width:"100%",fontSize:13,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",color:"#D97706"}}>📍 Limpar GPS dos PDVs</button></>}
        <button onClick={handleLogout} style={{width:"100%",fontSize:13,padding:"10px",border:"1px solid #D1D5DB",borderRadius:8,background:"#fff",cursor:"pointer",color:"#DC2626"}}>🚪 Desconectar</button>
      </div>
      <div style={{background:"#F3F4F6",borderRadius:8,padding:"12px 16px"}}><p style={{fontSize:11,color:"#9CA3AF",lineHeight:1.6}}>Jordan Check-in v3.0 — Agendor + OSRM + Cloudflare Worker. Km inclui casa/hotel→PDVs→casa/hotel. GPS salvo por PDV. Exporta Excel (CSV). Consumo: 10km/L.</p></div>
    </div>)}

    {/* Bottom nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #E5E7EB",display:"flex",justifyContent:"center",zIndex:40}}>
      <div style={{display:"flex",maxWidth:480,width:"100%"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?"#1D4ED8":"#9CA3AF",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><span style={{fontSize:20}}>{t.icon}</span>{t.label}</button>))}
      </div>
    </div>

    {coTarget&&<NoteModal org={coTarget} onSave={handleCheckout} onCancel={()=>setCoTarget(null)}/>}
    {showDayBase&&<DayBaseModal user={user} onSave={(base)=>{const today=new Date().toISOString().slice(0,10);setDayBases(prev=>{const n={...prev,[today]:base};saveJSON("jc:dayBases",n);return n;});setShowDayBase(false);}} onCancel={()=>setShowDayBase(false)}/>}
  </div>);
}
