// TeamCheck — biblioteca: constantes, utilitários e API Agendor
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
async function agF(path,token,opts={}){const p=path.startsWith("/")?path.slice(1):path;const[base,qs]=p.split("?");let u=`${API}?path=${encodeURIComponent(base)}`;if(qs)u+="&"+qs;
  const r=await fetch(u,{...opts,cache:"no-store",headers:{Authorization:`Token ${token}`,"Content-Type":"application/json; charset=utf-8","Accept":"application/json; charset=utf-8",...(opts.headers||{})}});
  if(!r.ok){let _b="";try{_b=await r.text();}catch{}const _e=new Error(`${r.status}`);_e.body=_b;throw _e;}
  const buf=await r.arrayBuffer();
  const txt=new TextDecoder("utf-8",{fatal:false}).decode(buf);
  return JSON.parse(txt);
}
function trAg(m){const s=String(m||"").trim();const map=[[/contact email is invalid|email is invalid/i,"E-mail inválido (precisa ter @ e domínio)"],[/name is missing|name can't be blank/i,"Nome é obrigatório"],[/cnpj is invalid/i,"CNPJ inválido"],[/cnpj has already been taken/i,"CNPJ já cadastrado (pode estar na lixeira do Agendor)"],[/cpf is invalid/i,"CPF inválido"],[/cpf has already been taken/i,"CPF já cadastrado"],[/whatsapp.*invalid/i,"WhatsApp inválido"],[/(mobile|phone).*invalid/i,"Telefone inválido"],[/organization.*(missing|blank|required)/i,"Empresa é obrigatória"],[/has already been taken/i,"Já cadastrado no Agendor"],[/is missing|can't be blank|is required/i,"Campo obrigatório não preenchido"],[/is invalid/i,"Campo com formato inválido"]];for(const[re,pt]of map){if(re.test(s))return pt;}return s;}
function agErr(e){let arr=[];if(e&&e.body){try{const j=JSON.parse(e.body);if(Array.isArray(j.errors))arr=j.errors.map(x=>typeof x==="string"?x:(x.message||x.field||JSON.stringify(x)));else if(j.message)arr=[j.message];else if(j.error)arr=[j.error];}catch{if(e.body)arr=[e.body];}}if(!arr.length){const m=(e&&e.message)||"Erro";arr=[/^\d{3}$/.test(m)?("Erro "+m+" (dados inválidos)"):m];}const pt=[...new Set(arr.map(trAg).filter(Boolean))];return pt.join(" · ");}
async function postTask(token,oid,text,type="VISITA",done=true,due=null){const b={text,type,done};if(due)b.due_date=due;return agF(`/organizations/${oid}/tasks`,token,{method:"POST",body:JSON.stringify(b)});}
function gps(){return new Promise((r,j)=>{if(!navigator.geolocation)return j(new Error("GPS"));navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),j,{enableHighAccuracy:true,timeout:15000,maximumAge:0});});}
async function roadKm(a,b,c,d){try{const r=await fetch(`${OSRM}/${b},${a};${d},${c}?overview=false`);const j=await r.json();if(j.code==="Ok"&&j.routes?.[0])return{km:j.routes[0].distance/1000,dur:Math.round(j.routes[0].duration/60)};}catch{}return{km:hav(a,b,c,d)*1.3,dur:0};}
function csv(rows,fn){const b="\uFEFF"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(";")).join("\n");Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([b],{type:"text/csv;charset=utf-8"})),download:fn}).click();}
// ROBUST encoding fix: tries multiple strategies, picks the best result
function fixMojibake(s){
  if(!s||typeof s!=="string")return s;
  // Quick path: if no high-bit chars or replacement char, return as-is
  let hasIssue=false;
  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c>=0x80){hasIssue=true;break;}}
  if(!hasIssue)return s;
  
  const candidates=[s];
  
  // Strategy 1: U+FFFD replacement → known terms
  if(s.indexOf("\uFFFD")>=0){
    let r=s
      .replace(/CONSTRU\uFFFD+O/gi,"CONSTRUÇÃO")
      .replace(/CONSTRU\uFFFD+ES/gi,"CONSTRUÇÕES")
      .replace(/MAT\uFFFDRIAS/gi,"MATÉRIAS")
      .replace(/MAT\uFFFDRIA/gi,"MATÉRIA")
      .replace(/PRE\uFFFDO/gi,"PREÇO")
      .replace(/Cuiab\uFFFD/g,"Cuiabá")
      .replace(/V\uFFFDrzea/g,"Várzea")
      .replace(/Cap\uFFFDo/g,"Capão")
      .replace(/Bel\uFFFDm/g,"Belém")
      .replace(/Bras\uFFFDlia/g,"Brasília")
      .replace(/J\uFFFDlio/g,"Júlio")
      .replace(/Mour\uFFFDo/g,"Mourão")
      .replace(/Guimar\uFFFDes/g,"Guimarães")
      .replace(/Aren\uFFFDpolis/g,"Arenápolis")
      .replace(/Campin\uFFFDpolis/g,"Campinápolis")
      .replace(/Chapad\uFFFDo/g,"Chapadão")
      .replace(/ALIAN\uFFFDA/g,"ALIANÇA")
      .replace(/REPRESENTA\uFFFD\uFFFDES/gi,"REPRESENTAÇÕES")
      .replace(/representa\uFFFD\uFFFDes/gi,"representações");
    candidates.push(r);
  }
  
  // Strategy 2: Treat as Latin-1, re-decode as UTF-8
  try{
    const bytes=new Uint8Array(s.length);
    let allFit=true;
    for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c>255){allFit=false;break;}bytes[i]=c;}
    if(allFit){
      const decoded=new TextDecoder("utf-8",{fatal:false}).decode(bytes);
      candidates.push(decoded);
    }
  }catch{}
  
  // Strategy 3: Last-resort character substitutions for common Portuguese
  let r3=s.replace(/\uFFFD/g,"a"); // Replace unknown with 'a' (most common vowel)
  candidates.push(r3);
  
  // Pick best: fewest replacement chars, fewest control chars
  let best=candidates[0],bestScore=-1;
  for(const c of candidates){
    if(!c||typeof c!=="string")continue;
    let score=100;
    score-=(c.match(/\uFFFD/g)||[]).length*20;
    score-=(c.match(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g)||[]).length*10;
    // Prefer Portuguese-looking results (has á, é, ç, ã, ô, etc)
    if(/[áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/.test(c))score+=15;
    if(score>bestScore){bestScore=score;best=c;}
  }
  return best;
}
function strip(o){const a=o.address||{};const desc=fixMojibake(o.description||"");return{id:o.id,name:fixMojibake(o.name||""),nickname:fixMojibake(o.nickname||""),legalName:fixMojibake(o.legalName||""),cnpj:o.cnpj||"",cat:o.category?.name||"",sector:o.sector?.name||"",products:(o.products||[]).map(p=>p.name).join(", "),owner:o.ownerUser?.name||"",ownerId:o.ownerUser?.id||null,grupo:desc.startsWith("Grupo:")?desc:"",addr:{street:fixMojibake(a.streetName||a.street||""),number:a.streetNumber||a.number||"",district:fixMojibake(a.district||a.neighborhood||""),city:fixMojibake(a.city||""),city_name:fixMojibake(a.city_name||a.city||""),state:a.state||""},people:(o.people||[]).map(p=>p.name).join(", ")};}
async function fetchCNPJ(cnpj){const clean=cnpj.replace(/[.\-\/]/g,"");try{const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);if(r.ok)return r.json();}catch{}const r2=await fetch(`${API}?cnpj=${clean}`);if(!r2.ok)throw new Error("CNPJ nao encontrado");return r2.json();}
// ─── Helper: get base for date (backward compatible) ───
function getBase(dayBases,date,userId){const b=dayBases[userId+"_"+date]||dayBases[date];if(!b)return HOMES[userId]||null;if(b.start)return b.start;return b;}
function getEnd(dayBases,date,userId){const b=dayBases[userId+"_"+date]||dayBases[date];if(b?.end)return b.end;return getBase(dayBases,date,userId);}
// ─── Helper: only real visits (check-in based, not WhatsApp/calls) ───
function isRealVisit(v){if(!v.checkoutTime)return false;if(v.taskType&&v.taskType!=="VISITA")return false;if(v.divergent)return false;return true;}
// ─── Helper: resolve GPS from visit directly OR from plocs by orgId ───
function getVCoord(v,plocs){if(v.lat&&v.lng)return{lat:v.lat,lng:v.lng};if(plocs&&v.orgId&&plocs[v.orgId])return{lat:plocs[v.orgId].lat,lng:plocs[v.orgId].lng};return null;}
function getVEndCoord(v,plocs){if(v.checkoutLat&&v.checkoutLng)return{lat:v.checkoutLat,lng:v.checkoutLng};return getVCoord(v,plocs);}
const MIN_OBS=50;

export { API, OSRM, HOMES, LUNCH_START, LUNCH_END, PG, TZ, toLocalDate, todayLocal, TYPES, CATS, BRANDS, SECTORS, CAT_IDS, ORIGINS, USERS, CC, CITY_GEO, BRG, RGC, geoEstimate, S, fT, fD, fDS, mins, hrsMin, hourDec, hav, sL, sS, agF, agErr, trAg, postTask, gps, roadKm, csv, fixMojibake, strip, fetchCNPJ, getBase, getEnd, isRealVisit, getVCoord, getVEndCoord, MIN_OBS };
