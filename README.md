# WishBucket

WishBucket is a Telegram Mini App for creating and sharing wishlists. Friends can browse each other's lists, reserve or crowdfund gifts, run Secret Santa exchanges, and earn points/levels through a built-in gamification system.

## Features

- **Wishlists** — create, edit, and share wishlists (public, private, or link-only visibility)
- **Add items via URL scraping** — paste a product link and the app auto-fills title, image, price, and currency
- **Reservations & crowdfunding** — friends can reserve a gift or contribute toward its cost
- **Secret Santa** — organize gift exchanges among a group of participants
- **Friends & profiles** — view friends' wishlists, referral system
- **Gamification** — points, levels (unlocking more wishlists), a points market, and tasks (follow channel, refer friends, in-app actions)
- **Hints** — send gift hints/reminders, birthday reminders via scheduled Supabase functions
- **Multi-language** — English, Ukrainian, and Russian localization
- **Telegram-native** — built on `@twa-dev/sdk`, deep-linking via Telegram start parameters

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, React Router, Zustand (state), `@twa-dev/sdk` (Telegram WebApp)
- **Backend**: Supabase (Postgres + Auth + Edge Functions) as the primary API (`src/services/supabase-api.ts`)
- **Scrape server**: standalone Hono server (`server/`) that fetches and parses product metadata from URLs
- **Scraper actor**: Apify actor (`apify/product-scraper/`) — headless-browser fallback for sites that block simple scraping
- **Supabase Edge Functions** (`supabase/functions/`): `scrape-url`, `send-telegram-notification`, `telegram-webhook`, `setup-telegram-bot`, `check-birthdays`

## Project Structure

```
wishbucket/
├── src/                  # React app (pages, components, store, services, config)
│   ├── pages/            # Route-level views (Home, Wishlists, Friends, Market, Tasks, ...)
│   ├── components/       # Reusable UI components
│   ├── services/         # API clients (Supabase)
│   ├── store/            # Zustand global store
│   ├── config/           # Market items, tasks, levels config
│   └── utils/            # Telegram integration, localization, affiliate links
├── server/               # Local/dev scrape server (Hono + impit + metascraper)
├── supabase/             # Database schema, migrations, and Edge Functions
├── apify/product-scraper/# Apify actor for robust product scraping (Playwright + Crawlee)
├── index.html            # Vite entry HTML
└── vite.config.ts        # Vite config (dev server on port 3000)
```

## Prerequisites

- Node.js `22.22.2` (see `.nvmrc`) — `nvm use`
- npm (or yarn — both lockfiles are present)
- A Supabase project (URL + anon key)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```bash
   VITE_API_URL=http://localhost:8080/api
   VITE_SUPABASE_URL=<your-supabase-project-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
3. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000` (configured in `vite.config.ts`).
4. (Optional) Start the local scrape server, used when adding wishlist items from a URL:
   ```bash
   npm run scrape:dev
   ```
   This runs `server/` via `tsx watch` on `http://127.0.0.1:8787` by default (override with `PORT`).

Since this is a Telegram Mini App, full functionality (Telegram user context, deep links) requires opening it through Telegram (e.g. via a bot configured with a Mini App URL, or a tunneling tool like ngrok pointed at the dev server — see `allowedHosts` in `vite.config.ts`). Outside Telegram, `src/utils/telegram-mock.ts` provides a mock for local development.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run scrape:dev` | Run the local product-scrape server (`server/`) in watch mode |
| `npm run apify:scraper` | Run the Apify product-scraper actor locally (via pnpm) |

## Backend (Supabase)

- `supabase/schema.sql` / `supabase/hints_schema.sql` — database schema
- `supabase/migrations/` — schema migrations
- `supabase/functions/` — Edge Functions:
  - `scrape-url` — server-side product URL scraping
  - `telegram-webhook` — handles incoming Telegram bot updates
  - `setup-telegram-bot` — bot/webhook configuration
  - `send-telegram-notification` — push notifications to users
  - `check-birthdays` — scheduled job for birthday reminders

Deploy functions with the Supabase CLI, e.g.:
```bash
supabase functions deploy <function-name>
```

## Environment Variables

| Variable | Used in | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | frontend | Base URL for the scrape/API server |
| `VITE_SUPABASE_URL` | frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | Supabase anonymous/public API key |
| `PORT` | `server/` | Port for the local scrape server (default `8787`) |
| `HTTP_PROXY` / `HTTPS_PROXY` | `server/` | Optional outbound proxy for scraping requests |
| `IMPIT_IGNORE_TLS_ERRORS` | `server/` | Set `"true"` to ignore TLS errors while scraping |

Note: `.env` is git-ignored. `BACKEND_API.md` and `DATABASE_SCHEMA.md` are also git-ignored — check locally if present for detailed API/schema notes.

## Linting & Type Checking

```bash
npm run lint
npm run build   # includes a full tsc type-check
```
