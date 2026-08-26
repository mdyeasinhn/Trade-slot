import { requireTrader } from "@/lib/auth";
import { getBookings } from "@/lib/api/endpoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, CreditCard, ArrowRight, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/api/types";

const statusBadge = (status: BookingStatus) => {
  switch (status) {
    case "PAID":
      return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
    case "CONFIRMED":
      return <Badge variant="default"><Clock className="mr-1 h-3 w-3" /> Confirmed</Badge>;
    case "PAYMENT_PENDING":
      return <Badge variant="warning"><AlertCircle className="mr-1 h-3 w-3" /> Payment Pending</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>;
    case "COMPLETED":
      return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
    case "REQUESTED":
      return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Requested</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default async function BookingsPage() {
  const { trader } = await requireTrader();
  const bookings = await getBookings().catch(() => []);

  const sortedBookings = [...bookings].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage and view all your bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Click on a booking to view details and update status</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No bookings yet</h3>
              <p className="text-muted-foreground">Bookings will appear here when customers book through your chat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBookings.map((booking) => (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(booking.startTime)}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(booking.startTime.split("T")[1].slice(0, 5))} - {formatTime(booking.endTime.split("T")[1].slice(0, 5))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{booking.serviceDescription || "No description"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatMoney(booking.bookingFee)}</p>
                          {booking.payment && booking.payment.amount > 0 && (
                            <p className="text-sm text-muted-foreground">Paid: {formatMoney(booking.payment.amount)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="h-4 w-4" />
                            <span className="sr-only">View booking</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}