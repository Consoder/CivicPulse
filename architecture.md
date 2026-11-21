# 🏗️ ARCHITECTURE.MD — CivicPulse
> System design, data contracts, API reference.

---

## System Overview

```
                         ┌────────────────────────────┐
                         │   Browser / Mobile          │
                         │   React 18 + Vite           │
                         │   Tailwind + Zustand        │
                         └────────────┬───────────────┘
                                      │ HTTPS / REST
                         ┌────────────▼───────────────┐
                         │   FastAPI Backend            │
                         │   Python 3.12               │
                         │   Cloud Run (asia-south1)   │
                         └───┬────────────────────┬───┘
                             │                    │
              ┌──────────────▼──────┐    ┌────────▼──────────────┐
              │   Gemini 2.0 Flash  │    │   Firebase Suite       │
              │   (5-agent CIE +    │    │   Firestore (realtime) │
              │    Mayor Briefing)  │    │   Auth (Google SSO)    │
              └─────────────────────┘    │   Storage (images)     │
                                         └───────────────────────┘
                                                    │
                                         ┌──────────▼───────────┐
                                         │   Google Maps JS API  │
                                         │   (Pins, Heatmap)     │
                                         └──────────────────────┘
```

---

## Google Technologies (7 — maximise eval score)

| Technology | Integration point | Eval impact |
|---|---|---|
| **Gemini 2.0 Flash** | 5-agent CIE + Mayor Briefing | Agentic Depth (20%) |
| **Firebase Firestore** | Realtime issues, users, votes, briefings | Tech impl |
| **Firebase Auth** | Google Sign-In, token verification | Tech impl |
| **Firebase Storage** | Image uploads from citizen reports | Tech impl |
| **Google Maps JS API** | Full-screen map, priority pins, heatmap | Product Experience |
| **Google Cloud Run** | Backend + frontend deployment | Hosting |
| **Google Cloud Build** | CI/CD — build + push + deploy on `git push` | DevOps |

---

## Civic Intelligence Engine — Agent Protocol

### Input contract
```json
POST /api/ai/analyze
{
  "image_base64": "...",
  "image_mime_type": "image/jpeg",
  "location_lat": 26.9124,
  "location_lng": 75.7873,
  "location_address": "MG Road, Jaipur",
  "upvote_count": 5,
  "nearby_issues": [
    {
      "id": "uuid",
      "category": "POTHOLE",
      "title": "Pothole near signal",
      "lat": 26.9127,
      "lng": 75.7870,
      "upvotes": 12,
      "created_at": "2026-06-27T08:00:00Z"
    }
  ]
}
```

### Output contract (CIEResponse)
```json
{
  "agent1_detection": {
    "quality_pass": true,
    "quality_feedback": null,
    "category": "POTHOLE",
    "confidence": 0.92,
    "description": "A large pothole approximately 2 feet wide. Underlying gravel exposed.",
    "short_title": "Deep Pothole Near MG Road Signal"
  },
  "agent2_duplicate": {
    "is_duplicate": false,
    "duplicate_of": null,
    "merge_reason": null,
    "confidence": 0.0
  },
  "agent3_priority": {
    "priority_score": 91,
    "priority_label": "CRITICAL",
    "breakdown": {
      "road_damage": 38,
      "traffic_density": 23,
      "community_votes": 15,
      "hospital_proximity": 15
    },
    "estimated_resolution_hours": 12
  },
  "agent4_routing": {
    "department": "PWD",
    "routing_reason": "Road surface damage falls under PWD jurisdiction.",
    "escalate": true,
    "escalation_reason": "Priority score of 91 exceeds 80-point escalation threshold."
  },
  "agent5_insight": {
    "tags": ["pothole", "mg-road", "critical", "high-traffic"],
    "area_risk_contribution": "HIGH",
    "insight_note": "Critical pothole on MG Road requires immediate PWD deployment."
  }
}
```

### Fallback behaviour
- Any Gemini error → `_cie_fallback()` returns valid CIEResponse with `quality_pass: false`
- User submit flow is **never blocked** by AI failures
- Mayor briefing fallback computes dept load from raw issue data (no Gemini needed)

---

## Priority Score Weights

```
Road Damage Severity   → max 40 pts (minor=10, moderate=20, significant=30, severe=40)
Traffic Density        → max 25 pts (main road=20-25, residential=8-15, rural=3-8)
Community Votes        → max 20 pts (0=0, 1-5=5, 6-15=10, 16-30=15, 31+=20)
Hospital Proximity     → max 15 pts (hospital/school=12-15, residential=5-8, rural=2-4)
                         ─────────────────────────────────────────────────────────────
Total                  → 0-100 → LOW(<31) | MEDIUM(31-60) | HIGH(61-80) | CRITICAL(81-100)
```

---

## Department Routing Logic

| Category | Department | Rationale |
|---|---|---|
| POTHOLE, road damage | PWD | Public Works — road maintenance |
| WATER_LEAKAGE, pipes | JVVNL | Jaipur Vidyut Vitran Nigam Ltd |
| WASTE, garbage, SEWAGE | JMC | Jaipur Municipal Corporation |
| STREETLIGHT, electrical | DISCOM | Power Distribution Company |
| Unclear / OTHER | JMC | Default |

Escalation: `priority_score > 80` OR water near residential OR streetlight on major road.

---

## Firestore Data Model

### `issues` collection
```
{
  id:                   string (UUID)
  title:                string
  description:          string
  category:             "POTHOLE" | "WATER_LEAKAGE" | "STREETLIGHT" | "WASTE" | "SEWAGE" | "OTHER"
  status:               "REPORTED" | "VERIFIED" | "IN_PROGRESS" | "RESOLVED"
  location:             { lat, lng, address }
  imageUrls:            string[]
  reportedBy:           uid
  verifiedBy:           uid[]
  verificationCount:    number   (auto-advances to VERIFIED at 3)
  upvotes:              number
  department:           "PWD" | "JVVNL" | "JMC" | "DISCOM" | "OTHER"
  escalated:            boolean
  priorityScore:        number (0-100)
  duplicateOf:          string | null
  estimatedResolutionHours: number
  aiAnalysis:           CIEResponse (nested)
  aiTimeline:           [{ stage, timestamp, note }] (6 stages)
  tags:                 string[]
  createdAt:            ISO timestamp
  updatedAt:            ISO timestamp
  resolvedAt:           ISO timestamp | null
}
```

### `users` collection
```
{
  uid, displayName, email, photoURL,
  points, badge,
  issuesReported, issuesVerified, issuesResolved,
  joinedAt
}
```

### `votes` collection
```
Document ID: "{issueId}_{userId}_{VERIFY|UPVOTE}"  (idempotent by design)
{ issueId, userId, type, createdAt }
```

### `mayor_briefings` collection
```
Document ID: "YYYY-MM-DD" (daily snapshot)
{ summary, hotspots[], department_load{}, risk_deltas[], recommended_actions[],
  neighborhood_health_scores[], total_open_issues, total_critical, duplicates_merged_today,
  generatedAt }
```

---

## Gamification Points

| Action | Points |
|---|---|
| Report an issue | +10 |
| AI quality gate passes | +5 bonus |
| Verify someone else's issue | +5 |
| Issue reaches 3+ verifications (reporter) | +15 |
| Issue resolved (reporter) | +25 |
| First report in a new area (Pioneer) | +20 |
| Duplicate merge contribution | +10 |

**Badges:** 🌱 Newcomer (0-50) → 👁️ Watchdog (51-200) → 📢 Reporter (201-500) → 🦸 Civic Hero (500+)

---

## Deployment Architecture

```
git push → GitHub
    │
    └── Cloud Build trigger (cloudbuild.yaml)
          │
          ├── docker build backend  → Artifact Registry (asia-south1)
          ├── docker build frontend → Artifact Registry (asia-south1)
          │
          ├── gcloud run deploy civicpulse-backend
          │     memory: 512Mi, cpu: 1, min: 0, max: 5
          │     secrets: GEMINI_API_KEY, FIREBASE_* (from Secret Manager)
          │
          └── gcloud run deploy civicpulse-frontend
                memory: 256Mi, cpu: 1, min: 0, max: 3
                (nginx static, env baked in at build time)
```

---

## Environment Variables

### Backend (`backend/.env`)
```
GEMINI_API_KEY          = Gemini API key (Google AI Studio)
FIREBASE_PROJECT_ID     = Firebase project ID
FIREBASE_PRIVATE_KEY    = Service account private key (with literal \n)
FIREBASE_CLIENT_EMAIL   = Service account email
GOOGLE_MAPS_API_KEY     = Maps API key (backend geocoding, optional)
ALLOWED_ORIGINS         = Comma-separated list of allowed frontend origins
APP_ENV                 = development | production
LOG_LEVEL               = INFO | DEBUG
```

### Frontend (`frontend/.env.local`)
```
VITE_FIREBASE_API_KEY              = Firebase web API key
VITE_FIREBASE_AUTH_DOMAIN          = project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID           = Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET       = project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID  = Sender ID
VITE_FIREBASE_APP_ID               = App ID
VITE_GOOGLE_MAPS_API_KEY           = Maps JS API key (restrict to domain)
VITE_API_BASE_URL                  = http://localhost:8000 | https://backend.run.app
```
