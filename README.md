# SupplyGuard AI — Frontend Dashboard

> AI-powered automotive supply chain risk intelligence dashboard built for the **ET AutoTech Hackathon 2026**.

![SupplyGuard AI](https://img.shields.io/badge/SupplyGuard-AI-3B9EFF?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)
![Hackathon](https://img.shields.io/badge/ET%20AutoTech-Hackathon%202026-FF4D4D?style=for-the-badge)

---

## What is SupplyGuard AI?

SupplyGuard AI is a full-stack, AI-powered supply chain risk intelligence platform for the automotive industry. It addresses **Theme 1: AI for Resilient Automotive Supply Chains & Smart Manufacturing** by proactively detecting, predicting, and mitigating supply chain disruptions using machine learning.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend Dashboard | [supplyguard-dashboard.vercel.app](https://supplyguard-dashboard.vercel.app) |
| Backend API | [supplyguard-api-dp47.onrender.com](https://supplyguard-api-dp47.onrender.com) |
| API Docs (Swagger) | [supplyguard-api-dp47.onrender.com/docs](https://supplyguard-api-dp47.onrender.com/docs) |
| Frontend Repo | [BabatundeDev/SupplyGuard](https://github.com/BabatundeDev/SupplyGuard) |
| Backend Repo | [BabatundeDev/supplyguard-api](https://github.com/BabatundeDev/supplyguard-api) |
---

## Features

### Overview Screen
Real-time KPI cards showing active suppliers, high-risk alerts, average portfolio risk score, and alternate suppliers ready. Includes a 12-month portfolio risk area chart and a material category risk bar chart powered by live AI predictions.

### Supplier Intelligence Screen
Full sortable and filterable supplier table with AI-predicted risk scores, color-coded severity badges, star ratings, lead time tracking, geopolitical risk scores, and a live alternate sourcing engine modal that fires real API calls.

### Demand Forecast Screen
12-week inventory demand projection using Holt-Winters Exponential Smoothing with 80% confidence bands. Switchable across Semiconductors, Battery Metals, and Steel categories. Includes AI-generated insights for peak demand week, average weekly demand, and recommended reorder timing.

### Disruption Alerts Screen
Live geopolitical and supplier-level disruption alerts with severity classification (Critical, High, Medium, Low). Auto-refreshes every 60 seconds. Dismissable with restore capability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Recharts, Tailwind CSS |
| Backend | Python FastAPI |
| Risk Model | scikit-learn GradientBoostingRegressor (R² = 0.983) |
| Forecasting | Statsmodels Holt-Winters Exponential Smoothing |
| Deployment | Vercel (frontend), Render (backend) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│         React Dashboard (Port 3000)      │
│  Overview │ Suppliers │ Forecast │ Alerts│
└──────────────────┬──────────────────────┘
                   │ HTTP / REST
┌──────────────────▼──────────────────────┐
│         FastAPI Backend (Port 8000)      │
│  /risk  │  /forecast  │  /alerts         │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│              AI / ML Layer               │
│  GradientBoosting Risk Scorer            │
│  Holt-Winters Demand Forecaster          │
│  50-supplier training dataset            │
└─────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Backend repo running at `localhost:8000`

### 1. Clone and install

```bash
git clone https://github.com/BabatundeDev/supplyguard.git
cd supplyguard
npm install
```

### 2. Start the backend first

```bash
git clone https://github.com/BabatundeDev/supplyguard-api.git
cd supplyguard-api
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd supplyguard
npm start
```

Open `http://localhost:3000` to view the dashboard.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/risk/all-suppliers` | All suppliers with AI risk scores |
| POST | `/risk/alternate-suppliers` | Recommend low-risk alternates |
| GET | `/risk/portfolio-summary` | Risk by material category |
| GET | `/forecast/demand` | 12-week demand forecast |
| GET | `/alerts/` | Live disruption alerts |

---

## Judging Criteria Alignment

| Criteria | Weight | How we address it |
|---|---|---|
| Correctness & Performance | 30% | Live ML model predictions with R² = 0.983 |
| Clarity of Presentation | 20% | Clean dashboard UX with real-time data |
| Technical Depth | 20% | Full-stack: React + FastAPI + ML pipeline |
| Innovation & Creativity | 10% | Geopolitical risk scoring + AI alternate sourcing |
| Automotive Ecosystem Impact | 10% | Addresses real supply chain disruption pain points |
| User Experience & Design | 10% | Dark-mode dashboard with live data and animations |

---

## Built By

**Babatunde** — ET AutoTech Hackathon 2026 | Theme 1: AI for Resilient Automotive Supply Chains

---

## License

MIT
