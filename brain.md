# 🧠 BRAIN.MD — CivicPulse: AI Civic Operations Platform
> Master context. Read before touching anything.
> Last updated: project fully built ✅

---

## 👤 Builder
**Kartik** · SKIT Jaipur · B.Tech CSE (Batch 2027)
Stack comfort: FastAPI, React, Python, Firebase, Gemini

---

## 🏆 Hackathon
- **Event:** Vibe Coding Hackathon
- **PS:** PS 1 — Community Hero: Hyperlocal Problem Solver
- **Deploy target:** Google Cloud Run · region: `asia-south1` (Mumbai, closest to Jaipur)
- **Target score: 95+/100**

| Criteria | Weight | Our Strategy |
|---|---|---|
| Problem Solving & Impact | 20% | Real civic pain, live Firestore data, actionable AI |
| **Agentic Depth** | **20%** | **5-agent CIE pipeline — not a single classifier** |
| **Innovation & Creativity** | **20%** | **Duplicate merge, Mayor AI Briefing, Dynamic 0-100 Priority Score** |
| Google Technologies | 15% | 7 Google products, all deeply integrated |
| Product Experience | 10% | Map-first, morning greeting, CIE result card, dark Mayor view |
| Technical Implementation | 10% | FastAPI + Firebase + Cloud Run + Docker + CI/CD |
| Completeness | 5% | All 6 pages + all 13 API routes working |

---

## 🎯 Pitch (memorise this)
> "CivicPulse is not just a reporting app.
> It's an **AI Civic Operations Platform** with a 5-agent Civic Intelligence Engine
> that detects, deduplicates, prioritises, routes, and synthesises civic issues
> into operational intelligence — powered by Gemini 2.0 Flash.
> Citizens get instant AI feedback. The Mayor gets a command-center briefing. The city responds faster."

---

## 🤖 The Civic Intelligence Engine (CIE) — Core Differentiator

```
Image + Context
      │
      ▼  POST /api/ai/analyze  (single Gemini 2.0 Flash call)
      │
      ├─ ① Issue Detection Agent     → quality gate + classify + describe
      ├─ ② Duplicate Detection Agent → match against 500m radius open issues
      ├─ ③ Priority Scoring Agent    → 0-100 score: road(40%) + traffic(25%) + votes(20%) + hospital(15%)
      ├─ ④ Department Routing Agent  → PWD / JVVNL / JMC / DISCOM + escalation flag
      └─ ⑤ Mayor Insight Agent       → tags + area_risk_contribution for briefing
            │
            ▼
      CIEResponse (Pydantic-validated JSON)
```

**One endpoint. One Gemini call. Five sequential reasoning stages. Bulletproof fallbacks — user submit never breaks.**

Mayor Briefing is a separate endpoint: `POST /api/ai/mayor-insights/live` — aggregates all open issues, returns structured operational intelligence.

---

## 💡 Five Killer Features (what judges remember)

| # | Feature | Why it's different |
|---|---|---|
| 1 | **AI Incident Merge** | Duplicates auto-detected via geo+semantic; reports merged, not just flagged |
| 2 | **Evidence Quality Gate** | Blurry image → specific retake instructions, not a generic error |
| 3 | **Dynamic Priority Score** | 4-factor weighted 0-100, not a checkbox severity 1-5 |
| 4 | **Mayor's Morning Briefing** | Daily AI operational summary: hotspots, dept load, risk deltas, concrete actions |
| 5 | **AI-Enriched Timeline** | 6-stage lifecycle (AI Detected → Resolved), not just "status: open" |

---

## 🗂️ Complete File Map (54 files, all built)

```
civicpulse/
├── README.md                                    ✅ Professional, hackathon-ready
├── brain.md                                     ✅ This file
├── architecture.md                              ✅ System design, data models, API
├── design.md                                    ✅ UI/UX spec, color palette, wireframes
├── .gitignore                                   ✅
├── cloudbuild.yaml                              ✅ CI/CD: build + push + deploy to Cloud Run
├── docker-compose.yml                           ✅ Local dev (backend:8000 + frontend:5173)
│
├── backend/
│   ├── Dockerfile                               ✅ Multi-stage, non-root user, Cloud Run ready
│   ├── requirements.txt                         ✅ Pinned production deps
│   ├── .env.example                             ✅ Template for all required env vars
│   └── app/
│       ├── __init__.py
│       ├── main.py                              ✅ FastAPI app, CORS, timing middleware, error handler
│       ├── config.py                            ✅ pydantic-settings, all env vars validated on startup
│       ├── middleware/
│       │   └── auth.py                          ✅ Firebase token verify, require_auth / optional_auth
│       ├── models/
│       │   └── schemas.py                       ✅ ALL Pydantic models + enums (326 lines)
│       ├── services/
│       │   ├── civic_intelligence_engine.py     ✅ 5-agent CIE + Mayor briefing + fallbacks (375 lines)
│       │   └── firebase_service.py              ✅ Firestore CRUD + gamification points (432 lines)
│       └── routers/
│           ├── ai.py                            ✅ POST /api/ai/analyze, /mayor-insights, /mayor-insights/live
│           ├── issues.py                        ✅ Full CRUD: POST/GET/GET/{id}/PATCH/DELETE
│           ├── votes.py                         ✅ POST /api/votes, GET /api/votes/{id}
│           └── users.py                         ✅ POST /sync, GET /me, GET /leaderboard
│
└── frontend/
    ├── Dockerfile                               ✅ node:20 build → nginx:alpine serve
    ├── nginx.conf                               ✅ SPA routing, gzip, asset caching
    ├── index.html                               ✅ Google Fonts, favicon, SEO meta
    ├── vite.config.js                           ✅ Code-split chunks: react, firebase, maps, charts
    ├── postcss.config.js                        ✅
    ├── tailwind.config.js                       ✅ Civic design tokens (colors, fonts, shadows, animations)
    ├── package.json                             ✅ All deps pinned
    ├── .env.example                             ✅ Firebase + Maps + API base URL
    ├── public/
    │   └── favicon.svg                          ✅
    └── src/
        ├── main.jsx                             ✅ ReactDOM.createRoot
        ├── index.css                            ✅ Tailwind layers + cie-card + scrollbar
        ├── App.jsx                              ✅ BrowserRouter, lazy pages, Toast, auth+issues init
        ├── lib/
        │   └── utils.js                         ✅ CATEGORIES, STATUS_META, BADGE_META, DEPT_META, helpers
        ├── store/
        │   └── useStore.js                      ✅ Zustand: auth + issues + filters + mayorBriefing + UI
        ├── services/
        │   ├── firebase.js                      ✅ Init, auth helpers, Firestore realtime subscriptions
        │   └── api.js                           ✅ All backend calls, ApiError class, auto token injection
        ├── hooks/
        │   ├── useAuth.js                       ✅ Firebase auth → Zustand, backend sync on login
        │   ├── useIssues.js                     ✅ Firestore realtime → Zustand
        │   └── useCivicEngine.js                ✅ CIE API call + haversine 500m nearby issues
        ├── components/
        │   ├── shared/
        │   │   └── Navbar.jsx                   ✅ Logo, nav links, auth button, badge emoji
        │   ├── Report/
        │   │   ├── ReportModal.jsx              ✅ 3-step wizard (Upload → Details → Confirm)
        │   │   └── AIEnginePreview.jsx          ✅ THE money UI: 5-agent result card, gradient border pulse
        │   └── Issue/
        │       ├── IssueCard.jsx                ✅ Feed item: priority bar, verify/upvote
        │       ├── AITimeline.jsx               ✅ 6-stage AI-enriched lifecycle
        │       └── PriorityScoreBar.jsx         ✅ Animated 4-factor breakdown
        └── pages/
            ├── Home.jsx                         ✅ Morning greeting overlay → Google Maps full-screen
            ├── IssueFeed.jsx                    ✅ Filterable, sortable issue list
            ├── IssueDetail.jsx                  ✅ Full issue: AI analysis + priority + timeline
            ├── Dashboard.jsx                    ✅ Stats, Recharts pie+bar, AI insight card, leaderboard
            ├── MayorView.jsx                    ✅ Dark command-center briefing page
            └── Profile.jsx                      ✅ Avatar, badge, points progress, issue history
```

---

## 📡 API Routes (all 13 registered and validated)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/analyze` | optional | 5-agent CIE pipeline |
| POST | `/api/ai/mayor-insights` | optional | Mayor briefing (caller provides issues) |
| POST | `/api/ai/mayor-insights/live` | optional | Mayor briefing (auto-fetches from Firestore) |
| POST | `/api/issues` | required | Create issue |
| GET  | `/api/issues` | optional | List issues (filter + paginate) |
| GET  | `/api/issues/{id}` | optional | Single issue |
| PATCH| `/api/issues/{id}/status` | required | Update status |
| DELETE| `/api/issues/{id}` | required | Soft delete |
| POST | `/api/votes` | required | Verify or upvote (idempotent) |
| GET  | `/api/votes/{id}` | required | Get vote state |
| POST | `/api/users/sync` | required | Upsert user on login |
| GET  | `/api/users/me` | required | Own profile |
| GET  | `/api/users/leaderboard` | required | Top 10 civic heroes |

---

## 🔑 Decision Log

| Decision | Reason |
|---|---|
| Gemini 2.0 Flash (not 1.5) | Latest, fastest, multimodal, free tier sufficient |
| Single Gemini call for all 5 agents | Speed + cost + one JSON to validate |
| Pydantic v2 for CIE output | Type-safe, auto-validates Gemini JSON, clean error messages |
| Bulletproof fallbacks in CIE | User submit flow NEVER breaks due to AI error |
| Multi-stage Docker (non-root) | Security + smaller images for Cloud Run |
| asia-south1 region | Mumbai — lowest latency from Jaipur |
| Map pins colored by priority (not category) | Urgency visible at a glance |
| Dark theme for Mayor view | Command-center feel; judges remember it |
| Code-split chunks (vite) | Maps/Firebase/Recharts are heavy; lazy-load cuts TTFB |
| Zustand (not Redux/Context) | Minimal boilerplate, selector-based re-renders |
| Firestore realtime (not polling) | Issues appear on map instantly, no refresh needed |

---

## 📦 Deliverables Checklist

- [ ] `git push origin main` (clean, .gitignore covers .env)
- [ ] Google Cloud setup (Artifact Registry + Secret Manager + Cloud Build trigger)
- [ ] Update `_BACKEND_URL` + `_FRONTEND_URL` in `cloudbuild.yaml` after first deploy
- [ ] Public URL → test all 6 pages + report flow
- [ ] Google Doc (Problem + Solution + Features + Google Tech used)
- [ ] Submit to hackathon portal

---

## 🚀 Next Immediate Steps

```bash
# 1. Create local .env files from examples
cp backend/.env.example backend/.env       # fill in keys
cp frontend/.env.example frontend/.env.local  # fill in keys

# 2. Run locally
docker-compose up

# 3. Push to GitHub
git init && git add . && git commit -m "feat: CivicPulse full project" && git push

# 4. Deploy to Cloud Run (first deploy manual, then CI/CD handles it)
gcloud run deploy civicpulse-backend  --source ./backend  --region asia-south1 --allow-unauthenticated
gcloud run deploy civicpulse-frontend --source ./frontend --region asia-south1 --allow-unauthenticated
```
