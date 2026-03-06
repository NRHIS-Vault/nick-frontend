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

## Routing
- `/` and `/dashboard` – `BusinessDashboard` (default view) wrapped in the `ProtectedRoute` stub.
- `/trading` – `TradingBot`
- `/leadbot` – `LeadBot`
- `/portal` – `CustomerPortal`
- `/rhnis` – `RHNISIdentity`
- `/businesses` – `BusinessCards`
- `/leads` – `LeadManagement`
- `/workers` – `WorkerControl`
- `/chat` – Nick chat surface (avatar header + `ChatInterface`)
- `/settings` – placeholder settings panel (ready for future auth/data)
- `*` – `NotFound` accessible 404 with dashboard/chat recovery links.

## Build & preview
```bash
npm run build   # outputs dist/
npm run preview # serves the production build locally
```

## Lint
```bash
npm run lint
```

## Environment setup
- Copy the sample env file: `cp .env.example .env`
- Required keys (all `VITE_` so Vite exposes them to the client bundle):
  - `VITE_SUPABASE_URL` – Supabase project URL for auth/data.
  - `VITE_SUPABASE_ANON_KEY` – Supabase anon/public key for the client SDK.
  - `VITE_STRIPE_PK` – Stripe publishable key for checkout/payment flows.
  - `VITE_API_BASE` – Base URL for your backend/worker API.
- `vite.config.ts` loads `dotenv` plus `loadEnv`; runtime code reads from `import.meta.env` via `src/lib/config.ts`. Empty strings are allowed when a service is not configured.

## Project structure
- `src/App.tsx` – app shell with theme, query client, and nested routes per panel.
- `src/pages/Index.tsx` – wraps `AppLayout` with `AppProvider` for layout state.
- `src/components/AppLayout.tsx` – main dashboard frame, Link-based navigation, and `<Outlet>` for child routes.
- Feature panels: `BusinessDashboard`, `LeadManagement`, `WorkerControl`, `BusinessCards`, `LeadBot`, `TradingBot`, `CustomerPortal`, `RHNISIdentity`, `NickAvatar`, `ChatInterface`.
- `src/routes/ProtectedRoute.tsx` – stub guard that currently returns children; drop in auth checks later.
- `src/pages/NotFound.tsx` – accessible 404 with recovery links back to the dashboard or chat.
- `src/contexts/ThemeContext.tsx` – light/dark theme state, root class toggling, and localStorage persistence.
- `src/contexts/AppContext.tsx` – sidebar state for mobile; unused imports removed.
- `src/lib/utils.ts` – `cn` className helper.
- `src/lib/config.ts` – typed access to env vars with safe fallbacks.
- `src/index.css` – Tailwind tokens/base.

## Theming
- Tokens are defined in `src/index.css` (light + dark) and surfaced through `tailwind.config.ts` (`background`, `foreground`, `card`, `surface`, `brand`, `primary`, etc.).
- `ThemeProvider` from `src/contexts/ThemeContext.tsx` wraps the app in `AppLayout.tsx`; it applies the root `light`/`dark` class and saves the choice to `localStorage`.
- The top navigation includes a Sun/Moon toggle (desktop + mobile) and the layout/components now use token-based classes (`bg-card`, `text-muted-foreground`, `bg-primary`, `bg-surface-muted`) instead of fixed grays/blues.
- To add new theme tokens, declare CSS variables in `index.css`, expose them under `theme.extend.colors` in `tailwind.config.ts`, and reference them with Tailwind classes rather than hex values.

## Deployment
- Static SPA build; deployable to Cloudflare Pages or any static host. Build command: `npm run build`; publish `dist/`.
- When wiring APIs/auth, surface needed env vars with `VITE_` prefixes and document them here.
