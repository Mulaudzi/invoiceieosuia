# IEOSUIA Invoices

IEOSUIA Invoices is a free application for creating, downloading, tracking, and managing professional invoices.

## Local development

Requirements: Node.js, npm, PHP, and a configured MySQL database.

```bash
npm install
npm run dev
```

Copy `api/.env.example` to `api/.env` and provide the required production or local credentials. The real `api/.env` is ignored by Git.

## Verification

```bash
npm test
npm run typecheck
```

## Production build

```bash
npm run build
```

This creates the frontend in `dist` and produces `build-package.zip`. The archive contains the `dist` contents at its root and the complete `api` directory, including `api/.env`.

`build-package.zip` contains production secrets and must never be committed or shared publicly.

Operational and deployment file locations are documented in [docs/operations.md](docs/operations.md).
