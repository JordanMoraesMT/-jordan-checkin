// TeamCheck — aba PdvsTab
import { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Trophy } from "lucide-react";
import { PG, toLocalDate, todayLocal, CATS, CC, geoEstimate, S, fD, fDS, hav, agF, gps, roadKm, csv, fixMojibake, strip } from "../lib";
import { OrgCard } from "../components";

function PdvsTab({visible,orgs,allOrgs,setOrgs,visits,plocs,active,ldId,geoErr,user,token,syncing,syncMsg,onSync,onCheckin,onCheckout,onEdit,onPerson,onQuick,focusReq}){
  const[search,setSearch]=useState("");const[catFilters,setCatFilters]=useState([]);const[cityFilter,setCityFilter]=useState("Todas");const[stateFilter,setStateFilter]=useState("Todos");const[segFilter,setSegFilter]=useState("Todos");const[prodFilter,setProdFilter]=useState("Todos");const[ownerFilter,setOwnerFilter]=useState("Todos");const[grupoFilter,setGrupoFilter]=useState("Todos");
  const[visitMode,setVisitMode]=useState("all");const[visitFrom,setVisitFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});const[visitTo,setVisitTo]=useState(todayLocal);
  const[nearMe,setNearMe]=useState(null);const[nearLoading,setNearLoading]=useState(false);const[nearRoad,setNearRoad]=useState({});const[sortMode,setSortMode]=useState("alpha");
  const[vc,setVc]=useState(PG);
  const cities=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const c=o.addr?.city_name||o.addr?.city;if(c)s.add(c);});return["Todas",...[...s].sort()];},[orgs]);
  const states=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.addr?.state)s.add(o.addr.state);});return["Todos",...[...s].sort()];},[orgs]);
  const segments=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.sector)s.add(o.sector);});return["Todos",...[...s].sort()];},[orgs]);
  const products=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.products)(o.products.split(", ")).forEach(p=>{if(p&&!p.startsWith("P_"))s.add(p);});});return["Todos",...[...s].sort()];},[orgs]);
  const owners=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.owner)s.add(o.owner);});return["Todos",...[...s].sort()];},[orgs]);
  const grupos=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const g=fixMojibake((o.grupo||"").replace("Grupo: ","").trim());if(g)s.add(g);});return["Todos",...[...s].sort()];},[orgs]);
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
    if(grupoFilter!=="Todos")list=list.filter(o=>(o.grupo||"").replace("Grupo: ","")===grupoFilter);
    // Visit date range filter
    if(visitMode==="visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return false;return vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      // Visitados: most recent first
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});}
    if(visitMode==="not_visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return true;return !vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      // Sem visita: oldest first (most neglected on top)
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"0";const lb=lastVisits[b.id]?.time||"0";return la.localeCompare(lb);});}
    if(search.trim()){const q=search.toLowerCase().replace(/[.\-\/]/g,"");list=list.filter(o=>[o.name,o.nickname,o.legalName,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g,"").includes(q));}
    if(sortMode==="near"&&nearMe){
      const withGPS=list.filter(o=>plocs[o.id]).map(o=>({...o,dist:hav(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng),distType:"gps"}));
      const noGPS=list.filter(o=>!plocs[o.id]).map(o=>{const geo=geoEstimate(o);if(geo)return{...o,dist:hav(nearMe.lat,nearMe.lng,geo[0],geo[1]),distType:"bairro"};return{...o,dist:9999,distType:"sem_ref"};});
      withGPS.sort((a,b)=>a.dist-b.dist);noGPS.sort((a,b)=>a.dist-b.dist);
      list=[...withGPS,...noGPS];
    }else if(sortMode==="rfv"){
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});
    }else{list=list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));}
    return list;
  },[orgs,search,catFilters,cityFilter,stateFilter,segFilter,prodFilter,ownerFilter,grupoFilter,visitMode,visitFrom,visitTo,visitsByOrg,lastVisits,nearMe,plocs,sortMode]);

  useEffect(()=>{
    if(sortMode!=="near"||!nearMe||!fo.length)return;
    let cancelled=false;
    (async()=>{const top=fo.filter(o=>o.dist!=null).slice(0,10);const roads={};
      for(const o of top){if(plocs[o.id]){const r=await roadKm(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng);if(!cancelled)roads[o.id]=r.km;}}
      if(!cancelled)setNearRoad(roads);
    })();return()=>{cancelled=true;};
  },[sortMode,nearMe,fo.slice(0,10).map(o=>o.id).join()]);

  const toggleCat=c=>{setCatFilters(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c]);setVc(PG);};
  useEffect(()=>{if(!focusReq)return;setSearch("");setCatFilters([]);setVisitMode("all");setVc(PG);const t=setTimeout(()=>{const el=document.getElementById("org-"+focusReq.id);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});else if(focusReq.name)setSearch(focusReq.name);},200);return()=>clearTimeout(t);},[focusReq]);
  const handleOut=useCallback(o2=>onCheckout(o2),[onCheckout]);
  const handleEdit=useCallback(o2=>onEdit(o2),[onEdit]);
  const handlePerson=useCallback(o2=>onPerson(o2),[onPerson]);
  const handleInfo=useCallback(o2=>alert(`${o2.name}\n${o2.cnpj||""}\n${o2.addr?.street||""} ${o2.addr?.number||""}\n${o2.addr?.district||""} ${o2.addr?.city_name||""} ${o2.addr?.state||""}\nCategoria: ${o2.cat}\nSetor: ${o2.sector}\nProdutos: ${o2.products}\n${o2.grupo||""}`),[]);
  return(<div style={{display:visible?"block":"none"}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, razão social, CNPJ, cidade, segmento..." style={{width:"100%",marginBottom:6}}/>
        <div style={{display:"flex",gap:3,marginBottom:6,overflowX:"auto",paddingBottom:2,flexWrap:"wrap"}}>{CATS.map(c=><button key={c} onClick={()=>toggleCat(c)} style={{padding:"3px 8px",fontSize:10,whiteSpace:"nowrap",border:catFilters.includes(c)?`2px solid ${CC[c]||S.pri}`:`1px solid ${S.brd}`,background:catFilters.includes(c)?`${CC[c]}22`:"transparent",color:catFilters.includes(c)?CC[c]||S.pri:S.ts,borderRadius:20,fontWeight:catFilters.includes(c)?600:400}}>{c}</button>)}
          <button onClick={()=>setCatFilters([])} style={{padding:"3px 8px",fontSize:10,border:`1px solid ${S.brd}`,color:!catFilters.length?S.pl:S.td,borderRadius:20,background:!catFilters.length?S.pri+"22":"transparent"}}>Todos</button>
          <button onClick={()=>{setCatFilters([]);setCityFilter("Todas");setStateFilter("Todos");setSegFilter("Todos");setProdFilter("Todos");setOwnerFilter("Todos");setGrupoFilter("Todos");setVisitMode("all");setSearch("");setSortMode("alpha");setNearMe(null);setVc(PG);}} style={{padding:"3px 8px",fontSize:10,border:`1px solid ${S.dng}44`,color:S.dng,borderRadius:20,background:"transparent"}}>✕ Limpar</button>
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
          <select value={grupoFilter} onChange={e=>{setGrupoFilter(e.target.value);setVc(PG);}} style={{flex:1,fontSize:11,padding:"4px"}}>{grupos.map(g=><option key={g} value={g}>{g==="Todos"?"Grupo":g}</option>)}</select>
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
          <button onClick={async()=>{if(sortMode==="near"){setSortMode("alpha");setNearMe(null);return;}setNearLoading(true);try{const g=await gps();setNearMe(g);setSortMode("near");setVc(PG);}catch{alert("GPS indisponivel");}setNearLoading(false);}} style={{flex:2,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="near"?S.acc:S.brd}`,color:sortMode==="near"?S.acc:S.td,background:sortMode==="near"?S.acc+"18":"transparent",borderRadius:6,fontWeight:sortMode==="near"?600:400,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><MapPin size={14} strokeWidth={2}/>{nearLoading?"Localizando...":sortMode==="near"?"Próximos (ativo)":"Onde estou"}</button>
          <button onClick={()=>{setSortMode("rfv");setNearMe(null);setVc(PG);}} style={{flex:1,padding:"6px",fontSize:10,border:`1px solid ${sortMode==="rfv"?S.gold:S.brd}`,color:sortMode==="rfv"?S.gold:S.td,background:sortMode==="rfv"?S.gold+"18":"transparent",borderRadius:6,fontWeight:sortMode==="rfv"?600:400,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Trophy size={14} strokeWidth={2}/>RFV</button>
        </div>
        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}
        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><button onClick={()=>onSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}
        {orgs.length>0&&<><p style={{fontSize:11,color:S.td,margin:"0 0 6px"}}>{fo.length} de {orgs.length}{visitMode==="not_visited"?` (sem visita ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")})`:visitMode==="visited"?` (visitados ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")})`:""}{sortMode==="near"?" — por proximidade":sortMode==="rfv"?" — por relevância":""}{syncing&&` (${syncMsg})`}</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={onCheckin} onOut={handleOut} onEdit={handleEdit} onPerson={handlePerson} onQuick={onQuick} onInfo={handleInfo} ldId={ldId} plocs={plocs} lastVisit={lastVisits[o.id]||null} lastOrder={null/*TODO: Dashboard Phase 2*/} nearRoad={nearRoad}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc})</button>}
          <button onClick={()=>{const rows=[["Nome","CNPJ","Endereço","Bairro","Cidade","UF","Categoria","Segmento","Produtos","Responsável","Grupo","Dt Última Visita","Visitado por","Dias s/ Visita"]];fo.forEach(o=>{const lv=lastVisits[o.id];const dias=lv?Math.floor((Date.now()-new Date(lv.time))/86400000):"";rows.push([o.name,o.cnpj||"",`${o.addr?.street||""} ${o.addr?.number||""}`.trim(),o.addr?.district||"",o.addr?.city_name||o.addr?.city||"",o.addr?.state||"",o.cat||"",o.sector||"",o.products||"",o.owner||"",o.grupo?.replace("Grupo: ","")||"",lv?fD(lv.time):"Sem visita",lv?lv.who:"",dias]);});csv(rows,`clientes-filtrados-${fD(new Date())}.csv`);}} style={{width:"100%",marginTop:8,padding:12,fontSize:13,background:S.pri+"22",border:`1px solid ${S.pri}55`,color:S.pl,fontWeight:500}}>📊 Exportar {fo.length} clientes (Excel)</button>
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={async()=>{try{const d=await agF(`/organizations?cnpj=${search.replace(/[.\-\/]/g,"")}`,token);if(d.data?.length)setOrgs(p=>{const ids=new Set(p.map(o=>o.id));return[...d.data.map(strip).filter(f=>!ids.has(f.id)),...p];});}catch(e){console.warn("cnpjSearch:",e);}}} style={{width:"100%",marginTop:8,padding:14,background:S.acc,border:"none",fontWeight:500}}>Buscar CNPJ no Agendor</button>}
        </>}
      </div>);
}

export { PdvsTab };
