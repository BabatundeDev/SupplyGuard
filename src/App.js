import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Menu, X, Factory, AlertTriangle, BarChart2, RefreshCw,
  ArrowRightLeft, TrendingUp, Package, Bell, CheckCircle2,
  ChevronDown, ChevronUp, Zap, ShieldAlert, Activity,
  LayoutDashboard, Truck, LineChart, AlertOctagon,
} from "lucide-react";

const BASE_URL = "https://supplyguard-api-dp47.onrender.com";
const get = (path) => fetch(`${BASE_URL}${path}`).then(r => r.json());
const post = (path, body) => fetch(`${BASE_URL}${path}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}).then(r => r.json());

const api = {
  allSuppliers: () => get("/risk/all-suppliers"),
  alternates: (name, material, risk) => post("/risk/alternate-suppliers", {
    supplier_name: name, material, current_risk: risk, top_n: 3,
  }),
  portfolioSummary: () => get("/risk/portfolio-summary"),
  forecast: (material = "Semiconductors") => get(`/forecast/demand?material=${encodeURIComponent(material)}&weeks=12`),
  alerts: () => get("/alerts/"),
};

const RISK_HISTORY = [
  { month: "Jan", score: 48 }, { month: "Feb", score: 52 }, { month: "Mar", score: 61 },
  { month: "Apr", score: 57 }, { month: "May", score: 71 }, { month: "Jun", score: 68 },
  { month: "Jul", score: 75 }, { month: "Aug", score: 69 }, { month: "Sep", score: 82 },
  { month: "Oct", score: 78 }, { month: "Nov", score: 85 }, { month: "Dec", score: 79 },
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  border: "#E8EAED",
  borderMid: "#D1D5DB",
  text: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  blueMid: "#BFDBFE",
  red: "#DC2626",
  redLight: "#FEF2F2",
  green: "#059669",
  greenLight: "#ECFDF5",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  radius: 12,
};

const riskColor = r => r >= 70 ? T.red : r >= 40 ? T.amber : T.green;
const riskBg = r => r >= 70 ? T.redLight : r >= 40 ? T.amberLight : T.greenLight;
const riskLabel = r => r >= 70 ? "Critical" : r >= 40 ? "Medium" : "Low";
const sevColor = { critical: T.red, high: T.amber, medium: T.blue, low: T.green };
const sevBg = { critical: T.redLight, high: T.amberLight, medium: T.blueLight, low: T.greenLight };
const sevIcon = { critical: AlertOctagon, high: AlertTriangle, medium: Zap, low: CheckCircle2 };

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

// ── Components ────────────────────────────────────────────────────────────────
const Badge = ({ score }) => (
  <span style={{
    background: riskBg(score), color: riskColor(score),
    border: `1px solid ${riskColor(score)}33`,
    borderRadius: 6, padding: "2px 8px", fontSize: 11,
    fontWeight: 600, letterSpacing: "0.02em",
  }}>{riskLabel(score)}</span>
);

const RiskBar = ({ score }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${score}%`, height: "100%", background: riskColor(score),
        borderRadius: 2, transition: "width .5s ease",
      }} />
    </div>
    <span style={{ fontSize: 11, color: riskColor(score), fontWeight: 700, minWidth: 24 }}>{score}</span>
  </div>
);

const KpiCard = ({ label, value, sub, accent, Icon }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.radius, padding: "20px 22px", flex: 1, minWidth: 130,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  }}>
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 12
    }}>
      <div style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>{label}</div>
      <div style={{
        width: 34, height: 34, borderRadius: 9, background: accent + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} color={accent} strokeWidth={2} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1, marginBottom: 4 }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: T.textMuted }}>{sub}</div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <div style={{ color: T.textSub, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

const Spinner = () => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 140, color: T.textMuted, fontSize: 13, gap: 10
  }}>
    <RefreshCw size={16} color={T.blue} style={{ animation: "spin 0.8s linear infinite" }} />
    Loading...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ErrorBanner = ({ msg, onRetry }) => (
  <div style={{
    background: T.redLight, border: `1px solid ${T.red}22`,
    borderRadius: 10, padding: "12px 16px", fontSize: 13, color: T.red,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <AlertTriangle size={14} color={T.red} />
      <span>{msg}</span>
    </div>
    <button onClick={onRetry} style={{
      background: T.red, border: "none", color: "#fff",
      borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", flexShrink: 0,
    }}>Retry</button>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SupplyGuardAI() {
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("overview");
  const [sidebar, setSidebar] = useState(false);
  const [matFilter, setMat] = useState("All");
  const [sortCol, setSort] = useState("risk_score");
  const [sortDir, setSortDir] = useState(-1);
  const [altModal, setAlt] = useState(null);
  const [altData, setAltData] = useState(null);
  const [altLoading, setAltLoad] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  const [suppliers, setSuppliers] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [fcInsights, setFcInsights] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertMeta, setAlertMeta] = useState(null);
  const [loading, setLoading] = useState({ suppliers: true, forecast: true, alerts: true });
  const [errors, setErrors] = useState({});

  const setErr = (k, m) => setErrors(e => ({ ...e, [k]: m }));
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: null }));

  const fetchSuppliers = useCallback(async () => {
    setLoading(l => ({ ...l, suppliers: true })); clearErr("suppliers");
    try {
      const [s, p] = await Promise.all([api.allSuppliers(), api.portfolioSummary()]);
      setSuppliers(s.suppliers || []); setPortfolio({ ...s, materials: p.materials });
    } catch { setErr("suppliers", "Backend is waking up — wait 50 seconds and retry."); }
    finally { setLoading(l => ({ ...l, suppliers: false })); }
  }, []);

  const fetchForecast = useCallback(async (mat = "Semiconductors") => {
    setLoading(l => ({ ...l, forecast: true })); clearErr("forecast");
    try {
      const r = await api.forecast(mat);
      setForecast(r.forecast || []); setFcInsights(r.insights || null);
    } catch { setErr("forecast", "Forecast unavailable."); }
    finally { setLoading(l => ({ ...l, forecast: false })); }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(l => ({ ...l, alerts: true })); clearErr("alerts");
    try {
      const r = await api.alerts(); setAlerts(r.alerts || []); setAlertMeta(r);
    } catch { setErr("alerts", "Alerts unavailable."); }
    finally { setLoading(l => ({ ...l, alerts: false })); }
  }, []);

  useEffect(() => {
    fetchSuppliers(); fetchForecast(); fetchAlerts();
    const t = setInterval(() => setPulse(p => p + 1), 1200);
    const a = setInterval(fetchAlerts, 60000);
    return () => { clearInterval(t); clearInterval(a); };
  }, [fetchSuppliers, fetchForecast, fetchAlerts]);

  const openAlt = async (s) => {
    setAlt(s); setAltData(null); setAltLoad(true);
    try { const r = await api.alternates(s.name, s.material, s.risk_score); setAltData(r); }
    catch { setAltData({ error: true }); }
    finally { setAltLoad(false); }
  };

  const go = (id) => { setTab(id); setSidebar(false); };

  const materials = ["All", "Semiconductors", "Battery Metals", "Steel"];
  const filtered = suppliers
    .filter(s => matFilter === "All" || s.material === matFilter)
    .sort((a, b) => sortDir * (a[sortCol] > b[sortCol] ? 1 : -1));

  const criticalCount = alertMeta ? alertMeta.critical + alertMeta.high : 0;
  const avgRisk = portfolio ? Math.round(portfolio.avg_portfolio_risk) : 0;
  const activeAlerts = alerts.filter(a => !dismissed.includes(a.id));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => -d); else { setSort(col); setSortDir(-1); }
  };

  const HEADER = 60;

  const card = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.radius, padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const chipBtn = (active) => ({
    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: active ? T.blue : T.surface,
    color: active ? "#fff" : T.textSub,
    border: `1px solid ${active ? T.blue : T.border}`,
    cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
  });

  const navItems = [
    { id: "overview", Icon: LayoutDashboard, label: "Overview" },
    { id: "suppliers", Icon: Truck, label: "Suppliers" },
    { id: "forecast", Icon: LineChart, label: "Forecast" },
    { id: "alerts", Icon: Bell, label: `Alerts${activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ""}` },
  ];

  return (
    <div style={{
      fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
      background: T.bg, minHeight: "100vh", color: T.text
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 28px",
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, zIndex: 60, height: HEADER,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isMobile && (
            <button onClick={() => setSidebar(o => !o)} style={{
              background: "transparent", border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text, cursor: "pointer",
              width: 36, height: 36, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              {sidebar
                ? <X size={18} color={T.text} />
                : <Menu size={18} color={T.text} />
              }
            </button>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#3B9EFF,#0052CC)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, flexShrink: 0, color: "white"
          }}>S</div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
              SupplyGuard
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.blue, letterSpacing: "-0.02em" }}> AI</span>
          </div>
          {!isMobile && (
            <span style={{
              fontSize: 10, color: T.blue, background: T.blueLight,
              border: `1px solid ${T.blueMid}`, borderRadius: 4,
              padding: "2px 8px", letterSpacing: "0.06em", fontWeight: 600,
            }}>LIVE API</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && (
            <div style={{ display: "flex", gap: 6 }}>
              {materials.map(m => (
                <button key={m} style={chipBtn(matFilter === m)}
                  onClick={() => { setMat(m); if (tab === "forecast" && m !== "All") fetchForecast(m); }}>
                  {m}
                </button>
              ))}
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: T.greenLight, border: `1px solid ${T.green}33`,
            borderRadius: 20, padding: "5px 10px"
          }}>
            <Activity size={12} color={T.green} strokeWidth={2.5}
              style={{ animation: pulse % 2 === 0 ? "none" : "none" }} />
            <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebar && (
        <div onClick={() => setSidebar(false)} style={{
          position: "fixed", inset: 0, top: HEADER,
          background: "rgba(0,0,0,0.3)", zIndex: 49,
        }} />
      )}

      <div style={{ display: "flex", height: `calc(100vh - ${HEADER}px)` }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 220, background: T.surface, borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", padding: "16px 0", flexShrink: 0,
          ...(isMobile ? {
            position: "fixed", left: sidebar ? 0 : -220, top: HEADER,
            height: `calc(100vh - ${HEADER}px)`, zIndex: 50,
            transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: sidebar ? "4px 0 20px rgba(0,0,0,0.12)" : "none",
          } : {}),
        }}>
          <div style={{
            padding: "0 16px 10px", fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: T.textMuted, fontWeight: 600
          }}>Menu</div>

          {navItems.map(({ id, Icon, label }) => (
            <div key={id} onClick={() => go(id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              fontSize: 13, fontWeight: tab === id ? 600 : 400,
              color: tab === id ? T.blue : T.textSub,
              background: tab === id ? T.blueLight : "transparent",
              borderLeft: tab === id ? `3px solid ${T.blue}` : "3px solid transparent",
              cursor: "pointer", transition: "all .12s",
              borderRadius: "0 8px 8px 0", userSelect: "none", margin: "1px 0",
            }}>
              <Icon size={15} strokeWidth={tab === id ? 2.5 : 2}
                color={tab === id ? T.blue : T.textMuted} />
              {label}
              {id === "alerts" && (alertMeta?.critical || 0) > 0 && (
                <span style={{
                  marginLeft: "auto", background: T.red, color: "#fff",
                  borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                }}>{alertMeta.critical}</span>
              )}
            </div>
          ))}

          {isMobile && (
            <div style={{
              padding: "14px 16px 0",
              borderTop: `1px solid ${T.border}`, marginTop: 10
            }}>
              <div style={{
                fontSize: 10, textTransform: "uppercase",
                letterSpacing: "0.1em", color: T.textMuted,
                fontWeight: 600, marginBottom: 8
              }}>Material</div>
              {materials.map(m => (
                <button key={m} style={{
                  ...chipBtn(matFilter === m), display: "block", width: "100%",
                  textAlign: "left", marginBottom: 5, borderRadius: 8,
                }}
                  onClick={() => { setMat(m); if (tab === "forecast" && m !== "All") fetchForecast(m); }}>
                  {m}
                </button>
              ))}
            </div>
          )}

          <div style={{
            marginTop: "auto", padding: "14px 16px",
            borderTop: `1px solid ${T.border}`
          }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 500 }}>
              Portfolio risk
            </div>
            {loading.suppliers
              ? <div style={{ fontSize: 12, color: T.textMuted }}>Loading...</div>
              : <>
                <div style={{
                  fontSize: 26, fontWeight: 800,
                  color: riskColor(avgRisk), marginBottom: 4
                }}>{avgRisk}</div>
                <RiskBar score={avgRisk} />
              </>
            }
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1, overflow: "auto",
          padding: isMobile ? "20px 16px" : "28px 32px",
        }}>

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", flexWrap: "wrap", gap: 8
              }}>
                <div>
                  <h1 style={{
                    fontSize: 22, fontWeight: 700, color: T.text,
                    margin: 0, letterSpacing: "-0.03em"
                  }}>Supply Chain Overview</h1>
                  <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 0" }}>
                    Real-time risk intelligence · {suppliers.length} suppliers tracked
                  </p>
                </div>
                <button onClick={fetchSuppliers} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: T.blue, border: "none", color: "#fff",
                  borderRadius: 8, padding: "8px 16px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer",
                }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {errors.suppliers && <ErrorBanner msg={errors.suppliers} onRetry={fetchSuppliers} />}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <KpiCard label="Active Suppliers" Icon={Factory}
                  value={loading.suppliers ? "—" : suppliers.length}
                  sub="Across global regions" accent={T.blue} />
                <KpiCard label="High Risk Alerts" Icon={ShieldAlert}
                  value={loading.alerts ? "—" : criticalCount}
                  sub="Requiring action" accent={T.red} />
                <KpiCard label="Avg Risk Score" Icon={BarChart2}
                  value={loading.suppliers ? "—" : avgRisk}
                  sub="AI portfolio prediction" accent={riskColor(avgRisk)} />
                <KpiCard label="Alternates Ready" Icon={ArrowRightLeft}
                  value={loading.suppliers ? "—" : suppliers.filter(s => s.risk_score >= 60).length}
                  sub="Backup suppliers identified" accent={T.green} />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16
              }}>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                    Portfolio Risk — 12 months
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
                    Historical risk score trend
                  </div>
                  <ResponsiveContainer width="100%" height={170}>
                    <AreaChart data={RISK_HISTORY}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.red} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={T.red} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMuted }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: T.textMuted }}
                        axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="score" name="Risk score"
                        stroke={T.red} strokeWidth={2} fill="url(#rg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={card}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 4
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      Risk by Material
                    </div>
                    <span style={{
                      fontSize: 10, color: T.green, background: T.greenLight,
                      border: `1px solid ${T.green}33`, borderRadius: 4,
                      padding: "2px 7px", fontWeight: 600
                    }}>AI model</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
                    Average predicted risk per category
                  </div>
                  {loading.suppliers ? <Spinner /> : (
                    <ResponsiveContainer width="100%" height={155}>
                      <BarChart
                        data={portfolio?.materials?.map(m => ({ name: m.material, risk: m.avg_risk })) || []}
                        layout="vertical" barSize={10}>
                        <CartesianGrid strokeDasharray="2 4" stroke={T.border} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: T.textMuted }}
                          axisLine={false} tickLine={false} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name"
                          tick={{ fontSize: isMobile ? 9 : 10, fill: T.textSub }}
                          axisLine={false} tickLine={false} width={isMobile ? 75 : 100} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="risk" name="Risk score" radius={[0, 5, 5, 0]} fill={T.blue} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div style={card}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Recent Alerts</div>
                    {alertMeta && (
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                        {alertMeta.total} total · {alertMeta.critical} critical
                      </div>
                    )}
                  </div>
                  <button onClick={() => go("alerts")} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "transparent", border: `1px solid ${T.border}`,
                    color: T.textSub, borderRadius: 8, padding: "5px 12px",
                    fontSize: 12, cursor: "pointer", fontWeight: 500,
                  }}>
                    View all <ChevronDown size={12} />
                  </button>
                </div>
                {loading.alerts ? <Spinner /> : alerts.slice(0, 3).map(a => {
                  const SevIcon = sevIcon[a.severity] || AlertTriangle;
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "flex-start",
                      gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}`
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: sevBg[a.severity],
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <SevIcon size={14} color={sevColor[a.severity]} strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{a.message}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {a.region} · {a.time_ago}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: sevBg[a.severity], color: sevColor[a.severity],
                        textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                      }}>{a.severity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ SUPPLIERS ══ */}
          {tab === "suppliers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{
                  fontSize: 22, fontWeight: 700, color: T.text,
                  margin: 0, letterSpacing: "-0.03em"
                }}>Supplier Intelligence</h1>
                <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 0" }}>
                  {filtered.length} suppliers · AI-predicted risk scores
                </p>
              </div>
              {errors.suppliers && <ErrorBanner msg={errors.suppliers} onRetry={fetchSuppliers} />}
              {loading.suppliers ? <Spinner /> : (
                <div style={{ ...card, padding: 0, overflow: "hidden", overflowX: "auto" }}>
                  <table style={{
                    width: "100%", borderCollapse: "collapse",
                    minWidth: isMobile ? 580 : "auto"
                  }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {[
                          ["name", "Supplier"], ["country", "Country"], ["material", "Material"],
                          ["risk_score", "Risk"], ["lead_time", "Lead"],
                          ["rating", "Rating"], ["geo_score", "Geo"],
                        ].map(([col, label]) => (
                          <th key={col} onClick={() => handleSort(col)} style={{
                            fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                            color: T.textMuted, padding: "10px 12px", textAlign: "left",
                            cursor: "pointer", userSelect: "none",
                            whiteSpace: "nowrap", fontWeight: 600,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {label}
                              {sortCol === col
                                ? sortDir === -1
                                  ? <ChevronDown size={11} color={T.blue} />
                                  : <ChevronUp size={11} color={T.blue} />
                                : null
                              }
                            </div>
                          </th>
                        ))}
                        <th style={{
                          fontSize: 11, letterSpacing: "0.06em",
                          textTransform: "uppercase", color: T.textMuted,
                          padding: "10px 12px", textAlign: "left", fontWeight: 600
                        }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => (
                        <tr key={i}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          style={{ transition: "background .1s" }}>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{s.name}</div>
                          </td>
                          <td style={{
                            padding: "12px", fontSize: 12, color: T.textSub,
                            borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap"
                          }}>
                            {s.country}
                          </td>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{
                              fontSize: 11, padding: "3px 8px", borderRadius: 4,
                              background: T.blueLight, color: T.blue, fontWeight: 500,
                              whiteSpace: "nowrap"
                            }}>{s.material}</span>
                          </td>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <Badge score={s.risk_score} />
                              <RiskBar score={Math.round(s.risk_score)} />
                            </div>
                          </td>
                          <td style={{
                            padding: "12px", fontSize: 12, color: T.textSub,
                            borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap"
                          }}>
                            {s.lead_time}d
                          </td>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>
                              {"★".repeat(Math.floor(s.rating))}
                              <span style={{ color: T.border }}>
                                {"★".repeat(5 - Math.floor(s.rating))}
                              </span>
                            </span>
                            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>
                              {s.rating}
                            </span>
                          </td>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{
                              color: riskColor(s.geo_score),
                              fontSize: 12, fontWeight: 700
                            }}>
                              {Math.round(s.geo_score)}
                            </span>
                          </td>
                          <td style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            {s.risk_score >= 40
                              ? <button onClick={() => openAlt(s)} style={{
                                display: "flex", alignItems: "center", gap: 5,
                                background: T.blue, color: "#fff", border: "none",
                                borderRadius: 6, padding: "5px 10px", fontSize: 11,
                                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                              }}>
                                <ArrowRightLeft size={11} /> Find alt
                              </button>
                              : <span style={{
                                display: "flex", alignItems: "center", gap: 4,
                                fontSize: 11, color: T.green, background: T.greenLight,
                                padding: "3px 8px", borderRadius: 4, fontWeight: 500
                              }}>
                                <CheckCircle2 size={11} color={T.green} /> Safe
                              </span>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", flexWrap: "wrap", gap: 12
              }}>
                <div>
                  <h1 style={{
                    fontSize: 22, fontWeight: 700, color: T.text,
                    margin: 0, letterSpacing: "-0.03em"
                  }}>Demand Forecast</h1>
                  <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 0" }}>
                    Holt-Winters model · 12-week projection · 80% confidence band
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Semiconductors", "Battery Metals", "Steel"].map(m => (
                    <button key={m} style={chipBtn(matFilter === m)}
                      onClick={() => { setMat(m); fetchForecast(m); }}>{m}</button>
                  ))}
                </div>
              </div>
              {errors.forecast && <ErrorBanner msg={errors.forecast} onRetry={() => fetchForecast(matFilter)} />}

              <div style={card}>
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", marginBottom: 20,
                  flexWrap: "wrap", gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      Units required · {matFilter === "All" ? "Semiconductors" : matFilter}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                      Projected inventory demand with confidence intervals
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, color: T.green, background: T.greenLight,
                    border: `1px solid ${T.green}33`, borderRadius: 4,
                    padding: "3px 9px", fontWeight: 600
                  }}>AI model</span>
                </div>
                {loading.forecast ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
                    <AreaChart data={forecast} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.blue} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.green} stopOpacity={0.05} />
                          <stop offset="100%" stopColor={T.green} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 6" stroke={T.border} />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: T.textMuted }}
                        axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: T.textMuted }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="upper" name="Upper"
                        stroke="none" fill="url(#ug)" fillOpacity={1} />
                      <Area type="monotone" dataKey="lower" name="Lower"
                        stroke="none" fill={T.surface} fillOpacity={1} />
                      <Area type="monotone" dataKey="demand" name="Forecast"
                        stroke={T.blue} strokeWidth={2.5} fill="url(#dg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {fcInsights && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 12
                }}>
                  {[
                    {
                      label: "Peak demand week", value: fcInsights.peak_week,
                      sub: `${fcInsights.peak_demand} units projected`,
                      color: T.red, Icon: TrendingUp
                    },
                    {
                      label: "Avg weekly demand", value: Math.round(fcInsights.avg_weekly_demand),
                      sub: "units per week", color: T.blue, Icon: Package
                    },
                    {
                      label: "Reorder by", value: fcInsights.reorder_recommended_week,
                      sub: `Trend: ${fcInsights.trend}`, color: T.green, Icon: Bell
                    },
                  ].map(c => (
                    <div key={c.label} style={{
                      ...card, borderTop: `3px solid ${c.color}`, padding: "18px 20px",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: c.color + "15", display: "flex",
                        alignItems: "center", justifyContent: "center", marginBottom: 10,
                      }}>
                        <c.Icon size={15} color={c.color} strokeWidth={2.5} />
                      </div>
                      <div style={{
                        fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: T.textMuted,
                        marginBottom: 4, fontWeight: 600
                      }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{c.value}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ALERTS ══ */}
          {tab === "alerts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", flexWrap: "wrap", gap: 10
              }}>
                <div>
                  <h1 style={{
                    fontSize: 22, fontWeight: 700, color: T.text,
                    margin: 0, letterSpacing: "-0.03em"
                  }}>Disruption Alerts</h1>
                  <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 0" }}>
                    {activeAlerts.length} active · refreshes every 60s
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {dismissed.length > 0 && (
                    <button onClick={() => setDismissed([])} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "transparent", border: `1px solid ${T.border}`,
                      color: T.textSub, borderRadius: 8, padding: "6px 14px",
                      fontSize: 12, cursor: "pointer", fontWeight: 500,
                    }}>
                      <RefreshCw size={12} /> Restore {dismissed.length}
                    </button>
                  )}
                  <button onClick={fetchAlerts} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: T.blue, border: "none", color: "#fff",
                    borderRadius: 8, padding: "6px 14px", fontSize: 12,
                    fontWeight: 600, cursor: "pointer",
                  }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>
              {errors.alerts && <ErrorBanner msg={errors.alerts} onRetry={fetchAlerts} />}
              {loading.alerts ? <Spinner /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeAlerts.map(a => {
                    const SevIcon = sevIcon[a.severity] || AlertTriangle;
                    return (
                      <div key={a.id} style={{
                        ...card, padding: "16px 20px",
                        borderLeft: `4px solid ${sevColor[a.severity]}`,
                        display: "flex", alignItems: "flex-start", gap: 14,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: sevBg[a.severity],
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <SevIcon size={16} color={sevColor[a.severity]} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: "flex", alignItems: "center",
                            gap: 8, marginBottom: 5, flexWrap: "wrap"
                          }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px",
                              borderRadius: 4, background: sevBg[a.severity],
                              color: sevColor[a.severity],
                              textTransform: "uppercase", letterSpacing: "0.05em",
                            }}>{a.severity}</span>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{a.region}</span>
                            {a.type === "supplier" && (
                              <span style={{
                                display: "flex", alignItems: "center", gap: 4,
                                fontSize: 10, color: T.blue, background: T.blueLight,
                                padding: "1px 7px", borderRadius: 4, fontWeight: 600
                              }}>
                                <Zap size={10} color={T.blue} /> AI detected
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 13, color: T.text,
                            fontWeight: 500, marginBottom: 3
                          }}>{a.message}</div>
                          <div style={{ fontSize: 11, color: T.textMuted }}>{a.time_ago}</div>
                        </div>
                        <button onClick={() => setDismissed(d => [...d, a.id])} style={{
                          background: "transparent", border: `1px solid ${T.border}`,
                          color: T.textMuted, borderRadius: 6, width: 28, height: 28,
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0,
                        }}>
                          <X size={13} color={T.textMuted} />
                        </button>
                      </div>
                    );
                  })}
                  {activeAlerts.length === 0 && (
                    <div style={{
                      ...card, textAlign: "center", padding: "48px",
                      color: T.textMuted, fontSize: 14, display: "flex",
                      flexDirection: "column", alignItems: "center", gap: 10
                    }}>
                      <CheckCircle2 size={32} color={T.green} strokeWidth={1.5} />
                      All alerts resolved
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Alternate Modal ── */}
      {altModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, backdropFilter: "blur(4px)", padding: 16
        }}
          onClick={() => { setAlt(null); setAltData(null); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "28px", width: "100%", maxWidth: 440,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: T.blueLight, display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
                <ArrowRightLeft size={16} color={T.blue} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{
                  fontSize: 11, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: T.textMuted,
                  fontWeight: 600
                }}>AI Alternate Sourcing</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  Switch from {altModal.name}?
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 13, color: T.textSub, marginBottom: 20,
              padding: "10px 14px", background: T.redLight,
              borderRadius: 9, display: "flex", alignItems: "center", gap: 8
            }}>
              <AlertTriangle size={14} color={T.red} />
              Current risk: <b style={{ color: T.red }}>{Math.round(altModal.risk_score)}</b>
              {" · "}{altModal.country} · {altModal.material}
            </div>

            {altLoading && <Spinner />}

            {altData && !altData.error && altData.alternates?.map((a, i) => (
              <div key={i} style={{
                border: `1px solid ${T.border}`, borderRadius: 12,
                padding: "16px", marginBottom: 10, background: T.bg,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", flexWrap: "wrap", gap: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{a.country} · {a.material}</div>
                  </div>
                  <Badge score={a.risk_score} />
                </div>
                <div style={{
                  display: "flex", gap: 12, marginTop: 10,
                  fontSize: 12, color: T.textSub, flexWrap: "wrap"
                }}>
                  <span>Lead: <b style={{ color: T.text }}>{a.lead_time}d</b></span>
                  <span>Rating: <b style={{ color: "#F59E0B" }}>{a.rating}★</b></span>
                  <span style={{ color: T.green, fontWeight: 600 }}>{a.recommendation}</span>
                </div>
                <div style={{
                  marginTop: 10, fontSize: 12, color: T.green,
                  fontWeight: 600, background: T.greenLight,
                  padding: "6px 12px", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <CheckCircle2 size={13} color={T.green} />
                  ↓ {a.risk_reduction} pts lower risk vs current supplier
                </div>
              </div>
            ))}

            {altData?.error && (
              <div style={{
                fontSize: 13, color: T.red, marginBottom: 16,
                background: T.redLight, padding: "10px 14px",
                borderRadius: 8, display: "flex", alignItems: "center", gap: 8
              }}>
                <AlertTriangle size={14} color={T.red} />
                Could not load alternates. Please try again.
              </div>
            )}

            <button onClick={() => { setAlt(null); setAltData(null); }} style={{
              width: "100%", marginTop: 8, padding: "10px", borderRadius: 9,
              background: T.bg, border: `1px solid ${T.border}`,
              color: T.textSub, fontSize: 13, cursor: "pointer", fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <X size={14} color={T.textMuted} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}