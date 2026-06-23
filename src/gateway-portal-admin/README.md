# Gateway Admin Portal

Enterprise-grade admin portal for the API Gateway control plane. This app provides governance, RBAC, product/service/endpoint management, and observability.

## Features

- Auth flows with session-aware route protection
- Gateway settings and change management
- RBAC with permissions and audit logs
- Product/service/endpoint/destination management
- API key governance (reveal/rotate/revoke)
- Observability, alerts, and metrics dashboards

## Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui-inspired components
- TanStack Query
- React Hook Form + Zod
- next-themes

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_GATEWAY_BASE_URL=
NEXT_PUBLIC_PORTAL_NAME=Gapeiro Admin Portal
NEXT_PUBLIC_SUPPORT_EMAIL=support@gapeiro.dev
```

## Mock APIs

The app ships with mock route handlers under `app/api` for auth. Swap to real APIs by setting `NEXT_PUBLIC_GATEWAY_BASE_URL`.

## Folder Structure

Key folders:

- `app/(auth)` auth flows
- `app/(protected)` admin pages
- `components` UI and feature components
- `lib` API client, auth, config
-- `content/docs` MDX documentation (optional)

## Notes

- This project uses MDX in the App Router with a registry for documentation pages.
- Theme toggling is provided via `next-themes`.
