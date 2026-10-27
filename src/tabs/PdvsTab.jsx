// TeamCheck — aba PdvsTab
import { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { PG, toLocalDate, todayLocal, CATS, CANAIS, CC, USERS, SECTORS, BRANDS, geoEstimate, S, fD, fDS, hav, DASH, gps, roadKm, csv, fixMojibake, normBusca } from "../lib";
import { OrgCard, MultiSelect, DateField } from "../components";

const MARCAS_TODAS=["TRAMONTINA","PADO","Zagonel","Ruvolo","Santana","Festcolor","Plastilit","Hiper Têxtil"];
function PdvsTab({visible,orgs,allOrgs,setOrgs,visits,plocs,active,ldId,geoErr,user,token,syncing,syncMsg,onSync,onCheckin,onCheckout,onEdit,onPerson,onQuick,onOpenFicha,focusReq,rfv,excl,pendMapa,prospDe}){
  const[search,setSearch]=useState("");
  // Todos os filtros de seleção são multi-seleção (combináveis). Vazio = todos.
  const[catSel,setCatSel]=useState([]);const[citySel,setCitySel]=useState([]);const[ufSel,setUfSel]=useState([]);const[segSel,setSegSel]=useState([]);const[ownerSel,setOwnerSel]=useState(()=>user?.name?[user.name]:[]);/* v43: Responsável já abre no usuário logado */const[grupoSel,setGrupoSel]=useState([]);
  const[fRfv,setFRfv]=useState([]);const[fSr,setFSr]=useState([]);const[fInd,setFInd]=useState([]);const[fSit,setFSit]=useState([]);/* v95: situação na marca */const[canalSel,setCanalSel]=useState([]);
  const[visitMode,setVisitMode]=useState("all");const[visitFrom,setVisitFrom]=useState(()=>{const d=new Date();d.setDate(d.getDate()-30);return toLocalDate(d);});const[visitTo,setVisitTo]=useState(todayLocal);
  const[nearMe,setNearMe]=useState(null);const[nearLoading,setNearLoading]=useState(false);const[nearRoad,setNearRoad]=useState({});const[sortMode,setSortMode]=useState("alpha");
  const[vc,setVc]=useState(PG);
  const[filtAberto,setFiltAberto]=useState(false);
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
    if(canalSel.length)list=list.filter(o=>canalSel.includes(o.canal||"Presencial"));
    // v93: Indústria = marcas que o cliente COMPRA ou está em PROSPECÇÃO (marcada no check-out)
    if(fRfv.length||fSr.length||fInd.length||fSit.length){list=list.filter(o=>{const r=rfvDe(o);
      if((fRfv.length||fSr.length)&&!r)return false;if(fRfv.length&&!fRfv.includes(r.rfv))return false;if(fSr.length&&!fSr.includes(r.status))return false;
      // v95: Indústria × "Situação na marca" (Compra / Prospecção). Sem indústria escolhida = qualquer marca.
      if(fInd.length||fSit.length){const marcas=fInd.length?fInd:MARCAS_TODAS;
        const compra=String(r?.inds||"").split(",").some(i=>marcas.includes(i.trim()));const pr=prospDe?prospDe(o).some(x=>marcas.includes(x.industria)):false;
        const querC=!fSit.length||fSit.includes("Compra"),querP=!fSit.length||fSit.includes("Prospecção");
        if(!((querC&&compra)||(querP&&pr)))return false;}
      return true;});}
    if(search.trim()){const q=normBusca(search).replace(/[.\-\/]/g,"");const casa=o=>normBusca([o.name,o.nickname,o.legalName,o.cnpj?.replace(/[.\-\/]/g,""),o.addr?.city,o.addr?.city_name,o.addr?.district,o.addr?.state,o.cat,o.sector,o.products,o.people].filter(Boolean).join(" ")).replace(/[.\-\/]/g,"").includes(q);list=list.filter(casa);}
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
  },[orgs,search,catSel,citySel,ufSel,segSel,ownerSel,grupoSel,canalSel,visitMode,visitFrom,visitTo,visitsByOrg,lastVisits,nearMe,plocs,sortMode,rfvDe,fRfv,fSr,fInd,fSit,excl,prospDe]);

  useEffect(()=>{
    if(sortMode!=="near"||!nearMe||!fo.length)return;
    let cancelled=false;
    (async()=>{const top=fo.filter(o=>o.dist!=null).slice(0,10);const roads={};
      for(const o of top){if(plocs[o.id]){const r=await roadKm(nearMe.lat,nearMe.lng,plocs[o.id].lat,plocs[o.id].lng);if(!cancelled)roads[o.id]=r.km;}}
      if(!cancelled)setNearRoad(roads);
    })();return()=>{cancelled=true;};
  },[sortMode,nearMe,fo.slice(0,10).map(o=>o.id).join()]);

  // etiquetas dos filtros ativos (cada uma remove o próprio valor)
  const chips=useMemo(()=>{const out=[];const add=(arr,set,pref="")=>arr.forEach(v=>out.push({k:pref+v,l:pref+v,tira:()=>{set(p=>p.filter(x=>x!==v));setVc(PG);}}));
    add(catSel,setCatSel);add(ownerSel,setOwnerSel,"Resp.: ");add(ufSel,setUfSel);add(citySel,setCitySel);add(segSel,setSegSel);add(grupoSel,setGrupoSel,"Grupo: ");add(canalSel,setCanalSel);add(fRfv,setFRfv,"RFV: ");add(fSr,setFSr,"Recompra: ");add(fInd,setFInd);add(fSit,setFSit,"Situação: ");
    if(visitMode!=="all")out.push({k:"vm",l:`${visitMode==="visited"?"Visitados":"Sem visita"} ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")}`,tira:()=>{setVisitMode("all");setVc(PG);}});
    return out.map(c=>({...c,l:c.l.replace(/^(Resp\.: )(\S+).*/,"$1$2")}));},[catSel,ownerSel,ufSel,citySel,segSel,grupoSel,canalSel,fRfv,fSr,fInd,fSit,visitMode,visitFrom,visitTo]);
  const limparTudo=()=>{setCatSel([]);setCitySel([]);setUfSel([]);setSegSel([]);setOwnerSel([]);setGrupoSel([]);setCanalSel([]);setFRfv([]);setFSr([]);setFInd([]);setFSit([]);setVisitMode("all");setSearch("");setSortMode("alpha");setNearMe(null);setVc(PG);};
  useEffect(()=>{if(!focusReq)return;setSearch("");setCatSel([]);setVisitMode("all");setVc(PG);const t=setTimeout(()=>{const el=document.getElementById("org-"+focusReq.id);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});else if(focusReq.name)setSearch(focusReq.name);},200);return()=>clearTimeout(t);},[focusReq]);
  const handleOut=useCallback(o2=>onCheckout(o2),[onCheckout]);
  const handleEdit=useCallback(o2=>onEdit(o2),[onEdit]);
  const handlePerson=useCallback(o2=>onPerson(o2),[onPerson]);
  // cidades disponíveis conforme UF selecionada (filtros combinam entre si)
  const cityOpts=useMemo(()=>ufSel.length?cities.filter(c=>orgs.some(o=>(o.addr?.city_name||o.addr?.city)===c&&ufSel.includes(o.addr?.state))):cities,[cities,ufSel,orgs]);
  return(<div style={{display:visible?"block":"none"}}>
        {/* ── v74: busca + "Filtros · N" recolhido + etiquetas dos filtros ativos ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:S.card,border:`1px solid ${S.brd}`,borderRadius:8,padding:"0 12px",height:46,marginBottom:10}}>
          <Search size={17} strokeWidth={1.8} color="var(--t3)" style={{flexShrink:0}}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setVc(PG);}} placeholder="Nome, CNPJ, cidade, bairro, segmento" aria-label="Buscar cliente" style={{flex:1,minWidth:0,border:"none",background:"transparent",padding:0,fontSize:15}}/>
          {search&&<button onClick={()=>{setSearch("");setVc(PG);}} aria-label="Limpar busca" style={{border:"none",padding:4,color:S.ts,display:"flex"}}><X size={16}/></button>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",overflowX:"auto",paddingBottom:2,marginBottom:filtAberto?10:6}}>
          <button onClick={()=>setFiltAberto(v=>!v)} aria-expanded={filtAberto} style={{flexShrink:0,height:36,padding:"0 12px",borderRadius:18,display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,border:`1px solid ${filtAberto||chips.length?S.txt:S.inpBdr}`,background:filtAberto||chips.length?S.txt:"transparent",color:filtAberto||chips.length?S.bg:S.txt}}><SlidersHorizontal size={14} strokeWidth={2}/>Filtros{chips.length?` · ${chips.length}`:""}</button>
          {chips.map(c=><button key={c.k} onClick={c.tira} title="Remover filtro" style={{flexShrink:0,height:36,padding:"0 10px 0 12px",borderRadius:18,display:"flex",alignItems:"center",gap:6,fontSize:13,border:`1px solid ${S.inpBdr}`,background:"transparent",color:S.txt,whiteSpace:"nowrap"}}>{c.l}<X size={12} strokeWidth={2.2} color="var(--t3)"/></button>)}
          {chips.length>1&&<button onClick={limparTudo} style={{flexShrink:0,height:36,padding:"0 8px",border:"none",background:"transparent",color:S.ts,fontSize:13}}>Limpar</button>}
        </div>
        {filtAberto&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:10,padding:12,marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
            <MultiSelect values={catSel} onChange={v=>{setCatSel(v);setVc(PG);}} placeholder="Status" allLabel="Todos" colorFor={c=>CC[c]||S.pri} options={CATS}/>
            <MultiSelect values={ownerSel} onChange={v=>{setOwnerSel(v);setVc(PG);}} placeholder="Responsável" allLabel="Todos" options={owners}/>
            <MultiSelect values={ufSel} onChange={v=>{setUfSel(v);setCitySel([]);setVc(PG);}} placeholder="UF" allLabel="Todas" options={states}/>
            <MultiSelect values={citySel} onChange={v=>{setCitySel(v);setVc(PG);}} placeholder="Cidade" allLabel="Todas" options={cityOpts}/>
            <MultiSelect values={segSel} onChange={v=>{setSegSel(v);setVc(PG);}} placeholder="Segmento" allLabel="Todos" options={segments}/>
            <MultiSelect values={grupoSel} onChange={v=>{setGrupoSel(v);setVc(PG);}} placeholder="Grupo" allLabel="Todos" options={grupos}/>
            <MultiSelect values={canalSel} onChange={v=>{setCanalSel(v);setVc(PG);}} placeholder="Canal" allLabel="Todos" options={CANAIS}/>
            <MultiSelect values={fRfv} onChange={v=>{setFRfv(v);setVc(PG);}} placeholder="Classe RFV" allLabel="Todas" options={["Campeão","Leal","Em Crescimento","Em Risco","Inativo"]}/>
            <MultiSelect values={fSr} onChange={v=>{setFSr(v);setVc(PG);}} placeholder="Recompra" allLabel="Todos" options={["Em Dia","Momento de Recompra","Atrasado"]}/>
            <MultiSelect values={fInd} onChange={v=>{setFInd(v);setVc(PG);}} placeholder="Indústria" allLabel="Todas" options={MARCAS_TODAS}/>
            <MultiSelect values={fSit} onChange={v=>{setFSit(v);setVc(PG);}} placeholder="Situação na marca" allLabel="Todas" options={["Compra","Prospecção"]}/>
          </div>
          <div>
            <p style={{fontSize:12.5,color:S.t2,margin:"0 0 6px"}}>Visitas</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["not_visited","Sem visita"],["visited","Visitados"]].map(([m,l])=><button key={m} onClick={()=>{setVisitMode(visitMode===m?"all":m);setVc(PG);}} style={{height:36,padding:"0 12px",fontSize:13,borderRadius:8,border:`1px solid ${visitMode===m?S.txt:S.inpBdr}`,background:visitMode===m?S.txt:"transparent",color:visitMode===m?S.bg:S.t2,fontWeight:visitMode===m?600:400}}>{l}</button>)}
              {[30,60,90].map(n=><button key={n} onClick={()=>{const d=new Date();d.setDate(d.getDate()-n);setVisitFrom(toLocalDate(d));setVisitTo(todayLocal());setVisitMode("not_visited");setVc(PG);}} style={{height:36,padding:"0 12px",fontSize:13,borderRadius:8,border:`1px solid ${S.inpBdr}`,background:"transparent",color:S.t2}}>sem visita {n}d+</button>)}
            </div>
            {visitMode!=="all"&&<div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
              <DateField value={visitFrom} onChange={v=>{setVisitFrom(v);setVc(PG);}} today={todayLocal()} placeholder="De" style={{flex:1}}/>
              <span style={{color:S.ts,fontSize:12}}>a</span>
              <DateField value={visitTo} onChange={v=>{setVisitTo(v);setVc(PG);}} today={todayLocal()} placeholder="Até" style={{flex:1}}/>
            </div>}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
            <button onClick={limparTudo} style={{height:40,padding:"0 14px",fontSize:13.5,color:S.t2}}>Limpar tudo</button>
            <button onClick={()=>setFiltAberto(false)} style={{height:40,padding:"0 18px",fontSize:13.5,fontWeight:600,background:S.pri,border:"none",color:"#fff"}}>Ver {fo.length} clientes</button>
          </div>
        </div>}
        {geoErr&&<p style={{fontSize:12,color:S.dng,margin:"0 0 8px"}}>{geoErr}</p>}
        {syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"3rem 0"}}><div style={{width:36,height:36,border:`3px solid ${S.brd}`,borderTopColor:S.pri,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/><p style={{color:S.ts}}>{syncMsg}</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
        {!syncing&&!orgs.length&&<div style={{textAlign:"center",padding:"2rem 0"}}><button onClick={()=>onSync()} style={{width:"100%",padding:16,fontSize:16,fontWeight:600,background:S.pri,border:"none",borderRadius:12}}>Sincronizar Clientes</button></div>}
        {orgs.length>0&&<><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"6px 2px 4px",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,color:S.t2}}><b className="num" style={{color:S.txt,fontWeight:600}}>{fo.length}</b> de {orgs.length} pontos{visitMode==="not_visited"?` · sem visita ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")}`:visitMode==="visited"?` · visitados ${fDS(visitFrom+"T12:00")}→${fDS(visitTo+"T12:00")}`:""}{syncing&&` (${syncMsg})`}</span>
          <div role="group" aria-label="Ordenar" style={{display:"flex",border:`1px solid ${S.inpBdr}`,borderRadius:8,overflow:"hidden"}}>
            {[["alpha","A–Z"],["near",nearLoading?"…":"Perto"],["rfv","RFV"]].map(([m,l],i)=><button key={m} aria-pressed={sortMode===m} onClick={async()=>{if(m==="near"){if(sortMode==="near"){setSortMode("alpha");setNearMe(null);return;}setNearLoading(true);try{const g=await gps();setNearMe(g);setSortMode("near");setVc(PG);}catch{alert("GPS indisponível");}setNearLoading(false);return;}setSortMode(m);setNearMe(null);setVc(PG);}} style={{height:34,padding:"0 12px",fontSize:12.5,border:"none",borderLeft:i?`1px solid ${S.inpBdr}`:"none",borderRadius:0,background:sortMode===m?S.cl:"transparent",color:sortMode===m?S.txt:S.ts,fontWeight:sortMode===m?600:400,display:"flex",alignItems:"center",gap:5}}>{m==="near"&&<MapPin size={13} strokeWidth={1.9}/>}{l}</button>)}
          </div>
        </div>
          <div style={{display:"flex",flexDirection:"column"}}>{fo.slice(0,vc).map(o=><OrgCard key={o.id} org={o} active={active} onIn={onCheckin} onOut={handleOut} onEdit={handleEdit} onPerson={handlePerson} onQuick={onQuick} onOpen={onOpenFicha} ldId={ldId} plocs={plocs} lastVisit={lastVisits[o.id]||null} rfvInfo={rfvDe(o)} lastOrder={null} nearRoad={nearRoad} pend={pendMapa?.[o.id]||null} prosp={prospDe?prospDe(o).map(x=>x.industria):null}/>)}</div>
          {vc<fo.length&&<button onClick={()=>setVc(p=>p+PG)} style={{width:"100%",marginTop:12,padding:14,fontSize:14,fontWeight:500}}>Ver mais ({fo.length-vc})</button>}
          <button onClick={()=>{const rows=[["Nome","CNPJ","Endereço","Bairro","Cidade","UF","Categoria","Canal","Segmento","Produtos","Responsável","Grupo","Dt Última Visita","Visitado por","Dias s/ Visita","Classe RFV","Status Recompra","Última Compra","Fat. 12m","Marcas que compra","Prospecção"]];fo.forEach(o=>{const lv=lastVisits[o.id];const dias=lv?Math.floor((Date.now()-new Date(lv.time))/86400000):"";const rv=rfvDe(o);rows.push([o.name,o.cnpj||"",`${o.addr?.street||""} ${o.addr?.number||""}`.trim(),o.addr?.district||"",o.addr?.city_name||o.addr?.city||"",o.addr?.state||"",o.cat||"",o.canal||"Presencial",o.sector||"",o.products||"",o.owner||"",o.grupo?.replace("Grupo: ","")||"",lv?fD(lv.time):"Sem visita",lv?lv.who:"",dias,rv?rv.rfv:"",rv?rv.status:"",rv&&rv.ultima?fD(rv.ultima+"T12:00"):"",rv?rv.fat12m:"",rv?String(rv.inds||"").split(",").map(x=>x.trim()).filter(Boolean).join(", "):"",prospDe?prospDe(o).map(x=>x.industria).join(", "):""]);});csv(rows,`clientes-filtrados-${fD(new Date())}.csv`);}} style={{width:"100%",marginTop:10,height:44,fontSize:13.5,color:S.t2}}>Exportar {fo.length} clientes (Excel)</button>
          {search.replace(/[.\-\/]/g,"").length>=11&&fo.length===0&&<button onClick={async()=>{try{const r=await fetch(`${DASH}/api/crm/clientes?q=${search.replace(/[.\-\/]/g,"")}&limit=20`,{headers:{"X-Session":token},cache:"no-store"});const d=await r.json();if(d&&d.ok&&d.clientes?.length)setOrgs(p=>{const ids=new Set(p.map(o=>o.id));return[...d.clientes.filter(f=>!ids.has(f.id)),...p];});}catch(e){console.warn("cnpjSearch:",e);}}} style={{width:"100%",marginTop:8,padding:14,background:S.acc,border:"none",fontWeight:500}}>Buscar CNPJ no cadastro</button>}
        </>}
      </div>);
}

export { PdvsTab };
