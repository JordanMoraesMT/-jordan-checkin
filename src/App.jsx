// TeamCheck — App (orquestração principal)
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Store, Map as MapIcon, BarChart3, Calendar, Users, Settings, Plus, RefreshCw, ChevronUp, BookUser, Building2, Contact } from "lucide-react";
import { API, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hav, sL, sS, gps, fixMojibake, isRealVisit, loadCatalogos } from "./lib";
import { Login, Banner, NoteModal, NewClientModal, PeopleModal, EditModal, JourneyModal, DayEndModal, DivergentModal, SearchOrAddModal, JordanLogo } from "./components";
import { RotasTab } from "./tabs/RotasTab";
const RelatorioTab=lazy(()=>import("./tabs/RelatorioTab").then(m=>({default:m.RelatorioTab})));// recharts só carrega ao abrir o Relatório
import { EquipeTab } from "./tabs/EquipeTab";
import { AgendaTab } from "./tabs/AgendaTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { PdvsTab } from "./tabs/PdvsTab";
import { CrmTab } from "./tabs/CrmTab";

// ─── CRM próprio (D1 via Worker do Dashboard) — registro em segundo plano ───
const DASH_CRM = "https://dashboard.jordanmt.com";

export default function App(){
  // Tema (espelho do Dashboard): escuro por padrão; troca na aba Config, persistida
  useEffect(()=>{document.documentElement.dataset.theme=sL("jc:theme","dark");let m=document.querySelector("meta[name=theme-color]");if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m);}m.content="#0578A6";},[]);
  const[token,setToken]=useState(()=>sL("jc:session",""));const[user,setUser]=useState(()=>sL("jc:user",null));const[orgs,setOrgs]=useState([]);const[allOrgs,setAllOrgs]=useState([]);const[exclOrgs,setExclOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>{const raw=sL("jc:visits",[]);const cutoff=new Date();cutoff.setDate(cutoff.getDate()-90);const cut=cutoff.toISOString();const purged=raw.filter(v=>!v.checkinTime||v.checkinTime>=cut);if(purged.length<raw.length)console.log(`Purged ${raw.length-purged.length} visits >90d`);return purged;});const[active,setActive]=useState(()=>sL("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[focusReq,setFocusReq]=useState(null);
  const[crmBump,setCrmBump]=useState(0);// sinaliza mudanças no CRM (Agenda→feed Início)
  // ─── Moldura padrão Dashboard: sidebar recolhível + tema no header ───
  const[mob,setMob]=useState(()=>typeof window!=="undefined"&&window.innerWidth<900);
  const[navOpen,setNavOpen]=useState(()=>typeof window!=="undefined"&&window.innerWidth>=900);
  const[tema,setTema]=useState(()=>sL("jc:theme","dark"));
  useEffect(()=>{const fn=()=>{const m=window.innerWidth<900;setMob(m);setNavOpen(o=>m?false:true);};window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  const trocarTema=()=>{const t=tema==="dark"?"light":"dark";setTema(t);sS("jc:theme",t);document.documentElement.dataset.theme=t;};
  // (estado de filtros/proximidade de PDV movido para PdvsTab)
  const[syncing,setSyncing]=useState(false);const[syncMsg,setSyncMsg]=useState("");const[ldId,setLdId]=useState(null);const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);const[personTarget,setPersonTarget]=useState(null);const[newClient,setNewClient]=useState(false);const[searchAdd,setSearchAdd]=useState(false);const[divTarget,setDivTarget]=useState(null);const[editTarget,setEditTarget]=useState(null);
  const[plocs,setPlocs]=useState(()=>sL("jc:pdvLocs",{}));const[dayBases,setDayBases]=useState(()=>sL("jc:dayBases",{}));
  const[showDB,setShowDB]=useState(false);const[showEndDay,setShowEndDay]=useState(false);const[equipeSel,setEquipeSel]=useState(todayLocal());const[rotasSel,setRotasSel]=useState(todayLocal());

  useEffect(()=>{sS("jc:visits",visits);},[visits]);useEffect(()=>{sS("jc:active",active);},[active]);useEffect(()=>{sS("jc:pdvLocs",plocs);},[plocs]);useEffect(()=>{sS("jc:dayBases",dayBases);syncDayBasesSave(dayBases);},[dayBases]);
  // Auto-clear cache once after v13.5 upgrade to remove old corrupted cached responses
  useEffect(()=>{if(!localStorage.getItem("jc:cleaned_v135")){(async()=>{try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}}catch{}localStorage.setItem("jc:cleaned_v135","1");if(token&&user)setTimeout(()=>doSync(),500);})();}},[]);
  // Auto-atualização v19: PWAs antigos seguram o service worker velho e mostram o app desatualizado.
  // Uma única vez por aparelho: limpa caches, desregistra o SW e recarrega — o servidor já serve a v19.
  useEffect(()=>{if(!localStorage.getItem("jc:cleaned_v19")){(async()=>{localStorage.setItem("jc:cleaned_v19","1");try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}location.reload();}catch{}})();}},[]);
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  const syncPush=async(data)=>{try{await fetch(`${API}?sync=${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:data})});}catch(e){console.warn("syncPush:",e);}};
  const syncClear=async()=>{try{await fetch(`${API}?sync=${user.id}`,{method:"DELETE"});}catch(e){console.warn("syncClear:",e);}};
  const syncVisitSave=async(visit)=>{try{const r=await fetch(`${API}?sync=visits_${user.id}`);const d=await r.json();const all=[visit,...(d.active||[])].slice(0,200);await fetch(`${API}?sync=visits_${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:all})});}catch(e){console.warn("syncVisitSave:",e);}};
  const syncVisitLoad=async()=>{try{const ids=[743088,743347];let remote=[];for(const uid of ids){const r=await fetch(`${API}?sync=visits_${uid}`,{cache:"no-store"});const buf=await r.arrayBuffer();const txt=new TextDecoder("utf-8",{fatal:false}).decode(buf);const d=JSON.parse(txt);if(d.active)remote.push(...d.active.map(v=>({...v,orgName:fixMojibake(v.orgName||""),city:fixMojibake(v.city||""),note:fixMojibake(v.note||"")})));}if(remote.length){setVisits(prev=>{const existing=new Set(prev.map(v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime)));const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+toLocalDate(r.checkinTime)));if(newOnes.length)return[...prev,...newOnes];return prev;});}}catch(e){console.warn("syncVisitLoad:",e);}};
  const syncPlocs=async(locs)=>{try{await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:locs})});}catch(e){console.warn("syncPlocs:",e);}};
  const syncDayBasesSave=async(bases)=>{if(!bases||!Object.keys(bases).length)return;try{await fetch(`${API}?sync=dayBases`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:bases})});}catch(e){console.warn("syncBases:",e);}};
  const syncDayBasesLoad=async()=>{try{const r=await fetch(`${API}?sync=dayBases`);const d=await r.json();if(d.active&&Object.keys(d.active).length){setDayBases(prev=>{const merged={...prev};for(const k in d.active){merged[k]={...(d.active[k]||{}),...(prev[k]||{})};}sS("jc:dayBases",merged);return merged;});}}catch(e){console.warn("syncBasesLoad:",e);}};
  const[teamActive,setTeamActive]=useState(null);
  // ─── Matriz RFV (D1, consolidada por CNPJ) — badges e ordenação da lista de visitas ───
  const[rfvMap,setRfvMap]=useState(null);
  const loadRfv=async()=>{try{const r=await fetch(`${DASH_CRM}/api/crm/rfv`,{headers:{"X-Session":token}});const d=await r.json();if(d&&d.ok&&d.clientes){const byOrg={};for(const k in d.clientes){const x=d.clientes[k];if(x.org_id)byOrg[x.org_id]=x;}setRfvMap({byCnpj:d.clientes,byOrg,ref:d.ref});}}catch(e){console.warn("rfv:",e);}};
  useEffect(()=>{if(token&&user)loadRfv();},[token,user]);
  const[syncStatus,setSyncStatus]=useState("");
  const syncPull=async()=>{try{
    const r=await fetch(`${API}?sync=${user.id}`);const d=await r.json();
    setActive(prev=>{if(d.active&&(!prev||prev.fromSync))return{...d.active,fromSync:true};if(!d.active&&prev?.fromSync)return null;return prev;});
    const otherId=user.id===743088?743347:743088;
    const r2=await fetch(`${API}?sync=${otherId}`);const d2=await r2.json();
    setTeamActive(d2.active||null);
    const r3=await fetch(`${API}?sync=plocs`);const d3=await r3.json();
    if(d3.active){const deleted=sL("jc:deletedGPS",[]);setPlocs(prev=>{const cloud={...d3.active};deleted.forEach(id=>{delete cloud[id];});const m={...cloud,...prev};sS("jc:pdvLocs",m);return m;});}
    setSyncStatus(`OK ${fT(new Date())} | eu:${d.active?"ativo":"--"}${user?.id===743088?` | equipe:${d2.active?d2.active.orgName:"--"}`:""}`);
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
      try{const since=new Date();since.setDate(since.getDate()-30);
        // v24: notificações lidas do D1 (fonte de verdade). Sem Agendor.
        const r=await fetch(`${DASH_CRM}/api/crm/tarefas?desde=${since.toISOString().slice(0,10)}&limit=1000`,{headers:{"X-Session":token},cache:"no-store"});
        if(!r.ok)return;const j=await r.json();const lista=(j&&j.tarefas)||[];
        const now=new Date();const soon=new Date(now.getTime()+15*60000);// 15 min ahead
        lista.filter(t=>!t.done&&t.userId===user.id&&t.due).forEach(t=>{
          const due=new Date(t.due);const key=t.id+"|"+t.due;
          if(due>=now&&due<=soon&&!notifiedRef.has(key)){notifiedRef.add(key);
            new Notification("📅 TeamCheck",{body:`${t.type||"Tarefa"}: ${t.org||"?"}\n${t.text?.slice(0,60)||""}`,icon:"/logo.png",tag:key,requireInteraction:true});}
          // Morning alert: tasks due today
          const h=now.getHours();if(h>=7&&h<8&&toLocalDate(due)===todayLocal()&&!notifiedRef.has("morning_"+key)){notifiedRef.add("morning_"+key);
            new Notification("🌅 TeamCheck",{body:`${t.type}: ${t.org}\n${fT(t.due)}`,icon:"/logo.png",tag:"morning_"+key});}
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

  const doSync=async(t)=>{setSyncing(true);setSyncMsg("Conectando...");try{
    const tk=t||token;
    await loadCatalogos(tk).catch(()=>{}); // catálogos (status/segmento/usuario/industria) do D1
    let all=[],exc=[],fonteD1=false;
    // Fonte única = D1 (dashboard.jordanmt.com). Chave de vinculo = CNPJ.
    try{
      setSyncMsg("Carregando clientes...");
      const r=await fetch(`${DASH_CRM}/api/crm/clientes?limit=5000`,{headers:{"X-Session":tk},cache:"no-store"});
      if(r.ok){const d=await r.json();
        if(d&&d.ok&&Array.isArray(d.clientes)){
          for(const o of d.clientes){(o.excluido?exc:all).push(o);}
          fonteD1=true;
        }
      }
    }catch(e){console.warn("clientes D1:",e);}
    if(!fonteD1){setSyncMsg("Erro ao carregar clientes. Tente novamente.");setSyncing(false);return;}
    setAllOrgs(all);setOrgs(all);setExclOrgs(exc);setSyncMsg(`${all.length} clientes (D1)`);
    await loadHistoryInner(tk);
  }catch(e){setSyncMsg("Erro");}setSyncing(false);};

  const loadHistoryInner=async(tk)=>{setSyncMsg("Carregando historico...");
    let raw=[];
    try{const desde=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
      for(const tp of ["Visita","VISITA"]){
        const r=await fetch(`${DASH_CRM}/api/crm/atividades?tipo=${tp}&desde=${desde}&limit=2000`,{headers:{"X-Session":tk||token},cache:"no-store"});
        if(r.ok){const d=await r.json();if(d&&d.ok&&Array.isArray(d.atividades))raw.push(...d.atividades);}
      }
    }catch(e){console.warn("historico D1:",e);}
    // visita REGISTRADA = tipo Visita sem prazo (com prazo = visita agendada)
    const apiVisits=raw.filter(t=>!t.due_em);
    const seen=new Set();const deduped=[];
    for(const t of apiVisits){const key=(t.org_id||"")+"|"+(t.user_id||"")+"|"+(t.criado_em||"").slice(0,10);if(seen.has(key))continue;seen.add(key);deduped.push(t);}
    const remote=deduped.map(t=>({orgId:t.org_id,orgName:t.org_nome||"?",city:"",checkinTime:t.criado_em,checkoutTime:t.criado_em,note:t.texto||"",taskType:"VISITA",synced:true,userName:t.user_nome||""}));
    // Merge: KV/local visits take priority (have real timestamps)
    const existing=new Set(visits.map(v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime)));
    const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+toLocalDate(r.checkinTime)));
    if(newOnes.length){setVisits(prev=>[...prev,...newOnes]);setSyncMsg(`+${newOnes.length} visitas`);}else setSyncMsg("Atualizado");};
  const loadHistory=async()=>{try{await loadHistoryInner();}catch(e){setSyncMsg("Erro: "+e.message);}};

  const ensureBase=()=>{const t=todayLocal();const k=user.id+"_"+t;if(!dayBases[k]||(!dayBases[k].start&&!dayBases[k].lat))setShowDB(true);};
  // (derivados de filtro de PDV movidos para PdvsTab)
  const usersList=useMemo(()=>{const m={};orgs.forEach(o=>{if(o.ownerId&&o.owner)m[o.ownerId]=o.owner;});return Object.entries(m).map(([id,n])=>({id:parseInt(id),n}));},[orgs]);

  // (lastVisits/visitsByOrg/fo/proximidade/toggleCat movidos para PdvsTab)
  // Grava atividade no CRM próprio (D1) em segundo plano — nunca bloqueia o fluxo.
  const crmLog=(payload)=>{try{fetch(`${DASH_CRM}/api/crm/atividades`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});}catch{}};
  const crmGps=(orgId,cnpj,g)=>{try{fetch(`${DASH_CRM}/api/crm/gps`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:orgId,cnpj:cnpj||null,lat:g.lat,lng:g.lng,precisao:g.acc})}).catch(()=>{});}catch{}};
  const quickAction=async(org,type)=>{const note=prompt(`Registrar ${type==="WHATSAPP"?"WhatsApp":"Ligacao"} com ${org.name}:`);if(!note?.trim())return;try{crmLog({org_id:org.id,cnpj:(org.cnpj||"").replace(/\D/g,"")||null,org_nome:org.nickname||org.name,tipo:type,texto:note});alert("Registrado!");}catch(e){alert("Erro: "+e.message);}};

  const checkin=async(org)=>{ensureBase();if(org.cat==="Online - B2B"&&!confirm(`${org.name} e Online/B2B.\nRegistrar visita?`))return;if(org.cat==="Inativo"&&!confirm(`${org.name} esta Inativo.\nContinuar?`))return;if(org.cat==="Excluido"&&!confirm(`${org.name} esta Excluido.\nContinuar?`))return;setLdId(org.id);setGeoErr("");try{const g=await gps();if(plocs[org.id]){const d=hav(plocs[org.id].lat,plocs[org.id].lng,g.lat,g.lng)*1000;if(d>500){setDivTarget({org,dist:Math.round(d),geo:g});setLdId(null);return;}}else{const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);crmGps(org.id,(org.cnpj||"").replace(/\D/g,""),g);}const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}catch{setGeoErr("GPS indisponivel.");}setLdId(null);};
  const handleDivAction=(action,type)=>{if(!divTarget)return;const{org,geo}=divTarget;if(action==="checkin"){const v={orgId:org.id,orgName:org.name,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}else if(action==="remote"&&type)setCoTarget({...org,remoteType:type});setDivTarget(null);};
  const checkout=async(note,type="VISITA",next=null,sale=null)=>{if(!active||ldId)return;setLdId(active.orgId);let g=null;try{g=await gps();}catch{}
    // Detect divergent checkout: GPS far from registered client location
    let divergent=false,divDist=0;
    if(g){
      const ref=plocs[active.orgId]||{lat:active.lat,lng:active.lng};
      if(ref&&ref.lat&&ref.lng){divDist=Math.round(hav(ref.lat,ref.lng,g.lat,g.lng)*1000);if(divDist>500)divergent=true;}
    }
    const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type,sale,divergent,divDist};
    // Só grava (D1 + KV) se NÃO for divergente
    if(!divergent){
      done.synced=true;
      // v24: checkout gravado só no D1 (fonte de verdade). Sem Agendor.
      const oRef=(allOrgs||[]).find(o=>o.id===active.orgId);const cnpjRef=oRef?(oRef.cnpj||"").replace(/\D/g,""):null;
      crmLog({org_id:active.orgId,cnpj:cnpjRef,org_nome:done.orgName,tipo:type,texto:note+(sale?.brand&&sale?.value?`\n[Venda ${sale.brand} R$ ${sale.value}]`:""),lat:g?.lat,lng:g?.lng,origem:"checkout"});
      // Próximo passo → tarefa com prazo no D1 (aparece na Agenda). Tipo validado p/ CRM_TIPOS do Worker.
      if(next?.nextDate&&next?.nextDesc){const nt=(next.nextType||"VISITA").toUpperCase();const tipoOk=["VISITA","LIGACAO","EMAIL","REUNIAO","WHATSAPP","PROPOSTA","NOTA"].includes(nt)?nt:"VISITA";crmLog({org_id:active.orgId,cnpj:cnpjRef,org_nome:done.orgName,tipo:tipoOk,texto:next.nextDesc,origem:"tarefa",due_em:`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`});}
      syncVisitSave(done);
    }else{done.synced=false;}
    // Save locally (even divergent, for visual flag)
    setVisits(p=>[done,...p]);setActive(null);syncClear();setCoTarget(null);setLdId(null);
    // Alert AFTER UI is cleared (non-blocking flow)
    if(divergent)setTimeout(()=>alert(`⚠️ CHECKOUT DESLOCADO\nVocê está a ${divDist}m do local cadastrado.\n\nEsta visita NÃO foi registrada e NÃO contará no relatório (visita e km).\n\nFica marcada com ⚠️ apenas para conferência.`),100);
    else if(next?.nextDate&&next?.nextDesc)setTimeout(()=>alert("Proximo passo agendado!"),100);
  };

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sS("jc:session",t);sS("jc:user",u);}}/>;

  // ─── Navegação: grupos iguais ao Dashboard (sidebar) + lista plana (bottom nav mobile) ───
  const isAdmin=user?.id===743088;
  const NAVG=[
    {grp:"CAMPO",itens:[{id:"pdvs",I:Store,l:"PDVs"},{id:"rotas",I:MapIcon,l:"Rotas"},{id:"agenda",I:Calendar,l:"Agenda"}]},
    {grp:"CRM",itens:[{id:"crm_inicio",I:BookUser,l:"Início"},{id:"crm_empresas",I:Building2,l:"Empresas"},{id:"crm_pessoas",I:Contact,l:"Pessoas"}]},
    {grp:"GESTÃO",itens:[...(isAdmin?[{id:"equipe",I:Users,l:"Equipe",admin:true}]:[]),{id:"relatorio",I:BarChart3,l:"Relatório"}]},
    {grp:"SISTEMA",itens:[{id:"config",I:Settings,l:"Configurações"}]},
  ];
  const TITULOS={pdvs:["PDVS","Pontos de venda"],crm_inicio:["CRM","Feed de atividades"],crm_empresas:["EMPRESAS","Carteira de clientes"],crm_pessoas:["PESSOAS","Contatos"],rotas:["ROTAS","Roteiro do dia"],relatorio:["RELATÓRIO","Período, jornada & km"],equipe:["EQUIPE","Produtividade"],agenda:["AGENDA","Tarefas & follow-ups"],config:["CONFIGURAÇÕES","Sistema"]};
  // Bottom nav (mobile): CRM entra como atalho único (→ Início); Empresas/Pessoas ficam na gaveta lateral
  const baseTabs=[{id:"pdvs",I:Store,l:"PDVs"},{id:"crm_inicio",I:BookUser,l:"CRM"},{id:"rotas",I:MapIcon,l:"Rotas"},{id:"relatorio",I:BarChart3,l:"Relatório"},{id:"agenda",I:Calendar,l:"Agenda"},{id:"config",I:Settings,l:"Config"}];
  const tabs=isAdmin?[...baseTabs.slice(0,3),{id:"equipe",I:Users,l:"Equipe"},...baseTabs.slice(3)]:baseTabs;
  const navAtivo=(id)=>id.startsWith("crm")?tab.startsWith("crm"):tab===id;
  const irPara=(id)=>{setTab(id);if(mob)setNavOpen(false);};
  const sair=()=>{setToken("");setUser(null);setOrgs([]);sS("jc:session","");sS("jc:user",null);};
  const dataHoje=fD(new Date());

  return(<div style={{display:"flex",height:"100vh",overflow:"hidden",background:S.chrome,color:S.txt,fontFamily:"'Roboto',sans-serif"}}>
    {/* SIDEBAR — mesma estrutura do Dashboard (grupos + itens); no mobile vira gaveta */}
    {mob&&navOpen&&<div onClick={()=>setNavOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:49}}/>}
    <div style={{width:navOpen?230:0,minWidth:navOpen?230:0,transition:"all .25s",overflow:"hidden",background:S.chrome,borderRight:`1px solid ${S.chromeBdr}`,position:mob?"fixed":"relative",top:0,left:0,height:"100vh",zIndex:mob?50:1,display:"flex",flexDirection:"column",boxShadow:mob&&navOpen?"0 0 40px rgba(0,0,0,.5)":"none"}}>
      <div style={{height:60,display:"flex",alignItems:"center",gap:11,padding:"0 18px",flexShrink:0}}>
        <div style={{width:34,height:34,borderRadius:"50%",border:`1.5px solid ${S.chromeBdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,letterSpacing:".04em",color:S.chromeFg,flexShrink:0}}>JM</div>
        <div style={{lineHeight:1.15,whiteSpace:"nowrap"}}>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:".06em",color:S.chromeFg}}>TEAMCHECK</div>
          <div style={{fontSize:9.5,color:S.navGrp,letterSpacing:".02em"}}>Força de Vendas</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 8px 18px"}}>
        {NAVG.map((g,gi)=>(
          <div key={gi} style={{marginBottom:10}}>
            <div style={{fontSize:9,color:S.navGrp,textTransform:"uppercase",letterSpacing:1.5,padding:"10px 10px 5px",fontWeight:600,whiteSpace:"nowrap"}}>{g.grp}</div>
            {g.itens.map(it=>{const act=tab===it.id;return(
              <div key={it.id} className="navit" onClick={()=>irPara(it.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,background:act?S.navActive:"transparent",color:act?S.navActiveFg:S.nav,fontSize:12,fontWeight:act?600:400,whiteSpace:"nowrap"}}>
                <it.I size={16} strokeWidth={act?2.2:1.7} style={{flexShrink:0}}/>
                <span style={{flex:1}}>{it.l}</span>
                {it.admin&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:S.gold+"33",color:S.gold}}>admin</span>}
              </div>);})}
          </div>))}
      </div>
      <div style={{padding:"12px 18px 16px",borderTop:`1px solid ${S.chromeBdr}`,whiteSpace:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:S.nav}}><span style={{width:7,height:7,borderRadius:"50%",background:syncStatus.startsWith?.("Erro")?S.dng:"#3FBFD4",boxShadow:"0 0 0 3px rgba(63,191,212,.22)",flexShrink:0}}/>{syncing?syncMsg:(syncStatus?syncStatus.split("|")[0].trim():"Sync —")}</div>
        <div style={{fontSize:10,color:S.navGrp,marginTop:4}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</div>
      </div>
    </div>

    {/* COLUNA PRINCIPAL */}
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",height:"100vh",background:S.chrome}}>
      {/* HEADER — gradiente chrome, idêntico ao Dashboard */}
      <div style={{height:60,flexShrink:0,background:`linear-gradient(135deg,${S.chromeTop},${S.chrome})`,borderBottom:`1px solid ${S.chromeBdr}`,display:"flex",alignItems:"center",gap:mob?8:14,padding:mob?"0 12px":"0 24px",zIndex:10}}>
        <button onClick={()=>setNavOpen(o=>!o)} style={{background:"none",border:`1px solid ${S.chromeBdr}`,color:S.chromeFg,borderRadius:6,width:32,height:32,minWidth:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>☰</button>
        {!mob&&<JordanLogo color={S.chromeFg} height={34}/>}
        <div style={{flex:1,minWidth:0,display:"flex",alignItems:"baseline",gap:8,overflow:"hidden"}}>
          <span style={{fontSize:mob?15:17,fontWeight:700,letterSpacing:".12em",color:S.chromeFg,whiteSpace:"nowrap"}}>{(TITULOS[tab]||["TEAMCHECK"])[0]}</span>
          {!mob&&<span style={{fontSize:11,color:S.navGrp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(TITULOS[tab]||[])[1]||""}</span>}
        </div>
        <button onClick={()=>setSearchAdd(true)} title="Adicionar / buscar cliente" style={{width:34,height:34,minWidth:34,borderRadius:9,border:"none",background:S.acc,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 2px 10px ${S.acc}44`,padding:0}}><Plus size={18} strokeWidth={2.4} color="#fff"/></button>
        <button onClick={async()=>{await doSync();await loadHistory();syncVisitLoad();}} disabled={syncing} title="Sincronizar" style={{width:34,height:34,minWidth:34,borderRadius:9,border:`1px solid ${S.chromeBdr}`,background:"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><RefreshCw size={16} strokeWidth={2} color="var(--chrome-fg)" className={syncing?"spin":""}/></button>
        <button onClick={trocarTema} title={tema==="dark"?"Mudar para tema claro":"Mudar para tema escuro"} style={{width:34,height:34,minWidth:34,borderRadius:9,border:`1px solid ${S.chromeBdr}`,background:"none",color:S.chromeFg,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{tema==="dark"?"☀️":"🌙"}</button>
        {!mob&&<div style={{textAlign:"right",lineHeight:1.25}}>
          <div style={{fontSize:13,fontWeight:600,color:S.chromeFg}}>{user?.name}</div>
          <div style={{fontSize:11,color:S.navGrp}}>{dataHoje}</div>
        </div>}
        {!mob&&<button onClick={sair} style={{padding:"7px 15px",borderRadius:8,border:`1px solid ${S.chromeBdr}`,background:"transparent",color:S.chromeFg,fontSize:12.5,fontWeight:500,cursor:"pointer"}}>Sair</button>}
      </div>

      {/* CONTEÚDO — recorte com sombra interna + efeitos Cyber Tech Premium (.jc-main) */}
      <div className="jc-main" style={{flex:1,overflowY:"auto",borderRadius:"22px 0 0 0",boxShadow:`inset 0 18px 28px -22px ${S.seam},inset 18px 0 28px -22px ${S.seam}`,padding:mob?"16px 14px 96px":"22px 26px 42px"}}>
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs} onClick={()=>{setTab("pdvs");setFocusReq({id:active.orgId,name:active.orgName,t:Date.now()});}}/>}
      {teamActive&&tab!=="config"&&isAdmin&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.gold,animation:"pulse 2s infinite"}}/><p style={{fontSize:13,color:S.gold,margin:0}}>Alisson em atendimento: <b>{teamActive.orgName}</b></p></div><p style={{fontSize:11,color:S.ts,margin:"3px 0 0 16px"}}>Desde {fT(teamActive.checkinTime)} — {hrsMin(mins(teamActive.checkinTime,new Date()))}</p></div>}

      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:0}}>⏰ Bom dia! Atividades ainda nao iniciadas.</p></div>}
      {prevDay&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>⚠️ Visita aberta de {fD(prevDay.checkinTime)} — {prevDay.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(prevDay.checkinTime);c.setHours(18);setVisits(p=>[{...prevDay,checkoutTime:c.toISOString(),note:"Auto 18h",taskType:"VISITA",synced:false},...p]);setActive(null);setPrevDay(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none",color:"#fff"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:prevDay.orgId,name:prevDay.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {longVisit&&!prevDay&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:"0 0 6px"}}>⏰ Visita ativa ha mais de 2h — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}

      {canCloseRoute&&tab!=="config"&&<div style={{background:S.acc+"18",border:`1px solid ${S.acc}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.acc,margin:"0 0 8px"}}>✅ {todayVisits.length} visita(s) hoje — Fechar roteiro?</p><button onClick={()=>setShowEndDay(true)} style={{width:"100%",padding:10,fontSize:13,background:S.acc,border:"none",fontWeight:600,borderRadius:8,color:"#fff"}}>🏨 Fechar Roteiro do Dia</button></div>}

      <PdvsTab visible={tab==="pdvs"} orgs={orgs} allOrgs={allOrgs} setOrgs={setOrgs} visits={visits} plocs={plocs} active={active} ldId={ldId} geoErr={geoErr} user={user} token={token} syncing={syncing} syncMsg={syncMsg} onSync={doSync} onCheckin={checkin} onCheckout={o2=>setCoTarget(o2)} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} onQuick={quickAction} focusReq={focusReq} rfv={rfvMap} excl={exclOrgs}/>
      <CrmTab visible={tab.startsWith("crm")} secao={tab.startsWith("crm")?tab.replace("crm_",""):"inicio"} bump={crmBump} token={token} user={user} allOrgs={allOrgs} visits={visits} plocs={plocs} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} rfv={rfvMap} onNovaEmpresa={()=>setSearchAdd(true)} excl={exclOrgs}/>
      {tab==="rotas"&&<RotasTab sel={rotasSel} setSel={setRotasSel} visits={visits} dayBases={dayBases} user={user} plocs={plocs}/>}
      {tab==="relatorio"&&<Suspense fallback={<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando relatório…</p>}><RelatorioTab visits={visits} dayBases={dayBases} user={user} token={token} plocs={plocs} onEditBase={(d,start,end,uid)=>{const key=uid?uid+"_"+d:d;setDayBases(p=>{const n={...p,[key]:{...p[key],start,end}};sS("jc:dayBases",n);return n;});}}/></Suspense>}
      {tab==="equipe"&&isAdmin&&<EquipeTab sel={equipeSel} setSel={setEquipeSel} token={token} plocs={plocs} orgs={orgs} dayBases={dayBases} user={user}/>}
      <AgendaTab visible={tab==="agenda"} token={token} user={user} allOrgs={allOrgs} onCrmChange={()=>setCrmBump(b=>b+1)}/>

      {tab==="config"&&<ConfigTab user={user} orgs={orgs} allOrgs={allOrgs} token={token} doSync={doSync} visits={visits} plocs={plocs} dayBases={dayBases} today={today} syncStatus={syncStatus} syncing={syncing} syncMsg={syncMsg}
        onSync={doSync} onLoadHistory={loadHistory} onSyncPull={()=>{syncPull();setSyncStatus("Forçando sync...");}}
        onShareGPS={async()=>{if(!Object.keys(plocs).length){alert("Nenhum GPS salvo");return;}setSyncStatus("Enviando GPS...");try{const r=await fetch(`${API}?sync=plocs`);const d=await r.json();const merged={...(d.active||{}),...plocs};await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:merged})});setSyncStatus(`${Object.keys(merged).length} GPS enviados!`);}catch(e){setSyncStatus("Erro: "+e.message);}}}
        onShowDB={()=>setShowDB(true)} onShowEnd={()=>setShowEndDay(true)}
        onDeleteGPS={(orgId)=>{setPlocs(p=>{const n={...p};delete n[orgId];sS("jc:pdvLocs",n);
          const del=sL("jc:deletedGPS",[]);if(!del.includes(orgId)){del.push(orgId);sS("jc:deletedGPS",del);}
          fetch(`${API}?sync=plocs`).then(r=>r.json()).then(d=>{const cloud={...d.active||{}};delete cloud[orgId];fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:cloud})});}).catch(()=>{});
          return n;});}}
        onSaveGPS={(orgId,lat,lng)=>{setPlocs(p=>{const n={...p,[orgId]:{lat,lng}};sS("jc:pdvLocs",n);
          const del=sL("jc:deletedGPS",[]).filter(id=>id!==orgId);sS("jc:deletedGPS",del);
          syncPlocs(n);return n;});}}
        onClearVisits={(target)=>setVisits(prev=>prev.filter(v=>!v.checkinTime?.startsWith(target)))}
        onClearAllGPS={()=>{setPlocs({});sS("jc:pdvLocs",{});}}
        onLogout={sair}
      />}
      </div>
    </div>

    {/* Voltar ao topo */}
    <button onClick={()=>{const el=document.querySelector(".jc-main");if(el)el.scrollTo({top:0,behavior:"smooth"});}} style={{position:"fixed",bottom:mob?84:24,right:16,width:44,height:44,borderRadius:50,background:S.pri,border:"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px ${S.pri}66`,zIndex:30,cursor:"pointer",padding:0}}><ChevronUp size={22} strokeWidth={2.5} color="#fff"/></button>

    {/* BOTTOM NAV — só no celular (agilidade de campo); no desktop a navegação é a sidebar */}
    {mob&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(180deg, ${S.chrome}, ${S.chromeTop})`,borderTop:`1px solid ${S.chromeBdr}`,display:"flex",justifyContent:"center",zIndex:40,boxShadow:`0 -6px 18px ${S.contentShadow}`}}><div style={{display:"flex",width:"100%",padding:"5px 4px"}}>{tabs.map(t=>{const act=navAtivo(t.id);return <button key={t.id} onClick={()=>{setTab(t.id);}} style={{flex:1,border:"none",borderRadius:10,margin:"0 2px",background:act?S.navActive:"transparent",padding:"6px 2px 5px",fontSize:10,fontWeight:act?700:400,color:act?S.navActiveFg:S.navFg,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><t.I size={22} strokeWidth={act?2.2:1.6}/>{t.l}</button>;})}</div></div>}

    {coTarget&&<NoteModal org={coTarget} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {showDB&&<JourneyModal user={user} onSave={j=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const n={...p,[k]:{start:j.start,end:j.end}};sS("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
    {showEndDay&&<DayEndModal user={user} onSave={b=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const cur=p[k]||{};const n={...p,[k]:{...cur,end:b}};sS("jc:dayBases",n);return n;});setShowEndDay(false);}} onCancel={()=>setShowEndDay(false)}/>}
    {searchAdd&&<SearchOrAddModal token={token} allOrgs={allOrgs}
      onFound={(org)=>{setTab("pdvs");setFocusReq({id:org.id||null,name:org.name||org.nickname,t:Date.now()});}}
      onNewClient={(cnpj,rfData)=>{sS("jc:prefill",{cnpj,rfData});setNewClient(true);}}
      onCancel={()=>setSearchAdd(false)}/>}
    {newClient&&<NewClientModal token={token} allOrgs={allOrgs} onSave={org=>{setOrgs(p=>[org,...p]);setAllOrgs(p=>[org,...p]);setNewClient(false);}} onCancel={()=>setNewClient(false)}/>}
    {personTarget&&<PeopleModal org={personTarget} token={token} onClose={()=>setPersonTarget(null)}/>}
    {editTarget&&<EditModal org={editTarget} token={token} users={usersList} allOrgs={allOrgs} onSave={u=>{setOrgs(p=>p.map(o=>o.id===u.id?u:o));setAllOrgs(p=>p.map(o=>o.id===u.id?u:o));setEditTarget(null);}} onClose={()=>setEditTarget(null)}/>}
    {divTarget&&<DivergentModal org={divTarget.org} dist={divTarget.dist} onAction={handleDivAction} onCancel={()=>setDivTarget(null)}/>}
  </div>);}
