# Deployment Environments

Use separate frontend deployments for development and production. Each deployment should have its own API URL and Google client ID.

## Frontend Variables

| Variable | Development | Production |
| --- | --- | --- |
| `VITE_API_URL` | Dev API URL, usually `http://localhost:8080` locally | Production API URL |
| `VITE_GOOGLE_CLIENT_ID` | Dev OAuth client ID | Production OAuth client ID |
| `VITE_PUBLIC_SITE_URL` | Dev website URL, for example the dev Vercel URL | Production website URL |
| `VITE_SESSION_TIMEOUT_MINUTES` | Client login duration in minutes, default `60` | Client login duration in minutes, default `60` |

`VITE_PUBLIC_SITE_URL` is used for public QR codes such as the customer review QR. If it is not set, the app uses the current browser URL. That is fine on Vercel, but local development will generate `localhost`, which phones cannot open unless they are specially configured for local network access.

The effective logged-in duration is whichever expires first: frontend `VITE_SESSION_TIMEOUT_MINUTES` or backend API `JWT_EXPIRATION_MS`.

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
