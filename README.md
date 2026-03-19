# nick-frontend (Dashboard)

Dashboard UI scaffold for the Nick AI platform: chat, lead gen, trading bot, worker control, customer portal.

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui component set
- TanStack Query (data fetching + caching for dashboard panels)
- Supabase JS client for authentication plus shared profile helpers
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
- `/login` – public authentication page with password sign-in and magic-link email flow.
- `/signup` – public account-creation page that registers a Supabase user and prompts for email confirmation.
- `/reset-password` – public password-recovery page that sends a Supabase reset email.
- `/` and `/dashboard` – `BusinessDashboard` (default view) inside the protected dashboard shell.
- `/trading` – `TradingBot`
- `/leadbot` – `LeadBot`
- `/portal` – `CustomerPortal`
- `/rhnis` – `RHNISIdentity`
- `/businesses` – `BusinessCards`
- `/leads` – `LeadManagement`
- `/workers` – `WorkerControl`
- `/chat` – Nick chat surface (avatar header + `ChatInterface`)
- `/settings` – placeholder settings panel
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
- Optional local dev auth overrides:
  - `VITE_DEV_AUTH_EMAIL` – overrides the local Vite dev fallback email (default `dev@nick.local`).
  - `VITE_DEV_AUTH_PASSWORD` – overrides the local Vite dev fallback password (default `nick-dev-password`).
- `vite.config.ts` loads `dotenv` plus `loadEnv`; runtime code reads from `import.meta.env` via `src/lib/config.ts`. Empty strings are allowed when a service is not configured.

## Authentication
- `src/contexts/AuthContext.tsx` is the source of truth for auth state. `AuthProvider` reads the initial Supabase session, subscribes to `onAuthStateChange()`, stores both `session` and `user` in React state, and exposes them through `useAuth()`.
- `AuthProvider` also schedules `supabase.auth.refreshSession()` one minute before `session.expires_at`, so active users refresh tokens before the current session expires.
- `src/routes/ProtectedRoute.tsx` no longer talks to Supabase directly. It consumes `useAuth()`, renders its `children` when a user exists, shows a loading screen while auth is hydrating, and redirects unauthenticated visitors to `/login`.
- Routing now wraps the entire dashboard shell in a single `ProtectedRoute`, so child routes inherit auth protection without repeating the guard around every page.
- Redirects preserve the originally requested route in router state. After a successful login, users are sent back to that route; otherwise the fallback destination is `/dashboard`.
- `src/pages/Login.tsx` keeps `email` and `password` as controlled inputs, validates them before submit, surfaces inline field errors plus Supabase auth errors, and links directly to account creation plus password reset.
- During local Vite development only, `/login` also exposes a built-in fallback account for UI testing: `dev@nick.local` / `nick-dev-password` unless you override those values with `VITE_DEV_AUTH_EMAIL` and `VITE_DEV_AUTH_PASSWORD`.
- `src/pages/SignUp.tsx` collects `email` and `password`, calls `supabase.auth.signUp({ email, password })`, surfaces weak-password or duplicate-account errors, and tells the user to check their inbox for email confirmation after a successful registration.
- `src/pages/ResetPassword.tsx` collects an email address, calls `supabase.auth.resetPasswordForEmail(email)`, and shows success/failure messaging for password-recovery requests.
- `Sign In` calls `signInWithPassword({ email, password })`. `Send Magic Link` calls `signInWithOtp({ email, options: { emailRedirectTo } })`. AuthContext receives the resulting session update and unlocks protected routes centrally.
- Account creation flow: open `/signup`, submit email plus password, then confirm the account through the email Supabase sends before returning to `/login`.
- Password reset flow: open `/reset-password`, submit the account email, and follow the recovery instructions delivered by Supabase.
- `src/lib/supabaseClient.ts` now exports a lazy client proxy and leaves token refresh ownership to `AuthProvider`, so auth imports stay safe while refresh timing lives in one place.
- If Supabase is not configured locally, passwordless flows remain disabled, but local Vite development can still use the dev-only fallback account on `/login`. Outside local dev mode, protected routes continue redirecting to `/login` until valid auth configuration and a user session exist.

## Project structure
- `src/App.tsx` – app shell with theme, query client, and nested routes per panel.
- `src/pages/Index.tsx` – wraps `AppLayout` with `AppProvider` for layout state.
- `src/pages/Login.tsx` – public authentication page with validated password and magic-link flows.
- `src/pages/SignUp.tsx` – public account-creation page with controlled inputs, Supabase `signUp`, and confirmation messaging.
- `src/pages/ResetPassword.tsx` – public password-reset request page with Supabase email recovery.
- `src/components/AppLayout.tsx` – main dashboard frame, Link-based navigation, and `<Outlet>` for child routes.
- Feature panels: `BusinessDashboard`, `LeadManagement`, `WorkerControl`, `BusinessCards`, `LeadBot`, `TradingBot`, `CustomerPortal`, `RHNISIdentity`, `NickAvatar`, `ChatInterface`.
- `src/contexts/AuthContext.tsx` – shared auth provider that stores the active user/session, listens for Supabase auth changes, and refreshes tokens before expiry.
- `src/hooks/use-auth.ts` – small hook wrapper around `AuthContext` so routes/pages can consume auth state without importing the context object directly.
- `src/routes/ProtectedRoute.tsx` – context-driven guard for protected dashboard routes.
- `src/pages/NotFound.tsx` – accessible 404 with recovery links back to the dashboard or chat.
- `src/contexts/ThemeContext.tsx` – light/dark theme state, root class toggling, and localStorage persistence.
- `src/contexts/AppContext.tsx` – sidebar state for mobile; unused imports removed.
- `src/lib/utils.ts` – `cn` className helper.
- `src/lib/config.ts` – typed access to env vars with safe fallbacks.
- `src/lib/api.ts` – lightweight fetch helpers for the dashboard mock APIs (business stats, leads, workers, cards, LeadBot, TradingBot, customer portal, RHNIS).
- `src/lib/apiClient.ts` – generic `apiRequest<T>` wrapper around `fetch` with descriptive errors.
- `src/lib/types.ts` – shared TypeScript interfaces for all API payloads (stats, leads, workers, trades, customers, identity).
- `src/lib/supabaseClient.ts` – singleton Supabase client plus auth/profile helpers.
- UI states: `src/components/ui/skeleton.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/error-state.tsx` for consistent loading/empty/error rendering.
- `src/index.css` – Tailwind tokens/base.

## API mocks
- Cloudflare Pages Functions (in `nick-site/functions`) expose sample JSON endpoints used by the dashboard: `/businessStats`, `/leadManagement`, `/workers`, `/businessCards`, `/leadBot`, `/tradingBot`, `/customerPortal`, `/rhnisIdentity`.
- Components now use `@tanstack/react-query` + the helpers in `src/lib/api.ts` to fetch those routes, with built-in loading, empty, and error (retry) states.
- Set `VITE_API_BASE` if the workers live on another domain; leave it blank to call them from the same origin during Pages previews.

## UI state helpers
- `Skeleton` – animated placeholder; apply height/width via `className`.
- `EmptyState` – neutral empty-data message with optional icon/action.
- `ErrorState` – standardized error card with optional retry button.
- API client – `apiRequest<T>(url, options?)` wraps `fetch`, applies `VITE_API_BASE`, throws descriptive errors, and parses JSON into `T`. Prefer using the specific helpers in `src/lib/api.ts` which already type responses via `src/lib/types.ts`.
- Example:
```tsx
const { isLoading, isError, data, refetch } = useQuery(...);
if (isLoading) return <Skeleton className="h-24" />;
if (isError) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState action={<Button onClick={refetch}>Retry</Button>} />;
```

## Theming
- Tokens are defined in `src/index.css` (light + dark) and surfaced through `tailwind.config.ts` (`background`, `foreground`, `card`, `surface`, `brand`, `primary`, etc.).
- `ThemeProvider` from `src/contexts/ThemeContext.tsx` wraps the app in `AppLayout.tsx`; it applies the root `light`/`dark` class and saves the choice to `localStorage`.
- The top navigation includes a Sun/Moon toggle (desktop + mobile) and the layout/components now use token-based classes (`bg-card`, `text-muted-foreground`, `bg-primary`, `bg-surface-muted`) instead of fixed grays/blues.
- To add new theme tokens, declare CSS variables in `index.css`, expose them under `theme.extend.colors` in `tailwind.config.ts`, and reference them with Tailwind classes rather than hex values.

## Deployment
- Static SPA build; deployable to Cloudflare Pages or any static host. Build command: `npm run build`; publish `dist/`.
- When wiring APIs/auth, surface needed env vars with `VITE_` prefixes and document them here.

## Supabase client usage
- Import the shared client from `src/lib/supabaseClient.ts`: `import { supabaseClient, getCurrentUser, getUserProfile, updateProfile } from "@/lib/supabaseClient";`
- The client is a singleton so auth state (refresh tokens, realtime sockets) stays consistent across tabs/components instead of being recreated per hook/component.
- `supabaseClient` is now a lazy proxy, so importing the module will not crash immediately when local auth env vars are missing. `getSupabaseClient()` and any proxied client call still throw once you actually try to use Supabase without configuration.
- Token refresh is intentionally driven by `AuthProvider` with explicit `refreshSession()` calls before expiry, so the session lifecycle stays centralized in one context instead of being split across routes.
- `getCurrentUser()` wraps `supabase.auth.getUser()` for quick session checks.
- `getUserProfile(userId)` reads from the `profiles` table (adjust the table name/columns to match your schema).
- `updateProfile(profile)` upserts into `profiles` and returns the saved row; pass at least an `id` along with any columns you want to update.
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set before calling auth/data helpers; the helper throws when Supabase features are actually used to avoid silently misconfigured auth calls.
