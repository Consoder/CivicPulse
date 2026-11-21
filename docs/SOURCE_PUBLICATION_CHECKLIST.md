# CivicPulse source publication checklist

The actual CivicPulse source has not been uploaded to this GitHub repository yet. This checklist avoids presenting documentation as a runnable product.

## 1. Source folders
- [ ] Commit the actual frontend source (including its package.json/lockfile).
- [ ] Commit the actual Python/FastAPI backend source and dependency manifest.
- [ ] Include only redacted environment examples; never upload real Gemini or Firebase keys.
- [ ] Exclude local datasets, personal information and credential JSON files.

## 2. Accuracy and tests
- [ ] Document the five Gemini tools and trace output using existing source.
- [ ] Check the original nine API routes and record the actual local test command/results.
- [ ] Confirm whether storage is in-memory or persisted, and document it accurately.
- [ ] Document React/Leaflet maps and Firebase Auth configuration.
- [ ] Describe Docker/Cloud Build as configuration until a real deployment is verified.

## 3. README completion
- [ ] Add verified install/run commands from real manifest files.
- [ ] Add a redacted screenshot.
- [ ] Add architecture explanation grounded in code.
- [ ] Add a live demo URL only after deployment and verification.
- [ ] Confirm no secret-containing files or private citizen information entered Git history.

A repository with only documentation is **not** public proof of implementation.
