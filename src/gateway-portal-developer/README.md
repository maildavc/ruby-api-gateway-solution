# Gateway Developer Portal

World-class developer portal for the API Gateway. This app provides onboarding, key management, API console, logs, and documentation.

## Features

- Auth flows with session-aware route protection
- API key management UX (scopes, environments, rotation cues)
- API console with request templates and response viewer
- Logs & observability with filters and trace IDs
- MDX-based documentation
- Status page, billing, and support workflows

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
NEXT_PUBLIC_PORTAL_NAME=Gapeiro Developer Portal
NEXT_PUBLIC_SUPPORT_EMAIL=support@gapeiro.dev
```

## Mock APIs

The app ships with mock route handlers under `app/api` for auth, apps, keys, logs, and status. Swap to real APIs by setting `NEXT_PUBLIC_GATEWAY_BASE_URL`.

## Folder Structure

Key folders:

- `app/(auth)` auth flows
- `app/(protected)` portal pages
- `components` UI and feature components
- `lib` API client, auth, config
- `content/docs` MDX documentation

## Notes

- This project uses MDX in the App Router with a registry for documentation pages.
- Theme toggling is provided via `next-themes`.
