import { NextRequest, NextResponse } from "next/server";
import { getBooking } from "@/lib/api/endpoints";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBooking(id);
    return NextResponse.json(booking);
  } catch (e) {
    const error = e as Error & { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: error.message || "Booking not found" },
      { status: error.status || 404 }
    );
  }
}