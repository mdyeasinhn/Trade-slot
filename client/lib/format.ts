export function formatMoney(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatTime(time: string, timezone?: string): string {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
}

export function formatDateTime(date: string, time: string, timezone?: string): string {
  return `${formatDate(date)} at ${formatTime(time, timezone)}`;
}

export function getTimezoneLabel(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? ` (${tzPart.value})` : "";
  } catch {
    return "";
  }
}