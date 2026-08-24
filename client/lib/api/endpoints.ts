/**
 * Every backend path in one place. Paths are relative to the API base URL and
 * already include the `/api` prefix the server mounts its router under.
 */

export const endpoints = {
  health: "/api/health",

  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
  },

  users: {
    me: "/api/users/me",
  },

  businesses: {
    byId: (id: string) => `/api/businesses/${id}`,
  },

  traders: {
    byId: (id: string) => `/api/traders/${id}`,
    workArea: (id: string) => `/api/traders/${id}/work-area`,
  },

  bookings: {
    root: "/api/bookings",
    availability: "/api/bookings/availability",
    byId: (id: string) => `/api/bookings/${id}`,
    status: (id: string) => `/api/bookings/${id}/status`,
  },

  chat: {
    message: "/api/chat/message",
  },

  payments: {
    create: "/api/payments/create",
  },

  stripeConnect: {
    onboard: "/api/stripe/connect/onboard",
    status: "/api/stripe/connect/status",
  },
} as const;
