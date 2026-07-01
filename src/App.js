import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── API Layer ─────────────────────────────────────────────────────────────────
const BASE_URL = "https://supplyguard-api-dp47.onrender.com";
const get  = (path) => fetch(`${BASE_URL}${path}`).then(r => r.json());
const post = (path, body) => fetch(`${BASE_URL}${path}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}).then(r => r.json());

const api = {
  allSuppliers:     ()                            => get("/risk/all-suppliers"),
  alternates:       (name, material, risk)        => post("/risk/alternate-suppliers", {
    supplier_name: name, material, current_risk: risk, top_n: 3,
  }),
  portfolioSummary: ()                            => get("/risk/portfolio-summary"),
  forecast:         (material = "Semiconductors") => get(`/forecast/demand?material=${encodeURIComponent(material)}&weeks=12`),
  alerts:           ()                            => get("/alerts/"),
};

const RISK_HISTORY = [
  { month:"Jan", score:48 }, { month:"Feb", score:52 }, { month:"Mar", score:61 },
  { month:"Apr", score:57 }, { month:"May", score:71 }, { month:"Jun", score:68 },
  { month:"Jul", score:75 }, { month:"Aug", score:69 }, { month:"Sep", score:82 },
  { month:"Oct", score:78 }, { month:"Nov", score:85 }, { month:"Dec", score:79 },
];

const riskColor = r => r >= 70 ? "#FF4D4D" : r >= 40 ? "#F5A623" : "#2ECC9A";
const riskLabel = r => r >= 70 ? "Critical" : r >= 40 ? "Medium" : "Low";
const sevColor  = { critical:"#FF4D4D", high:"#F5A623", medium:"#3B9EFF", low:"#2ECC9A" };

// ── useIsMobile hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Reusable components ───────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{
    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:14, padding:"16px 18px", flex:1, minWidth:130,
    borderTop:`3px solid ${accent}`,
  }}>
    <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase",
      color:"rgba(255,255,255,0.45)", marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color:"#fff",
      fontFamily:"'Space Grotesk',sans-serif", lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{sub}</div>
  </div>
);

const RiskBadge = ({ score }) => (
  <span style={{
    background: riskColor(score) + "22", color: riskColor(score),
    border:`1px solid ${riskColor(score)}44`,
    borderRadius:6, padding:"2px 9px", fontSize:11, fontWeight:600,
  }}>{riskLabel(score)}</span>
);

const RiskBar = ({ score }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
      <div style={{ width:`${score}%`, height:"100%", background:riskColor(score),
        borderRadius:3, transition:"width .5s ease" }}/>
    </div>
    <span style={{ fontSize:11, color:riskColor(score), fontWeight:600, minWidth:24 }}>{score}</span>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#111827", border:"1px solid rgba(255,255,255,0.12)",
      borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:"rgba(255,255,255,0.5)", marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#fff", fontWeight:600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
    height:140, color:"rgba(255,255,255,0.25)", fontSize:13, gap:10 }}>
    <div style={{
      width:18, height:18, border:"2px solid rgba(255,255,255,0.1)",
      borderTop:"2px solid #3B9EFF", borderRadius:"50%",
      animation:"spin 0.8s linear infinite",
    }}/>
    Loading from API...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorBanner = ({ msg, onRetry }) => (
  <div style={{
    background:"rgba(255,77,77,0.08)", border:"1px solid rgba(255,77,77,0.25)",
    borderRadius:10, padding:"12px 16px", fontSize:13, color:"#FF4D4D",
    display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
  }}>
    <span>⚠ {msg}</span>
    <button onClick={onRetry} style={{
      background:"rgba(255,77,77,0.15)", border:"1px solid rgba(255,77,77,0.3)",
      color:"#FF4D4D", borderRadius:6, padding:"4px 12px", fontSize:12,
      cursor:"pointer", flexShrink:0,
    }}>Retry</button>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SupplyGuardAI() {
  const isMobile = useIsMobile();

  const [tab,          setTab]        = useState("overview");
  const [sidebarOpen,  setSidebar]    = useState(false);
  const [matFilter,    setMat]        = useState("All");
  const [sortCol,      setSort]       = useState("risk_score");
  const [sortDir,      setSortDir]    = useState(-1);
  const [altModal,     setAlt]        = useState(null);
  const [altData,      setAltData]    = useState(null);
  const [altLoading,   setAltLoading] = useState(false);
  const [pulse,        setPulse]      = useState(0);
  const [dismissed,    setDismissed]  = useState([]);

  const [suppliers,  setSuppliers]  = useState([]);
  const [portfolio,  setPortfolio]  = useState(null);
  const [forecast,   setForecast]   = useState([]);
  const [fcInsights, setFcInsights] = useState(null);
  const [alerts,     setAlerts]     = useState([]);
  const [alertMeta,  setAlertMeta]  = useState(null);
  const [loading,    setLoading]    = useState({ suppliers:true, forecast:true, alerts:true });
  const [errors,     setErrors]     = useState({});

  const setErr   = (key, msg) => setErrors(e => ({ ...e, [key]: msg }));
  const clearErr = (key)      => setErrors(e => ({ ...e, [key]: null }));

  const fetchSuppliers = useCallback(async () => {
    setLoading(l => ({ ...l, suppliers:true }));
    clearErr("suppliers");
    try {
      const [supRes, portRes] = await Promise.all([api.allSuppliers(), api.portfolioSummary()]);
      setSuppliers(supRes.suppliers || []);
      setPortfolio({ ...supRes, materials: portRes.materials });
    } catch {
      setErr("suppliers", "Backend is waking up — please wait 50 seconds and click Retry.");
    } finally {
      setLoading(l => ({ ...l, suppliers:false }));
    }
  }, []);

  const fetchForecast = useCallback(async (material = "Semiconductors") => {
    setLoading(l => ({ ...l, forecast:true }));
    clearErr("forecast");
    try {
      const res = await api.forecast(material);
      setForecast(res.forecast || []);
      setFcInsights(res.insights || null);
    } catch {
      setErr("forecast", "Forecast API unavailable.");
    } finally {
      setLoading(l => ({ ...l, forecast:false }));
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(l => ({ ...l, alerts:true }));
    clearErr("alerts");
    try {
      const res = await api.alerts();
      setAlerts(res.alerts || []);
      setAlertMeta(res);
    } catch {
      setErr("alerts", "Alerts API unavailable.");
    } finally {
      setLoading(l => ({ ...l, alerts:false }));
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchForecast();
    fetchAlerts();
    const t = setInterval(() => setPulse(p => p + 1), 1200);
    const alertTimer = setInterval(fetchAlerts, 60000);
    return () => { clearInterval(t); clearInterval(alertTimer); };
  }, [fetchSuppliers, fetchForecast, fetchAlerts]);

  const openAltModal = async (supplier) => {
    setAlt(supplier);
    setAltData(null);
    setAltLoading(true);
    try {
      const res = await api.alternates(supplier.name, supplier.material, supplier.risk_score);
      setAltData(res);
    } catch {
      setAltData({ error: true });
    } finally {
      setAltLoading(false);
    }
  };

  const navigateTo = (id) => {
    setTab(id);
    setSidebar(false);
  };

  const materials = ["All", "Semiconductors", "Battery Metals", "Steel"];

  const filtered = suppliers
    .filter(s => matFilter === "All" || s.material === matFilter)
    .sort((a, b) => sortDir * (a[sortCol] > b[sortCol] ? 1 : -1));

  const criticalCount = alertMeta ? alertMeta.critical + alertMeta.high : 0;
  const avgRisk       = portfolio ? Math.round(portfolio.avg_portfolio_risk) : 0;
  const activeAlerts  = alerts.filter(a => !dismissed.includes(a.id));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSort(col); setSortDir(-1); }
  };

  const HEADER_H = 57;

  const card = {
    background:"rgba(255,255,255,0.03)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:16, padding:"20px 24px",
  };

  const filterBtn = (active) => ({
    padding:"5px 10px", borderRadius:6, fontSize:11, fontWeight:500,
    background: active ? "rgba(59,158,255,0.15)" : "transparent",
    color: active ? "#3B9EFF" : "rgba(255,255,255,0.4)",
    border: active ? "1px solid rgba(59,158,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
    cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap",
  });

  const navItems = [
    { id:"overview",  label:"Overview" },
    { id:"suppliers", label:"Suppliers" },
    { id:"forecast",  label:"Forecast" },
    { id:"alerts",    label:`Alerts${activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ""}` },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#070B14",
      minHeight:"100vh", color:"#fff" }}>

      {/* ── Header ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding: isMobile ? "12px 16px" : "14px 28px",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(255,255,255,0.01)",
        position:"sticky", top:0, zIndex:60, height: HEADER_H,
      }}>
        {/* Left: hamburger (mobile) + logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isMobile && (
            <button onClick={() => setSidebar(o => !o)} style={{
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:8, color:"#fff", fontSize:18, cursor:"pointer",
              width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
          <div style={{ width:32, height:32, borderRadius:9,
            background:"linear-gradient(135deg,#3B9EFF,#0052CC)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800, flexShrink:0 }}>S</div>
          <span style={{ fontSize:16, fontWeight:700, letterSpacing:"-0.02em" }}>
            SupplyGuard <span style={{ color:"#3B9EFF" }}>AI</span>
          </span>
          {!isMobile && (
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)",
              background:"rgba(255,255,255,0.05)", borderRadius:4, padding:"2px 7px",
              letterSpacing:"0.05em" }}>LIVE API</span>
          )}
        </div>

        {/* Right: filters + live indicator */}
        <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 16 }}>
          {!isMobile && (
            <>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Material focus:</span>
              <div style={{ display:"flex", gap:6 }}>
                {materials.map(m => (
                  <button key={m} style={filterBtn(matFilter === m)}
                    onClick={() => { setMat(m); if (tab==="forecast" && m!=="All") fetchForecast(m); }}>
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{
            width:8, height:8, borderRadius:"50%", background:"#2ECC9A", flexShrink:0,
            boxShadow:`0 0 ${pulse % 2 === 0 ? 8 : 4}px #2ECC9A`, transition:"box-shadow .4s",
          }}/>
          <span style={{ fontSize:12, color:"#2ECC9A" }}>Live</span>
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebar(false)} style={{
          position:"fixed", inset:0, top: HEADER_H,
          background:"rgba(0,0,0,0.6)", zIndex:49,
        }}/>
      )}

      <div style={{ display:"flex", height:`calc(100vh - ${HEADER_H}px)` }}>

        {/* ── Sidebar ── */}
        <div style={{
          width:220, background:"rgba(7,11,20,0.98)",
          borderRight:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column", padding:"20px 0", gap:2,
          flexShrink:0,
          ...(isMobile ? {
            position:"fixed", left: sidebarOpen ? 0 : -220,
            top: HEADER_H, height:`calc(100vh - ${HEADER_H}px)`,
            zIndex:50, transition:"left 0.28s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.5)" : "none",
          } : {
            position:"relative",
          }),
        }}>
          <div style={{ padding:"0 20px 12px", fontSize:10, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"rgba(255,255,255,0.2)" }}>Navigation</div>

          {navItems.map(n => (
            <div key={n.id}
              onClick={() => navigateTo(n.id)}
              style={{
                display:"flex", alignItems:"center", gap:10, padding:"11px 20px",
                fontSize:13, fontWeight: tab === n.id ? 600 : 400,
                color: tab === n.id ? "#3B9EFF" : "rgba(255,255,255,0.5)",
                background: tab === n.id ? "rgba(59,158,255,0.08)" : "transparent",
                borderLeft: tab === n.id ? "2px solid #3B9EFF" : "2px solid transparent",
                cursor:"pointer", transition:"all .15s",
                borderRadius:"0 8px 8px 0", userSelect:"none",
              }}>
              {n.label}
              {n.id === "alerts" && (alertMeta?.critical || 0) > 0 && (
                <span style={{ marginLeft:"auto", background:"#FF4D4D", color:"#fff",
                  borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>!</span>
              )}
            </div>
          ))}

          {/* Mobile material filter inside sidebar */}
          {isMobile && (
            <div style={{ padding:"16px 20px 0", borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:8 }}>
              <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase",
                color:"rgba(255,255,255,0.2)", marginBottom:10 }}>Material Focus</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {materials.map(m => (
                  <button key={m} style={{
                    ...filterBtn(matFilter === m),
                    textAlign:"left", width:"100%", padding:"7px 10px",
                  }}
                    onClick={() => { setMat(m); if (tab==="forecast" && m!=="All") fetchForecast(m); }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop:"auto", padding:"16px 20px",
            borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:6 }}>
              Overall supply risk
            </div>
            {loading.suppliers
              ? <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Loading...</div>
              : <>
                  <div style={{ fontSize:24, fontWeight:700, color:riskColor(avgRisk) }}>{avgRisk}</div>
                  <RiskBar score={avgRisk}/>
                </>
            }
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{
          flex:1, overflow:"auto",
          padding: isMobile ? "20px 16px" : "28px 32px",
        }}>

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:"#fff",
                  letterSpacing:"-0.02em", marginBottom:4 }}>Supply Chain Overview</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                  Real-time risk intelligence · {suppliers.length} suppliers tracked
                </div>
              </div>

              {errors.suppliers && <ErrorBanner msg={errors.suppliers} onRetry={fetchSuppliers}/>}

              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <KpiCard label="Active Suppliers" value={loading.suppliers ? "—" : suppliers.length}
                  sub="Across global regions" accent="#3B9EFF"/>
                <KpiCard label="High Risk" value={loading.alerts ? "—" : criticalCount}
                  sub="Alerts requiring action" accent="#FF4D4D"/>
                <KpiCard label="Avg Risk Score" value={loading.suppliers ? "—" : avgRisk}
                  sub="AI-predicted portfolio avg" accent={riskColor(avgRisk)}/>
                <KpiCard label="Alternates Ready"
                  value={loading.suppliers ? "—" : suppliers.filter(s => s.risk_score >= 60).length}
                  sub="High-risk suppliers" accent="#2ECC9A"/>
              </div>

              <div style={{ display:"grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
                <div style={card}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:16,
                    color:"rgba(255,255,255,0.8)" }}>Portfolio Risk Score — 12 months</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={RISK_HISTORY}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF4D4D" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)"/>
                      <XAxis dataKey="month" tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }}
                        axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }}
                        axisLine={false} tickLine={false} domain={[0,100]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="score" name="Risk score"
                        stroke="#FF4D4D" strokeWidth={2} fill="url(#rg)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={card}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:16,
                    color:"rgba(255,255,255,0.8)" }}>
                    Risk by Material Category
                    <span style={{ fontSize:11, color:"#2ECC9A", marginLeft:8 }}>AI model</span>
                  </div>
                  {loading.suppliers ? <Spinner/> : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={portfolio?.materials?.map(m => ({ name: m.material, risk: m.avg_risk })) || []}
                        layout="vertical" barSize={10}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" horizontal={false}/>
                        <XAxis type="number" tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }}
                          axisLine={false} tickLine={false} domain={[0,100]}/>
                        <YAxis type="category" dataKey="name"
                          tick={{ fontSize: isMobile ? 9 : 11, fill:"rgba(255,255,255,0.5)" }}
                          axisLine={false} tickLine={false} width={isMobile ? 80 : 100}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="risk" name="Risk score" radius={[0,5,5,0]} fill="#3B9EFF"/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={card}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)" }}>
                    Recent Alerts
                    {alertMeta && (
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginLeft:8 }}>
                        {alertMeta.total} total · {alertMeta.critical} critical
                      </span>
                    )}
                  </div>
                  <button style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
                    color:"rgba(255,255,255,0.4)", borderRadius:7, padding:"5px 12px",
                    fontSize:12, cursor:"pointer" }} onClick={() => navigateTo("alerts")}>
                    View all →
                  </button>
                </div>
                {loading.alerts ? <Spinner/> : alerts.slice(0, 3).map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:12,
                    padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", marginTop:4,
                      background:sevColor[a.severity], flexShrink:0,
                      boxShadow:`0 0 6px ${sevColor[a.severity]}` }}/>
                    <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.75)" }}>{a.message}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>{a.time_ago}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SUPPLIERS ══ */}
          {tab === "suppliers" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:"#fff",
                  letterSpacing:"-0.02em", marginBottom:4 }}>Supplier Intelligence</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                  {filtered.length} suppliers · AI risk scores
                </div>
              </div>
              {errors.suppliers && <ErrorBanner msg={errors.suppliers} onRetry={fetchSuppliers}/>}
              {loading.suppliers ? <Spinner/> : (
                <div style={{ ...card, padding:0, overflow:"hidden", overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", minWidth: isMobile ? 600 : "auto" }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                        {[
                          ["name","Supplier"], ["country","Country"], ["material","Material"],
                          ["risk_score","Risk"], ["lead_time","Lead"],
                          ["rating","Rating"], ["geo_score","Geo"],
                        ].map(([col, label]) => (
                          <th key={col}
                            onClick={() => handleSort(col)}
                            style={{ fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
                              color:"rgba(255,255,255,0.35)", padding:"8px 10px", textAlign:"left",
                              cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" }}>
                            {label} {sortCol === col ? (sortDir === -1 ? "↓" : "↑") : ""}
                          </th>
                        ))}
                        <th style={{ fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
                          color:"rgba(255,255,255,0.35)", padding:"8px 10px", textAlign:"left" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"10px", fontSize:13, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ fontWeight:600, fontSize:12 }}>{s.name}</div>
                          </td>
                          <td style={{ padding:"10px", fontSize:12, color:"rgba(255,255,255,0.5)",
                            borderBottom:"1px solid rgba(255,255,255,0.04)", whiteSpace:"nowrap" }}>
                            {s.country}
                          </td>
                          <td style={{ padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ fontSize:10, padding:"2px 6px", borderRadius:5,
                              background:"rgba(59,158,255,0.1)", color:"#3B9EFF", whiteSpace:"nowrap" }}>
                              {s.material}
                            </span>
                          </td>
                          <td style={{ padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                              <RiskBadge score={s.risk_score}/>
                              <RiskBar score={Math.round(s.risk_score)}/>
                            </div>
                          </td>
                          <td style={{ padding:"10px", fontSize:12, color:"rgba(255,255,255,0.7)",
                            borderBottom:"1px solid rgba(255,255,255,0.04)", whiteSpace:"nowrap" }}>
                            {s.lead_time}d
                          </td>
                          <td style={{ padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ color:"#F5A623", fontWeight:600, fontSize:12 }}>
                              {"★".repeat(Math.floor(s.rating))}
                              <span style={{ color:"rgba(255,255,255,0.2)" }}>
                                {"★".repeat(5 - Math.floor(s.rating))}
                              </span>
                            </span>
                          </td>
                          <td style={{ padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ color:riskColor(s.geo_score), fontSize:12, fontWeight:600 }}>
                              {Math.round(s.geo_score)}
                            </span>
                          </td>
                          <td style={{ padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                            {s.risk_score >= 40
                              ? <button onClick={() => openAltModal(s)} style={{
                                  background:"rgba(46,204,154,0.1)", color:"#2ECC9A",
                                  border:"1px solid rgba(46,204,154,0.3)", borderRadius:6,
                                  padding:"4px 8px", fontSize:10, fontWeight:600,
                                  cursor:"pointer", whiteSpace:"nowrap",
                                }}>Find alt</button>
                              : <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>Low risk</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ FORECAST ══ */}
          {tab === "forecast" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#fff",
                    letterSpacing:"-0.02em", marginBottom:4 }}>Demand Forecast</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                    AI model · 12-week projection · 80% confidence band
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["Semiconductors","Battery Metals","Steel"].map(m => (
                    <button key={m} style={filterBtn(matFilter === m)}
                      onClick={() => { setMat(m); fetchForecast(m); }}>{m}</button>
                  ))}
                </div>
              </div>
              {errors.forecast && <ErrorBanner msg={errors.forecast} onRetry={() => fetchForecast(matFilter)}/>}
              <div style={card}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:20,
                  color:"rgba(255,255,255,0.8)" }}>
                  Units required · {matFilter === "All" ? "Semiconductors" : matFilter}
                  <span style={{ fontSize:11, color:"#2ECC9A", marginLeft:8 }}>Prophet model</span>
                </div>
                {loading.forecast ? <Spinner/> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                    <AreaChart data={forecast} margin={{ top:5, right:10, bottom:0, left:0 }}>
                      <defs>
                        <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3B9EFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B9EFF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"  stopColor="#2ECC9A" stopOpacity={0.08}/>
                          <stop offset="100%" stopColor="#2ECC9A" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.06)"/>
                      <XAxis dataKey="week" tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }}
                        axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }}
                        axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="upper" name="Upper bound"
                        stroke="none" fill="url(#bg)" fillOpacity={1}/>
                      <Area type="monotone" dataKey="lower" name="Lower bound"
                        stroke="none" fill="#070B14" fillOpacity={1}/>
                      <Area type="monotone" dataKey="demand" name="Demand forecast"
                        stroke="#3B9EFF" strokeWidth={2.5} fill="url(#dg)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {fcInsights && (
                <div style={{ display:"grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap:12 }}>
                  {[
                    { label:"Peak demand week", value:fcInsights.peak_week,
                      sub:`${fcInsights.peak_demand} units projected`, color:"#FF4D4D" },
                    { label:"Avg weekly demand", value:Math.round(fcInsights.avg_weekly_demand),
                      sub:"units per week", color:"#3B9EFF" },
                    { label:"Reorder recommended", value:fcInsights.reorder_recommended_week,
                      sub:`Trend: ${fcInsights.trend}`, color:"#2ECC9A" },
                  ].map(c => (
                    <div key={c.label} style={{ ...card, borderTop:`3px solid ${c.color}` }}>
                      <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em",
                        color:"rgba(255,255,255,0.35)", marginBottom:6 }}>{c.label}</div>
                      <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>{c.value}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ALERTS ══ */}
          {tab === "alerts" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#fff",
                    letterSpacing:"-0.02em", marginBottom:4 }}>Disruption Alerts</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                    {activeAlerts.length} active · auto-refreshes every 60s
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {dismissed.length > 0 && (
                    <button onClick={() => setDismissed([])} style={{
                      background:"transparent", border:"1px solid rgba(255,255,255,0.15)",
                      color:"rgba(255,255,255,0.4)", borderRadius:7, padding:"5px 12px",
                      fontSize:12, cursor:"pointer" }}>
                      Restore {dismissed.length}
                    </button>
                  )}
                  <button onClick={fetchAlerts} style={{
                    background:"rgba(59,158,255,0.1)", border:"1px solid rgba(59,158,255,0.2)",
                    color:"#3B9EFF", borderRadius:7, padding:"5px 12px",
                    fontSize:12, cursor:"pointer" }}>
                    ↻ Refresh
                  </button>
                </div>
              </div>
              {errors.alerts && <ErrorBanner msg={errors.alerts} onRetry={fetchAlerts}/>}
              {loading.alerts ? <Spinner/> : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {activeAlerts.map(a => (
                    <div key={a.id} style={{
                      ...card,
                      borderLeft:`3px solid ${sevColor[a.severity]}`,
                      display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px",
                    }}>
                      <div style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, marginTop:4,
                        background:sevColor[a.severity],
                        boxShadow: a.severity==="critical" ? `0 0 10px ${sevColor[a.severity]}` : "none" }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6,
                          marginBottom:5, flexWrap:"wrap" }}>
                          <span style={{
                            fontSize:10, fontWeight:700, letterSpacing:"0.08em",
                            textTransform:"uppercase", color:sevColor[a.severity],
                            background: sevColor[a.severity]+"22", padding:"2px 7px", borderRadius:4,
                          }}>{a.severity}</span>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{a.region}</span>
                          {a.type === "supplier" && (
                            <span style={{ fontSize:10, color:"rgba(59,158,255,0.7)",
                              background:"rgba(59,158,255,0.1)", padding:"1px 6px", borderRadius:4 }}>
                              AI detected
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>
                          {a.message}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{a.time_ago}</div>
                      </div>
                      <button onClick={() => setDismissed(d => [...d, a.id])} style={{
                        background:"transparent", border:"none", color:"rgba(255,255,255,0.2)",
                        fontSize:18, cursor:"pointer", lineHeight:1, padding:"0 4px", flexShrink:0,
                      }}>×</button>
                    </div>
                  ))}
                  {activeAlerts.length === 0 && (
                    <div style={{ ...card, textAlign:"center", padding:"40px",
                      color:"rgba(255,255,255,0.3)", fontSize:14 }}>
                      All alerts dismissed ✓
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Alternate Supplier Modal ── */}
      {altModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:100,
          backdropFilter:"blur(4px)", padding:16 }}
          onClick={() => { setAlt(null); setAltData(null); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#0E1524", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:20, padding:"24px", width:"100%", maxWidth:440,
            maxHeight:"90vh", overflowY:"auto",
          }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em",
              color:"rgba(255,255,255,0.3)", marginBottom:8 }}>AI Alternate Sourcing Engine</div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>
              Switch from {altModal.name}?
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>
              Current risk: <span style={{ color:riskColor(altModal.risk_score), fontWeight:600 }}>
                {Math.round(altModal.risk_score)}
              </span> · {altModal.country} · {altModal.material}
            </div>

            {altLoading && <Spinner/>}

            {altData && !altData.error && altData.alternates?.map((a, i) => (
              <div key={i} style={{ background:"rgba(46,204,154,0.06)",
                border:"1px solid rgba(46,204,154,0.2)", borderRadius:12,
                padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{a.name}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                      {a.country} · {a.material}
                    </div>
                  </div>
                  <RiskBadge score={a.risk_score}/>
                </div>
                <div style={{ display:"flex", gap:12, marginTop:10, fontSize:12,
                  color:"rgba(255,255,255,0.5)", flexWrap:"wrap" }}>
                  <span>Lead: <b style={{ color:"#fff" }}>{a.lead_time}d</b></span>
                  <span>Rating: <b style={{ color:"#F5A623" }}>{a.rating}★</b></span>
                  <span style={{ color: a.recommendation==="Strongly recommended" ? "#2ECC9A" : "#F5A623" }}>
                    {a.recommendation}
                  </span>
                </div>
                <div style={{ marginTop:8, fontSize:12, color:"#2ECC9A" }}>
                  ↓ {a.risk_reduction} pts lower risk vs current supplier
                </div>
              </div>
            ))}

            {altData?.error && (
              <div style={{ fontSize:13, color:"#FF4D4D", marginBottom:16 }}>
                Could not load alternates from API.
              </div>
            )}

            <button onClick={() => { setAlt(null); setAltData(null); }} style={{
              width:"100%", marginTop:6, padding:"10px", borderRadius:9,
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer",
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}