// TeamCheck — App (orquestração principal)
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Store, Map as MapIcon, MapPin, BarChart3, Calendar, Users, Settings, Plus, RefreshCw, ChevronUp, BookUser, Building2, Contact, Menu, Sun, Moon, ChevronRight } from "lucide-react";
import { API, USERS, PEND_PREFIXO, pendenciasDe, fD1, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hav, sL, sS, gps, fixMojibake, isRealVisit, loadCatalogos } from "./lib";
import { Login, Banner, NoteModal, PendenciasAlerta, NewClientModal, PeopleModal, EditModal, JourneyModal, DayEndModal, DivergentModal, SearchOrAddModal, JordanLogo } from "./components";
import { RotasTab } from "./tabs/RotasTab";
const RelatorioTab=lazy(()=>import("./tabs/RelatorioTab").then(m=>({default:m.RelatorioTab})));// recharts só carrega ao abrir o Relatório
import { EquipeTab } from "./tabs/EquipeTab";
import { AgendaTab } from "./tabs/AgendaTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { PdvsTab } from "./tabs/PdvsTab";
const MapaTab=lazy(()=>import("./tabs/MapaTab").then(m=>({default:m.MapaTab})));// leaflet só carrega ao abrir o Mapa
import { CrmTab } from "./tabs/CrmTab";

// ─── CRM próprio (D1 via Worker do Dashboard) — registro em segundo plano ───
const DASH_CRM = "https://dashboard.jordanmt.com";

export default function App(){
  // Tema (espelho do Dashboard): escuro por padrão; troca na aba Config, persistida
  useEffect(()=>{document.documentElement.dataset.theme=sL("jc:theme","dark");let m=document.querySelector("meta[name=theme-color]");if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m);}m.content="#0578A6";},[]);
  const[instEvt,setInstEvt]=useState(null);const[mapaLigado,setMapaLigado]=useState(false);
  useEffect(()=>{const h=(e)=>{e.preventDefault();setInstEvt(e);};window.addEventListener("beforeinstallprompt",h);return()=>window.removeEventListener("beforeinstallprompt",h);},[]);
  // v43: auto-ajuste ao equipamento — telas estreitas ganham escala proporcional (some o "explodido")
  useEffect(()=>{const fit=()=>{const w=window.innerWidth;const z=w<420?Math.max(0.8,Math.min(1,w/415)):1;document.body.style.zoom=z===1?"":String(z);};fit();window.addEventListener("resize",fit);return()=>{window.removeEventListener("resize",fit);document.body.style.zoom="";};},[]);
  const setSSOCookie=(t)=>{try{const base="ses="+encodeURIComponent(t)+"; path=/; max-age=2592000; samesite=lax";document.cookie=base+"; domain=.jordanmt.com; secure";document.cookie=base;}catch{}};
  const clearSSOCookie=()=>{try{document.cookie="ses=; path=/; max-age=0; domain=.jordanmt.com";document.cookie="ses=; path=/; max-age=0";}catch{}};
  const readCookie=(n)=>{try{const m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]+)"));return m?decodeURIComponent(m[1]):"";}catch{return "";}};
  const[token,setToken]=useState(()=>sL("jc:session",""));const[user,setUser]=useState(()=>sL("jc:user",null));const[orgs,setOrgs]=useState([]);const[allOrgs,setAllOrgs]=useState([]);const[exclOrgs,setExclOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>{const raw=sL("jc:visits",[]);const cutoff=new Date();cutoff.setDate(cutoff.getDate()-90);const cut=cutoff.toISOString();let purged=raw.filter(v=>!v.checkinTime||v.checkinTime>=cut);if(purged.length<raw.length)console.log(`Purged ${raw.length-purged.length} visits >90d`);
    // visitas reconstruídas em versões antigas ficaram com UTC cru ("YYYY-MM-DD HH:MM:SS") — corrigir formato
    purged=purged.map(v=>(v.checkinTime&&v.checkinTime.includes(" ")&&!v.checkinTime.includes("T"))?{...v,d1:true,checkinTime:v.checkinTime.replace(" ","T")+"Z",checkoutTime:v.checkoutTime&&v.checkoutTime.includes(" ")?v.checkoutTime.replace(" ","T")+"Z":v.checkoutTime}:v);
    return purged;});const[active,setActive]=useState(()=>sL("jc:active",null));
  const[tab,setTab]=useState(()=>{try{const sp=new URL(window.location.href).searchParams;if(sp.get("cliente"))return"crm_empresas";if(sp.get("pessoa"))return"crm_pessoas";}catch{}return"pdvs";});const[focusReq,setFocusReq]=useState(null);
  const[pessoaQ0]=useState(()=>{try{return new URL(window.location.href).searchParams.get("pessoa")||"";}catch{return"";}});
  const[crmBump,setCrmBump]=useState(0);// sinaliza mudanças no CRM (Agenda→feed Início)
  const[crmFocus,setCrmFocus]=useState(null);// abre a ficha de um cliente na aba Empresas
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
  // SSO: sem sessão local mas com cookie "ses" (ex.: logou no Dashboard) → entra sozinho
  useEffect(()=>{if(token&&user)return;const c=readCookie("ses");if(!c)return;(async()=>{try{const r=await fetch(`${API}/me`,{headers:{"X-Session":c}});const d=await r.json().catch(()=>({}));if(r.ok&&d&&d.ok){setToken(c);const u={id:d.userId,name:d.name,role:d.role,email:d.email};setUser(u);sS("jc:session",c);sS("jc:user",u);}}catch{}})();},[]);
  // Auto-clear cache once after v13.5 upgrade to remove old corrupted cached responses
  useEffect(()=>{if(!localStorage.getItem("jc:cleaned_v135")){(async()=>{try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}}catch{}localStorage.setItem("jc:cleaned_v135","1");if(token&&user)setTimeout(()=>doSync(),500);})();}},[]);
  // Auto-atualização v19: PWAs antigos seguram o service worker velho e mostram o app desatualizado.
  // Uma única vez por aparelho: limpa caches, desregistra o SW e recarrega — o servidor já serve a v19.
  useEffect(()=>{if(!localStorage.getItem("jc:cleaned_v19")){(async()=>{localStorage.setItem("jc:cleaned_v19","1");try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}location.reload();}catch{}})();}},[]);
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  const syncPush=async(data)=>{try{await fetch(`${API}?sync=${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:data})});}catch(e){console.warn("syncPush:",e);}};
  const syncClear=async()=>{try{await fetch(`${API}?sync=${user.id}`,{method:"DELETE"});}catch(e){console.warn("syncClear:",e);}};
  const syncVisitSave=async(visit)=>{try{const r=await fetch(`${API}?sync=visits_${user.id}`);const d=await r.json();const all=[visit,...(d.active||[])].slice(0,200);await fetch(`${API}?sync=visits_${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:all})});}catch(e){console.warn("syncVisitSave:",e);}};
  const syncVisitLoad=async()=>{try{const ids=[743088,743347];let remote=[];for(const uid of ids){const r=await fetch(`${API}?sync=visits_${uid}`,{cache:"no-store"});const buf=await r.arrayBuffer();const txt=new TextDecoder("utf-8",{fatal:false}).decode(buf);const d=JSON.parse(txt);if(d.active)remote.push(...d.active.map(v=>({...v,orgName:fixMojibake(v.orgName||""),city:fixMojibake(v.city||""),note:fixMojibake(v.note||"")})));}if(remote.length){setVisits(prev=>{const chave=v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime);
      const remoteKeys=new Set(remote.map(chave));
      // visita REAL (KV, com horários de verdade) expulsa a reconstruída do D1 de mesma chave
      const base=prev.filter(v=>!(v.d1&&remoteKeys.has(chave(v))));
      const existing=new Set(base.map(chave));
      const newOnes=remote.filter(r=>!existing.has(chave(r)));
      if(newOnes.length||base.length!==prev.length)return[...base,...newOnes];return prev;});}}catch(e){console.warn("syncVisitLoad:",e);}};
  const syncPlocs=async(locs)=>{try{await fetch(`${API}?sync=plocs`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:locs})});}catch(e){console.warn("syncPlocs:",e);}};
  const syncDayBasesSave=async(bases)=>{if(!bases||!Object.keys(bases).length)return;try{await fetch(`${API}?sync=dayBases`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:bases})});}catch(e){console.warn("syncBases:",e);}};
  const syncDayBasesLoad=async()=>{try{const r=await fetch(`${API}?sync=dayBases`);const d=await r.json();if(d.active&&Object.keys(d.active).length){setDayBases(prev=>{const merged={...prev};for(const k in d.active){merged[k]={...(d.active[k]||{}),...(prev[k]||{})};}sS("jc:dayBases",merged);return merged;});}}catch(e){console.warn("syncBasesLoad:",e);}};
  const[teamActive,setTeamActive]=useState(null);
  // v73: aba aberta há muito tempo roda versão antiga — detecta deploy novo e oferece atualizar
  const[novaVersao,setNovaVersao]=useState(false);
  useEffect(()=>{const atual=(document.querySelector('script[src*="/assets/index-"]')?.getAttribute("src")||"").replace(/^.*\/assets\//,"");if(!atual)return;
    const checa=async()=>{try{const h=await(await fetch("/?v="+Date.now(),{cache:"no-store"})).text();const m=h.match(/\/assets\/(index-[^"']+\.js)/);if(m&&m[1]!==atual)setNovaVersao(true);}catch(e){}};
    const vis=()=>{if(document.visibilityState==="visible")checa();};
    checa();const iv=setInterval(checa,5*60*1000);document.addEventListener("visibilitychange",vis);window.addEventListener("focus",checa);
    return()=>{clearInterval(iv);document.removeEventListener("visibilitychange",vis);window.removeEventListener("focus",checa);};},[]);
  const atualizarApp=async()=>{try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.update().catch(()=>{})));}if("caches" in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));}}catch(e){}location.reload();};
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
    // v44: GPS durável do D1 (crm_gps) entra no merge — sobrevive a qualquer perda do KV
    let d1gps={};try{const rg=await fetch(`${DASH_CRM}/api/crm/gps`,{headers:{"X-Session":token}});const dg=await rg.json();(dg.gps||[]).forEach(g=>{if(g.org_id)d1gps[g.org_id]={lat:g.lat,lng:g.lng,...(g.geo?{geo:1}:{})};});}catch(e){}
    if(d3.active||Object.keys(d1gps).length){const deleted=sL("jc:deletedGPS",[]);setPlocs(prev=>{const cloud={...d1gps,...(d3.active||{})};deleted.forEach(id=>{delete cloud[id];});const m={...cloud,...prev};sS("jc:pdvLocs",m);return m;});}
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
    // visita REGISTRADA = tipo Visita sem prazo (com prazo = visita agendada).
    // v74: tarefas nunca são visitas — a pendência "📌 Próxima visita" é VISITA sem prazo e entrava como visita.
    const apiVisits=raw.filter(t=>!t.due_em&&t.origem!=="tarefa");
    const seen=new Set();const deduped=[];
    for(const t of apiVisits){const key=(t.org_id||"")+"|"+(t.user_id||"")+"|"+toLocalDate((t.criado_em||"").replace(" ","T")+"Z");if(seen.has(key))continue;seen.add(key);deduped.push(t);}
    // criado_em do D1 é UTC "YYYY-MM-DD HH:MM:SS" SEM fuso — anexar Z para o fT/toLocalDate converterem certo (fix 13:11→09:11)
    const isoZ=(x)=>{const v=String(x||"");return v.includes("T")?v:(v.replace(" ","T")+"Z");};
    const remote=deduped.map(t=>({orgId:t.org_id,orgName:t.org_nome||"?",city:"",checkinTime:isoZ(t.criado_em),checkoutTime:isoZ(t.criado_em),note:t.texto||"",taskType:"VISITA",synced:true,d1:true,userName:t.user_nome||""}));
    // Merge: KV/local visits take priority (have real timestamps)
    const existing=new Set(visits.map(v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime)));
    const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+toLocalDate(r.checkinTime)));
    if(newOnes.length){setVisits(prev=>[...prev,...newOnes]);setSyncMsg(`+${newOnes.length} visitas`);}else setSyncMsg("Atualizado");};
  const loadHistory=async()=>{try{await loadHistoryInner();}catch(e){setSyncMsg("Erro: "+e.message);}};

  const ensureBase=()=>{const t=todayLocal();const k=user.id+"_"+t;if(!dayBases[k]||(!dayBases[k].start&&!dayBases[k].lat))setShowDB(true);};
  // (derivados de filtro de PDV movidos para PdvsTab)
  // Responsáveis = cadastro de Usuários (config_catalogo). Antes vinha de o.ownerId dos clientes,
  // que o Worker devolve sempre nulo — a lista nascia vazia e o dropdown ficava sem nomes.
  const usersList=useMemo(()=>{
    const m={};
    (USERS||[]).forEach(u=>{if(u.id&&u.n)m[u.id]=u.n;});
    orgs.forEach(o=>{if(o.ownerId&&o.owner)m[o.ownerId]=o.owner;}); // reserva
    return Object.entries(m).map(([id,n])=>({id:parseInt(id),n})).sort((a,b)=>a.n.localeCompare(b.n));
  },[orgs,syncing]);

  // (lastVisits/visitsByOrg/fo/proximidade/toggleCat movidos para PdvsTab)
  // Grava atividade no CRM próprio (D1) em segundo plano — nunca bloqueia o fluxo.
  // ─── v69: PENDÊNCIAS do cliente na visita ativa ───
  const[pendAtivas,setPendAtivas]=useState([]);const[pendAlerta,setPendAlerta]=useState(null);const pendAvisadas=useRef(new Set());
  useEffect(()=>{
    if(!active?.orgId||!token){setPendAtivas([]);return;}
    let vivo=true;const o=(allOrgs||[]).find(x=>x.id===active.orgId);
    pendenciasDe(token,active.orgId,o?.cnpj).then(l=>{if(!vivo)return;setPendAtivas(l);
      // alerta só uma vez por visita, e só se o check-in acabou de acontecer (não a cada recarga)
      const k=active.checkinTime;const recente=Date.now()-new Date(k).getTime()<10*60*1000;
      if(l.length&&recente&&!pendAvisadas.current.has(k)){pendAvisadas.current.add(k);setPendAlerta({org:active.orgName,itens:l});}});
    return()=>{vivo=false;};
  },[active?.orgId,active?.checkinTime,token]);// eslint-disable-line
  const crmLog=(payload)=>{try{fetch(`${DASH_CRM}/api/crm/atividades`,{method:"POST",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});}catch{}};
  const crmGps=(orgId,cnpj,g)=>{try{fetch(`${DASH_CRM}/api/crm/gps`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({org_id:orgId,cnpj:cnpj||null,lat:g.lat,lng:g.lng,precisao:g.acc})}).catch(()=>{});}catch{}};
  // v74: atendimento a distância (sem check-in) — mesma janela do check-out, conferindo as pendências do cliente.
  // Grava como atividade do app (origem "teamcheck") com o tipo do contato; a Equipe conta como produtividade de escritório.
  const[remTarget,setRemTarget]=useState(null);
  const quickAction=(org)=>{if(!org)return;const cn=(org.cnpj||"").replace(/\D/g,"");setRemTarget({org,pend:[],lo:true});
    pendenciasDe(token,org.id,cn).then(pl=>setRemTarget(t=>t&&t.org.id===org.id?{...t,pend:pl,lo:false}:t)).catch(()=>setRemTarget(t=>t?{...t,lo:false}:t));};
  const remoteSave=(note,type,next,sale,extra)=>{const t=remTarget;if(!t)return;const o=t.org;const cn=(o.cnpj||"").replace(/\D/g,"")||null;const nome=o.nickname||o.name;
    const resolv=(extra?.resolvidas)||[],novas=(extra?.novas)||[];const quem={user_id:user?.id||null,user_nome:user?.name||null};
    crmLog({org_id:o.id,cnpj:cn,org_nome:nome,tipo:type,texto:note+(sale?.brand&&sale?.value?`\n[Venda ${sale.brand} R$ ${sale.value}]`:"")+resolv.map(x=>`\n✓ Pendência resolvida: ${x.txt}`).join(""),origem:"teamcheck",...quem});
    novas.forEach(tx=>crmLog({org_id:o.id,cnpj:cn,org_nome:nome,tipo:"VISITA",texto:PEND_PREFIXO+tx,origem:"tarefa",...quem}));
    resolv.forEach(x=>{try{fetch(`${DASH_CRM}/api/crm/tarefa-concluir`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({id:x.id})}).catch(()=>{});}catch{}});
    if(next?.nextDate&&next?.nextDesc){const nt=(next.nextType||"LIGACAO").toUpperCase();crmLog({org_id:o.id,cnpj:cn,org_nome:nome,tipo:nt,texto:next.nextDesc,origem:"tarefa",due_em:`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`,...quem});}
    setRemTarget(null);setTimeout(()=>setCrmBump(b=>b+1),800);
    const m=["Atendimento registrado."];if(resolv.length)m.push(`${resolv.length} pendência(s) resolvida(s).`);if(novas.length)m.push(`${novas.length} pendência(s) nova(s) para o próximo atendimento.`);if(next?.nextDate)m.push("Próximo contato agendado.");setTimeout(()=>alert(m.join("\n")),100);};

  const checkin=async(org)=>{ensureBase();if(org.cat==="Online - B2B"&&!confirm(`${org.name} e Online/B2B.\nRegistrar visita?`))return;if(org.cat==="Inativo"&&!confirm(`${org.name} esta Inativo.\nContinuar?`))return;if(org.cat==="Excluido"&&!confirm(`${org.name} esta Excluido.\nContinuar?`))return;setLdId(org.id);setGeoErr("");try{const g=await gps();if(plocs[org.id]&&!plocs[org.id].geo){const d=hav(plocs[org.id].lat,plocs[org.id].lng,g.lat,g.lng)*1000;if(d>800&&(g.acc==null||g.acc<=120)){setDivTarget({org,dist:Math.round(d),geo:g});setLdId(null);return;}else if(d>800){/* GPS impreciso: não bloqueia, mas corrige a posição salva */const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);crmGps(org.id,(org.cnpj||"").replace(/\D/g,""),g);}}else{/* sem GPS OU só geocodificado por endereço: o check-in real assume a localização */const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);crmGps(org.id,(org.cnpj||"").replace(/\D/g,""),g);}const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}catch{setGeoErr("GPS indisponivel.");}setLdId(null);};
  const handleDivAction=(action,type)=>{if(!divTarget)return;const{org,geo}=divTarget;if(action==="checkin"){const v={orgId:org.id,orgName:org.name,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}else if(action==="remote"&&type)setCoTarget({...org,remoteType:type});setDivTarget(null);};
  const checkout=async(note,type="VISITA",next=null,sale=null,extra=null)=>{if(!active||ldId)return;setLdId(active.orgId);let g=null;try{g=await gps();}catch{}
    // Checkout: só sinaliza divergência se a referência for GPS REAL (não geocodificada por endereço)
    // e ainda assim GRAVA a visita (a flag é só informativa) — a régua de endereço não é confiável p/ bloquear.
    let divergent=false,divDist=0;
    if(g){
      const ref=plocs[active.orgId];
      if(ref&&!ref.geo&&ref.lat&&ref.lng){divDist=Math.round(hav(ref.lat,ref.lng,g.lat,g.lng)*1000);if(divDist>800&&(g.acc==null||g.acc<=120))divergent=true;}
    }
    const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type,sale,divergent,divDist};
    // SEMPRE grava (D1 + KV). A visita conta no relatório; "divergent" é só um selo de conferência.
    done.synced=true;
    const oRef=(allOrgs||[]).find(o=>o.id===active.orgId);const cnpjRef=oRef?(oRef.cnpj||"").replace(/\D/g,""):null;
    const resolv=(extra?.resolvidas)||[],novas=(extra?.novas)||[];
    crmLog({org_id:active.orgId,cnpj:cnpjRef,org_nome:done.orgName,tipo:type,texto:note+(sale?.brand&&sale?.value?`\n[Venda ${sale.brand} R$ ${sale.value}]`:"")+resolv.map(x=>`\n✓ Pendência resolvida: ${x.txt}`).join(""),lat:g?.lat,lng:g?.lng,origem:"checkout"});
    novas.forEach(t=>crmLog({org_id:active.orgId,cnpj:cnpjRef,org_nome:done.orgName,tipo:"VISITA",texto:PEND_PREFIXO+t,origem:"tarefa"}));
    resolv.forEach(x=>{try{fetch(`${DASH_CRM}/api/crm/tarefa-concluir`,{method:"PUT",headers:{"X-Session":token,"Content-Type":"application/json"},body:JSON.stringify({id:x.id})}).catch(()=>{});}catch{}});
    if(next?.nextDate&&next?.nextDesc){const nt=(next.nextType||"VISITA").toUpperCase();const tipoOk=["VISITA","LIGACAO","EMAIL","REUNIAO","WHATSAPP","PROPOSTA","NOTA"].includes(nt)?nt:"VISITA";crmLog({org_id:active.orgId,cnpj:cnpjRef,org_nome:done.orgName,tipo:tipoOk,texto:next.nextDesc,origem:"tarefa",due_em:`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`});}
    syncVisitSave(done);
    setVisits(p=>[done,...p]);setActive(null);syncClear();setCoTarget(null);setLdId(null);
    if(divergent)setTimeout(()=>alert(`ℹ️ Visita registrada.\nO GPS ficou a ${divDist}m do ponto salvo do cliente — a visita foi gravada normalmente e conta no relatório; fica só um selo ⚠️ para você conferir o cadastro depois.`),100);
    else{const m=[];if(next?.nextDate&&next?.nextDesc)m.push("✓ Próximo passo agendado.");if(novas.length)m.push(`📌 ${novas.length} pendência(s) para a próxima visita — vão aparecer no próximo check-in.`);if(resolv.length)m.push(`✓ ${resolv.length} pendência(s) marcada(s) como resolvida(s).`);if(m.length)setTimeout(()=>alert(m.join("\n")),100);}
    setPendAtivas([]);
  };

  // ─── Deep-link: teamcheck.jordanmt.com/?cliente={CNPJ} abre a ficha da empresa ───
  const dlRef=useRef(false);
  useEffect(()=>{
    if(dlRef.current||!token||!user||!(allOrgs||[]).length)return;
    dlRef.current=true;
    let q="",pq="";try{const sp=new URL(window.location.href).searchParams;q=(sp.get("cliente")||"").replace(/\D/g,"");pq=sp.get("pessoa")||"";}catch{}
    if(!q&&!pq)return;
    try{const u=new URL(window.location.href);u.searchParams.delete("cliente");u.searchParams.delete("pessoa");window.history.replaceState({},"",u.pathname+(u.search||""));}catch{}
    if(!q)return; // ?pessoa: a aba Pessoas já abre com a busca preenchida (pessoaQ0)
    const org=(allOrgs||[]).find(x=>String(x.cnpj||"").replace(/\D/g,"")===q);
    if(!org)return;
    setCrmFocus({org,t:Date.now()});setTab("crm_empresas");
  },[allOrgs,token,user]);

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sS("jc:session",t);sS("jc:user",u);setSSOCookie(t);}}/>;

  // ─── Navegação: grupos iguais ao Dashboard (sidebar) + lista plana (bottom nav mobile) ───
  const isAdmin=user?.id===743088;
  const NAVG=[
    {grp:"CAMPO",itens:[{id:"pdvs",I:Store,l:"PDVs"},{id:"mapa",I:MapPin,l:"Mapa"},{id:"rotas",I:MapIcon,l:"Rotas"},{id:"agenda",I:Calendar,l:"Agenda"}]},
    {grp:"CRM",itens:[{id:"crm_inicio",I:BookUser,l:"Início"},{id:"crm_empresas",I:Building2,l:"Empresas"},{id:"crm_pessoas",I:Contact,l:"Pessoas"}]},
    {grp:"GESTÃO",itens:[...(isAdmin?[{id:"equipe",I:Users,l:"Equipe",admin:true}]:[]),{id:"relatorio",I:BarChart3,l:"Relatório"}]},
    {grp:"SISTEMA",itens:[{id:"config",I:Settings,l:"Configurações"}]},
  ];
  const TITULOS={pdvs:["PDVs","Pontos de venda"],crm_inicio:["CRM","Feed de atividades"],crm_empresas:["Empresas","Carteira de clientes"],crm_pessoas:["Pessoas","Contatos"],mapa:["Mapa","Clientes no mapa"],rotas:["Rotas","Roteiro do dia"],relatorio:["Relatório","Período, jornada e km"],equipe:["Equipe","Produtividade"],agenda:["Agenda","Tarefas e retornos"],config:["Configurações","Sistema"]};
  // Bottom nav (mobile): CRM entra como atalho único (→ Início); Empresas/Pessoas ficam na gaveta lateral
  const baseTabs=[{id:"pdvs",I:Store,l:"PDVs"},{id:"mapa",I:MapPin,l:"Mapa"},{id:"crm_inicio",I:BookUser,l:"CRM"},{id:"rotas",I:MapIcon,l:"Rotas"},{id:"relatorio",I:BarChart3,l:"Relatório"},{id:"agenda",I:Calendar,l:"Agenda"},{id:"config",I:Settings,l:"Config"}];
  const tabs=isAdmin?[...baseTabs.slice(0,4),{id:"equipe",I:Users,l:"Equipe"},...baseTabs.slice(4)]:baseTabs;
  const navAtivo=(id)=>id.startsWith("crm")?tab.startsWith("crm"):tab===id;
  const irPara=(id)=>{if(id==="mapa")setMapaLigado(true);setTab(id);if(mob)setNavOpen(false);};
  const sair=()=>{setToken("");setUser(null);setOrgs([]);sS("jc:session","");sS("jc:user",null);clearSSOCookie();};
  const dataHoje=fD(new Date());

  return(<div style={{display:"flex",height:"100vh",overflow:"hidden",background:S.chrome,color:S.txt,fontFamily:"'Archivo',system-ui,sans-serif"}}>
    {/* SIDEBAR — mesma estrutura do Dashboard (grupos + itens); no mobile vira gaveta */}
    {mob&&navOpen&&<div onClick={()=>setNavOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:49}}/>}
    <div style={{width:navOpen?230:0,minWidth:navOpen?230:0,transition:"all .25s",overflow:"hidden",background:S.chrome,borderRight:`1px solid ${S.chromeBdr}`,position:mob?"fixed":"relative",top:0,left:0,height:"100vh",zIndex:mob?50:1,display:"flex",flexDirection:"column",boxShadow:mob&&navOpen?"0 0 40px rgba(0,0,0,.5)":"none"}}>
      <div style={{height:74,display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:3,padding:"8px 18px 4px",flexShrink:0}}>
        <img src="/logo-white.png" alt="Jordan" style={{height:26,objectFit:"contain"}}/>
        <div style={{lineHeight:1.15,whiteSpace:"nowrap"}}>
          <span style={{fontSize:12.5,fontWeight:700,letterSpacing:".06em",color:S.chromeFg}}>TeamCheck</span>
          <span style={{fontSize:9.5,color:S.navGrp,letterSpacing:".02em",marginLeft:6}}>Representação Inteligente</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 8px 18px"}}>
        {NAVG.map((g,gi)=>(
          <div key={gi} style={{marginBottom:10}}>
            <div style={{fontSize:11.5,color:S.navGrp,padding:"10px 10px 5px",fontWeight:500,whiteSpace:"nowrap"}}>{g.grp==="CRM"?"CRM":g.grp.charAt(0)+g.grp.slice(1).toLowerCase()}</div>
            {g.itens.map(it=>{const act=tab===it.id;return(
              <div key={it.id} className="navit" onClick={()=>irPara(it.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:6,cursor:"pointer",marginBottom:1,background:act?S.navActive:"transparent",color:act?S.navActiveFg:S.nav,fontSize:14,fontWeight:act?600:400,whiteSpace:"nowrap"}}>
                <it.I size={16} strokeWidth={act?2.2:1.7} style={{flexShrink:0}}/>
                <span style={{flex:1}}>{it.l}</span>
                {it.admin&&<span style={{fontSize:10.5,color:S.navGrp}}>admin</span>}
              </div>);})}
          </div>))}
      </div>
      <div style={{padding:"12px 18px 16px",borderTop:`1px solid ${S.chromeBdr}`,whiteSpace:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:S.nav}}><span style={{width:7,height:7,borderRadius:"50%",background:syncStatus.startsWith?.("Erro")?S.dng:S.ok,flexShrink:0}}/>{syncing?syncMsg:(syncStatus?syncStatus.split("|")[0].trim():"Sync —")}</div>
        <div style={{fontSize:10,color:S.navGrp,marginTop:4}}>{orgs.length} clientes · {visits.length} visitas · {Object.keys(plocs).length} GPS</div>
      </div>
    </div>

    {/* COLUNA PRINCIPAL */}
    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",height:"100vh",background:S.chrome}}>
      {/* HEADER — gradiente chrome, idêntico ao Dashboard */}
      <div style={{height:60,flexShrink:0,background:S.chrome,borderBottom:`1px solid ${S.chromeBdr}`,display:"flex",alignItems:"center",gap:mob?8:14,padding:mob?"0 12px":"0 24px",zIndex:10}}>
        <button onClick={()=>setNavOpen(o=>!o)} aria-label="Menu" style={{background:"none",border:"none",color:S.chromeFg,borderRadius:6,width:40,height:40,minWidth:40,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}><Menu size={20} strokeWidth={1.8}/></button>
        {!mob&&<JordanLogo color={S.chromeFg} height={34}/>}
        <div style={{flex:1,minWidth:0,display:"flex",alignItems:"baseline",gap:8,overflow:"hidden"}}>
          <span style={{fontSize:mob?18:19,fontWeight:700,letterSpacing:"-.2px",color:S.chromeFg,whiteSpace:"nowrap"}}>{(TITULOS[tab]||["TEAMCHECK"])[0]}</span>
          {!mob&&<span style={{fontSize:13,color:S.navGrp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{(TITULOS[tab]||[])[1]||""}</span>}
        </div>
        <button onClick={()=>setSearchAdd(true)} title="Adicionar / buscar cliente" aria-label="Novo cliente" style={{width:40,height:40,minWidth:40,borderRadius:8,border:"none",background:S.pri,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><Plus size={19} strokeWidth={2.2} color="#fff"/></button>
        <button onClick={async()=>{await doSync();await loadHistory();syncVisitLoad();}} disabled={syncing} title="Sincronizar" aria-label="Sincronizar" style={{width:40,height:40,minWidth:40,borderRadius:8,border:`1px solid ${S.chromeBdr}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}><RefreshCw size={17} strokeWidth={1.8} color="var(--chrome-fg)" className={syncing?"spin":""}/></button>
        <button onClick={trocarTema} title={tema==="dark"?"Mudar para tema claro":"Mudar para tema escuro"} aria-label="Trocar tema" style={{width:40,height:40,minWidth:40,borderRadius:8,border:`1px solid ${S.chromeBdr}`,background:"none",color:S.chromeFg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{tema==="dark"?<Sun size={17} strokeWidth={1.8}/>:<Moon size={17} strokeWidth={1.8}/>}</button>
        {!mob&&<div style={{textAlign:"right",lineHeight:1.25}}>
          <div style={{fontSize:13,fontWeight:600,color:S.chromeFg}}>{user?.name}</div>
          <div style={{fontSize:11,color:S.navGrp}}>{dataHoje}</div>
        </div>}
        {!mob&&<button onClick={sair} style={{padding:"7px 15px",borderRadius:8,border:`1px solid ${S.chromeBdr}`,background:"transparent",color:S.chromeFg,fontSize:12.5,fontWeight:500,cursor:"pointer"}}>Sair</button>}
      </div>

      {/* CONTEÚDO — v74: superfície lisa, largura máx. nas telas de lista */}
      <div className="jc-main" style={{flex:1,overflowY:"auto",padding:mob?"14px 14px 96px":"22px 28px 42px"}}><div style={{maxWidth:tab==="pdvs"||tab.startsWith("crm")?980:"none",margin:"0 auto"}}>
      {novaVersao&&<button onClick={atualizarApp} style={{width:"100%",display:"flex",alignItems:"center",gap:10,textAlign:"left",background:S.card,border:`1px solid ${S.pri}`,borderRadius:10,padding:"10px 12px",marginBottom:10,minHeight:44}}><RefreshCw size={16} strokeWidth={1.9} color={S.pl}/><span style={{fontSize:14,color:S.txt,flex:1}}>Saiu uma versão nova do app.</span><span style={{fontSize:13,color:S.pl,fontWeight:600,whiteSpace:"nowrap"}}>Atualizar</span></button>}
      {/* v74: um bloco só para quem está em atendimento agora (você, pendências do cliente e a equipe) */}
      {tab!=="config"&&(active||(teamActive&&isAdmin))&&<section aria-label="Em atendimento agora" style={{border:`1px solid ${S.brd}`,borderRadius:10,overflow:"hidden",marginBottom:12,background:S.card}}>
        {active&&<button onClick={()=>{setTab("pdvs");setFocusReq({id:active.orgId,name:active.orgName,t:Date.now()});}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",minHeight:48,border:"none",borderRadius:0,background:"transparent",textAlign:"left"}}>
          <span style={{width:8,height:8,borderRadius:4,background:S.ok,flexShrink:0}}/>
          <span style={{display:"flex",flexDirection:"column",flex:1,minWidth:0}}>
            <span style={{fontSize:14.5,fontWeight:600,color:S.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Você · {(orgs.find(x=>x.id===active.orgId)?.name)||active.orgName}</span>
            <span className="num" style={{fontSize:11.5,color:S.ts}}>check-in {fT(active.checkinTime)} · {hrsMin(mins(active.checkinTime,new Date()))}</span>
          </span>
          <span style={{fontSize:13,fontWeight:600,color:S.pl,whiteSpace:"nowrap"}}>Ir ao cliente</span>
        </button>}
        {active&&pendAtivas.length>0&&<button onClick={()=>setPendAlerta({org:active.orgName,itens:pendAtivas})} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",minHeight:44,border:"none",borderTop:`1px solid ${S.brd}`,borderRadius:0,background:S.gold+"14",textAlign:"left"}}>
          <span style={{fontSize:12.5,fontWeight:600,color:S.gold,whiteSpace:"nowrap"}}>{pendAtivas.length===1?"1 pendência":`${pendAtivas.length} pendências`}</span>
          <span style={{fontSize:13,color:S.txt,flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pendAtivas.slice(0,3).map(x=>x.txt).join(" · ")}</span>
          <ChevronRight size={15} color="var(--t3)"/>
        </button>}
        {teamActive&&isAdmin&&<button onClick={()=>{setTab("pdvs");setFocusReq({id:teamActive.orgId,name:teamActive.orgName,t:Date.now()});}} title="Ir ao cliente" style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",minHeight:48,border:"none",borderTop:active?`1px solid ${S.brd}`:"none",borderRadius:0,background:"transparent",textAlign:"left"}}>
          <span style={{width:8,height:8,borderRadius:4,background:S.gold,flexShrink:0}}/>
          <span style={{display:"flex",flexDirection:"column",flex:1,minWidth:0}}>
            <span style={{fontSize:14.5,fontWeight:500,color:S.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Alisson · {teamActive.orgName}</span>
            <span className="num" style={{fontSize:11.5,color:S.ts}}>desde {fT(teamActive.checkinTime)} · {hrsMin(mins(teamActive.checkinTime,new Date()))}</span>
          </span>
          <span style={{fontSize:13,fontWeight:600,color:S.gold,whiteSpace:"nowrap"}}>Ir ao cliente</span>
        </button>}
      </section>}
      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13.5,color:S.gold,margin:0}}>Bom dia — nenhuma atividade iniciada ainda.</p></div>}
      {prevDay&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>Visita aberta de {fD(prevDay.checkinTime)} — {prevDay.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(prevDay.checkinTime);c.setHours(18);setVisits(p=>[{...prevDay,checkoutTime:c.toISOString(),note:"Auto 18h",taskType:"VISITA",synced:false},...p]);setActive(null);setPrevDay(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none",color:"#fff"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:prevDay.orgId,name:prevDay.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {longVisit&&!prevDay&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:"0 0 6px"}}>Visita aberta há mais de 2h — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}

      {canCloseRoute&&tab!=="config"&&<div style={{background:S.acc+"18",border:`1px solid ${S.acc}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.acc,margin:"0 0 8px"}}>{todayVisits.length} visita(s) hoje — fechar o roteiro?</p><button onClick={()=>setShowEndDay(true)} style={{width:"100%",padding:10,fontSize:13,background:S.acc,border:"none",fontWeight:600,borderRadius:8,color:"#fff"}}>Fechar roteiro do dia</button></div>}

      <PdvsTab visible={tab==="pdvs"} orgs={orgs} allOrgs={allOrgs} setOrgs={setOrgs} visits={visits} plocs={plocs} active={active} ldId={ldId} geoErr={geoErr} user={user} token={token} syncing={syncing} syncMsg={syncMsg} onSync={doSync} onCheckin={checkin} onCheckout={o2=>setCoTarget(o2)} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} onQuick={quickAction} onOpenFicha={o2=>{setCrmFocus({org:o2,t:Date.now()});setTab("crm_empresas");if(mob)setNavOpen(false);}} focusReq={focusReq} rfv={rfvMap} excl={exclOrgs}/>
      <CrmTab visible={tab.startsWith("crm")} secao={tab.startsWith("crm")?tab.replace("crm_",""):"inicio"} bump={crmBump} focus={crmFocus} onCrmChange={()=>setCrmBump(b=>b+1)} token={token} user={user} allOrgs={allOrgs} visits={visits} plocs={plocs} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} rfv={rfvMap} onNovaEmpresa={()=>setSearchAdd(true)} excl={exclOrgs} pessoasQ={pessoaQ0} onRemoto={quickAction}/>
      <Suspense fallback={null}>{mapaLigado&&<MapaTab visible={tab==="mapa"} orgs={orgs} plocs={plocs} user={user} rfv={rfvMap} excl={exclOrgs} onOpenFicha={o2=>{setCrmFocus({org:o2,t:Date.now()});setTab("crm_empresas");if(mob)setNavOpen(false);}}/>}</Suspense>
      {tab==="rotas"&&<RotasTab sel={rotasSel} setSel={setRotasSel} visits={visits} dayBases={dayBases} user={user} plocs={plocs} orgs={orgs} rfv={rfvMap} token={token} onOpenFicha={o2=>{setCrmFocus({org:o2,t:Date.now()});setTab("crm_empresas");if(mob)setNavOpen(false);}}/>}
      {tab==="relatorio"&&<Suspense fallback={<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Carregando relatório…</p>}><RelatorioTab visits={visits} dayBases={dayBases} user={user} token={token} plocs={plocs} onEditBase={(d,start,end,uid)=>{const key=uid?uid+"_"+d:d;setDayBases(p=>{const n={...p,[key]:{...p[key],start,end}};sS("jc:dayBases",n);return n;});}}/></Suspense>}
      {tab==="equipe"&&isAdmin&&<EquipeTab sel={equipeSel} setSel={setEquipeSel} plocs={plocs} dayBases={dayBases} user={user} visits={visits} token={token} bump={crmBump}/>}
      <AgendaTab visible={tab==="agenda"} token={token} user={user} allOrgs={allOrgs} bump={crmBump} onCrmChange={()=>setCrmBump(b=>b+1)}/>

      {tab==="config"&&<ConfigTab instEvt={instEvt} user={user} orgs={orgs} allOrgs={allOrgs} token={token} doSync={doSync} visits={visits} plocs={plocs} dayBases={dayBases} today={today} syncStatus={syncStatus} syncing={syncing} syncMsg={syncMsg}
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
      </div></div>
    </div>

    {/* Voltar ao topo */}
    <button onClick={()=>{const el=document.querySelector(".jc-main");if(el)el.scrollTo({top:0,behavior:"smooth"});}} style={{position:"fixed",bottom:mob?84:24,right:16,width:44,height:44,borderRadius:50,background:S.pri,border:"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px ${S.pri}66`,zIndex:30,cursor:"pointer",padding:0}}><ChevronUp size={22} strokeWidth={2.5} color="#fff"/></button>

    {/* BOTTOM NAV — só no celular (agilidade de campo); no desktop a navegação é a sidebar */}
    {mob&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:`linear-gradient(180deg, ${S.chrome}, ${S.chromeTop})`,borderTop:`1px solid ${S.chromeBdr}`,display:"flex",justifyContent:"center",zIndex:40,boxShadow:`0 -6px 18px ${S.contentShadow}`}}><div style={{display:"flex",width:"100%",padding:"5px 4px"}}>{tabs.map(t=>{const act=navAtivo(t.id);return <button key={t.id} onClick={()=>{if(t.id==="mapa")setMapaLigado(true);setTab(t.id);}} style={{flex:1,border:"none",borderRadius:10,margin:"0 2px",background:act?S.navActive:"transparent",padding:"6px 2px 5px",fontSize:10,fontWeight:act?700:400,color:act?S.navActiveFg:S.navFg,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><t.I size={22} strokeWidth={act?2.2:1.6}/>{t.l}</button>;})}</div></div>}

    {coTarget&&<NoteModal org={coTarget} pendencias={active&&coTarget.id===active.orgId?pendAtivas:[]} onSave={checkout} onCancel={()=>setCoTarget(null)}/>}
    {remTarget&&<NoteModal remoto org={remTarget.org} pendencias={remTarget.pend} carregandoPend={remTarget.lo} onSave={remoteSave} onCancel={()=>setRemTarget(null)}/>}
    {pendAlerta&&<PendenciasAlerta dados={pendAlerta} onClose={()=>setPendAlerta(null)}/>}
    {showDB&&<JourneyModal user={user} onSave={j=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const n={...p,[k]:{start:j.start,end:j.end}};sS("jc:dayBases",n);return n;});setShowDB(false);}} onCancel={()=>setShowDB(false)}/>}
    {showEndDay&&<DayEndModal user={user} onSave={b=>{const t=todayLocal();const k=user.id+"_"+t;setDayBases(p=>{const cur=p[k]||{};const n={...p,[k]:{...cur,end:b}};sS("jc:dayBases",n);return n;});setShowEndDay(false);}} onCancel={()=>setShowEndDay(false)}/>}
    {searchAdd&&<SearchOrAddModal token={token} allOrgs={allOrgs}
      onFound={(org)=>{setTab("pdvs");setFocusReq({id:org.id||null,name:org.name||org.nickname,t:Date.now()});}}
      onNewClient={(cnpj,rfData)=>{sS("jc:prefill",{cnpj,rfData});setNewClient(true);}}
      onCancel={()=>setSearchAdd(false)}/>}
    {newClient&&<NewClientModal token={token} user={user} users={usersList} allOrgs={allOrgs} onSave={org=>{setOrgs(p=>[org,...p]);setAllOrgs(p=>[org,...p]);setNewClient(false);}} onCancel={()=>setNewClient(false)}/>}
    {personTarget&&<PeopleModal org={personTarget} token={token} onClose={()=>setPersonTarget(null)}/>}
    {editTarget&&<EditModal org={editTarget} token={token} users={usersList} allOrgs={allOrgs} onSave={u=>{setOrgs(p=>p.map(o=>o.id===u.id?u:o));setAllOrgs(p=>p.map(o=>o.id===u.id?u:o));setEditTarget(null);}} onClose={()=>setEditTarget(null)}/>}
    {divTarget&&<DivergentModal org={divTarget.org} dist={divTarget.dist} onAction={handleDivAction} onCancel={()=>setDivTarget(null)}/>}
  </div>);}
