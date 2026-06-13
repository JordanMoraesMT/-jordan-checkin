import { useState, useEffect, useMemo, useCallback } from "react";

const API = "https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const HOMES = { 743088:{lat:-15.677694,lng:-55.954778,label:"Casa Jordan"}, 743347:{lat:-15.653611,lng:-56.026833,label:"Casa Alisson"} };
const LUNCH_START=12, LUNCH_END=13;
const TYPES=[{id:"VISITA",l:"Visita"},{id:"LIGACAO",l:"Ligação"},{id:"EMAIL",l:"E-mail"},{id:"REUNIAO",l:"Reunião"},{id:"WHATSAPP",l:"WhatsApp"},{id:"PROPOSTA",l:"Proposta"}];
const CATS=["Ativo","Prospecção","Somente Visita","Inativo","Online - B2B"];
const PG=20;
const S={bg:"#0F1B2D",card:"#162236",cl:"#1C2E47",pri:"#0578A6",pl:"#0890C2",acc:"#2A9D8F",gold:"#C8964E",dng:"#DC2626",txt:"#E8ECF1",ts:"#8899AB",td:"#5A6B7D",brd:"#243349",ok:"#10B981"};

const fT=d=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fD=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fDS=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin=m=>m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m}min`;
const hourDec=d=>{const t=new Date(d);return t.getHours()+t.getMinutes()/60;};
const hav=(a,b,c,d)=>{const R=6371,x=((c-a)*Math.PI)/180,y=((d-b)*Math.PI)/180;const z=Math.sin(x/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};

function sLoad(k,f){try{return JSON.parse(localStorage.getItem(k))||f;}catch{return f;}}
function sSave(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

async function agF(path,token,opts={}){const p=path.startsWith("/")?path.slice(1):path;const r=await fetch(`${API}?path=${encodeURIComponent(p)}`,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
async function postTask(token,oid,text,type="VISITA",done=true,due=null){const b={text,type,done};if(due)b.due_date=due;return agF(`/organizations/${oid}/tasks`,token,{method:"POST",body:JSON.stringify(b)});}
function gps(){return new Promise((r,j)=>{if(!navigator.geolocation)return j(new Error("GPS"));navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),j,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
async function roadKm(a,b,c,d){try{const r=await fetch(`${OSRM}/${b},${a};${d},${c}?overview=false`);const j=await r.json();if(j.code==="Ok"&&j.routes?.[0])return{km:j.routes[0].distance/1000,dur:Math.round(j.routes[0].duration/60)};}catch{}return{km:hav(a,b,c,d)*1.3,dur:0};}
function csv(rows,fn){const b="\uFEFF"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");const u=URL.createObjectURL(new Blob([b],{type:"text/csv;charset=utf-8"}));Object.assign(document.createElement("a"),{href:u,download:fn}).click();URL.revokeObjectURL(u);}

function strip(o){return{id:o.id,name:o.name||"",nickname:o.nickname||"",cnpj:o.cnpj||"",cat:o.category?.name||"",sector:o.sector?.name||"",products:(o.products||[]).map(p=>p.name).join(", "),owner:o.ownerUser?.name||"",addr:o.address||{},people:(o.people||[]).map(p=>p.name).join(", ")};}

// ─── Login ───
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

// ─── OrgCard ───
function OrgCard({org,active,onIn,onOut,ldId,plocs}){
  const isA=active?.orgId===org.id;const a=org.addr||{};
  const info=[a.district||a.neighborhood,a.city_name||a.city,a.state].filter(Boolean).join(" · ");
  const catColor=org.cat==="Ativo"?S.ok:org.cat==="Inativo"?S.dng:org.cat==="Online - B2B"?S.gold:S.acc;
  return(<div style={{background:isA?S.cl:S.card,border:`${isA?2:1}px solid ${isA?S.pri:S.brd}`,borderRadius:12,padding:"12px 14px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontWeight:500,fontSize:14,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{plocs[org.id]?<span style={{color:S.ok,fontSize:10,marginRight:4}}>●</span>:null}{org.name||org.nickname}</p>
        {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 1px"}}>{org.cnpj}</p>}
        {info&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{info}</p>}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
          {org.cat&&<span style={{fontSize:9,color:catColor,background:catColor+"18",padding:"1px 6px",borderRadius:4}}>{org.cat}</span>}
          {org.sector&&<span style={{fontSize:9,color:S.ts,background:S.bg,padding:"1px 6px",borderRadius:4}}>{org.sector}</span>}
        </div>
      </div>
      {isA?<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{background:S.dng,border:"none",fontSize:12,fontWeight:500,padding:"8px 14px",whiteSpace:"nowrap"}}>{ldId===org.id?"...":"Check-out"}</button>
      :<button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{background:active?S.cl:S.acc,border:"none",fontSize:12,fontWeight:500,padding:"8px 14px",whiteSpace:"nowrap",opacity:active?0.4:1}}>{ldId===org.id?"...":"Check-in"}</button>}
    </div>
    {isA&&<p style={{fontSize:12,color:S.pl,margin:"8px 0 0",paddingTop:8,borderTop:`1px solid ${S.brd}`}}>Em visita desde {fT(active.checkinTime)}</p>}
  </div>);
}

function Banner({v,orgs}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);
  return(<div style={{background:S.cl,border:`1px solid ${S.pri}`,borderRadius:12,padding:"10px 14px",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.ok}}/><p style={{fontSize:13,fontWeight:500,color:S.pl,margin:0}}>Em visita: {o?.name||o?.nickname||v.orgName}</p></div><p style={{fontSize:12,color:S.ts,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {el} min</p></div>);}

function NoteModal({org,onSave,onCancel}){
  const[n,setN]=useState("");const[tp,setTp]=useState("VISITA");const[nt,setNt]=useState("VISITA");const[nd,setNd]=useState("");const[nh,setNh]=useState("09:00");const[ndsc,setNdsc]=useState("");
  const ok=n.trim()&&nd&&ndsc.trim();
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div style={{background:S.card,borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 8px"}}>Registrar atividade</p>
  <p style={{fontSize:12,color:S.ts,margin:"0 0 10px"}}>{org?.name||org?.nickname}</p>
  <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>O que foi feito?</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>{TYPES.map(t=><button key={t.id} onClick={()=>setTp(t.id)} style={{padding:"6px 2px",fontSize:10,border:tp===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:tp===t.id?S.cl:S.bg,color:tp===t.id?S.pl:S.ts,fontWeight:tp===t.id?600:400}}>{t.l}</button>)}</div>
  <textarea value={n} onChange={e=>setN(e.target.value)} placeholder="Descreva o que aconteceu (obrigatorio)" rows={2} style={{width:"100%",marginBottom:10,border:`1px solid ${n.trim()?S.brd:S.dng}`}}/>
  <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:10}}>
    <p style={{fontSize:12,fontWeight:600,margin:"0 0 6px",color:S.acc}}>Proximo passo</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>{TYPES.map(t=><button key={t.id} onClick={()=>setNt(t.id)} style={{padding:"6px 2px",fontSize:10,border:nt===t.id?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:nt===t.id?S.cl:S.bg,color:nt===t.id?S.acc:S.ts,fontWeight:nt===t.id?600:400}}>{t.l}</button>)}</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}><input type="date" value={nd} min={new Date().toISOString().slice(0,10)} onChange={e=>setNd(e.target.value)} style={{flex:1,border:`1px solid ${nd?S.brd:S.dng}`}}/><input type="time" value={nh} onChange={e=>setNh(e.target.value)} style={{width:90}}/></div>
    <textarea value={ndsc} onChange={e=>setNdsc(e.target.value)} placeholder="Proximo contato (obrigatorio)" rows={2} style={{width:"100%",marginBottom:6,border:`1px solid ${ndsc.trim()?S.brd:S.dng}`}}/>
  </div>
  {!ok&&<p style={{fontSize:11,color:S.dng,margin:"4px 0 6px"}}>Preencha todos os campos</p>}
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
  const[sel,setSel]=useState(new Date().toISOString().slice(0,10));const[routes,setRoutes]=useState([]);const[lo,setLo]=useState(false);
  const home=HOMES[user?.id];const base=dayBases[sel]||home;
  const dv=useMemo(()=>{const t=new Date(sel+"T12:00:00").toDateString();return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));},[visits,sel]);
  useEffect(()=>{if(!dv.length){setRoutes([]);return;}let c=false;setLo(true);(async()=>{const s=[];if(base&&dv[0]?.lat)s.push({f:base.label,t:dv[0].orgName,tp:"bs",...await roadKm(base.lat,base.lng,dv[0].lat,dv[0].lng)});for(let i=0;i<dv.length-1;i++){const a=dv[i],b=dv[i+1];if(a.lat&&b.lat)s.push({f:a.orgName,t:b.orgName,tp:hourDec(a.checkoutTime)>=LUNCH_START&&hourDec(b.checkinTime)<=LUNCH_END+1?"lch":"tr",...await roadKm(a.checkoutLat||a.lat,a.checkoutLng||a.lng,b.lat,b.lng)});}const last=dv[dv.length-1];if(base&&last?.lat)s.push({f:last.orgName,t:base.label,tp:"be",...await roadKm(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)});if(!c){setRoutes(s);setLo(false);}})();return()=>{c=true;};},[dv,base]);
  const totKm=routes.reduce((s,r)=>s+r.km,0);const workH=dv.length?mins(dv[0].checkinTime,dv[dv.length-1].checkoutTime):0;
  const days=[...new Set(visits.filter(v=>v.checkoutTime).map(v=>new Date(v.checkinTime).toISOString().slice(0,10)))].sort().reverse().slice(0,30);
  return(<div>
    <select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:14}}><option value={new Date().toISOString().slice(0,10)}>Hoje — {fD(new Date())}</option>{days.filter(d=>d!==new Date().toISOString().slice(0,10)).map(d=><option key={d} value={d}>{fD(d+"T12:00")}</option>)}</select>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>{[["Km total",totKm.toFixed(1)],["Jornada",hrsMin(workH)],["Visitas",dv.length],["Base km",routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0).toFixed(1)]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}</div>}
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}
    {!dv.length&&!lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita neste dia</p>}
    {dv.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>
      {routes.find(r=>r.tp==="bs")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Casa → 1o PDV: {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</span></div>}
      {dv.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}><div style={{padding:"10px 14px",display:"flex",gap:10}}><div style={{width:24,height:24,borderRadius:"50%",background:S.pri+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:600,color:S.pl}}>{i+1}</span></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{fT(v.checkinTime)}→{fT(v.checkoutTime)} {mins(v.checkinTime,v.checkoutTime)}min</p></div></div>{seg&&<div style={{padding:"4px 14px 4px 48px",background:seg.tp==="lch"?S.gold+"15":S.bg}}><span style={{fontSize:11,color:seg.tp==="lch"?S.gold:S.td}}>{seg.tp==="lch"?"Almoco ":"↓ "}{seg.km.toFixed(1)}km</span></div>}</div>);})}
      {routes.find(r=>r.tp==="be")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Ultimo → Casa: {routes.find(r=>r.tp==="be").km.toFixed(1)} km</span></div>}
      <div style={{padding:"10px 14px",borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"space-between"}}><span style={{color:S.ts}}>Total</span><span style={{fontSize:15,fontWeight:600,color:S.pl}}>{totKm.toFixed(1)} km</span></div>
    </div>}
  </div>);
}

function RelatorioTab({visits,dayBases,user}){
  const[sd,setSd]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});const[ed,setEd]=useState(new Date().toISOString().slice(0,10));
  const home=HOMES[user?.id];
  const pv=useMemo(()=>visits.filter(v=>{if(!v.checkoutTime)return false;const d=new Date(v.checkinTime).toISOString().slice(0,10);return d>=sd&&d<=ed;}).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[visits,sd,ed]);
  const bd=useMemo(()=>{const m={};pv.forEach(v=>{const k=new Date(v.checkinTime).toISOString().slice(0,10);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pv]);
  const totKm=useMemo(()=>{let km=0;bd.forEach(([dt,dvs])=>{const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;if(b2&&s[0]?.lat)km+=hav(b2.lat,b2.lng,s[0].lat,s[0].lng)*1.3;for(let i=1;i<s.length;i++)if(s[i].lat&&s[i-1].lat)km+=hav(s[i-1].checkoutLat||s[i-1].lat,s[i-1].checkoutLng||s[i-1].lng,s[i].lat,s[i].lng)*1.3;const l=s[s.length-1];if(b2&&l?.lat)km+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;});return km;},[bd,dayBases,home]);
  const totMin=pv.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);
  const workH=bd.reduce((s,[,d])=>{const sr=[...d].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));return s+mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime);},0);
  const mx=Math.max(1,...bd.map(([,v])=>v.length));
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}><input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{flex:1,fontSize:12}}/><span style={{color:S.td}}>ate</span><input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{flex:1,fontSize:12}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[["Km total",totKm.toFixed(0)],["Visitas",pv.length],["Dias",bd.length],["Jornada",hrsMin(workH)]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}</div>
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      <button onClick={()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km","Jornada","Clientes"]];bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;let dk=0;if(b2&&sr[0]?.lat)dk+=hav(b2.lat,b2.lng,sr[0].lat,sr[0].lng)*1.3;for(let i=1;i<sr.length;i++)if(sr[i].lat&&sr[i-1].lat)dk+=hav(sr[i-1].checkoutLat||sr[i-1].lat,sr[i-1].checkoutLng||sr[i-1].lng,sr[i].lat,sr[i].lng)*1.3;const l=sr[sr.length-1];if(b2&&l?.lat)dk+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;rows.push([fD(dt+"T12:00"),user?.name,b2?.label||"",b2?.label||"",dvs.length,dk.toFixed(1),hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)),dvs.map(v=>v.orgName).join(", ")]);});rows.push([],["TOTAL","","","",pv.length,totKm.toFixed(1),hrsMin(workH),""]);csv(rows,`km-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:12}}>Exportar Resumo</button>
      <button onClick={()=>{const rows=[["Data","In","Out","Min","Cliente","Cidade","Tipo","Obs"]];pv.forEach(v=>rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",v.taskType||"",v.note||""]));csv(rows,`visitas-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:12}}>Exportar Detalhado</button>
    </div>
    {bd.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px"}}><p style={{fontWeight:500,marginBottom:10}}>Visitas/dia</p>{bd.map(([dt,dvs])=><div key={dt} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,color:S.ts,width:45,textAlign:"right"}}>{fDS(dt+"T12:00")}</span><div style={{flex:1,height:16,background:S.bg,borderRadius:3}}><div style={{height:"100%",width:`${(dvs.length/mx)*100}%`,background:S.pri,borderRadius:3,minWidth:3}}/></div><span style={{fontSize:11,fontWeight:600,width:18,textAlign:"right"}}>{dvs.length}</span></div>)}</div>}
  </div>);
}

// ─── MAIN ───
export default function App(){
  const[token,setToken]=useState(()=>sLoad("jc:token",""));
  const[user,setUser]=useState(()=>sLoad("jc:user",null));
  const[orgs,setOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>sLoad("jc:visits",[]));
  const[active,setActive]=useState(()=>sLoad("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[search,setSearch]=useState("");const[catFilter,setCatFilter]=useState("Todos");
  const[syncing,setSyncing]=useState(false);const[syncMsg,setSyncMsg]=useState("");
  const[ldId,setLdId]=useState(null);const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);
  const[plocs,setPlocs]=useState(()=>sLoad("jc:pdvLocs",{}));
  const[dayBases,setDayBases]=useState(()=>sLoad("jc:dayBases",{}));
  const[showDB,setShowDB]=useState(false);
  const[vc,setVc]=useState(PG);

  useEffect(()=>{sSave("jc:visits",visits);},[visits]);
  useEffect(()=>{sSave("jc:active",active);},[active]);
  useEffect(()=>{sSave("jc:pdvLocs",plocs);},[plocs]);
  useEffect(()=>{sSave("jc:dayBases",dayBases);},[dayBases]);

  // Auto-sync on login
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  const doSync=async(t)=>{
    setSyncing(true);setSyncMsg("Conectando...");
    try{
      let pg=1,all=[];
      while(true){
        setSyncMsg(`${all.length} clientes carregados...`);
        const d=await agF(`/organizations?page=${pg}&per_page=100`,t||token);
        if(!d.data?.length)break;
        const stripped=d.data.map(strip);
        all.push(...stripped);
        setOrgs([...all]); // Show results as they load
        if(d.data.length<100)break;pg++;
      }
      setSyncMsg(`${all.length} clientes`);
    }catch(e){setSyncMsg("Erro: "+e.message);}
    setSyncing(false);
  };

  // Ask base on first interaction (not auto)
  const ensureBase=()=>{const t=new Date().toISOString().slice(0,10);if(!dayBases[t])setShowDB(true);};

  const checkin=async(org)=>{
    ensureBase();
    setLdId(org.id);setGeoErr("");
    try{const g=await gps();const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||org.addr?.city||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",synced:true};
      if(!plocs[org.id])setPlocs(p=>({...p,[org.id]:{lat:g.lat,lng:g.lng}}));
      else{const s=plocs[org.id];const d=hav(s.lat,s.lng,g.lat,g.lng)*1000;if(d>500&&!confirm(`Voce esta a ${Math.round(d)}m do local cadastrado.\n\nContinuar?`)){setLdId(null);return;}}
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

  // Search: CNPJ, name, city, sector, category, products
  const fo=useMemo(()=>{
    let list=orgs;
    if(catFilter!=="Todos")list=list.filter(o=>o.cat===catFilter);
    if(search.trim()){
      const q=search.toLowerCase().replace(/[.\-\/]/g,"");
      list=list.filter(o=>{
        const txt=[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ").toLowerCase();
        return txt.includes(q);
      });
    }
    return list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  },[orgs,search,catFilter]);

  // CNPJ online search
  const[cnpjSearch,setCnpjSearch]=useState(false);
  const searchCNPJ=async()=>{
    const q=search.replace(/[.\-\/]/g,"");
    if(q.length<11)return;
    setCnpjSearch(true);
    try{const d=await agF(`/organizations?cnpj=${q}`,token);if(d.data?.length){const found=d.data.map(strip);setOrgs(prev=>{const ids=new Set(prev.map(o=>o.id));const newOnes=found.filter(f=>!ids.has(f.id));return[...newOnes,...prev];});}}catch{}
    setCnpjSearch(false);
  };

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sSave("jc:token",t);sSave("jc:user",u);}}/>;

  const tabs=[{id:"pdvs",i:"🏪",l:"PDVs"},{id:"rotas",i:"🛣️",l:"Rotas"},{id:"relatorio",i:"📊",l:"Relatório"},{id:"config",i:"⚙️",l:"Config"}];

  return(<div style={{minHeight:"100vh",paddingBottom:70}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <img src="/logo.png" alt="" style={{height:28}} onError={e=>{e.target.style.display="none"}}/>
        <div><p style={{fontSize:14,fontWeight:600,margin:0}}>Check-in</p><p style={{fontSize:11,color:S.ts,margin:0}}>{user?.name} — {fD(new Date())}</p></div>
      </div>
      <button onClick={()=>doSync()} disabled={syncing} style={{padding:"8px 14px",fontSize:13,fontWeight:500,background:syncing?S.cl:S.pri,border:"none"}}>{syncing?"...":"🔄 Sinc"}</button>
    </div>
    <div style={{padding:"0 16px"}}>
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs}/>}

      <div style={{display:"flex",gap:3,marginBottom:12,background:S.cl,borderRadius:8,padding:3}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",background:tab===t.id?S.pri:"transparent",borderRadius:6,padding:"7px 2px",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#fff":S.ts}}><span style={{fontSize:15,display:"block",marginBottom:1}}>{t.i}</span>{t.l}</button>)}</div>

      {tab==="pdvs"&&<div>
        <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, CNPJ, cidade, segmento, produto..." style={{width:"100%",marginBottom:8}}/>
        
        <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
          {["Todos",...CATS].map(c=><button key={c} onClick={()=>{setCatFilter(c);setVc(PG);}} style={{padding:"4px 10px",fontSize:10,whiteSpace:"nowrap",border:catFilter===c?`1px solid ${S.pri}`:`1px solid ${S.brd}`,background:catFilter===c?S.pri:"transparent",color:catFilter===c?"#fff":S.ts,fontWeight:catFilter===c?600:400,borderRadius:20}}>{c}</button>)}
        </div>

        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}

        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}

        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><p style={{fontSize:16,marginBottom:8}}>Nenhum cliente carregado</p><button onClick={()=>doSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}

        {orgs.length>0&&<>
          <p style={{fontSize:11,color:S.td,margin:"0 0 6px"}}>{fo.length} de {orgs.length} PDVs {syncing&&<span style={{color:S.pri}}>({syncMsg})</span>}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={checkin} onOut={o2=>setCoTarget(o2)} ldId={ldId} plocs={plocs}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc} restantes)</button>}
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={searchCNPJ} disabled={cnpjSearch} style={{width:"100%",marginTop:12,padding:14,fontSize:14,background:S.acc,border:"none",fontWeight:500}}>{cnpjSearch?"Buscando...":"Buscar CNPJ no Agendor"}</button>}
        </>}
      </div>}

      {tab==="rotas"&&<RotasTab visits={visits} dayBases={dayBases} user={user}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user}/>}

      {tab==="config"&&<div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:15,fontWeight:600,margin:"0 0 4px"}}>{user?.name}</p>{HOMES[user?.id]&&<p style={{fontSize:12,color:S.ok}}>Casa: {HOMES[user.id].label}</p>}</div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:12,color:S.ts}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p></div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <button onClick={()=>doSync()} disabled={syncing} style={{padding:14,fontSize:14,fontWeight:500,background:S.pri,border:"none"}}>{syncing?syncMsg:"Sincronizar Clientes"}</button>
          <button onClick={()=>setShowDB(true)} style={{padding:12}}>Definir base do dia</button>
          {user?.id===743088&&<><button onClick={()=>confirm("Limpar visitas?")&&(setVisits([]),sSave("jc:visits",[]))} style={{color:S.gold}}>Limpar visitas</button><button onClick={()=>confirm("Limpar GPS?")&&(setPlocs({}),sSave("jc:pdvLocs",{}))} style={{color:S.gold}}>Limpar GPS</button></>}
          <button onClick={()=>{setToken("");setUser(null);setOrgs([]);sSave("jc:token","");sSave("jc:user",null);}} style={{color:S.dng}}>Desconectar</button>
        </div>
      </div>}
    </div>

    <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.card,borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"center",zIndex:40}}><div style={{display:"flex",maxWidth:480,width:"100%"}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?S.pl:S.td}}><span style={{fontSize:18,display:"block",marginBottom:2}}>{t.i}</span>{t.l}</button>)}</div></div>

    {coTarget&&<NoteModal org={coTarget} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {showDB&&<DayBaseModal user={user} onSave={b=>{const t=new Date().toISOString().slice(0,10);setDayBases(p=>{const n={...p,[t]:b};sSave("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
  </div>);
}
