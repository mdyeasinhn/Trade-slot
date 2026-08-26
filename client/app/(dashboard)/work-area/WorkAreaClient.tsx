"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { setWorkAreaAction, getWorkAreaAction, getBookingsAction } from "@/lib/actions/work-area";
import { toast } from "@/components/ui/sonner";
import { Loader2, CheckCircle, Calendar, MapPin, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { formatDate, formatTime, formatMoney } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/api/types";

const workAreaSchema = z.object({
  date: z.string().min(1, "Date is required"),
  area: z.string().min(1, "Area is required"),
});

type WorkAreaForm = z.infer<typeof workAreaSchema>;

const statusBadge = (status: BookingStatus) => {
  switch (status) {
    case "PAID":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Paid</span>;
    case "CONFIRMED":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"><Clock className="h-3 w-3" /> Confirmed</span>;
    case "PAYMENT_PENDING":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3" /> Payment Pending</span>;
    case "CANCELLED":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> Cancelled</span>;
    case "COMPLETED":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
    case "REQUESTED":
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"><Clock className="h-3 w-3" /> Requested</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  }
};

interface WorkAreaPageProps {
  initialWorkArea: string | null;
  initialBookings: Booking[];
}

export function WorkAreaPageClient({ initialWorkArea, initialBookings }: WorkAreaPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkArea, setCurrentWorkArea] = useState<string | null>(initialWorkArea);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<WorkAreaForm>({
    resolver: zodResolver(workAreaSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      area: "",
    },
  });

  const selectedDate = watch("date") || new Date().toISOString().split("T")[0];

  const fetchWorkArea = async (date: string) => {
    const area = await getWorkAreaAction(date);
    const value = area?.area || "";
    setCurrentWorkArea(value || null);
    setValue("area", value);
  };

  const fetchBookings = async (date: string) => {
    setIsLoadingBookings(true);
    try {
      setBookings(await getBookingsAction(date));
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchWorkArea(selectedDate);
    fetchBookings(selectedDate);
  }, [selectedDate]);

  const onSubmit = async (data: WorkAreaForm) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("date", data.date);
    formData.append("area", data.area);
    const result = await setWorkAreaAction(formData);
    if (result.success) {
      toast.success("Work area saved");
      setCurrentWorkArea(data.area);
      setValue("area", data.area);
    } else {
      toast.error(result.error || "Failed to save work area");
    }
    setIsLoading(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Work Area</h1>
        <p className="text-muted-foreground">Set your daily work area to receive booking requests from nearby customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Work Area for {selectedDate}</CardTitle>
          <CardDescription>Enter a name for your work area (e.g., "Downtown", "Southside", "North District")</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                min={today}
                disabled={isLoading}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="area">Work Area</Label>
              <Input
                id="area"
                type="text"
                placeholder="e.g., Downtown, Southside, North District"
                {...register("area")}
                disabled={isLoading}
              />
              {errors.area && <p className="text-sm text-destructive">{errors.area.message}</p>}
              {currentWorkArea && (
                <p className="text-sm text-muted-foreground">
                  Current: <span className="font-medium">{currentWorkArea}</span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Work Area
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings for {selectedDate}</CardTitle>
          <CardDescription>View and manage bookings in your work area for this date</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No bookings for this date</h3>
              <p className="text-muted-foreground">Bookings will appear here when customers book through your chat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{booking.customerName}</p>
                          {statusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(booking.startTime.split("T")[1].slice(0, 5))} - {formatTime(booking.endTime.split("T")[1].slice(0, 5))}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {booking.serviceDescription || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatMoney(booking.bookingFee)}</p>
                        {booking.payment && booking.payment.amount > 0 && (
                          <p className="text-sm text-muted_foreground">Amount: {formatMoney(booking.payment.amount)}</p>
                        )}
                      </div>
                      <a
                        href={`/dashboard/bookings/${booking.id}`}
                        className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 underline"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Enter a descriptive name for your daily work location</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Customers in this area can request bookings</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Update daily - you can set different areas for different days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}