import { Metadata } from "next";
import { getBooking } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, CreditCard, Calendar, Clock, MapPin } from "lucide-react";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/api/types";

interface Props {
  searchParams: Promise<{ booking_id?: string; session_id?: string }>;
}

const statusConfig: Record<BookingStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary"; icon: React.ReactNode }> = {
  PAID: { label: "Paid", variant: "success", icon: <CheckCircle className="h-4 w-4" /> },
  CONFIRMED: { label: "Confirmed", variant: "default", icon: <CheckCircle className="h-4 w-4" /> },
  PAYMENT_PENDING: { label: "Payment Pending", variant: "warning", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: <AlertCircle className="h-4 w-4" /> },
  COMPLETED: { label: "Completed", variant: "secondary", icon: <CheckCircle className="h-4 w-4" /> },
  REQUESTED: { label: "Requested", variant: "default", icon: <Clock className="h-4 w-4" /> },
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { booking_id } = await searchParams;
  if (booking_id) {
    try {
      const booking = await getBooking(booking_id);
      return {
        title: `Booking ${booking.status} - TradeSlot`,
        description: `Your booking with ${booking.customerName} is ${booking.status.toLowerCase()}`,
      };
    } catch {
      // Ignore
    }
  }
  return {
    title: "Payment Success - TradeSlot",
  };
}

export default async function SuccessPage({ searchParams }: Props) {
  const { booking_id } = await searchParams;

  if (!booking_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">No Booking ID</h2>
            <p className="text-muted-foreground mt-2">Unable to verify payment status</p>
            <Link href="/" className="mt-6 inline-block">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  let booking: Booking | null = null;
  try {
    booking = await getBooking(booking_id);
  } catch {
    // Booking not found
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Booking Not Found</h2>
            <p className="text-muted-foreground mt-2">Unable to load booking details</p>
            <Link href="/" className="mt-6 inline-block">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { icon, label, variant } = statusConfig[booking.status];

  const isPaid = booking.status === "PAID";
  const isPending = booking.status === "PAYMENT_PENDING";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
            isPaid && "bg-green-100 text-green-600",
            isPending && "bg-yellow-100 text-yellow-600",
            !isPaid && !isPending && "bg-blue-100 text-blue-600"
          )}>
            {icon}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isPaid ? "Payment Confirmed" : isPending ? "Payment Pending" : "Booking Updated"}
          </h1>
          <p className="text-muted-foreground">
            {isPaid
              ? "Your payment has been processed successfully"
              : isPending
              ? "We're confirming your payment. This usually takes a few moments."
              : `Booking status: ${label}`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={variant} className="gap-2">
              {icon} {label}
            </Badge>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(booking.startTime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {formatTime(booking.startTime.split("T")[1].slice(0, 5))} - {formatTime(booking.endTime.split("T")[1].slice(0, 5))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{booking.serviceDescription || "No description provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{formatMoney(booking.bookingFee)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPending && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
                <div>
                  <p className="font-medium text-yellow-800">Confirming payment...</p>
                  <p className="text-sm text-yellow-700">The payment webhook is being processed. This page will update automatically.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Link href="/book/demo-trader">
            <Button variant="outline">Book Another Slot</Button>
          </Link>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}