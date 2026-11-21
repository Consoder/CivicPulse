# CivicPulse — Verification Report

Verified on **21 November 2026** against the public repository at [Consoder/CivicPulse](https://github.com/Consoder/CivicPulse).

## Result matrix

| Area | Result | Evidence |
|---|---|---|
| Python imports, routes and startup | PASS (local demo mode) | FastAPI startup and `/health` HTTP 200 |
| Backend API integration | PASS | 3 Pytest cases covering health, AI mock response, issue creation, upvote idempotency, status update, deletion, mayor briefing and invalid requests |
| React production bundle | PASS | [GitHub CI](https://github.com/Consoder/CivicPulse/actions/runs/44899385281) |
| Browser → React → backend | PASS (demo mode) | [Chromium smoke test](https://github.com/Consoder/CivicPulse/actions/runs/44899322429) |
| GitHub browser screenshot | CAPTURED | Download the `civicpulse-browser-smoke` artifact on the browser run |
| Public cloud deployment | **NOT VERIFIED** | No publicly reachable deployment URL was supplied or created during verification |
| Real Groq Llama inference | **NOT VERIFIED** | Mock AI response used in demo mode, not an external provider invocation |
| Real Firebase Auth / Firestore | **NOT VERIFIED** | In-memory demo data and placeholder Firebase configuration |

## Verified browser interaction

A clean GitHub Actions runner installed Chrome/Chromium dependencies, started FastAPI and Vite, loaded the CivicPulse React page, waited for its introductory animation, confirmed the **Report issue** button rendered, requested issues from the running FastAPI endpoint and received five demo records, and encountered **zero uncaught page errors**.

The check does **not** claim that every user journey or cloud deployment is working. It establishes a reproducible browser-to-backend smoke test in demo mode.

## Defect identified and fixed

Soft-deleting an issue previously assigned the internal status `DELETED`, which was not part of the public `IssueStatus` enumeration; later `GET /api/issues/{id}` and list requests could raise an exception. The fix now hides soft-deleted records from the detail and list endpoints; the regression test creates, votes, updates and deletes a report before re-querying.

## Deployment work remaining

1. Connect the repository to a supported cloud host or GCP project with appropriate permissions and billing controls.
2. Configure actual Firebase Web SDK settings for frontend login, and verified backend Firestore service-account credentials.
3. Configure the server-side **GROQ_API_KEY** secret for real AI; current source uses Groq/Llama, **not** a five-tool Gemini API workflow.
4. Set the real `_BACKEND_URL` and `_FRONTEND_URL` and Firebase Web SDK substitutions; configure domain authorization and CORS.
5. Rotate credentials from the original private ZIP if previously exposed; never add them to source control.
6. Deploy the frontend and backend and test the **public HTTPS URLs**, real login, actual external model request, persistence, negative/security cases and health checks.

The Cloud Build deployment template has been corrected for backend AI secret name, Cloud Run backend/frontend ports and public Firebase Web SDK build arguments, but has **not** been executed. Publishing a workflow configuration does not constitute cloud deployment.
