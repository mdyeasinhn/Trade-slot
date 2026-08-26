import { requireTrader } from "@/lib/auth";
import { getBookings } from "@/lib/api/endpoints";
import { getWorkAreaAction } from "@/lib/actions/work-area";
import { WorkAreaPageClient } from "./WorkAreaClient";

export default async function WorkAreaPage() {
  const { trader } = await requireTrader();
  const today = new Date().toISOString().split("T")[0];
  
  const [workArea, bookings] = await Promise.all([
    getWorkAreaAction(today),
    getBookings().catch(() => []),
  ]);

  const filteredBookings = bookings.filter((b) => b.requestedDate.startsWith(today));

  return <WorkAreaPageClient initialWorkArea={workArea?.area || null} initialBookings={filteredBookings} />;
}