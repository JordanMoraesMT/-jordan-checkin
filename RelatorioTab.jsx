// TeamCheck — aba PdvsTab
import { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Trophy, Search } from "lucide-react";
import { PG, toLocalDate, todayLocal, CATS, CC, USERS, SECTORS, BRANDS, geoEstimate, S, fD, fDS, hav, DASH, gps, roadKm, csv, fixMojibake } from "../lib";
import { OrgCard, MultiSelect, DateField } from "../components";

function PdvsTab({visible,orgs,allOrgs,setOrgs,visits,plocs,active,ldId,geoErr,user,token,syncing,syncMsg,onSync,onCheckin,onCheckout,onEdit,onPerson,onQuick,onOpenFicha,focusReq,rfv,excl}){
  const[search,setSearch]=useState("");
  // Todos os filtros de seleção são multi-seleção (combináveis). Vazio = todos.
  const[catSel,setCatSel]=useState([]);const[citySel,setCitySel]=useState([]);const[ufSel,setUfSel]=useState([]);const[segSel,setSegSel]=useState([]);const[ownerSel,setOwnerSel]=useState([]);const[grupoSel,setGrupoSel]=useState([]);
  const[fRfv,setFRfv]=useState([]);const[fSr,setFSr]=useState([]);const[fInd,setFInd]=useState([]);
  const[visitMode,setVisitMode]=useState("all");const[visitFrom,setVisitFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});const[visitTo,setVisitTo]=useState(todayLocal);
  const[nearMe,setNearMe]=useState(null);const[nearLoading,setNearLoading]=useState(false);const[nearRoad,setNearRoad]=useState({});const[sortMode,setSortMode]=useState("alpha");
  const[vc,setVc]=useState(PG);
  // Matriz RFV consolidada (D1): resolve por CNPJ (normalizado) ou org_id
  const rfvDe=useCallback(o=>{if(!rfv)return null;const k=(o.cnpj||"").replace(/\D/g,"");if(k&&rfv.byCnpj[k.padStart(14,"0")])return rfv.byCnpj[k.padStart(14,"0")];return rfv.byOrg[o.id]||null;},[rfv]);
  const cities=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const c=o.addr?.city_name||o.addr?.city;if(c)s.add(c);});return[...s].sort();},[orgs]);
  const states=useMemo(()=>{const s=new Set();orgs.forEach(o=>{if(o.addr?.state)s.add(o.addr.state);});return[...s].sort();},[orgs]);
  const segments=useMemo(()=>{const s=new Set(SECTORS.map(x=>x.n));orgs.forEach(o=>{if(o.sector)s.add(o.sector);});return[...s].sort();},[orgs]);
  const owners=useMemo(()=>{const s=new Set(USERS.map(u=>u.n));orgs.forEach(o=>{if(o.owner)s.add(o.owner);});return[...s].sort();},[orgs]);
  const grupos=useMemo(()=>{const s=new Set();orgs.forEach(o=>{const g=fixMojibake((o.grupo||"").replace("Grupo: ","").trim());if(g)s.add(g);});return[...s].sort();},[orgs]);
  const lastVisits=useMemo(()=>{const m={};visits.forEach(v=>{if(v.checkoutTime&&(!m[v.orgId]||v.checkinTime>m[v.orgId].time))m[v.orgId]={time:v.checkinTime,who:v.userName||user?.name||""};});return m;},[visits]);
  const visitsByOrg=useMemo(()=>{const m={};visits.forEach(v=>{if(v.checkoutTime){if(!m[v.orgId])m[v.orgId]=[];m[v.orgId].push({time:v.checkinTime,who:v.userName||""});}});return m;},[visits]);

  const fo=useMemo(()=>{let list=orgs;
    if(catSel.length)list=list.filter(o=>catSel.includes(o.cat));
    if(ufSel.length)list=list.filter(o=>ufSel.includes(o.addr?.state));
    if(citySel.length)list=list.filter(o=>citySel.includes(o.addr?.city_name||o.addr?.city));
    if(segSel.length)list=list.filter(o=>segSel.includes(o.sector));
    if(ownerSel.length)list=list.filter(o=>ownerSel.includes(o.owner));
    if(grupoSel.length)list=list.filter(o=>grupoSel.includes((o.grupo||"").replace("Grupo: ","")));
    if(visitMode==="visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return false;return vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"";const lb=lastVisits[b.id]?.time||"";return lb.localeCompare(la);});}
    if(visitMode==="not_visited"){list=list.filter(o=>{const vl=visitsByOrg[o.id];if(!vl)return true;return !vl.some(v=>{const d=toLocalDate(v.time);return d>=visitFrom&&d<=visitTo;});});
      list=list.sort((a,b)=>{const la=lastVisits[a.id]?.time||"0";const lb=lastVisits[b.id]?.time||"0";return la.localeCompare(lb);});}
    if(fRfv.length||fSr.length||fInd.length){list=list.filter(o=>{const r=rfvDe(o);if(!r)return false;if(fRfv.length&&!fRfv.includes(r.rfv))return false;if(fSr.length&&!fSr.includes(r.status))return false;if(fInd.length&&!(r.inds||"").split(",").some(i=>fInd.includes(i.trim())))return false;return true;});}
    if(search.trim()){const q=search.toLowerCase().replace(/[.\-\/]/g,"");const casa=o=>[o.name,o.nickname,o.legalName,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ").toLowerCase().replace(/[.\-\/]/g,"").includes(q);list=list.filter(casa);}
    if(sortMode==="near"&&nearMe){
      const withGPS=list.filter(o=>plocs[o.id]).map(o=>({...o,dist:hav(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng),distType:"gps"}));
      const noGPS=list.filter(o=>!plocs[o.id]).map(o=>{const geo=geoEstimate(o);if(geo)return{...o,dist:hav(nearMe.lat,nearMe.lng,geo[0],geo[1]),distType:"bairro"};return{...o,dist:9999,distType:"sem_ref"};});
      withGPS.sort((a,b)=>a.dist-b.dist);noGPS.sort((a,b)=>a.dist-b.dist);
      list=[...withGPS,...noGPS];
    }else if(sortMode==="rfv"){
      const ORD={"Campeão":5,"Leal":4,"Em Crescimento":3,"Em Risco":2,"Inativo":1};
      list=list.map(o=>({o,r:rfvDe(o)})).sort((a,b)=>{
        if(!!a.r!==!!b.r)return a.r?-1:1;
        if(!a.r&&!b.r)return (a.o.name||"").localeCompare(b.o.name||"");
        return (ORD[b.r.rfv]||0)-(ORD[a.r.rfv]||0)||(b.r.score||0)-(a.r.score||0)||(b.r.total||0)-(a.r.total||0);
      }).map(x=>x.o);
    }else{list=list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));}
    return list;
  },[orgs,search,catSel,citySel,ufSel,segSel,ownerSel,grupoSel,visitMode,visitFrom,visitTo,visitsByOrg,lastVisits,nearMe,plocs,sortMode,rfvDe,fRfv,fSr,fInd,excl]);

  useEffect(()=>{
    if(sortMode!=="near"||!nearMe||!fo.length)return;
    let cancelled=false;
    (async()=>{const top=fo.filter(o=>o.dist!=null).slice(0,10);const roads={};
      for(const o of top){if(plocs[o.id]){const r=await roadKm(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng);if(!cancelled)roads[o.id]=r.km;}}
      if(!cancelled)setNearRoad(roads);
    })();return()=>{cancelled=true;};
  },[sortMode,nearMe,fo.slice(0,10).map(o=>o.id).join()]);

  const limparTudo=()=>{setCatSel([]);setCitySel([]);setUfSel([]);setSegSel([]);setOwnerSel([]);setGrupoSel([]);setFRfv([]);setFSr([]);setFInd([]);setVisitMode("all");setSearch("");setSortMode("alpha");setNearMe(null);setVc(PG);};
  useEffect(()=>{if(!focusReq)return;setSearch("");setCatSel([]);setVisitMode("all");setVc(PG);const t=setTimeout(()=>{const el=document.getElementById("org-"+focusReq.id);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});else if(focusReq.name)setSearch(focusReq.name);},200);return()=>clearTimeout(t);},[focusReq]);
  const handleOut=useCallback(o2=>onCheckout(o2),[onCheckout]);
  const handleEdit=useCallback(o2=>onEdit(o2),[onEdit]);
  const handlePerson=useCallback(o2=>onPerson(o2),[onPerson]);
  // cidades disponíveis conforme UF selecionada (filtros combinam entre si)
  const cityOpts=useMemo(()=>ufSel.length?cities.filter(c=>orgs.some(o=>(o.addr?.city_name||o.addr?.city)===c&&ufSel.includes(o.addr?.state))):cities,[cities,ufSel,orgs]);
  return(<div style={{display:visible?"block":"none"}}>
        {/* ── Card de filtros (padrão Dashboard/mockup) ── */}
        <div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"14px 14px 12px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:S.inp,border:`1px solid ${S.inpBdr}`,borderRadius:10,padding:"2px 12px",marginBottom:11}}>
          <Search size={16} strokeWidth={1.9} color="var(--t4)" style={{flexShrink:0}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, razão social, CNPJ, cidade, segmento…" style={{flex:1,border:"none",background:"transparent",padding:"9px 0"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:11,alignItems:"center",flexWrap:"wrap"}}>
          <MultiSelect values={catSel} onChange={v=>{setCatSel(v);setVc(PG);}} placeholder="Status" allLabel="Todos" style={{flex:1,minWidth:200}} colorFor={c=>CC[c]||S.pri} options={CATS}/>
          <button onClick={limparTudo} style={{padding:"8px 13px",fontSize:12,border:`1px solid ${S.dng}44`,color:S.dng,borderRadius:10,background:"transparent",whiteSpace:"nowrap",cursor:"pointer"}}>✕ Limpar</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:11}}>
          <MultiSelect values={ufSel} onChange={v=>{setUfSel(v);setCitySel([]);setVc(PG);}} placeholder="UF" allLabel="Todas" options={states}/>
          <MultiSelect values={citySel} onChange={v=>{setCitySel(v);setVc(PG);}} placeholder="Cidade" allLabel="Todas" options={cityOpts}/>
          <MultiSelect values={segSel} onChange={v=>{setSegSel(v);setVc(PG);}} placeholder="Segmento" allLabel="Todos" options={segments}/>
          <MultiSelect values={ownerSel} onChange={v=>{setOwnerSel(v);setVc(PG);}} placeholder="Responsável" allLabel="Todos" options={owners}/>
          <MultiSelect values={grupoSel} onChange={v=>{setGrupoSel(v);setVc(PG);}} placeholder="Grupo" allLabel="Todos" options={grupos}/>
          <MultiSelect values={fRfv} onChange={v=>{setFRfv(v);setVc(PG);}} placeholder="Classe RFV" allLabel="Todas" options={["Campeão","Leal","Em Crescimento","Em Risco","Inativo"]}/>
          <MultiSelect values={fSr} onChange={v=>{setFSr(v);setVc(PG);}} placeholder="Recompra" allLabel="Todos" options={["Em Dia","Momento de Recompra","Atrasado"]}/>
          <MultiSelect values={fInd} onChange={v=>{setFInd(v);setVc(PG);}} placeholder="Indústria" allLabel="Todas" options={["TRAMONTINA","PADO","Zagonel","Ruvolo","Santana","Festcolor","Plastilit","Hiper Têxtil"]}/>
        </div>
        {/* Filtro por visita (período) */}
        <div style={{display:"flex",gap:6,marginBottom:visitMode!=="all"?8:11,flexWrap:"wrap"}}>
          <button onClick={()=>{setVisitMode(visitMode==="all"?"not_visited":"all");setVc(PG);}} style={{padding:"6px 12px",fontSize:11.5,whiteSpace:"nowrap",border:`1px solid ${visitMode==="not_visited"?S.gold:S.inpBdr}`,color:visitMode==="not_visited"?S.gold:S.ts,background:visitMode==="not_visited"?S.gold+"18":S.inp,borderRadius:8,fontWeight:visitMode==="not_visited"?600:400,cursor:"pointer"}}>Sem visita</button>
          <button onClick={()=>{setVisitMode(visitMode==="all"?"visited":"all");setVc(PG);}} style={{padding:"6px 12px",fontSize:11.5,whiteSpace:"nowrap",border:`1px solid ${visitMode==="visited"?S.acc:S.inpBdr}`,color:visitMode==="visited"?S.acc:S.ts,background:visitMode==="visited"?S.acc+"18":S.inp,borderRadius:8,fontWeight:visitMode==="visited"?600:400,cursor:"pointer"}}>Visitados</button>
          {[30,60,90].map(n=><button key={n} onClick={()=>{const d=new Date();d.setDate(d.getDate()-n);setVisitFrom(toLocalDate(d));setVisitTo(todayLocal());setVisitMode("not_visited");setVc(PG);}} style={{padding:"6px 12px",fontSize:11.5,border:`1px solid ${S.inpBdr}`,color:S.ts,borderRadius:8,background:S.inp,cursor:"pointer"}}>{n}d</button>)}
        </div>
        {visitMode!=="all"&&<div style={{display:"flex",gap:6,marginBottom:11,alignItems:"center"}}>
          <DateField value={visitFrom} onChange={v=>{setVisitFrom(v);setVc(PG);}} today={todayLocal()} placeholder="De" style={{flex:1}}/>
          <span style={{color:S.td,fontSize:11}}>a</span>
          <DateField value={visitTo} onChange={v=>{setVisitTo(v);setVc(PG);}} today={todayLocal()} placeholder="Até" style={{flex:1}}/>
          <button onClick={()=>{setVisitMode("all");setVc(PG);}} style={{padding:"6px 10px",fontSize:11,color:S.dng,border:`1px solid ${S.dng}44`,borderRadius:8,background:"transparent"}}>✕</button>
        </div>}
        {/* Ordenação */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setSortMode("alpha");setNearMe(null);setVc(PG);}} style={{flex:1,textAlign:"center",padding:9,borderRadius:9,fontSize:12.5,fontWeight:sortMode==="alpha"?600:500,background:sortMode==="alpha"?S.cl:"transparent",color:sortMode==="alpha"?S.pl:S.ts,border:`1px solid ${sortMode==="alpha"?S.brd:S.inpBdr}`,cursor:"pointer"}}>A → Z</button>
          <button onClick={async()=>{if(sortMode==="near"){setSortMode("alpha");setNearMe(null);return;}setNearLoading(true);try{const g=await gps();setNearMe(g);setSortMode("near");setVc(PG);}catch{alert("GPS indisponivel");}setNearLoading(false);}} style={{flex:1.5,textAlign:"center",padding:9,borderRadius:9,fontSize:12.5,fontWeight:sortMode==="near"?600:500,background:sortMode==="near"?S.acc+"18":"transparent",color:sortMode==="near"?S.acc:S.ts,border:`1px solid ${sortMode==="near"?S.acc:S.inpBdr}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><MapPin size={14} strokeWidth={1.9} color={sortMode==="near"?S.acc:S.pl}/>{nearLoading?"Localizando...":sortMode==="near"?"Próximos (ativo)":"Onde estou"}</button>
          <button onClick={()=>{setSortMode("rfv");setNearMe(null);setVc(PG);}} style={{flex:1,textAlign:"center",padding:9,borderRadius:9,fontSize:12.5,fontWeight:sortMode==="rfv"?600:500,background:sortMode==="rfv"?S.gold+"18":"transparent",color:sortMode==="rfv"?S.gold:S.ts,border:`1px solid ${sortMode==="rfv"?S.gold:S.inpBdr}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Trophy size={14} strokeWidth={1.9}/>RFV</button>
        </div>
        </div>
        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}
        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><button onClick={()=>onSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}
        {orgs.length>0&&<><div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",margin:"0 4px 12px",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:12.5,color:S.ts,fontWeight:500}}>Exibindo <b style={{color:S.txt}}>{fo.length}</b> de {orgs.length} pontos de venda{visitMode==="not_visited"?` · sem visita ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")}`:visitMode==="visited"?` · visitados ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")}`:""}{syncing&&` (${syncMsg})`}</span>
          <span style={{fontSize:11.5,color:S.td}}>{sortMode==="near"?"por proximidade":sortMode==="rfv"?(rfv?"Matriz RFV (Campeão → Inativo)":"Matriz RFV indisponível (A→Z)"):"ordenado A → Z"}</span>
        </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={onCheckin} onOut={handleOut} onEdit={handleEdit} onPerson={handlePerson} onQuick={onQuick} onOpen={onOpenFicha} ldId={ldId} plocs={plocs} lastVisit={lastVisits[o.id]||null} rfvInfo={rfvDe(o)} lastOrder={null} nearRoad={nearRoad}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc})</button>}
          <button onClick={()=>{const rows=[["Nome","CNPJ","Endereço","Bairro","Cidade","UF","Categoria","Segmento","Produtos","Responsável","Grupo","Dt Última Visita","Visitado por","Dias s/ Visita","Classe RFV","Status Recompra","Última Compra","Fat. 12m"]];fo.forEach(o=>{const lv=lastVisits[o.id];const dias=lv?Math.floor((Date.now()-new Date(lv.time))/86400000):"";const rv=rfvDe(o);rows.push([o.name,o.cnpj||"",`${o.addr?.street||""} ${o.addr?.number||""}`.trim(),o.addr?.district||"",o.addr?.city_name||o.addr?.city||"",o.addr?.state||"",o.cat||"",o.sector||"",o.products||"",o.owner||"",o.grupo?.replace("Grupo: ","")||"",lv?fD(lv.time):"Sem visita",lv?lv.who:"",dias,rv?rv.rfv:"",rv?rv.status:"",rv&&rv.ultima?fD(rv.ultima+"T12:00"):"",rv?rv.fat12m:""]);});csv(rows,`clientes-filtrados-${fD(new Date())}.csv`);}} style={{width:"100%",marginTop:8,padding:12,fontSize:13,background:S.pri+"22",border:`1px solid ${S.pri}55`,color:S.pl,fontWeight:500}}>📊 Exportar {fo.length} clientes (Excel)</button>
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={async()=>{try{const r=await fetch(`${DASH}/api/crm/clientes?q=${search.replace(/[.\-\/]/g,"")}&limit=20`,{headers:{"X-Session":token},cache:"no-store"});const d=await r.json();if(d&&d.ok&&d.clientes?.length)setOrgs(p=>{const ids=new Set(p.map(o=>o.id));return[...d.clientes.filter(f=>!ids.has(f.id)),...p];});}catch(e){console.warn("cnpjSearch:",e);}}} style={{width:"100%",marginTop:8,padding:14,background:S.acc,border:"none",fontWeight:500}}>Buscar CNPJ no cadastro</button>}
        </>}
      </div>);
}

export { PdvsTab };
