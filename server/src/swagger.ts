import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI 3 spec assembly. The base definition (info, servers, security,
 * shared schemas) lives here; every endpoint is documented with `@openapi`
 * blocks in the route modules so the docs stay next to the code they describe.
 * The rendered UI is served by swagger-ui-express in app.ts.
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TradeSlot API',
      version: '0.1.0',
      description: [
        'TradeSlot booking platform backend — shared booking engine for Web Chat and WhatsApp.',
        '',
        'All non-webhook responses use a uniform envelope:',
        '',
        '```json',
        '{ "success": true, "message": "optional", "data": { ... } }',
        '```',
        '',
        'Errors use:',
        '',
        '```json',
        '{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }',
        '```',
      ].join('\n'),
    },
    servers: [
      {
        url: '/api',
        description: 'Routes are mounted under /api',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Registration and login for traders/users.' },
      { name: 'Users', description: 'Authenticated identity endpoints.' },
      { name: 'Businesses', description: 'Business entities that own traders.' },
      { name: 'Traders', description: 'Trader profiles and booking rules.' },
      { name: 'Work Areas', description: 'Daily work-area configuration for a trader.' },
      { name: 'Chat', description: 'Web chat transport into the shared booking engine.' },
      { name: 'Bookings', description: 'Slot availability and booking lifecycle.' },
      { name: 'Payments', description: 'Stripe Checkout payment creation.' },
      { name: 'Stripe Connect', description: 'Stripe Connect onboarding for traders.' },
      { name: 'Webhooks', description: 'WhatsApp and Stripe webhook entry points.' },
      { name: 'System', description: 'Health checks.' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Send `Bearer <token>` returned by POST /auth/login or /auth/register.',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  description:
                    'Stable machine-readable code. One of VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, SLOT_UNAVAILABLE, DOUBLE_BOOKING, INVALID_STATE, PAYMENT_ERROR, STRIPE_ERROR, WHATSAPP_ERROR, INTERNAL_ERROR.',
                  example: 'NOT_FOUND',
                },
                message: { type: 'string', example: 'Resource not found.' },
                details: {
                  description: 'Optional extra context (e.g. validation issues).',
                },
              },
            },
          },
        },
        AuthUser: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: { type: 'string', example: 'cm8x...' },
            email: { type: 'string', format: 'email', example: 'trader@example.com' },
            name: { type: 'string', example: 'Jane Smith' },
            role: { type: 'string', enum: ['TRADER', 'ADMIN'], example: 'TRADER' },
            traderId: { type: 'string', nullable: true, example: 'cm8y...' },
          },
        },
        AuthResult: {
          type: 'object',
          required: ['token', 'user'],
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/AuthUser' },
          },
        },
        UserMe: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: { type: 'string', example: 'cm8x...' },
            email: { type: 'string', format: 'email', example: 'trader@example.com' },
            name: { type: 'string', example: 'Jane Smith' },
            phone: { type: 'string', nullable: true, example: '+15550000000' },
            role: { type: 'string', enum: ['TRADER', 'ADMIN'] },
            trader: {
              type: 'object',
              nullable: true,
              properties: { id: { type: 'string', example: 'cm8y...' } },
            },
          },
        },
        Business: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', example: 'cm8x...' },
            name: { type: 'string', example: 'Jane Smith\'s Business' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            traders: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                  id: { type: 'string', example: 'cm8y...' },
                  name: { type: 'string', example: 'Jane Smith' },
                  phone: { type: 'string', nullable: true, example: '+15550000000' },
                },
              },
            },
          },
        },
        Trader: {
          type: 'object',
          required: ['id', 'businessId', 'name', 'timezone'],
          properties: {
            id: { type: 'string', example: 'cm8y...' },
            businessId: { type: 'string', example: 'cm8x...' },
            userId: { type: 'string', nullable: true, example: 'cm8x...' },
            name: { type: 'string', example: 'Jane Smith' },
            phone: { type: 'string', nullable: true, example: '+15550000000' },
            timezone: { type: 'string', example: 'UTC' },
            workDayStart: { type: 'string', example: '09:00' },
            workDayEnd: { type: 'string', example: '17:00' },
            jobDurationMin: { type: 'integer', nullable: true, example: 60 },
            bufferMin: { type: 'integer', nullable: true, example: 30 },
            bookingFee: { type: 'integer', nullable: true, example: 5000 },
            stripeAccountId: { type: 'string', nullable: true },
            stripeOnboardingDone: { type: 'boolean', example: false },
            stripeChargesEnabled: { type: 'boolean', example: false },
            stripePayoutsEnabled: { type: 'boolean', example: false },
            whatsappPhoneNumberId: { type: 'string', nullable: true },
            business: { $ref: '#/components/schemas/Business' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WorkArea: {
          type: 'object',
          required: ['id', 'traderId', 'date', 'area'],
          properties: {
            id: { type: 'string', example: 'cm9a...' },
            traderId: { type: 'string', example: 'cm8y...' },
            date: { type: 'string', format: 'date', example: '2026-08-20' },
            area: { type: 'string', example: 'Southside' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChatAction: {
          type: 'object',
          required: ['type', 'label'],
          properties: {
            type: {
              type: 'string',
              enum: ['text', 'payment_link', 'slot_choice'],
              example: 'payment_link',
            },
            label: { type: 'string', example: 'Pay now' },
            url: { type: 'string', example: 'https://checkout.stripe.com/...' },
            slot: { type: 'string', example: '10:00' },
          },
        },
        ChatReply: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', example: 'Great — a slot at 10:00 is available.' },
            actions: {
              type: 'array',
              items: { $ref: '#/components/schemas/ChatAction' },
            },
          },
        },
        AvailableSlot: {
          type: 'object',
          required: ['startTimeLocal', 'endTimeLocal', 'startTime', 'endTime'],
          properties: {
            startTimeLocal: { type: 'string', example: '09:00', description: 'Local start in the trader\'s timezone.' },
            endTimeLocal: { type: 'string', example: '10:00', description: 'Local end in the trader\'s timezone.' },
            startTime: { type: 'string', format: 'date-time', description: 'Absolute UTC instant.' },
            endTime: { type: 'string', format: 'date-time', description: 'Absolute UTC instant.' },
          },
        },
        Payment: {
          type: 'object',
          required: ['id', 'bookingId', 'amount', 'applicationFee', 'currency', 'status'],
          properties: {
            id: { type: 'string', example: 'cm9b...' },
            bookingId: { type: 'string', example: 'cm8z...' },
            stripeCheckoutSessionId: { type: 'string', nullable: true },
            stripePaymentIntentId: { type: 'string', nullable: true },
            connectedAccountId: { type: 'string', nullable: true, example: 'acct_1...' },
            amount: { type: 'integer', example: 5000, description: 'Minor units.' },
            applicationFee: { type: 'integer', example: 500, description: 'Minor units.' },
            currency: { type: 'string', example: 'usd' },
            checkoutUrl: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'],
            },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Booking: {
          type: 'object',
          required: [
            'id',
            'traderId',
            'customerName',
            'customerPhone',
            'requestedDate',
            'startTime',
            'endTime',
            'jobDurationMin',
            'bufferMin',
            'bookingFee',
            'currency',
            'status',
          ],
          properties: {
            id: { type: 'string', example: 'cm8z...' },
            traderId: { type: 'string', example: 'cm8y...' },
            conversationId: { type: 'string', nullable: true },
            customerName: { type: 'string', example: 'Bob Jones' },
            customerPhone: { type: 'string', example: '+15550001111' },
            serviceDescription: { type: 'string', nullable: true },
            requestedDate: { type: 'string', format: 'date', example: '2026-08-21' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            jobDurationMin: { type: 'integer', example: 60 },
            bufferMin: { type: 'integer', example: 30 },
            bookingFee: { type: 'integer', example: 5000, description: 'Minor units, resolved server-side.' },
            currency: { type: 'string', example: 'usd' },
            status: {
              type: 'string',
              enum: ['REQUESTED', 'CONFIRMED', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'CANCELLED'],
            },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledReason: { type: 'string', nullable: true },
            payment: { $ref: '#/components/schemas/Payment' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ConnectOnboardResult: {
          type: 'object',
          required: ['accountId', 'url'],
          properties: {
            accountId: { type: 'string', example: 'acct_1...' },
            url: { type: 'string', example: 'https://connect.stripe.com/setup/...' },
          },
        },
        ConnectStatus: {
          type: 'object',
          required: ['connected'],
          properties: {
            connected: { type: 'boolean', example: true },
            onboardingComplete: { type: 'boolean', example: false },
            id: { type: 'string', example: 'acct_1...' },
            detailsSubmitted: { type: 'boolean', example: false },
            chargesEnabled: { type: 'boolean', example: false },
            payoutsEnabled: { type: 'boolean', example: false },
          },
        },
        StripeWebhookResult: {
          type: 'object',
          required: ['received', 'processed'],
          properties: {
            received: { type: 'string', example: 'checkout.session.completed' },
            processed: { type: 'boolean', example: true, description: 'False when the event is a replayed no-op.' },
          },
        },
        SuccessEnvelope: {
          type: 'object',
          required: ['success'],
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', nullable: true },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Request payload or query failed validation.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Missing, invalid or expired bearer token.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Authenticated but not allowed to perform this action.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'The requested resource does not exist.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Conflict: {
          description: 'The request conflicts with current state (e.g. slot taken, invalid transition).',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        PaymentError: {
          description: 'Payment creation failed (e.g. trader not onboarded).',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        InternalError: {
          description: 'Unexpected server error.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  apis: ['src/modules/**/*.routes.ts', 'src/routes/index.ts'],
});