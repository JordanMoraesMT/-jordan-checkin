// TeamCheck — aba EquipeTab (unificada com o Relatório: mesma base de visitas check-in/out)
import { useState, useMemo } from "react";
import { toLocalDate, todayLocal, USERS, HOMES, S, fT, fD, mins, hrsMin, hav, csv, getBase, getVCoord, getVEndCoord } from "../lib";
import { Kpi, DateField, SearchSelect } from "../components";

function EquipeTab({sel,setSel,plocs,dayBases,user,visits}){
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
    // dedup por orgId|usuário|dia — mantém a de maior duração (idêntico ao Relatório)
    const map=new Map();
    for(const v of filt){const key=v.orgId+"|"+(v.userName||"")+"|"+toLocalDate(v.checkinTime);const ex=map.get(key);
      if(!ex){map.set(key,v);continue;}
      const ed=new Date(ex.checkoutTime)-new Date(ex.checkinTime),vd=new Date(v.checkoutTime)-new Date(v.checkinTime);
      if(vd>ed)map.set(key,v);}
    return [...map.values()].sort((a,b)=>new Date(a.checkinTime)-new Date(b.checkinTime));
  },[visits,sel,selUser.n]);

  // Base do dia (origem/destino) — mesma resolução do Relatório (chave uid_data → HOMES → getBase)
  const baseDe=(dt)=>{const k=uid+"_"+dt;if(dayBases[k]?.start)return dayBases[k].start;if(dayBases[k]&&dayBases[k].lat!=null)return dayBases[k];return HOMES[uid]||getBase(dayBases,dt,uid)||null;};
  const endDe=(dt)=>{const k=uid+"_"+dt;if(dayBases[k]?.end)return dayBases[k].end;return baseDe(dt);};

  // KM: base → 1º PDV → entre PDVs → último PDV → base (×1.3) — idêntico ao calcDayKm do Relatório
  const km=useMemo(()=>{const s=dayVisits;if(!s.length)return 0;let k=0;const b=baseDe(sel),eb=endDe(sel);
    const fc=getVCoord(s[0],plocs);if(b&&fc)k+=hav(b.lat,b.lng,fc.lat,fc.lng)*1.3;
    for(let i=1;i<s.length;i++){if(s[i].orgId===s[i-1].orgId)continue;const ca=getVEndCoord(s[i-1],plocs),cb=getVCoord(s[i],plocs);if(ca&&cb)k+=hav(ca.lat,ca.lng,cb.lat,cb.lng)*1.3;}
    const l=s[s.length-1];const endB=eb||b;const lc=getVEndCoord(l,plocs);if(endB&&lc)k+=hav(lc.lat,lc.lng,endB.lat,endB.lng)*1.3;
    return k;},[dayVisits,dayBases,plocs,uid,sel]);

  // Jornada: 1º check-in → último check-out − 60 (almoço) — idêntico ao Relatório
  const workH=useMemo(()=>{if(!dayVisits.length)return 0;const a=dayVisits[0].checkinTime,b=dayVisits[dayVisits.length-1].checkoutTime;if(!a||!b)return 0;return Math.max(0,mins(a,b)-60);},[dayVisits]);
  const firstCheckin=dayVisits.length?fT(dayVisits[0].checkinTime):"-";
  const withGps=dayVisits.filter(v=>getVCoord(v,plocs)).length;

  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:S.txt}}>Produtividade — {selUser.n}</div>
        <div style={{fontSize:12,color:S.ts,marginTop:2}}>{dayVisits.length} visita(s) · base check-in/check-out (igual ao Relatório)</div>
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
    {dayVisits.length>0&&<button onClick={()=>{const rows=[["Data","Check-in","Check-out","Cliente","Observação","GPS"]];dayVisits.forEach(v=>rows.push([fD(v.checkinTime),fT(v.checkinTime),v.checkoutTime?fT(v.checkoutTime):"-",v.orgName||"",(v.note||"").slice(0,120),getVCoord(v,plocs)?"Sim":"Nao"]));rows.push([],["Km estimado",km?km.toFixed(1):"-"],["Jornada",hrsMin(workH)],["Visitas",dayVisits.length]);csv(rows,`${first.toLowerCase()}-${sel}.csv`);}} style={{width:"100%",marginBottom:16,padding:10,fontSize:12.5,fontWeight:500,background:"transparent",border:`1px solid ${S.inpBdr}`,color:S.pl,borderRadius:8}}>📊 Exportar relatório de {first}</button>}
    {!dayVisits.length&&<p style={{color:S.ts,textAlign:"center",padding:"2rem 0"}}>Nenhuma visita registrada nesta data</p>}
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
  </div>);}

export { EquipeTab };
