# TradeSlot Frontend — Agent Instructions

> Companion to the backend `AGENTS.md`. This document governs the **web frontend** only.
> Place this file at the frontend project root (e.g. `web/AGENTS.md`).

---

## 1. Project Context

TradeSlot is a trade booking platform MVP. This repository is the **web frontend** that
consumes the TradeSlot backend HTTP API.

The frontend supports one working booking flow end-to-end for two audiences:

- **Customer** — a public booking chat that walks a customer through requesting a slot and
  paying via Stripe Checkout.
- **Trader** — an authenticated dashboard to log in, set a daily work area, connect Stripe,
  and view/manage bookings.

It keeps the architecture ready for future expansion (multiple traders per business,
additional channels, dynamic pricing, cancellations/rebooking, referrals/loyalty) but does
**not** implement those now.

Do not over-engineer the MVP. Build the smallest production-minded implementation that
satisfies the current requirements.

### Current stack

- Node.js >= 20
- Next.js (App Router) + React
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui (Radix + Tailwind components)
- React Server Components + native `fetch` for reads; **Server Actions** for mutations
- httpOnly-cookie session (JWT issued by the backend)
- `zod` + `react-hook-form` for form validation
- ESLint + Prettier
- Vitest + Testing Library / Playwright for tests

---

## 2. Core Architecture Rule

**The backend owns all domain logic. The frontend is a thin client.**

```
                 ┌──────────────────────────────────────────┐
Customer  ─────► │  Next.js frontend (render + collect input) │ ─────► TradeSlot Backend API
Trader    ─────► │  Server Components · Server Actions · UI    │ ◄───── (source of truth)
                 └──────────────────────────────────────────┘
```

Rules that must never be broken:

- **Never replicate booking, availability, pricing, or payment logic on the client.** Slot
  math, travel buffers, fees, and booking validity are computed and enforced by the backend.
- **Never trust a client-side availability check for a final booking.** The frontend may
  *display* availability, but the backend re-validates on `POST /api/bookings`.
- **Never compute money.** Amounts arrive as integer minor units (cents) from the backend.
  The frontend only formats them for display; it never adds, discounts, or derives prices.
- **Never mark a booking as paid because a success page loaded.** Payment state comes from
  the backend, which is updated by the Stripe webhook.

The frontend's job is: render backend-provided state, collect validated user input, call the
backend, and render the response. That's it.

---

## 3. Frontend Structure

Use the App Router with route groups to separate public, auth, and dashboard surfaces.
Prefer feature-oriented folders over one giant `components` dump.

```
web/
├── app/
│   ├── layout.tsx                  # root layout (fonts, providers, <body>)
│   ├── globals.css                 # Tailwind base + design tokens
│   ├── page.tsx                    # landing / entry
│   │
│   ├── (public)/                   # no auth required
│   │   └── book/
│   │       └── [traderId]/
│   │           └── page.tsx        # customer booking chat entry
│   │
│   ├── (auth)/                     # login / register (redirects if already authed)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/                # trader-only, guarded by middleware
│   │   ├── layout.tsx              # authed shell (nav, sign-out)
│   │   ├── dashboard/page.tsx      # overview
│   │   ├── work-area/page.tsx      # set/view daily work area
│   │   ├── bookings/
│   │   │   ├── page.tsx            # list (by date)
│   │   │   └── [id]/page.tsx       # detail + status change
│   │   └── settings/
│   │       └── stripe/page.tsx     # Stripe Connect onboard/status
│   │
│   ├── booking/
│   │   ├── success/page.tsx        # Stripe return: reads booking status from backend
│   │   └── cancel/page.tsx         # Stripe cancel return
│   │
│   └── api/                        # Next route handlers (frontend-only, thin)
│       └── auth/
│           ├── login/route.ts      # forwards to backend, sets httpOnly cookie
│           └── logout/route.ts     # clears cookie
│
├── components/
│   ├── ui/                         # shadcn-generated primitives (do not hand-edit lightly)
│   ├── chat/                       # ChatWindow, MessageList, ChatReply renderers
│   ├── bookings/                   # booking tables, cards, status badges
│   ├── work-area/                  # work-area form
│   └── layout/                     # nav, shell, headers
│
├── lib/
│   ├── api/
│   │   ├── client.ts               # server-side fetch wrapper (attaches JWT from cookie)
│   │   ├── endpoints.ts            # typed functions, one per backend endpoint
│   │   └── types.ts                # shared DTO / response-envelope types
│   ├── actions/                    # "use server" mutations (grouped by feature)
│   ├── auth.ts                     # session/cookie helpers (getSession, requireTrader)
│   ├── format.ts                   # money (cents→string), date, time, timezone display
│   └── utils.ts                    # cn() and small helpers
│
├── hooks/                          # client hooks (chat state, etc.)
├── middleware.ts                   # guards (dashboard) routes via the session cookie
├── components.json                 # shadcn config
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── .env.example                    # committed; never commit .env.local
└── AGENTS.md
```

Keep transport thin: route handlers and Server Actions should call `lib/api` and translate
results into UI, not embed booking rules.

---

## 4. Data Layer (RSC + native fetch)

There is **no client-side data-fetching library** in the MVP (no TanStack Query, no SWR).
Follow these three patterns and nothing else:

1. **Reads that need auth → React Server Components.** Fetch on the server via `lib/api`
   inside `async` Server Components. The JWT is read from the httpOnly cookie server-side and
   never reaches the browser.
2. **Mutations → Server Actions.** Define `"use server"` functions in `lib/actions/`. After a
   successful mutation, call `revalidatePath()` / `revalidateTag()` so Server Components
   re-render with fresh data. Return a typed result the client component can render.
3. **Public reads (availability, chat) → either.** Prefer a Server Action or route handler so
   there is a single API wrapper, but a public page may call the public endpoints directly
   from the client using `NEXT_PUBLIC_API_BASE_URL`. Public endpoints require no cookie.

### The API wrapper

`lib/api/client.ts` centralizes fetching:

- Reads `API_BASE_URL` (server-only) as the target.
- On the server, reads the session cookie via `next/headers` `cookies()` and attaches
  `Authorization: Bearer <jwt>` for authed calls.
- Parses the backend envelope (see §12) and throws a typed `ApiError` on `success: false`,
  carrying the backend `error.code` and `error.message`.
- Sets Next.js caching intent explicitly, e.g. `cache: "no-store"` for booking/availability
  data (it changes constantly) and tags for anything worth revalidating.

`lib/api/endpoints.ts` exposes one typed function per backend endpoint (see §11) so callers
never hand-build URLs or bodies.

Do **not** call `fetch` to the backend directly from components. Always go through `lib/api`.

---

## 5. Auth (httpOnly cookie)

The backend issues a JWT from `POST /api/auth/register` and `POST /api/auth/login`. The
frontend stores it in an **httpOnly, Secure, SameSite=Lax cookie** so client JS can't read it.

Flow:

```
Login form (client)
  -> POST /api/auth/login  (Next route handler, same-origin)
       -> calls backend POST /api/auth/login via lib/api
       -> on success, sets httpOnly cookie with the JWT
       -> returns { success } to the client (never the raw token)
  -> client redirects to /dashboard
```

Rules:

- The JWT lives **only** in the httpOnly cookie. Never put it in `localStorage`,
  `sessionStorage`, a `NEXT_PUBLIC_*` var, or any client-readable place.
- `middleware.ts` guards the `(dashboard)` route group: no valid session cookie → redirect to
  `/login`. It performs a cheap presence/shape check only; the backend is the real authority
  and rejects invalid/expired tokens on each API call.
- Server Components and Server Actions read the cookie via `next/headers` and pass the token
  to `lib/api`. Handle a backend `401` by clearing the cookie and redirecting to `/login`.
- Logout (`/api/auth/logout`) clears the cookie; there is no server-side session store in the
  MVP.
- The customer booking chat is **public** — it must work with no session.

---

## 6. Messaging / Chat Contract

The web chat is an **input channel only**, exactly like WhatsApp on the backend. It never
runs booking logic. It sends the user's text to the backend and renders the backend's reply.

Request to the backend (`POST /api/chat/message`):

```json
{
  "traderId": "...",
  "senderId": "web-session-123",
  "message": "I want a booking tomorrow at 10am"
}
```

- `senderId` is a stable per-browser session id (generate once per visit; e.g. a random id
  kept in React state / a non-httpOnly cookie is fine — it is **not** a secret).
- The response is the channel-neutral **`ChatReply`**: `text` plus optional `actions`.

The frontend must render each action type natively and send the user's choice back as the
next message (or the action's payload):

| Action type    | Render as                                   | On interaction                                  |
|----------------|---------------------------------------------|-------------------------------------------------|
| text prompt    | assistant message bubble / quick-reply chips| send the chosen/typed text as the next message  |
| `slot_choice`  | selectable list/buttons of offered slots    | send the selected slot back to the backend      |
| `payment_link` | a prominent "Pay now" button/link           | open the Stripe Checkout URL (see §8)           |

Mirror the backend's model: keep chat state on the backend (`Conversation.state`). The client
holds only the transcript for display and the `senderId`. Do **not** build a client-side
slot-filling state machine — the backend owns the dialogue.

---

## 7. Booking & Availability (display only)

- Availability comes from `GET /api/bookings/availability?traderId=...&date=YYYY-MM-DD`
  (public). Render the returned slots; do not compute them.
- Dates are `YYYY-MM-DD`; times are `HH:mm`, both interpreted in the **trader's timezone**.
  Display times in that timezone and label it. Never assume the browser's local zone equals
  the trader's.
- Final booking creation is the backend's decision. If `POST /api/bookings` (or the chat
  flow) returns `SLOT_UNAVAILABLE` or similar, surface the backend message and refresh
  availability — never override or retry silently against stale client data.

---

## 8. Payments (Stripe)

Stripe is the source of truth for payment state. The frontend only redirects and reflects.

```
Backend returns a Checkout URL  (payment_link action, or POST /api/payments/create)
      ↓
Frontend redirects the browser to the Stripe Checkout URL
      ↓
Customer pays on Stripe
      ↓
Stripe redirects back to the frontend success/cancel return page
      ↓
Success page READS booking/payment status from the backend (updated by webhook)
```

Rules:

- **Do not** mark anything paid client-side. The `booking/success` page must fetch the
  current booking status from the backend and show "paid" only if the backend says so. If the
  webhook hasn't landed yet, show a "confirming payment…" state and re-check.
- The Checkout `success_url` / `cancel_url` are configured by the **backend** (from its
  `CLIENT_BASE_URL`). The frontend must provide matching return routes
  (`/booking/success`, `/booking/cancel`) — coordinate the exact paths with the backend.
- Never create Stripe sessions, handle webhooks, or touch application-fee logic in the
  frontend. That is entirely backend/`stripe.service` territory.

Trader-side Stripe Connect:

- `POST /api/stripe/connect/onboard` returns an onboarding URL → redirect the trader to it.
- `GET /api/stripe/connect/status` drives the dashboard "Stripe: connected / action needed"
  state. Gate the ability to accept bookings on this status where the backend requires it.

---

## 9. shadcn/ui + Tailwind Rules

- Install primitives via the CLI: `npx shadcn@latest add button dialog input ...`. Generated
  files land in `components/ui/`. Treat them as owned source you may adapt, but keep changes
  minimal and intentional so future `add`s don't fight you.
- Compose feature components from `ui/` primitives; don't reach for raw HTML controls when a
  shadcn equivalent exists (accessibility + consistency come for free).
- Use `cn()` (from `lib/utils.ts`) to merge conditional classes; never build className strings
  with template-literal concatenation that defeats Tailwind's class detection.
- Centralize design tokens (colors, radius, spacing) in `globals.css` / `tailwind.config.ts`
  via CSS variables. Do not hardcode hex colors in components — use the theme tokens so light
  is the default and theming stays possible.
- Prefer Tailwind utilities over ad-hoc CSS files. Avoid arbitrary values (`w-[473px]`) unless
  there is a real reason; lean on the spacing/type scale.
- Every interactive element must be keyboard-accessible and labeled. Respect focus states and
  `prefers-reduced-motion`. Aim for a distinctive, intentional look — not the default template
  gradient-on-card aesthetic.

---

## 10. Validation

Validate every form before it leaves the client, and treat the backend as the final judge.

- Use `zod` schemas with `react-hook-form` (`@hookform/resolvers/zod`). Keep schemas in the
  feature folder next to the form.
- Mirror the backend's formats exactly: dates `YYYY-MM-DD`, times `HH:mm`, IDs, channel
  values, required customer fields. This gives fast UX feedback but is **not** authoritative.
- Never trust client validation for correctness of booking/pricing. The backend re-validates
  everything; render its errors when it rejects input.
- Never send arbitrary monetary amounts. Fees are resolved server-side; the frontend never
  supplies or overrides them.

---

## 11. Backend Endpoints the Frontend Uses

Wrap each of these in `lib/api/endpoints.ts` with typed inputs/outputs. Base URL comes from
env (§14). The frontend does **not** call webhook endpoints.

```
POST   /api/auth/register                                        (sets cookie after)
POST   /api/auth/login                                           (sets cookie after)

GET    /api/users/me                                             (auth)
GET    /api/businesses/:id                                       (auth)

GET    /api/traders/:id                                          (auth)
PATCH  /api/traders/:id                                          (auth)

POST   /api/traders/:id/work-area                                (auth)
GET    /api/traders/:id/work-area?date=YYYY-MM-DD                (auth)

POST   /api/chat/message                                         (public)

GET    /api/bookings/availability?traderId=...&date=YYYY-MM-DD   (public)
POST   /api/bookings                                             (auth)
GET    /api/bookings?date=YYYY-MM-DD                             (auth)
GET    /api/bookings/:id                                         (auth)
PATCH  /api/bookings/:id/status                                  (auth)

POST   /api/payments/create                                      (auth)
POST   /api/stripe/connect/onboard                               (auth)
GET    /api/stripe/connect/status                                (auth)

GET    /api/health                                               (diagnostics)
```

The backend serves interactive OpenAPI docs at `/api-docs` (spec at `/api-docs.json`). Use it
as the contract source of truth; keep `lib/api/types.ts` aligned with it.

---

## 12. Error Handling

The backend uses consistent envelopes. Parse them once in `lib/api/client.ts`.

Success:

```json
{ "success": true, "message": "optional", "data": { } }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested slot is no longer available."
  }
}
```

- On `success: false`, throw a typed `ApiError { code, message, status }`.
- Map known `code`s to friendly, user-facing copy where useful (e.g. `SLOT_UNAVAILABLE`
  prompts a refresh of availability). Fall back to `error.message`.
- Show errors with a shadcn toast/`Alert`; never dump raw JSON or stack traces to users.
- Handle `401` by clearing the session and redirecting to `/login`.
- Never leak secrets, tokens, internal URLs, or the raw backend response to the UI or console
  in production builds.

---

## 13. Environment Variables

Validate env at startup (a small `zod` schema in `lib/env.ts`) and fail fast. Commit
`.env.example`, never `.env.local`.

```
# Server-only (never exposed to the browser)
API_BASE_URL=http://localhost:4000        # backend base URL used by RSC/Server Actions
AUTH_COOKIE_NAME=tradeslot_session
NODE_ENV=development|test|production

# Browser-visible (only non-secret values here)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000   # for public client-side calls only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Rules:

- Anything under `NEXT_PUBLIC_*` is shipped to the browser — put **only** non-secret values
  there. The JWT, cookie internals, and any Stripe secret never appear here.
- The frontend holds **no** Stripe secret keys and no database URL. It never talks to Stripe's
  API directly — only follows Checkout/onboarding URLs the backend hands it.

---

## 14. Commands (run via CLI)

Run everything from the frontend project root. This project is driven from the command line.

```bash
# One-time scaffold (if starting fresh)
npx create-next-app@latest web --typescript --tailwind --eslint --app
npx shadcn@latest init

# Add UI primitives as needed
npx shadcn@latest add button input dialog card table badge sonner

# Day-to-day
npm run dev          # next dev (http://localhost:3000)
npm run build        # next build
npm start            # next start (serves the production build)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest run
```

Use **npm** to stay consistent with the backend. Keep scripts in `package.json` named as
above so agents and CI can rely on them.

---

## 15. Coding Rules for Agents

When modifying the frontend:

- Inspect existing code, `lib/api`, and `components/ui` before adding new modules.
- Reuse existing wrappers, formatters, and shadcn primitives; do not duplicate them.
- Keep domain logic out of components. Availability, pricing, slot rules, and payment state
  belong to the backend — call it, don't reimplement it.
- Keep the API surface behind `lib/api`; components never `fetch` the backend directly.
- Never store the JWT anywhere client-readable. Authed reads happen server-side.
- Format money from integer cents; never do arithmetic on prices.
- Do not add a client data-fetching library (TanStack Query / SWR) unless a concrete need
  arises — RSC + Server Actions is the MVP standard.
- Do not add WebSockets/real-time for chat; plain request/response is sufficient (matches the
  backend Web Chat rule).
- Do not build a client-side booking or slot-filling engine — the backend owns the dialogue.
- Do not add maps/routing, dynamic pricing, recurring work areas, or cancellation flows for
  the MVP.
- Prefer small, testable components and typed helpers. When uncertain, choose the simplest
  design that preserves future extensibility.

---

## 16. Definition of Done

The frontend is MVP-ready only when this works end-to-end against the real backend:

```
Trader registers/logs in (JWT stored in httpOnly cookie)
  -> sets a work area for a day from the dashboard
  -> connects Stripe via the onboarding redirect; status shows connected
  -> customer opens the public booking chat for that trader
  -> customer messages are sent to POST /api/chat/message and ChatReply is rendered
  -> offered slots (slot_choice) are selectable; selection goes back to the backend
  -> backend creates the booking and returns a payment_link
  -> customer is redirected to Stripe Checkout and pays
  -> Stripe returns the customer to the frontend success page
  -> the success page reads booking status from the backend (updated by the webhook)
  -> the trader sees the booking as PAID in the dashboard
```

Any implementation that fakes availability, hardcodes prices, marks bookings paid on the
client, stores the JWT in client-readable storage, or embeds booking logic in the UI is **not**
considered complete.

---

## 17. AI Usage

AI tools are allowed for development, but generated code must be reviewed and tested by the
developer. Track meaningful usage (boilerplate, component generation, code review, debugging,
test generation, integration guidance). Do not claim AI was used for work that was not
actually AI-assisted.