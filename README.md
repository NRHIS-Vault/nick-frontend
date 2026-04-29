# nick-frontend

Authenticated operator dashboard for the Nick platform.

## Responsibilities

- Supabase auth bootstrap and protected routing
- Subscription gating through the paywall
- Dashboard panels for chat, leads, trading, customer portal analytics, RHNIS identity, and NCS workers
- Settings flow for encrypted exchange-key storage

## Routes

- `/login`
- `/signup`
- `/reset-password`
- `/dashboard`
- `/trading`
- `/leadbot`
- `/portal`
- `/rhnis`
- `/businesses`
- `/leads`
- `/workers`
- `/chat`
- `/settings`

## Environment

Required for real auth and worker-backed API calls:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE`
- `VITE_SITE_URL`

Optional:

- `VITE_DEV_AUTH_EMAIL`
- `VITE_DEV_AUTH_PASSWORD`
- `VITE_E2E_MOCKS`

See [`.env.example`](/Users/josias/Documents/Projects/nick-git/nick-frontend/.env.example).

## Auth and Billing Flow

- `AuthProvider` restores the current session, subscribes to `onAuthStateChange`, and loads the signed-in user's `public.profiles` row.
- `ProtectedRoute` redirects unauthenticated users to `/login`.
- Signed-in users without `subscription_status === "active"` are routed to the paywall.
- The paywall loads plans from `/customerPortal/plans`, starts Stripe checkout with `/billing/checkout-session`, and confirms the completed session with `/billing/checkout-confirm`.
- After confirmation, the app reloads so `AuthContext` rehydrates the updated `public.profiles.role` and `subscription_status`.
- `/reset-password` now handles both the reset-email request and the in-app recovery completion step after Supabase returns the user with a recovery session.
- The local fallback account is useful for UI work, but worker routes that require a real Supabase bearer token still reject it.

## Key Panels

- `BusinessDashboard`: summary cards, recent leads, and worker overview
- `LeadBot`: campaign data plus live lead stream updates
- `TradingBot`: initial snapshot plus streaming exchange events and role-gated mutations
- `CustomerPortal`: plan catalog and recurring revenue analytics
- `RHNISIdentity`: authenticated identity read model
- `WorkerControl`: queue-backed NCS pause/resume controls
- `ChatInterface`: streamed SSE chat backed by `/chat` and `/chat-history`
- `SettingsPanel`: encrypted exchange-key capture backed by `/trading/save-keys`

## Local Development

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:8080`

For full worker integration, point `VITE_API_BASE` at a deployed or local Pages Functions host.

## Testing

Run all dashboard tests:

```bash
npm test
```

Useful focused suites:

```bash
npm test -- src/hooks/useChat.test.tsx
npm test -- src/components/LeadBot.test.tsx
npm test -- src/components/TradingBot.test.tsx
npm test -- src/components/WorkerControl.test.tsx
npm test -- src/components/CustomerPortal.test.tsx
npm test -- src/components/RHNISIdentity.test.tsx
```

Build verification:

```bash
npm run build
```

## Deployment

- Build a static SPA with `npm run build`
- Publish the generated `dist/` folder to your frontend hosting target
- GitHub Actions deployment for this repo lives in [`.github/workflows/deploy.yml`](/Users/josias/Documents/Projects/nick-git/nick-frontend/.github/workflows/deploy.yml)
- Point `VITE_API_BASE` at the deployed `nick-site` Pages Functions origin when the frontend and backend are hosted separately
- Set `VITE_SITE_URL=https://dashboard.nick-ai.link` for production auth callbacks and password recovery links

## Backend Dependencies

The dashboard depends on the worker routes documented in [nick-site/README.md](/Users/josias/Documents/Projects/nick-git/nick-site/README.md), especially:

- billing and customer portal routes
- chat and chat-history
- RHNIS identity
- lead intake and lead stream
- trading routes
- NCS status, pause, and resume
