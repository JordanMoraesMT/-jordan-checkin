import { useState, useEffect, useMemo } from "react";

const API = "https://api.agendor.com.br/v3";
const OSRM = "https://router.project-osrm.org/route/v1/driving";

// ─── Helpers ───
const fT = (d) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fD = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fDS = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const fWD = (d) => new Date(d).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
const mins = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));
const hrsMin = (m) => m >= 60 ? `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, "0")}` : `${m} min`;
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function loadJSON(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

// ─── OSRM ───
async function roadKm(lat1, lng1, lat2, lng2) {
  try {
    const r = await fetch(`${OSRM}/${lng1},${lat1};${lng2},${lat2}?overview=false`);
    const d = await r.json();
    if (d.code === "Ok" && d.routes?.[0]) return { km: d.routes[0].distance / 1000, dur: Math.round(d.routes[0].duration / 60) };
  } catch {}
  return { km: haversine(lat1, lng1, lat2, lng2) * 1.3, dur: 0, estimated: true };
}

// ─── Agendor ───
async function agFetch(path, token, opts = {}) {
  const r = await fetch(`${API}${path}`, { ...opts, headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
async function fetchOrgs(token) {
  let pg = 1, all = [];
  while (true) { const d = await agFetch(`/organizations?page=${pg}&per_page=100`, token); if (!d.data?.length) break; all.push(...d.data); if (d.data.length < 100) break; pg++; }
  return all;
}
async function postAct(token, orgId, text) { return agFetch(`/organizations/${orgId}/activities`, token, { method: "POST", body: JSON.stringify({ text, type: "VISITA" }) }); }

function getGPS() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error("GPS indisponível"));
    navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }), rej, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}

// ─── Components ───
function Stat({ icon, label, value, bg, color }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, color }}>{label}</span>
      </div>
      <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{value}</p>
    </div>
  );
}

function Login({ onLogin }) {
  const [tk, setTk] = useState(""); const [ld, setLd] = useState(false); const [er, setEr] = useState("");
  const go = async () => {
    if (!tk.trim()) return; setLd(true); setEr("");
    try { const d = await agFetch("/users/me", tk.trim()); d.data ? onLogin(tk.trim(), d.data) : setEr("Token inválido."); }
    catch { setEr("Falha na conexão. Verifique o token."); } setLd(false);
  };
  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28 }}>📍</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Jordan Check-in</h1>
        <p style={{ fontSize: 14, color: "var(--gray-500)", margin: 0 }}>Conecte ao CRM Agendor</p>
      </div>
      <div className="card" style={{ padding: "1.25rem" }}>
        <label style={{ fontSize: 13, color: "var(--gray-500)", display: "block", marginBottom: 6 }}>Token da API Agendor</label>
        <input type="password" value={tk} onChange={(e) => setTk(e.target.value)} placeholder="Cole seu token aqui..." style={{ width: "100%", marginBottom: 12 }} onKeyDown={(e) => e.key === "Enter" && go()} />
        <p style={{ fontSize: 12, color: "var(--gray-400)", margin: "0 0 16px", lineHeight: 1.5 }}>Encontre em: Agendor → Menu (☰) → Integrações → Token da API</p>
        <button onClick={go} disabled={ld || !tk.trim()} style={{ width: "100%", background: "var(--blue-600)", color: "#fff", border: "none", fontWeight: 500, fontSize: 15, padding: "12px" }}>
          {ld ? "Conectando..." : "Conectar ao Agendor"}
        </button>
        {er && <p style={{ fontSize: 13, color: "var(--red-600)", margin: "12px 0 0", textAlign: "center" }}>{er}</p>}
      </div>
    </div>
  );
}

function OrgCard({ org, active, onIn, onOut, ldId }) {
  const isA = active?.orgId === org.id;
  const addr = [org.address?.street, org.address?.city_name || org.address?.city, org.address?.state].filter(Boolean).join(", ");
  return (
    <div className="card" style={{ padding: "12px 14px", border: isA ? "2px solid var(--blue-500)" : undefined, background: isA ? "var(--blue-50)" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name || org.nickname}</p>
          {addr && <p style={{ fontSize: 12, color: "var(--gray-500)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {addr}</p>}
        </div>
        {isA ? (
          <button onClick={() => onOut(org)} disabled={ldId === org.id} style={{ background: "var(--red-600)", color: "#fff", border: "none", fontSize: 12, fontWeight: 500, padding: "8px 14px", whiteSpace: "nowrap" }}>
            {ldId === org.id ? "..." : "Check-out"}
          </button>
        ) : (
          <button onClick={() => onIn(org)} disabled={!!active || ldId === org.id} style={{ background: active ? "var(--gray-100)" : "var(--green-600)", color: active ? "var(--gray-400)" : "#fff", border: "none", fontSize: 12, fontWeight: 500, padding: "8px 14px", whiteSpace: "nowrap", opacity: active ? 0.5 : 1 }}>
            {ldId === org.id ? "..." : "Check-in"}
          </button>
        )}
      </div>
      {isA && <p style={{ fontSize: 12, color: "var(--blue-600)", margin: "8px 0 0", paddingTop: 8, borderTop: "1px solid var(--blue-100)" }}>⏱ Em visita desde {fT(active.checkinTime)}{active.lat && ` — GPS ${active.lat.toFixed(4)}, ${active.lng.toFixed(4)}`}</p>}
    </div>
  );
}

function Banner({ v, orgs }) {
  const o = orgs.find((x) => x.id === v.orgId);
  const [el, setEl] = useState(0);
  useEffect(() => { const fn = () => setEl(mins(v.checkinTime, new Date())); fn(); const iv = setInterval(fn, 15000); return () => clearInterval(iv); }, [v.checkinTime]);
  return (
    <div style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-600)", animation: "pulse 2s infinite", flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--blue-600)", margin: 0 }}>Em visita: {o?.name || o?.nickname}</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--blue-500)", margin: "3px 0 0 16px" }}>{fT(v.checkinTime)} — {el} min</p>
    </div>
  );
}

function NoteModal({ org, onSave, onCancel }) {
  const [n, setN] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "var(--white)", borderRadius: "16px 16px 0 0", padding: "1.25rem", width: "100%", maxWidth: 480 }}>
        <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 4px" }}>Observações do check-out</p>
        <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "0 0 12px" }}>{org?.name || org?.nickname}</p>
        <textarea value={n} onChange={(e) => setN(e.target.value)} placeholder="O que aconteceu nesta visita? (opcional)" rows={3} style={{ width: "100%", marginBottom: 12, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(n)} style={{ flex: 1, background: "var(--red-600)", color: "#fff", border: "none", fontWeight: 500 }}>Finalizar check-out</button>
        </div>
      </div>
    </div>
  );
}

// ─── Rotas Tab ───
function RotasTab({ visits, fuelPrice }) {
  const [selDate, setSelDate] = useState(new Date().toISOString().slice(0, 10));
  const [routes, setRoutes] = useState([]); const [loading, setLoading] = useState(false);

  const dayVisits = useMemo(() => {
    const target = new Date(selDate + "T12:00:00").toDateString();
    return visits.filter((v) => new Date(v.checkinTime).toDateString() === target && v.checkoutTime).sort((a, b) => new Date(a.checkinTime) - new Date(b.checkinTime));
  }, [visits, selDate]);

  useEffect(() => {
    if (dayVisits.length < 2) { setRoutes([]); return; }
    let c = false; setLoading(true);
    (async () => {
      const segs = [];
      for (let i = 0; i < dayVisits.length - 1; i++) {
        const a = dayVisits[i], b = dayVisits[i + 1];
        if (a.lat && b.lat) { const r = await roadKm(a.checkoutLat || a.lat, a.checkoutLng || a.lng, b.lat, b.lng); segs.push({ from: a.orgName, to: b.orgName, ...r }); }
      }
      if (!c) { setRoutes(segs); setLoading(false); }
    })();
    return () => { c = true; };
  }, [dayVisits]);

  const totalKm = routes.reduce((s, r) => s + r.km, 0);
  const totalDur = routes.reduce((s, r) => s + (r.dur || 0), 0);
  const fuelCost = (totalKm / 10) * fuelPrice;
  const totalVisitTime = dayVisits.reduce((s, v) => s + mins(v.checkinTime, v.checkoutTime), 0);
  const daysWithVisits = [...new Set(visits.filter((v) => v.checkoutTime).map((v) => new Date(v.checkinTime).toISOString().slice(0, 10)))].sort().reverse().slice(0, 30);

  return (
    <div>
      <select value={selDate} onChange={(e) => setSelDate(e.target.value)} style={{ width: "100%", marginBottom: 14, fontSize: 13, padding: "10px 12px" }}>
        <option value={new Date().toISOString().slice(0, 10)}>Hoje — {fD(new Date())}</option>
        {daysWithVisits.filter((d) => d !== new Date().toISOString().slice(0, 10)).map((d) => (
          <option key={d} value={d}>{fWD(d + "T12:00")} — {fD(d + "T12:00")}</option>
        ))}
      </select>

      {dayVisits.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Stat icon="🛣️" label="Km rodado" value={`${totalKm.toFixed(1)} km`} bg="var(--blue-50)" color="var(--blue-600)" />
          <Stat icon="⛽" label="Combustível est." value={`R$ ${fuelCost.toFixed(0)}`} bg="var(--amber-50)" color="var(--amber-600)" />
          <Stat icon="📍" label="Visitas" value={dayVisits.length} bg="var(--green-50)" color="var(--green-600)" />
          <Stat icon="⏱" label="Tempo em PDV" value={hrsMin(totalVisitTime)} bg="var(--blue-50)" color="var(--blue-600)" />
        </div>
      )}

      {loading && <p style={{ fontSize: 13, color: "var(--gray-500)", textAlign: "center", padding: "1rem 0" }}>Calculando rotas por estrada...</p>}

      {dayVisits.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🛣️</p>
          <p style={{ fontSize: 14 }}>Nenhuma visita neste dia</p>
        </div>
      )}

      {dayVisits.length > 0 && (
        <div className="card">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gray-100)" }}>
            <p style={{ fontWeight: 500, fontSize: 14 }}>Rota do dia</p>
          </div>
          {dayVisits.map((v, i) => {
            const seg = i < routes.length ? routes[i] : null;
            const dur = mins(v.checkinTime, v.checkoutTime);
            return (
              <div key={i}>
                <div style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--blue-600)" }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.orgName}</p>
                    <p style={{ fontSize: 12, color: "var(--gray-500)", margin: 0 }}>{fT(v.checkinTime)} → {fT(v.checkoutTime)} — {dur} min</p>
                    {v.note && <p style={{ fontSize: 11, color: "var(--gray-400)", margin: "2px 0 0", fontStyle: "italic" }}>{v.note}</p>}
                  </div>
                  {v.synced && <span style={{ fontSize: 10, color: "var(--green-600)", whiteSpace: "nowrap" }}>✓ Agendor</span>}
                </div>
                {seg && (
                  <div style={{ padding: "6px 16px 6px 56px", background: "var(--gray-50)" }}>
                    <span style={{ fontSize: 12, color: "var(--gray-500)" }}>↓ {seg.km.toFixed(1)} km{seg.dur > 0 && ` — ~${seg.dur} min`}{seg.estimated && " (est.)"}</span>
                  </div>
                )}
              </div>
            );
          })}
          {totalKm > 0 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--gray-100)", background: "var(--gray-50)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Total percorrido</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--blue-600)" }}>{totalKm.toFixed(1)} km</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Relatório Tab ───
function RelatorioTab({ visits, fuelPrice, setFuelPrice }) {
  const [period, setPeriod] = useState("week");
  const now = new Date();
  const periodVisits = useMemo(() => {
    return visits.filter((v) => {
      if (!v.checkoutTime) return false;
      const d = new Date(v.checkinTime);
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
      if (period === "month") { const m = new Date(now); m.setDate(m.getDate() - 30); return d >= m; }
      return true;
    }).sort((a, b) => new Date(a.checkinTime) - new Date(b.checkinTime));
  }, [visits, period]);

  const byDay = useMemo(() => {
    const map = {};
    periodVisits.forEach((v) => { const k = new Date(v.checkinTime).toISOString().slice(0, 10); if (!map[k]) map[k] = []; map[k].push(v); });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [periodVisits]);

  const totalKm = useMemo(() => {
    let km = 0;
    byDay.forEach(([, dvs]) => {
      const sorted = [...dvs].sort((a, b) => new Date(a.checkinTime) - new Date(b.checkinTime));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].lat && sorted[i - 1].lat) km += haversine(sorted[i - 1].checkoutLat || sorted[i - 1].lat, sorted[i - 1].checkoutLng || sorted[i - 1].lng, sorted[i].lat, sorted[i].lng) * 1.3;
      }
    });
    return km;
  }, [byDay]);

  const totalMin = periodVisits.reduce((s, v) => s + mins(v.checkinTime, v.checkoutTime), 0);
  const avgMin = periodVisits.length > 0 ? Math.round(totalMin / periodVisits.length) : 0;
  const fuelCost = (totalKm / 10) * fuelPrice;
  const maxBar = Math.max(1, ...byDay.map(([, v]) => v.length));

  const byCityData = useMemo(() => {
    const map = {};
    periodVisits.forEach((v) => { const c = v.city || "Sem cidade"; if (!map[c]) map[c] = { count: 0, time: 0 }; map[c].count++; map[c].time += mins(v.checkinTime, v.checkoutTime); });
    return Object.entries(map).sort(([, a], [, b]) => b.count - a.count);
  }, [periodVisits]);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "var(--gray-100)", borderRadius: 8, padding: 3 }}>
        {[["today", "Hoje"], ["week", "7 dias"], ["month", "30 dias"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ flex: 1, border: "none", background: period === k ? "var(--white)" : "transparent", borderRadius: 6, padding: "8px 4px", fontSize: 12, fontWeight: period === k ? 600 : 400, color: period === k ? "var(--gray-900)" : "var(--gray-500)", boxShadow: period === k ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Stat icon="🛣️" label="Km total (est.)" value={`${totalKm.toFixed(0)} km`} bg="var(--blue-50)" color="var(--blue-600)" />
        <Stat icon="⛽" label="Combustível" value={`R$ ${fuelCost.toFixed(0)}`} bg="var(--amber-50)" color="var(--amber-600)" />
        <Stat icon="📍" label="Total visitas" value={periodVisits.length} bg="var(--green-50)" color="var(--green-600)" />
        <Stat icon="📅" label="Dias trabalhados" value={byDay.length} bg="var(--blue-50)" color="var(--blue-600)" />
        <Stat icon="⏱" label="Tempo em PDV" value={hrsMin(totalMin)} bg="var(--green-50)" color="var(--green-600)" />
        <Stat icon="📊" label="Média/visita" value={`${avgMin} min`} bg="var(--amber-50)" color="var(--amber-600)" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: "var(--gray-100)", borderRadius: 8, padding: "8px 12px" }}>
        <span style={{ fontSize: 12, color: "var(--gray-500)" }}>⛽ Preço gasolina R$/L</span>
        <input type="number" value={fuelPrice} onChange={(e) => { const v = parseFloat(e.target.value) || 6; setFuelPrice(v); saveJSON("jc:fuelPrice", v); }} step="0.10" min="3" max="12" style={{ width: 70, fontSize: 13, textAlign: "center", padding: "4px 6px" }} />
        <span style={{ fontSize: 11, color: "var(--gray-400)" }}>{(totalKm / 10).toFixed(1)}L</span>
      </div>

      {byDay.length > 0 && (
        <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Visitas por dia</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {byDay.slice(0, 14).map(([date, dvs]) => (
              <div key={date} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--gray-500)", width: 55, flexShrink: 0, textAlign: "right" }}>{fDS(date + "T12:00")}</span>
                <div style={{ flex: 1, height: 20, background: "var(--gray-100)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(dvs.length / maxBar) * 100}%`, background: "var(--blue-500)", borderRadius: 4, minWidth: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, width: 24, textAlign: "right" }}>{dvs.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byCityData.length > 1 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--gray-100)" }}><p style={{ fontWeight: 500, fontSize: 14 }}>Por cidade</p></div>
          {byCityData.map(([city, data], i) => (
            <div key={city} style={{ padding: "8px 16px", borderBottom: i < byCityData.length - 1 ? "1px solid var(--gray-100)" : "none", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{city}</span>
              <span style={{ fontSize: 13, color: "var(--gray-500)" }}>{data.count} visitas — {hrsMin(data.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ───
export default function App() {
  const [token, setToken] = useState(() => loadJSON("jc:token", ""));
  const [user, setUser] = useState(() => loadJSON("jc:user", null));
  const [orgs, setOrgs] = useState(() => loadJSON("jc:orgs", []));
  const [visits, setVisits] = useState(() => loadJSON("jc:visits", []));
  const [active, setActive] = useState(() => loadJSON("jc:active", null));
  const [tab, setTab] = useState("pdvs");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [ldId, setLdId] = useState(null);
  const [geoErr, setGeoErr] = useState("");
  const [coTarget, setCoTarget] = useState(null);
  const [lastSync, setLastSync] = useState(localStorage.getItem("jc:lastSync") || "");
  const [fuelPrice, setFuelPrice] = useState(() => loadJSON("jc:fuelPrice", 6.5));

  useEffect(() => { saveJSON("jc:visits", visits); }, [visits]);
  useEffect(() => { saveJSON("jc:active", active); }, [active]);
  useEffect(() => { saveJSON("jc:orgs", orgs); }, [orgs]);

  const loggedIn = !!(token && user);
  const handleLogin = (t, u) => { setToken(t); setUser(u); saveJSON("jc:token", t); saveJSON("jc:user", u); syncOrgs(t); };
  const handleLogout = () => { setToken(""); setUser(null); saveJSON("jc:token", ""); saveJSON("jc:user", null); };

  const syncOrgs = async (t) => {
    setSyncing(true);
    try { const all = await fetchOrgs(t || token); setOrgs(all); const now = new Date().toISOString(); setLastSync(now); localStorage.setItem("jc:lastSync", now); }
    catch (e) { console.error(e); } setSyncing(false);
  };

  const handleCheckin = async (org) => {
    setLdId(org.id); setGeoErr("");
    try {
      const geo = await getGPS();
      const city = org.address?.city_name || org.address?.city || "";
      const v = { orgId: org.id, orgName: org.name || org.nickname, city, checkinTime: new Date().toISOString(), lat: geo.lat, lng: geo.lng, accuracy: geo.acc, checkoutTime: null, note: "", synced: false };
      try {
        const now = new Date();
        await postAct(token, org.id, `📍 CHECK-IN — ${fD(now)} ${fT(now)}\nLocal: ${v.orgName}\nCoordenadas: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}\nPrecisão GPS: ${geo.acc}m`);
        v.synced = true;
      } catch {}
      setActive(v);
    } catch { setGeoErr("Não foi possível obter GPS. Verifique permissões."); }
    setLdId(null);
  };

  const handleCheckout = async (note) => {
    if (!active) return; setLdId(active.orgId);
    const now = new Date(); let geo = null;
    try { geo = await getGPS(); } catch {}
    const duration = mins(active.checkinTime, now);
    const done = { ...active, checkoutTime: now.toISOString(), checkoutLat: geo?.lat, checkoutLng: geo?.lng, note: note || "" };
    try {
      const lines = [`🏁 CHECK-OUT — ${fD(now)} ${fT(now)}`, `Local: ${active.orgName}`, `Duração: ${duration} min`, `In: ${fT(active.checkinTime)} | Out: ${fT(now)}`];
      if (geo) lines.push(`GPS saída: ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}`);
      if (note) lines.push(`Obs: ${note}`);
      await postAct(token, active.orgId, lines.join("\n"));
      done.synced = true;
    } catch {}
    setVisits((prev) => [done, ...prev]); setActive(null); setCoTarget(null); setLdId(null);
  };

  const filteredOrgs = orgs
    .filter((o) => { const q = search.toLowerCase(); return (o.name || "").toLowerCase().includes(q) || (o.nickname || "").toLowerCase().includes(q) || (o.cnpj || "").includes(q) || (o.address?.city || "").toLowerCase().includes(q) || (o.address?.city_name || "").toLowerCase().includes(q); })
    .sort((a, b) => (a.name || a.nickname || "").localeCompare(b.name || b.nickname || ""));

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const tabs = [
    { id: "pdvs", icon: "🏪", label: "PDVs" },
    { id: "rotas", icon: "🛣️", label: "Rotas" },
    { id: "relatorio", icon: "📊", label: "Relatório" },
    { id: "config", icon: "⚙️", label: "Config" },
  ];

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>📍 Jordan Check-in</h1>
          <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "2px 0 0 26px" }}>{user?.name} — {fD(new Date())}</p>
        </div>
        {tab === "pdvs" && <button onClick={() => syncOrgs()} disabled={syncing} style={{ padding: "8px 12px" }} aria-label="Sincronizar">🔄</button>}
      </div>

      {active && tab !== "config" && <Banner v={active} orgs={orgs} />}

      {/* PDVs */}
      {tab === "pdvs" && (
        <div>
          {syncing && <p style={{ fontSize: 13, color: "var(--gray-500)", textAlign: "center", padding: "2rem 0" }}>Sincronizando Agendor...</p>}
          {!syncing && orgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--gray-400)" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🏪</p><p style={{ fontSize: 14, marginBottom: 12 }}>Nenhum cliente</p>
              <button onClick={() => syncOrgs()}>Sincronizar agora</button>
            </div>
          )}
          {!syncing && orgs.length > 0 && (
            <>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Buscar cliente, cidade ou CNPJ..." style={{ width: "100%", paddingLeft: 12 }} />
              </div>
              {geoErr && <div style={{ background: "var(--red-50)", border: "1px solid var(--red-100)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}><p style={{ fontSize: 12, color: "var(--red-600)", margin: 0 }}>{geoErr}</p></div>}
              <p style={{ fontSize: 11, color: "var(--gray-400)", margin: "0 0 8px" }}>{filteredOrgs.length} de {orgs.length} PDVs{lastSync && ` — sinc. ${fT(lastSync)}`}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredOrgs.slice(0, 50).map((org) => <OrgCard key={org.id} org={org} active={active} onIn={handleCheckin} onOut={(o) => setCoTarget(o)} ldId={ldId} />)}
                {filteredOrgs.length > 50 && <p style={{ fontSize: 12, color: "var(--gray-400)", textAlign: "center", padding: "8px 0" }}>Mostrando 50 de {filteredOrgs.length}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "rotas" && <RotasTab visits={visits} fuelPrice={fuelPrice} />}
      {tab === "relatorio" && <RelatorioTab visits={visits} fuelPrice={fuelPrice} setFuelPrice={setFuelPrice} />}

      {tab === "config" && (
        <div>
          <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "var(--gray-500)", margin: "0 0 2px" }}>Conectado como</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{user?.name}</p>
            {user?.email && <p style={{ fontSize: 12, color: "var(--gray-500)", margin: 0 }}>{user.email}</p>}
          </div>
          <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: 12 }}>
            <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Dados</p>
            <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "0 0 4px" }}>{orgs.length} clientes sincronizados</p>
            <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "0 0 4px" }}>{visits.length} visitas registradas</p>
            {lastSync && <p style={{ fontSize: 12, color: "var(--gray-500)", margin: 0 }}>Última sinc: {fD(lastSync)} {fT(lastSync)}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <button onClick={() => syncOrgs()} disabled={syncing} style={{ width: "100%" }}>🔄 {syncing ? "Sincronizando..." : "Sincronizar clientes"}</button>
            <button onClick={() => { setVisits([]); saveJSON("jc:visits", []); }} style={{ width: "100%", color: "var(--amber-600)" }}>🗑 Limpar histórico</button>
            <button onClick={handleLogout} style={{ width: "100%", color: "var(--red-600)" }}>🚪 Desconectar</button>
          </div>
          <div style={{ background: "var(--gray-100)", borderRadius: 8, padding: "12px 16px" }}>
            <p style={{ fontSize: 11, color: "var(--gray-400)", lineHeight: 1.6 }}>Jordan Check-in v2.0 — Agendor API v3 + OSRM. Cada check-in/out registra atividade no CRM com GPS. Km por estrada real (OSRM). Consumo: 10km/L.</p>
          </div>
        </div>
      )}

      {/* Bottom tab bar (fixed) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--white)", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "center", zIndex: 40 }}>
        <div style={{ display: "flex", maxWidth: 480, width: "100%" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, border: "none", borderRadius: 0, background: "transparent", padding: "10px 4px 8px", fontSize: 10, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "var(--blue-600)" : "var(--gray-400)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {coTarget && <NoteModal org={coTarget} onSave={handleCheckout} onCancel={() => setCoTarget(null)} />}
    </div>
  );
}
