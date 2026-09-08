# Operations

Runtime source belongs in `src/` and `api/`. Reusable maintenance utilities belong in `scripts/`.

Private operational material is ignored by Git and organized under `.private/`:

- `deployment/` — FTP deployment scripts and credentials
- `environments/` — production and local-container environment files
- `database/` — private database snapshots
- `diagnostics/` — temporary diagnostic PHP utilities
- `logs/` — downloaded production diagnostics
- `references/` — private screenshots and reference files

## Build

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Deploy frontend

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .private/deployment/deploy-dist-parallel.ps1
```

## Deploy application

Normal deployments preserve the server environment, uploads, and API error log:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .private/deployment/deploy-invoices.ps1
```

Environment synchronization must be requested explicitly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .private/deployment/deploy-invoices.ps1 -EnvOnly
```

## Database schema inspection

The schema utility loads credentials from `api/.env`; it contains no embedded credentials:

```powershell
php scripts/database/schema-dump.php
```
