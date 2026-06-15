import { useState, useEffect, useMemo } from "react";
const API="https://agendor-proxy.administrativo-fc3.workers.dev";
const OSRM="https://router.project-osrm.org/route/v1/driving";
const HOMES={743088:{lat:-15.677694,lng:-55.954778,label:"Casa Jordan"},743347:{lat:-15.653611,lng:-56.026833,label:"Casa Alisson"}};
const LUNCH_START=12,LUNCH_END=13,PG=20;
const TYPES=[{id:"VISITA",l:"Visita"},{id:"LIGACAO",l:"Ligação"},{id:"EMAIL",l:"E-mail"},{id:"REUNIAO",l:"Reunião"},{id:"WHATSAPP",l:"WhatsApp"},{id:"PROPOSTA",l:"Proposta"}];
const CATS=["Ativo","Prospecção","Somente Visita","Inativo","Online - B2B","Excluido"];
const BRANDS=["TRAMONTINA","PADO","ZAGONEL","RUVOLO","SANTANA","FESTCOLOR","PLASTILIT"];
const SECTORS=[{id:4512997,n:"Açougues"},{id:4513651,n:"Agropecuarias"},{id:4513000,n:"Atacados"},{id:4512998,n:"Decoração"},{id:4513649,n:"Eletromoveis"},{id:4724740,n:"Embalagens"},{id:4513001,n:"Garden"},{id:4512999,n:"Mat. Construção"},{id:4513019,n:"Outros"},{id:4513020,n:"Papelaria"},{id:4513650,n:"Presenteiros"},{id:4512995,n:"Supermercados"},{id:4512996,n:"Variedades"}];
const CAT_IDS=[{id:3186598,n:"Ativo"},{id:3186011,n:"Prospecção"},{id:3186601,n:"Somente Visita"},{id:3186600,n:"Inativo"},{id:4136717,n:"Online - B2B"},{id:3187967,n:"Excluido"}];
const ORIGINS=[{id:1981672,n:"Carteira"},{id:1979723,n:"Indicação"},{id:1980476,n:"Prospecção"},{id:1979725,n:"Site"},{id:1980477,n:"Instagram"},{id:1980478,n:"Leads"}];
const USERS=[{id:743088,n:"Jordan Moraes"},{id:743347,n:"Alisson Henrique"}];
// Status colors
const CC={Ativo:"#10B981",Inativo:"#F59E0B","Online - B2B":"#0578A6","Somente Visita":"#6B7280",Prospecção:"#1F2937",Excluido:"#DC2626"};
// City center coords for proximity estimation
const CITY_GEO={"Cuiabá":[-15.5989,-56.0949],"Cuiaba":[-15.5989,-56.0949],"Várzea Grande":[-15.6460,-56.1322],"Varzea Grande":[-15.6460,-56.1322],"Tangará da Serra":[-14.6229,-57.4947],"Tangara da Serra":[-14.6229,-57.4947],"Cáceres":[-16.0725,-57.6770],"Caceres":[-16.0725,-57.6770],"Pontes e Lacerda":[-15.2264,-59.3411],"Campo Novo do Parecis":[-13.6629,-57.8914],"Campo Novo dos Parecis":[-13.6629,-57.8914],"Campo Verde":[-15.5444,-55.1628],"Rondonópolis":[-16.4673,-54.6372],"Rondonopolis":[-16.4673,-54.6372],"Mirassol d Oeste":[-15.6779,-58.0948],"Primavera do Leste":[-15.5615,-54.2817],"Sapezal":[-12.9878,-58.7652],"Araputanga":[-15.4723,-58.3438],"São José dos Quatro Marcos":[-15.6270,-58.1755],"Sorriso":[-12.5428,-55.7112],"Sinop":[-11.8642,-55.5095],"Lucas do Rio Verde":[-13.0490,-55.9048],"Nova Mutum":[-13.8321,-56.0813],"Barra do Garças":[-15.8867,-52.2566],"Diamantino":[-14.4080,-56.4437],"Poconé":[-16.2558,-56.6232],"Jaciara":[-15.9620,-54.9696]};
const BRG={"ubirajara":"O","ribeirao do lipa":"O","colorado":"O","mariana":"O","santa marta":"O","despraiado":"O","quilombo":"O","duque de caxias":"O","ribeirao da ponte":"O","santa rosa":"O","barra do pari":"O","santa isabel":"O","cidade verde":"O","cidade alta":"O","jardim cuiaba":"O","goiabeira":"O","popular":"O","centro-norte":"O","centro norte":"O","centro-sul":"O","centro sul":"O","porto":"O","coophamil":"O","novo terceiro":"O","araes":"O","alvorada":"O","florianopolis":"N","vitoria":"N","paraiso":"N","nova conquista":"N","primeiro de marco":"N","tres barras":"N","morada da serra":"N","morada do ouro":"N","centro politico":"N","paiaguas":"N","cpa":"N","novo tempo":"N","fabio leite":"N","novo horizonte":"L","planalto":"L","itamarati":"L","novo mato grosso":"L","sol nascente":"L","eldorado":"L","sao carlos":"L","sao roque":"L","santa ines":"L","carumbe":"L","bela vista":"L","dom bosco":"L","terra nova":"L","aclimacao":"L","canjica":"L","bosque da saude":"L","bau":"L","lixeira":"L","bandeirantes":"L","areao":"L","leblon":"L","pedregal":"L","italia":"L","morada dos nobres":"L","santa cruz":"L","recanto dos passaros":"L","imperial":"L","universitario":"L","cachoeira das garcas":"L","boa esperanca":"L","ufmt":"L","americas":"L","pico do amor":"L","pocao":"L","dom aquino":"L","terceiro":"L","paulista":"L","europa":"L","campo velho":"L","tropical":"L","petropolis":"L","california":"L","shangri":"L","praeiro":"L","ana pupina":"L","osmar cabral":"S","sao joao del rei":"S","fortaleza":"S","santa laura":"S","sao sebastiao":"S","pascoal ramos":"S","pedra 90":"S","pedra noventa":"S","nova esperanca":"S","industriario":"S","passaredo":"S","sao francisco":"S","lagoa azul":"S","tijucal":"S","altos do coxipo":"S","presidente":"S","coxipo":"S","sao jose":"S","ohara":"S","palmeiras":"S","jordao":"S","vista alegre":"S","gramado":"S","coophema":"S","sao goncalo":"S","georgia":"S","aparecida":"S","comodoro":"S","mossoro":"S","atalaia":"S","parque cuiaba":"S","distrito industrial":"S","capao do pequi":"VN","canelas":"VN","cristo rei":"VN","gloria":"VC","ikaray":"VS","aeroporto":"VL","jardim dos estados":"VC","marajoara":"VS","mapim":"VO","novo mundo":"VN","parque del rey":"VL","parque do lago":"VS","primavera":"VN","sao matheus":"VS","vitoria regia":"VL","ponte nova":"VC","planalto ipiranga":"VN","costa verde":"VL"};
const RGC={O:[-15.601,-56.115],N:[-15.565,-56.080],L:[-15.610,-56.060],S:[-15.650,-56.065],C:[-15.601,-56.097],VC:[-15.646,-56.132],VN:[-15.630,-56.125],VS:[-15.665,-56.140],VL:[-15.645,-56.110],VO:[-15.650,-56.155]};
function geoEstimate(o){const b=(o.addr?.district||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g,"");for(const[k,r]of Object.entries(BRG)){if(b.includes(k))return RGC[r];}const c=o.addr?.city_name||o.addr?.city||"";return CITY_GEO[c]||null;}
const S={bg:"#0F1B2D",card:"#162236",cl:"#1C2E47",pri:"#0578A6",pl:"#0890C2",acc:"#2A9D8F",gold:"#C8964E",dng:"#DC2626",txt:"#E8ECF1",ts:"#8899AB",td:"#5A6B7D",brd:"#243349",ok:"#10B981"};
const fT=d=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fD=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fDS=d=>new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const mins=(a,b)=>Math.max(0,Math.round((new Date(b)-new Date(a))/60000));
const hrsMin=m=>m>=60?`${Math.floor(m/60)}h${(m%60).toString().padStart(2,"0")}`:`${m}min`;
const hourDec=d=>{const t=new Date(d);return t.getHours()+t.getMinutes()/60;};
const hav=(a,b,c,d)=>{const R=6371,x=((c-a)*Math.PI)/180,y=((d-b)*Math.PI)/180;const z=Math.sin(x/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
function sL(k,f){try{return JSON.parse(localStorage.getItem(k))||f;}catch{return f;}}
function sS(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
async function agF(path,token,opts={}){const p=path.startsWith("/")?path.slice(1):path;const r=await fetch(`${API}?path=${encodeURIComponent(p)}`,{...opts,headers:{Authorization:`Token ${token}`,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);return r.json();}
async function postTask(token,oid,text,type="VISITA",done=true,due=null){const b={text,type,done};if(due)b.due_date=due;return agF(`/organizations/${oid}/tasks`,token,{method:"POST",body:JSON.stringify(b)});}
function gps(){return new Promise((r,j)=>{if(!navigator.geolocation)return j(new Error("GPS"));navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),j,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
async function roadKm(a,b,c,d){try{const r=await fetch(`${OSRM}/${b},${a};${d},${c}?overview=false`);const j=await r.json();if(j.code==="Ok"&&j.routes?.[0])return{km:j.routes[0].distance/1000,dur:Math.round(j.routes[0].duration/60)};}catch{}return{km:hav(a,b,c,d)*1.3,dur:0};}
function csv(rows,fn){const b="\uFEFF"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([b],{type:"text/csv;charset=utf-8"})),download:fn}).click();}
function strip(o){const a=o.address||{};const desc=o.description||"";return{id:o.id,name:o.name||"",nickname:o.nickname||"",cnpj:o.cnpj||"",cat:o.category?.name||"",sector:o.sector?.name||"",products:(o.products||[]).map(p=>p.name).join(", "),owner:o.ownerUser?.name||"",ownerId:o.ownerUser?.id||null,grupo:desc.startsWith("Grupo:")?desc:"",addr:{street:a.streetName||a.street||"",number:a.streetNumber||a.number||"",district:a.district||a.neighborhood||"",city:a.city||"",city_name:a.city_name||a.city||"",state:a.state||""},people:(o.people||[]).map(p=>p.name).join(", ")};}
async function fetchCNPJ(cnpj){const clean=cnpj.replace(/[.\-\/]/g,"");try{const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);if(r.ok)return r.json();}catch{}const r2=await fetch(`${API}?cnpj=${clean}`);if(!r2.ok)throw new Error("CNPJ nao encontrado");return r2.json();}
const LB=({t,children})=><div style={{marginBottom:6}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:.5}}>{t}</p>{children}</div>;

function Login({onLogin}){const[tk,setTk]=useState("");const[lo,setLo]=useState(false);const[er,setEr]=useState("");const go=async()=>{if(!tk.trim())return;setLo(true);setEr("");try{const d=await agF("/users/me",tk.trim());d.data?onLogin(tk.trim(),d.data):setEr("Token invalido.");}catch(e){setEr("Erro: "+e.message);}setLo(false);};return(<div style={{padding:"3rem 1rem",textAlign:"center"}}><img src="/logo.png" alt="" style={{height:48,marginBottom:16}} onError={e=>{e.target.style.display="none"}}/><h1 style={{fontSize:20,fontWeight:600,margin:"0 0 4px"}}>Jordan Check-in</h1><p style={{fontSize:13,color:S.ts,margin:"0 0 2rem"}}>Inteligencia Comercial</p><div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1.25rem",textAlign:"left"}}><LB t="TOKEN DA API AGENDOR"><input type="password" value={tk} onChange={e=>setTk(e.target.value)} placeholder="Cole seu token..." style={{width:"100%"}} onKeyDown={e=>e.key==="Enter"&&go()}/></LB><button onClick={go} disabled={lo||!tk.trim()} style={{width:"100%",background:S.pri,border:"none",fontWeight:600,fontSize:15,padding:12,marginTop:8}}>{lo?"Conectando...":"Conectar ao Agendor"}</button>{er&&<p style={{fontSize:13,color:S.dng,marginTop:12,textAlign:"center"}}>{er}</p>}</div></div>);}

function OrgCard({org,active,onIn,onOut,onEdit,onPerson,onQuick,onInfo,ldId,plocs,lastVisit,nearRoad}){
  const isA=active?.orgId===org.id;const a=org.addr||{};const addr=[a.street,a.number].filter(Boolean).join(", ");const loc=[a.district,a.city_name||a.city,a.state].filter(Boolean).join(" · ");
  const catColor=CC[org.cat]||S.ts;
  return(<div style={{background:isA?S.cl:S.card,border:`${isA?2:1}px solid ${isA?S.pri:S.brd}`,borderRadius:12,padding:"12px 14px"}}>
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
        {lastVisit&&<p style={{fontSize:10,color:S.td,margin:"4px 0 0"}}>Ultima visita: {fD(lastVisit.time)} — {lastVisit.who}</p>}
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

function Banner({v,orgs,onClick}){const o=orgs.find(x=>x.id===v.orgId);const[el,setEl]=useState(0);useEffect(()=>{const fn=()=>setEl(mins(v.checkinTime,new Date()));fn();const iv=setInterval(fn,15000);return()=>clearInterval(iv);},[v.checkinTime]);return(<div onClick={onClick} style={{background:S.cl,border:`1px solid ${S.pri}`,borderRadius:12,padding:"10px 14px",marginBottom:12,cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.ok}}/><p style={{fontSize:13,fontWeight:500,color:S.pl,margin:0}}>{o?.name||o?.nickname||v.orgName}</p></div><span style={{fontSize:11,color:S.acc}}>Ir ao cliente →</span></div><p style={{fontSize:12,color:S.ts,margin:"3px 0 0 16px"}}>{fT(v.checkinTime)} — {el} min</p></div>);}

function NoteModal({org,onSave,onCancel}){
  const[n,setN]=useState("");const[tp,setTp]=useState("VISITA");const[nt,setNt]=useState("VISITA");const[nd,setNd]=useState("");const[nh,setNh]=useState("09:00");const[ndsc,setNdsc]=useState("");
  const[sale,setSale]=useState(false);const[brand,setBrand]=useState("");const[saleVal,setSaleVal]=useState("");
  const today=new Date().toISOString().slice(0,10);const nowTime=new Date().toTimeString().slice(0,5);
  const dateValid=nd>=today;const ok=n.trim()&&nd&&ndsc.trim()&&dateValid;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50}}><div style={{background:S.card,borderRadius:"16px 16px 0 0",padding:"1.25rem",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}}>
  <p style={{fontWeight:600,fontSize:16,margin:"0 0 8px"}}>Registrar atividade</p>
  <p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>{org?.name||org?.nickname}</p>
  <LB t="O QUE FOI FEITO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>{TYPES.map(t=><button key={t.id} onClick={()=>setTp(t.id)} style={{padding:"6px",fontSize:10,border:tp===t.id?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:tp===t.id?S.cl:S.bg,color:tp===t.id?S.pl:S.ts,fontWeight:tp===t.id?600:400}}>{t.l}</button>)}</div></LB>
  <LB t="OBSERVAÇÃO"><textarea value={n} onChange={e=>setN(e.target.value)} placeholder="Descreva (obrigatorio)" rows={2} style={{width:"100%",border:`1px solid ${n.trim()?S.brd:S.dng}`}}/></LB>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px",background:sale?S.ok+"18":S.bg,border:`1px solid ${sale?S.ok:S.brd}`,borderRadius:8,cursor:"pointer"}} onClick={()=>setSale(!sale)}><span style={{fontSize:16}}>{sale?"✅":"💰"}</span><span style={{fontSize:12,fontWeight:500,color:sale?S.ok:S.ts}}>Venda realizada</span></div>
  {sale&&<div style={{marginBottom:8}}><div style={{display:"flex",gap:6}}><select value={brand} onChange={e=>setBrand(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Marca</option>{BRANDS.map(b=><option key={b}>{b}</option>)}</select><input type="number" value={saleVal} onChange={e=>setSaleVal(e.target.value)} placeholder="R$ valor" style={{width:100}}/></div></div>}
  <div style={{borderTop:`1px solid ${S.brd}`,paddingTop:8}}>
    <LB t="PRÓXIMO PASSO"><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>{TYPES.map(t=><button key={t.id} onClick={()=>setNt(t.id)} style={{padding:"6px",fontSize:10,border:nt===t.id?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:nt===t.id?S.cl:S.bg,color:nt===t.id?S.acc:S.ts,fontWeight:nt===t.id?600:400}}>{t.l}</button>)}</div></LB>
    <LB t="DATA / HORA"><div style={{display:"flex",gap:6}}><input type="date" value={nd} min={today} onChange={e=>setNd(e.target.value)} style={{flex:1,border:`1px solid ${nd&&dateValid?S.brd:S.dng}`}}/><input type="time" value={nh} onChange={e=>setNh(e.target.value)} style={{width:80}}/></div></LB>
    {nd&&!dateValid&&<p style={{fontSize:10,color:S.dng,margin:"-4px 0 4px"}}>Data nao pode ser anterior a hoje</p>}
    <LB t="DESCRIÇÃO"><textarea value={ndsc} onChange={e=>setNdsc(e.target.value)} placeholder="Proximo contato (obrigatorio)" rows={1} style={{width:"100%",border:`1px solid ${ndsc.trim()?S.brd:S.dng}`}}/></LB>
  </div>
  <div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={()=>ok&&onSave(n,tp,{nextType:nt,nextDate:nd,nextTime:nh,nextDesc:ndsc},sale?{brand,value:parseFloat(saleVal)||0}:null)} disabled={!ok} style={{flex:1,background:ok?S.pri:S.cl,border:"none",fontWeight:600}}>Registrar</button></div>
</div></div>);}

function NewClientModal({token,onSave,onCancel}){
  const[step,setStep]=useState(1);const[orgId,setOrgId]=useState(null);const[orgName,setOrgName]=useState("");const[orgData,setOrgData]=useState(null);
  const[name,setName]=useState("");const[legal,setLegal]=useState("");const[cnpj,setCnpj]=useState("");const[city,setCity]=useState("");const[state,setState]=useState("MT");const[district,setDistrict]=useState("");const[street,setStreet]=useState("");const[num,setNum]=useState("");const[comp,setComp]=useState("");const[cep,setCep]=useState("");const[phone,setPhone]=useState("");
  const[catId,setCatId]=useState(3186598);const[sectorId,setSectorId]=useState("");const[originId,setOriginId]=useState("");const[grupo,setGrupo]=useState("");
  const[lo,setLo]=useState(false);const[er,setEr]=useState("");const[fetching,setFetching]=useState(false);
  const[pName,setPName]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const buscarCNPJ=async()=>{const c=cnpj.replace(/[.\-\/]/g,"");if(c.length!==14){setEr("CNPJ deve ter 14 digitos");return;}setFetching(true);setEr("");try{const d=await fetchCNPJ(c);setName(d.nome_fantasia||"");setLegal(d.razao_social||"");setStreet([d.descricao_tipo_de_logradouro,d.logradouro].filter(Boolean).join(" ")||"");setNum(d.numero||"");setComp(d.complemento||"");setDistrict(d.bairro||"");setCity(d.municipio||"");setState(d.uf||"MT");setCep(d.cep||"");if(d.ddd_telefone_1)setPhone(d.ddd_telefone_1.replace(/[^\d]/g,""));}catch(e){setEr(e.message);}setFetching(false);};
  const createOrg=async()=>{if(!name.trim()&&!legal.trim())return;setLo(true);setEr("");try{const body={name:name.trim()||legal.trim(),legalName:legal.trim()};if(cnpj)body.cnpj=cnpj.replace(/[.\-\/]/g,"");const addr={};if(street)addr.streetName=street;if(num)addr.streetNumber=num;if(comp)addr.additionalInfo=comp;if(district)addr.district=district;if(city)addr.city=city;if(state)addr.state=state;if(cep)addr.postal_code=cep;if(Object.keys(addr).length)body.address=addr;if(phone)body.contact={work:phone};if(catId)body.category=catId;if(sectorId)body.sector=parseInt(sectorId);if(originId)body.leadOrigin=parseInt(originId);if(grupo)body.description=`Grupo: ${grupo}`;const d=await agF("/organizations",token,{method:"POST",body:JSON.stringify(body)});if(d.data){setOrgId(d.data.id);setOrgName(d.data.name||name);setOrgData(strip(d.data));setStep(2);}else setEr("Erro");}catch(e){setEr(e.message==="400"?"Cliente ja existe no Agendor":"Erro: "+e.message);}setLo(false);};
  const finish=(wp)=>{const od=orgData||strip({id:orgId,name:orgName||name,legalName:legal,cnpj,address:{city,state,district},category:{id:catId,name:CAT_IDS.find(c=>c.id===catId)?.n},sector:{id:parseInt(sectorId),name:SECTORS.find(s=>s.id===parseInt(sectorId))?.n}});if(wp&&pName.trim()){setLo(true);agF("/people",token,{method:"POST",body:JSON.stringify({name:pName,organization:orgId,...(pEmail?{email:pEmail}:{}),contact:{...(pPhone?{mobile:pPhone}:{}),...(pWhats?{whatsapp:pWhats}:{})}})}).then(()=>onSave(od)).catch(()=>onSave(od));}else onSave(od);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
  {step===1?<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Novo Cliente — Empresa</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 1 de 2</p>
  <LB t="CNPJ"><div style={{display:"flex",gap:6}}><input value={cnpj} onChange={e=>setCnpj(e.target.value)} placeholder="00.000.000/0000-00" style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&buscarCNPJ()}/><button onClick={buscarCNPJ} disabled={fetching} style={{padding:"8px 12px",background:S.acc,border:"none",fontWeight:600,fontSize:11}}>{fetching?"...":"Buscar"}</button></div></LB>
  {fetching&&<p style={{fontSize:11,color:S.acc,margin:"-4px 0 4px"}}>Consultando Receita Federal...</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Preencha o nome fantasia" style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="ENDEREÇO / Nº"><div style={{display:"flex",gap:6}}><input value={street} onChange={e=>setStreet(e.target.value)} style={{flex:1}}/><input value={num} onChange={e=>setNum(e.target.value)} placeholder="Nº" style={{width:50}}/></div></LB>
  <LB t="COMPLEMENTO / CEP"><div style={{display:"flex",gap:6}}><input value={comp} onChange={e=>setComp(e.target.value)} style={{flex:1}}/><input value={cep} onChange={e=>setCep(e.target.value)} placeholder="CEP" style={{width:85}}/></div></LB>
  <LB t="BAIRRO"><input value={district} onChange={e=>setDistrict(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CIDADE / UF"><div style={{display:"flex",gap:6}}><input value={city} onChange={e=>setCity(e.target.value)} style={{flex:1}}/><select value={state} onChange={e=>setState(e.target.value)} style={{width:60}}><option>MT</option><option>MS</option><option>PA</option><option>GO</option><option>RO</option><option>TO</option></select></div></LB>
  <LB t="TELEFONE"><input value={phone} onChange={e=>setPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA / ORIGEM"><div style={{display:"flex",gap:6}}><select value={catId} onChange={e=>setCatId(parseInt(e.target.value))} style={{flex:1,fontSize:11}}>{CAT_IDS.map(c=><option key={c.id} value={c.id}>{c.n}</option>)}</select><select value={originId} onChange={e=>setOriginId(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Origem</option>{ORIGINS.map(o=><option key={o.id} value={o.id}>{o.n}</option>)}</select></div></LB>
  <LB t="SETOR / GRUPO"><div style={{display:"flex",gap:6}}><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Setor</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select><input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Grupo" style={{flex:1}}/></div></LB>
  {er&&<p style={{fontSize:12,color:S.dng,margin:"0 0 6px"}}>{er}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onCancel} style={{flex:1}}>Cancelar</button><button onClick={createOrg} disabled={lo||(!name.trim()&&!legal.trim())} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"Salvando...":"Próximo →"}</button></div>
  </>:<><p style={{fontWeight:600,fontSize:16,margin:"0 0 2px"}}>Contato — {orgName}</p><p style={{fontSize:11,color:S.ts,margin:"0 0 10px"}}>Etapa 2 de 2</p>
  <LB t="NOME"><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome do responsavel" style={{width:"100%"}}/></LB>
  <LB t="E-MAIL"><input value={pEmail} onChange={e=>setPEmail(e.target.value)} type="email" style={{width:"100%"}}/></LB>
  <LB t="TELEFONE"><input value={pPhone} onChange={e=>setPPhone(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="WHATSAPP"><input value={pWhats} onChange={e=>setPWhats(e.target.value)} style={{width:"100%"}}/></LB>
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={()=>finish(false)} style={{flex:1,color:S.ts}}>Pular</button><button onClick={()=>finish(true)} disabled={lo||!pName.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{lo?"...":"Finalizar"}</button></div></>}
</div></div>);}

function PersonModal({org,token,onClose}){const[n,setN]=useState("");const[e,setE]=useState("");const[p,setP]=useState("");const[w,setW]=useState("");const[lo,setLo]=useState(false);const[msg,setMsg]=useState("");const go=async()=>{if(!n.trim())return;setLo(true);try{await agF("/people",token,{method:"POST",body:JSON.stringify({name:n,organization:org.id,...(e?{email:e}:{}),contact:{...(p?{mobile:p}:{}),...(w?{whatsapp:w}:{})}})});setMsg("Adicionado!");setN("");setE("");setP("");setW("");}catch(x){setMsg("Erro: "+x.message);}setLo(false);};return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px"}}>Adicionar Pessoa</p><p style={{fontSize:12,color:S.ts,margin:"0 0 12px"}}>{org.name}</p><LB t="NOME"><input value={n} onChange={x=>setN(x.target.value)} style={{width:"100%"}}/></LB><LB t="E-MAIL"><input value={e} onChange={x=>setE(x.target.value)} type="email" style={{width:"100%"}}/></LB><LB t="TELEFONE"><input value={p} onChange={x=>setP(x.target.value)} style={{width:"100%"}}/></LB><LB t="WHATSAPP"><input value={w} onChange={x=>setW(x.target.value)} style={{width:"100%"}}/></LB>{msg&&<p style={{fontSize:12,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"0 0 6px"}}>{msg}</p>}<div style={{display:"flex",gap:8}}><button onClick={onClose} style={{flex:1}}>Fechar</button><button onClick={go} disabled={lo||!n.trim()} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>{lo?"...":"Adicionar"}</button></div></div></div>);}

const PRODS=[{id:761952,n:"TRAMONTINA"},{id:761953,n:"PADO"},{id:761954,n:"HIPER TEXTIL"},{id:1139796,n:"PLASTILIT"},{id:1392476,n:"FESTCOLOR"},{id:1627655,n:"ZAGONEL"},{id:2046010,n:"RUVOLO"},{id:2260997,n:"SANTANA"}];

function EditModal({org,token,users,onSave,onClose}){const[name,setName]=useState(org.name||"");const[legal,setLegal]=useState("");const[catId,setCatId]=useState("");const[sectorId,setSectorId]=useState("");const[grupo,setGrupo]=useState(org.grupo?.replace("Grupo: ","")||"");const[ownerId,setOwnerId]=useState("");
  const curProds=org.products?org.products.split(", ").filter(p=>!p.startsWith("P_")):[];
  const[selProds,setSelProds]=useState(()=>PRODS.filter(p=>curProds.includes(p.n)).map(p=>p.id));
  const[lo,setLo]=useState(false);const[fetching,setFetching]=useState(false);const[msg,setMsg]=useState("");
  const toggleProd=id=>setSelProds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const refresh=async()=>{if(!org.cnpj)return;setFetching(true);setMsg("");try{const d=await fetchCNPJ(org.cnpj);setName(d.nome_fantasia||name);setLegal(d.razao_social||"");setMsg("Dados atualizados!");}catch(e){setMsg("Erro: "+e.message);}setFetching(false);};
  const save=async()=>{setLo(true);setMsg("");try{const body={products:selProds};if(name.trim())body.name=name.trim();if(legal.trim())body.legalName=legal.trim();if(catId)body.category=parseInt(catId);if(sectorId)body.sector=parseInt(sectorId);if(ownerId)body.ownerUser=parseInt(ownerId);body.description=grupo.trim()?`Grupo: ${grupo.trim()}`:"";const resp=await agF(`/organizations/${org.id}`,token,{method:"PUT",body:JSON.stringify(body)});if(resp.data){onSave(strip(resp.data));setMsg("Salvo!");}else{onSave({...org,name:name||org.name});}}catch(e){setMsg("Erro: "+e.message);}setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><p style={{fontWeight:600,fontSize:16,margin:0}}>Editar Cliente</p>{org.cnpj&&<button onClick={refresh} disabled={fetching} style={{padding:"4px 10px",fontSize:11,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc}}>{fetching?"...":"🔄 RF"}</button>}</div>
  {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>CNPJ: {org.cnpj}</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} placeholder="Atualizar" style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA"><select value={catId} onChange={e=>setCatId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.cat||"-"}</option>{CAT_IDS.map(c=><option key={c.id} value={c.id}>{c.n}</option>)}</select></LB>
  <LB t="RESPONSÁVEL"><select value={ownerId} onChange={e=>setOwnerId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.owner||"-"}</option>{users.map(u=><option key={u.id} value={u.id}>{u.n}</option>)}</select></LB>
  <LB t="SETOR"><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.sector||"-"}</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select></LB>
  <LB t="GRUPO"><input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Nome do grupo" style={{width:"100%"}}/></LB>
  <LB t="PRODUTOS / MARCAS"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{PRODS.map(p=><button key={p.id} onClick={()=>toggleProd(p.id)} style={{padding:"4px 8px",fontSize:10,border:selProds.includes(p.id)?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:selProds.includes(p.id)?S.ok+"22":"transparent",color:selProds.includes(p.id)?S.ok:S.ts,borderRadius:6,fontWeight:selProds.includes(p.id)?600:400}}>{p.n}</button>)}</div></LB>
  {msg&&<p style={{fontSize:12,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"0 0 6px"}}>{msg}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onClose} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"...":"Salvar"}</button></div></div></div>);}

function DayBaseModal({user,onSave,onCancel}){const home=HOMES[user?.id];const[tp,setTp]=useState("home");const[lo,setLo]=useState(false);const[hn,setHn]=useState("");const go=async()=>{if(tp==="home"&&home){onSave({type:"home",...home});return;}setLo(true);try{const g=await gps();onSave({type:tp,lat:g.lat,lng:g.lng,label:hn||"Hotel/Airbnb"});}catch{alert("GPS indisponivel.");}setLo(false);};return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.5rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 16px"}}>Inicio da jornada</p>{["home","hotel"].map(t=><label key={t} style={{display:"flex",alignItems:"center",gap:10,padding:12,border:`${tp===t?2:1}px solid ${tp===t?S.pri:S.brd}`,borderRadius:10,marginBottom:8,cursor:"pointer",background:tp===t?S.cl:S.bg}}><input type="radio" checked={tp===t} onChange={()=>setTp(t)}/><span style={{fontWeight:500}}>{t==="home"?"Casa":"Hotel / Airbnb"}</span></label>)}{tp==="hotel"&&<input value={hn} onChange={e=>setHn(e.target.value)} placeholder="Nome do hotel" style={{width:"100%",marginBottom:8}}/>}<div style={{display:"flex",gap:8,marginTop:8}}><button onClick={onCancel} style={{flex:1}}>Depois</button><button onClick={go} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"GPS...":"Confirmar"}</button></div></div></div>);}

function DivergentModal({org,dist,onAction,onCancel}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:400}}><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Local divergente</p><p style={{fontSize:13,color:S.ts,margin:"0 0 4px"}}>{org.name}</p><p style={{fontSize:12,color:S.gold,margin:"0 0 16px"}}>Voce esta a {dist}m do cadastrado</p><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}><button onClick={()=>onAction("checkin")} style={{padding:12,textAlign:"left",fontWeight:500}}>📍 Visita presencial</button>{TYPES.filter(t=>t.id!=="VISITA").map(t=><button key={t.id} onClick={()=>onAction("remote",t.id)} style={{padding:12,textAlign:"left"}}>{t.l} (sem check-in)</button>)}<button onClick={()=>onAction("schedule")} style={{padding:12,textAlign:"left",color:S.acc}}>📅 Agendar futuro</button></div><button onClick={onCancel} style={{width:"100%",color:S.dng}}>Cancelar</button></div></div>);}

function RotasTab({visits,dayBases,user}){const[sel,setSel]=useState(new Date().toISOString().slice(0,10));const[routes,setRoutes]=useState([]);const[lo,setLo]=useState(false);const home=HOMES[user?.id];const base=dayBases[sel]||home;const dv=useMemo(()=>{const t=new Date(sel+"T12:00:00").toDateString();return visits.filter(v=>new Date(v.checkinTime).toDateString()===t&&v.checkoutTime).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));},[visits,sel]);
  useEffect(()=>{if(!dv.length){setRoutes([]);return;}let c=false;setLo(true);(async()=>{const s=[];if(base&&dv[0]?.lat)s.push({f:base.label,t:dv[0].orgName,tp:"bs",...await roadKm(base.lat,base.lng,dv[0].lat,dv[0].lng)});for(let i=0;i<dv.length-1;i++){const a=dv[i],b=dv[i+1];if(a.lat&&b.lat)s.push({f:a.orgName,t:b.orgName,tp:hourDec(a.checkoutTime)>=LUNCH_START&&hourDec(b.checkinTime)<=LUNCH_END+1?"lch":"tr",...await roadKm(a.checkoutLat||a.lat,a.checkoutLng||a.lng,b.lat,b.lng)});}const last=dv[dv.length-1];if(base&&last?.lat)s.push({f:last.orgName,t:base.label,tp:"be",...await roadKm(last.checkoutLat||last.lat,last.checkoutLng||last.lng,base.lat,base.lng)});if(!c){setRoutes(s);setLo(false);}})();return()=>{c=true;};},[dv,base]);
  const totKm=routes.reduce((s,r)=>s+r.km,0);const workH=dv.length?mins(dv[0].checkinTime,dv[dv.length-1].checkoutTime):0;const days=[...new Set(visits.filter(v=>v.checkoutTime).map(v=>new Date(v.checkinTime).toISOString().slice(0,10)))].sort().reverse().slice(0,30);
  return(<div><select value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:12}}><option value={new Date().toISOString().slice(0,10)}>Hoje — {fD(new Date())}</option>{days.filter(d=>d!==new Date().toISOString().slice(0,10)).map(d=><option key={d} value={d}>{fD(d+"T12:00")}</option>)}</select>
    {dv.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[["Km",totKm.toFixed(1)],["Jornada",hrsMin(workH)],["Visitas",dv.length],["Base",routes.filter(r=>r.tp==="bs"||r.tp==="be").reduce((s,r)=>s+r.km,0).toFixed(1)+" km"]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}</div>}
    {lo&&<p style={{color:S.ts,textAlign:"center",padding:"1rem 0"}}>Calculando...</p>}{!dv.length&&!lo&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita</p>}
    {dv.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,overflow:"hidden"}}>{routes.find(r=>r.tp==="bs")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Casa → 1o PDV: {routes.find(r=>r.tp==="bs").km.toFixed(1)} km</span></div>}{dv.map((v,i)=>{const seg=routes.find(r=>r.tp!=="bs"&&r.tp!=="be"&&r.f===v.orgName);return(<div key={i}><div style={{padding:"10px 14px",display:"flex",gap:10}}><div style={{width:22,height:22,borderRadius:"50%",background:S.pri+"33",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:10,fontWeight:600,color:S.pl}}>{i+1}</span></div><div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{fT(v.checkinTime)}→{fT(v.checkoutTime)} {mins(v.checkinTime,v.checkoutTime)}min</p></div></div>{seg&&<div style={{padding:"3px 14px 3px 46px",background:seg.tp==="lch"?S.gold+"15":S.bg}}><span style={{fontSize:11,color:seg.tp==="lch"?S.gold:S.td}}>{seg.tp==="lch"?"Almoco ":"↓ "}{seg.km.toFixed(1)}km</span></div>}</div>);})}
      {routes.find(r=>r.tp==="be")&&<div style={{padding:"8px 14px",background:S.pri+"18"}}><span style={{fontSize:12,color:S.pl}}>Ultimo → Casa: {routes.find(r=>r.tp==="be").km.toFixed(1)} km</span></div>}
      <div style={{padding:"10px 14px",borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"space-between"}}><span style={{color:S.ts}}>Total</span><span style={{fontSize:15,fontWeight:600,color:S.pl}}>{totKm.toFixed(1)} km</span></div>
      {base&&dv.length>0&&<a href={`https://www.google.com/maps/dir/${base.lat},${base.lng}/${dv.map(v=>`${v.lat},${v.lng}`).join("/")}/${base.lat},${base.lng}`} target="_blank" rel="noopener" style={{display:"block",padding:"10px",background:S.acc+"22",textAlign:"center",textDecoration:"none",color:S.acc,fontWeight:500,fontSize:13}}>Abrir no Google Maps</a>}
    </div>}</div>);}

function RelatorioTab({visits,dayBases,user,token}){const[sd,setSd]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().slice(0,10);});const[ed,setEd]=useState(new Date().toISOString().slice(0,10));const[selUser,setSelUser]=useState("me");const[remoteVisits,setRemoteVisits]=useState([]);const[rLo,setRLo]=useState(false);const home=HOMES[user?.id];
  const loadRemote=async()=>{setRLo(true);try{const d=await agF(`/tasks?createdDateGt=${sd}T00:00:00Z&per_page=200`,token);const otherId=user.id===743088?743347:743088;const tasks=(d.data||[]).filter(t=>t.user?.id===otherId&&(t.type==="Visita"||t.type==="VISITA")).map(t=>({orgId:t.organization?.id,orgName:t.organization?.name||"?",checkinTime:t.createdAt,checkoutTime:t.createdAt,note:t.text||"",userName:t.user?.name||""}));setRemoteVisits(tasks);}catch{}setRLo(false);};
  useEffect(()=>{if(selUser==="team")loadRemote();},[selUser,sd]);
  const useVisits=selUser==="me"?visits:remoteVisits;const pv=useMemo(()=>useVisits.filter(v=>{if(!v.checkoutTime)return false;const d=new Date(v.checkinTime).toISOString().slice(0,10);return d>=sd&&d<=ed;}).sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime)),[useVisits,sd,ed]);const bd=useMemo(()=>{const m={};pv.forEach(v=>{const k=new Date(v.checkinTime).toISOString().slice(0,10);if(!m[k])m[k]=[];m[k].push(v);});return Object.entries(m).sort(([a],[b])=>b.localeCompare(a));},[pv]);const totKm=useMemo(()=>{let km=0;bd.forEach(([dt,dvs])=>{const s=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;if(b2&&s[0]?.lat)km+=hav(b2.lat,b2.lng,s[0].lat,s[0].lng)*1.3;for(let i=1;i<s.length;i++)if(s[i].lat&&s[i-1].lat)km+=hav(s[i-1].checkoutLat||s[i-1].lat,s[i-1].checkoutLng||s[i-1].lng,s[i].lat,s[i].lng)*1.3;const l=s[s.length-1];if(b2&&l?.lat)km+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;});return km;},[bd,dayBases,home]);const totMin=pv.reduce((s,v)=>s+mins(v.checkinTime,v.checkoutTime),0);const workH=bd.reduce((s,[,d])=>{const sr=[...d].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));return s+mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime);},0);const mx=Math.max(1,...bd.map(([,v])=>v.length));
  return(<div>
    {user?.id===743088&&<div style={{display:"flex",gap:4,marginBottom:8}}><button onClick={()=>setSelUser("me")} style={{flex:1,padding:8,fontSize:12,border:selUser==="me"?`2px solid ${S.pri}`:`1px solid ${S.brd}`,background:selUser==="me"?S.pri+"22":"transparent",color:selUser==="me"?S.pri:S.ts,fontWeight:selUser==="me"?600:400}}>Meus dados</button><button onClick={()=>setSelUser("team")} style={{flex:1,padding:8,fontSize:12,border:selUser==="team"?`2px solid ${S.acc}`:`1px solid ${S.brd}`,background:selUser==="team"?S.acc+"22":"transparent",color:selUser==="team"?S.acc:S.ts,fontWeight:selUser==="team"?600:400}}>{rLo?"Carregando...":"Alisson Henrique"}</button></div>}
    <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}><input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{flex:1,fontSize:12}}/><span style={{color:S.td}}>ate</span><input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{flex:1,fontSize:12}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[["Km",totKm.toFixed(0)],["Visitas",pv.length],["Dias",bd.length],["Jornada",hrsMin(workH)]].map(([l,v],i)=><div key={i} style={{background:S.cl,borderRadius:10,padding:10}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px"}}>{l}</p><p style={{fontSize:18,fontWeight:600,margin:0}}>{v}</p></div>)}</div>
    <div style={{display:"flex",gap:6,marginBottom:12}}><button onClick={()=>{const rows=[["Data","Vendedor","Origem","Destino","Visitas","Km","Jornada","Clientes"]];bd.forEach(([dt,dvs])=>{const sr=[...dvs].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));const b2=dayBases[dt]||home;let dk=0;if(b2&&sr[0]?.lat)dk+=hav(b2.lat,b2.lng,sr[0].lat,sr[0].lng)*1.3;for(let i=1;i<sr.length;i++)if(sr[i].lat&&sr[i-1].lat)dk+=hav(sr[i-1].checkoutLat||sr[i-1].lat,sr[i-1].checkoutLng||sr[i-1].lng,sr[i].lat,sr[i].lng)*1.3;const l=sr[sr.length-1];if(b2&&l?.lat)dk+=hav(l.checkoutLat||l.lat,l.checkoutLng||l.lng,b2.lat,b2.lng)*1.3;rows.push([fD(dt+"T12:00"),user?.name,b2?.label||"",b2?.label||"",dvs.length,dk.toFixed(1),hrsMin(mins(sr[0].checkinTime,sr[sr.length-1].checkoutTime)),dvs.map(v=>v.orgName).join(", ")]);});rows.push([],["TOTAL","","","",pv.length,totKm.toFixed(1),hrsMin(workH),""]);csv(rows,`km-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:11}}>Exportar Resumo</button>
      <button onClick={()=>{const rows=[["Data","In","Out","Min","Cliente","Cidade","Tipo","Obs","Venda"]];pv.forEach(v=>rows.push([fD(v.checkinTime),fT(v.checkinTime),fT(v.checkoutTime),mins(v.checkinTime,v.checkoutTime),v.orgName,v.city||"",v.taskType||"",v.note||"",v.sale?`${v.sale.brand} R$${v.sale.value}`:""]));csv(rows,`visitas-${user?.name}-${sd}-${ed}.csv`);}} style={{flex:1,fontSize:11}}>Exportar Detalhado</button></div>
    {bd.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"12px 14px"}}><p style={{fontWeight:500,marginBottom:8,fontSize:13}}>Visitas/dia</p>{bd.map(([dt,dvs])=><div key={dt} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:10,color:S.ts,width:42,textAlign:"right"}}>{fDS(dt+"T12:00")}</span><div style={{flex:1,height:14,background:S.bg,borderRadius:3}}><div style={{height:"100%",width:`${(dvs.length/mx)*100}%`,background:S.pri,borderRadius:3,minWidth:3}}/></div><span style={{fontSize:11,fontWeight:600,width:16,textAlign:"right"}}>{dvs.length}</span></div>)}</div>}
  </div>);}

// ─── Equipe Tab (Jordan only - view Alisson's productivity) ───
function EquipeTab({token,plocs,orgs}){
  const[tasks,setTasks]=useState([]);const[lo,setLo]=useState(false);const[sel,setSel]=useState(new Date().toISOString().slice(0,10));const[routeKm,setRouteKm]=useState(null);
  const getCoord=(oid)=>{if(plocs[oid])return[plocs[oid].lat,plocs[oid].lng];const o=orgs.find(x=>x.id===oid);if(o){const g=geoEstimate(o);if(g)return g;}return null;};
  const load=async()=>{setLo(true);setRouteKm(null);try{const dt=new Date(sel+"T00:00:00");const d=await agF(`/tasks?createdDateGt=${dt.toISOString()}&per_page=200`,token);const alisson=(d.data||[]).filter(t=>t.user?.id===743347).map(t=>({type:t.type||"?",org:t.organization?.name||"?",orgId:t.organization?.id,text:t.text||"",time:t.createdAt,done:t.done}));setTasks(alisson);
    if(alisson.length>=1){const sorted=[...alisson].sort((a,b)=>a.time.localeCompare(b.time));let km=0;const home=HOMES[743347];const fc=getCoord(sorted[0].orgId),lc=getCoord(sorted[sorted.length-1].orgId);
      if(home&&fc)km+=hav(home.lat,home.lng,fc[0],fc[1])*1.3;
      for(let i=0;i<sorted.length-1;i++){const a=getCoord(sorted[i].orgId),b=getCoord(sorted[i+1].orgId);if(a&&b)km+=hav(a[0],a[1],b[0],b[1])*1.3;}
      if(home&&lc)km+=hav(lc[0],lc[1],home.lat,home.lng)*1.3;
      setRouteKm(km);}
  }catch(e){console.error(e);}setLo(false);};
  useEffect(()=>{load();},[sel]);
  const visitTasks=tasks.filter(t=>t.type==="Visita"||t.type==="VISITA");
  const firstTime=tasks.length?tasks.reduce((m,t)=>t.time<m?t.time:m,tasks[0].time):null;
  const lastTime=tasks.length?tasks.reduce((m,t)=>t.time>m?t.time:m,tasks[0].time):null;
  const workH=firstTime&&lastTime?mins(firstTime,lastTime):0;
  const withGps=tasks.filter(t=>plocs[t.orgId]).length;const withEst=tasks.filter(t=>getCoord(t.orgId)).length;
  return(<div>
    <p style={{fontWeight:600,fontSize:16,margin:"0 0 12px"}}>Produtividade — Alisson Henrique</p>
    <LB t="DATA"><input type="date" value={sel} onChange={e=>setSel(e.target.value)} style={{width:"100%",marginBottom:8}}/></LB>
    <button onClick={load} disabled={lo} style={{width:"100%",marginBottom:14,padding:12,background:S.pri,border:"none",fontWeight:500}}>{lo?"Carregando...":"Atualizar"}</button>
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
        <p style={{fontSize:11,color:S.ts,margin:"2px 0 0 30px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.type} — {t.text.slice(0,60)}</p>
      </div>)}
    </div>}
  </div>);}

// ─── MAIN ───
export default function App(){
  const[token,setToken]=useState(()=>sL("jc:token",""));const[user,setUser]=useState(()=>sL("jc:user",null));const[orgs,setOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>sL("jc:visits",[]));const[active,setActive]=useState(()=>sL("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[search,setSearch]=useState("");const[catFilters,setCatFilters]=useState([]);const[cityFilter,setCityFilter]=useState("Todas");const[stateFilter,setStateFilter]=useState("Todos");const[segFilter,setSegFilter]=useState("Todos");const[prodFilter,setProdFilter]=useState("Todos");const[ownerFilter,setOwnerFilter]=useState("Todos");const[no30,setNo30]=useState(false);
  const[nearMe,setNearMe]=useState(null);const[nearLoading,setNearLoading]=useState(false);const[nearRoad,setNearRoad]=useState({});const[sortMode,setSortMode]=useState("alpha"); // alpha, near, rfv
  const[syncing,setSyncing]=useState(false);const[syncMsg,setSyncMsg]=useState("");const[ldId,setLdId]=useState(null);const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);const[personTarget,setPersonTarget]=useState(null);const[newClient,setNewClient]=useState(false);const[divTarget,setDivTarget]=useState(null);const[editTarget,setEditTarget]=useState(null);
  const[plocs,setPlocs]=useState(()=>sL("jc:pdvLocs",{}));const[dayBases,setDayBases]=useState(()=>sL("jc:dayBases",{}));const[showDB,setShowDB]=useState(false);const[vc,setVc]=useState(PG);

  useEffect(()=>{sS("jc:visits",visits);},[visits]);useEffect(()=>{sS("jc:active",active);},[active]);useEffect(()=>{sS("jc:pdvLocs",plocs);},[plocs]);useEffect(()=>{sS("jc:dayBases",dayBases);},[dayBases]);
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  // ─── Cross-device sync ───
  const syncPush=async(data)=>{try{await fetch(`${API}?sync=${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:data})});}catch{}};
  const syncClear=async()=>{try{await fetch(`${API}?sync=${user.id}`,{method:"DELETE"});}catch{}};
  const syncPlocs=async(locs)=>{try{await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:locs})});}catch{}};
  const[teamActive,setTeamActive]=useState(null);
  const syncPull=async()=>{try{
    const r=await fetch(`${API}?sync=${user.id}`);const d=await r.json();
    setActive(prev=>{if(d.active&&(!prev||prev.fromSync))return{...d.active,fromSync:true};if(!d.active&&prev?.fromSync)return null;return prev;});
    const otherId=user.id===743088?743347:743088;
    const r2=await fetch(`${API}?sync=${otherId}`);const d2=await r2.json();
    setTeamActive(d2.active||null);
    const r3=await fetch(`${API}?sync=plocs`);const d3=await r3.json();
    if(d3.active){setPlocs(prev=>{const m={...d3.active,...prev};sS("jc:pdvLocs",m);return m;});}
  }catch{}};
  useEffect(()=>{if(!token||!user)return;syncPull();const iv=setInterval(syncPull,15000);return()=>clearInterval(iv);},[token,user]);

  // Alert: 8AM no activity
  const[mAlert,setMAlert]=useState(false);
  useEffect(()=>{if(!token||!user)return;const ck=()=>{const h=new Date().getHours();const td=new Date().toDateString();const has=visits.some(v=>new Date(v.checkinTime).toDateString()===td)||active;setMAlert(h>=8&&h<12&&!has);};ck();const iv=setInterval(ck,300000);return()=>clearInterval(iv);},[token,user,visits,active]);
  // Alert: active visit > 2h
  const[longVisit,setLongVisit]=useState(false);
  useEffect(()=>{if(!active){setLongVisit(false);return;}const ck=()=>{if(mins(active.checkinTime,new Date())>=120)setLongVisit(true);};ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[active]);
  // Alert: unclosed visit from previous day
  const[prevDay,setPrevDay]=useState(null);
  useEffect(()=>{if(!token||!user||!active)return setPrevDay(null);if(new Date(active.checkinTime).toDateString()!==new Date().toDateString())setPrevDay(active);else setPrevDay(null);},[token,user,active]);

  const doSync=async(t)=>{setSyncing(true);setSyncMsg("Conectando...");try{let pg=1,all=[];while(true){setSyncMsg(`${all.length} clientes...`);const d=await agF(`/organizations?page=${pg}&per_page=100`,t||token);if(!d.data?.length)break;all.push(...d.data.map(strip));setOrgs([...all]);if(d.data.length<100)break;pg++;}setSyncMsg(`${all.length}`);}catch(e){setSyncMsg("Erro");}setSyncing(false);};

  // Load history from Agendor
  const loadHistory=async()=>{setSyncMsg("Carregando historico...");try{const since=new Date();since.setDate(since.getDate()-90);const d=await agF(`/tasks?createdDateGt=${since.toISOString()}&per_page=200`,token);if(d.data?.length){const remote=d.data.filter(t=>t.type==="Visita"&&t.done).map(t=>({orgId:t.organization?.id,orgName:t.organization?.name||"?",city:"",checkinTime:t.createdAt,checkoutTime:t.createdAt,note:t.text||"",taskType:"VISITA",synced:true,fromAgendor:true,userName:t.user?.name||""}));const existing=new Set(visits.map(v=>v.orgId+"|"+v.checkinTime?.slice(0,16)));const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+r.checkinTime?.slice(0,16)));if(newOnes.length){setVisits(prev=>[...prev,...newOnes]);setSyncMsg(`+${newOnes.length} visitas carregadas`);}else setSyncMsg("Historico ja esta atualizado");}else setSyncMsg("Nenhuma visita encontrada");}catch(e){setSyncMsg("Erro: "+e.message);}};

  const ensureBase=()=>{const t=new Date().toISOString().slice(0,10);if(!dayBases[t])setShowDB(true);};
  const cities=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const c=o.addr?.city_name||o.addr?.city;if(c)s.add(c);});return["Todas",...[...s].sort()];},[orgs]);
  const states=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.addr?.state)s.add(o.addr.state);});return["Todos",...[...s].sort()];},[orgs]);
  const segments=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.sector)s.add(o.sector);});return["Todos",...[...s].sort()];},[orgs]);
  const products=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.products)(o.products.split(", ")).forEach(p=>{if(p&&!p.startsWith("P_"))s.add(p);});});return["Todos",...[...s].sort()];},[orgs]);
  const owners=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.owner)s.add(o.owner);});return["Todos",...[...s].sort()];},[orgs]);
  const usersList=useMemo(()=>{const m={};orgs.forEach(o=>{if(o.ownerId&&o.owner)m[o.ownerId]=o.owner;});return Object.entries(m).map(([id,n])=>({id:parseInt(id),n}));},[orgs]);

  const lastVisits=useMemo(()=>{const m={};visits.forEach(v=>{if(v.checkoutTime&&(!m[v.orgId]||v.checkinTime>m[v.orgId].time))m[v.orgId]={time:v.checkinTime,who:v.userName||user?.name||""};});return m;},[visits]);
  const thirtyDaysAgo=new Date();thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);const t30=thirtyDaysAgo.toISOString();

  const fo=useMemo(()=>{let list=orgs;
    if(catFilters.length)list=list.filter(o=>catFilters.includes(o.cat));
    if(stateFilter!=="Todos")list=list.filter(o=>o.addr?.state===stateFilter);
    if(cityFilter!=="Todas")list=list.filter(o=>(o.addr?.city_name||o.addr?.city)===cityFilter);
    if(segFilter!=="Todos")list=list.filter(o=>o.sector===segFilter);
    if(prodFilter!=="Todos")list=list.filter(o=>o.products?.includes(prodFilter));
    if(ownerFilter!=="Todos")list=list.filter(o=>o.owner===ownerFilter);
    if(no30)list=list.filter(o=>!lastVisits[o.id]||lastVisits[o.id].time<t30);
    if(search.trim()){const q=search.toLowerCase().replace(/[.\-\/]/g,"");list=list.filter(o=>[o.name,o.nickname,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ").toLowerCase().includes(q));}
    // Sort mode
    if(sortMode==="near"&&nearMe){
      const withGPS=list.filter(o=>plocs[o.id]).map(o=>({...o,dist:hav(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng),distType:"gps"}));
      const noGPS=list.filter(o=>!plocs[o.id]).map(o=>{const geo=geoEstimate(o);if(geo)return{...o,dist:hav(nearMe.lat,nearMe.lng,geo[0],geo[1]),distType:"bairro"};return{...o,dist:9999,distType:"sem_ref"};});
      withGPS.sort((a,b)=>a.dist-b.dist);noGPS.sort((a,b)=>a.dist-b.dist);
      list=[...withGPS,...noGPS];
    }else if(sortMode==="rfv"){
      // Placeholder: sort by last visit date (most recent first) until RFV is built
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});
    }else{
      list=list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    }
    return list;
  },[orgs,search,catFilters,cityFilter,stateFilter,segFilter,prodFilter,ownerFilter,no30,lastVisits,nearMe,plocs,sortMode]);

  // Calculate road distances for top 10 nearest
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

  const checkin=async(org)=>{ensureBase();if(org.cat==="Online - B2B"&&!confirm(`${org.name} e Online/B2B.\nRegistrar visita?`))return;if(org.cat==="Inativo"&&!confirm(`${org.name} esta Inativo.\nContinuar?`))return;if(org.cat==="Excluido"&&!confirm(`${org.name} esta Excluido.\nContinuar?`))return;setLdId(org.id);setGeoErr("");try{const g=await gps();if(plocs[org.id]){const d=hav(plocs[org.id].lat,plocs[org.id].lng,g.lat,g.lng)*1000;if(d>500){setDivTarget({org,dist:Math.round(d),geo:g});setLdId(null);return;}}else{const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);}const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}catch{setGeoErr("GPS indisponivel.");}setLdId(null);};
  const handleDivAction=(action,type)=>{if(!divTarget)return;const{org,geo}=divTarget;if(action==="checkin"){const v={orgId:org.id,orgName:org.name,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}else if(action==="remote"&&type)setCoTarget({...org,remoteType:type});setDivTarget(null);};
  const checkout=async(note,type="VISITA",next=null,sale=null)=>{if(!active||ldId)return;setLdId(active.orgId);let g=null;try{g=await gps();}catch{}const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type,sale};try{await postTask(token,active.orgId,note,type,true);done.synced=true;}catch{}if(next?.nextDate&&next?.nextDesc){try{await postTask(token,active.orgId,next.nextDesc,next.nextType||"VISITA",false,`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`);}catch{}}if(sale?.brand&&sale?.value){try{await agF(`/organizations/${active.orgId}/deals`,token,{method:"POST",body:JSON.stringify({title:`Venda ${sale.brand}`,value:sale.value})});}catch{}}setVisits(p=>[done,...p]);setActive(null);syncClear();setCoTarget(null);setLdId(null);};

  // Delete specific visit
  const deleteVisit=(idx)=>{if(confirm("Excluir esta visita?"))setVisits(prev=>prev.filter((_,i)=>i!==idx));};

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sS("jc:token",t);sS("jc:user",u);}}/>;
  const baseTabs=[{id:"pdvs",i:"🏪",l:"PDVs"},{id:"rotas",i:"🛣️",l:"Rotas"},{id:"relatorio",i:"📊",l:"Relatório"},{id:"config",i:"⚙️",l:"Config"}];
  const tabs=user?.id===743088?[...baseTabs.slice(0,3),{id:"equipe",i:"👥",l:"Equipe"},...baseTabs.slice(3)]:baseTabs;

  return(<div style={{minHeight:"100vh",paddingBottom:70}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",background:S.card,borderBottom:`1px solid ${S.brd}`,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <img src="/logo.png" alt="" style={{height:56,width:"auto",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
        <div><p style={{fontSize:18,fontWeight:700,margin:0}}>Check-in</p><p style={{fontSize:13,color:S.ts,margin:0}}>{user?.name} — {fD(new Date())}</p></div>
      </div>
      <div style={{display:"flex",gap:6}}><button onClick={()=>setNewClient(true)} style={{padding:"10px 14px",fontSize:18,background:S.acc,border:"none",fontWeight:700}}>+</button><button onClick={()=>doSync()} disabled={syncing} style={{padding:"10px 16px",fontSize:15,background:syncing?S.cl:S.pri,border:"none",fontWeight:500}}>{syncing?"...":"🔄"}</button></div>
    </div>
    <div style={{padding:"0 16px"}}>
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs} onClick={()=>{setTab("pdvs");setSearch(active.orgName);}}/>}
      {teamActive&&tab!=="config"&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.gold,animation:"pulse 2s infinite"}}/><p style={{fontSize:13,color:S.gold,margin:0}}>{user.id===743088?"Alisson":"Jordan"} em atendimento: <b>{teamActive.orgName}</b></p></div><p style={{fontSize:11,color:S.ts,margin:"3px 0 0 16px"}}>Desde {fT(teamActive.checkinTime)} — {mins(teamActive.checkinTime,new Date())} min</p><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style></div>}

      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:0}}>⏰ Bom dia! Atividades ainda nao iniciadas.</p></div>}
      {prevDay&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>⚠️ Visita aberta de {fD(prevDay.checkinTime)} — {prevDay.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(prevDay.checkinTime);c.setHours(18);setVisits(p=>[{...prevDay,checkoutTime:c.toISOString(),note:"Auto 18h",synced:false},...p]);setActive(null);setPrevDay(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:prevDay.orgId,name:prevDay.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {longVisit&&!prevDay&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:"0 0 6px"}}>⏰ Visita ativa ha mais de 2h — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}
      <div style={{display:"flex",gap:3,marginBottom:12,background:S.cl,borderRadius:8,padding:3}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",background:tab===t.id?S.pri:"transparent",borderRadius:6,padding:"7px 2px",fontSize:11,fontWeight:tab===t.id?600:400,color:tab===t.id?"#fff":S.ts}}><span style={{fontSize:15,display:"block",marginBottom:1}}>{t.i}</span>{t.l}</button>)}</div>

      {tab==="pdvs"&&<div>
        <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, CNPJ, cidade, segmento, produto..." style={{width:"100%",marginBottom:6}}/>
        <div style={{display:"flex",gap:3,marginBottom:6,overflowX:"auto",paddingBottom:2,flexWrap:"wrap"}}>{CATS.map(c=><button key={c} onClick={()=>toggleCat(c)} style={{padding:"3px 8px",fontSize:10,whiteSpace:"nowrap",border:catFilters.includes(c)?`2px solid ${CC[c]||S.pri}`:`1px solid ${S.brd}`,background:catFilters.includes(c)?`${CC[c]}22`:"transparent",color:catFilters.includes(c)?CC[c]||S.pri:S.ts,borderRadius:20,fontWeight:catFilters.includes(c)?600:400}}>{c}</button>)}
          <button onClick={()=>setCatFilters([])} style={{padding:"3px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:!catFilters.length?S.pl:S.td,borderRadius:20,background:!catFilters.length?S.pri+"22":"transparent"}}>Todos</button>
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
          <button onClick={()=>{setNo30(!no30);setVc(PG);}} style={{padding:"4px 8px",fontSize:10,whiteSpace:"nowrap",border:`1px solid ${no30?S.gold:S.brd}`,color:no30?S.gold:S.td,background:no30?S.gold+"18":"transparent",borderRadius:6}}>30d+</button>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          <button onClick={()=>{setSortMode("alpha");setNearMe(null);setVc(PG);}} style={{flex:1,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="alpha"?S.pri:S.brd}`,color:sortMode==="alpha"?S.pri:S.td,background:sortMode==="alpha"?S.pri+"18":"transparent",borderRadius:6,fontWeight:sortMode==="alpha"?600:400}}>A→Z</button>
          <button onClick={async()=>{if(sortMode==="near"){setSortMode("alpha");setNearMe(null);return;}setNearLoading(true);try{const g=await gps();setNearMe(g);setSortMode("near");setVc(PG);}catch{alert("GPS indisponivel");}setNearLoading(false);}} style={{flex:2,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="near"?S.acc:S.brd}`,color:sortMode==="near"?S.acc:S.td,background:sortMode==="near"?S.acc+"18":"transparent",borderRadius:6,fontWeight:sortMode==="near"?600:400}}>{nearLoading?"📍 Localizando...":sortMode==="near"?"📍 Próximos (ativo)":"📍 Onde estou"}</button>
          <button onClick={()=>{setSortMode("rfv");setNearMe(null);setVc(PG);}} style={{flex:1,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="rfv"?S.gold:S.brd}`,color:sortMode==="rfv"?S.gold:S.td,background:sortMode==="rfv"?S.gold+"18":"transparent",borderRadius:6,fontWeight:sortMode==="rfv"?600:400}}>⭐ RFV</button>
        </div>
        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}
        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><button onClick={()=>doSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}
        {orgs.length>0&&<><p style={{fontSize:11,color:S.td,margin:"0 0 6px"}}>{fo.length} de {orgs.length}{no30?" (30d+)":""}{sortMode==="near"?" — por proximidade":sortMode==="rfv"?" — por relevância":""}{syncing&&` (${syncMsg})`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={checkin} onOut={o2=>setCoTarget(o2)} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} onQuick={quickAction} onInfo={o2=>alert(`${o2.name}\n${o2.cnpj||""}\n${o2.addr?.street||""} ${o2.addr?.number||""}\n${o2.addr?.district||""} ${o2.addr?.city_name||""} ${o2.addr?.state||""}\nCategoria: ${o2.cat}\nSetor: ${o2.sector}\nProdutos: ${o2.products}\n${o2.grupo||""}`)} ldId={ldId} plocs={plocs} lastVisit={lastVisits[o.id]||null} nearRoad={nearRoad}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc})</button>}
          <button onClick={()=>{const rows=[["Nome","CNPJ","Endereço","Bairro","Cidade","UF","Categoria","Segmento","Produtos","Responsável","Grupo","Última Visita"]];fo.forEach(o=>{rows.push([o.name,o.cnpj||"",`${o.addr?.street||""} ${o.addr?.number||""}`.trim(),o.addr?.district||"",o.addr?.city_name||o.addr?.city||"",o.addr?.state||"",o.cat||"",o.sector||"",o.products||"",o.owner||"",o.grupo?.replace("Grupo: ","")||"",lastVisits[o.id]?fD(lastVisits[o.id].time)+" - "+lastVisits[o.id].who:"Sem visita"]);});csv(rows,`clientes-filtrados-${fD(new Date())}.csv`);}} style={{width:"100%",marginTop:8,padding:12,fontSize:13,background:S.pri+"22",border:`1px solid ${S.pri}55`,color:S.pl,fontWeight:500}}>📊 Exportar {fo.length} clientes (Excel)</button>
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={async()=>{try{const d=await agF(`/organizations?cnpj=${search.replace(/[.\-\/]/g,"")}`,token);if(d.data?.length)setOrgs(p=>{const ids=new Set(p.map(o=>o.id));return[...d.data.map(strip).filter(f=>!ids.has(f.id)),...p];});}catch{}}} style={{width:"100%",marginTop:8,padding:14,background:S.acc,border:"none",fontWeight:500}}>Buscar CNPJ no Agendor</button>}
        </>}
      </div>}
      {tab==="rotas"&&<RotasTab visits={visits} dayBases={dayBases} user={user}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user} token={token}/>}

      {tab==="equipe"&&user?.id===743088&&<EquipeTab token={token} plocs={plocs} orgs={orgs}/>}

      {tab==="config"&&<div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:15,fontWeight:600,margin:"0 0 4px"}}>{user?.name}</p>{HOMES[user?.id]&&<p style={{fontSize:12,color:S.ok}}>Casa: {HOMES[user.id].label}</p>}</div>
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1rem",marginBottom:12}}><p style={{fontSize:12,color:S.ts}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</p></div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <button onClick={()=>doSync()} disabled={syncing} style={{padding:14,fontSize:14,fontWeight:500,background:S.pri,border:"none"}}>{syncing?syncMsg:"Sincronizar Clientes"}</button>
          <button onClick={loadHistory} style={{padding:12,fontSize:13,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc,fontWeight:500}}>Carregar historico do Agendor</button>
          <button onClick={()=>setShowDB(true)} style={{padding:12}}>Definir base do dia</button>
          {user?.id===743088&&<>
            <button onClick={()=>{const dt=prompt("Data para limpar visitas (DD/MM/AAAA):");if(!dt)return;const[d,m,y]=dt.split("/");const target=`${y}-${m}-${d}`;const count=visits.filter(v=>v.checkinTime?.startsWith(target)).length;if(!count){alert("Nenhuma visita nessa data.");return;}if(confirm(`Excluir ${count} visitas de ${dt}?`))setVisits(prev=>prev.filter(v=>!v.checkinTime?.startsWith(target)));}} style={{color:S.gold}}>Limpar visitas (por data)</button>
            <button onClick={()=>confirm("Limpar GPS?")&&(setPlocs({}),sS("jc:pdvLocs",{}))} style={{color:S.gold}}>Limpar GPS PDVs</button>
          </>}
          <button onClick={()=>{setToken("");setUser(null);setOrgs([]);sS("jc:token","");sS("jc:user",null);}} style={{color:S.dng}}>Desconectar</button>
        </div>
      </div>}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.card,borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"center",zIndex:40}}><div style={{display:"flex",maxWidth:960,width:"100%"}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setVc(PG);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"10px 4px 8px",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?S.pl:S.td}}><span style={{fontSize:18,display:"block",marginBottom:2}}>{t.i}</span>{t.l}</button>)}</div></div>
    {coTarget&&<NoteModal org={coTarget} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {showDB&&<DayBaseModal user={user} onSave={b=>{const t=new Date().toISOString().slice(0,10);setDayBases(p=>{const n={...p,[t]:b};sS("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
    {newClient&&<NewClientModal token={token} onSave={org=>{setOrgs(p=>[org,...p]);setNewClient(false);}} onCancel={()=>setNewClient(false)}/>}
    {personTarget&&<PersonModal org={personTarget} token={token} onClose={()=>setPersonTarget(null)}/>}
    {editTarget&&<EditModal org={editTarget} token={token} users={usersList} onSave={u=>{setOrgs(p=>p.map(o=>o.id===u.id?u:o));setEditTarget(null);}} onClose={()=>setEditTarget(null)}/>}
    {divTarget&&<DivergentModal org={divTarget.org} dist={divTarget.dist} onAction={handleDivAction} onCancel={()=>setDivTarget(null)}/>}
  </div>);}
