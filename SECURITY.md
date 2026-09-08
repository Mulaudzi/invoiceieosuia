# Security operations

## Required deployment secrets

Copy `api/.env.example` to `api/.env` only on the deployment host. Never commit that file.

Set a strong, independent `CRON_SECRET` and send it through `X-Cron-Secret` (or a Bearer token) when invoking scheduled endpoints. Set `EMAIL_WEBHOOK_SECRET`; email event webhooks intentionally reject all requests when it is missing.

## Credential rotation required

An `api/.env` file was previously tracked. Rotate every real credential that appeared in it, including database, email, webhook, setup, and cron credentials. Removing the current file does not remove it from existing clones or Git history.

Rewrite repository history only as a separately coordinated maintenance operation, because it changes commit IDs for every collaborator.

## Browser origins

Set `CORS_ALLOWED_ORIGINS` to a comma-separated allowlist. Do not include `*` in production.
