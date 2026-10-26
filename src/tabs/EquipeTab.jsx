// TeamCheck — aba EquipeTab (unificada com o Relatório: mesma base de visitas check-in/out)
import { useState, useMemo, useEffect } from "react";
import { toLocalDate, todayLocal, USERS, S, fT, fD, fD1, mins, hrsMin, hav, csv, getBase, getEnd, getVCoord, getVEndCoord, DASH, temCoord, saidaEfetiva, dedupVisitas } from "../lib";
import { Kpi, DateField, SearchSelect } from "../components";

function EquipeTab({sel,setSel,plocs,dayBases,user,visits,token,bump}){
  // Usuário selecionado (dinâmico via catálogo). Default: 1º que não seja o admin logado.
  const[uid,setUid]=useState(()=>{const outros=USERS.filter(u=>String(u.id)!==String(user?.id));return String((outros[0]||USERS[0]||{id:743347}).id);});
  const selUser=useMemo(()=>USERS.find(u=>String(u.id)===String(uid))||{n:"—",id:uid},[uid]);
  const first=(selUser.n||"").split(" ")[0]||"usuario";
  const nrm=s=>(s||"").toLowerCase().trim();

  // MESMA fonte e MESMO filtro do Relatório: visitas de campo (check-in/out), por usuário e dia.
  const dayVisits=useMemo(()=>{
    const filt=(visits||[]).filter(v=>{
      if(!v.checkoutTime)return false;
      if(v.taskType&&v.taskType!=="VISITA")return false;
      if(nrm(v.userName)!==nrm(selUser.n))return false;
      return toLocalDate(v.checkinTime)===sel;
    });
    // v90: mesmo dedup do Relatório (sobreposição de horário)
    return dedupVisitas(filt);
  },[visits,sel,selUser.n]);

  // Base do dia (origem/destino) — mesma resolução do Relatório (chave uid_data → HOMES → getBase)
  // v90: base só com coordenada (lib.getBase/getEnd) — destino "GPS ao fechar" sem GPS não vira (0,0)
  const baseDe=(dt)=>getBase(dayBases,dt,uid,false);
  const endDe=(dt)=>getEnd(dayBases,dt,uid,false);

  // KM: base → 1º PDV → entre PDVs → último PDV → base (×1.3) — idêntico ao calcDayKm do Relatório
  const km=useMemo(()=>{const s=dayVisits;if(!s.length)return 0;let k=0;const b=baseDe(sel),eb=endDe(sel);
    const fc=getVCoord(s[0],plocs);if(temCoord(b)&&fc)k+=hav(b.lat,b.lng,fc.lat,fc.lng)*1.3;
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId)continue;const ca=getVEndCoord(s[i-1],plocs),cb=getVCoord(s[i],plocs);if(ca&&cb)k+=hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3;}
    const l=s[s.length-1];const endB=eb||b;const lc=getVEndCoord(l,plocs);if(temCoord(endB)&&lc)k+=hav(lc.lat,lc.lng,endB.lat,endB.lng)*1.3;
    return k;},[dayVisits,dayBases,plocs,uid,sel]);

  // Jornada: 1º check-in → último check-out − 60 (almoço) — idêntico ao Relatório
  const workH=useMemo(()=>{if(!dayVisits.length)return 0;const a=dayVisits[0].checkinTime,b=saidaEfetiva(dayVisits[dayVisits.length-1]);if(!a||!b)return 0;return Math.max(0,mins(a,b)-60);},[dayVisits]);
  const firstCheckin=dayVisits.length?fT(dayVisits[0].checkinTime):"-";
  const withGps=dayVisits.filter(v=>getVCoord(v,plocs)).length;

  // v74: atendimentos a distância (sem check-in) = atividades registradas no app (origem "teamcheck"),
  // exceto notas. Dia em Cuiabá (UTC−4) → janela UTC 04:00 → 04:00 do dia seguinte (o D1 grava em UTC).
  const[remotos,setRemotos]=useState([]);const[ldR,setLdR]=useState(false);const[erroR,setErroR]=useState("");
  useEffect(()=>{if(!token||!sel)return;let vivo=true;setLdR(true);setErroR("");
    const d0=new Date(sel+"T04:00:00Z"),d1=new Date(d0.getTime()+86400000);const f=d=>d.toISOString().slice(0,19).replace("T"," ");
    fetch(`${DASH}/api/crm/atividades?desde=${encodeURIComponent(f(d0))}&ate=${encodeURIComponent(f(d1))}&limit=2000`,{headers:{"X-Session":token},cache:"no-store"})
      .then(r=>r.json()).then(d=>{if(vivo)setRemotos((d&&d.atividades)||[]);}).catch(e=>{if(vivo)setErroR(String(e.message||e));}).finally(()=>{if(vivo)setLdR(false);});
    return()=>{vivo=false;};},[token,sel,bump]);
  const doUser=a=>String(a.user_id||"")===String(uid)||nrm(a.user_nome)===nrm(selUser.n);
  const remDia=useMemo(()=>remotos.filter(a=>doUser(a)&&a.origem==="teamcheck"&&a.tipo!=="NOTA").sort((a,b)=>String(a.criado_em).localeCompare(String(b.criado_em))),[remotos,uid,selUser.n]);
  const resolvDia=useMemo(()=>remotos.filter(a=>doUser(a)&&(a.origem==="teamcheck"||a.origem==="checkout")).reduce((n,a)=>n+((String(a.texto||"").match(/✓ Pendência resolvida/g)||[]).length),0),[remotos,uid,selUser.n]);
  const tarefasCriadas=useMemo(()=>remotos.filter(a=>doUser(a)&&a.origem==="tarefa").length,[remotos,uid,selUser.n]);
  const porTipo=useMemo(()=>{const m={};remDia.forEach(a=>{m[a.tipo]=(m[a.tipo]||0)+1;});return m;},[remDia]);
  const TL={LIGACAO:"Ligação",WHATSAPP:"WhatsApp",EMAIL:"E-mail",REUNIAO:"Reunião",PROPOSTA:"Proposta",VISITA:"Visita"};

  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:"-.3px",color:S.txt}}>Produtividade — {selUser.n}</div>
        <div style={{fontSize:13,color:S.t2,marginTop:2}}>{dayVisits.length} visita(s) em campo · {remDia.length} atendimento(s) a distância</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <SearchSelect value={String(uid)} onChange={setUid} placeholder="Usuário" style={{width:190}} options={USERS.map(u=>[String(u.id),u.n])}/>
        <DateField value={sel} onChange={setSel} today={todayLocal()} placeholder="Data" style={{width:170}}/>
      </div>
    </div>
    {dayVisits.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
      <Kpi k="Visitas" v={dayVisits.length}/>
      <Kpi k="1º Check-in" v={firstCheckin}/>
      <Kpi k="Último Check-out" v={dayVisits.length?fT(dayVisits[dayVisits.length-1].checkoutTime):"-"}/>
      <Kpi k="Jornada" v={hrsMin(workH)}/>
      <Kpi k="Km estimado" v={km?km.toFixed(1):"-"} u={km?"km":""}/>
      <Kpi k="Com GPS" v={`${withGps}/${dayVisits.length}`}/>
    </div>}
    {dayVisits.length>0&&<button onClick={()=>{const rows=[["Data","Check-in","Check-out","Cliente","Observação","GPS"]];dayVisits.forEach(v=>rows.push([fD(v.checkinTime),fT(v.checkinTime),v.checkoutTime?fT(v.checkoutTime):"-",v.orgName||"",(v.note||"").slice(0,120),getVCoord(v,plocs)?"Sim":"Nao"]));rows.push([],["Km estimado",km?km.toFixed(1):"-"],["Jornada",hrsMin(workH)],["Visitas",dayVisits.length]);csv(rows,`${first.toLowerCase()}-${sel}.csv`);}} style={{width:"100%",marginBottom:16,padding:10,fontSize:12.5,fontWeight:500,background:"transparent",border:`1px solid ${S.inpBdr}`,color:S.pl,borderRadius:8}}>Exportar relatório de {first}</button>}
    {!dayVisits.length&&<p style={{color:S.ts,fontSize:14,padding:"8px 0 16px",margin:0}}>Nenhuma visita em campo nesta data.</p>}
    {dayVisits.length>0&&<div style={{background:S.card,border:`1px solid ${S.brd}`,borderRadius:14,padding:"18px 20px"}}>
      <div style={{fontSize:14,fontWeight:600,color:S.txt,marginBottom:12}}>Rota do dia</div>
      <div style={{position:"relative",paddingLeft:4}}>
        <div style={{position:"absolute",left:15,top:18,bottom:18,width:2,background:S.brd}}/>
        {dayVisits.map((v,i)=><div key={i} style={{position:"relative",display:"flex",gap:12,padding:"10px 2px"}}>
          <div style={{position:"relative",zIndex:1,width:24,height:24,borderRadius:"50%",background:getVCoord(v,plocs)?"var(--chrome)":S.cl,color:getVCoord(v,plocs)?"#fff":S.td,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 0 3px var(--card-solid)"}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10}}>
              <span style={{fontSize:13.5,fontWeight:600,color:S.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.orgName||"—"}</span>
              <span className="mono" style={{fontSize:11.5,color:S.td,flexShrink:0}}>{fT(v.checkinTime)}{v.checkoutTime?` – ${fT(v.checkoutTime)}`:""}</span>
            </div>
            {v.note&&<p style={{fontSize:12,color:S.ts,margin:"3px 0 0",lineHeight:1.5,wordBreak:"break-word"}}>{v.note}</p>}
          </div>
        </div>)}
      </div>
    </div>}

    <section aria-label="Atendimentos a distância" style={{marginTop:20}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginBottom:10}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700,color:S.txt}}>Escritório — atendimentos a distância</h2>
        <span style={{fontSize:12.5,color:S.ts}}>sem check-in · ligação, WhatsApp, e-mail, reunião, proposta</span>
      </div>
      {ldR&&<p style={{fontSize:13,color:S.ts,margin:"0 0 10px"}}>Carregando…</p>}
      {erroR&&<p style={{fontSize:13,color:S.dng,margin:"0 0 10px"}}>Não consegui ler os atendimentos: {erroR}</p>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14}}>
        <Kpi k="Atendimentos" v={remDia.length}/>
        <Kpi k="Ligações" v={porTipo.LIGACAO||0}/>
        <Kpi k="WhatsApp" v={porTipo.WHATSAPP||0}/>
        <Kpi k="E-mail / outros" v={remDia.length-(porTipo.LIGACAO||0)-(porTipo.WHATSAPP||0)}/>
        <Kpi k="Pendências resolvidas" v={resolvDia}/>
        <Kpi k="Tarefas criadas" v={tarefasCriadas}/>
        <Kpi k="1º → último" v={remDia.length?`${fT(fD1iso(remDia[0].criado_em))}–${fT(fD1iso(remDia[remDia.length-1].criado_em))}`:"-"}/>
      </div>
      {!ldR&&!remDia.length&&<p style={{color:S.ts,fontSize:14,margin:0}}>Nenhum atendimento a distância registrado nesta data.</p>}
      {remDia.length>0&&<div style={{border:`1px solid ${S.brd}`,borderRadius:10,background:S.card}}>
        {remDia.map((a,i)=><div key={a.id} style={{display:"grid",gridTemplateColumns:"52px minmax(0,1fr)",gap:"0 10px",padding:"10px 12px",borderTop:i?`1px solid ${S.brd}`:"none"}}>
          <span className="num" style={{fontSize:12,color:S.ts,paddingTop:2}}>{fT(fD1iso(a.criado_em))}</span>
          <div style={{minWidth:0}}>
            <p style={{margin:0,fontSize:14,color:S.txt}}><b style={{fontWeight:600}}>{a.org_nome||"—"}</b><span style={{color:S.ts}}> · {TL[a.tipo]||a.tipo}</span></p>
            {a.texto&&<p style={{margin:"2px 0 0",fontSize:13,color:S.t2,lineHeight:1.45,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{String(a.texto).slice(0,220)}</p>}
          </div>
        </div>)}
      </div>}
    </section>
  </div>);}

// datas do D1 ("YYYY-MM-DD HH:MM:SS", UTC sem fuso) → ISO com Z (Safari não lê o formato com espaço)
const fD1iso=s=>{const t=String(s||"");return /[zZ]$|[+-]\d\d:\d\d$/.test(t)?t:t.replace(" ","T")+"Z";};

export { EquipeTab };
