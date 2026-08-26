"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStripeOnboardUrlAction, getStripeStatusAction, refreshStripeStatusAction } from "@/lib/actions/stripe";
import { toast } from "@/components/ui/sonner";
import { Loader2, CreditCard, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import type { ConnectStatus } from "@/lib/api/types";

export default function StripeSettingsPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getStripeStatusAction().then((result) => {
      if (cancelled) return;
      setStatus(result.status);
      setStatusError(result.error ?? null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOnboard = async () => {
    setOnboarding(true);
    try {
      const result = await getStripeOnboardUrlAction();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to create onboarding link");
      }
    } catch {
      toast.error("Failed to create onboarding link");
    } finally {
      setOnboarding(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await refreshStripeStatusAction();
    setStatus(result.status);
    setStatusError(result.error ?? null);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status refreshed");
    }
  };

  if (isLoading && !status) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stripe Connect</h1>
          <p className="text-muted-foreground">Connect your Stripe account to accept payments</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stripe Connect</h1>
        <p className="text-muted-foreground">Connect your Stripe account to accept payments for bookings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Manage your Stripe Connect connection</CardDescription>
            </div>
            <Badge variant={status?.connected ? "success" : "destructive"} className="gap-1">
              {status?.connected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load Stripe status: {statusError}
            </div>
          )}
          {!status?.connected ? (
            <div className="space-y-4">
              <div className="p-4 border border-dashed rounded-lg">
                <p className="text-center text-muted-foreground">
                  Connect your Stripe account to start accepting payments from customers.
                </p>
              </div>
              <Button onClick={handleOnboard} disabled={onboarding} className="w-full" size="lg">
                {onboarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Charges Enabled</label>
                  <Badge variant={status.chargesEnabled ? "success" : "destructive"}>
                    {status.chargesEnabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Payouts Enabled</label>
                  <Badge variant={status.payoutsEnabled ? "success" : "destructive"}>
                    {status.payoutsEnabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">Details Submitted</label>
                  <Badge variant={status.detailsSubmitted ? "success" : "warning"}>
                    {status.detailsSubmitted ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
                {/* onboardingUrl not available in ConnectStatus type */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• When you connect Stripe, you&apos;ll be redirected to Stripe&apos;s onboarding flow</p>
          <p>• Complete the required business and banking information</p>
          <p>• Once connected, customers can pay deposits and full amounts via Stripe Checkout</p>
          <p>• Payments are automatically linked to bookings via webhooks</p>
          <p>• Funds are transferred to your connected Stripe account (minus platform fees)</p>
        </CardContent>
      </Card>
    </div>
  );
}