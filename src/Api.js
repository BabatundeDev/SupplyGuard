// src/api/supplyguardApi.js
// Drop this file into your React project src/api/ folder
// It connects the SupplyGuard AI dashboard to the FastAPI backend

const BASE_URL = process.env.REACT_APP_API_URL || "https://supplyguard-api-dp47.onrender.com";

const get = (path) =>
  fetch(`${BASE_URL}${path}`).then((r) => r.json());

const post = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// ── Risk Endpoints ─────────────────────────────────────────────────────────

/** Score a single supplier */
export const scoreSupplier = (features) =>
  post("/risk/score", features);

/** Get all suppliers with AI-predicted risk scores */
export const getAllSuppliers = () =>
  get("/risk/all-suppliers");

/** Find alternate low-risk suppliers for a given material */
export const getAlternateSuppliers = ({ supplierName, material, currentRisk, topN = 3 }) =>
  post("/risk/alternate-suppliers", {
    supplier_name: supplierName,
    material,
    current_risk: currentRisk,
    top_n: topN,
  });

/** Get model feature importance for explainability panel */
export const getFeatureImportance = () =>
  get("/risk/feature-importance");

/** Portfolio-level risk summary by material */
export const getPortfolioSummary = () =>
  get("/risk/portfolio-summary");

// ── Forecast Endpoints ─────────────────────────────────────────────────────

/** Prophet demand forecast for a material (weeks: 4-26) */
export const getDemandForecast = (material = "Semiconductors", weeks = 12) =>
  get(`/forecast/demand?material=${encodeURIComponent(material)}&weeks=${weeks}`);

/** Forecast all materials at once */
export const getAllForecasts = (weeks = 12) =>
  get(`/forecast/all-materials?weeks=${weeks}`);

// ── Alerts Endpoints ───────────────────────────────────────────────────────

/** Get live disruption alerts */
export const getAlerts = () =>
  get("/alerts/");

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () =>
  get("/health");