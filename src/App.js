import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Mock Data ────────────────────────────────────────────────────────────────
const SUPPLIERS = [
  { id: 1, name: "NeoChip Taiwan", country: "Taiwan", material: "Semiconductors", risk: 82, lead: 18, rating: 4.2, price: 124, trend: "up",   alt: true },
  { id: 2, name: "SinoElec Corp",  country: "China",  material: "Semiconductors", risk: 91, lead: 22, rating: 3.7, price: 98,  trend: "up",   alt: true },
  { id: 3, name: "VoltPath India", country: "India",  material: "Semiconductors", risk: 31, lead: 12, rating: 4.6, price: 111, trend: "down", alt: false },
  { id: 4, name: "TexasIC USA",    country: "USA",    material: "Semiconductors", risk: 24, lead: 9,  rating: 4.8, price: 148, trend: "stable",alt:false },
  { id: 5, name: "EuroSemi GmbH",  country: "Germany",material: "Semiconductors", risk: 18, lead: 14, rating: 4.5, price: 139, trend: "down", alt: false },
  { id: 6, name: "LithoCo Korea",  country: "Korea",  material: "Battery Metals", risk: 44, lead: 20, rating: 4.1, price: 87,  trend: "stable",alt:true },
  { id: 7, name: "CopperLane Chile",country:"Chile",  material: "Battery Metals", risk: 37, lead: 25, rating: 3.9, price: 72,  trend: "up",   alt: false },
  { id: 8, name: "MineX Congo",    country: "Congo",  material: "Battery Metals", risk: 78, lead: 35, rating: 3.2, price: 54,  trend: "up",   alt: true },
  { id: 9, name: "AutoSteel DE",   country: "Germany",material: "Steel",         risk: 22, lead: 11, rating: 4.7, price: 63,  trend: "stable",alt:false },
  { id:10, name: "SteelIndia Ltd", country: "India",  material: "Steel",         risk: 29, lead: 13, rating: 4.4, price: 58,  trend: "down", alt: false },
];

const ALERTS = [
  { id:1, sev:"critical", msg:"Taiwan Strait shipping lane restrictions detected", time:"2 min ago",  region:"Asia Pacific" },
  { id:2, sev:"high",     msg:"NeoChip Taiwan lead time extended by 8 days",       time:"14 min ago", region:"Taiwan" },
  { id:3, sev:"high",     msg:"Cobalt price spike +23% in Congo DRC",              time:"1 hr ago",   region:"Africa" },
  { id:4, sev:"medium",   msg:"SinoElec Corp Q2 capacity reduced by 15%",          time:"3 hr ago",   region:"China" },
  { id:5, sev:"medium",   msg:"US tariff update on East Asian semiconductor imports",time:"6 hr ago",  region:"Global" },
  { id:6, sev:"low",      msg:"VoltPath India new facility online — capacity +20%", time:"1 day ago",  region:"India" },
];

const FORECAST = [
  { week:"W1",  demand:420, upper:460, lower:380 },
  { week:"W2",  demand:445, upper:490, lower:400 },
  { week:"W3",  demand:410, upper:455, lower:370 },
  { week:"W4",  demand:480, upper:530, lower:430 },
  { week:"W5",  demand:520, upper:575, lower:470 },
  { week:"W6",  demand:505, upper:560, lower:455 },
  { week:"W7",  demand:550, upper:610, lower:495 },
  { week:"W8",  demand:530, upper:590, lower:475 },
  { week:"W9",  demand:565, upper:625, lower:510 },
  { week:"W10", demand:590, upper:655, lower:530 },
  { week:"W11", demand:610, upper:680, lower:545 },
  { week:"W12", demand:640, upper:715, lower:575 },
];

const RISK_HISTORY = [
  { month:"Jan", score:48 }, { month:"Feb", score:52 }, { month:"Mar", score:61 },
  { month:"Apr", score:57 }, { month:"May", score:71 }, { month:"Jun", score:68 },
  { month:"Jul", score:75 }, { month:"Aug", score:69 }, { month:"Sep", score:82 },
  { month:"Oct", score:78 }, { month:"Nov", score:85 }, { month:"Dec", score:79 },
];

const MATERIAL_RISK = [
  { name:"Semiconductors", risk:74 },
  { name:"Battery Metals", risk:58 },
  { name:"Steel",          risk:26 },
  { name:"Rare Earths",    risk:88 },
  { name:"Plastics",       risk:19 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const riskColor = (r) =>
  r >= 70 ? "#FF4D4D" : r >= 40 ? "#F5A623" : "#2ECC9A";

const riskLabel = (r) =>
  r >= 70 ? "Critical" : r >= 40 ? "Medium" : "Low";

const sevColor = { critical:"#FF4D4D", high:"#F5A623", medium:"#3B9EFF", low:"#2ECC9A" };

const TrendIcon = ({ t }) => (
  <span style={{ fontSize:12, marginLeft:4 }}>
    {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
  </span>
);

// ── Sub-components ───────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{
    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:14, padding:"18px 22px", flex:1, minWidth:140,
    borderTop:`3px solid ${accent}`,
  }}>
    <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase",
      color:"rgba(255,255,255,0.45)", marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk',sans-serif",
      lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:5 }}>{sub}</div>
  </div>
);

const RiskBadge = ({ score }) => (
  <span style={{
    background: riskColor(score) + "22",
    color: riskColor(score),
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

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function SupplyGuardAI() {
  const [tab, setTab]         = useState("overview");
  const [matFilter, setMat]   = useState("All");
  const [sortCol, setSort]    = useState("risk");
  const [sortDir, setSortDir] = useState(-1);
  const [altModal, setAlt]    = useState(null);
  const [pulse, setPulse]     = useState(0);
  const [dismissed, setDismissed] = useState([]);

  // Pulse animation for critical alerts
  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 1200);
    return () => clearInterval(t);
  }, []);

  const materials = ["All", "Semiconductors", "Battery Metals", "Steel"];

  const filtered = SUPPLIERS
    .filter(s => matFilter === "All" || s.material === matFilter)
    .sort((a, b) => sortDir * (a[sortCol] > b[sortCol] ? 1 : -1));

  const criticalCount = ALERTS.filter(a => a.sev === "critical" || a.sev === "high").length;
  const avgRisk = Math.round(SUPPLIERS.reduce((s,x) => s + x.risk, 0) / SUPPLIERS.length);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSort(col); setSortDir(-1); }
  };

  const activeAlerts = ALERTS.filter(a => !dismissed.includes(a.id));

  // Styles
  const S = {
    root: {
      fontFamily:"'DM Sans', 'Segoe UI', sans-serif",
      background:"#070B14",
      minHeight:"100vh",
      color:"#fff",
      padding:"0",
    },
    sidebar: {
      width:220, background:"rgba(255,255,255,0.02)",
      borderRight:"1px solid rgba(255,255,255,0.07)",
      display:"flex", flexDirection:"column", padding:"24px 0",
      gap:2, flexShrink:0,
    },
    navItem: (active) => ({
      display:"flex", alignItems:"center", gap:10, padding:"10px 20px",
      fontSize:13, fontWeight: active ? 600 : 400,
      color: active ? "#3B9EFF" : "rgba(255,255,255,0.5)",
      background: active ? "rgba(59,158,255,0.08)" : "transparent",
      borderLeft: active ? "2px solid #3B9EFF" : "2px solid transparent",
      cursor:"pointer", transition:"all .15s", borderRadius:"0 8px 8px 0",
      userSelect:"none",
    }),
    content: { flex:1, overflow:"auto", padding:"28px 32px" },
    sectionTitle: {
      fontSize:18, fontWeight:700, color:"#fff",
      letterSpacing:"-0.02em", marginBottom:4,
    },
    card: {
      background:"rgba(255,255,255,0.03)",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:16, padding:"20px 24px",
    },
    th: {
      fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase",
      color:"rgba(255,255,255,0.35)", padding:"8px 12px", textAlign:"left",
      cursor:"pointer", userSelect:"none",
    },
    td: { padding:"10px 12px", fontSize:13, borderBottom:"1px solid rgba(255,255,255,0.04)" },
    tab: (active) => ({
      padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:500,
      background: active ? "#3B9EFF" : "rgba(255,255,255,0.05)",
      color: active ? "#fff" : "rgba(255,255,255,0.45)",
      border:"none", cursor:"pointer", transition:"all .15s",
    }),
    filterBtn: (active) => ({
      padding:"5px 13px", borderRadius:6, fontSize:12, fontWeight:500,
      background: active ? "rgba(59,158,255,0.15)" : "transparent",
      color: active ? "#3B9EFF" : "rgba(255,255,255,0.4)",
      border: active ? "1px solid rgba(59,158,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
      cursor:"pointer", transition:"all .15s",
    }),
  };

  const navItems = [
    { id:"overview", icon:"⬡", label:"Overview" },
    { id:"suppliers", icon:"⬡", label:"Suppliers" },
    { id:"forecast",  icon:"⬡", label:"Forecast" },
    { id:"alerts",    icon:"⬡", label:`Alerts ${activeAlerts.length > 0 ? `(${activeAlerts.length})` : ""}` },
  ];

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 28px", borderBottom:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(255,255,255,0.01)", backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:10,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:"linear-gradient(135deg,#3B9EFF,#0052CC)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800, color:"#fff",
          }}>S</div>
          <span style={{ fontSize:16, fontWeight:700, letterSpacing:"-0.02em" }}>
            SupplyGuard <span style={{ color:"#3B9EFF" }}>AI</span>
          </span>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)",
            background:"rgba(255,255,255,0.05)", borderRadius:4, padding:"2px 7px",
            marginLeft:4, letterSpacing:"0.05em" }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
            Material focus:
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {materials.map(m => (
              <button key={m} style={S.filterBtn(matFilter===m)}
                onClick={() => setMat(m)}>{m}</button>
            ))}
          </div>
          <div style={{
            width:8, height:8, borderRadius:"50%", background:"#2ECC9A",
            boxShadow:`0 0 ${pulse % 2 === 0 ? 8 : 4}px #2ECC9A`,
            transition:"box-shadow .4s",
          }}/>
          <span style={{ fontSize:12, color:"#2ECC9A" }}>Live</span>
        </div>
      </div>

      <div style={{ display:"flex", height:"calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={{ padding:"0 20px 16px", fontSize:10, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"rgba(255,255,255,0.2)" }}>Navigation</div>
          {navItems.map(n => (
            <div key={n.id} style={S.navItem(tab===n.id)} onClick={() => setTab(n.id)}>
              <span style={{ fontSize:14 }}>{n.icon}</span>
              {n.label}
              {n.id === "alerts" && activeAlerts.filter(a=>a.sev==="critical").length > 0 && (
                <span style={{
                  marginLeft:"auto", background:"#FF4D4D", color:"#fff",
                  borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>!</span>
              )}
            </div>
          ))}
          <div style={{ marginTop:"auto", padding:"16px 20px",
            borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:6 }}>
              Overall supply risk
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:riskColor(avgRisk) }}>{avgRisk}</div>
            <RiskBar score={avgRisk} />
          </div>
        </div>

        {/* Main content */}
        <div style={S.content}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={S.sectionTitle}>Supply Chain Overview</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                  Real-time risk intelligence across your automotive supply chain
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <KpiCard label="Active Suppliers" value="10"  sub="Across 8 countries" accent="#3B9EFF"/>
                <KpiCard label="High Risk"       value={criticalCount} sub="Alerts requiring action" accent="#FF4D4D"/>
                <KpiCard label="Avg Risk Score"  value={avgRisk} sub="Portfolio average" accent={riskColor(avgRisk)}/>
                <KpiCard label="Alternates Ready" value="4" sub="Backup suppliers identified" accent="#2ECC9A"/>
              </div>

              {/* Charts row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {/* Risk history */}
                <div style={S.card}>
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
                      <XAxis dataKey="month" tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} domain={[0,100]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="score" name="Risk score"
                        stroke="#FF4D4D" strokeWidth={2} fill="url(#rg)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Material risk */}
                <div style={S.card}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:16,
                    color:"rgba(255,255,255,0.8)" }}>Risk by Material Category</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={MATERIAL_RISK} layout="vertical" barSize={10}>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" horizontal={false}/>
                      <XAxis type="number" tick={{ fontSize:10, fill:"rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} domain={[0,100]}/>
                      <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={90}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="risk" name="Risk score" radius={[0,5,5,0]}
                        fill="#3B9EFF"
                        label={{ position:"right", fontSize:10, fill:"rgba(255,255,255,0.4)" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent alerts preview */}
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.8)" }}>
                    Recent Alerts
                  </div>
                  <button style={S.tab(false)} onClick={() => setTab("alerts")}>View all →</button>
                </div>
                {ALERTS.slice(0,3).map(a => (
                  <div key={a.id} style={{
                    display:"flex", alignItems:"center", gap:12, padding:"9px 0",
                    borderBottom:"1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{
                      width:7, height:7, borderRadius:"50%",
                      background:sevColor[a.sev], flexShrink:0,
                      boxShadow:`0 0 6px ${sevColor[a.sev]}`,
                    }}/>
                    <div style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.75)" }}>{a.msg}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUPPLIERS ── */}
          {tab === "suppliers" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={S.sectionTitle}>Supplier Intelligence</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                  {filtered.length} suppliers · sorted by {sortCol}
                </div>
              </div>
              <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                      {[
                        ["name","Supplier"], ["country","Country"], ["material","Material"],
                        ["risk","Risk score"], ["lead","Lead time"], ["rating","Rating"],
                        ["price","Price/unit"],
                      ].map(([col, label]) => (
                        <th key={col} style={S.th} onClick={() => handleSort(col)}>
                          {label} {sortCol===col ? (sortDir===-1?"↓":"↑") : ""}
                        </th>
                      ))}
                      <th style={S.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} style={{ transition:"background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}
                      >
                        <td style={S.td}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                        </td>
                        <td style={{ ...S.td, color:"rgba(255,255,255,0.5)" }}>{s.country}</td>
                        <td style={S.td}>
                          <span style={{
                            fontSize:11, padding:"2px 8px", borderRadius:5,
                            background:"rgba(59,158,255,0.1)", color:"#3B9EFF",
                          }}>{s.material}</span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                            <RiskBadge score={s.risk}/>
                            <RiskBar score={s.risk}/>
                          </div>
                        </td>
                        <td style={{ ...S.td, color:"rgba(255,255,255,0.7)" }}>
                          {s.lead}d <TrendIcon t={s.trend}/>
                        </td>
                        <td style={S.td}>
                          <span style={{ color:"#F5A623", fontWeight:600 }}>
                            {"★".repeat(Math.floor(s.rating))}
                            <span style={{ color:"rgba(255,255,255,0.2)" }}>
                              {"★".repeat(5-Math.floor(s.rating))}
                            </span>
                          </span>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginLeft:4 }}>
                            {s.rating}
                          </span>
                        </td>
                        <td style={{ ...S.td, color:"rgba(255,255,255,0.7)" }}>${s.price}</td>
                        <td style={S.td}>
                          {s.alt ? (
                            <button onClick={() => setAlt(s)} style={{
                              background:"rgba(46,204,154,0.1)", color:"#2ECC9A",
                              border:"1px solid rgba(46,204,154,0.3)", borderRadius:6,
                              padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer",
                            }}>Alt available</button>
                          ) : (
                            <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── FORECAST ── */}
          {tab === "forecast" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <div style={S.sectionTitle}>Demand Forecast</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                  12-week semiconductor inventory demand projection
                </div>
              </div>
              <div style={S.card}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:20,
                  color:"rgba(255,255,255,0.8)" }}>Units required · confidence band ±10%</div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={FORECAST} margin={{ top:5, right:10, bottom:0, left:0 }}>
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
                    <XAxis dataKey="week" tick={{ fontSize:11, fill:"rgba(255,255,255,0.35)" }}
                      axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:11, fill:"rgba(255,255,255,0.35)" }}
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
              </div>

              {/* Insights row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { label:"Peak demand week", value:"W12", sub:"640 units projected", color:"#FF4D4D" },
                  { label:"Avg weekly demand", value:"528", sub:"units per week", color:"#3B9EFF" },
                  { label:"Reorder recommended", value:"W4", sub:"Before demand surge at W5", color:"#2ECC9A" },
                ].map(c => (
                  <div key={c.label} style={{ ...S.card, borderTop:`3px solid ${c.color}` }}>
                    <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em",
                      color:"rgba(255,255,255,0.35)", marginBottom:6 }}>{c.label}</div>
                    <div style={{ fontSize:26, fontWeight:700, color:"#fff" }}>{c.value}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALERTS ── */}
          {tab === "alerts" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                <div>
                  <div style={S.sectionTitle}>Disruption Alerts</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>
                    {activeAlerts.length} active alerts · auto-refreshed
                  </div>
                </div>
                {dismissed.length > 0 && (
                  <button onClick={() => setDismissed([])} style={{
                    background:"transparent", border:"1px solid rgba(255,255,255,0.15)",
                    color:"rgba(255,255,255,0.4)", borderRadius:7, padding:"5px 12px",
                    fontSize:12, cursor:"pointer",
                  }}>Restore {dismissed.length} dismissed</button>
                )}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {activeAlerts.map(a => (
                  <div key={a.id} style={{
                    ...S.card,
                    borderLeft:`3px solid ${sevColor[a.sev]}`,
                    display:"flex", alignItems:"flex-start", gap:16,
                    padding:"16px 20px",
                  }}>
                    <div style={{
                      width:9, height:9, borderRadius:"50%", background:sevColor[a.sev],
                      flexShrink:0, marginTop:4,
                      boxShadow: a.sev==="critical" ? `0 0 10px ${sevColor[a.sev]}` : "none",
                    }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                        <span style={{
                          fontSize:10, fontWeight:700, letterSpacing:"0.08em",
                          textTransform:"uppercase", color:sevColor[a.sev],
                          background: sevColor[a.sev]+"22",
                          padding:"2px 7px", borderRadius:4,
                        }}>{a.sev}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{a.region}</span>
                      </div>
                      <div style={{ fontSize:14, color:"rgba(255,255,255,0.85)", marginBottom:3 }}>{a.msg}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{a.time}</div>
                    </div>
                    <button onClick={() => setDismissed(d => [...d, a.id])} style={{
                      background:"transparent", border:"none", color:"rgba(255,255,255,0.2)",
                      fontSize:18, cursor:"pointer", lineHeight:1, padding:"0 4px", flexShrink:0,
                    }}>×</button>
                  </div>
                ))}
                {activeAlerts.length === 0 && (
                  <div style={{ ...S.card, textAlign:"center", padding:"40px",
                    color:"rgba(255,255,255,0.3)", fontSize:14 }}>
                    All alerts dismissed ✓
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternate supplier modal */}
      {altModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:100,
          backdropFilter:"blur(4px)",
        }} onClick={() => setAlt(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#0E1524", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:20, padding:"28px 32px", width:420, maxWidth:"90vw",
          }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em",
              color:"rgba(255,255,255,0.3)", marginBottom:8 }}>Alternate Sourcing Engine</div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>
              Switch from {altModal.name}?
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>
              Risk score {altModal.risk} · {altModal.country}
            </div>
            {/* Recommend lowest-risk same-material supplier */}
            {(() => {
              const alts = SUPPLIERS
                .filter(s => s.material === altModal.material && s.id !== altModal.id)
                .sort((a,b) => a.risk - b.risk)
                .slice(0,2);
              return alts.map(a => (
                <div key={a.id} style={{
                  background:"rgba(46,204,154,0.06)", border:"1px solid rgba(46,204,154,0.2)",
                  borderRadius:12, padding:"14px 16px", marginBottom:10,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{a.name}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{a.country} · {a.material}</div>
                    </div>
                    <RiskBadge score={a.risk}/>
                  </div>
                  <div style={{ display:"flex", gap:16, marginTop:10, fontSize:12,
                    color:"rgba(255,255,255,0.5)" }}>
                    <span>Lead time: <b style={{ color:"#fff" }}>{a.lead}d</b></span>
                    <span>Rating: <b style={{ color:"#F5A623" }}>{a.rating}★</b></span>
                    <span>Price: <b style={{ color:"#fff" }}>${a.price}</b></span>
                  </div>
                  <div style={{ marginTop:8, fontSize:12, color:"#2ECC9A" }}>
                    ↓ {altModal.risk - a.risk} pts lower risk vs current supplier
                  </div>
                </div>
              ));
            })()}
            <button onClick={() => setAlt(null)} style={{
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