import { useState, useEffect, useMemo } from "react";
const API="https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM="https://router.project-osrm.org/route/v1/driving";
const HOMES={743088:{lat:-15.677694,lng:-55.954778,label:"Casa Jordan"},743347:{lat:-15.653611,lng:-56.026833,label:"Casa Alisson"}};
const LUNCH_START=12,LUNCH_END=13,PG=20;
// ─── Timezone: Cuiabá (UTC-4, sem horário de verão) ───
const TZ="America/Cuiaba";
const toLocalDate=(d)=>{const dt=new Date(d);return dt.toLocaleDateString("en-CA",{timeZone:TZ});};// YYYY-MM-DD
const todayLocal=()=>toLocalDate(new Date());
const TYPES=[{id:"VISITA",l:"Visita"},{id:"LIGACAO",l:"Ligação"},{id:"EMAIL",l:"E-mail"},{id:"REUNIAO",l:"Reunião"},{id:"WHATSAPP",l:"WhatsApp"},{id:"PROPOSTA",l:"Proposta"}];
const CATS=["Ativo","Prospecção","Somente Visita","Inativo","Online - B2B","Excluido"];
const BRANDS=["TRAMONTINA","PADO","ZAGONEL","RUVOLO","SANTANA","FESTCOLOR","PLASTILIT"];
const SECTORS=[{id:4512997,n:"Açougues"},{id:4513651,n:"Agropecuarias"},{id:4513000,n:"Atacados"},{id:4512998,n:"Decoração"},{id:4513649,n:"Eletromoveis"},{id:4724740,n:"Embalagens"},{id:4513001,n:"Garden"},{id:4512999,n:"Mat. Construção"},{id:4513019,n:"Outros"},{id:4513020,n:"Papelaria"},{id:4513650,n:"Presenteiros"},{id:4512995,n:"Supermercados"},{id:4512996,n:"Variedades"}];
const CAT_IDS=[{id:3186598,n:"Ativo"},{id:3186011,n:"Prospecção"},{id:3186601,n:"Somente Visita"},{id:3186600,n:"Inativo"},{id:4136717,n:"Online - B2B"},{id:3187967,n:"Excluido"}];
const ORIGINS=[{id:1981672,n:"Carteira"},{id:1979723,n:"Indicação"},{id:1980476,n:"Prospecção"},{id:1979725,n:"Site"},{id:1980477,n:"Instagram"},{id:1980478,n:"Leads"}];
const USERS=[{id:743088,n:"Jordan Moraes"},{id:743347,n:"Alisson Henrique"}];
const CC={Ativo:"#10B981",Inativo:"#F59E0B","Online - B2B":"#0578A6","Somente Visita":"#EC4899",Prospecção:"#8B5CF6",Excluido:"#DC2626"};
const CITY_GEO={"Cuiabá":[-15.5989,-56.0949],"Cuiaba":[-15.5989,-56.0949],"Várzea Grande":[-15.6460,-56.1322],"Varzea Grande":[-15.6460,-56.1322],"Tangará da Serra":[-14.6229,-57.4947],"Tangara da Serra":[-14.6229,-57.4947],"Cáceres":[-16.0725,-57.6770],"Caceres":[-16.0725,-57.6770],"Pontes e Lacerda":[-15.2264,-59.3411],"Campo Novo do Parecis":[-13.6629,-57.8914],"Campo Novo dos Parecis":[-13.6629,-57.8914],"Campo Verde":[-15.5444,-55.1628],"Rondonópolis":[-16.4673,-54.6372],"Rondonopolis":[-16.4673,-54.6372],"Mirassol d Oeste":[-15.6779,-58.0948],"Primavera do Leste":[-15.5615,-54.2817],"Sapezal":[-12.9878,-58.7652],"Araputanga":[-15.4723,-58.3438],"São José dos Quatro Marcos":[-15.6270,-58.1755],"Sorriso":[-12.5428,-55.7112],"Sinop":[-11.8642,-55.5095],"Lucas do Rio Verde":[-13.0490,-55.9048],"Nova Mutum":[-13.8321,-56.0813],"Barra do Garças":[-15.8867,-52.2566],"Diamantino":[-14.4080,-56.4437],"Poconé":[-16.2558,-56.6232],"Jaciara":[-15.9620,-54.9696]};
const BRG={"ubirajara":"O","ribeirao do lipa":"O","colorado":"O","mariana":"O","santa marta":"O","despraiado":"O","quilombo":"O","duque de caxias":"O","ribeirao da ponte":"O","santa rosa":"O","barra do pari":"O","santa isabel":"O","cidade verde":"O","cidade alta":"O","jardim cuiaba":"O","goiabeira":"O","popular":"O","centro-norte":"O","centro norte":"O","centro-sul":"O","centro sul":"O","porto":"O","coophamil":"O","novo terceiro":"O","araes":"O","alvorada":"O","florianopolis":"N","vitoria":"N","paraiso":"N","nova conquista":"N","primeiro de marco":"N","tres barras":"N","morada da serra":"N","morada do ouro":"N","centro politico":"N","paiaguas":"N","cpa":"N","novo tempo":"N","fabio leite":"N","novo horizonte":"L","planalto":"L","itamarati":"L","novo mato grosso":"L","sol nascente":"L","eldorado":"L","sao carlos":"L","sao roque":"L","santa ines":"L","carumbe":"L","bela vista":"L","dom bosco":"L","terra nova":"L","aclimacao":"L","canjica":"L","bosque da saude":"L","bau":"L","lixeira":"L","bandeirantes":"L","areao":"L","leblon":"L","pedregal":"L","italia":"L","morada dos nobres":"L","santa cruz":"L","recanto dos passaros":"L","imperial":"L","universitario":"L","cachoeira das garcas":"L","boa esperanca":"L","ufmt":"L","americas":"L","pico do amor":"L","pocao":"L","dom aquino":"L","terceiro":"L","paulista":"L","europa":"L","campo velho":"L","tropical":"L","petropolis":"L","california":"L","shangri":"L","praeiro":"L","ana pupina":"L","osmar cabral":"S","sao joao del rei":"S","fortaleza":"S","santa laura":"S","sao sebastiao":"S","pascoal ramos":"S","pedra 90":"S","pedra noventa":"S","nova esperanca":"S","industriario":"S","passaredo":"S","sao francisco":"S","lagoa azul":"S","tijucal":"S","altos do coxipo":"S","presidente":"S","coxipo":"S","sao jose":"S","ohara":"S","palmeiras":"S","jordao":"S","vista alegre":"S","gramado":"S","coophema":"S","sao goncalo":"S","georgia":"S","aparecida":"S","comodoro":"S","mossoro":"S","atalaia":"S","parque cuiaba":"S","distrito industrial":"S","capao do pequi":"VN","canelas":"VN","cristo rei":"VN","gloria":"VC","ikaray":"VS","aeroporto":"VL","jardim dos estados":"VC","marajoara":"VS","mapim":"VO","novo mundo":"VN","parque del rey":"VL","parque do lago":"VS","primavera":"VN","sao matheus":"VS","vitoria regia":"VL","ponte nova":"VC","planalto ipiranga":"VN","costa verde":"VL"};
const RGC={O:[-15.601,-56.115],N:[-15.565,-56.080],L:[-15.610,-56.060],S:[-15.650,-56.065],C:[-15.601,-56.097],VC:[-15.646,-56.132],VN:[-15.630,-56.125],VS:[-15.665,-56.140],VL:[-15.645,-56.110],VO:[-15.650,-56.155]};
function geoEstimate(o){const b=(o.addr?.district||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g,"");for(const[k,r]of Object.entries(BRG)){if(b.includes(k))return RGC[r];}const c=o.addr?.city_name||o.addr?.city||"";return CITY_GEO[c]||null;}
const S={bg:"#0F1B2D",card:"#162236",cl:"#1C2E47",pri:"#0578A6",pl:"#0890C2",acc:"#2A9D8F",gold:"#C8964E",dng:"#DC2626",txt:"#E8ECF1",ts:"#8899AB",td:"#5A6B7D",brd:"#243349",ok:"#10B981"};
const fT=d=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:TZ});
const fD=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:TZ});
const fDS=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",timeZone:TZ});
const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin=m=>m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m}min`;
const hourDec=d=>{const t=new Date(d);return t.getHours()+t.getMinutes()/60;};
const hav=(a,b,c,d)=>{const R=6371,x=((c-a)*Math.PI)/180,y=((d-b)*Math.PI)/180;const z=Math.sin(x/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
function sL(k,f){try{return JSON.parse(localStorage.getItem(k))||f;}catch{return f;}}
function sS(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.warn("sync:",e);}}
async function agF(path,token,opts={}){const p=path.startsWith("/")?path.slice(1):path;const[base,qs]=p.split("?");let u=`${API}?path=${encodeURIComponent(base)}`;if(qs)u+="&"+qs;const r=await fetch(u,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
async function postTask(token,oid,text,type="VISITA",done=true,due=null){const b={text,type,done};if(due)b.due_date=due;return agF(`/organizations/${oid}/tasks`,token,{method:"POST",body:JSON.stringify(b)});}
function gps(){return new Promise((r,j)=>{if(!navigator.geolocation)return j(new Error("GPS"));navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),j,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
async function roadKm(a,b,c,d){try{const r=await fetch(`${OSRM}/${b},${a};${d},${c}?overview=false`);const j=await r.json();if(j.code==="Ok"&&j.routes?.[0])return{km:j.routes[0].distance/1000,dur:Math.round(j.routes[0].duration/60)};}catch{}return{km:hav(a,b,c,d)*1.3,dur:0};}
function csv(rows,fn){const b="\uFEFF"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([b],{type:"text/csv;charset=utf-8"})),download:fn}).click();}
function strip(o){const a=o.address||{};const desc=o.description||"";return{id:o.id,name:o.name||"",nickname:o.nickname||"",legalName:o.legalName||"",cnpj:o.cnpj||"",cat:o.category?.name||"",sector:o.sector?.name||"",products:(o.products||[]).map(p=>p.name).join(", "),owner:o.ownerUser?.name||"",ownerId:o.ownerUser?.id||null,grupo:desc.startsWith("Grupo:")?desc:"",addr:{street:a.streetName||a.street||"",number:a.streetNumber||a.number||"",district:a.district||a.neighborhood||"",city:a.city||"",city_name:a.city_name||a.city||"",state:a.state||""},people:(o.people||[]).map(p=>p.name).join(", ")};}
async function fetchCNPJ(cnpj){const clean=cnpj.replace(/[.\-\/]/g,"");try{const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);if(r.ok)return r.json();}catch{}const r2=await fetch(`${API}?cnpj=${clean}`);if(!r2.ok)throw new Error("CNPJ nao encontrado");return r2.json();}
// ─── Helper: get base for date (backward compatible) ───
function getBase(dayBases,date,userId){const b=dayBases[userId+"_"+date]||dayBases[date];if(!b)return HOMES[userId]||null;if(b.start)return b.start;return b;}
function getEnd(dayBases,date,userId){const b=dayBases[userId+"_"+date]||dayBases[date];if(b?.end)return b.end;return getBase(dayBases,date,userId);}
// ─── Helper: only real visits (check-in based, not WhatsApp/calls) ───
function isRealVisit(v){if(!v.checkoutTime)return false;if(v.taskType&&v.taskType!=="VISITA")return false;return true;}
// ─── Helper: resolve GPS from visit directly OR from plocs by orgId ───
function getVCoord(v,plocs){if(v.lat&&v.lng)return{lat:v.lat,lng:v.lng};if(plocs&&v.orgId&&plocs[v.orgId])return{lat:plocs[v.orgId].lat,lng:plocs[v.orgId].lng};return null;}
function getVEndCoord(v,plocs){if(v.checkoutLat&&v.checkoutLng)return{lat:v.checkoutLat,lng:v.checkoutLng};return getVCoord(v,plocs);}
const MIN_OBS=50;

const LB=({t,children})=><div style={{marginBottom:6}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:.5}}>{t}</p>{children}</div>;

function Login({onLogin}){const[tk,setTk]=useState("");const[lo,setLo]=useState(false);const[er,setEr]=useState("");const go=async()=>{if(!tk.trim())return;setLo(true);setEr("");try{const d=await agF("/users/me",tk.trim());d.data?onLogin(tk.trim(),d.data):setEr("Token invalido.");}catch(e){setEr("Erro: "+e.message);}setLo(false);};return(<div style={{padding:"3rem 1rem",textAlign:"center"}}><img src="/logo.png" alt="" style={{height:56,borderRadius:10,background:"#fff",padding:"4px 12px",marginBottom:16}} onError={e=>{e.target.style.display="none"}}/><h1 style={{fontSize:20,fontWeight:600,margin:"0 0 4px"}}>TeamCheck</h1><p style={{fontSize:13,color:S.ts,margin:"0 0 2rem"}}>Jordan Representações</p><div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1.25rem",textAlign:"left"}}><LB t="TOKEN DA API AGENDOR"><input type="password" value={tk} onChange={e=>setTk(e.target.value)} placeholder="Cole seu token..." style={{width:"100%"}} onKeyDown={e=>e.key==="Enter"&&go()}/></LB><button onClick={go} disabled={lo||!tk.trim()} style={{width:"100%",background:S.pri,border:"none",fontWeight:600,fontSize:15,padding:12,marginTop:8}}>{lo?"Conectando...":"Conectar ao Agendor"}</button>{er&&<p style={{fontSize:13,color:S.dng,marginTop:12,textAlign:"center"}}>{er}</p>}</div></div>);}

function OrgCard({org,active,onIn,onOut,onEdit,onPerson,onQuick,onInfo,ldId,plocs,lastVisit,lastOrder,nearRoad}){
  const isA=active?.orgId===org.id;const a=org.addr||{};const addr=[a.street,a.number].filter(Boolean).join(", ");const loc=[a.district,a.city_name||a.city,a.state].filter(Boolean).join(" · ");
  const catColor=CC[org.cat]||S.ts;
  return(<div id={"org-"+org.id} style={{background:isA?S.cl:S.card,border:`${isA?2:1}px solid ${isA?S.pri:S.brd}`,borderRadius:12,padding:"12px 14px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontWeight:500,fontSize:14,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{plocs[org.id]?<span style={{color:S.ok,fontSize:10,marginRight:4}}>●</span>:null}{org.name||org.nickname}</p>
        {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 1px"}}>{org.cnpj}</p>}
        {addr&&<p style={{fontSize:11,color:S.ts,margin:"0 0 1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{addr}</p>}
        {loc&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{loc}</p>}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
          {org.cat&&<span style={{fontSize:10,color:"#fff",background:catColor,padding:"2px 8px",borderRadius:4,fontWeight:500}}>{org.cat}</span>}
          {org.sector&&<span style={{fontSize:9,color:S.ts,background:S.bg,padding:"1px 6px",borderRadius:4}}>{org.sector}</span>}
        </div>
        {lastVisit&&<p style={{fontSize:10,color:S.td,margin:"4px 0 0"}}>📋 Visita: {fD(lastVisit.time)} — {lastVisit.who} ({Math.floor((Date.now()-new Date(lastVisit.time))/86400000)}d)</p>}
        {lastOrder&&<p style={{fontSize:10,color:S.gold,margin:"2px 0 0"}}>📦 Pedido: {fD(lastOrder.time)} — {lastOrder.source||"Dashboard"}</p>}
        {!lastVisit&&<p style={{fontSize:10,color:S.dng,margin:"4px 0 0",fontStyle:"italic"}}>Sem visita registrada</p>}
        {org.dist!=null&&org.dist<9999&&<p style={{fontSize:10,color:org.distType==="gps"?S.acc:S.ts,margin:"2px 0 0",fontWeight:org.distType==="gps"?500:400}}>📍 {nearRoad[org.id]!=null?`${nearRoad[org.id].toFixed(1)}km (estrada)`:org.dist<1?`${(org.dist*1000).toFixed(0)}m`:`${org.dist.toFixed(1)}km`}{org.distType==="bairro"?" (estimado)":""}</p>}
        {org.distType==="sem_ref"&&<p style={{fontSize:10,color:S.td,margin:"2px 0 0",fontStyle:"italic"}}>Sem referencia de localização</p>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
        {isA?<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{background:S.dng,border:"none",fontSize:13,fontWeight:600,padding:"12px 18px"}}>{ldId===org.id?"...":"Check-out"}</button>
        :<div style={{display:"flex",gap:5}}>
          <button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{background:active?S.cl:S.acc,border:"none",fontSize:13,fontWeight:600,padding:"12px 16px",opacity:active?0.4:1}}>{ldId===org.id?"...":"Check-in"}</button>
          <button onClick={()=>onQuick&&onQuick(org,"WHATSAPP")} style={{background:S.ok+"22",border:`1px solid ${S.ok}55`,fontSize:18,padding:"10px 12px",lineHeight:1}}>💬</button>
          <button onClick={()=>onQuick&&onQuick(org,"LIGACAO")} style={{background:S.pri+"22",border:`1px solid ${S.pri}55`,fontSize:18,padding:"10px 12px",lineHeight:1}}>📞</button>
        </div>}
        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
          <button onClick={()=>onInfo&&onInfo(org)} style={{fontSize:13,padding:"6px 12px",color:S.ts,background:"transparent",border:`1px solid ${S.brd}`}}>ℹ️</button>
          <button onClick={()=>onEdit&&onEdit(org)} style={{fontSize:13,padding:"6px 12px",color:S.ts,background:"transparent",border:`1px solid ${S.brd}`}}>✏️</button>
          <button onClick={()=>onPerson&&onPerson(org)} style={{fontSize:13,padding:"6px 12px",color:S.ts,background:"transparent",border:`1px solid ${S.brd}`}}>👤+</button>
        </div>
      </div>
    </div>
    {isA&&<p style={{fontSize:12,color:S.pl,margin:"8px 0 0",paddingTop:8,borderTop:`1px solid ${S.brd}`}}>Em visita desde {fT(active.checkinTime)}</p>}
  </div>);}

function Banner({v,orgs,onClick}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);return(<div onClick={onClick} style={{background:S.cl,border:`1px solid ${S.pri}`,borderRadius:12,padding:"10px 14px",marginBottom:12,cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.ok}}/><p style={{fontSize:13,fontWeight:500,color:S.pl,margin:0}}>{o?.name||o?.nickname||v.orgName}</p></div><span style={{fontSize:11,color:S.acc}}>Ir ao cliente →</span></div><p style={{fontSize:12,color:S.ts,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {hrsMin(el)}</p></div>);}

function NoteModal({org,onSave,onCancel}){
  const[n,setN]=useState("");const[tp,setTp]=useState("VISITA");const[nt,setNt]=useState("VISITA");const[nd,setNd]=useState("");const[nh,setNh]=useState("09:00");const[ndsc,setNdsc]=useState("");
  const[sale,setSale]=useState(false);const[brand,setBrand]=useState("");const[saleVal,setSaleVal]=useState("");
  const today=todayLocal();
  const dateValid=nd>=today;const ok=n.trim().length>=MIN_OBS&&nd&&ndsc.trim().length>=MIN_OBS&&dateValid;
  const obsLeft=MIN_OBS-n.trim().length;const dscLeft=MIN_OBS-ndsc.trim().length;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div style={{background:S.card,borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 8px"}}>Registrar atividade</p>
  <p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>{org?.name||org?.nickname}</p>
  <LB t="O QUE FOI FEITO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>{TYPES.map(t=><button key={t.id} onClick={()=>setTp(t.id)} style={{padding:"6px",fontSize:10,border:tp===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:tp===t.id?S.cl:S.bg,color:tp===t.id?S.pl:S.ts,fontWeight:tp===t.id?600:400}}>{t.l}</button>)}</div></LB>
  <LB t="OBSERVAÇÃO"><textarea value={n} onChange={e=>setN(e.target.value)} placeholder={`Descreva detalhadamente (min ${MIN_OBS} caracteres)`} rows={3} style={{width:"100%",border:`1px solid ${n.trim().length>=MIN_OBS?S.brd:S.dng}`}}/>{obsLeft>0&&<p style={{fontSize:10,color:S.dng,margin:"2px 0 0"}}>Faltam {obsLeft} caracteres</p>}</LB>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px",background:sale?S.ok+"18":S.bg,border:`1px solid ${sale?S.ok:S.brd}`,borderRadius:8,cursor:"pointer"}} onClick={()=>setSale(!sale)}><span style={{fontSize:16}}>{sale?"✅":"💰"}</span><span style={{fontSize:12,fontWeight:500,color:sale?S.ok:S.ts}}>Venda realizada</span></div>
  {sale&&<div style={{marginBottom:8}}><div style={{display:"flex",gap:6}}><select value={brand} onChange={e=>setBrand(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Marca</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select><input type="number" value={saleVal} onChange={e=>setSaleVal(e.target.value)} placeholder="R$ valor" style={{width:100}}/></div></div>}
  <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:8}}>
    <LB t="PRÓXIMO PASSO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>{TYPES.map(t=><button key={t.id} onClick={()=>setNt(t.id)} style={{padding:"6px",fontSize:10,border:nt===t.id?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:nt===t.id?S.cl:S.bg,color:nt===t.id?S.acc:S.ts,fontWeight:nt===t.id?600:400}}>{t.l}</button>)}</div></LB>
    <LB t="DATA / HORA"><div style={{display:"flex",gap:6}}><input type="date" value={nd} min={today} onChange={e=>setNd(e.target.value)} style={{flex:1,border:`1px solid ${nd&&dateValid?S.brd:S.dng}`}}/><input type="time" value={nh} onChange={e=>setNh(e.target.value)} style={{width:80}}/></div></LB>
    {nd&&!dateValid&&<p style={{fontSize:10,color:S.dng,margin:"-4px 0 4px"}}>Data nao pode ser anterior a hoje</p>}
    <LB t="DESCRIÇÃO"><textarea value={ndsc} onChange={e=>setNdsc(e.target.value)} placeholder={`Proximo contato detalhado (min ${MIN_OBS} caracteres)`} rows={3} style={{width:"100%",border:`1px solid ${ndsc.trim().length>=MIN_OBS?S.brd:S.dng}`}}/>{dscLeft>0&&<p style={{fontSize:10,color:S.dng,margin:"2px 0 0"}}>Faltam {dscLeft} caracteres</p>}</LB>
  </div>
  <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={()=>ok&&onSave(n,tp,{nextType:nt,nextDate:nd,nextTime:nh,nextDesc:ndsc},sale?{brand,value:parseFloat(saleVal)||0}:null)} disabled={!ok} style={{flex:1,background:ok?S.pri:S.cl,border:"none",fontWeight:600}}>Registrar</button></div>
</div></div>);}

function NewClientModal({token,allOrgs,onSave,onCancel}){
  const pf=sL("jc:prefill",null);useEffect(()=>{sS("jc:prefill",null);},[]);// Clear prefill after reading
  const[step,setStep]=useState(1);const[orgId,setOrgId]=useState(null);const[orgName,setOrgName]=useState("");const[orgData,setOrgData]=useState(null);
  const[name,setName]=useState(pf?.rfData?.nome_fantasia||"");const[legal,setLegal]=useState(pf?.rfData?.razao_social||"");const[cnpj,setCnpj]=useState(pf?.cnpj||"");const[city,setCity]=useState(pf?.rfData?.municipio||"");const[state,setState]=useState(pf?.rfData?.uf||"MT");const[district,setDistrict]=useState(pf?.rfData?.bairro||"");const[street,setStreet]=useState([pf?.rfData?.descricao_tipo_de_logradouro,pf?.rfData?.logradouro].filter(Boolean).join(" ")||"");const[num,setNum]=useState(pf?.rfData?.numero||"");const[comp,setComp]=useState(pf?.rfData?.complemento||"");const[cep,setCep]=useState(pf?.rfData?.cep||"");const[phone,setPhone]=useState(pf?.rfData?.ddd_telefone_1?.replace(/[^\d]/g,"")||"");
  const[catId,setCatId]=useState(3186598);const[sectorId,setSectorId]=useState("");const[originId,setOriginId]=useState("");const[grupo,setGrupo]=useState("");const[newGrupo,setNewGrupo]=useState("");
  const[lo,setLo]=useState(false);const[er,setEr]=useState("");const[fetching,setFetching]=useState(false);
  const[pName,setPName]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const buscarCNPJ=async()=>{const c=cnpj.replace(/[.\-\/]/g,"");if(c.length!==14){setEr("CNPJ deve ter 14 digitos");return;}setFetching(true);setEr("");try{const d=await fetchCNPJ(c);setName(d.nome_fantasia||"");setLegal(d.razao_social||"");setStreet([d.descricao_tipo_de_logradouro,d.logradouro].filter(Boolean).join(" ")||"");setNum(d.numero||"");setComp(d.complemento||"");setDistrict(d.bairro||"");setCity(d.municipio||"");setState(d.uf||"MT");setCep(d.cep||"");if(d.ddd_telefone_1)setPhone(d.ddd_telefone_1.replace(/[^\d]/g,""));}catch(e){setEr(e.message);}setFetching(false);};
  const createOrg=async()=>{if(!name.trim()&&!legal.trim())return;setLo(true);setEr("");try{const body={name:name.trim()||legal.trim(),legalName:legal.trim()};if(cnpj)body.cnpj=cnpj.replace(/[.\-\/]/g,"");const addr={};if(street)addr.street_name=street;if(num)addr.street_number=num;if(comp)addr.additional_info=comp;if(district)addr.district=district;if(city)addr.city=city;if(state)addr.state=state;if(cep)addr.postal_code=cep;if(Object.keys(addr).length)body.address=addr;if(phone)body.contact={work:phone};if(catId)body.category=catId;if(sectorId)body.sector=parseInt(sectorId);if(originId)body.leadOrigin=parseInt(originId);const gFinal=grupo==="__new__"?newGrupo.trim():grupo;if(gFinal)body.description=`Grupo: ${gFinal}`;const d=await agF("/organizations",token,{method:"POST",body:JSON.stringify(body)});if(d.data){setOrgId(d.data.id);setOrgName(d.data.name||name);setOrgData(strip(d.data));setStep(2);}else setEr("Erro");}catch(e){setEr(e.message==="400"?"Cliente ja existe no Agendor":"Erro: "+e.message);}setLo(false);};
  const[pCargo,setPCargo]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>o.grupo?.replace("Grupo: ","")).filter(Boolean))].sort(),[allOrgs]);
  const finish=(wp)=>{const od=orgData||strip({id:orgId,name:orgName||name,legalName:legal,cnpj,address:{city,state,district},category:{id:catId,name:CAT_IDS.find(c=>c.id===catId)?.n},sector:{id:parseInt(sectorId),name:SECTORS.find(s=>s.id===parseInt(sectorId))?.n}});if(wp&&pName.trim()){setLo(true);agF("/people",token,{method:"POST",body:JSON.stringify({name:pName,organization:orgId,role:pCargo||undefined,contact:{...(pEmail?{email:pEmail}:{}),...(pPhone?{mobile:pPhone}:{}),...(pWhats?{whatsapp:pWhats}:{})}})}).then(()=>{setLo(false);setOrgData(od);setStep(3);}).catch((e)=>{setLo(false);alert("Empresa criada, mas ERRO ao cadastrar pessoa: "+e.message);setOrgData(od);setStep(3);});}else{setOrgData(od);setStep(3);}};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
  {step===1?<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Novo Cliente — Empresa</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 1 de 3</p>
  <LB t="CNPJ"><div style={{display:"flex",gap:6}}><input value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0000-00" style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&buscarCNPJ()}/><button onClick={buscarCNPJ} disabled={fetching} style={{padding:"8px 12px",background:S.acc,border:"none",fontWeight:600,fontSize:11}}>{fetching?"...":"Buscar"}</button></div></LB>
  {fetching&&<p style={{fontSize:11,color:S.acc,margin:"-4px 0 4px"}}>Consultando Receita Federal...</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Preencha o nome fantasia" style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="ENDEREÇO / Nº"><div style={{display:"flex",gap:6}}><input value={street} onChange={e=>setStreet(e.target.value)} style={{flex:1}}/><input value={num} onChange={e=>setNum(e.target.value)} placeholder="Nº" style={{width:50}}/></div></LB>
  <LB t="COMPLEMENTO / CEP"><div style={{display:"flex",gap:6}}><input value={comp} onChange={e=>setComp(e.target.value)} style={{flex:1}}/><input value={cep} onChange={e=>setCep(e.target.value)} placeholder="CEP" style={{width:85}}/></div></LB>
  <LB t="BAIRRO"><input value={district} onChange={e=>setDistrict(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CIDADE / UF"><div style={{display:"flex",gap:6}}><input value={city} onChange={e=>setCity(e.target.value)} style={{flex:1}}/><select value={state} onChange={e=>setState(e.target.value)} style={{width:60}}><option>MT</option><option>MS</option><option>PA</option><option>GO</option><option>RO</option><option>TO</option></select></div></LB>
  <LB t="TELEFONE"><input value={phone} onChange={e=>setPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CAT_IDS.map(c=><button key={c.id} type="button" onClick={()=>setCatId(c.id)} style={{padding:"4px 10px",fontSize:10,border:catId===c.id?`2px solid ${CC[c.n]||S.pri}`:`1px solid ${S.brd}`,background:catId===c.id?`${CC[c.n]||S.pri}22`:"transparent",color:catId===c.id?CC[c.n]||S.pri:S.ts,borderRadius:6,fontWeight:catId===c.id?600:400}}>{c.n}</button>)}</div></LB>
  <LB t="ORIGEM"><select value={originId} onChange={e=>setOriginId(e.target.value)} style={{width:"100%",fontSize:11}}><option value="">Origem</option>{ORIGINS.map(o=><option key={o.id} value={o.id}>{o.n}</option>)}</select></LB>
  <LB t="SETOR / GRUPO"><div style={{display:"flex",gap:6}}><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Setor</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select><select value={grupo} onChange={e=>setGrupo(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Grupo</option>{existGrp.map(g=><option key={g} value={g}>{g}</option>)}<option value="__new__">+ Novo</option></select></div>{grupo==="__new__"&&<input value={newGrupo} onChange={e=>setNewGrupo(e.target.value)} placeholder="Nome do grupo" style={{width:"100%",marginTop:4,fontSize:11}}/>}</LB>
  {er&&<p style={{fontSize:12,color:S.dng,margin:"0 0 6px"}}>{er}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={createOrg} disabled={lo||(!name.trim()&&!legal.trim())} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"Salvando...":"Próximo →"}</button></div>
  </>:step===2?<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Contato — {orgName}</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 2 de 3 (opcional)</p>
  <LB t="NOME"><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome do responsavel" style={{width:"100%"}}/></LB>
  <LB t="CARGO"><select value={pCargo} onChange={e=>setPCargo(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Selecione...</option>{CARGOS.map(c=><option key={c} value={c}>{c}</option>)}</select></LB>
  <LB t="E-MAIL"><input value={pEmail} onChange={e=>setPEmail(e.target.value)} type="email" style={{width:"100%"}}/></LB>
  <LB t="TELEFONE"><input value={pPhone} onChange={e=>setPPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="WHATSAPP"><input value={pWhats} onChange={e=>setPWhats(e.target.value)} style={{width:"100%"}}/></LB>
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={()=>finish(false)} style={{flex:1,color:S.ts}}>Pular →</button><button onClick={()=>finish(true)} disabled={lo||!pName.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{lo?"...":"Próximo →"}</button></div>
  </>:<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.ok}}>✅ Cliente cadastrado!</p>
  <div style={{background:S.cl,borderRadius:10,padding:12,margin:"8px 0 12px"}}>
    <p style={{fontSize:14,fontWeight:600,margin:"0 0 2px"}}>{orgData?.name||orgName}</p>
    {orgData?.cnpj&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{orgData.cnpj}</p>}
    <p style={{fontSize:11,color:S.ts,margin:0}}>{orgData?.cat||""} · {orgData?.addr?.city_name||orgData?.addr?.city||city}</p>
  </div>
  <p style={{fontSize:12,color:S.gold,fontWeight:500,margin:"0 0 8px"}}>Abrir atendimento?</p>
  <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
    {TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${orgData?.name||orgName}:`);if(note?.trim()){postTask(token,orgId,note,t.id,true).then(()=>{alert("Registrado no Agendor!");onSave(orgData);}).catch(e=>{alert("Erro: "+e.message);onSave(orgData);});}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>
      {t.id==="VISITA"?"📍":t.id==="WHATSAPP"?"💬":t.id==="LIGACAO"?"📞":t.id==="EMAIL"?"📧":t.id==="REUNIAO"?"🤝":"📄"} {t.l}
    </button>)}
  </div>
  <button onClick={()=>onSave(orgData)} style={{width:"100%",padding:12,fontWeight:500}}>← Voltar ao app</button></>}
</div></div>);}

const CARGOS=["Comprador","Conferente","Financeiro","Fiscal","Gerente de Vendas","Marketing","Proprietário","Recebimento","Repositor","Vendedor"];
function PeopleModal({org,token,onClose}){
  const[people,setPeople]=useState([]);const[lo,setLo]=useState(true);const[mode,setMode]=useState("list");// list | add | edit
  const[editId,setEditId]=useState(null);
  const[n,setN]=useState("");const[cargo,setCargo]=useState("");const[e,setE]=useState("");const[p,setP]=useState("");const[w,setW]=useState("");const[msg,setMsg]=useState("");const[saving,setSaving]=useState(false);
  const reload=async()=>{try{const d=await agF(`/organizations/${org.id}/people?per_page=50`,token);setPeople(d.data||[]);}catch(e){console.warn("people:",e);}};
  useEffect(()=>{reload().then(()=>setLo(false));},[]);
  const clear=()=>{setN("");setCargo("");setE("");setP("");setW("");setEditId(null);setMode("list");};
  const openAdd=()=>{clear();setMode("add");setMsg("");};
  const openEdit=(pe)=>{setEditId(pe.id);setN(pe.name||"");setCargo(pe.role||"");setE(pe.contact?.email||"");setP(pe.contact?.mobile?.replace(/\D/g,"")||"");setW(pe.contact?.whatsapp||"");setMode("edit");setMsg("");};
  const canSave=n.trim()&&e.trim()&&w.trim();
  const save=async()=>{if(!canSave)return;setSaving(true);setMsg("");
    const contact={};if(e.trim())contact.email=e.trim();if(p.trim())contact.mobile=p.trim();if(w.trim())contact.whatsapp=w.trim();
    const body={name:n.trim()};if(cargo)body.role=cargo;if(Object.keys(contact).length)body.contact=contact;
    try{if(mode==="edit"&&editId){await agF(`/people/${editId}`,token,{method:"PUT",body:JSON.stringify(body)});setMsg("Atualizado!");}
    else{body.organization=org.id;await agF("/people",token,{method:"POST",body:JSON.stringify(body)});setMsg("Adicionado!");}
    await reload();clear();}catch(x){setMsg("Erro: "+x.message);}setSaving(false);};
  const del=async(pe)=>{if(!confirm(`Excluir ${pe.name}?\nEssa ação remove o contato do Agendor.`))return;setSaving(true);try{await agF(`/people/${pe.id}`,token,{method:"DELETE"});await reload();setMsg("Excluído!");}catch(x){setMsg("Erro: "+x.message);}setSaving(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>👤 Contatos</p>
    <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>{org.name}</p>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Carregando...</p>}
    {!lo&&people.length===0&&mode==="list"&&<p style={{fontSize:12,color:S.ts,padding:"1rem 0",textAlign:"center"}}>Nenhum contato cadastrado</p>}
    {mode==="list"&&people.map(pe=><div key={pe.id} style={{background:S.cl,borderRadius:8,padding:10,marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <p style={{fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{pe.name}</p>
          {pe.role&&<p style={{fontSize:10,color:S.acc,margin:"0 0 3px"}}>{pe.role}</p>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {pe.contact?.email&&<span style={{fontSize:10,color:S.ts}}>📧 {pe.contact.email}</span>}
            {pe.contact?.mobile&&<span style={{fontSize:10,color:S.ts}}>📱 {pe.contact.mobile}</span>}
            {pe.contact?.whatsapp&&<a href={`https://wa.me/55${pe.contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener" style={{fontSize:10,color:S.ok,textDecoration:"none"}}>💬 {pe.contact.whatsapp}</a>}
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>openEdit(pe)} style={{fontSize:10,padding:"4px 8px",color:S.pri,background:S.pri+"15",border:`1px solid ${S.pri}33`,borderRadius:6}}>✏️</button>
          <button onClick={()=>del(pe)} disabled={saving} style={{fontSize:10,padding:"4px 8px",color:S.dng,background:S.dng+"15",border:`1px solid ${S.dng}33`,borderRadius:6}}>🗑️</button>
        </div>
      </div>
    </div>)}
    {msg&&<p style={{fontSize:11,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"4px 0"}}>{msg}</p>}
    {mode==="list"&&<button onClick={openAdd} style={{width:"100%",padding:10,fontSize:12,background:S.acc,border:"none",fontWeight:600,marginTop:4}}>+ Adicionar Contato</button>}
    {(mode==="add"||mode==="edit")&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:6}}>
      <p style={{fontSize:12,fontWeight:600,margin:"0 0 6px",color:mode==="edit"?S.pri:S.acc}}>{mode==="edit"?"✏️ Editar Contato":"+ Novo Contato"}</p>
      <LB t="NOME *"><input value={n} onChange={x=>setN(x.target.value)} style={{width:"100%",border:`1px solid ${n.trim()?S.brd:S.dng}`}}/></LB>
      <LB t="CARGO"><select value={cargo} onChange={x=>setCargo(x.target.value)} style={{width:"100%",fontSize:12}}><option value="">Selecione...</option>{CARGOS.map(c=><option key={c} value={c}>{c}</option>)}</select></LB>
      <LB t="E-MAIL *"><input value={e} onChange={x=>setE(x.target.value)} type="email" style={{width:"100%",border:`1px solid ${e.trim()?S.brd:S.dng}`}} placeholder="Obrigatório"/></LB>
      <LB t="TELEFONE"><input value={p} onChange={x=>setP(x.target.value)} style={{width:"100%"}}/></LB>
      <LB t="WHATSAPP *"><input value={w} onChange={x=>setW(x.target.value)} style={{width:"100%",border:`1px solid ${w.trim()?S.brd:S.dng}`}} placeholder="Obrigatório"/></LB>
      <div style={{display:"flex",gap:8}}><button onClick={clear} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={saving||!canSave} style={{flex:1,background:canSave?(mode==="edit"?S.pri:S.acc):S.cl,border:"none",fontWeight:600}}>{saving?"...":(mode==="edit"?"Atualizar no Agendor":"Salvar no Agendor")}</button></div>
    </div>}
    <button onClick={onClose} style={{width:"100%",marginTop:8}}>Fechar</button>
  </div></div>);}

const PRODS=[{id:761952,n:"TRAMONTINA"},{id:761953,n:"PADO"},{id:761954,n:"HIPER TEXTIL"},{id:1139796,n:"PLASTILIT"},{id:1392476,n:"FESTCOLOR"},{id:1627655,n:"ZAGONEL"},{id:2046010,n:"RUVOLO"},{id:2260997,n:"SANTANA"}];

function EditModal({org,token,users,allOrgs,onSave,onClose}){const[name,setName]=useState(org.name||"");const[legal,setLegal]=useState("");const[catId,setCatId]=useState("");const[sectorId,setSectorId]=useState("");const[grupo,setGrupo]=useState(org.grupo?.replace("Grupo: ","")||"");const[newGrupo,setNewGrupo]=useState("");const[ownerId,setOwnerId]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>o.grupo?.replace("Grupo: ","")).filter(Boolean))].sort(),[allOrgs]);
  const curProds=org.products?org.products.split(", ").filter(p=>!p.startsWith("P_")):[];
  const[selProds,setSelProds]=useState(()=>PRODS.filter(p=>curProds.includes(p.n)).map(p=>p.id));
  const[lo,setLo]=useState(false);const[fetching,setFetching]=useState(false);const[msg,setMsg]=useState("");
  const toggleProd=id=>setSelProds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const refresh=async()=>{if(!org.cnpj)return;setFetching(true);setMsg("");try{const d=await fetchCNPJ(org.cnpj);setName(d.nome_fantasia||name);setLegal(d.razao_social||"");setMsg("Dados atualizados!");}catch(e){setMsg("Erro: "+e.message);}setFetching(false);};
  const save=async()=>{setLo(true);setMsg("");try{const body={products:selProds};if(name.trim())body.name=name.trim();if(legal.trim())body.legalName=legal.trim();if(catId)body.category=parseInt(catId);if(sectorId)body.sector=parseInt(sectorId);if(ownerId)body.ownerUser=parseInt(ownerId);const gFinal=grupo==="__new__"?newGrupo.trim():grupo;body.description=gFinal?`Grupo: ${gFinal}`:"";const resp=await agF(`/organizations/${org.id}`,token,{method:"PUT",body:JSON.stringify(body)});if(resp.data){onSave(strip(resp.data));setMsg("Salvo!");}else{onSave({...org,name:name||org.name});}}catch(e){setMsg("Erro: "+e.message);}setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><p style={{fontWeight:600,fontSize:16,margin:0}}>Editar Cliente</p>{org.cnpj&&<button onClick={refresh} disabled={fetching} style={{padding:"4px 10px",fontSize:11,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc}}>{fetching?"...":"🔄 RF"}</button>}</div>
  {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>CNPJ: {org.cnpj}</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} placeholder="Atualizar" style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CAT_IDS.map(c=><button key={c.id} type="button" onClick={()=>setCatId(String(c.id))} style={{padding:"4px 10px",fontSize:10,border:catId===String(c.id)?`2px solid ${CC[c.n]||S.pri}`:`1px solid ${S.brd}`,background:catId===String(c.id)?`${CC[c.n]||S.pri}22`:"transparent",color:catId===String(c.id)?CC[c.n]||S.pri:S.ts,borderRadius:6,fontWeight:catId===String(c.id)?600:400}}>{c.n}{org.cat===c.n&&!catId?" (atual)":""}</button>)}</div></LB>
  <LB t="RESPONSÁVEL"><select value={ownerId} onChange={e=>setOwnerId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.owner||"-"}</option>{users.map(u=><option key={u.id} value={u.id}>{u.n}</option>)}</select></LB>
  <LB t="SETOR"><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.sector||"-"}</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select></LB>
  <LB t="GRUPO"><select value={grupo} onChange={e=>{setGrupo(e.target.value);if(e.target.value!=="__new__")setNewGrupo("");}} style={{width:"100%",fontSize:12,marginBottom:grupo==="__new__"?4:0}}><option value="">Sem grupo</option>{existGrp.map(g=><option key={g} value={g}>{g}</option>)}<option value="__new__">+ Criar novo grupo</option></select>{grupo==="__new__"&&<input value={newGrupo} onChange={e=>setNewGrupo(e.target.value)} placeholder="Nome do novo grupo" style={{width:"100%",fontSize:12}}/>}</LB>
  <LB t="PRODUTOS / MARCAS"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{PRODS.map(p=><button key={p.id} onClick={()=>toggleProd(p.id)} style={{padding:"4px 8px",fontSize:10,border:selProds.includes(p.id)?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:selProds.includes(p.id)?S.ok+"22":"transparent",color:selProds.includes(p.id)?S.ok:S.ts,borderRadius:6,fontWeight:selProds.includes(p.id)?600:400}}>{p.n}</button>)}</div></LB>
  {msg&&<p style={{fontSize:12,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"0 0 6px"}}>{msg}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onClose} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"...":"Salvar"}</button></div></div></div>);}

// ─── HotelGeoInput: busca Google Maps + GPS + colar coordenadas ───
function HotelGeoInput({name,onNameChange,lat,lng,onCoordsChange,label}){
  const[gpsLo,setGpsLo]=useState(false);const[coordText,setCoordText]=useState(lat&&lng?`${lat},${lng}`:"");
  const parseCoords=(txt)=>{const clean=txt.replace(/\s/g,"");const m=clean.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);if(m)onCoordsChange(parseFloat(m[1]),parseFloat(m[2]));};
  const captureGPS=async()=>{setGpsLo(true);try{const g=await gps();onCoordsChange(g.lat,g.lng);setCoordText(`${g.lat.toFixed(6)},${g.lng.toFixed(6)}`);}catch{alert("GPS indisponivel");}setGpsLo(false);};
  const searchMaps=()=>{const q=encodeURIComponent(name||"hotel");window.open(`https://www.google.com/maps/search/${q}`,"_blank");};
  const hasCoords=lat&&lng;
  return(<div style={{display:"flex",flexDirection:"column",gap:4}}>
    <input value={name} onChange={e=>onNameChange(e.target.value)} placeholder={label||"Nome do hotel / cidade"} style={{width:"100%",fontSize:12}}/>
    <div style={{display:"flex",gap:4}}>
      <button onClick={searchMaps} style={{flex:1,padding:6,fontSize:10,background:S.pri+"22",border:`1px solid ${S.pri}`,color:S.pri}}>🔍 Buscar no Maps</button>
      <button onClick={captureGPS} disabled={gpsLo} style={{flex:1,padding:6,fontSize:10,background:hasCoords?S.ok+"22":S.gold+"22",border:`1px solid ${hasCoords?S.ok:S.gold}`,color:hasCoords?S.ok:S.gold}}>{gpsLo?"📍 GPS...":(hasCoords?"✅ GPS capturado":"📍 Meu GPS")}</button>
    </div>
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <input value={coordText} onChange={e=>{setCoordText(e.target.value);parseCoords(e.target.value);}} placeholder="Colar coordenadas: -11.8642,-55.5095" style={{flex:1,fontSize:10,fontFamily:"monospace",padding:"6px 8px"}}/>
      {hasCoords&&<span style={{fontSize:9,color:S.ok,flexShrink:0}}>✅</span>}
    </div>
    {hasCoords&&<p style={{fontSize:9,color:S.ok,margin:0}}>📍 {lat.toFixed(5)}, {lng.toFixed(5)}</p>}
  </div>);}

// ─── JourneyModal: INÍCIO da jornada — origem E destino ───
function JourneyModal({user,onSave,onCancel}){const home=HOMES[user?.id];const[orig,setOrig]=useState("home");const[dest,setDest]=useState("home");const[lo,setLo]=useState(false);const[origName,setOrigName]=useState("");const[destName,setDestName]=useState("");
  const[origLat,setOrigLat]=useState(null);const[origLng,setOrigLng]=useState(null);
  const[destLat,setDestLat]=useState(null);const[destLng,setDestLng]=useState(null);
  const go=async()=>{setLo(true);let startBase,endBase;
    if(orig==="home"&&home){startBase={type:"home",...home};}
    else if(origLat&&origLng){startBase={type:"hotel",lat:origLat,lng:origLng,label:origName||"Hotel"};}
    else{try{const g=await gps();startBase={type:"hotel",lat:g.lat,lng:g.lng,label:origName||"Hotel"};}catch{alert("Defina a localização do hotel de origem.");setLo(false);return;}}
    if(dest==="home"&&home){endBase={type:"home",...home};}
    else if(destLat&&destLng){endBase={type:"hotel",lat:destLat,lng:destLng,label:destName||"Hotel"};}
    else{endBase={type:"hotel",lat:null,lng:null,label:destName||"Hotel (GPS ao fechar)"};}
    onSave({start:startBase,end:endBase});setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px"}}>Jornada de Trabalho</p>
    <p style={{fontSize:12,color:S.acc,fontWeight:600,margin:"0 0 6px"}}>DE ONDE ESTÁ SAINDO?</p>
    {["home","hotel"].map(t=><label key={"o"+t} style={{display:"flex",alignItems:"center",gap:10,padding:10,border:`${orig===t?2:1}px solid ${orig===t?S.pri:S.brd}`,borderRadius:10,marginBottom:6,cursor:"pointer",background:orig===t?S.cl:S.bg}}><input type="radio" checked={orig===t} onChange={()=>setOrig(t)}/><span style={{fontSize:13,fontWeight:500}}>{t==="home"?"🏠 Casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {orig==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={origName} onNameChange={setOrigName} lat={origLat} lng={origLng} onCoordsChange={(la,ln)=>{setOrigLat(la);setOrigLng(ln);}} label="Hotel de origem"/></div>}
    <div style={{borderTop:`1px solid ${S.brd}`,margin:"10px 0",paddingTop:10}}>
    <p style={{fontSize:12,color:S.gold,fontWeight:600,margin:"0 0 6px"}}>PARA ONDE VAI NO FINAL DO DIA?</p>
    {["home","hotel"].map(t=><label key={"d"+t} style={{display:"flex",alignItems:"center",gap:10,padding:10,border:`${dest===t?2:1}px solid ${dest===t?S.gold:S.brd}`,borderRadius:10,marginBottom:6,cursor:"pointer",background:dest===t?S.cl:S.bg}}><input type="radio" checked={dest===t} onChange={()=>setDest(t)}/><span style={{fontSize:13,fontWeight:500}}>{t==="home"?"🏠 Voltar para casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {dest==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={destName} onNameChange={setDestName} lat={destLat} lng={destLng} onCoordsChange={(la,ln)=>{setDestLat(la);setDestLng(ln);}} label="Hotel de destino"/></div>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Depois</button><button onClick={go} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"📍 GPS...":"Iniciar Jornada"}</button></div>
  </div></div>);}

// ─── DayEndModal: FECHAMENTO do roteiro — GPS ao chegar no hotel ───
function DayEndModal({user,onSave,onCancel}){const home=HOMES[user?.id];const[tp,setTp]=useState("home");const[hn,setHn]=useState("");
  const[htLat,setHtLat]=useState(null);const[htLng,setHtLng]=useState(null);
  const go=()=>{if(tp==="home"&&home){onSave({type:"home",...home});return;}
    if(!htLat||!htLng){alert("Defina a localização do hotel (GPS, busca ou coordenadas).");return;}
    onSave({type:"hotel",lat:htLat,lng:htLng,label:hn||"Hotel/Airbnb"});};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Fechar roteiro do dia</p>
    <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>Para onde esta indo agora?</p>
    {["home","hotel"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:10,padding:12,border:`${tp===t?2:1}px solid ${tp===t?S.pri:S.brd}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:tp===t?S.cl:S.bg}}><input type="radio" checked={tp===t} onChange={()=>setTp(t)}/><span style={{fontWeight:500}}>{t==="home"?"🏠 Voltando para casa":"🏨 Hotel / Airbnb"}</span></label>)}
    {tp==="hotel"&&<div style={{marginBottom:8}}><HotelGeoInput name={hn} onNameChange={setHn} lat={htLat} lng={htLng} onCoordsChange={(la,ln)=>{setHtLat(la);setHtLng(ln);}} label="Local de repouso"/></div>}
    <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={go} disabled={tp==="hotel"&&(!htLat||!htLng)} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Fechar Roteiro</button></div>
  </div></div>);}

function DivergentModal({org,dist,onAction,onCancel}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Local divergente</p><p style={{fontSize:13,color:S.ts,margin:"0 0 4px"}}>{org.name}</p><p style={{fontSize:12,color:S.gold,margin:"0 0 16px"}}>Voce esta a {dist}m do cadastrado</p><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}><button onClick={()=>onAction("checkin")} style={{padding:12,textAlign:"left",fontWeight:500}}>📍 Visita presencial</button>{TYPES.filter(t=>t.id!=="VISITA").map(t=><button key={t.id} onClick={()=>onAction("remote",t.id)} style={{padding:12,textAlign:"left"}}>{t.l} (sem check-in)</button>)}<button onClick={()=>onAction("schedule")} style={{padding:12,textAlign:"left",color:S.acc}}>📅 Agendar futuro</button></div><button onClick={onCancel} style={{width:"100%",color:S.dng}}>Cancelar</button></div></div>);}

// ═══════════════════════════════════════════════════════════════
// FIX: RotasTab — skip same-org km, use separate start/end base
// ═══════════════════════════════════════════════════════════════
function RotasTab({visits,dayBases,user,plocs}){
  const[sel,setSel]=useState(todayLocal());
  const[routes,setRoutes]=useState([]);const[lo,setLo]=useState(false);
  const startBase=getBase(dayBases,sel,user?.id);
  const endBase=getEnd(dayBases,sel,user?.id);
  // FIX: only real visits from current user
  const dv=useMemo(()=>{
    const t=new Date(sel+"T12:00:00").toDateString();
    return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&isRealVisit(v)&&(!v.userName||v.userName===user?.name))
      .sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
  },[visits,sel,user?.name]);
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
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando rotas...</p>}{!dv.length&&!lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita</p>}
    {dv.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>{routes.find(r=>r.tp==="bs")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>{startBase?.label||"Casa"} → 1º PDV: {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</span></div>}{dv.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}><div style={{padding:"10px 14px",display:"flex",gap:10}}><div style={{width:22,height:22,borderRadius:"50%",background:S.pri+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:600,color:S.pl}}>{i+1}</span></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{fT(v.checkinTime)}→{fT(v.checkoutTime)} {hrsMin(mins(v.checkinTime,v.checkoutTime))}</p></div></div>{seg&&<div style={{padding:"3px 14px 3px 46px",background:seg.tp==="lch"?S.gold+"15":S.bg}}><span style={{fontSize:11,color:seg.tp==="lch"?S.gold:S.td}}>{seg.tp==="lch"?"Almoco ":"↓ "}{seg.km.toFixed(1)}km</span></div>}</div>);})}
      {routes.find(r=>r.tp==="be")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Ultimo → {endBase?.label||"Casa"}: {routes.find(r=>r.tp==="be").km.toFixed(1)} km</span></div>}
      <div style={{padding:"10px 14px",borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"space-between"}}><span style={{color:S.ts}}>Total</span><span style={{fontSize:15,fontWeight:600,color:S.pl}}>{totKm.toFixed(1)} km</span></div>
      {startBase&&dv.length>0&&<a href={`https://www.google.com/maps/dir/${startBase.lat},${startBase.lng}/${dv.map(v=>`${v.lat},${v.lng}`).join("/")}/${(endBase||startBase).lat},${(endBase||startBase).lng}`} target="_blank" rel="noopener" style={{display:"block",padding:"10px",background:S.acc+"22",textAlign:"center",textDecoration:"none",color:S.acc,fontWeight:500,fontSize:13}}>Abrir no Google Maps</a>}
    </div>}</div>);}

// ═══════════════════════════════════════════════════════════════
// FIX: RelatorioTab — somente visitas com check-in, sem WhatsApp
// ═══════════════════════════════════════════════════════════════
function RelatorioTab({visits,dayBases,user,token,plocs,onEditBase}){
  const[sd,setSd]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return toLocalDate(d);});
  const[ed,setEd]=useState(todayLocal());
  const[selUser,setSelUser]=useState("me");const[remoteVisits,setRemoteVisits]=useState([]);const[rLo,setRLo]=useState(false);
  const[editDay,setEditDay]=useState(null);
  // FIX: resolve correct userId and name based on who we're viewing
  const otherId=user.id===743088?743347:743088;
  const repUserId=selUser==="me"?user.id:otherId;
  const repUserName=selUser==="me"?user.name:(USERS.find(u=>u.id===otherId)?.n||"Alisson");
  const loadRemote=async()=>{setRLo(true);try{
    // Use 30-day windows from sd to today (API max 31 days)
    let allT=[];const start=new Date(sd+"T00:00:00Z");const end=new Date();
    for(let d=new Date(start);d<end;){const win=new Date(d);win.setDate(win.getDate()+30);const to=win>end?end:win;
      let pg=1;while(true){const r=await agF(`/tasks?createdDateGt=${d.toISOString()}&createdDateLt=${to.toISOString()}&per_page=100&page=${pg}`,token);if(!r.data?.length)break;allT.push(...r.data);if(r.data.length<100)break;pg++;}d=to;}
    const tasks=allT.filter(t=>t.user?.id===otherId&&(t.type==="Visita"||t.type==="VISITA"))
      .map(t=>({orgId:t.organization?.id,orgName:t.organization?.name||"?",checkinTime:t.createdAt,checkoutTime:t.createdAt,note:t.text||"",userName:t.user?.name||"",taskType:"VISITA"}));
    setRemoteVisits(tasks);
  }catch(e){console.warn("loadRemote:",e);alert("Erro: "+e.message);}setRLo(false);};
  useEffect(()=>{if(selUser==="team")loadRemote();},[selUser,sd]);
  const useVisits=selUser==="me"?visits:remoteVisits;
  const pv=useMemo(()=>useVisits.filter(v=>{
    if(!v.checkoutTime)return false;
    if(selUser==="me"&&v.taskType&&v.taskType!=="VISITA")return false;
    // FIX: only show current user's visits in "me" mode
    if(selUser==="me"&&v.userName&&v.userName!==user.name)return false;
    const d=toLocalDate(v.checkinTime);
    return d>=sd&&d<=ed;
  }).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[useVisits,sd,ed,selUser,user.name]);
  const bd=useMemo(()=>{const m={};pv.forEach(v=>{const k=toLocalDate(v.checkinTime);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pv]);
  // FIX: when team, check for admin-set base (keyed as "userId_date"), fallback to team home
  const getRepBase=(dt)=>{if(selUser==="team"){const k=repUserId+"_"+dt;if(dayBases[k]?.start)return dayBases[k].start;if(dayBases[k])return dayBases[k];return HOMES[repUserId]||null;}return getBase(dayBases,dt,repUserId);};
  const getRepEnd=(dt)=>{if(selUser==="team"){const k=repUserId+"_"+dt;if(dayBases[k]?.end)return dayBases[k].end;return getRepBase(dt);}return getEnd(dayBases,dt,repUserId);};
  // FIX: use repUserId (correct user) for base resolution
  const calcDayKm=(dvs,dt)=>{let km=0;const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
    const b2=getRepBase(dt);const eb=getRepEnd(dt);
    const fc=getVCoord(s[0],plocs);
    if(b2&&fc)km+=hav(b2.lat,b2.lng,fc.lat,fc.lng)*1.3;
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId)continue;const ca=getVEndCoord(s[i-1],plocs);const cb=getVCoord(s[i],plocs);if(ca&&cb)km+=hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3;}
    const l=s[s.length-1];const endB=eb||b2;const lc=getVEndCoord(l,plocs);
    if(endB&&lc)km+=hav(lc.lat,lc.lng,endB.lat,endB.lng)*1.3;
    return km;};
  // FIX: calculate km segments for detailed export
  const calcSegKm=(dvs,dt)=>{const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
    const b2=getRepBase(dt);const eb=getRepEnd(dt);
    const segs=[];const fc=getVCoord(s[0],plocs);
    segs.push(b2&&fc?hav(b2.lat,b2.lng,fc.lat,fc.lng)*1.3:0);// first: base→pdv
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId){segs.push(0);continue;}
      const ca=getVEndCoord(s[i-1],plocs);const cb=getVCoord(s[i],plocs);
      segs.push(ca&&cb?hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3:0);}
    return segs;};
  const totKm=useMemo(()=>bd.reduce((acc,[dt,dvs])=>acc+calcDayKm(dvs,dt),0),[bd,dayBases,plocs,repUserId]);
  const workH=bd.reduce((s,[,d])=>{const sr=[...d].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const raw=mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime);return s+Math.max(0,raw-60);},0);
  const mx=Math.max(1,...bd.map(([,v])=>v.length));
    const firstCheckin=pv.length?fT(pv[0].checkinTime):"-";
    const lastCheckout=pv.length?fT(pv[pv.length-1].checkoutTime):"-";
    return(<div>
    {user?.id===743088&&<div style={{display:"flex",gap:4,marginBottom:8}}><button onClick={()=>setSelUser("me")} style={{flex:1,padding:8,fontSize:12,border:selUser==="me"?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:selUser==="me"?S.pri+"22":"transparent",color:selUser==="me"?S.pri:S.ts,fontWeight:selUser==="me"?600:400}}>Meus dados</button><button onClick={()=>setSelUser("team")} style={{flex:1,padding:8,fontSize:12,border:selUser==="team"?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:selUser==="team"?S.acc+"22":"transparent",color:selUser==="team"?S.acc:S.ts,fontWeight:selUser==="team"?600:400}}>{rLo?"Carregando...":"Alisson Henrique"}</button></div>}
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
      <button onClick={()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km","Jornada","Clientes"]];bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=getRepBase(dt);const eb=getRepEnd(dt);const dk=calcDayKm(dvs,dt);rows.push([fD(dt+"T12:00"),repUserName,b2?.label||"Casa",eb?.label||"Casa",dvs.length,dk.toFixed(1),hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)),dvs.map(v=>v.orgName).join(", ")]);});rows.push([],["TOTAL","","","",pv.length,totKm.toFixed(1),hrsMin(workH),""]);csv(rows,`km-${repUserName}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:11}}>Exportar Resumo</button>
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
            <span style={{fontSize:10,color:S.acc,fontWeight:500}}>{fT(sr[0].checkinTime)}</span>
            <span style={{fontSize:10,color:S.ts}}>{dayKm>0?`· ${dayKm.toFixed(0)}km`:""} · {hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime))}</span>
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

// ─── Inline base editor for Relatório with GPS + km estimate ───
function BaseEditInline({day,dayBases,userId,plocs,lastVisitCoord,onSave,onCancel,dayKey}){
  const home=HOMES[userId];const k=dayKey||day;const cur=dayBases[k]?.start||HOMES[userId];const curEnd=dayBases[k]?.end||cur;
  const[origType,setOrigType]=useState(cur?.type||"home");const[destType,setDestType]=useState(curEnd?.type||"home");
  const[origName,setOrigName]=useState(cur?.type==="hotel"?cur.label:"");const[destName,setDestName]=useState(curEnd?.type==="hotel"?curEnd.label:"");
  const[origLat,setOrigLat]=useState(cur?.type==="hotel"?cur.lat:null);const[origLng,setOrigLng]=useState(cur?.type==="hotel"?cur.lng:null);
  const[destLat,setDestLat]=useState(curEnd?.type==="hotel"?curEnd.lat:null);const[destLng,setDestLng]=useState(curEnd?.type==="hotel"?curEnd.lng:null);
  const[kmEst,setKmEst]=useState(null);
  useEffect(()=>{if(destType==="hotel"&&destLat&&lastVisitCoord){setKmEst(hav(lastVisitCoord.lat,lastVisitCoord.lng,destLat,destLng)*1.3);}else if(destType==="home"&&home&&lastVisitCoord){setKmEst(hav(lastVisitCoord.lat,lastVisitCoord.lng,home.lat,home.lng)*1.3);}else{setKmEst(null);}},[destType,destLat,destLng,lastVisitCoord]);
  const save=()=>{
    const start=origType==="home"&&home?{type:"home",...home}:{type:"hotel",lat:origLat||home?.lat,lng:origLng||home?.lng,label:origName||"Hotel"};
    const end=destType==="home"&&home?{type:"home",...home}:{type:"hotel",lat:destLat||home?.lat,lng:destLng||home?.lng,label:destName||"Hotel"};
    onSave(day,start,end);};
  return(<div style={{background:S.cl,border:`1px solid ${S.acc}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
    <p style={{fontWeight:500,fontSize:13,margin:"0 0 8px"}}>Corrigir {fD(day+"T12:00")}</p>
    <LB t="ORIGEM"><div style={{display:"flex",gap:6,marginBottom:4}}><button onClick={()=>setOrigType("home")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${origType==="home"?S.pri:S.brd}`,background:origType==="home"?S.pri+"22":"transparent",color:origType==="home"?S.pri:S.ts}}>🏠 Casa</button><button onClick={()=>setOrigType("hotel")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${origType==="hotel"?S.gold:S.brd}`,background:origType==="hotel"?S.gold+"22":"transparent",color:origType==="hotel"?S.gold:S.ts}}>🏨 Hotel</button></div>
      {origType==="hotel"&&<HotelGeoInput name={origName} onNameChange={setOrigName} lat={origLat} lng={origLng} onCoordsChange={(la,ln)=>{setOrigLat(la);setOrigLng(ln);}} label="Hotel de origem"/>}
    </LB>
    <LB t="DESTINO"><div style={{display:"flex",gap:6,marginBottom:4}}><button onClick={()=>setDestType("home")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${destType==="home"?S.pri:S.brd}`,background:destType==="home"?S.pri+"22":"transparent",color:destType==="home"?S.pri:S.ts}}>🏠 Casa</button><button onClick={()=>setDestType("hotel")} style={{flex:1,padding:6,fontSize:11,border:`1px solid ${destType==="hotel"?S.gold:S.brd}`,background:destType==="hotel"?S.gold+"22":"transparent",color:destType==="hotel"?S.gold:S.ts}}>🏨 Hotel</button></div>
      {destType==="hotel"&&<HotelGeoInput name={destName} onNameChange={setDestName} lat={destLat} lng={destLng} onCoordsChange={(la,ln)=>{setDestLat(la);setDestLng(ln);}} label="Hotel de destino"/>}
    </LB>
    {kmEst!=null&&<p style={{fontSize:11,color:S.acc,margin:"0 0 8px"}}>Km estimado último PDV → {destType==="hotel"?destName||"Hotel":"Casa"}: {kmEst.toFixed(1)} km</p>}
    <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1,fontSize:11}}>Cancelar</button><button onClick={save} style={{flex:1,fontSize:11,background:S.acc,border:"none",fontWeight:600}}>Salvar</button></div>
  </div>);}

// ═══════════════════════════════════════════════════════════════
// FIX: EquipeTab — filter by EXACT date, not from date onwards
// ═══════════════════════════════════════════════════════════════
function EquipeTab({token,plocs,orgs,dayBases}){
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[sel,setSel]=useState(todayLocal());const[routeKm,setRouteKm]=useState(null);const[err,setErr]=useState("");
  const getCoord=(oid)=>{if(plocs[oid])return[plocs[oid].lat,plocs[oid].lng];const o=orgs.find(x=>x.id===oid);if(o){const g=geoEstimate(o);if(g)return g;}return null;};
  const load=async()=>{setLo(true);setRouteKm(null);setErr("");try{
    // FIX: use both createdDateGt AND createdDateLt for EXACT day
    const dtStart=sel+"T00:00:00Z";
    const nextDay=new Date(sel+"T12:00:00");nextDay.setDate(nextDay.getDate()+1);
    const dtEnd=toLocalDate(nextDay)+"T00:00:00Z";
    setErr("Buscando...");
    const d=await agF(`/tasks?createdDateGt=${dtStart}&createdDateLt=${dtEnd}&per_page=100`,token);
    const all=d.data||[];
    const alisson=all.filter(t=>t.user?.id===743347).map(t=>({type:t.type||"?",org:t.organization?.name||"?",orgId:t.organization?.id,text:t.text||"",time:t.createdAt,done:t.done}));
    setTasks(alisson);setErr(`${all.length} total, ${alisson.length} Alisson`);
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

// ─── AgendaTab: tarefas pendentes do Agendor ───
function AgendaTab({token,user,allOrgs}){
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[err,setErr]=useState("");const isAdmin=user?.id===743088;
  const[filter,setFilter]=useState("pending");// pending | done
  const[period,setPeriod]=useState("all");// all | week | today | custom
  const[customFrom,setCustomFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});
  const[customTo,setCustomTo]=useState(todayLocal);
  const[userFilter,setUserFilter]=useState("all");// all | jordan | alisson
  const[showAdd,setShowAdd]=useState(false);const[addQ,setAddQ]=useState("");const[addOrg,setAddOrg]=useState(null);
  const[addType,setAddType]=useState("VISITA");const[addText,setAddText]=useState("");const[addDate,setAddDate]=useState("");const[addTime,setAddTime]=useState("09:00");const[addLo,setAddLo]=useState(false);
  const load=async()=>{setLo(true);setErr("");try{
    const now=new Date();let all=[];
    for(let w=0;w<6;w++){const from=new Date(now);from.setDate(from.getDate()-30*(w+1));const to=new Date(now);to.setDate(to.getDate()-30*w);
      setErr(`${all.length} tasks (${w*30}d)...`);
      let pg=1;while(true){const d=await agF(`/tasks?createdDateGt=${from.toISOString()}&createdDateLt=${to.toISOString()}&per_page=100&page=${pg}`,token);if(!d.data?.length)break;all.push(...d.data);if(d.data.length<100)break;pg++;}}
    // ONLY tasks with due_date (tarefas agendadas), NOT activities (logs without schedule)
    // done field is ALWAYS null in Agendor API — use finishedAt to determine completion
    const mapped=all.filter(t=>t.due_date||t.dueDate).map(t=>({id:t.id,type:t.type||"?",org:t.organization?.name||"?",orgId:t.organization?.id,text:t.text||"",due:t.due_date||t.dueDate||null,created:t.createdAt,done:!!(t.finishedAt||t.done),finished:t.finishedAt||null,userName:t.user?.name||"?",userId:t.user?.id}));
    setTasks(mapped);setErr(`${mapped.length} tarefas · atualizado ${fT(new Date())}`);
  }catch(e){console.warn("agenda:",e);setErr("Erro: "+e.message);}setLo(false);};
  useEffect(()=>{load();const iv=setInterval(()=>{load();},300000);return()=>clearInterval(iv);},[]);// Auto-refresh 5min
  const markDone=async(t)=>{if(!confirm(`Finalizar "${t.text.slice(0,50)}..."?`))return;try{
    // Agendor API ignores done:true on PUT — use DELETE + POST activity
    await agF(`/organizations/${t.orgId}/tasks/${t.id}`,token,{method:"DELETE"});
    await agF(`/organizations/${t.orgId}/tasks`,token,{method:"POST",body:JSON.stringify({text:"[CONCLUIDA] "+t.text,type:t.type,done:true})});
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true,finished:new Date().toISOString()}:x));setErr("Finalizada!");
  }catch(e){console.warn("markDone:",e);alert("Erro: "+e.message);}};
  const addTask=async()=>{if(!addOrg||!addText.trim())return;setAddLo(true);try{const body={text:addText,type:addType,done:false};if(addDate)body.due_date=`${addDate}T${addTime}:00-04:00`;await agF(`/organizations/${addOrg.id}/tasks`,token,{method:"POST",body:JSON.stringify(body)});setShowAdd(false);setAddOrg(null);setAddText("");setAddDate("");await load();}catch(e){alert("Erro: "+e.message);}setAddLo(false);};
  // Filters
  const today=todayLocal();const dow=new Date().getDay();const weekStart=toLocalDate(new Date(Date.now()-dow*86400000));const weekEnd=toLocalDate(new Date(Date.now()+(6-dow)*86400000));
  const filtered=useMemo(()=>{let list=tasks.filter(t=>filter==="pending"?!t.done:t.done);
    if(!isAdmin||userFilter!=="all"){const uid=userFilter==="alisson"?743347:userFilter==="jordan"?743088:user.id;list=list.filter(t=>isAdmin&&userFilter==="all"?true:t.userId===uid);}
    if(period==="today")list=list.filter(t=>(t.due&&t.due.slice(0,10)===today)||(t.created&&toLocalDate(t.created)===today));
    if(period==="week")list=list.filter(t=>{const d=t.due?t.due.slice(0,10):toLocalDate(t.created);return d>=weekStart&&d<=weekEnd;});
    if(period==="custom")list=list.filter(t=>{const d=t.due?t.due.slice(0,10):toLocalDate(t.created);return d>=customFrom&&d<=customTo;});
    return list.sort((a,b)=>(a.due||a.created||"9").localeCompare(b.due||b.created||"9"));
  },[tasks,filter,period,today,weekStart,weekEnd,customFrom,customTo,userFilter,isAdmin,user.id]);
  const overdue=filtered.filter(t=>!t.done&&t.due&&t.due.slice(0,10)<today);
  const todayT=filtered.filter(t=>t.due&&t.due.slice(0,10)===today);
  const futureT=filtered.filter(t=>!t.done&&t.due&&t.due.slice(0,10)>today);
  const noDueT=filtered.filter(t=>!t.due);
  const doneT=filtered.filter(t=>t.done);
  // Add task: search orgs
  const addResults=addQ.trim().length>=2?allOrgs.filter(o=>[o.name,o.nickname,o.legalName,o.cnpj].filter(Boolean).some(f=>f.toLowerCase().includes(addQ.toLowerCase()))).slice(0,8):[];
  const renderTask=(t)=><div key={t.id} style={{background:S.cl,borderRadius:8,padding:"10px 12px",marginBottom:4,display:"flex",gap:8,alignItems:"flex-start"}}>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#fff",background:t.type==="Visita"?S.acc:t.type==="WhatsApp"?S.ok:S.pri,padding:"1px 6px",borderRadius:4}}>{t.type}</span>
        <p style={{fontSize:12,fontWeight:500,margin:0,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.org}</p>
        {isAdmin&&<span style={{fontSize:9,color:S.acc,background:S.acc+"18",padding:"1px 6px",borderRadius:4}}>{t.userName?.split(" ")[0]}</span>}
      </div>
      <p style={{fontSize:11,color:S.ts,margin:"3px 0",wordBreak:"break-word"}}>{t.text}</p>
      <p style={{fontSize:10,color:t.done?S.ok:t.due&&t.due.slice(0,10)<today?S.dng:S.td,margin:0}}>{t.due?`Prazo: ${fD(t.due)} ${fT(t.due)}`:`Criada: ${fD(t.created)}`}{t.done&&t.finished?` · Finalizada ${fD(t.finished)}`:""}</p>
    </div>
    {!t.done&&<button onClick={()=>markDone(t)} style={{padding:"6px 12px",fontSize:11,background:S.ok+"22",border:`1px solid ${S.ok}`,color:S.ok,borderRadius:6,flexShrink:0,fontWeight:500}}>Finalizar</button>}
    {t.done&&<span style={{fontSize:18,flexShrink:0}}>✅</span>}
  </div>;
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <p style={{fontWeight:600,fontSize:16,margin:0}}>📅 Agenda</p>
      <div style={{display:"flex",gap:4}}><button onClick={()=>setShowAdd(true)} style={{padding:"6px 12px",fontSize:11,background:S.acc,border:"none",fontWeight:600}}>+ Tarefa</button><button onClick={load} disabled={lo} style={{padding:"6px 12px",fontSize:11,background:S.pri,border:"none"}}>{lo?"...":"🔄"}</button></div>
    </div>
    {/* Pendentes / Finalizadas */}
    <div style={{display:"flex",gap:3,marginBottom:8}}><button onClick={()=>setFilter("pending")} style={{flex:1,padding:8,fontSize:12,border:filter==="pending"?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:filter==="pending"?S.pri+"22":"transparent",color:filter==="pending"?S.pri:S.ts,fontWeight:filter==="pending"?600:400}}>Pendentes</button><button onClick={()=>setFilter("done")} style={{flex:1,padding:8,fontSize:12,border:filter==="done"?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:filter==="done"?S.ok+"22":"transparent",color:filter==="done"?S.ok:S.ts,fontWeight:filter==="done"?600:400}}>Finalizadas</button></div>
    {/* Period filters */}
    <div style={{display:"flex",gap:3,marginBottom:6}}>{[["all","Todas"],["week","Semana"],["today","Hoje"],["custom","Definir"]].map(([k,l])=><button key={k} onClick={()=>setPeriod(k)} style={{flex:1,padding:6,fontSize:10,border:`1px solid ${period===k?S.gold:S.brd}`,background:period===k?S.gold+"18":"transparent",color:period===k?S.gold:S.td,borderRadius:6,fontWeight:period===k?600:400}}>{l}</button>)}</div>
    {period==="custom"&&<div style={{display:"flex",gap:4,marginBottom:6,alignItems:"center"}}><input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{flex:1,fontSize:10,padding:4}}/><span style={{color:S.td,fontSize:10}}>a</span><input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{flex:1,fontSize:10,padding:4}}/></div>}
    {/* User filter (admin) */}
    {isAdmin&&<div style={{display:"flex",gap:3,marginBottom:8}}>{[["all","Todos"],["jordan","Jordan"],["alisson","Alisson"]].map(([k,l])=><button key={k} onClick={()=>setUserFilter(k)} style={{flex:1,padding:5,fontSize:10,border:`1px solid ${userFilter===k?S.acc:S.brd}`,background:userFilter===k?S.acc+"18":"transparent",color:userFilter===k?S.acc:S.td,borderRadius:6}}>{l}</button>)}</div>}
    {err&&<p style={{fontSize:11,color:err.startsWith("Erro")?S.dng:S.acc,margin:"0 0 8px",padding:"4px 10px",background:S.cl,borderRadius:6}}>{err}</p>}
    <p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>{filtered.length} tarefa(s){filter==="pending"?" pendentes":" finalizadas"}</p>
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando...</p>}
    {!lo&&filter==="pending"&&<>{overdue.length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.dng,margin:"0 0 4px"}}>⚠️ Atrasadas ({overdue.length})</p>{overdue.map(renderTask)}</>}
      {todayT.filter(t=>!t.done).length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.gold,margin:"8px 0 4px"}}>📌 Hoje ({todayT.filter(t=>!t.done).length})</p>{todayT.filter(t=>!t.done).map(renderTask)}</>}
      {futureT.length>0&&<><p style={{fontSize:11,fontWeight:600,color:S.pri,margin:"8px 0 4px"}}>🗓️ Próximas ({futureT.length})</p>{futureT.map(renderTask)}</>}</>}
    {!lo&&filter==="done"&&<>{doneT.length?doneT.map(renderTask):<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma finalizada no período</p>}</>}
    {!lo&&!filtered.length&&filter==="pending"&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma tarefa pendente</p>}
    {/* Add Task Modal */}
    {showAdd&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
      <p style={{fontWeight:600,fontSize:16,margin:"0 0 8px"}}>+ Nova Tarefa</p>
      {!addOrg?<><input value={addQ} onChange={e=>setAddQ(e.target.value)} placeholder="Buscar cliente..." style={{width:"100%",marginBottom:6,fontSize:13}} autoFocus/>
        {addResults.map(o=><div key={o.id} onClick={()=>{setAddOrg(o);setAddQ("");}} style={{padding:"8px",background:S.cl,borderRadius:6,marginBottom:3,cursor:"pointer",fontSize:12}}><b>{o.name}</b><span style={{color:S.ts,marginLeft:6,fontSize:10}}>{o.addr?.city_name||""}</span></div>)}
        <button onClick={()=>setShowAdd(false)} style={{width:"100%",marginTop:8}}>Cancelar</button>
      </>:<>
        <div style={{background:S.cl,borderRadius:8,padding:8,marginBottom:8}}><p style={{fontSize:13,fontWeight:600,margin:0}}>{addOrg.name}</p><p style={{fontSize:10,color:S.ts,margin:0}}>{addOrg.cnpj||""} · {addOrg.addr?.city_name||""}</p></div>
        <LB t="TIPO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{TYPES.map(t=><button key={t.id} onClick={()=>setAddType(t.id)} style={{padding:5,fontSize:9,border:addType===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:addType===t.id?S.cl:S.bg,color:addType===t.id?S.pl:S.ts}}>{t.l}</button>)}</div></LB>
        <LB t="DESCRIÇÃO *"><textarea value={addText} onChange={e=>setAddText(e.target.value)} rows={2} placeholder="O que precisa ser feito?" style={{width:"100%"}}/></LB>
        <LB t="PRAZO"><div style={{display:"flex",gap:6}}><input type="date" value={addDate} onChange={e=>setAddDate(e.target.value)} style={{flex:1}}/><input type="time" value={addTime} onChange={e=>setAddTime(e.target.value)} style={{width:80}}/></div></LB>
        <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>{setShowAdd(false);setAddOrg(null);}} style={{flex:1}}>Cancelar</button><button onClick={addTask} disabled={addLo||!addText.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{addLo?"...":"Criar Tarefa"}</button></div>
      </>}
    </div></div>}
  </div>);}
// ─── Progress Bar Component ───
function ProgressBar({active,msg}){if(!active)return null;return(<div style={{width:"100%",marginBottom:8}}>
  <div style={{height:4,background:S.brd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:S.pri,borderRadius:2,animation:"progFill 2s ease-in-out infinite",width:"60%"}}/>
  </div><p style={{fontSize:11,color:S.acc,margin:"4px 0 0",textAlign:"center"}}>{msg}</p>
  <style>{`@keyframes progFill{0%{width:5%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:5%;margin-left:95%}}`}</style>
</div>);}

// ─── ConfigTab with GPS delete, confirmations, progress ───
function ConfigTab({user,orgs,visits,plocs,dayBases,today,syncStatus,syncing,syncMsg,onSync,onLoadHistory,onSyncPull,onShareGPS,onShowDB,onShowEnd,onDeleteGPS,onSaveGPS,onClearVisits,onClearAllGPS,onLogout}){
  const[gpsSearch,setGpsSearch]=useState("");const[histLoading,setHistLoading]=useState(false);const[shareLoading,setShareLoading]=useState(false);
  const[gpsAddSearch,setGpsAddSearch]=useState("");const[gpsAddTarget,setGpsAddTarget]=useState(null);const[gpsAddLat,setGpsAddLat]=useState(null);const[gpsAddLng,setGpsAddLng]=useState(null);
  const gpsResults=gpsSearch.trim().length>=2?orgs.filter(o=>{const q=gpsSearch.toLowerCase().replace(/[.\-\/]/g,"");return plocs[o.id]&&[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  const gpsAddResults=gpsAddSearch.trim().length>=2?orgs.filter(o=>{const q=gpsAddSearch.toLowerCase().replace(/[.\-\/]/g,"");return[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,"")].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,10):[];
  return(<div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:15,fontWeight:600,margin:"0 0 4px"}}>{user?.name}</p>
      {HOMES[user?.id]&&<p style={{fontSize:12,color:S.ok}}>Casa: {HOMES[user.id].label}</p>}
      {getBase(dayBases,today,user?.id)&&<p style={{fontSize:11,color:S.ts,margin:"2px 0 0"}}>Base hoje: {getBase(dayBases,today,user?.id)?.label||"Casa"}{getEnd(dayBases,today,user?.id)!==getBase(dayBases,today,user?.id)?` → ${getEnd(dayBases,today,user?.id)?.label||"Casa"}`:""}</p>}
    </div>
    <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}>
      <p style={{fontSize:12,color:S.ts}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p>
      <p style={{fontSize:11,color:syncStatus.startsWith?.("Erro")?S.dng:S.acc,margin:"4px 0 0"}}>Sync: {syncStatus||"aguardando..."}</p>
      <p style={{fontSize:10,color:S.td,margin:"2px 0 0"}}>User ID: {user?.id} | Polling: 15s | TZ: Cuiabá | v12.1</p>
    </div>
    <ProgressBar active={syncing||histLoading||shareLoading} msg={syncing?syncMsg:histLoading?"Carregando historico...":"Enviando GPS..."}/>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
      <button onClick={onSync} disabled={syncing} style={{padding:14,fontSize:14,fontWeight:500,background:S.pri,border:"none",position:"relative",overflow:"hidden"}}>{syncing?syncMsg:"🔄 Sincronizar Clientes"}</button>
      <button onClick={async()=>{setHistLoading(true);await onLoadHistory();setHistLoading(false);}} disabled={histLoading} style={{padding:12,fontSize:13,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc,fontWeight:500}}>{histLoading?"⏳ Carregando...":"📥 Carregar historico do Agendor"}</button>
      <button onClick={onSyncPull} style={{padding:12,fontSize:13,background:S.gold+"22",border:`1px solid ${S.gold}`,color:S.gold,fontWeight:500}}>⚡ Forçar sincronização</button>
      <button onClick={async()=>{if(!confirm("Compartilhar GPS com equipe?"))return;setShareLoading(true);await onShareGPS();setShareLoading(false);}} disabled={shareLoading} style={{padding:12,fontSize:13,background:S.ok+"22",border:`1px solid ${S.ok}`,color:S.ok,fontWeight:500}}>{shareLoading?"⏳ Enviando...":"📡 Compartilhar "+Object.keys(plocs).length+" GPS com equipe"}</button>
      <button onClick={onShowDB} style={{padding:12}}>🗺️ Definir jornada (origem e destino)</button>
      <button onClick={onShowEnd} style={{padding:12}}>🏨 Fechar roteiro do dia</button>
      <button onClick={()=>{if(!("Notification"in window)){alert("Navegador nao suporta notificacoes");return;}Notification.requestPermission().then(p=>{if(p==="granted")alert("Notificacoes ativadas! Voce recebera lembretes de tarefas agendadas.");else alert("Notificacoes bloqueadas. Ative nas configuracoes do navegador.");});}} style={{padding:12,background:("Notification"in window&&Notification.permission==="granted")?S.ok+"22":S.gold+"22",border:`1px solid ${("Notification"in window&&Notification.permission==="granted")?S.ok:S.gold}`,color:("Notification"in window&&Notification.permission==="granted")?S.ok:S.gold}}>
        {("Notification"in window&&Notification.permission==="granted")?"🔔 Notificações ativadas":"🔕 Ativar notificações"}
      </button>

      {/* Admin area (Jordan only) */}
      {user?.id===743088&&<>
        <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:12,marginTop:4}}>
          <p style={{fontSize:12,fontWeight:600,color:S.gold,margin:"0 0 8px"}}>⚙️ Administrador</p>
        </div>
        {/* GPS manual save */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
          <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>📍 Salvar GPS de cliente</p>
          <input value={gpsAddSearch} onChange={e=>{setGpsAddSearch(e.target.value);setGpsAddTarget(null);setGpsAddLat(null);setGpsAddLng(null);}} placeholder="Buscar cliente por nome, CNPJ..." style={{width:"100%",marginBottom:6,fontSize:12}}/>
          {!gpsAddTarget&&gpsAddResults.length>0&&<div style={{maxHeight:160,overflowY:"auto"}}>
            {gpsAddResults.map(o=><div key={o.id} onClick={()=>{setGpsAddTarget(o);if(plocs[o.id]){setGpsAddLat(plocs[o.id].lat);setGpsAddLng(plocs[o.id].lng);}}} style={{padding:"6px 0",borderBottom:`1px solid ${S.brd}`,cursor:"pointer"}}>
              <p style={{fontSize:12,fontWeight:500,margin:0}}>{plocs[o.id]?"🟢 ":"⚪ "}{o.name}</p>
              <p style={{fontSize:10,color:S.ts,margin:0}}>{o.cnpj||""} · {o.addr?.city_name||o.addr?.city||""}{plocs[o.id]?` · GPS: ${plocs[o.id].lat.toFixed(4)},${plocs[o.id].lng.toFixed(4)}`:""}</p>
            </div>)}
          </div>}
          {gpsAddTarget&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <p style={{fontSize:12,fontWeight:600,margin:0}}>{gpsAddTarget.name}</p>
              <button onClick={()=>{setGpsAddTarget(null);setGpsAddLat(null);setGpsAddLng(null);}} style={{fontSize:10,padding:"2px 8px",color:S.td}}>✕</button>
            </div>
            <HotelGeoInput name={gpsAddTarget.addr?.city_name||gpsAddTarget.name} onNameChange={()=>{}} lat={gpsAddLat} lng={gpsAddLng} onCoordsChange={(la,ln)=>{setGpsAddLat(la);setGpsAddLng(ln);}} label="Buscar localização no Maps"/>
            <button onClick={()=>{if(!gpsAddLat||!gpsAddLng){alert("Defina as coordenadas primeiro.");return;}if(confirm(`Salvar GPS de ${gpsAddTarget.name}?\n${gpsAddLat.toFixed(5)}, ${gpsAddLng.toFixed(5)}`)){onSaveGPS(gpsAddTarget.id,gpsAddLat,gpsAddLng);setGpsAddTarget(null);setGpsAddSearch("");setGpsAddLat(null);setGpsAddLng(null);}}} disabled={!gpsAddLat||!gpsAddLng} style={{width:"100%",marginTop:6,padding:8,fontSize:12,background:gpsAddLat?S.ok:S.cl,border:"none",fontWeight:600}}>💾 Salvar GPS</button>
          </div>}
        </div>
        {/* GPS delete per client */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px"}}>
          <p style={{fontSize:12,fontWeight:500,margin:"0 0 6px"}}>🗑️ Apagar GPS de cliente</p>
          <input value={gpsSearch} onChange={e=>setGpsSearch(e.target.value)} placeholder="Buscar por nome, CNPJ..." style={{width:"100%",marginBottom:6,fontSize:12}}/>
          {gpsResults.length>0&&<div style={{maxHeight:200,overflowY:"auto"}}>
            {gpsResults.map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${S.brd}`}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:12,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</p>
                <p style={{fontSize:10,color:S.ts,margin:0}}>{o.cnpj||""} · GPS: {plocs[o.id]?.lat?.toFixed(4)},{plocs[o.id]?.lng?.toFixed(4)}</p>
              </div>
              <button onClick={()=>{if(confirm(`Apagar GPS de ${o.name}?`)){onDeleteGPS(o.id);setGpsSearch("");}}} style={{padding:"4px 10px",fontSize:10,background:S.dng+"22",border:`1px solid ${S.dng}`,color:S.dng,flexShrink:0}}>Apagar</button>
            </div>)}
          </div>}
          {gpsSearch.trim().length>=2&&!gpsResults.length&&<p style={{fontSize:11,color:S.ts}}>Nenhum cliente com GPS encontrado</p>}
        </div>
        <button onClick={()=>{const dt=prompt("Data para limpar visitas (DD/MM/AAAA):");if(!dt)return;const[d,m,y]=dt.split("/");const target=`${y}-${m}-${d}`;const count=visits.filter(v=>v.checkinTime?.startsWith(target)).length;if(!count){alert("Nenhuma visita nessa data.");return;}if(confirm(`Tem certeza que deseja excluir ${count} visitas de ${dt}?\nEssa ação não pode ser desfeita.`))onClearVisits(target);}} style={{color:S.gold}}>🗓️ Limpar visitas (por data)</button>
        <button onClick={()=>{if(confirm(`Tem certeza que deseja apagar TODOS os ${Object.keys(plocs).length} GPS salvos?\nEssa ação não pode ser desfeita.`))onClearAllGPS();}} style={{color:S.gold}}>📍 Limpar todos GPS PDVs</button>
      </>}
      <button onClick={()=>{if(confirm("Deseja realmente desconectar?\nVoce precisara inserir o token novamente."))onLogout();}} style={{color:S.dng,marginTop:8}}>🚪 Desconectar</button>
    </div>
  </div>);}

// ─── SearchOrAddModal: CNPJ first, then register if not found ───
function SearchOrAddModal({token,allOrgs,onFound,onNewClient,onCancel}){
  const[q,setQ]=useState("");const[lo,setLo]=useState(false);const[results,setResults]=useState([]);const[selected,setSelected]=useState(null);const[err,setErr]=useState("");const[step,setStep]=useState("search");
  const[people,setPeople]=useState([]);const[pLo,setPLo]=useState(false);const[showPeople,setShowPeople]=useState(false);
  const[addP,setAddP]=useState(false);const[pName,setPName]=useState("");const[pCargo,setPCargo]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const search=()=>{if(!q.trim()){setErr("Digite CNPJ, nome ou razão social");return;}setLo(true);setErr("");setResults([]);setSelected(null);
    const clean=q.replace(/[.\-\/]/g,"").toLowerCase();
    const matches=allOrgs.filter(o=>{if(o.cnpj?.replace(/[.\-\/]/g,"")===clean)return true;return[o.name,o.nickname,o.legalName].filter(Boolean).some(f=>f.toLowerCase().includes(clean));}).slice(0,30);
    if(matches.length){setResults(matches);setStep("list");setLo(false);return;}
    if(clean.length===14){setLo(true);fetchCNPJ(clean).then(rf=>{setSelected({rfData:rf,name:rf.nome_fantasia||rf.razao_social||"",cnpj:clean});setStep("notfound_rf");setLo(false);}).catch(()=>{setStep("notfound");setLo(false);});return;}
    setStep("notfound");setLo(false);};
  const selectClient=(org)=>{setSelected(org);setStep("found");};
  const loadPeople=async(orgId)=>{setPLo(true);try{const d=await agF(`/organizations/${orgId}/people?per_page=50`,token);setPeople(d.data||[]);}catch(e){console.warn("people:",e);setPeople([]);}setPLo(false);setShowPeople(true);};
  const pCanSave=pName.trim()&&pEmail.trim()&&pWhats.trim();
  const addPerson=async()=>{if(!pCanSave||!selected?.id)return;setPLo(true);try{const ct={};if(pEmail.trim())ct.email=pEmail.trim();if(pPhone.trim())ct.mobile=pPhone.trim();if(pWhats.trim())ct.whatsapp=pWhats.trim();await agF("/people",token,{method:"POST",body:JSON.stringify({name:pName,organization:selected.id,...(pCargo?{role:pCargo}:{}),contact:ct})});await loadPeople(selected.id);setAddP(false);setPName("");setPCargo("");setPEmail("");setPPhone("");setPWhats("");}catch(e){alert("Erro: "+e.message);}setPLo(false);};
  const catColor=CC[selected?.cat]||S.ts;const isExcluido=selected?.cat==="Excluido";
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
    {step==="search"&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Buscar / Cadastrar Cliente</p>
      <p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>CNPJ, nome fantasia ou razão social</p>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex: Compacta, Tropical, Bom Jesus..." style={{width:"100%",marginBottom:8,fontSize:14}} onKeyDown={e=>e.key==="Enter"&&search()} autoFocus/>
      {err&&<p style={{fontSize:12,color:S.dng,margin:"0 0 6px"}}>{err}</p>}
      <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={search} disabled={lo||!q.trim()} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"🔍...":"Buscar"}</button></div></>}
    {step==="list"&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>{results.length} cliente(s) encontrado(s)</p>
      <p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>"{q}"</p>
      <div style={{maxHeight:"55vh",overflowY:"auto",marginBottom:8}}>{results.map(o=><div key={o.id} onClick={()=>selectClient(o)} style={{background:S.cl,borderRadius:8,padding:"10px 12px",marginBottom:4,cursor:"pointer",border:`1px solid ${S.brd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{o.name||o.nickname}</p><span style={{fontSize:9,color:"#fff",background:CC[o.cat]||S.ts,padding:"2px 6px",borderRadius:4,flexShrink:0}}>{o.cat}</span></div>
        {o.legalName&&o.legalName!==o.name&&<p style={{fontSize:10,color:S.ts,margin:"2px 0 0"}}>{o.legalName}</p>}
        <p style={{fontSize:10,color:S.td,margin:"1px 0 0"}}>{o.cnpj||""}{o.addr?.city_name||o.addr?.city?` · ${o.addr.city_name||o.addr.city}`:""}{o.owner?` · ${o.owner}`:""}</p>
      </div>)}</div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("search");setResults([]);}} style={{flex:1}}>← Voltar</button><button onClick={onCancel} style={{flex:1}}>Fechar</button></div></>}
    {step==="found"&&selected&&!showPeople&&<>
      <p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:isExcluido?S.gold:S.ok}}>{isExcluido?"📋 Cadastro encontrado":"✅ Cliente selecionado"}</p>
      <div style={{background:S.cl,borderRadius:10,padding:12,margin:"8px 0 12px"}}><p style={{fontSize:14,fontWeight:600,margin:"0 0 2px"}}>{selected.name||selected.nickname}</p>{selected.legalName&&selected.legalName!==selected.name&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{selected.legalName}</p>}{selected.cnpj&&<p style={{fontSize:11,color:S.ts,margin:"0 0 2px"}}>{selected.cnpj}</p>}<div style={{display:"flex",gap:4,alignItems:"center",marginTop:4}}><span style={{fontSize:10,color:"#fff",background:catColor,padding:"2px 8px",borderRadius:4,fontWeight:500}}>{selected.cat||"?"}</span><span style={{fontSize:11,color:S.ts}}>{selected.addr?.city_name||selected.addr?.city||""}</span></div>{selected.owner&&<p style={{fontSize:10,color:S.ts,margin:"4px 0 0"}}>Responsável: {selected.owner}</p>}</div>
      <p style={{fontSize:12,color:S.gold,fontWeight:500,margin:"0 0 8px"}}>Tipo de atendimento:</p>
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>{TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${selected.name}:`);if(note?.trim()){postTask(token,selected.id,note,t.id,true).then(()=>alert("Registrado!")).catch(e=>alert("Erro: "+e.message));onCancel();}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>{t.id==="VISITA"?"📍":t.id==="WHATSAPP"?"💬":t.id==="LIGACAO"?"📞":t.id==="EMAIL"?"📧":t.id==="REUNIAO"?"🤝":"📄"} {t.l}</button>)}</div>
      <button onClick={()=>loadPeople(selected.id)} style={{width:"100%",marginBottom:8,padding:10,fontSize:12,background:S.pri+"22",border:`1px solid ${S.pri}`,color:S.pri,fontWeight:500}}>{pLo?"...":"👤 Ver / Adicionar Contatos"}</button>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("list");setSelected(null);setShowPeople(false);}} style={{flex:1}}>← Voltar</button>{!isExcluido&&<button onClick={()=>{onFound(selected);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Ir ao cliente</button>}{isExcluido&&<button onClick={onCancel} style={{flex:1}}>Fechar</button>}</div></>}
    {step==="found"&&showPeople&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontWeight:600,fontSize:14,margin:0}}>👤 Contatos</p><button onClick={()=>setShowPeople(false)} style={{fontSize:10,padding:"4px 10px"}}>← Voltar</button></div>
      {people.length===0&&!pLo&&<p style={{fontSize:12,color:S.ts,textAlign:"center",padding:"1rem 0"}}>Nenhum contato</p>}
      {people.map(p=><div key={p.id} style={{background:S.cl,borderRadius:8,padding:10,marginBottom:6}}><p style={{fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{p.name}</p>{p.role&&<p style={{fontSize:10,color:S.acc,margin:"0 0 2px"}}>{p.role}</p>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.contact?.email&&<span style={{fontSize:10,color:S.ts}}>📧 {p.contact.email}</span>}{p.contact?.mobile&&<span style={{fontSize:10,color:S.ts}}>📱 {p.contact.mobile}</span>}{p.contact?.whatsapp&&<a href={`https://wa.me/55${p.contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener" style={{fontSize:10,color:S.ok,textDecoration:"none"}}>💬 {p.contact.whatsapp}</a>}</div></div>)}
      {!addP&&<button onClick={()=>setAddP(true)} style={{width:"100%",padding:10,fontSize:12,background:S.acc,border:"none",fontWeight:600,marginTop:4}}>+ Adicionar Contato</button>}
      {addP&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:6}}><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome *" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pName.trim()?S.brd:S.dng}`}}/><select value={pCargo} onChange={e=>setPCargo(e.target.value)} style={{width:"100%",marginBottom:4,fontSize:12}}><option value="">Cargo...</option>{CARGOS.map(c=><option key={c} value={c}>{c}</option>)}</select><input value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="E-mail *" type="email" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pEmail.trim()?S.brd:S.dng}`}}/><input value={pPhone} onChange={e=>setPPhone(e.target.value)} placeholder="Telefone" style={{width:"100%",marginBottom:4,fontSize:12}}/><input value={pWhats} onChange={e=>setPWhats(e.target.value)} placeholder="WhatsApp *" style={{width:"100%",marginBottom:6,fontSize:12,border:`1px solid ${pWhats.trim()?S.brd:S.dng}`}}/><div style={{display:"flex",gap:6}}><button onClick={()=>setAddP(false)} style={{flex:1,fontSize:11}}>Cancelar</button><button onClick={addPerson} disabled={pLo||!pCanSave} style={{flex:1,fontSize:11,background:pCanSave?S.acc:S.cl,border:"none",fontWeight:600}}>{pLo?"...":"Salvar"}</button></div></div>}</>}
    {(step==="notfound"||step==="notfound_rf")&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Cliente não encontrado</p><p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>{q} não cadastrado no Agendor</p>{step==="notfound_rf"&&selected?.rfData&&<div style={{background:S.cl,borderRadius:10,padding:10,margin:"0 0 8px"}}><p style={{fontSize:11,color:S.acc,margin:"0 0 2px"}}>Receita Federal:</p><p style={{fontSize:12,fontWeight:500,margin:"0 0 1px"}}>{selected.rfData.nome_fantasia||"-"}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{selected.rfData.razao_social||""}</p><p style={{fontSize:10,color:S.ts,margin:0}}>{selected.rfData.municipio||""}/{selected.rfData.uf||""}</p></div>}<div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("search");setSelected(null);}} style={{flex:1}}>Voltar</button><button onClick={()=>{onNewClient(q.replace(/[.\-\/]/g,""),selected?.rfData||null);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Cadastrar Novo</button></div></>}
  </div></div>);}
export default function App(){
  const[token,setToken]=useState(()=>sL("jc:token",""));const[user,setUser]=useState(()=>sL("jc:user",null));const[orgs,setOrgs]=useState([]);const[allOrgs,setAllOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>{const raw=sL("jc:visits",[]);const cutoff=new Date();cutoff.setDate(cutoff.getDate()-90);const cut=cutoff.toISOString();const purged=raw.filter(v=>!v.checkinTime||v.checkinTime>=cut);if(purged.length<raw.length)console.log(`Purged ${raw.length-purged.length} visits >90d`);return purged;});const[active,setActive]=useState(()=>sL("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[search,setSearch]=useState("");const[catFilters,setCatFilters]=useState([]);const[cityFilter,setCityFilter]=useState("Todas");const[stateFilter,setStateFilter]=useState("Todos");const[segFilter,setSegFilter]=useState("Todos");const[prodFilter,setProdFilter]=useState("Todos");const[ownerFilter,setOwnerFilter]=useState("Todos");
  // Visit date range filter: "all" | "visited" | "not_visited"
  const[visitMode,setVisitMode]=useState("all");const[visitFrom,setVisitFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});const[visitTo,setVisitTo]=useState(todayLocal);
  const[nearMe,setNearMe]=useState(null);const[nearLoading,setNearLoading]=useState(false);const[nearRoad,setNearRoad]=useState({});const[sortMode,setSortMode]=useState("alpha");
  const[syncing,setSyncing]=useState(false);const[syncMsg,setSyncMsg]=useState("");const[ldId,setLdId]=useState(null);const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);const[personTarget,setPersonTarget]=useState(null);const[newClient,setNewClient]=useState(false);const[searchAdd,setSearchAdd]=useState(false);const[divTarget,setDivTarget]=useState(null);const[editTarget,setEditTarget]=useState(null);
  const[plocs,setPlocs]=useState(()=>sL("jc:pdvLocs",{}));const[dayBases,setDayBases]=useState(()=>sL("jc:dayBases",{}));
  const[showDB,setShowDB]=useState(false);const[showEndDay,setShowEndDay]=useState(false);const[vc,setVc]=useState(PG);

  useEffect(()=>{sS("jc:visits",visits);},[visits]);useEffect(()=>{sS("jc:active",active);},[active]);useEffect(()=>{sS("jc:pdvLocs",plocs);},[plocs]);useEffect(()=>{sS("jc:dayBases",dayBases);syncDayBasesSave(dayBases);},[dayBases]);
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  const syncPush=async(data)=>{try{await fetch(`${API}?sync=${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:data})});}catch(e){console.warn("syncPush:",e);}};
  const syncClear=async()=>{try{await fetch(`${API}?sync=${user.id}`,{method:"DELETE"});}catch(e){console.warn("syncClear:",e);}};
  const syncVisitSave=async(visit)=>{try{const r=await fetch(`${API}?sync=visits_${user.id}`);const d=await r.json();const all=[visit,...(d.active||[])].slice(0,200);await fetch(`${API}?sync=visits_${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:all})});}catch(e){console.warn("syncVisitSave:",e);}};
  const syncVisitLoad=async()=>{try{const ids=[743088,743347];let remote=[];for(const uid of ids){const r=await fetch(`${API}?sync=visits_${uid}`);const d=await r.json();if(d.active)remote.push(...d.active);}if(remote.length){setVisits(prev=>{const existing=new Set(prev.map(v=>v.orgId+"|"+(v.userName||"")+"|"+v.checkinTime?.slice(0,16)));const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+r.checkinTime?.slice(0,16)));if(newOnes.length)return[...prev,...newOnes];return prev;});}}catch(e){console.warn("syncVisitLoad:",e);}};
  const syncPlocs=async(locs)=>{try{await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:locs})});}catch(e){console.warn("syncPlocs:",e);}};
  const syncDayBasesSave=async(bases)=>{try{await fetch(`${API}?sync=dayBases`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:bases})});}catch(e){console.warn("syncBases:",e);}};
  const syncDayBasesLoad=async()=>{try{const r=await fetch(`${API}?sync=dayBases`);const d=await r.json();if(d.active){setDayBases(prev=>{const merged={...prev,...d.active};sS("jc:dayBases",merged);return merged;});}}catch(e){console.warn("syncBasesLoad:",e);}};
  const[teamActive,setTeamActive]=useState(null);
  const[syncStatus,setSyncStatus]=useState("");
  const syncPull=async()=>{try{
    const r=await fetch(`${API}?sync=${user.id}`);const d=await r.json();
    setActive(prev=>{if(d.active&&(!prev||prev.fromSync))return{...d.active,fromSync:true};if(!d.active&&prev?.fromSync)return null;return prev;});
    const otherId=user.id===743088?743347:743088;
    const r2=await fetch(`${API}?sync=${otherId}`);const d2=await r2.json();
    setTeamActive(d2.active||null);
    const r3=await fetch(`${API}?sync=plocs`);const d3=await r3.json();
    if(d3.active){const deleted=sL("jc:deletedGPS",[]);setPlocs(prev=>{const cloud={...d3.active};deleted.forEach(id=>{delete cloud[id];});const m={...cloud,...prev};sS("jc:pdvLocs",m);return m;});}
    setSyncStatus(`OK ${fT(new Date())} | eu:${d.active?"ativo":"--"} | equipe:${d2.active?d2.active.orgName:"--"}`);
  }catch(e){setSyncStatus("Erro: "+e.message);}};
  useEffect(()=>{if(!token||!user)return;syncPull();syncVisitLoad();syncDayBasesLoad();const iv=setInterval(()=>{syncPull();syncDayBasesLoad();},15000);return()=>clearInterval(iv);},[token,user]);

  const[mAlert,setMAlert]=useState(false);
  useEffect(()=>{if(!token||!user)return;const ck=()=>{const h=new Date().getHours();const td=new Date().toDateString();const has=visits.some(v=>new Date(v.checkinTime).toDateString()===td)||active;setMAlert(h>=8&&h<12&&!has);};ck();const iv=setInterval(ck,300000);return()=>clearInterval(iv);},[token,user,visits,active]);
  const[longVisit,setLongVisit]=useState(false);
  useEffect(()=>{if(!active){setLongVisit(false);return;}const ck=()=>{if(mins(active.checkinTime,new Date())>=120)setLongVisit(true);};ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[active]);
  const[prevDay,setPrevDay]=useState(null);
  useEffect(()=>{if(!token||!user||!active)return setPrevDay(null);if(new Date(active.checkinTime).toDateString()!==new Date().toDateString())setPrevDay(active);else setPrevDay(null);},[token,user,active]);

  // ─── PWA Notifications ───
  const notifiedRef=useState(()=>new Set())[0];
  useEffect(()=>{if(!token||!user)return;
    // Request permission on mount
    if("Notification"in window&&Notification.permission==="default")Notification.requestPermission();
    // Check pending tasks every 5 min
    const checkTasks=async()=>{if(!("Notification"in window)||Notification.permission!=="granted")return;
      try{const since=new Date();since.setDate(since.getDate()-30);const d=await agF(`/tasks?createdDateGt=${since.toISOString()}&per_page=100`,token);const now=new Date();const soon=new Date(now.getTime()+15*60000);// 15 min ahead
        (d.data||[]).filter(t=>!t.finishedAt&&!t.done&&t.user?.id===user.id&&t.due_date).forEach(t=>{
          const due=new Date(t.due_date);const key=t.id+"|"+t.due_date;
          if(due>=now&&due<=soon&&!notifiedRef.has(key)){notifiedRef.add(key);
            new Notification("📅 TeamCheck",{body:`${t.type||"Tarefa"}: ${t.organization?.name||"?"}\n${t.text?.slice(0,60)||""}`,icon:"/logo.png",tag:key,requireInteraction:true});}
          // Morning alert: tasks due today
          const h=now.getHours();if(h>=7&&h<8&&toLocalDate(due)===todayLocal()&&!notifiedRef.has("morning_"+key)){notifiedRef.add("morning_"+key);
            new Notification("🌅 TeamCheck",{body:`${t.type}: ${t.organization?.name}\n${fT(t.due_date)}`,icon:"/logo.png",tag:"morning_"+key});}
        });
      }catch(e){console.warn("notif:",e);}};
    checkTasks();const iv=setInterval(checkTasks,300000);// 5 min
    return()=>clearInterval(iv);
  },[token,user]);

  // Check if day has visits but no active visit (can close route)
  const today=todayLocal();
  const todayVisits=useMemo(()=>visits.filter(v=>{const d=toLocalDate(v.checkinTime);return d===today&&isRealVisit(v);}),[visits,today]);
  const hasEndBase=dayBases[user?.id+"_"+today]?.end!=null||dayBases[today]?.end!=null;
  const canCloseRoute=todayVisits.length>0&&!active&&!hasEndBase;

  const doSync=async(t)=>{setSyncing(true);setSyncMsg("Conectando...");try{let pg=1,all=[];while(true){setSyncMsg(`${all.length} clientes...`);const d=await agF(`/organizations?page=${pg}&per_page=100`,t||token);if(!d.data?.length)break;all.push(...d.data.map(strip));if(d.data.length<100)break;pg++;}setAllOrgs(all);setOrgs(all);setSyncMsg(`${all.length} clientes`);
    // Auto-load visit history
    await loadHistoryInner(t||token);
  }catch(e){setSyncMsg("Erro");}setSyncing(false);};

  const loadHistoryInner=async(tk)=>{setSyncMsg("Carregando historico...");const now=new Date();let allTasks=[];
    for(let w=0;w<3;w++){const from=new Date(now);from.setDate(from.getDate()-30*(w+1));const to=new Date(now);to.setDate(to.getDate()-30*w);
      setSyncMsg(`${allTasks.length} atividades (${w*30}d)...`);
      let pg=1;while(true){const d=await agF(`/tasks?createdDateGt=${from.toISOString()}&createdDateLt=${to.toISOString()}&per_page=100&page=${pg}`,tk||token);if(!d.data?.length)break;allTasks.push(...d.data);if(d.data.length<100)break;pg++;}}
    const remote=allTasks.filter(t=>(t.type==="Visita"||t.type==="VISITA")&&(t.done||t.finishedAt)).map(t=>({orgId:t.organization?.id,orgName:t.organization?.name||"?",city:"",checkinTime:t.createdAt,checkoutTime:t.createdAt,note:t.text||"",taskType:"VISITA",synced:true,fromAgendor:true,userName:t.user?.name||""}));
    const existing=new Set(visits.map(v=>v.orgId+"|"+v.userName+"|"+v.checkinTime?.slice(0,16)));const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+r.userName+"|"+r.checkinTime?.slice(0,16)));
    if(newOnes.length){setVisits(prev=>[...prev,...newOnes]);setSyncMsg(`+${newOnes.length} visitas`);}else setSyncMsg("Atualizado");};
  const loadHistory=async()=>{try{await loadHistoryInner();}catch(e){setSyncMsg("Erro: "+e.message);}};

  const ensureBase=()=>{const t=todayLocal();const k=user.id+"_"+t;if(!dayBases[k]||(!dayBases[k].start&&!dayBases[k].lat))setShowDB(true);};
  const cities=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const c=o.addr?.city_name||o.addr?.city;if(c)s.add(c);});return["Todas",...[...s].sort()];},[orgs]);
  const states=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.addr?.state)s.add(o.addr.state);});return["Todos",...[...s].sort()];},[orgs]);
  const segments=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.sector)s.add(o.sector);});return["Todos",...[...s].sort()];},[orgs]);
  const products=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.products)(o.products.split(", ")).forEach(p=>{if(p&&!p.startsWith("P_"))s.add(p);});});return["Todos",...[...s].sort()];},[orgs]);
  const owners=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.owner)s.add(o.owner);});return["Todos",...[...s].sort()];},[orgs]);
  const usersList=useMemo(()=>{const m={};orgs.forEach(o=>{if(o.ownerId&&o.owner)m[o.ownerId]=o.owner;});return Object.entries(m).map(([id,n])=>({id:parseInt(id),n}));},[orgs]);

  const lastVisits=useMemo(()=>{const m={};visits.forEach(v=>{if(v.checkoutTime&&(!m[v.orgId]||v.checkinTime>m[v.orgId].time))m[v.orgId]={time:v.checkinTime,who:v.userName||user?.name||""};});return m;},[visits]);
  // Build visit lookup by org: {orgId: [{time, who},...]}
  const visitsByOrg=useMemo(()=>{const m={};visits.forEach(v=>{if(v.checkoutTime){if(!m[v.orgId])m[v.orgId]=[];m[v.orgId].push({time:v.checkinTime,who:v.userName||""});}});return m;},[visits]);

  const fo=useMemo(()=>{let list=orgs;
    if(catFilters.length)list=list.filter(o=>catFilters.includes(o.cat));
    if(stateFilter!=="Todos")list=list.filter(o=>o.addr?.state===stateFilter);
    if(cityFilter!=="Todas")list=list.filter(o=>(o.addr?.city_name||o.addr?.city)===cityFilter);
    if(segFilter!=="Todos")list=list.filter(o=>o.sector===segFilter);
    if(prodFilter!=="Todos")list=list.filter(o=>o.products?.includes(prodFilter));
    if(ownerFilter!=="Todos")list=list.filter(o=>o.owner===ownerFilter);
    // Visit date range filter
    if(visitMode==="visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return false;return vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      // Visitados: most recent first
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});}
    if(visitMode==="not_visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return true;return !vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      // Sem visita: oldest first (most neglected on top)
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"0";const lb=lastVisits[b.id]?.time||"0";return la.localeCompare(lb);});}
    if(search.trim()){const q=search.toLowerCase().replace(/[.\-\/]/g,"");list=list.filter(o=>[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ").toLowerCase().includes(q));}
    if(sortMode==="near"&&nearMe){
      const withGPS=list.filter(o=>plocs[o.id]).map(o=>({...o,dist:hav(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng),distType:"gps"}));
      const noGPS=list.filter(o=>!plocs[o.id]).map(o=>{const geo=geoEstimate(o);if(geo)return{...o,dist:hav(nearMe.lat,nearMe.lng,geo[0],geo[1]),distType:"bairro"};return{...o,dist:9999,distType:"sem_ref"};});
      withGPS.sort((a,b)=>a.dist-b.dist);noGPS.sort((a,b)=>a.dist-b.dist);
      list=[...withGPS,...noGPS];
    }else if(sortMode==="rfv"){
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});
    }else{list=list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));}
    return list;
  },[orgs,search,catFilters,cityFilter,stateFilter,segFilter,prodFilter,ownerFilter,visitMode,visitFrom,visitTo,visitsByOrg,lastVisits,nearMe,plocs,sortMode]);

  useEffect(()=>{
    if(sortMode!=="near"||!nearMe||!fo.length)return;
    let cancelled=false;
    (async()=>{const top=fo.filter(o=>o.dist!=null).slice(0,10);const roads={};
      for(const o of top){if(plocs[o.id]){const r=await roadKm(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng);if(!cancelled)roads[o.id]=r.km;}}
      if(!cancelled)setNearRoad(roads);
    })();return()=>{cancelled=true;};
  },[sortMode,nearMe,fo.slice(0,10).map(o=>o.id).join()]);

  const toggleCat=c=>{setCatFilters(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c]);setVc(PG);};
  const quickAction=async(org,type)=>{const note=prompt(`Registrar ${type==="WHATSAPP"?"WhatsApp":"Ligacao"} com ${org.name}:`);if(!note?.trim())return;try{await postTask(token,org.id,note,type,true);alert("Registrado no Agendor!");}catch(e){alert("Erro: "+e.message);}};

  const checkin=async(org)=>{ensureBase();if(org.cat==="Online - B2B"&&!confirm(`${org.name} e Online/B2B.\nRegistrar visita?`))return;if(org.cat==="Inativo"&&!confirm(`${org.name} esta Inativo.\nContinuar?`))return;if(org.cat==="Excluido"&&!confirm(`${org.name} esta Excluido.\nContinuar?`))return;setLdId(org.id);setGeoErr("");try{const g=await gps();if(plocs[org.id]){const d=hav(plocs[org.id].lat,plocs[org.id].lng,g.lat,g.lng)*1000;if(d>500){setDivTarget({org,dist:Math.round(d),geo:g});setLdId(null);return;}}else{const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);}const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}catch{setGeoErr("GPS indisponivel.");}setLdId(null);};
  const handleDivAction=(action,type)=>{if(!divTarget)return;const{org,geo}=divTarget;if(action==="checkin"){const v={orgId:org.id,orgName:org.name,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}else if(action==="remote"&&type)setCoTarget({...org,remoteType:type});setDivTarget(null);};
  const checkout=async(note,type="VISITA",next=null,sale=null)=>{if(!active||ldId)return;setLdId(active.orgId);let g=null;try{g=await gps();}catch{}const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type,sale};try{await postTask(token,active.orgId,note,type,true);done.synced=true;}catch(e){console.warn("task:",e);done.synced=false;}if(next?.nextDate&&next?.nextDesc){try{await postTask(token,active.orgId,next.nextDesc,next.nextType||"VISITA",false,`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`);alert("Proximo passo agendado!");}catch(e){console.warn("nextStep:",e);alert("Erro ao agendar proximo passo");}}if(sale?.brand&&sale?.value){try{await agF(`/organizations/${active.orgId}/deals`,token,{method:"POST",body:JSON.stringify({title:`Venda ${sale.brand}`,value:sale.value})});}catch(e){console.warn("deal:",e);}}setVisits(p=>[done,...p]);syncVisitSave(done);setActive(null);syncClear();setCoTarget(null);setLdId(null);};

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sS("jc:token",t);sS("jc:user",u);}}/>;
  const baseTabs=[{id:"pdvs",i:"🏪",l:"PDVs"},{id:"rotas",i:"🛣️",l:"Rotas"},{id:"relatorio",i:"📊",l:"Relatório"},{id:"agenda",i:"📅",l:"Agenda"},{id:"config",i:"⚙️",l:"Config"}];
  const tabs=user?.id===743088?[...baseTabs.slice(0,3),{id:"equipe",i:"👥",l:"Equipe"},...baseTabs.slice(3)]:baseTabs;

  return(<div style={{minHeight:"100vh",paddingBottom:70}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",background:S.card,borderBottom:`1px solid ${S.brd}`,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <img src="/logo.png" alt="" style={{height:48,borderRadius:10,background:"#fff",padding:"6px 16px",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
        <div><p style={{fontSize:18,fontWeight:700,margin:0}}>TeamCheck</p><p style={{fontSize:13,color:S.ts,margin:0}}>{user?.name} — {fD(new Date())}</p></div>
      </div>
      <div style={{display:"flex",gap:6}}><button onClick={()=>setSearchAdd(true)} style={{padding:"10px 14px",fontSize:18,background:S.acc,border:"none",fontWeight:700}}>+</button><button onClick={async()=>{await doSync();await loadHistory();syncVisitLoad();}} disabled={syncing} style={{padding:"10px 16px",fontSize:15,background:syncing?S.cl:S.pri,border:"none",fontWeight:500}}>{syncing?"...":"🔄"}</button></div>
    </div>
    <div style={{padding:"0 16px"}}>
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs} onClick={()=>{setTab("pdvs");setSearch("");setCatFilters([]);setVisitMode("all");setTimeout(()=>{const el=document.getElementById("org-"+active.orgId);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});else setSearch(active.orgName);},200);}}/>}
      {teamActive&&tab!=="config"&&user?.id===743088&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.gold,animation:"pulse 2s infinite"}}/><p style={{fontSize:13,color:S.gold,margin:0}}>Alisson em atendimento: <b>{teamActive.orgName}</b></p></div><p style={{fontSize:11,color:S.ts,margin:"3px 0 0 16px"}}>Desde {fT(teamActive.checkinTime)} — {hrsMin(mins(teamActive.checkinTime,new Date()))}</p><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style></div>}

      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:0}}>⏰ Bom dia! Atividades ainda nao iniciadas.</p></div>}
      {prevDay&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>⚠️ Visita aberta de {fD(prevDay.checkinTime)} — {prevDay.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(prevDay.checkinTime);c.setHours(18);setVisits(p=>[{...prevDay,checkoutTime:c.toISOString(),note:"Auto 18h",taskType:"VISITA",synced:false},...p]);setActive(null);setPrevDay(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:prevDay.orgId,name:prevDay.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {longVisit&&!prevDay&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:"0 0 6px"}}>⏰ Visita ativa ha mais de 2h — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}

      {/* NOVO: Botão Fechar Roteiro quando tem visitas mas sem ativo */}
      {canCloseRoute&&tab!=="config"&&<div style={{background:S.acc+"18",border:`1px solid ${S.acc}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.acc,margin:"0 0 8px"}}>✅ {todayVisits.length} visita(s) hoje — Fechar roteiro?</p><button onClick={()=>setShowEndDay(true)} style={{width:"100%",padding:10,fontSize:13,background:S.acc,border:"none",fontWeight:600,borderRadius:8}}>🏨 Fechar Roteiro do Dia</button></div>}

      <div style={{display:"flex",gap:3,marginBottom:12,background:S.cl,borderRadius:8,padding:3}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",background:tab===t.id?S.pri:"transparent",borderRadius:6,padding:"7px 2px",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#fff":S.ts}}><span style={{fontSize:15,display:"block",marginBottom:1}}>{t.i}</span>{t.l}</button>)}</div>

      {tab==="pdvs"&&<div>
        <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, CNPJ, cidade, segmento, produto..." style={{width:"100%",marginBottom:6}}/>
        <div style={{display:"flex",gap:3,marginBottom:6,overflowX:"auto",paddingBottom:2,flexWrap:"wrap"}}>{CATS.map(c=><button key={c} onClick={()=>toggleCat(c)} style={{padding:"3px 8px",fontSize:10,whiteSpace:"nowrap",border:catFilters.includes(c)?`2px solid ${CC[c]||S.pri}`:`1px solid ${S.brd}`,background:catFilters.includes(c)?`${CC[c]}22`:"transparent",color:catFilters.includes(c)?CC[c]||S.pri:S.ts,borderRadius:20,fontWeight:catFilters.includes(c)?600:400}}>{c}</button>)}
          <button onClick={()=>setCatFilters([])} style={{padding:"3px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:!catFilters.length?S.pl:S.td,borderRadius:20,background:!catFilters.length?S.pri+"22":"transparent"}}>Todos</button>
          <button onClick={()=>{setCatFilters([]);setCityFilter("Todas");setStateFilter("Todos");setSegFilter("Todos");setProdFilter("Todos");setOwnerFilter("Todos");setVisitMode("all");setSearch("");setSortMode("alpha");setNearMe(null);setVc(PG);}} style={{padding:"3px 8px",fontSize:10,border:`1px solid ${S.dng}44`,color:S.dng,borderRadius:20,background:"transparent"}}>✕ Limpar</button>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:4}}>
          <select value={stateFilter} onChange={e=>{setStateFilter(e.target.value);setCityFilter("Todas");setVc(PG);}} style={{width:60,fontSize:11,padding:"4px"}}>{states.map(s=><option key={s} value={s}>{s==="Todos"?"UF":s}</option>)}</select>
          <select value={cityFilter} onChange={e=>{setCityFilter(e.target.value);setVc(PG);}} style={{flex:1,fontSize:11,padding:"4px"}}>{cities.filter(c=>c==="Todas"||stateFilter==="Todos"||orgs.some(o=>(o.addr?.city_name||o.addr?.city)===c&&o.addr?.state===stateFilter)).map(c=><option key={c} value={c}>{c==="Todas"?"Cidade":c}</option>)}</select>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          <select value={segFilter} onChange={e=>{setSegFilter(e.target.value);setVc(PG);}} style={{flex:1,fontSize:11,padding:"4px"}}>{segments.map(s=><option key={s} value={s}>{s==="Todos"?"Segmento":s}</option>)}</select>
          <select value={prodFilter} onChange={e=>{setProdFilter(e.target.value);setVc(PG);}} style={{flex:1,fontSize:11,padding:"4px"}}>{products.map(p=><option key={p} value={p}>{p==="Todos"?"Produto":p}</option>)}</select>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          <select value={ownerFilter} onChange={e=>{setOwnerFilter(e.target.value);setVc(PG);}} style={{flex:1,fontSize:11,padding:"4px"}}>{owners.map(o=><option key={o} value={o}>{o==="Todos"?"Responsável":o}</option>)}</select>
        </div>
        {/* Visit date range filter */}
        <div style={{display:"flex",gap:3,marginBottom:4}}>
          <button onClick={()=>{setVisitMode(visitMode==="all"?"not_visited":"all");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,whiteSpace:"nowrap",border:`1px solid ${visitMode==="not_visited"?S.gold:S.brd}`,color:visitMode==="not_visited"?S.gold:S.td,background:visitMode==="not_visited"?S.gold+"18":"transparent",borderRadius:6}}>Sem visita</button>
          <button onClick={()=>{setVisitMode(visitMode==="all"?"visited":"all");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,whiteSpace:"nowrap",border:`1px solid ${visitMode==="visited"?S.acc:S.brd}`,color:visitMode==="visited"?S.acc:S.td,background:visitMode==="visited"?S.acc+"18":"transparent",borderRadius:6}}>Visitados</button>
          <button onClick={()=>{const d=new Date();d.setDate(d.getDate()-30);setVisitFrom(toLocalDate(d));setVisitTo(todayLocal());setVisitMode("not_visited");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:S.td,borderRadius:6}}>30d</button>
          <button onClick={()=>{const d=new Date();d.setDate(d.getDate()-60);setVisitFrom(toLocalDate(d));setVisitTo(todayLocal());setVisitMode("not_visited");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:S.td,borderRadius:6}}>60d</button>
          <button onClick={()=>{const d=new Date();d.setDate(d.getDate()-90);setVisitFrom(toLocalDate(d));setVisitTo(todayLocal());setVisitMode("not_visited");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:S.td,borderRadius:6}}>90d</button>
        </div>
        {visitMode!=="all"&&<div style={{display:"flex",gap:4,marginBottom:8,alignItems:"center"}}>
          <input type="date" value={visitFrom} onChange={e=>{setVisitFrom(e.target.value);setVc(PG);}} style={{flex:1,fontSize:10,padding:"4px"}}/>
          <span style={{color:S.td,fontSize:10}}>a</span>
          <input type="date" value={visitTo} onChange={e=>{setVisitTo(e.target.value);setVc(PG);}} style={{flex:1,fontSize:10,padding:"4px"}}/>
          <button onClick={()=>{setVisitMode("all");setVc(PG);}} style={{padding:"4px 8px",fontSize:10,color:S.dng,border:`1px solid ${S.dng}44`,borderRadius:6}}>✕</button>
        </div>}
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          <button onClick={()=>{setSortMode("alpha");setNearMe(null);setVc(PG);}} style={{flex:1,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="alpha"?S.pri:S.brd}`,color:sortMode==="alpha"?S.pri:S.td,background:sortMode==="alpha"?S.pri+"18":"transparent",borderRadius:6,fontWeight:sortMode==="alpha"?600:400}}>A→Z</button>
          <button onClick={async()=>{if(sortMode==="near"){setSortMode("alpha");setNearMe(null);return;}setNearLoading(true);try{const g=await gps();setNearMe(g);setSortMode("near");setVc(PG);}catch{alert("GPS indisponivel");}setNearLoading(false);}} style={{flex:2,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="near"?S.acc:S.brd}`,color:sortMode==="near"?S.acc:S.td,background:sortMode==="near"?S.acc+"18":"transparent",borderRadius:6,fontWeight:sortMode==="near"?600:400}}>{nearLoading?"📍 Localizando...":sortMode==="near"?"📍 Próximos (ativo)":"📍 Onde estou"}</button>
          <button onClick={()=>{setSortMode("rfv");setNearMe(null);setVc(PG);}} style={{flex:1,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="rfv"?S.gold:S.brd}`,color:sortMode==="rfv"?S.gold:S.td,background:sortMode==="rfv"?S.gold+"18":"transparent",borderRadius:6,fontWeight:sortMode==="rfv"?600:400}}>⭐ RFV</button>
        </div>
        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}
        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><button onClick={()=>doSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}
        {orgs.length>0&&<><p style={{fontSize:11,color:S.td,margin:"0 0 6px"}}>{fo.length} de {orgs.length}{visitMode==="not_visited"?` (sem visita ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")})`:visitMode==="visited"?` (visitados ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")})`:""}{sortMode==="near"?" — por proximidade":sortMode==="rfv"?" — por relevância":""}{syncing&&` (${syncMsg})`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={checkin} onOut={o2=>setCoTarget(o2)} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} onQuick={quickAction} onInfo={o2=>alert(`${o2.name}\n${o2.cnpj||""}\n${o2.addr?.street||""} ${o2.addr?.number||""}\n${o2.addr?.district||""} ${o2.addr?.city_name||""} ${o2.addr?.state||""}\nCategoria: ${o2.cat}\nSetor: ${o2.sector}\nProdutos: ${o2.products}\n${o2.grupo||""}`)} ldId={ldId} plocs={plocs} lastVisit={lastVisits[o.id]||null} lastOrder={null/*TODO: Dashboard Phase 2*/} nearRoad={nearRoad}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc})</button>}
          <button onClick={()=>{const rows=[["Nome","CNPJ","Endereço","Bairro","Cidade","UF","Categoria","Segmento","Produtos","Responsável","Grupo","Dt Última Visita","Visitado por","Dias s/ Visita"]];fo.forEach(o=>{const lv=lastVisits[o.id];const dias=lv?Math.floor((Date.now()-new Date(lv.time))/86400000):"";rows.push([o.name,o.cnpj||"",`${o.addr?.street||""} ${o.addr?.number||""}`.trim(),o.addr?.district||"",o.addr?.city_name||o.addr?.city||"",o.addr?.state||"",o.cat||"",o.sector||"",o.products||"",o.owner||"",o.grupo?.replace("Grupo: ","")||"",lv?fD(lv.time):"Sem visita",lv?lv.who:"",dias]);});csv(rows,`clientes-filtrados-${fD(new Date())}.csv`);}} style={{width:"100%",marginTop:8,padding:12,fontSize:13,background:S.pri+"22",border:`1px solid ${S.pri}55`,color:S.pl,fontWeight:500}}>📊 Exportar {fo.length} clientes (Excel)</button>
          <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:70,right:16,width:40,height:40,borderRadius:"50%",background:S.pri,border:"none",fontSize:16,boxShadow:"0 2px 8px rgba(0,0,0,0.3)",zIndex:20}}>↑</button>
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={async()=>{try{const d=await agF(`/organizations?cnpj=${search.replace(/[.\-\/]/g,"")}`,token);if(d.data?.length)setOrgs(p=>{const ids=new Set(p.map(o=>o.id));return[...d.data.map(strip).filter(f=>!ids.has(f.id)),...p];});}catch(e){console.warn("cnpjSearch:",e);}}} style={{width:"100%",marginTop:8,padding:14,background:S.acc,border:"none",fontWeight:500}}>Buscar CNPJ no Agendor</button>}
        </>}
      </div>}
      {tab==="rotas"&&<RotasTab visits={visits} dayBases={dayBases} user={user} plocs={plocs}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user} token={token} plocs={plocs} onEditBase={(d,start,end,uid)=>{const key=uid?uid+"_"+d:d;setDayBases(p=>{const n={...p,[key]:{...p[key],start,end}};sS("jc:dayBases",n);return n;});}}/>}
      {tab==="equipe"&&user?.id===743088&&<EquipeTab token={token} plocs={plocs} orgs={orgs} dayBases={dayBases}/>}
      {tab==="agenda"&&<AgendaTab token={token} user={user} allOrgs={allOrgs}/>}

      {tab==="config"&&<ConfigTab user={user} orgs={orgs} visits={visits} plocs={plocs} dayBases={dayBases} today={today} syncStatus={syncStatus} syncing={syncing} syncMsg={syncMsg}
        onSync={doSync} onLoadHistory={loadHistory} onSyncPull={()=>{syncPull();setSyncStatus("Forçando sync...");}}
        onShareGPS={async()=>{if(!Object.keys(plocs).length){alert("Nenhum GPS salvo");return;}setSyncStatus("Enviando GPS...");try{const r=await fetch(`${API}?sync=plocs`);const d=await r.json();const merged={...(d.active||{}),...plocs};await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:merged})});setSyncStatus(`${Object.keys(merged).length} GPS enviados!`);}catch(e){setSyncStatus("Erro: "+e.message);}}}
        onShowDB={()=>setShowDB(true)} onShowEnd={()=>setShowEndDay(true)}
        onDeleteGPS={(orgId)=>{setPlocs(p=>{const n={...p};delete n[orgId];sS("jc:pdvLocs",n);
          // Track deletion and push to cloud
          const del=sL("jc:deletedGPS",[]);if(!del.includes(orgId)){del.push(orgId);sS("jc:deletedGPS",del);}
          fetch(`${API}?sync=plocs`).then(r=>r.json()).then(d=>{const cloud={...d.active||{}};delete cloud[orgId];fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:cloud})});}).catch(()=>{});
          return n;});}}
        onSaveGPS={(orgId,lat,lng)=>{setPlocs(p=>{const n={...p,[orgId]:{lat,lng}};sS("jc:pdvLocs",n);
          // Remove from deleted list if was there, push to cloud
          const del=sL("jc:deletedGPS",[]).filter(id=>id!==orgId);sS("jc:deletedGPS",del);
          syncPlocs(n);return n;});}}
        onClearVisits={(target)=>setVisits(prev=>prev.filter(v=>!v.checkinTime?.startsWith(target)))}
        onClearAllGPS={()=>{setPlocs({});sS("jc:pdvLocs",{});}}
        onLogout={()=>{setToken("");setUser(null);setOrgs([]);sS("jc:token","");sS("jc:user",null);}}
      />}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.card,borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"center",zIndex:40}}><div style={{display:"flex",maxWidth:960,width:"100%"}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?S.pl:S.td}}><span style={{fontSize:18,display:"block",marginBottom:2}}>{t.i}</span>{t.l}</button>)}</div></div>
    {coTarget&&<NoteModal org={coTarget} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {showDB&&<JourneyModal user={user} onSave={j=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const n={...p,[k]:{start:j.start,end:j.end}};sS("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
    {showEndDay&&<DayEndModal user={user} onSave={b=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const cur=p[k]||{};const n={...p,[k]:{...cur,end:b}};sS("jc:dayBases",n);return n;});setShowEndDay(false);}} onCancel={()=>setShowEndDay(false)}/>}
    {searchAdd&&<SearchOrAddModal token={token} allOrgs={allOrgs}
      onFound={(org)=>{setSearch(org.name||org.nickname);setTab("pdvs");}}
      onNewClient={(cnpj,rfData)=>{sS("jc:prefill",{cnpj,rfData});setNewClient(true);}}
      onCancel={()=>setSearchAdd(false)}/>}
    {newClient&&<NewClientModal token={token} allOrgs={allOrgs} onSave={org=>{setOrgs(p=>[org,...p]);setAllOrgs(p=>[org,...p]);setNewClient(false);}} onCancel={()=>setNewClient(false)}/>}
    {personTarget&&<PeopleModal org={personTarget} token={token} onClose={()=>setPersonTarget(null)}/>}
    {editTarget&&<EditModal org={editTarget} token={token} users={usersList} allOrgs={allOrgs} onSave={u=>{setOrgs(p=>p.map(o=>o.id===u.id?u:o));setAllOrgs(p=>p.map(o=>o.id===u.id?u:o));setEditTarget(null);}} onClose={()=>setEditTarget(null)}/>}
    {divTarget&&<DivergentModal org={divTarget.org} dist={divTarget.dist} onAction={handleDivAction} onCancel={()=>setDivTarget(null)}/>}
  </div>);}
