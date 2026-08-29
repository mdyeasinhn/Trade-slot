"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBookingAction, updateBookingStatusAction, createPaymentSessionAction } from "@/lib/actions/bookings";
import { toast } from "@/components/ui/sonner";
import { Loader2, Calendar, Clock, CreditCard, CheckCircle, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/api/types";

interface Props {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<BookingStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary"; icon: React.ReactNode }> = {
  PAID: { label: "Paid", variant: "success", icon: <CheckCircle className="h-3 w-3" /> },
  CONFIRMED: { label: "Confirmed", variant: "default", icon: <Clock className="h-3 w-3" /> },
  PAYMENT_PENDING: { label: "Payment Pending", variant: "warning", icon: <AlertCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", variant: "secondary", icon: <CheckCircle className="h-3 w-3" /> },
  REQUESTED: { label: "Requested", variant: "default", icon: <Clock className="h-3 w-3" /> },
};

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "REQUESTED", label: "Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

export default function BookingDetailPage({ params }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const { icon, label, variant } = statusConfig[booking?.status as BookingStatus] || statusConfig.REQUESTED;

  useEffect(() => {
    let isActive = true;
    void params
      .then(({ id }) => getBookingAction(id))
      .then((result) => {
        if (isActive) {
          setBooking(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          toast.error("Failed to load booking");
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params]);

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!booking) return;
    setUpdatingStatus(true);
    try {
      const result = await updateBookingStatusAction(booking.id, newStatus);
      if (result.success && result.data) {
        setBooking(result.data);
        toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!booking) return;
    setCreatingPayment(true);
    try {
      const result = await createPaymentSessionAction(booking.id);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to create payment session");
      }
    } catch {
      toast.error("Failed to create payment session");
    } finally {
      setCreatingPayment(false);
    }
  };

  // Initial fetch
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Booking not found</h3>
        <Button onClick={() => router.push("/dashboard/bookings")}>Back to Bookings</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/bookings")}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Information</CardTitle>
                <Badge variant={variant} className="gap-1">
                  {icon} {label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <p>{booking.customerName}</p>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <p>{booking.customerPhone}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <Label>Service</Label>
                <p>{booking.serviceDescription || "No description provided"}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(booking.startTime)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTime(booking.startTime.split("T")[1].slice(0, 5))} - {formatTime(booking.endTime.split("T")[1].slice(0, 5))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-lg">
                <span>Booking Fee</span>
                <span className="font-bold">{formatMoney(booking.bookingFee)}</span>
              </div>
              {booking.payment && booking.payment.amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Paid</span>
                  <span>{formatMoney(booking.payment.amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-4">
                <span className="font-medium">Balance Due</span>
                <span className="font-bold text-lg">{formatMoney(Math.max(0, booking.bookingFee - (booking.payment?.amount || 0)))}</span>
              </div>

              {booking.status === "PAYMENT_PENDING" && (booking.payment?.amount || 0) < booking.bookingFee && (
                <Button onClick={handleCreatePayment} disabled={creatingPayment} className="w-full" size="lg">
                  {creatingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay with Stripe
                    </>
                  )}
                </Button>
              )}

              {booking.status === "PAID" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Payment received - booking is fully paid
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge variant={variant} className="text-base px-3 py-2 w-full justify-start gap-2">
                  {icon} {label}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Change Status</Label>
                <Select
                  value={booking.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {updatingStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm text-muted-foreground break-all">{booking.id}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {formatDate(booking.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated: {formatDate(booking.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}