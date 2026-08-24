import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Cancelled - TradeSlot",
};

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was not completed. No charges have been made.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/book/demo-trader">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}