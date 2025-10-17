# Jira++ Deployment Plan

Comprehensive recipe for shipping Jira++ (Vite/React web, Node/GraphQL API, Prisma/Postgres, Temporal workflows) through Dev → UAT → Prod with Docker Compose.

---

## 1. Environment Strategy

| Environment | Purpose | Infrastructure | Key Practices |
|-------------|---------|----------------|---------------|
| **Local / Dev** | Individual feature development | Docker Compose (local Postgres + Temporal) | `.env.local`, seed data, hot reload, compose override for dev tooling. |
| **UAT / Staging** | Internal QA, stakeholder sign-off | Single VPS (Hetzner/OCI/Fly) running full stack via Compose | `.env.uat`, same services as prod, lower resource limits, nightly reset jobs. |
| **Production** | Customer traffic | VPS or managed platform (future) | HA Postgres, backups, monitoring, CDN for web assets. |

- Maintain `.env.template` in repo; keep `.env.local`, `.env.uat` outside version control.
- Use `docker-compose.yml` + `docker-compose.override.<env>.yml` to tweak ports/resources per environment.
- Secrets injected via environment variables or secret manager (not committed).

---

## 2. Application Readiness

### Health & Readiness
- API and worker now expose `/health` + `/healthz` JSON endpoints consumed by Compose healthchecks.
- Define `/ready` semantics once DB/Temporal connectivity checks are implemented.

### Logging & Metrics
- Switch API logging to structured JSON (pino/winston) directed to stdout.
- Provide Prometheus endpoint (`/metrics`) for basics: request count, latency, Temporal job status.
- Mount `/logs` volume for optional file aggregation; ship to Loki/Grafana once available.

### Error Tracking & Shutdown
- Integrate Sentry (free tier) or OTEL console exporter for UAT visibility.
- Trap `SIGINT/SIGTERM` in API & worker to close Prisma/Temporal connections cleanly.

---

## 3. UAT Deployment Stack (Docker Compose)

```
api
worker
web (optional static server)
postgres
temporal-server
temporal-ui
traefik (reverse proxy + TLS)
autoheal (optional)
```

1. Provision VPS (e.g., Hetzner CX22, 2 vCPU, 4GB RAM) with Docker & Compose.
2. Attach persistent volume for Postgres (`/var/lib/postgresql/data`).
3. Clone repo to `/opt/jira-plus-plus`, copy `.env.uat`, run `docker compose --env-file .env.uat up -d`.
4. Traefik provides HTTPS via Let’s Encrypt; define routers for API (`api.<domain>`), Temporal UI (`temporal.<domain>`), optional static web.
5. Behind Cloudflare DNS (orange proxy) for extra TLS and DDoS protection.

---

## 4. Reliability & Recovery

| Risk | Mitigation |
|------|------------|
| Container crash | `restart: unless-stopped` in Compose; Autoheal container restarts unhealthy services. |
| Dependency startup order | Healthchecks with `depends_on: condition: service_healthy`. |
| DB persistence | Named Docker volume + nightly `pg_dump` to `/backups`. |
| Host reboot | Enable Docker service auto-start; Compose restarts with restart policies. |
| Deployment rollback | Keep prior tagged images; `docker compose up -d <previous-tag>`. |

Add cron (host-side) for DB backups:

```bash
0 2 * * * docker exec jira_db pg_dump -U $POSTGRES_USER $POSTGRES_DB > /opt/backups/jira_$(date +%F).sql
```

---

## 5. Security Baseline

- Secrets via `.env.uat`/Docker secrets; rotate credentials periodically.
- Traefik terminates TLS; API/DB not exposed publicly.
- Restrict CORS/GraphQL playground to known origins in UAT.
- Disable Prisma introspection in non-dev envs.
- Protect Temporal UI with basic auth (Traefik middleware) or VPN.
- Use minimal images (node:20-alpine, postgres:15-alpine).

---

## 6. CI/CD Automation

### GitHub Actions
- Workflow steps (see `.github/workflows/deploy-uat.yml`):
  1. Lint/typecheck/test web & api (`pnpm` commands).
  2. Build artifacts + Docker images.
  3. SSH deploy to VPS (`deploy.sh` script) or trigger CapRover.
- Gate deployments on successful checks; manual approval optional.

### Auto Updates & Monitoring
- Add Watchtower container for base image updates.
- Uptime checks via Pingdom/Healthchecks on `/health` endpoint; email/Slack alerts.

---

## 7. UAT Validation Playbook

| Phase | Checklist |
|-------|-----------|
| Smoke | Compose stack starts; `/health` and `/ready` pass; UI loads. |
| Functional | Login, CRUD, Temporal workflow runs, integration syncs; inspect logs. |
| Performance | Simulate 20–30 concurrent users; watch DB/CPU metrics. |
| Recovery | Kill containers (API, Temporal); ensure auto-restart & state replay. |
| Upgrade | Deploy new image; validate migrations + data integrity. |
| Observability | Confirm logs available, metrics scrape, Sentry events captured. |

---

## 8. Next Steps Before UAT Go-Live

### Must Do
1. Implement health endpoints & configure Compose healthchecks.
2. Switch logging to structured JSON.
3. Harden env handling (`.env.template`, secrets via env vars/manager).
4. Provision persistent volumes & backup cron.
5. Set up Traefik reverse proxy with HTTPS.
6. Use automation scripts:
   - `infra/scripts/bootstrap-host.sh` to prepare a fresh VPS (Docker, directories).
   - `infra/deploy.sh` for repeatable Compose deployments.
   - `infra/scripts/backup.sh` + cron for nightly dumps.

### Nice to Have
- Sentry integration.
- Prometheus metrics + lightweight Grafana dashboards.
- Autoheal & Watchtower sidecars.
- Slack webhook notifications for deploys/failures.

---

## 9. Future Enhancements
- CapRover or Fly.io to reduce manual ops.
- Managed Postgres (Neon/RDS) once dataset grows.
- Temporal Cloud for large-scale workflow orchestration.
- Feature flags & canary deployments.

---

## References
- `specs/features/ingestion_runtime/overview.md`
- `specs/features/integration_enrichment/overview.md`
- `infra/` deployment assets & `.github/workflows/deploy-uat.yml`
