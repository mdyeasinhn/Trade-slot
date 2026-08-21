TradeSlot Backend — Agent Instructions

1. Project Context

TradeSlot is a trade booking platform MVP.

The backend supports one working booking flow end-to-end while keeping the architecture ready for future expansion to:

multiple traders under one business

additional messaging channels

dynamic pricing

cancellations and rebooking

priority/manual overrides

referrals and loyalty

Current stack:

Node.js >= 20

Express 5

TypeScript

PostgreSQL

Prisma ORM

Stripe Connect (Checkout Sessions)

WhatsApp Cloud API

Zod (validation)

Vitest + Supertest (testing)

swagger-jsdoc + swagger-ui-express (API docs)

Do not over-engineer the MVP. Build the smallest production-minded implementation that satisfies the current requirements.

2. Core Architecture Rule

There must be one shared booking engine.

Web chatbot and WhatsApp are input channels only.

Correct flow:

Web Chat ───────┐
                ├──> Message Normalizer ──> Conversation/Intent ──> Booking Engine
WhatsApp ───────┘                                                │
                                                                 ├──> Scheduling
                                                                 └──> Payments

Never implement separate booking logic for WhatsApp and Web Chat.

Channel-specific controllers/services should only:

receive or send channel data

normalize inbound messages

call shared application services

format the outbound response for the channel

3. Backend Structure (as implemented)

server/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── sql/
│       └── 001_booking_no_overlap.sql
├── tests/
│   ├── helpers.ts
│   ├── booking-dialogue.test.ts
│   ├── booking-flow.integration.test.ts
│   ├── date.test.ts
│   └── stripe-webhook.test.ts
└── src/
    ├── app.ts
    ├── server.ts
    ├── swagger.ts
    ├── config/
    │   ├── env.ts
    │   └── constants.ts
    │
    ├── modules/
    │   ├── auth/            (controller, service, routes, validation)
    │   ├── users/           (users.controller, user.routes)
    │   ├── businesses/      (business.controller)
    │   ├── traders/         (controller, service, routes, validation)
    │   ├── workAreas/       (controller, service, validation)
    │   ├── messaging/
    │   │   ├── message-normalizer.ts
    │   │   ├── messaging.service.ts
    │   │   └── types.ts
    │   │
    │   ├── chatbot/         (controller, routes, validation)
    │   ├── whatsapp/        (whatsapp.controller, whatsapp.service)
    │   │
    │   ├── bookings/
    │   │   ├── booking.controller.ts
    │   │   ├── booking.service.ts
    │   │   ├── booking.engine.ts        (transport-agnostic dialogue engine)
    │   │   ├── booking.engine.instance.ts (Prisma-backed singleton wiring)
    │   │   ├── scheduling.service.ts
    │   │   ├── booking.routes.ts
    │   │   └── booking.validation.ts
    │   │
    │   ├── payments/
    │   │   ├── payment.controller.ts
    │   │   ├── payment.service.ts
    │   │   ├── stripe.service.ts
    │   │   ├── payment.routes.ts
    │   │   └── payment.validation.ts
    │   │
    │   └── webhooks/
    │       ├── webhook.routes.ts
    │       ├── webhook.controller.ts
    │       └── stripe.webhook.ts
    │
    ├── middleware/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   └── validation.middleware.ts
    │
    ├── lib/
    │   ├── prisma.ts
    │   └── stripe.ts
    │
    ├── utils/
    │   ├── api-response.ts
    │   ├── catch-async.ts
    │   ├── date.ts
    │   ├── errors.ts
    │   ├── params.ts
    │   └── send-response.ts
    │
    └── routes/
        └── index.ts

Use feature/module boundaries rather than one huge controller/service file.

4. Modules

Auth

Trader/user registration and login. Registration creates a User plus a Business and an owning Trader in one transaction and returns a JWT.

Users

Customer/trader identity data (`User`). Deliberately free of trader business configuration; `Trader.userId` is nullable so a business can hold staff traders that do not log in.

Businesses

A business/entity that can own one or more traders in future.

Do not hard-code the database as if the platform can only ever have one trader.

Traders

Trader profile, timezone, working window ("HH:mm" local), per-trader booking rule overrides (jobDurationMin/bufferMin/bookingFee — null falls back to platform config), Stripe Connect account state, and WhatsApp phone number id routing.

Work Areas

Stores the trader's work area for a specific date (`@db.Date`, unique on `(traderId, date)`).

MVP does not require recurring weekly zones.

Messaging

Shared messaging abstraction used by Web Chat and WhatsApp: normalizer, service, types.

Chatbot

Web chatbot transport API only (`POST /api/chat/message`). It calls the shared messaging/application layer and returns a channel-neutral `ChatReply`.

WhatsApp

WhatsApp webhook verification/handling and outbound WhatsApp messages. Inbound messages are routed to a trader via `Trader.whatsappPhoneNumberId`.

Bookings

Core booking creation, slot availability, confirmation, duration and travel buffer rules. The booking engine is transport-agnostic (`booking.engine.ts`); the Prisma-backed singleton lives in `booking.engine.instance.ts` and persists dialogue state on `Conversation.state`.

Payments

Stripe Checkout Session creation with connected-account transfer and application fee, payment state handling, and Stripe Connect onboarding/status endpoints.

Webhooks

Third-party webhook entry points (`webhook.routes.ts`, `webhook.controller.ts`, `stripe.webhook.ts`). Stripe webhook handling uses the raw body for signature verification and is separated from normal API controllers.

5. Database Design Principles

Use Prisma with PostgreSQL. `server/prisma/schema.prisma` is the source of truth — read it before assuming any model shape.

Never assume a single trader in the schema.

Important relationships:

User 1—0..1 Trader
Business
  └── Traders
        ├── WorkAreas
        ├── Conversations
        └── Bookings

Conversation
  └── Messages

Booking
  └── Payment

Key implementation details already in place:

Money is stored as integer minor units (cents), never floats.

All timestamps are UTC. Per-trader `timezone` (IANA) resolves local wall-clock times like "tomorrow at 10am"; `requestedDate` is the calendar day in the trader's timezone.

`Conversation` is unique on `(traderId, channel, senderId)` and holds slot-filling `state` (Json).

`Message.direction` (INBOUND/OUTBOUND) and unique `externalId` drop WhatsApp webhook replays.

`Payment` tracks `stripeCheckoutSessionId`, `stripePaymentIntentId`, `connectedAccountId`, `checkoutUrl`, and a `PaymentStatus` enum.

`WebhookEvent` is an idempotency ledger, unique on `(provider, eventId)`, so Stripe retries and WhatsApp duplicates are no-ops.

Enums: `Role` (TRADER/ADMIN), `Channel` (WHATSAPP/WEB_CHAT), `MessageDirection`, `BookingStatus` (REQUESTED, CONFIRMED, PAYMENT_PENDING, PAID, COMPLETED, CANCELLED), `PaymentStatus`.

Important fields are indexed appropriately, especially traderId, businessId, date, booking status, conversation sender/channel, and Stripe payment/connected account IDs.

6. Messaging Contract

All inbound channels normalize to one interface (see `src/modules/messaging/types.ts`):

export type MessageChannel = 'WHATSAPP' | 'WEB_CHAT';

export interface NormalizedMessage {
  senderId: string;
  channel: MessageChannel;
  content: string;
  timestamp: Date;
}

The core processing function is:

processIncomingMessage(message: NormalizedMessage, options: ProcessInboundOptions)

with `ProcessInboundOptions = { traderId, senderRole?, externalId? }`.

That function must not contain WhatsApp-specific code.

Web Chat and WhatsApp both call this same flow. Replies use the channel-neutral `ChatReply` model (`text` plus optional `actions`: text prompts, `slot_choice`, or `payment_link`) which each channel renders natively.

7. Booking Engine Rules

The booking engine is the most important domain service.

Basic MVP rules:

A trader has a work area for a specific date.

A customer requests a service/date/time.

The system checks availability against the trader's local working window (`workDayStart`–`workDayEnd` in their timezone).

Each job has a fixed duration (per-trader override or platform default).

A fixed travel buffer must exist between jobs.

Live map/routing calculations are out of scope.

The booking cannot overlap another active booking plus its required buffer.

Two customers must not be able to confirm the same slot concurrently.

Example configuration (env defaults):

JOB_DURATION_MINUTES=60
TRAVEL_BUFFER_MINUTES=30
BOOKING_FEE=5000
APPLICATION_FEE=500
CURRENCY=usd

Availability checks must be performed on the backend. Never trust a frontend availability check for final booking creation.

Concurrency strategy (implemented):

Primary mechanism: a per-`(traderId, date)` advisory lock held inside a Prisma transaction during booking creation.

Backstop: a PostgreSQL exclusion constraint (`booking_no_overlap` in `prisma/sql/001_booking_no_overlap.sql`) using `btree_gist` + `tstzrange` refuses overlapping active bookings at the database level. Apply it with `npm run db:constraints`.

8. Booking Flow

Web Chat

Customer message
  -> POST /api/chat/message
  -> normalize
  -> processIncomingMessage
  -> identify booking intent (slot-filling state machine)
  -> check work area
  -> check slots
  -> offer/confirm slot
  -> create booking
  -> create Stripe Checkout session
  -> return payment URL as a payment_link action

WhatsApp

WhatsApp webhook
  -> verify request signature
  -> resolve trader by phone number id
  -> dedupe by message externalId
  -> normalize message
  -> processIncomingMessage
  -> shared booking engine
  -> create Stripe payment
  -> send payment URL via WhatsApp

The same booking service must be used in both flows.

9. Stripe Connect Rules

Stripe is the source of truth for payment state.

Do not mark a booking as PAID merely because a frontend success page was loaded.

Implemented flow:

Booking confirmed
      ↓
Create Stripe Checkout Session (connected account + application fee)
      ↓
Customer pays
      ↓
Stripe webhook
      ↓
Verify webhook signature (raw body)
      ↓
Record event in WebhookEvent ledger (idempotent)
      ↓
Update Payment
      ↓
Update Booking -> PAID

For the connected trader account, use Stripe Connect so that:

trader receives the job payment

platform receives the configured application fee

Do not manually fake the transfer in PostgreSQL.

Store:

connected account ID

Stripe checkout session / payment intent identifiers

application fee amount

payment status

Webhook processing is idempotent via the `WebhookEvent` ledger so Stripe retries do not create duplicate state transitions or records.

10. WhatsApp Rules

WhatsApp is an inbound/outbound transport channel, not the booking engine.

Responsibilities of the WhatsApp layer:

verify webhook requests (signature + verify token handshake)

parse inbound message payloads

dedupe replays via `Message.externalId`

normalize inbound data

resolve the target trader via `whatsappPhoneNumberId`

call the shared messaging/booking flow

send responses back to the user's WhatsApp number

Do not put slot calculation, payment business rules, or booking persistence directly in whatsapp.controller.ts.

11. Web Chat Rules

The MVP web chatbot does not require Socket.IO.

Use normal HTTP request/response unless real-time functionality is explicitly required.

Flow:

POST /api/chat/message

Request:

{
  "traderId": "...",
  "senderId": "web-session-123",
  "message": "I want a booking tomorrow at 10am"
}

The API returns a channel-neutral `ChatReply` that the frontend can render.

Do not introduce WebSockets just for chat unless a concrete requirement exists for live updates, typing indicators, or streaming responses.

12. API Endpoints (as implemented)

POST   /api/auth/register
POST   /api/auth/login

GET    /api/users/me
GET    /api/businesses/:id

GET    /api/traders/:id
PATCH  /api/traders/:id

POST   /api/traders/:id/work-area
GET    /api/traders/:id/work-area?date=YYYY-MM-DD

POST   /api/chat/message

GET    /api/bookings/availability?traderId=...&date=YYYY-MM-DD   (public)
POST   /api/bookings                                             (auth)
GET    /api/bookings?date=YYYY-MM-DD                             (auth)
GET    /api/bookings/:id                                         (auth)
PATCH  /api/bookings/:id/status                                  (auth)

POST   /api/payments/create                                      (auth)
POST   /api/stripe/connect/onboard                               (auth)
GET    /api/stripe/connect/status                                (auth)

GET    /api/webhooks/whatsapp                                    (verification)
POST   /api/webhooks/whatsapp
POST   /api/webhooks/stripe                                      (raw body + signature)

GET    /api/health

Interactive OpenAPI docs are served at `/api-docs` (spec at `/api-docs.json`). Every endpoint is documented with `@openapi` JSDoc blocks next to its route definition — keep these up to date when changing endpoints.

Keep route names predictable and REST-like.

13. Validation

Every external request must be validated before reaching business logic.

Validation uses Zod (`zod`), with per-module `*.validation.ts` schemas applied through `validation.middleware.ts`.

Validate:

IDs

dates/times ("YYYY-MM-DD", "HH:mm")

channel values

booking duration

monetary amounts

required customer information

Stripe webhook payloads/signatures

Never trust arbitrary amounts supplied by the frontend. Booking fees are resolved server-side from per-trader overrides or backend configuration.

14. Error Handling

Use consistent API envelopes.

Success:

{ "success": true, "message": "optional", "data": { ... } }

Error:

{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested slot is no longer available."
  }
}

Do not leak:

Stripe secret keys

database connection strings

stack traces in production responses

internal implementation details

15. Environment Variables

Environment configuration is validated with Zod at startup (`src/config/env.ts`) — the process fails fast with a readable list of issues. See `server/.env.example`.

NODE_ENV=development|test|production
PORT=4000

CORS_ORIGINS=http://localhost:3000     (comma-separated)
API_BASE_URL=http://localhost:4000
CLIENT_BASE_URL=http://localhost:3000

DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=usd

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v21.0

JOB_DURATION_MINUTES=60
TRAVEL_BUFFER_MINUTES=30
BOOKING_FEE=5000
APPLICATION_FEE=500

WORK_DAY_START=09:00
WORK_DAY_END=17:00
DEFAULT_TIMEZONE=UTC

Never commit real secrets.

Commit `.env.example`, not `.env`.

16. Commands

Run from `server/`:

npm run dev              # tsx watch src/server.ts
npm run build            # tsc -> dist/
npm start                # node dist/server.js
npm run typecheck        # tsc --noEmit

npm run prisma:generate  # prisma generate
npm run prisma:migrate   # prisma migrate dev
npm run prisma:deploy    # prisma migrate deploy
npm run db:constraints   # apply booking_no_overlap exclusion constraint
npm run db:seed          # seed dev data

npm test                 # vitest run
npm run test:watch       # vitest

After changing `schema.prisma`: run `prisma:migrate`, then `db:constraints` (the exclusion constraint lives outside Prisma migrations).

17. Testing Priorities

Tests use Vitest (+ Supertest). Integration suites live in `server/tests/` and skip automatically (via `describeDb` in `helpers.ts`) when no PostgreSQL server is reachable.

Most important tests are integration tests around the real booking flow:

Trader creates/updates a daily work area.

Customer requests an available slot.

Unavailable slot is rejected.

Travel buffer is respected.

Concurrent booking requests cannot double-book the same slot.

Web Chat input reaches the shared booking engine.

WhatsApp input reaches the shared booking engine.

Stripe payment object is created with the correct connected account and application fee.

Stripe webhook changes payment/booking status correctly.

Replayed Stripe webhook is idempotent.

Payment link is returned to Web Chat.

Payment link is sent through WhatsApp.

Existing suites: `booking-dialogue.test.ts`, `booking-flow.integration.test.ts`, `date.test.ts`, `stripe-webhook.test.ts`.

Do not consider the MVP complete until the booking and payment path works end-to-end.

18. Coding Rules for Agents

When modifying the backend:

Inspect the existing code before creating new modules.

Reuse existing utilities and patterns when reasonable.

Do not create duplicate services/controllers/models for existing functionality.

Keep domain logic out of transport controllers.

Keep Stripe and WhatsApp integrations isolated behind services.

Prefer small, testable functions.

Avoid unnecessary abstractions for one-off MVP behavior.

Do not introduce Socket.IO unless explicitly needed.

Do not add maps/routing APIs for the MVP.

Do not add dynamic pricing.

Do not add recurring work areas.

Do not build separate WhatsApp and Web booking engines.

When uncertain, prefer the simplest design that preserves future extensibility.

19. Definition of Done

Backend is considered MVP-ready only when this works:

Trader logs in
  -> sets work area for a day
  -> connects Stripe
  -> customer starts booking through Web Chat OR WhatsApp
  -> message is normalized
  -> shared booking engine finds/validates a slot
  -> booking is created
  -> Stripe payment link/session is created
  -> customer pays
  -> Stripe webhook is verified
  -> booking becomes PAID
  -> trader receives the connected-account payment
  -> platform application fee is captured

Any implementation that only mocks WhatsApp, fakes Stripe payment success, or bypasses webhook verification is not considered complete.

20. AI Usage

AI tools are allowed for development, but generated code must be reviewed and tested by the developer.

When using AI, track meaningful usage such as:

boilerplate generation

code review

debugging

test generation

schema suggestions

integration guidance

Do not claim AI was used for work that was not actually AI-assisted.
