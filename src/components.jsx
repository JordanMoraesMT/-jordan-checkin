// TeamCheck — componentes compartilhados (login, card, banner, modais)
import { useState, useEffect, useMemo, memo } from "react";
import { BarChart3, LogIn, LogOut, MessageCircle, Phone, Navigation, Info, Pencil, UserPlus } from "lucide-react";
import { API, HOMES, todayLocal, TYPES, BRANDS, SECTORS, CAT_IDS, ORIGINS, CC, S, fT, fD, mins, hrsMin, hav, sL, sS, agF, agErr, postTask, gps, fixMojibake, strip, fetchCNPJ, MIN_OBS } from "./lib";

const LB=({t,children})=><div style={{marginBottom:6}}><p style={{fontSize:10,color:S.ts,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:.5}}>{t}</p>{children}</div>;
function Login({onLogin}){const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[lo,setLo]=useState(false);const[er,setEr]=useState("");const go=async()=>{if(!email.trim()||!pw)return;setLo(true);setEr("");try{const r=await fetch(`${API}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase(),password:pw})});const d=await r.json().catch(()=>({}));if(r.ok&&d.ok&&d.session){onLogin(d.session,{id:d.userId,name:d.name,role:d.role,email:d.email});}else setEr(d.error||"E-mail ou senha incorretos.");}catch(e){setEr("Erro de conexão. Verifique a internet.");}setLo(false);};return(<div style={{padding:"3rem 1rem",textAlign:"center"}}><img src="/logo-white.png" alt="" style={{height:90,width:"auto",objectFit:"contain",display:"block",margin:"0 auto 16px"}} onError={e=>{e.target.src="/logo.png";e.target.style.filter="brightness(0) invert(1)";}}/><h1 style={{fontSize:20,fontWeight:600,margin:"0 0 4px"}}>TeamCheck</h1><p style={{fontSize:13,color:S.ts,margin:"0 0 2rem"}}>Jordan Representações</p><div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:12,padding:"1.25rem",textAlign:"left"}}><LB t="E-MAIL"><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{width:"100%"}} onKeyDown={e=>e.key==="Enter"&&go()}/></LB><LB t="SENHA"><input type="password" autoComplete="current-password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Sua senha" style={{width:"100%"}} onKeyDown={e=>e.key==="Enter"&&go()}/></LB><button onClick={go} disabled={lo||!email.trim()||!pw} style={{width:"100%",background:S.pri,border:"none",fontWeight:600,fontSize:15,padding:12,marginTop:8}}>{lo?"Entrando...":"Entrar"}</button>{er&&<p style={{fontSize:13,color:S.dng,marginTop:12,textAlign:"center"}}>{er}</p>}</div></div>);}
const OrgCard=memo(function OrgCardBase({org,active,onIn,onOut,onEdit,onPerson,onQuick,onInfo,ldId,plocs,lastVisit,lastOrder,nearRoad}){
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
        {isA?<button onClick={()=>onOut(org)} disabled={ldId===org.id} style={{background:S.dng,border:"none",color:"#fff",fontSize:13,fontWeight:700,padding:"10px 18px",borderRadius:50,display:"flex",alignItems:"center",gap:6,boxShadow:`0 2px 10px ${S.dng}44`,cursor:"pointer"}}><LogOut size={22} strokeWidth={2.5}/>{ldId===org.id?"...":"Check-out"}</button>
        :<div style={{display:"flex",gap:5}}>
          <button onClick={()=>onIn(org)} disabled={!!active||ldId===org.id} style={{background:active?S.cl:S.acc,border:"none",color:"#fff",fontSize:13,fontWeight:700,padding:"10px 18px",borderRadius:50,opacity:active?0.4:1,display:"flex",alignItems:"center",gap:6,boxShadow:active?"none":`0 2px 10px ${S.acc}44`,cursor:"pointer"}}><LogIn size={22} strokeWidth={2.5}/>{ldId===org.id?"...":"Check-in"}</button>
          <button onClick={()=>onQuick&&onQuick(org,"WHATSAPP")} style={{background:"transparent",border:"none",color:S.ok,padding:6,cursor:"pointer"}}><MessageCircle size={32} strokeWidth={1.8}/></button>
          <button onClick={()=>onQuick&&onQuick(org,"LIGACAO")} style={{background:"transparent",border:"none",color:S.pl,padding:6,cursor:"pointer"}}><Phone size={32} strokeWidth={1.8}/></button>
        </div>}
        <div style={{display:"flex",gap:2,justifyContent:"flex-end"}}>
          {plocs&&plocs[org.id]&&<button onClick={()=>{const loc=plocs[org.id];const url=`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}&travelmode=driving`;window.open(url,"_blank","noopener");}} title="Navegar" style={{background:"transparent",border:"none",color:S.acc,padding:4,cursor:"pointer"}}><Navigation size={26} strokeWidth={1.8}/></button>}
          {org.cnpj&&<button onClick={()=>window.open(`https://dashboard.jordanmt.com/?cliente=${org.cnpj.replace(/[.\-\/]/g,"")}`,"_blank","noopener")} title="Ver no Dashboard" style={{background:"transparent",border:"none",color:S.pri,padding:4,cursor:"pointer"}}><BarChart3 size={26} strokeWidth={1.8}/></button>}
          <button onClick={()=>onInfo&&onInfo(org)} style={{background:"transparent",border:"none",color:S.pl,padding:4,cursor:"pointer"}}><Info size={26} strokeWidth={1.8}/></button>
          <button onClick={()=>onEdit&&onEdit(org)} style={{background:"transparent",border:"none",color:S.gold,padding:4,cursor:"pointer"}}><Pencil size={26} strokeWidth={1.8}/></button>
          <button onClick={()=>onPerson&&onPerson(org)} style={{background:"transparent",border:"none",color:S.ts,padding:4,cursor:"pointer"}}><UserPlus size={26} strokeWidth={1.8}/></button>
        </div>
      </div>
    </div>
    {isA&&<p style={{fontSize:12,color:S.pl,margin:"8px 0 0",paddingTop:8,borderTop:`1px solid ${S.brd}`}}>Em visita desde {fT(active.checkinTime)}</p>}
  </div>);});
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
  const createOrg=async()=>{if(!name.trim()&&!legal.trim())return;setLo(true);setEr("");try{const body={name:name.trim()||legal.trim(),legalName:legal.trim()};if(cnpj)body.cnpj=cnpj.replace(/[.\-\/]/g,"");const addr={};if(street)addr.street_name=street;const numOk=num&&/\d/.test(num);if(numOk)addr.street_number=num;const _ai=[comp,(num&&!numOk)?num:""].filter(Boolean).join(" ");if(_ai)addr.additional_info=_ai;if(district)addr.district=district;if(city)addr.city=city;if(state)addr.state=state;if(cep)addr.postal_code=cep;if(Object.keys(addr).length)body.address=addr;if(phone)body.contact={work:phone};if(catId)body.category=catId;if(sectorId)body.sector=parseInt(sectorId);if(originId)body.leadOrigin=parseInt(originId);const gFinal=grupo==="__new__"?newGrupo.trim():grupo;if(gFinal)body.description=`Grupo: ${gFinal}`;const d=await agF("/organizations",token,{method:"POST",body:JSON.stringify(body)});if(d.data){setOrgId(d.data.id);setOrgName(d.data.name||name);setOrgData(strip(d.data));setStep(2);}else setEr("Erro");}catch(e){setEr(agErr(e));}setLo(false);};
  const[pCargo,setPCargo]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>fixMojibake(o.grupo?.replace("Grupo: ","")||"")).filter(Boolean))].sort(),[allOrgs]);
  const finish=(wp)=>{const od=orgData||strip({id:orgId,name:orgName||name,legalName:legal,cnpj,address:{city,state,district},category:{id:catId,name:CAT_IDS.find(c=>c.id===catId)?.n},sector:{id:parseInt(sectorId),name:SECTORS.find(s=>s.id===parseInt(sectorId))?.n}});if(wp&&pName.trim()){setLo(true);agF("/people",token,{method:"POST",body:JSON.stringify({name:pName,organization:orgId,role:pCargo||undefined,contact:{...(pEmail?{email:pEmail}:{}),...(pPhone?{mobile:pPhone}:{}),...(pWhats?{whatsapp:pWhats}:{})}})}).then(()=>{setLo(false);setOrgData(od);setStep(3);}).catch((e)=>{setLo(false);alert("Empresa criada, mas o contato não foi salvo: "+agErr(e));setOrgData(od);setStep(3);});}else{setOrgData(od);setStep(3);}};
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
  <LB t="SETOR / GRUPO"><div style={{display:"flex",gap:6}}><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Setor</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select><select value={grupo} onChange={e=>setGrupo(e.target.value)} style={{flex:1,fontSize:11}}><option value="">Grupo</option><option value="__new__">➕ Novo</option>{existGrp.map(g=><option key={g} value={g}>{g}</option>)}</select></div>{grupo==="__new__"&&<input value={newGrupo} onChange={e=>setNewGrupo(e.target.value)} placeholder="Nome do grupo" style={{width:"100%",marginTop:4,fontSize:11}}/>}</LB>
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
    {TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${orgData?.name||orgName}:`);if(note?.trim()){postTask(token,orgId,note,t.id,true).then(()=>{alert("Registrado no Agendor!");onSave(orgData);}).catch(e=>{alert("Erro: "+agErr(e));onSave(orgData);});}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>
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
    await reload();clear();}catch(x){setMsg("Erro: "+agErr(x));}setSaving(false);};
  const del=async(pe)=>{if(!confirm(`Excluir ${pe.name}?\nEssa ação remove o contato do Agendor.`))return;setSaving(true);try{await agF(`/people/${pe.id}`,token,{method:"DELETE"});await reload();setMsg("Excluído!");}catch(x){setMsg("Erro: "+agErr(x));}setSaving(false);};
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
function EditModal({org,token,users,allOrgs,onSave,onClose}){const[name,setName]=useState(org.name||"");const[legal,setLegal]=useState("");const[catId,setCatId]=useState("");const[sectorId,setSectorId]=useState("");const[grupo,setGrupo]=useState(org.grupo?.replace("Grupo: ","")||"");const[newGrupo,setNewGrupo]=useState("");const[grupoSearch,setGrupoSearch]=useState(org.grupo?.replace("Grupo: ","")||"");const[grupoOpen,setGrupoOpen]=useState(false);const[ownerId,setOwnerId]=useState("");
  const existGrp=useMemo(()=>[...new Set((allOrgs||[]).map(o=>fixMojibake(o.grupo?.replace("Grupo: ","")||"")).filter(Boolean))].sort(),[allOrgs]);
  const curProds=org.products?org.products.split(", ").filter(p=>!p.startsWith("P_")):[];
  const[selProds,setSelProds]=useState(()=>PRODS.filter(p=>curProds.includes(p.n)).map(p=>p.id));
  const[lo,setLo]=useState(false);const[fetching,setFetching]=useState(false);const[msg,setMsg]=useState("");
  const toggleProd=id=>setSelProds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const refresh=async()=>{if(!org.cnpj)return;setFetching(true);setMsg("");try{const d=await fetchCNPJ(org.cnpj);setName(d.nome_fantasia||name);setLegal(d.razao_social||"");setMsg("Dados atualizados!");}catch(e){setMsg("Erro: "+e.message);}setFetching(false);};
  const save=async()=>{setLo(true);setMsg("");try{const body={products:selProds};if(name.trim())body.name=name.trim();if(legal.trim())body.legalName=legal.trim();if(catId)body.category=parseInt(catId);if(sectorId)body.sector=parseInt(sectorId);if(ownerId)body.ownerUser=parseInt(ownerId);const gFinal=grupo==="__new__"?newGrupo.trim():grupo;body.description=gFinal?`Grupo: ${gFinal}`:"";const resp=await agF(`/organizations/${org.id}`,token,{method:"PUT",body:JSON.stringify(body)});if(resp.data){onSave(strip(resp.data));setMsg("Salvo!");}else{onSave({...org,name:name||org.name});}}catch(e){setMsg("Erro: "+agErr(e));}setLo(false);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}><div style={{background:S.card,borderRadius:16,padding:"1.25rem",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><p style={{fontWeight:600,fontSize:16,margin:0}}>Editar Cliente</p>{org.cnpj&&<button onClick={refresh} disabled={fetching} style={{padding:"4px 10px",fontSize:11,background:S.acc+"22",border:`1px solid ${S.acc}`,color:S.acc}}>{fetching?"...":"🔄 RF"}</button>}</div>
  {org.cnpj&&<p style={{fontSize:11,color:S.td,margin:"0 0 8px"}}>CNPJ: {org.cnpj}</p>}
  <LB t="NOME FANTASIA"><input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%"}}/></LB>
  <LB t="RAZÃO SOCIAL"><input value={legal} onChange={e=>setLegal(e.target.value)} placeholder="Atualizar" style={{width:"100%"}}/></LB>
  <LB t="CATEGORIA"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{CAT_IDS.map(c=><button key={c.id} type="button" onClick={()=>setCatId(String(c.id))} style={{padding:"4px 10px",fontSize:10,border:catId===String(c.id)?`2px solid ${CC[c.n]||S.pri}`:`1px solid ${S.brd}`,background:catId===String(c.id)?`${CC[c.n]||S.pri}22`:"transparent",color:catId===String(c.id)?CC[c.n]||S.pri:S.ts,borderRadius:6,fontWeight:catId===String(c.id)?600:400}}>{c.n}{org.cat===c.n&&!catId?" (atual)":""}</button>)}</div></LB>
  <LB t="RESPONSÁVEL"><select value={ownerId} onChange={e=>setOwnerId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.owner||"-"}</option>{users.map(u=><option key={u.id} value={u.id}>{u.n}</option>)}</select></LB>
  <LB t="SETOR"><select value={sectorId} onChange={e=>setSectorId(e.target.value)} style={{width:"100%",fontSize:12}}><option value="">Atual: {org.sector||"-"}</option>{SECTORS.map(s=><option key={s.id} value={s.id}>{s.n}</option>)}</select></LB>
  <LB t="GRUPO"><div style={{position:"relative"}}>
    <input value={grupoSearch} onChange={e=>{const v=e.target.value;setGrupoSearch(v);setGrupoOpen(true);const match=existGrp.find(g=>g.toLowerCase()===v.toLowerCase());if(match){setGrupo(match);setNewGrupo("");}else if(v.trim()){setGrupo("__new__");setNewGrupo(v);}else{setGrupo("");setNewGrupo("");}}} onFocus={()=>setGrupoOpen(true)} onBlur={()=>setTimeout(()=>setGrupoOpen(false),200)} placeholder="Buscar ou digitar novo grupo..." style={{width:"100%",fontSize:12}}/>
    {grupoOpen&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:`1px solid ${S.brd}`,borderRadius:6,maxHeight:200,overflowY:"auto",zIndex:100,marginTop:2,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>
      {grupoSearch.trim()&&!existGrp.some(g=>g.toLowerCase()===grupoSearch.toLowerCase())&&<div onMouseDown={()=>{setGrupo("__new__");setNewGrupo(grupoSearch);setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:S.acc,cursor:"pointer",borderBottom:`1px solid #eee`,fontWeight:600}}>➕ Criar novo grupo: "{grupoSearch}"</div>}
      <div onMouseDown={()=>{setGrupo("");setGrupoSearch("");setNewGrupo("");setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:"#666",cursor:"pointer",borderBottom:`1px solid #eee`}}>Sem grupo</div>
      {existGrp.filter(g=>!grupoSearch||g.toLowerCase().includes(grupoSearch.toLowerCase())).map(g=><div key={g} onMouseDown={()=>{setGrupo(g);setGrupoSearch(g);setNewGrupo("");setGrupoOpen(false);}} style={{padding:"8px 10px",fontSize:12,color:"#000",cursor:"pointer",background:grupo===g?"#e0f0ff":"#fff"}} onMouseEnter={e=>e.target.style.background="#f0f8ff"} onMouseLeave={e=>e.target.style.background=grupo===g?"#e0f0ff":"#fff"}>{g}</div>)}
      {existGrp.filter(g=>!grupoSearch||g.toLowerCase().includes(grupoSearch.toLowerCase())).length===0&&!grupoSearch.trim()&&<div style={{padding:"8px 10px",fontSize:11,color:"#888"}}>Nenhum grupo cadastrado</div>}
    </div>}
    {grupo==="__new__"&&grupoSearch.trim()&&<p style={{fontSize:10,color:S.acc,margin:"2px 0 0"}}>➕ Criar novo grupo: "{grupoSearch}"</p>}
    {grupo&&grupo!=="__new__"&&<p style={{fontSize:10,color:S.ok,margin:"2px 0 0"}}>✓ Selecionado: {grupo}</p>}
  </div></LB>
  <LB t="PRODUTOS / MARCAS"><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{PRODS.map(p=><button key={p.id} onClick={()=>toggleProd(p.id)} style={{padding:"4px 8px",fontSize:10,border:selProds.includes(p.id)?`2px solid ${S.ok}`:`1px solid ${S.brd}`,background:selProds.includes(p.id)?S.ok+"22":"transparent",color:selProds.includes(p.id)?S.ok:S.ts,borderRadius:6,fontWeight:selProds.includes(p.id)?600:400}}>{p.n}</button>)}</div></LB>
  {msg&&<p style={{fontSize:12,color:msg.startsWith("Erro")?S.dng:S.ok,margin:"0 0 6px"}}>{msg}</p>}
  <div style={{display:"flex",gap:8,marginTop:4}}><button onClick={onClose} style={{flex:1}}>Cancelar</button><button onClick={save} disabled={lo} style={{flex:1,background:S.pri,border:"none",fontWeight:600}}>{lo?"...":"Salvar"}</button></div></div></div>);}
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
function ProgressBar({active,msg}){if(!active)return null;return(<div style={{width:"100%",marginBottom:8}}>
  <div style={{height:4,background:S.brd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:S.pri,borderRadius:2,animation:"progFill 2s ease-in-out infinite",width:"60%"}}/>
  </div><p style={{fontSize:11,color:S.acc,margin:"4px 0 0",textAlign:"center"}}>{msg}</p>
  <style>{`@keyframes progFill{0%{width:5%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:5%;margin-left:95%}}`}</style>
</div>);}
function SearchOrAddModal({token,allOrgs,onFound,onNewClient,onCancel}){
  const[q,setQ]=useState("");const[lo,setLo]=useState(false);const[results,setResults]=useState([]);const[selected,setSelected]=useState(null);const[err,setErr]=useState("");const[step,setStep]=useState("search");
  const[people,setPeople]=useState([]);const[pLo,setPLo]=useState(false);const[showPeople,setShowPeople]=useState(false);
  const[addP,setAddP]=useState(false);const[pName,setPName]=useState("");const[pCargo,setPCargo]=useState("");const[pEmail,setPEmail]=useState("");const[pPhone,setPPhone]=useState("");const[pWhats,setPWhats]=useState("");
  const search=()=>{if(!q.trim()){setErr("Digite CNPJ, nome ou razão social");return;}setLo(true);setErr("");setResults([]);setSelected(null);
    const clean=q.replace(/[.\-\/]/g,"").toLowerCase();
    const matches=allOrgs.filter(o=>{if(o.cnpj?.replace(/[.\-\/]/g,"")===clean)return true;return[o.name,o.nickname,o.legalName].filter(Boolean).some(f=>f.toLowerCase().replace(/[.\-\/]/g,"").includes(clean));}).slice(0,30);
    if(matches.length){setResults(matches);setStep("list");setLo(false);return;}
    if(clean.length===14){setLo(true);fetchCNPJ(clean).then(rf=>{setSelected({rfData:rf,name:rf.nome_fantasia||rf.razao_social||"",cnpj:clean});setStep("notfound_rf");setLo(false);}).catch(()=>{setStep("notfound");setLo(false);});return;}
    setStep("notfound");setLo(false);};
  const selectClient=(org)=>{setSelected(org);setStep("found");};
  const loadPeople=async(orgId)=>{setPLo(true);try{const d=await agF(`/organizations/${orgId}/people?per_page=50`,token);setPeople(d.data||[]);}catch(e){console.warn("people:",e);setPeople([]);}setPLo(false);setShowPeople(true);};
  const pCanSave=pName.trim()&&pEmail.trim()&&pWhats.trim();
  const addPerson=async()=>{if(!pCanSave||!selected?.id)return;setPLo(true);try{const ct={};if(pEmail.trim())ct.email=pEmail.trim();if(pPhone.trim())ct.mobile=pPhone.trim();if(pWhats.trim())ct.whatsapp=pWhats.trim();await agF("/people",token,{method:"POST",body:JSON.stringify({name:pName,organization:selected.id,...(pCargo?{role:pCargo}:{}),contact:ct})});await loadPeople(selected.id);setAddP(false);setPName("");setPCargo("");setPEmail("");setPPhone("");setPWhats("");}catch(e){alert("Erro: "+agErr(e));}setPLo(false);};
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
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>{TYPES.map(t=><button key={t.id} onClick={()=>{const note=prompt(`${t.l} com ${selected.name}:`);if(note?.trim()){postTask(token,selected.id,note,t.id,true).then(()=>alert("Registrado!")).catch(e=>alert("Erro: "+agErr(e)));onCancel();}}} style={{padding:10,textAlign:"left",fontSize:12,background:S.bg,border:`1px solid ${S.brd}`,borderRadius:8}}>{t.id==="VISITA"?"📍":t.id==="WHATSAPP"?"💬":t.id==="LIGACAO"?"📞":t.id==="EMAIL"?"📧":t.id==="REUNIAO"?"🤝":"📄"} {t.l}</button>)}</div>
      <button onClick={()=>loadPeople(selected.id)} style={{width:"100%",marginBottom:8,padding:10,fontSize:12,background:S.pri+"22",border:`1px solid ${S.pri}`,color:S.pri,fontWeight:500}}>{pLo?"...":"👤 Ver / Adicionar Contatos"}</button>
      <div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("list");setSelected(null);setShowPeople(false);}} style={{flex:1}}>← Voltar</button>{!isExcluido&&<button onClick={()=>{onFound(selected);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Ir ao cliente</button>}{isExcluido&&<button onClick={onCancel} style={{flex:1}}>Fechar</button>}</div></>}
    {step==="found"&&showPeople&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><p style={{fontWeight:600,fontSize:14,margin:0}}>👤 Contatos</p><button onClick={()=>setShowPeople(false)} style={{fontSize:10,padding:"4px 10px"}}>← Voltar</button></div>
      {people.length===0&&!pLo&&<p style={{fontSize:12,color:S.ts,textAlign:"center",padding:"1rem 0"}}>Nenhum contato</p>}
      {people.map(p=><div key={p.id} style={{background:S.cl,borderRadius:8,padding:10,marginBottom:6}}><p style={{fontSize:13,fontWeight:600,margin:"0 0 2px"}}>{p.name}</p>{p.role&&<p style={{fontSize:10,color:S.acc,margin:"0 0 2px"}}>{p.role}</p>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.contact?.email&&<span style={{fontSize:10,color:S.ts}}>📧 {p.contact.email}</span>}{p.contact?.mobile&&<span style={{fontSize:10,color:S.ts}}>📱 {p.contact.mobile}</span>}{p.contact?.whatsapp&&<a href={`https://wa.me/55${p.contact.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener" style={{fontSize:10,color:S.ok,textDecoration:"none"}}>💬 {p.contact.whatsapp}</a>}</div></div>)}
      {!addP&&<button onClick={()=>setAddP(true)} style={{width:"100%",padding:10,fontSize:12,background:S.acc,border:"none",fontWeight:600,marginTop:4}}>+ Adicionar Contato</button>}
      {addP&&<div style={{background:S.cl,borderRadius:8,padding:10,marginTop:6}}><input value={pName} onChange={e=>setPName(e.target.value)} placeholder="Nome *" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pName.trim()?S.brd:S.dng}`}}/><select value={pCargo} onChange={e=>setPCargo(e.target.value)} style={{width:"100%",marginBottom:4,fontSize:12}}><option value="">Cargo...</option>{CARGOS.map(c=><option key={c} value={c}>{c}</option>)}</select><input value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="E-mail *" type="email" style={{width:"100%",marginBottom:4,fontSize:12,border:`1px solid ${pEmail.trim()?S.brd:S.dng}`}}/><input value={pPhone} onChange={e=>setPPhone(e.target.value)} placeholder="Telefone" style={{width:"100%",marginBottom:4,fontSize:12}}/><input value={pWhats} onChange={e=>setPWhats(e.target.value)} placeholder="WhatsApp *" style={{width:"100%",marginBottom:6,fontSize:12,border:`1px solid ${pWhats.trim()?S.brd:S.dng}`}}/><div style={{display:"flex",gap:6}}><button onClick={()=>setAddP(false)} style={{flex:1,fontSize:11}}>Cancelar</button><button onClick={addPerson} disabled={pLo||!pCanSave} style={{flex:1,fontSize:11,background:pCanSave?S.acc:S.cl,border:"none",fontWeight:600}}>{pLo?"...":"Salvar"}</button></div></div>}</>}
    {(step==="notfound"||step==="notfound_rf")&&<><p style={{fontWeight:600,fontSize:16,margin:"0 0 4px",color:S.gold}}>Cliente não encontrado</p><p style={{fontSize:12,color:S.ts,margin:"0 0 8px"}}>{q} não cadastrado no Agendor</p>{step==="notfound_rf"&&selected?.rfData&&<div style={{background:S.cl,borderRadius:10,padding:10,margin:"0 0 8px"}}><p style={{fontSize:11,color:S.acc,margin:"0 0 2px"}}>Receita Federal:</p><p style={{fontSize:12,fontWeight:500,margin:"0 0 1px"}}>{selected.rfData.nome_fantasia||"-"}</p><p style={{fontSize:11,color:S.ts,margin:0}}>{selected.rfData.razao_social||""}</p><p style={{fontSize:10,color:S.ts,margin:0}}>{selected.rfData.municipio||""}/{selected.rfData.uf||""}</p></div>}<div style={{display:"flex",gap:8}}><button onClick={()=>{setStep("search");setSelected(null);}} style={{flex:1}}>Voltar</button><button onClick={()=>{onNewClient(q.replace(/[.\-\/]/g,""),selected?.rfData||null);onCancel();}} style={{flex:1,background:S.acc,border:"none",fontWeight:600}}>Cadastrar Novo</button></div></>}
  </div></div>);}

export { LB, Login, OrgCard, Banner, NoteModal, NewClientModal, CARGOS, PeopleModal, PRODS, EditModal, HotelGeoInput, JourneyModal, DayEndModal, DivergentModal, BaseEditInline, ProgressBar, SearchOrAddModal };
