# Deployment Environments

Use separate frontend deployments for development and production. Each deployment should have its own API URL and Google client ID.

## Frontend Variables

| Variable | Development | Production |
| --- | --- | --- |
| `VITE_API_URL` | Dev API URL, usually `http://localhost:8080` locally | Production API URL |
| `VITE_GOOGLE_CLIENT_ID` | Dev OAuth client ID | Production OAuth client ID |

## Local Development

Copy `.env.development.example` to `.env.local` and update values for your machine.

```bash
pnpm run dev
```

## Builds

```bash
pnpm run build:dev
pnpm run build:prod
```

## Deployment Rule

Point the dev UI at the dev API and dev database. Point the prod UI only at the prod API and prod database.
