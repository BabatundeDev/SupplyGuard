# SupplyGuard AI — Frontend Dashboard

> AI-powered automotive supply chain risk intelligence dashboard built for the **ET AutoTech Hackathon 2026**.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)
![Hackathon](https://img.shields.io/badge/ET%20AutoTech-Hackathon%202026-FF4D4D?style=for-the-badge)

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| Frontend Dashboard | [supplyguard-dashboard.vercel.app](https://supplyguard-dashboard.vercel.app) |
| Backend API | [supplyguard-api-dp47.onrender.com](https://supplyguard-api-dp47.onrender.com) |
| API Docs (Swagger) | [supplyguard-api-dp47.onrender.com/docs](https://supplyguard-api-dp47.onrender.com/docs) |
| Frontend Repo | [BabatundeDev/SupplyGuard](https://github.com/BabatundeDev/SupplyGuard) |
| Backend Repo | [BabatundeDev/supplyguard-api](https://github.com/BabatundeDev/supplyguard-api) |

---

## 🧠 What is SupplyGuard AI?

SupplyGuard AI is a full-stack AI-powered supply chain risk intelligence platform for the automotive industry. It addresses **Theme 1: AI for Resilient Automotive Supply Chains & Smart Manufacturing** by proactively detecting, predicting, and mitigating supply chain disruptions using machine learning.

---

## ✨ Features

### 📊 Overview Screen
Real-time KPI cards showing active suppliers, high-risk alert count, AI-predicted average portfolio risk score, and alternate suppliers ready. Includes a 12-month portfolio risk area chart and a material category risk bar chart powered by live API predictions.

### 🏭 Supplier Intelligence Screen
Full sortable and filterable supplier table with AI-predicted risk scores, colour-coded severity badges, star ratings, lead time tracking, and geopolitical risk scores. Clicking "Find alternate" fires a live API call to the alternate sourcing engine and returns ranked low-risk backup suppliers instantly.

### 📈 Demand Forecast Screen
12-week inventory demand projection using Holt-Winters Exponential Smoothing with 80% confidence bands. Switchable across Semiconductors, Battery Metals, and Steel. Includes AI-generated insights for peak demand week, average weekly demand, and recommended reorder timing.

### 🚨 Disruption Alerts Screen
Live geopolitical and AI-detected supplier-level disruption alerts with severity classification (Critical, High, Medium, Low). Auto-refreshes every 60 seconds. Dismissable with one-click restore.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Charts | Recharts |
| Styling | Inline CSS with CSS variables |
| API Client | Native Fetch API |
| Deployment | Vercel |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│        React Dashboard (Vercel)              │
│  Overview │ Suppliers │ Forecast │ Alerts    │
└──────────────────┬──────────────────────────┘
                   │ HTTP REST API
┌──────────────────▼──────────────────────────┐
│      FastAPI Backend (Render)                │
│  /risk  │  /forecast  │  /alerts             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           AI / ML Layer                      │
│  GradientBoosting Risk Scorer (R² = 0.982)   │
│  Holt-Winters Demand Forecaster              │
│  50-supplier training dataset                │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
supplyguard/
├── public/
│   ├── index.html          # Zero-margin, DM Sans font, dark bg
│   ├── favicon.ico         # Custom SupplyGuard favicon
│   └── logo192.png
├── src/
│   ├── api/
│   │   └── supplyguardApi.js   # API client for all backend calls
│   ├── App.js                  # Main dashboard component
│   └── index.js
└── package.json
```

---

## 🏆 Judging Criteria Alignment

| Criteria | Weight | How we address it |
|---|---|---|
| Correctness & Performance | 30% | Live ML predictions from real API with R² = 0.982 |
| Clarity of Presentation | 20% | Polished dark dashboard with live data and loading states |
| Technical Depth | 20% | Full-stack React + FastAPI + ML pipeline end to end |
| Innovation & Creativity | 10% | Geopolitical risk scoring + AI alternate sourcing engine |
| Automotive Ecosystem Impact | 10% | Directly addresses automotive supply chain disruption |
| User Experience & Design | 10% | Dark-mode dashboard, animations, error handling, auto-refresh |

---

## 👨‍💻 Built By

**Babatunde** — ET AutoTech Hackathon 2026 | Theme 1: AI for Resilient Automotive Supply Chains

---

## 📄 License

MIT
