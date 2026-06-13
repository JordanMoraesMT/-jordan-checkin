import { useState, useEffect, useMemo } from "react";

const API = "https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const HOMES = { 743088:{lat:-15.677694,lng:-55.954778,label:"Casa Jordan"}, 743347:{lat:-15.653611,lng:-56.026833,label:"Casa Alisson"} };
const LUNCH_START=12, LUNCH_END=13;
const TASK_TYPES=[{id:"VISITA",label:"Visita"},{id:"LIGACAO",label:"Ligação"},{id:"EMAIL",label:"E-mail"},{id:"REUNIAO",label:"Reunião"},{id:"WHATSAPP",label:"WhatsApp"},{id:"PROPOSTA",label:"Proposta"}];
const PG=20;
const S={bg:"#0F1B2D",card:"#162236",cl:"#1C2E47",pri:"#0578A6",pl:"#0890C2",acc:"#2A9D8F",gold:"#C8964E",dng:"#DC2626",txt:"#E8ECF1",ts:"#8899AB",td:"#5A6B7D",brd:"#243349",ok:"#10B981"};

const fT=(d)=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fD=(d)=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fDS=(d)=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const fWD=(d)=>new Date(d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");
const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin=(m)=>m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m}min`;
const hourDec=(d)=>{const dt=new Date(d);return dt.getHours()+dt.getMinutes()/60;};
const hav=(a,b,c,d)=>{const R=6371,x=((c-a)*Math.PI)/180,y=((d-b)*Math.PI)/180;const z=Math.sin(x/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
function ld(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}}
function sv(k,v){localStorage.setItem(k,JSON.stringify(v));}
async function roadKm(a,b,c,d){try{const r=await fetch(`${OSRM}/${b},${a};${d},${c}?overview=false`);const j=await r.json();if(j.code==="Ok"&&j.routes?.[0])return{km:j.routes[0].distance/1000,dur:Math.round(j.routes[0].duration/60)};}catch{}return{km:hav(a,b,c,d)*1.3,dur:0,est:true};}
async function agF(path,token,opts={}){const p=path.startsWith("/")?path.slice(1):path;const r=await fetch(`${API}?path=${encodeURIComponent(p)}`,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
async function getOrgs(token){let pg=1,all=[];while(true){const d=await agF(`/organizations?page=${pg}&per_page=100`,token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}return all;}
async function postTask(token,oid,text,type="VISITA",done=true,due=null){const b={text,type,done};if(due)b.due_date=due;return agF(`/organizations/${oid}/tasks`,token,{method:"POST",body:JSON.stringify(b)});}
function gps(){return new Promise((r,j)=>{if(!navigator.geolocation)return j(new Error("GPS"));navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),j,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
function csv(rows,fn){const b="\uFEFF"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");const u=URL.createObjectURL(new Blob([b],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);}

function Login({onLogin}){
  const[tk,setTk]=useState("");const[lo,setLo]=useState(false);const[er,setEr]=useState("");
  const go=async()=>{if(!tk.trim())return;setLo(true);setEr("");try{const d=await agF("/users/me",tk.trim());d.data?onLogin(tk.trim(),d.data):setEr("Token invalido.");}catch(e){setEr("Erro: "+e.message);}setLo(false);};
  return(<div style={{padding:"3rem 1rem",textAlign:"center"}}>
    <img src="/logo.png" alt="Jordan" style={{height:48,marginBottom:16}} onError={e=>{e.target.style.display="none"}}/>
    <h1 style={{fontSize:20,fontWeight:600,margin:"0 0 4px"}}>Jordan Check-in</h1>
    <p style={{fontSize:13,color:S.ts,margin:"0 0 2rem"}}>Inteligencia Comercial</p>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1.25rem",textAlign:"left"}}>
      <label style={{fontSize:13,color:S.ts,display:"block",marginBottom:6}}>Token da API Agendor</label>
      <input type="password" value={tk} onChange={e=>setTk(e.target.value)} placeholder="Cole seu token..." style={{width:"100%",marginBottom:16}} onKeyDown={e=>e.key==="Enter"&&go()}/>
      <button onClick={go} disabled={lo||!tk.trim()} style={{width:"100%",background:S.pri,border:"none",fontWeight:600,fontSize:15,padding:12}}>{lo?"Conectando...":"Conectar ao Agendor"}</button>
      {er&&<p style={{fontSize:13,color:S.dng,marginTop:12,textAlign:"center"}}>{er}</p>}
    </div>
  </div>);
}

function OrgCard({org,active,onIn,onOut,ldId,plocs}){
  const isA=active?.orgId===org.id;const a=org.address||{};
  const info=[a.district||a.neighborhood,a.city_name||a.city,a.state].filter(Boolean).join(" · ");
  return(<div style={{background:isA?S.cl:S.card,border:`${isA?2:1}px solid ${isA?S.pri:S.brd}`,borderRadius:12,padding:"12px 14px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontWeight:500,fontSize:14,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{plocs[org.id]?<span style={{color:S.ok,fontSize:10,marginRight:4}}>●</span>:null}{org.name||org.nickname}</p>
        {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 1px"}}>CNPJ: {org.cnpj}</p>}
        {info&&<p style={{fontSize:11,color:S.ts,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{info}</p>}
        {org.category&&<span style={{fontSize:10,color:S.gold,background:S.bg,padding:"1px 6px",borderRadius:4,marginTop:2,display:"inline-block"}}>{org.category}</span>}
      </div>
      {isA?<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{background:S.dng,border:"none",fontSize:12,fontWeight:500,padding:"6px 14px",whiteSpace:"nowrap"}}>{ldId===org.id?"...":"Check-out"}</button>
      :<button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{background:active?S.cl:S.acc,border:"none",fontSize:12,fontWeight:500,padding:"6px 14px",whiteSpace:"nowrap",opacity:active?0.4:1}}>{ldId===org.id?"...":"Check-in"}</button>}
    </div>
    {isA&&<p style={{fontSize:12,color:S.pl,margin:"8px 0 0",paddingTop:8,borderTop:`1px solid ${S.brd}`}}>Em visita desde {fT(active.checkinTime)}</p>}
  </div>);
}

function Banner({v,orgs}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);
  return(<div style={{background:S.cl,border:`1px solid ${S.pri}`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.ok,flexShrink:0}}/><p style={{fontSize:13,fontWeight:500,color:S.pl,margin:0}}>Em visita: {o?.name||o?.nickname}</p></div><p style={{fontSize:12,color:S.ts,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {el} min</p></div>);}

function NoteModal({org,onSave,onCancel}){
  const[n,setN]=useState("");const[tp,setTp]=useState("VISITA");const[nt,setNt]=useState("VISITA");const[nd,setNd]=useState("");const[nh,setNh]=useState("09:00");const[ndsc,setNdsc]=useState("");
  const ok=n.trim()&&nd&&ndsc.trim();
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div style={{background:S.card,borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px"}}>Registrar atividade</p>
  <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>{org?.name||org?.nickname}</p>
  <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>O que foi feito?</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>{TASK_TYPES.map(t=><button key={t.id} onClick={()=>setTp(t.id)} style={{padding:"7px 4px",fontSize:11,border:tp===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:tp===t.id?S.cl:S.bg,color:tp===t.id?S.pl:S.ts,fontWeight:tp===t.id?600:400}}>{t.label}</button>)}</div>
  <textarea value={n} onChange={e=>setN(e.target.value)} placeholder="Descreva o que aconteceu (obrigatorio)" rows={2} style={{width:"100%",marginBottom:12,border:`1px solid ${n.trim()?S.brd:S.dng}`}}/>
  <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:12}}>
    <p style={{fontSize:13,fontWeight:600,margin:"0 0 8px",color:S.acc}}>Proximo passo</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>{TASK_TYPES.map(t=><button key={t.id} onClick={()=>setNt(t.id)} style={{padding:"7px 4px",fontSize:11,border:nt===t.id?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:nt===t.id?S.cl:S.bg,color:nt===t.id?S.acc:S.ts,fontWeight:nt===t.id?600:400}}>{t.label}</button>)}</div>
    <div style={{display:"flex",gap:8,marginBottom:10}}>
      <input type="date" value={nd} min={new Date().toISOString().slice(0,10)} onChange={e=>setNd(e.target.value)} style={{flex:1,border:`1px solid ${nd?S.brd:S.dng}`}}/>
      <input type="time" value={nh} onChange={e=>setNh(e.target.value)} style={{width:100}}/>
    </div>
    <textarea value={ndsc} onChange={e=>setNdsc(e.target.value)} placeholder="Proximo contato (obrigatorio)" rows={2} style={{width:"100%",marginBottom:8,border:`1px solid ${ndsc.trim()?S.brd:S.dng}`}}/>
  </div>
  {!ok&&<p style={{fontSize:11,color:S.dng,margin:"0 0 8px"}}>Preencha todos os campos</p>}
  <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={()=>ok&&onSave(n,tp,{nextType:nt,nextDate:nd,nextTime:nh,nextDesc:ndsc})} disabled={!ok} style={{flex:1,background:ok?S.pri:S.cl,border:"none",fontWeight:600}}>Registrar</button></div>
</div></div>);}

function DayBaseModal({user,onSave,onCancel,title}){
  const home=HOMES[user?.id];const[tp,setTp]=useState("home");const[lo,setLo]=useState(false);const[hn,setHn]=useState("");
  const go=async()=>{if(tp==="home"&&home){onSave({type:"home",...home});return;}setLo(true);try{const g=await gps();onSave({type:tp,lat:g.lat,lng:g.lng,label:hn||"Hotel/Airbnb"});}catch{alert("GPS indisponivel.");}setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 16px"}}>{title||"Inicio da jornada"}</p>
  {["home","hotel"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:10,padding:12,border:`${tp===t?2:1}px solid ${tp===t?S.pri:S.brd}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:tp===t?S.cl:S.bg}}><input type="radio" checked={tp===t} onChange={()=>setTp(t)}/><span style={{fontWeight:500}}>{t==="home"?"Casa":"Hotel / Airbnb"}</span></label>)}
  {tp==="hotel"&&<input value={hn} onChange={e=>setHn(e.target.value)} placeholder="Nome do hotel" style={{width:"100%",marginBottom:8}}/>}
  <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Depois</button><button onClick={go} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"GPS...":"Confirmar"}</button></div>
</div></div>);}

function RotasTab({visits,dayBases,user}){
  const[sel,setSel]=useState(new Date().toISOString().slice(0,10));
  const[routes,setRoutes]=useState([]);const[lo,setLo]=useState(false);
  const home=HOMES[user?.id];const base=dayBases[sel]||home;
  const dv=useMemo(()=>{const t=new Date(sel+"T12:00:00").toDateString();return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));},[visits,sel]);
  const lunchI=useMemo(()=>{for(let i=0;i<dv.length-1;i++){if(hourDec(dv[i].checkoutTime)>=LUNCH_START&&hourDec(dv[i+1].checkinTime)<=LUNCH_END+1)return i;}return-1;},[dv]);
  useEffect(()=>{if(!dv.length){setRoutes([]);return;}let c=false;setLo(true);(async()=>{const s=[];if(base&&dv[0]?.lat){const r=await roadKm(base.lat,base.lng,dv[0].lat,dv[0].lng);s.push({f:base.label,t:dv[0].orgName,tp:"bs",...r});}for(let i=0;i<dv.length-1;i++){const a=dv[i],b=dv[i+1];if(a.lat&&b.lat){const r=await roadKm(a.checkoutLat||a.lat,a.checkoutLng||a.lng,b.lat,b.lng);s.push({f:a.orgName,t:b.orgName,tp:i===lunchI?"lch":"tr",...r});}}const last=dv[dv.length-1];if(base&&last?.lat){const r=await roadKm(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng);s.push({f:last.orgName,t:base.label,tp:"be",...r});}if(!c){setRoutes(s);setLo(false);}})();return()=>{c=true;};},[dv,base,lunchI]);
  const totKm=routes.reduce((s,r)=>s+r.km,0);const baseKm=routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0);
  const workH=dv.length?mins(dv[0].checkinTime,dv[dv.length-1].checkoutTime):0;
  const days=[...new Set(visits.filter(v=>v.checkoutTime).map(v=>new Date(v.checkinTime).toISOString().slice(0,10)))].sort().reverse().slice(0,30);
  return(<div>
    <select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:14}}><option value={new Date().toISOString().slice(0,10)}>Hoje — {fD(new Date())}</option>{days.filter(d=>d!==new Date().toISOString().slice(0,10)).map(d=><option key={d} value={d}>{fWD(d+"T12:00")} — {fD(d+"T12:00")}</option>)}</select>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Km total</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{totKm.toFixed(1)}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Jornada</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{hrsMin(workH)}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Visitas</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{dv.length}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Base ida+volta</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{baseKm.toFixed(1)}</p></div>
    </div>}
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}
    {!dv.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><p style={{fontSize:14,color:S.ts}}>Nenhuma visita neste dia</p></div>}
    {dv.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>
      {routes.find(r=>r.tp==="bs")&&<div style={{padding:"8px 16px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl,fontWeight:500}}>Casa → 1o PDV: {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</span></div>}
      {dv.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}><div style={{padding:"12px 16px",display:"flex",gap:12}}><div style={{width:26,height:26,borderRadius:"50%",background:S.pri+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:600,color:S.pl}}>{i+1}</span></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{fT(v.checkinTime)} → {fT(v.checkoutTime)} — {mins(v.checkinTime,v.checkoutTime)}min</p></div></div>{seg&&<div style={{padding:"4px 16px 4px 54px",background:seg.tp==="lch"?S.gold+"15":S.bg}}><span style={{fontSize:11,color:seg.tp==="lch"?S.gold:S.td}}>{seg.tp==="lch"?"Almoco: ":"↓ "}{seg.km.toFixed(1)} km</span></div>}</div>);})}
      {routes.find(r=>r.tp==="be")&&<div style={{padding:"8px 16px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl,fontWeight:500}}>Ultimo → Casa: {routes.find(r=>r.tp==="be").km.toFixed(1)} km</span></div>}
      <div style={{padding:"12px 16px",borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500,color:S.ts}}>Total</span><span style={{fontSize:15,fontWeight:600,color:S.pl}}>{totKm.toFixed(1)} km</span></div>
    </div>}
  </div>);
}

function RelatorioTab({visits,dayBases,user}){
  const[sd,setSd]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});
  const[ed,setEd]=useState(new Date().toISOString().slice(0,10));
  const home=HOMES[user?.id];
  const pv=useMemo(()=>visits.filter(v=>{if(!v.checkoutTime)return false;const d=new Date(v.checkinTime).toISOString().slice(0,10);return d>=sd&&d<=ed;}).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[visits,sd,ed]);
  const bd=useMemo(()=>{const m={};pv.forEach(v=>{const k=new Date(v.checkinTime).toISOString().slice(0,10);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pv]);
  const totKm=useMemo(()=>{let km=0;bd.forEach(([dt,dvs])=>{const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;if(b2&&s[0]?.lat)km+=hav(b2.lat,b2.lng,s[0].lat,s[0].lng)*1.3;for(let i=1;i<s.length;i++){if(s[i].lat&&s[i-1].lat)km+=hav(s[i-1].checkoutLat||s[i-1].lat,s[i-1].checkoutLng||s[i-1].lng,s[i].lat,s[i].lng)*1.3;}const l=s[s.length-1];if(b2&&l?.lat)km+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;});return km;},[bd,dayBases,home]);
  const totMin=pv.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const workH=bd.reduce((s,[,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));return s+mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime);},0);
  const mx=Math.max(1,...bd.map(([,v])=>v.length));
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}><input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{flex:1,fontSize:12}}/><span style={{color:S.td,fontSize:12}}>ate</span><input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{flex:1,fontSize:12}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Km total</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{totKm.toFixed(0)}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Visitas</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{pv.length}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Dias</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{bd.length}</p></div>
      <div style={{background:S.cl,borderRadius:10,padding:12}}><p style={{fontSize:11,color:S.ts,margin:"0 0 4px"}}>Jornada total</p><p style={{fontSize:20,fontWeight:600,margin:0}}>{hrsMin(workH)}</p></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <button onClick={()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km","Tempo PDV","Jornada","Clientes"]];bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;let dk=0;if(b2&&sr[0]?.lat)dk+=hav(b2.lat,b2.lng,sr[0].lat,sr[0].lng)*1.3;for(let i=1;i<sr.length;i++){if(sr[i].lat&&sr[i-1].lat)dk+=hav(sr[i-1].checkoutLat||sr[i-1].lat,sr[i-1].checkoutLng||sr[i-1].lng,sr[i].lat,sr[i].lng)*1.3;}const l=sr[sr.length-1];if(b2&&l?.lat)dk+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;rows.push([fD(dt+"T12:00"),user?.name,b2?.label||"",b2?.label||"",dvs.length,dk.toFixed(1),hrsMin(dvs.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0)),hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)),dvs.map(v=>v.orgName).join(", ")]);});rows.push([]);rows.push(["TOTAL","","","",pv.length,totKm.toFixed(1),hrsMin(totMin),hrsMin(workH),""]);csv(rows,`relatorio-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:12}}>Exportar Resumo</button>
      <button onClick={()=>{const rows=[["Data","In","Out","Min","Cliente","Cidade","Lat","Lng","Tipo","Obs"]];pv.forEach(v=>rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",v.lat?.toFixed(6)||"",v.lng?.toFixed(6)||"",v.taskType||"",v.note||""]));csv(rows,`visitas-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:12}}>Exportar Detalhado</button>
    </div>
    {bd.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"14px 16px"}}><p style={{fontWeight:500,fontSize:14,marginBottom:12}}>Visitas/dia</p>{bd.map(([dt,dvs])=><div key={dt} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:11,color:S.ts,width:50,textAlign:"right",flexShrink:0}}>{fDS(dt+"T12:00")}</span><div style={{flex:1,height:18,background:S.bg,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${(dvs.length/mx)*100}%`,background:S.pri,borderRadius:4,minWidth:4}}/></div><span style={{fontSize:12,fontWeight:600,width:20,textAlign:"right"}}>{dvs.length}</span></div>)}</div>}
  </div>);
}

export default function App(){
  const[token,setToken]=useState(()=>ld("jc:token",""));
  const[user,setUser]=useState(()=>ld("jc:user",null));
  const[orgs,setOrgs]=useState(()=>ld("jc:orgs",[]));
  const[visits,setVisits]=useState(()=>ld("jc:visits",[]));
  const[active,setActive]=useState(()=>ld("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[search,setSearch]=useState("");
  const[syncing,setSyncing]=useState(false);const[ldId,setLdId]=useState(null);
  const[geoErr,setGeoErr]=useState("");const[coTarget,setCoTarget]=useState(null);
  const[lastSync,setLastSync]=useState(localStorage.getItem("jc:lastSync")||"");
  const[plocs,setPlocs]=useState(()=>ld("jc:pdvLocs",{}));
  const[dayBases,setDayBases]=useState(()=>ld("jc:dayBases",{}));
  const[showDB,setShowDB]=useState(false);
  const[vc,setVc]=useState(PG);

  useEffect(()=>{sv("jc:visits",visits);},[visits]);
  useEffect(()=>{sv("jc:active",active);},[active]);
  useEffect(()=>{sv("jc:orgs",orgs);},[orgs]);
  useEffect(()=>{sv("jc:pdvLocs",plocs);},[plocs]);
  useEffect(()=>{sv("jc:dayBases",dayBases);},[dayBases]);
  useEffect(()=>{if(token&&user){const t=new Date().toISOString().slice(0,10);if(!dayBases[t])setShowDB(true);}},[token,user]);

  // 8 AM alert
  const[mAlert,setMAlert]=useState(false);
  useEffect(()=>{if(!token||!user)return;const ck=()=>{const h=new Date().getHours();const td=new Date().toDateString();const has=visits.some(v=>new Date(v.checkinTime).toDateString()===td)||active;setMAlert(h>=8&&h<12&&!has);};ck();const iv=setInterval(ck,300000);return()=>clearInterval(iv);},[token,user,visits,active]);
  // 2h reminder
  const[ar,setAr]=useState(false);
  useEffect(()=>{if(!active)return setAr(false);const ck=()=>{if(mins(active.checkinTime,new Date())>=120)setAr(true);};ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[active]);
  // Prev day
  const[pdr,setPdr]=useState(null);
  useEffect(()=>{if(!token||!user||!active)return;if(new Date(active.checkinTime).toDateString()!==new Date().toDateString())setPdr(active);},[token,user,active]);

  const loggedIn=!!(token&&user);
  const login=(t,u)=>{setToken(t);setUser(u);sv("jc:token",t);sv("jc:user",u);sync(t);};
  const logout=()=>{setToken("");setUser(null);sv("jc:token","");sv("jc:user",null);};
  const[syncMsg,setSyncMsg]=useState("");
  const sync=async(t)=>{setSyncing(true);setSyncMsg("Conectando...");try{let pg=1,all=[];while(true){setSyncMsg(`Carregando... ${all.length} clientes`);const d=await agF(`/organizations?page=${pg}&per_page=100`,t||token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}setOrgs(all);const now=new Date().toISOString();setLastSync(now);localStorage.setItem("jc:lastSync",now);setSyncMsg(`${all.length} clientes sincronizados`);}catch(e){setSyncMsg("Erro ao sincronizar. Tente novamente.");console.error(e);}setSyncing(false);};

  const checkin=async(org)=>{
    setLdId(org.id);setGeoErr("");
    try{const g=await gps();const v={orgId:org.id,orgName:org.name||org.nickname,city:org.address?.city_name||org.address?.city||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",synced:true};
      if(!plocs[org.id])setPlocs(p=>({...p,[org.id]:{lat:g.lat,lng:g.lng}}));
      else{const s=plocs[org.id];const d=hav(s.lat,s.lng,g.lat,g.lng)*1000;if(d>500){if(!confirm(`Voce esta a ${Math.round(d)}m do local cadastrado.\n\nContinuar?`)){setLdId(null);return;}}}
      setActive(v);
    }catch{setGeoErr("GPS indisponivel.");}setLdId(null);
  };

  const checkout=async(note,type="VISITA",next=null)=>{
    if(!active||ldId)return;setLdId(active.orgId);
    let g=null;try{g=await gps();}catch{}
    const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type};
    try{await postTask(token,active.orgId,note,type,true);done.synced=true;}catch{}
    if(next?.nextDate&&next?.nextDesc){try{await postTask(token,active.orgId,next.nextDesc,next.nextType||"VISITA",false,`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`);}catch{}}
    setVisits(p=>[done,...p]);setActive(null);setCoTarget(null);setLdId(null);
  };

  const fo=orgs.filter(o=>{const q=search.toLowerCase();return(o.name||"").toLowerCase().includes(q)||(o.nickname||"").toLowerCase().includes(q)||(o.cnpj||"").includes(q)||(o.address?.city||"").toLowerCase().includes(q)||(o.address?.city_name||"").toLowerCase().includes(q)||(o.address?.district||"").toLowerCase().includes(q);}).sort((a,b)=>(a.name||a.nickname||"").localeCompare(b.name||b.nickname||""));

  if(!loggedIn)return <Login onLogin={login}/>;
  const tabs=[{id:"pdvs",i:"🏪",l:"PDVs"},{id:"rotas",i:"🛣️",l:"Rotas"},{id:"relatorio",i:"📊",l:"Relatório"},{id:"config",i:"⚙️",l:"Config"}];

  return(<div style={{minHeight:"100vh",paddingBottom:70}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <img src="/logo.png" alt="" style={{height:30}} onError={e=>{e.target.style.display="none"}}/>
        <div><p style={{fontSize:14,fontWeight:600,margin:0}}>Check-in</p><p style={{fontSize:11,color:S.ts,margin:0}}>{user?.name} — {fD(new Date())}</p></div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {!dayBases[new Date().toISOString().slice(0,10)]&&<button onClick={()=>setShowDB(true)} style={{padding:"4px 8px",fontSize:11,borderColor:S.gold,color:S.gold}}>Base</button>}
        {tab==="pdvs"&&<button onClick={()=>sync()} disabled={syncing} style={{padding:"6px 12px",fontSize:14,fontWeight:500}}>{syncing?"...":"🔄 Sinc"}</button>}
      </div>
    </div>
    <div style={{padding:"0 16px"}}>
      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><p style={{fontSize:13,color:S.gold,margin:0}}>Bom dia! Atividades nao iniciadas.</p></div>}
      {pdr&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>Visita aberta: {fD(pdr.checkinTime)} — {pdr.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(pdr.checkinTime);c.setHours(18);setVisits(p=>[{...pdr,checkoutTime:c.toISOString(),note:"Auto",synced:false},...p]);setActive(null);setPdr(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:pdr.orgId,name:pdr.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {ar&&!pdr&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><p style={{fontSize:13,color:S.gold,margin:"0 0 8px"}}>Visita ativa ha 2h+ — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs}/>}
      <div style={{display:"flex",gap:3,marginBottom:14,background:S.cl,borderRadius:8,padding:3}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",background:tab===t.id?S.pri:"transparent",borderRadius:6,padding:"8px 4px",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#fff":S.ts}}><span style={{fontSize:16,display:"block",marginBottom:2}}>{t.i}</span>{t.l}</button>)}</div>

      {tab==="pdvs"&&<div>
        {syncing&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:40,height:40,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 1s linear infinite"}}/><p style={{fontSize:14,color:S.ts,margin:"0 0 8px"}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&orgs.length===0&&<div style={{textAlign:"center",padding:"3rem 0"}}><p style={{fontSize:40,marginBottom:12}}>🏪</p><p style={{fontSize:16,marginBottom:4}}>Nenhum cliente carregado</p><p style={{fontSize:13,color:S.ts,margin:"0 0 20px"}}>{syncMsg||"Sincronize para carregar seus PDVs do Agendor"}</p><button onClick={()=>sync()} style={{width:"100%",padding:"16px",fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>🔄 Sincronizar Clientes do Agendor</button></div>}
        {!syncing&&orgs.length>0&&<>
          <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Buscar cliente, CNPJ, cidade, bairro..." style={{width:"100%",marginBottom:10}}/>
          {geoErr&&<div style={{background:S.dng+"18",borderRadius:8,padding:"8px 12px",marginBottom:10}}><p style={{fontSize:12,color:S.dng,margin:0}}>{geoErr}</p></div>}
          <p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>{fo.length} PDVs{lastSync&&` — sinc. ${fT(lastSync)}`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={checkin} onOut={o2=>setCoTarget(o2)} ldId={ldId} plocs={plocs}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:"14px",fontSize:14,fontWeight:500,textAlign:"center"}}>Ver mais ({fo.length-vc} restantes)</button>}
        </>}
      </div>}
      {tab==="rotas"&&<RotasTab visits={visits} dayBases={dayBases} user={user}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user}/>}
      {tab==="config"&&<div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:13,color:S.ts,margin:"0 0 2px"}}>Conectado como</p><p style={{fontSize:15,fontWeight:600,margin:0}}>{user?.name}</p>{HOMES[user?.id]&&<p style={{fontSize:12,color:S.ok,marginTop:4}}>Casa: {HOMES[user.id].label}</p>}</div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:13,color:S.ts,margin:"0 0 4px"}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p>{lastSync&&<p style={{fontSize:12,color:S.td,margin:0}}>Sinc: {fD(lastSync)} {fT(lastSync)}</p>}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <button onClick={()=>sync()} disabled={syncing} style={{width:"100%",padding:"14px",fontSize:14,fontWeight:500,background:syncing?S.cl:S.pri,border:"none"}}>{syncing?syncMsg:"🔄 Sincronizar Clientes"}</button>
          <button onClick={()=>setShowDB(true)}>Definir base do dia</button>
          {user?.id===743088&&<><button onClick={()=>confirm("Limpar visitas?")&&(setVisits([]),sv("jc:visits",[]))} style={{color:S.gold}}>Limpar visitas</button><button onClick={()=>confirm("Limpar GPS?")&&(setPlocs({}),sv("jc:pdvLocs",{}))} style={{color:S.gold}}>Limpar GPS PDVs</button></>}
          <button onClick={logout} style={{color:S.dng}}>Desconectar</button>
        </div>
        <p style={{fontSize:11,color:S.td,padding:"8px 12px",background:S.cl,borderRadius:8}}>Jordan Check-in v4 — Agendor + OSRM + Cloudflare</p>
      </div>}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.card,borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"center",zIndex:40}}><div style={{display:"flex",maxWidth:480,width:"100%"}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?S.pl:S.td}}><span style={{fontSize:18,display:"block",marginBottom:2}}>{t.i}</span>{t.l}</button>)}</div></div>
    {coTarget&&<NoteModal org={coTarget} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {showDB&&<DayBaseModal user={user} onSave={b=>{const t=new Date().toISOString().slice(0,10);setDayBases(p=>{const n={...p,[t]:b};sv("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
  </div>);
}
