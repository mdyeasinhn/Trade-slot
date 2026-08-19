/// Consistent success envelope.
export function ok<T>(data: T, message?: string) {
  return { success: true as const, message, data };
}

/// For endpoints that return nothing meaningful (204-style).
export function okEmpty(message?: string) {
  return { success: true as const, message, data: null };
}