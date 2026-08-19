TradeSlot Backend — Agent Instructions

1. Project Context

TradeSlot is a trade booking platform MVP.

The backend must support one working booking flow end-to-end while keeping the architecture ready for future expansion to:

multiple traders under one business

additional messaging channels

dynamic pricing

cancellations and rebooking

priority/manual overrides

referrals and loyalty

Current stack:

Node.js

Express.js

TypeScript

PostgreSQL

Prisma ORM

Stripe Connect

WhatsApp Cloud API

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

3. Recommended Backend Structure

src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   └── constants.ts
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── businesses/
│   ├── traders/
│   ├── workAreas/
│   ├── messaging/
│   │   ├── messaging.controller.ts
│   │   ├── messaging.service.ts
│   │   ├── message-normalizer.ts
│   │   └── types.ts
│   │
│   ├── chatbot/
│   ├── whatsapp/
│   │   ├── whatsapp.controller.ts
│   │   ├── whatsapp.service.ts
│   │   └── whatsapp.types.ts
│   │
│   ├── bookings/
│   │   ├── booking.controller.ts
│   │   ├── booking.service.ts
│   │   ├── booking.engine.ts
│   │   ├── scheduling.service.ts
│   │   └── booking.types.ts
│   │
│   ├── payments/
│   │   ├── payment.controller.ts
│   │   ├── payment.service.ts
│   │   └── stripe.service.ts
│   │
│   └── webhooks/
│       ├── stripe.webhook.ts
│       └── whatsapp.webhook.ts
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
│   ├── date.ts
│   ├── api-response.ts
│   └── errors.ts
│
└── routes/
    └── index.ts

Use feature/module boundaries rather than one huge controller/service file.

4. Initial MVP Modules

At minimum, implement these backend modules:

Auth

Responsible for trader/user authentication.

Users

Customer/trader identity data. Keep user data separate from trader-specific business configuration.

Businesses

A business/entity that can own one or more traders in future.

Do not hard-code the database as if the platform can only ever have one trader.

Traders

Trader profile and Stripe Connect account information.

Work Areas

Stores the trader's work area for a specific date.

MVP does not require recurring weekly zones.

Messaging

Shared messaging abstraction used by Web Chat and WhatsApp.

Chatbot

Web chatbot transport/UI-facing API only. It must call the shared messaging/application layer.

WhatsApp

WhatsApp webhook handling and outbound WhatsApp messages.

Bookings

Core booking creation, slot availability, confirmation, duration and travel buffer rules.

Payments

Stripe Connect payment creation, application fee, connected-account transfer and payment state handling.

Webhooks

Third-party webhook entry points. Stripe webhook handling must be separated from normal API controllers.

5. Database Design Principles

Use Prisma with PostgreSQL.

Never assume a single trader in the schema.

Important relationships:

Business
  └── Traders
        ├── WorkAreas
        ├── Conversations
        └── Bookings

Conversation
  └── Messages

Booking
  └── Payment

Important fields should be indexed appropriately, especially:

traderId

businessId

date

booking status

conversation sender/channel

Stripe payment/connected account IDs

For a trader's daily work area, enforce uniqueness on:

(traderId, date)

Store monetary values as integer minor units (for example cents), not floating point numbers.

Store timestamps in UTC.

6. Suggested Prisma Models

Use these as the starting point, then adapt them to the existing project conventions.

model Business {
  id        String   @id @default(cuid())
  name      String
  traders   Trader[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Trader {
  id                    String   @id @default(cuid())
  businessId            String
  business              Business @relation(fields: [businessId], references: [id])
  name                  String
  email                 String   @unique
  stripeAccountId       String?
  stripeOnboardingDone  Boolean  @default(false)
  workAreas             WorkArea[]
  conversations         Conversation[]
  bookings              Booking[]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([businessId])
}

model WorkArea {
  id        String   @id @default(cuid())
  traderId  String
  trader    Trader   @relation(fields: [traderId], references: [id])
  date      DateTime
  area      String
  createdAt DateTime @default(now())

  @@unique([traderId, date])
  @@index([date])
}

model Conversation {
  id        String   @id @default(cuid())
  traderId  String
  trader    Trader   @relation(fields: [traderId], references: [id])
  channel   Channel
  senderId  String
  messages  Message[]
  bookings  Booking[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([traderId])
  @@index([channel, senderId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  content        String
  channel        Channel
  timestamp      DateTime
  createdAt      DateTime     @default(now())

  @@index([conversationId, timestamp])
}

model Booking {
  id             String        @id @default(cuid())
  traderId       String
  trader         Trader         @relation(fields: [traderId], references: [id])
  conversationId String?
  conversation   Conversation?  @relation(fields: [conversationId], references: [id])
  customerName   String
  customerPhone  String
  requestedDate  DateTime
  startTime      DateTime
  endTime        DateTime
  jobDurationMin Int
  bufferMin      Int
  bookingFee     Int
  status         BookingStatus
  payment        Payment?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([traderId, requestedDate])
  @@index([traderId, startTime, endTime])
}

model Payment {
  id                    String   @id @default(cuid())
  bookingId             String   @unique
  booking               Booking  @relation(fields: [bookingId], references: [id])
  stripePaymentIntentId String   @unique
  amount                Int
  applicationFee        Int
  status                String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum Channel {
  WHATSAPP
  WEB_CHAT
}

enum BookingStatus {
  REQUESTED
  CONFIRMED
  PAYMENT_PENDING
  PAID
  COMPLETED
  CANCELLED
}

Do not blindly copy this schema if the existing backend already has equivalent models. Extend the current design instead of creating duplicates.

7. Messaging Contract

All inbound channels must normalize to one interface.

export type MessageChannel = 'WHATSAPP' | 'WEB_CHAT';

export interface NormalizedMessage {
  senderId: string;
  channel: MessageChannel;
  content: string;
  timestamp: Date;
}

The core processing function should look conceptually like:

processIncomingMessage(message: NormalizedMessage)

That function must not contain WhatsApp-specific code.

Web Chat and WhatsApp should both eventually call this same flow.

8. Booking Engine Rules

The booking engine is the most important domain service.

Basic MVP rules:

A trader has a work area for a specific date.

A customer requests a service/date/time.

The system checks availability.

Each job has a fixed duration.

A fixed travel buffer must exist between jobs.

Live map/routing calculations are out of scope.

The booking cannot overlap another booking plus its required buffer.

Two customers must not be able to confirm the same slot concurrently.

Example configuration:

JOB_DURATION_MINUTES=60
TRAVEL_BUFFER_MINUTES=30
BOOKING_FEE=5000
APPLICATION_FEE=500
CURRENCY=usd

Availability checks must be performed on the backend. Never trust a frontend availability check for final booking creation.

Use a database transaction and/or appropriate constraints/locking strategy to avoid double booking under concurrency.

9. Booking Flow

Web Chat

Customer message
  -> normalize
  -> processIncomingMessage
  -> identify booking intent
  -> check work area
  -> check slots
  -> offer/confirm slot
  -> create booking
  -> create Stripe payment
  -> return payment URL

WhatsApp

WhatsApp webhook
  -> verify request
  -> normalize message
  -> processIncomingMessage
  -> shared booking engine
  -> create Stripe payment
  -> send payment URL via WhatsApp

The same booking service must be used in both flows.

10. Stripe Connect Rules

Stripe is the source of truth for payment state.

Do not mark a booking as PAID merely because a frontend success page was loaded.

Recommended flow:

Booking confirmed
      ↓
Create Stripe PaymentIntent / Checkout Session
      ↓
Customer pays
      ↓
Stripe webhook
      ↓
Verify webhook signature
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

Stripe payment/checkout identifier

application fee amount

payment status

Use idempotent webhook processing so Stripe retries do not create duplicate state transitions or records.

11. WhatsApp Rules

WhatsApp is an inbound/outbound transport channel, not the booking engine.

Responsibilities of the WhatsApp layer:

verify webhook requests

parse inbound message payloads

normalize inbound data

call the shared messaging/booking flow

send responses back to the user's WhatsApp number

Do not put slot calculation, payment business rules, or booking persistence directly in whatsapp.controller.ts.

12. Web Chat Rules

The MVP web chatbot does not require Socket.IO.

Use normal HTTP request/response unless real-time functionality is explicitly required.

Suggested flow:

POST /api/chat/message

Request:

{
  "conversationId": "...",
  "senderId": "...",
  "message": "I want a booking tomorrow at 10am"
}

The API should return a channel-neutral response model that the frontend can render.

Do not introduce WebSockets just for chat unless a concrete requirement exists for live updates, typing indicators, or streaming responses.

13. Suggested API Endpoints

POST   /api/auth/login
POST   /api/auth/register

GET    /api/traders/:id
PATCH  /api/traders/:id

POST   /api/traders/:id/work-area
GET    /api/traders/:id/work-area?date=YYYY-MM-DD

POST   /api/chat/message

GET    /api/webhooks/whatsapp
POST   /api/webhooks/whatsapp

POST   /api/bookings
GET    /api/bookings
GET    /api/bookings/:id
PATCH  /api/bookings/:id/status

POST   /api/payments/create
POST   /api/webhooks/stripe

POST   /api/stripe/connect/onboard
GET    /api/stripe/connect/status

Keep route names predictable and REST-like.

14. Validation

Every external request must be validated before reaching business logic.

Prefer a validation library already used by the project. If none exists, use a standard TypeScript validation library such as Zod.

Validate:

IDs

dates/times

channel values

booking duration

monetary amounts

required customer information

Stripe webhook payloads/signatures

Never trust arbitrary amounts supplied by the frontend. Booking fees should come from backend configuration/database rules.

15. Error Handling

Use consistent API errors.

Example:

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

16. Environment Variables

Use a validated environment configuration.

Example:

NODE_ENV=development
PORT=4000
DATABASE_URL=

JWT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=usd
BOOKING_FEE=5000
APPLICATION_FEE=500

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

JOB_DURATION_MINUTES=60
TRAVEL_BUFFER_MINUTES=30

Never commit real secrets.

Commit .env.example, not .env.

17. Testing Priorities

The most important tests are integration tests around the real booking flow.

Minimum scenarios:

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