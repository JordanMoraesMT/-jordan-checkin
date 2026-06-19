// TeamCheck — App (orquestração principal)
import { useState, useEffect, useMemo } from "react";
import { Store, Map as MapIcon, BarChart3, Calendar, Users, Settings, Plus, RefreshCw, ChevronUp } from "lucide-react";
import { API, toLocalDate, todayLocal, S, fT, fD, mins, hrsMin, hav, sL, sS, agF, postTask, gps, fixMojibake, strip, isRealVisit } from "./lib";
import { Login, Banner, NoteModal, NewClientModal, PeopleModal, EditModal, JourneyModal, DayEndModal, DivergentModal, SearchOrAddModal } from "./components";
import { RotasTab } from "./tabs/RotasTab";
import { RelatorioTab } from "./tabs/RelatorioTab";
import { EquipeTab } from "./tabs/EquipeTab";
import { AgendaTab } from "./tabs/AgendaTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { PdvsTab } from "./tabs/PdvsTab";

export default function App(){
  const[token,setToken]=useState(()=>sL("jc:token",""));const[user,setUser]=useState(()=>sL("jc:user",null));const[orgs,setOrgs]=useState([]);const[allOrgs,setAllOrgs]=useState([]);
  const[visits,setVisits]=useState(()=>{const raw=sL("jc:visits",[]);const cutoff=new Date();cutoff.setDate(cutoff.getDate()-90);const cut=cutoff.toISOString();const purged=raw.filter(v=>!v.checkinTime||v.checkinTime>=cut);if(purged.length<raw.length)console.log(`Purged ${raw.length-purged.length} visits >90d`);return purged;});const[active,setActive]=useState(()=>sL("jc:active",null));
  const[tab,setTab]=useState("pdvs");const[focusReq,setFocusReq]=useState(null);
  // (estado de filtros/proximidade de PDV movido para PdvsTab)
  const[syncing,setSyncing]=useState(false);const[syncMsg,setSyncMsg]=useState("");const[ldId,setLdId]=useState(null);const[geoErr,setGeoErr]=useState("");
  const[coTarget,setCoTarget]=useState(null);const[personTarget,setPersonTarget]=useState(null);const[newClient,setNewClient]=useState(false);const[searchAdd,setSearchAdd]=useState(false);const[divTarget,setDivTarget]=useState(null);const[editTarget,setEditTarget]=useState(null);
  const[plocs,setPlocs]=useState(()=>sL("jc:pdvLocs",{}));const[dayBases,setDayBases]=useState(()=>sL("jc:dayBases",{}));
  const[showDB,setShowDB]=useState(false);const[showEndDay,setShowEndDay]=useState(false);const[equipeSel,setEquipeSel]=useState(todayLocal());const[rotasSel,setRotasSel]=useState(todayLocal());

  useEffect(()=>{sS("jc:visits",visits);},[visits]);useEffect(()=>{sS("jc:active",active);},[active]);useEffect(()=>{sS("jc:pdvLocs",plocs);},[plocs]);useEffect(()=>{sS("jc:dayBases",dayBases);syncDayBasesSave(dayBases);},[dayBases]);
  // Auto-clear cache once after v13.5 upgrade to remove old corrupted cached responses
  useEffect(()=>{if(!localStorage.getItem("jc:cleaned_v135")){(async()=>{try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister();}}catch{}localStorage.setItem("jc:cleaned_v135","1");if(token&&user)setTimeout(()=>doSync(),500);})();}},[]);
  useEffect(()=>{if(token&&user&&!orgs.length&&!syncing)doSync();},[token,user]);

  const syncPush=async(data)=>{try{await fetch(`${API}?sync=${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:data})});}catch(e){console.warn("syncPush:",e);}};
  const syncClear=async()=>{try{await fetch(`${API}?sync=${user.id}`,{method:"DELETE"});}catch(e){console.warn("syncClear:",e);}};
  const syncVisitSave=async(visit)=>{try{const r=await fetch(`${API}?sync=visits_${user.id}`);const d=await r.json();const all=[visit,...(d.active||[])].slice(0,200);await fetch(`${API}?sync=visits_${user.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:all})});}catch(e){console.warn("syncVisitSave:",e);}};
  const syncVisitLoad=async()=>{try{const ids=[743088,743347];let remote=[];for(const uid of ids){const r=await fetch(`${API}?sync=visits_${uid}`,{cache:"no-store"});const buf=await r.arrayBuffer();const txt=new TextDecoder("utf-8",{fatal:false}).decode(buf);const d=JSON.parse(txt);if(d.active)remote.push(...d.active.map(v=>({...v,orgName:fixMojibake(v.orgName||""),city:fixMojibake(v.city||""),note:fixMojibake(v.note||"")})));}if(remote.length){setVisits(prev=>{const existing=new Set(prev.map(v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime)));const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+toLocalDate(r.checkinTime)));if(newOnes.length)return[...prev,...newOnes];return prev;});}}catch(e){console.warn("syncVisitLoad:",e);}};
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
    // Only activities (no due_date) of type Visita = real visit logs
    const apiVisits=allTasks.filter(t=>(t.type==="Visita"||t.type==="VISITA")&&!t.due_date&&!t.dueDate);
    // Dedup API by orgId+userId+date (keep first occurrence)
    const seen=new Set();const deduped=[];
    for(const t of apiVisits){const key=t.organization?.id+"|"+(t.user?.id||"")+"|"+t.createdAt?.slice(0,10);if(seen.has(key))continue;seen.add(key);deduped.push(t);}
    const remote=deduped.map(t=>({orgId:t.organization?.id,orgName:t.organization?.name||"?",city:"",checkinTime:t.createdAt,checkoutTime:t.createdAt,note:t.text||"",taskType:"VISITA",synced:true,fromAgendor:true,userName:t.user?.name||""}));
    // Merge: KV/local visits take priority (have real timestamps)
    const existing=new Set(visits.map(v=>v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime)));
    const newOnes=remote.filter(r=>!existing.has(r.orgId+"|"+(r.userName||"")+"|"+toLocalDate(r.checkinTime)));
    if(newOnes.length){setVisits(prev=>[...prev,...newOnes]);setSyncMsg(`+${newOnes.length} visitas`);}else setSyncMsg("Atualizado");};
  const loadHistory=async()=>{try{await loadHistoryInner();}catch(e){setSyncMsg("Erro: "+e.message);}};

  const ensureBase=()=>{const t=todayLocal();const k=user.id+"_"+t;if(!dayBases[k]||(!dayBases[k].start&&!dayBases[k].lat))setShowDB(true);};
  // (derivados de filtro de PDV movidos para PdvsTab)
  const usersList=useMemo(()=>{const m={};orgs.forEach(o=>{if(o.ownerId&&o.owner)m[o.ownerId]=o.owner;});return Object.entries(m).map(([id,n])=>({id:parseInt(id),n}));},[orgs]);

  // (lastVisits/visitsByOrg/fo/proximidade/toggleCat movidos para PdvsTab)
  const quickAction=async(org,type)=>{const note=prompt(`Registrar ${type==="WHATSAPP"?"WhatsApp":"Ligacao"} com ${org.name}:`);if(!note?.trim())return;try{await postTask(token,org.id,note,type,true);alert("Registrado no Agendor!");}catch(e){alert("Erro: "+e.message);}};

  const checkin=async(org)=>{ensureBase();if(org.cat==="Online - B2B"&&!confirm(`${org.name} e Online/B2B.\nRegistrar visita?`))return;if(org.cat==="Inativo"&&!confirm(`${org.name} esta Inativo.\nContinuar?`))return;if(org.cat==="Excluido"&&!confirm(`${org.name} esta Excluido.\nContinuar?`))return;setLdId(org.id);setGeoErr("");try{const g=await gps();if(plocs[org.id]){const d=hav(plocs[org.id].lat,plocs[org.id].lng,g.lat,g.lng)*1000;if(d>500){setDivTarget({org,dist:Math.round(d),geo:g});setLdId(null);return;}}else{const np={...plocs,[org.id]:{lat:g.lat,lng:g.lng}};setPlocs(np);syncPlocs(np);}const v={orgId:org.id,orgName:org.name||org.nickname,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:g.lat,lng:g.lng,accuracy:g.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}catch{setGeoErr("GPS indisponivel.");}setLdId(null);};
  const handleDivAction=(action,type)=>{if(!divTarget)return;const{org,geo}=divTarget;if(action==="checkin"){const v={orgId:org.id,orgName:org.name,city:org.addr?.city_name||"",checkinTime:new Date().toISOString(),lat:geo.lat,lng:geo.lng,accuracy:geo.acc,checkoutTime:null,note:"",taskType:"VISITA",synced:true,userName:user?.name||""};setActive(v);syncPush(v);}else if(action==="remote"&&type)setCoTarget({...org,remoteType:type});setDivTarget(null);};
  const checkout=async(note,type="VISITA",next=null,sale=null)=>{if(!active||ldId)return;setLdId(active.orgId);let g=null;try{g=await gps();}catch{}
    // Detect divergent checkout: GPS far from registered client location
    let divergent=false,divDist=0;
    if(g){
      const ref=plocs[active.orgId]||{lat:active.lat,lng:active.lng};
      if(ref&&ref.lat&&ref.lng){divDist=Math.round(hav(ref.lat,ref.lng,g.lat,g.lng)*1000);if(divDist>500)divergent=true;}
    }
    const done={...active,checkoutTime:new Date().toISOString(),checkoutLat:g?.lat,checkoutLng:g?.lng,note,taskType:type,sale,divergent,divDist};
    // Only register in Agendor + KV if NOT divergent
    if(!divergent){
      try{await postTask(token,active.orgId,note,type,true);done.synced=true;}catch(e){console.warn("task:",e);done.synced=false;}
      if(next?.nextDate&&next?.nextDesc){try{await postTask(token,active.orgId,next.nextDesc,next.nextType||"VISITA",false,`${next.nextDate}T${next.nextTime||"09:00"}:00-04:00`);}catch(e){console.warn("nextStep:",e);}}
      if(sale?.brand&&sale?.value){try{await agF(`/organizations/${active.orgId}/deals`,token,{method:"POST",body:JSON.stringify({title:`Venda ${sale.brand}`,value:sale.value})});}catch(e){console.warn("deal:",e);}}
      syncVisitSave(done);
    }else{done.synced=false;}
    // Save locally (even divergent, for visual flag)
    setVisits(p=>[done,...p]);setActive(null);syncClear();setCoTarget(null);setLdId(null);
    // Alert AFTER UI is cleared (non-blocking flow)
    if(divergent)setTimeout(()=>alert(`⚠️ CHECKOUT DESLOCADO\nVocê está a ${divDist}m do local cadastrado.\n\nEsta visita NÃO foi registrada no Agendor e NÃO contará no relatório (visita e km).\n\nFica marcada com ⚠️ apenas para conferência.`),100);
    else if(next?.nextDate&&next?.nextDesc)setTimeout(()=>alert("Proximo passo agendado!"),100);
  };

  if(!token||!user)return <Login onLogin={(t,u)=>{setToken(t);setUser(u);sS("jc:token",t);sS("jc:user",u);}}/>;
  const baseTabs=[{id:"pdvs",I:Store,l:"PDVs"},{id:"rotas",I:MapIcon,l:"Rotas"},{id:"relatorio",I:BarChart3,l:"Relatório"},{id:"agenda",I:Calendar,l:"Agenda"},{id:"config",I:Settings,l:"Config"}];
  const tabs=user?.id===743088?[...baseTabs.slice(0,3),{id:"equipe",I:Users,l:"Equipe"},...baseTabs.slice(3)]:baseTabs;

  return(<div style={{minHeight:"100vh",paddingBottom:70}}>
    <div style={{padding:"14px 16px 12px",background:S.card,borderBottom:`1px solid ${S.brd}`,marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:12}}>
        <img src="/logo-white.png" alt="" style={{height:60,width:"auto",objectFit:"contain",display:"block"}} onError={e=>{e.target.src="/logo.png";e.target.style.filter="brightness(0) invert(1)";}}/>
        <p style={{fontSize:30,fontWeight:800,margin:0,letterSpacing:"1px",color:"#fff",textAlign:"center"}}>TeamCheck</p>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setSearchAdd(true)} style={{width:44,height:44,borderRadius:50,fontSize:18,background:S.acc,border:"none",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 10px ${S.acc}44`,cursor:"pointer"}}><Plus size={22} strokeWidth={2.5} color="#fff"/></button>
            <button onClick={async()=>{await doSync();await loadHistory();syncVisitLoad();}} disabled={syncing} style={{width:44,height:44,borderRadius:50,fontSize:15,background:syncing?S.cl:S.pri,border:"none",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 10px ${S.pri}44`,cursor:"pointer"}}><RefreshCw size={20} strokeWidth={2} color="#fff" className={syncing?"spin":""}/></button>
          </div>
          <p style={{fontSize:11,color:S.ts,margin:0,textAlign:"right",lineHeight:1.2}}>{user?.name}<br/>{fD(new Date())}</p>
        </div>
      </div>
    </div>
    <div style={{padding:"0 16px"}}>
      {active&&tab!=="config"&&<Banner v={active} orgs={orgs} onClick={()=>{setTab("pdvs");setFocusReq({id:active.orgId,name:active.orgName,t:Date.now()});}}/>}
      {teamActive&&tab!=="config"&&user?.id===743088&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:S.gold,animation:"pulse 2s infinite"}}/><p style={{fontSize:13,color:S.gold,margin:0}}>Alisson em atendimento: <b>{teamActive.orgName}</b></p></div><p style={{fontSize:11,color:S.ts,margin:"3px 0 0 16px"}}>Desde {fT(teamActive.checkinTime)} — {hrsMin(mins(teamActive.checkinTime,new Date()))}</p><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style></div>}

      {mAlert&&!active&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:0}}>⏰ Bom dia! Atividades ainda nao iniciadas.</p></div>}
      {prevDay&&<div style={{background:S.dng+"18",border:`1px solid ${S.dng}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.dng,margin:"0 0 8px"}}>⚠️ Visita aberta de {fD(prevDay.checkinTime)} — {prevDay.orgName}</p><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=new Date(prevDay.checkinTime);c.setHours(18);setVisits(p=>[{...prevDay,checkoutTime:c.toISOString(),note:"Auto 18h",taskType:"VISITA",synced:false},...p]);setActive(null);setPrevDay(null);}} style={{flex:1,fontSize:12,background:S.dng,border:"none"}}>Fechar 18h</button><button onClick={()=>setCoTarget({id:prevDay.orgId,name:prevDay.orgName})} style={{flex:1,fontSize:12}}>Com obs.</button></div></div>}
      {longVisit&&!prevDay&&<div style={{background:S.gold+"18",border:`1px solid ${S.gold}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.gold,margin:"0 0 6px"}}>⏰ Visita ativa ha mais de 2h — {active?.orgName}</p><button onClick={()=>setCoTarget({id:active.orgId,name:active.orgName})} style={{width:"100%",fontSize:12,borderColor:S.gold,color:S.gold}}>Fazer check-out</button></div>}

      {/* NOVO: Botão Fechar Roteiro quando tem visitas mas sem ativo */}
      {canCloseRoute&&tab!=="config"&&<div style={{background:S.acc+"18",border:`1px solid ${S.acc}44`,borderRadius:12,padding:"10px 14px",marginBottom:10}}><p style={{fontSize:13,color:S.acc,margin:"0 0 8px"}}>✅ {todayVisits.length} visita(s) hoje — Fechar roteiro?</p><button onClick={()=>setShowEndDay(true)} style={{width:"100%",padding:10,fontSize:13,background:S.acc,border:"none",fontWeight:600,borderRadius:8}}>🏨 Fechar Roteiro do Dia</button></div>}

      <div style={{display:"flex",gap:3,marginBottom:12,background:S.cl,borderRadius:8,padding:3}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);}} style={{flex:1,border:"none",background:tab===t.id?S.pri:"transparent",borderRadius:6,padding:"7px 2px",fontSize:10,fontWeight:tab===t.id?700:400,color:tab===t.id?"#fff":S.ts,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><t.I size={20} strokeWidth={tab===t.id?2.2:1.5}/>{t.l}</button>)}</div>

      <PdvsTab visible={tab==="pdvs"} orgs={orgs} allOrgs={allOrgs} setOrgs={setOrgs} visits={visits} plocs={plocs} active={active} ldId={ldId} geoErr={geoErr} user={user} token={token} syncing={syncing} syncMsg={syncMsg} onSync={doSync} onCheckin={checkin} onCheckout={o2=>setCoTarget(o2)} onEdit={o2=>setEditTarget(o2)} onPerson={o2=>setPersonTarget(o2)} onQuick={quickAction} focusReq={focusReq}/>
      {tab==="rotas"&&<RotasTab sel={rotasSel} setSel={setRotasSel} visits={visits} dayBases={dayBases} user={user} plocs={plocs}/>}
      {tab==="relatorio"&&<RelatorioTab visits={visits} dayBases={dayBases} user={user} token={token} plocs={plocs} onEditBase={(d,start,end,uid)=>{const key=uid?uid+"_"+d:d;setDayBases(p=>{const n={...p,[key]:{...p[key],start,end}};sS("jc:dayBases",n);return n;});}}/>}
      {tab==="equipe"&&user?.id===743088&&<EquipeTab sel={equipeSel} setSel={setEquipeSel} token={token} plocs={plocs} orgs={orgs} dayBases={dayBases}/>}
      <AgendaTab visible={tab==="agenda"} token={token} user={user} allOrgs={allOrgs}/>

      {tab==="config"&&<ConfigTab user={user} orgs={orgs} allOrgs={allOrgs} token={token} doSync={doSync} visits={visits} plocs={plocs} dayBases={dayBases} today={today} syncStatus={syncStatus} syncing={syncing} syncMsg={syncMsg}
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
    {/* Scroll to top — global, all tabs */}
    <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:72,right:16,width:46,height:46,borderRadius:50,background:S.pri,border:"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px ${S.pri}66`,zIndex:30,cursor:"pointer"}}><ChevronUp size={24} strokeWidth={2.5} color="#fff"/></button>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.card,borderTop:`1px solid ${S.brd}`,display:"flex",justifyContent:"center",zIndex:40}}><div style={{display:"flex",maxWidth:1200,width:"100%"}}>{tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);}} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"8px 4px 6px",fontSize:10,fontWeight:tab===t.id?700:400,color:tab===t.id?S.pl:S.td,display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}}><t.I size={24} strokeWidth={tab===t.id?2.2:1.5}/>{t.l}</button>)}</div></div>
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
