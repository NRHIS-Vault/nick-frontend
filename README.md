# nick-frontend (Dashboard)

Dashboard UI scaffold for the Nick AI platform: chat, lead gen, trading bot, worker control, customer portal.

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui component set
- TanStack Query (available for future data fetching)
- Supabase JS client present for future auth/data (not wired yet)
- lucide-react icons

## Prerequisites
- Node.js **18**+
- npm

## Quick start
```bash
cd nick-frontend
npm install
npm run dev
```
Open the URL Vite prints (default http://localhost:5173).

## Build & preview
```bash
npm run build   # outputs dist/
npm run preview # serves the production build locally
```

## Lint
```bash
npm run lint
```

## Project structure
- `src/App.tsx` – app shell with theme, query client, routing.
- `src/pages/Index.tsx` – root route; renders `AppLayout`.
- `src/components/AppLayout.tsx` – main dashboard frame and navigation.
- Feature panels: `BusinessDashboard`, `LeadManagement`, `WorkerControl`, `BusinessCards`, `LeadBot`, `TradingBot`, `CustomerPortal`, `RHNISIdentity`, `NickAvatar`, `ChatInterface`.
- `src/contexts/AppContext.tsx` – sidebar state for mobile; unused imports removed.
- `src/lib/utils.ts` – `cn` className helper.
- `src/index.css` – Tailwind tokens/base.

## Deployment
- Static SPA build; deployable to Cloudflare Pages or any static host. Build command: `npm run build`; publish `dist/`.
- When wiring APIs/auth, surface needed env vars with `VITE_` prefixes and document them here.
