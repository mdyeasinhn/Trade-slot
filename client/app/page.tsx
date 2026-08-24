import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Calendar, CreditCard, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">TradeSlot</h1>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Trader Login
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Book Trades <span className="text-primary">Instantly</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple booking platform for tradespeople. Customers book slots through chat,
            traders manage their schedule and get paid via Stripe.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                <Wrench className="h-4 w-4" />
                Register as Trader
              </Button>
            </Link>
            <Link href="/book/demo-trader">
              <Button size="lg" variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Try Booking Demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>Set your work area and let customers book available slots</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant Payments</CardTitle>
                <CardDescription>Stripe Checkout integration for secure deposits and payments</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure & Simple</CardTitle>
                <CardDescription>HTTP-only cookies, no client-side secrets, backend-validated</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>TradeSlot MVP - Built with Next.js, React, and TypeScript</p>
      </footer>
    </div>
  );
}