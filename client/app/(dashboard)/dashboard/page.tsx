import { requireTrader } from "@/lib/auth";
import { getBookings, getWorkArea, getStripeConnectStatus } from "@/lib/api/endpoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, CreditCard, Plus, ArrowRight, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";
import type { BookingStatus } from "@/lib/api/types";

export default async function DashboardPage() {
  const { trader } = await requireTrader();

  const [bookings, workArea, stripeStatus] = await Promise.all([
    getBookings().catch(() => []),
    getWorkArea(trader.id, new Date().toISOString().split("T")[0]).catch(() => null),
    getStripeConnectStatus().catch(() => null),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = bookings.filter((b) => b.startTime.startsWith(today));
  const upcomingBookings = bookings
    .filter((b) => b.startTime > new Date().toISOString() && !todaysBookings.includes(b))
    .slice(0, 5);

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case "CONFIRMED":
        return <Badge variant="default"><Clock className="mr-1 h-3 w-3" /> Confirmed</Badge>;
      case "REQUESTED":
        return <Badge variant="warning"><AlertCircle className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
      case "PAYMENT_PENDING":
        return <Badge variant="warning"><AlertCircle className="mr-1 h-3 w-3" /> Payment Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {trader.name}</p>
        </div>
        <Link href="/dashboard/bookings">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            View All Bookings
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysBookings.length === 0 ? "No bookings today" : `${todaysBookings.length} booking${todaysBookings.length !== 1 ? "s" : ""} scheduled`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Area Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {workArea ? (
              <div className="text-2xl font-bold">{workArea.area}</div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">Not set</div>
            )}
            <p className="text-xs text-muted-foreground">
              {workArea ? "Work area set for today" : "Set your work area to accept bookings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stripeStatus?.connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="destructive">Not Connected</Badge>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stripeStatus?.connected ? "Ready to accept payments" : "Connect Stripe to accept bookings"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Bookings for {formatDate(today)}</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No bookings scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todaysBookings.map((booking) => (
                  <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                          <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(booking.startTime.split("T")[1].slice(0, 5))} - {formatTime(booking.endTime.split("T")[1].slice(0, 5))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(booking.status)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Next 5 upcoming bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming bookings</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.startTime)} at {formatTime(booking.startTime.split("T")[1].slice(0, 5))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(booking.status)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!workArea && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Work area not set</h3>
                <p className="text-sm text-muted-foreground">Set your daily work area to start receiving booking requests from customers.</p>
              </div>
              <Link href="/dashboard/work-area">
                <Button>Set Work Area</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!stripeStatus?.connected && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Stripe not connected</h3>
                <p className="text-sm text-muted-foreground">Connect your Stripe account to accept payments for bookings.</p>
              </div>
              <Link href="/settings/stripe">
                <Button>Connect Stripe</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}