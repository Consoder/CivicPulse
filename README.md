# CivicPulse — Agentic Civic Issue Triage

**CivicPulse** is a hackathon-built civic-issue reporting prototype using a multi-turn Gemini tool-calling pipeline to classify reports, check duplicates, prioritize municipal issues, route them to departments, and summarize insights.

> **Status:** Hackathon prototype tested locally; not a verified public cloud deployment or integrated municipal production system.

## Problem

Citizen reports are unstructured, can describe overlapping incidents, and need prioritization and routing. CivicPulse demonstrates explainable AI-assisted triage while preserving the role of human municipal decision makers.

## Technology

| Layer | Stack |
|---|---|
| AI workflow | Gemini 2.0 Flash, multi-turn function calling, five tools |
| Backend | Python, FastAPI |
| Frontend | React, Leaflet |
| Identity | Firebase Authentication |
| Deployment preparation | Docker / Cloud Build configuration |

## Five-tool workflow

1. **Classify incidents** based on report evidence.
2. **Check duplicates** among nearby/existing issue records.
3. **Calculate priority** using issue context.
4. **Route departments** for follow-up.
5. **Generate mayor insights** for an operational briefing.

```mermaid
flowchart LR
    A[Resident report] --> B[FastAPI]
    B --> C[Gemini tool-calling loop]
    C --> D[Classify]
    D --> E[Duplicate check]
    E --> F[Prioritize]
    F --> G[Department routing]
    G --> H[Mayor insights]
    H --> I[Tool trace + response]
    I --> J[React / Leaflet]
```

## Implementation status

- Implemented a multi-turn, five-tool Gemini workflow.
- Integrated React/Leaflet, FastAPI, and Firebase Auth in the prototype.
- Verified nine local API routes during development.
- Prepared deployment configuration; **no verified live production deployment**.

## Source code and reproducibility

**Source upload pending.** This README documents the existing project and does not represent the full source tree. The original frontend and backend files must be uploaded before this repository can be built or run by others.

The expected working source is the original CivicPulse project, not a newly generated demonstration substituted for the original.

Once published, add exact commands from the backend manifest and frontend `package.json`, environment-variable names, screenshots, and reproduced tests. Do not commit API keys, service-account secrets, or real citizen data.

## Security / limitations

This prototype is a decision-support tool. Issue classification, duplicate detection, priority scores and routing require human validation before operational use. A visible tool trace aids debugging but is not a guarantee of accuracy. No public cloud deployment or multi-tenant guarantees are claimed.

## Next milestones

- Publish and audit the original source tree
- Document local setup and add reproducible unit/integration tests
- Add persistence, human-in-the-loop review, and harden permissions
- Deploy and verify a real demonstration environment

Maintainer: [Consoder](https://github.com/Consoder).
