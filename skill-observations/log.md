# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue

---

- 2026-08-30 phase checkpoint: no observations.
- 2026-08-30 review: Docker workspace runtime dependency and queue crash-recovery were uncovered by cross-module verification; fixed at image boundary/processor boundary.

### Observation 1: Detect control-panel port ownership before VPS deploy

**Status:** OPEN
**Date:** 2026-08-31
**Session context:** Deploying a Docker Compose application onto a VPS managed by a hosting control panel.
**Skill:** New skill candidate: control-panel-aware-vps-deploy
**Type:** open-source
**Phase/Area:** Infrastructure discovery and reverse proxy integration

**Issue:** A standalone production Compose file bound ports 80/443, but the hosting panel already owned those ports through its host Nginx. Starting the stack unchanged would have failed or encouraged disabling the panel proxy.

**Suggested improvement:** Require `ss -lntp` and container port inspection before deployment, then select either standalone TLS termination or a loopback-only application override behind the existing host proxy.

**Principle:** Discover port ownership and proxy boundaries before deploying a web stack into any control-panel-managed server.

- 2026-08-31 Evolution readiness checkpoint: no observations.
- 2026-09-01 status-document checkpoint: no observations.
