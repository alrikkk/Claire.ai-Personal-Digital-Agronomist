<img width="43" height="39" alt="Screenshot 2026-08-22 at 6 27 16 PM" src="https://github.com/user-attachments/assets/a79907f3-bfc5-4290-90e1-8a24d7c2121a" />

# Claire.ai — Personal Digital Agronomist

** Undergoing an update , but the current link is the previous version. So,feel free to try it out.

**Claire.ai** is an enterprise-grade digital agriculture platform that gives every farmer access to the kind of AI, satellite, and analytics tooling normally reserved for large agribusinesses — live field insights, AI crop pathology scanning, satellite/soil analytics, yield tracking, and a natural-language farming assistant, all in one dashboard.

**🔗 Live app:** [claire-ai-45340676165.asia-southeast1.run.app](https://claire-ai-45340676165.asia-southeast1.run.app/)

---

## ✨ Features

Claire.ai is organized into seven core workspaces, all accessible from a single dashboard:

| Tab | What it does |
|---|---|
| 🌤️ **Live Insights** | Real-time weather and field conditions for the farmer's active location, feeding contextual data into every other module. |
| 🛰️ **Satellite & Soil** | Satellite and soil analytics for the selected plot — a geospatial view of field health. |
| ✨ **Vertex AI Hub** | A dashboard of Google Vertex AI-powered tools: yield prediction, computer-vision crop analysis, voice translation, geospatial layers, BigQuery querying, and public agri-data feeds. |
| 🌐 **DPG Network** | A "Digital Public Good" agri-network view for exploring and selecting locations/regions across the network. |
| 🍃 **Pathology Scan** | Upload a photo of a crop and get an AI-powered diagnosis of disease, pest, or nutrient issues. |
| 🗄️ **Yield Logs** | Historical yield logging and project management — track past harvests and outcomes per field/project. |
| 📁 **Govt Data Sync** | A view for syncing/backing up Indian government agricultural data. |

Beyond the tabs, Claire.ai includes:

- **🤖 Claire Assistant** — a conversational AI agronomist for natural-language farming questions and localized advisory generation (with text-to-speech support).
- **🔑 Bring-Your-Own-Key AI Providers** — connect a personal API key from **Groq, OpenAI, Google Gemini, Anthropic Claude, DeepSeek, Mistral, OpenRouter**, or any self-hosted OpenAI-compatible endpoint, instead of relying solely on the built-in Gemini integration.
- **👤 Account & Profile System** — personal setup, authentication, and profile management.
- **📍 Location Autocomplete & Reverse Geocoding** — quickly set and switch a farm's active location.
- **🔔 Notifications** — in-app alerts surfaced through a notification dropdown.

---

## 🧱 Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/) — build tooling
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [Motion](https://motion.dev/) — animations
- [Recharts](https://recharts.org/) & [D3](https://d3js.org/) — data visualization
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) — mapping
- [Lucide React](https://lucide.dev/) — icons

**Backend**
- [Express](https://expressjs.com/) (TypeScript, via `tsx` in dev / `esbuild` bundle in prod)
- [Google Gemini API](https://ai.google.dev/) (`@google/genai`) — core AI features
- [Firebase](https://firebase.google.com/) — auxiliary services
- SQLite (`claireai.db`) — local data storage

**Deployment**
- Google Cloud Run (built via [Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended) or [Bun](https://bun.sh/)
- A [Google Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)

### Installation

```bash
git clone https://github.com/alrikkk/Claire.ai-Personal-Digital-Agronomist.git
cd Claire.ai-Personal-Digital-Agronomist
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Required for all Gemini AI API calls (crop scanning, assistant chat, advisories, Vertex AI features). |
| `APP_URL` | The URL this app is hosted at (used for self-referential links and API endpoints). |

> Alternatively, once the app is running, you can connect your own AI provider key (Gemini, OpenAI, Claude, Groq, etc.) directly from the in-app **Connect API Provider** settings instead of using environment variables.

### Run in development

```bash
npm run dev
```

This starts the Express server (`server.ts`) with the Vite dev server via `tsx`.

### Build & run for production

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
├── server.ts               # Express backend — all /api routes (auth, weather, scanner, assistant, Vertex AI, etc.)
├── src/
│   ├── App.tsx              # Main app shell & tab navigation
│   ├── components/
│   │   ├── ClaireAssistant.tsx           # Conversational AI agronomist
│   │   ├── ApiProviderModal.tsx          # BYOK AI provider connection
│   │   ├── CropPathologyScanner.tsx      # AI crop disease/pest scanning
│   │   ├── DigitalAgriNetwork.tsx        # DPG regional network view
│   │   ├── HistoricalYieldLogs.tsx       # Yield & project tracking
│   │   ├── LiveFieldInsights.tsx         # Weather & live field data
│   │   ├── SatelliteAndSoilAnalytics.tsx # Satellite/soil analytics
│   │   ├── VertexAiDashboard.tsx         # Vertex AI tools hub
│   │   ├── OptimalPlantingAndVarieties.tsx
│   │   ├── OperationalProfile.tsx
│   │   ├── AgronomyFAQModal.tsx
│   │   └── ...
│   ├── data/                # Static datasets
│   ├── utils/                # Shared utilities
│   └── types.ts              # Shared TypeScript types
├── assets/                  # App assets
└── metadata.json             # App metadata / capabilities manifest
```

---

## 🔌 Backend API Overview

The Express server exposes REST endpoints under `/api`, including:

- **Auth & Profile** — `/api/auth/personal-setup`, `/api/auth/change-password`, `/api/user/profile`
- **Projects & Yield Logs** — `/api/projects`, `/api/yield-logs`
- **Environment Data** — `/api/weather`, `/api/reverse-geocode`
- **AI Providers** — `/api/provider/test` (test a connected BYOK provider)
- **Crop Pathology** — `/api/scanner/analyze`
- **Assistant** — `/api/assistant/chat`, `/api/advisory/generate-localised`, `/api/advisory/tts`
- **Digital Public Good Network** — `/api/dpg/nodes`, `/api/dpg/models`, `/api/dpg/export-schema`
- **Vertex AI Hub** — `/api/vertex/overview`, `/api/vertex/predict/yield`, `/api/vertex/vision/analyze`, `/api/vertex/voice/translate`, `/api/vertex/geospatial/layers`, `/api/vertex/bigquery/query`, `/api/vertex/public-data/feeds`

---

## 🏆 About

Claire.ai was built as a hackathon/Google AI Studio project exploring how Google's AI stack (Gemini, Vertex AI, Earth Engine, BigQuery) can be combined into a single, farmer-facing digital agronomist — surfacing real-time advisories, crop diagnostics, and yield analytics without requiring farmers to be data scientists.

**Topics:** `agriculture` · `agriculture-technology` · `agronomist` · `ai-tools` · `digital` · `farming` · `googlehackathon` · `hackathon-project`

---

## 📄 License

No license has been specified for this repository yet. All rights reserved by the author unless stated otherwise.
