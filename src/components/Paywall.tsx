import { Lock, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import {
  confirmBillingCheckoutSession,
  createBillingCheckoutSession,
} from "@/lib/billing";
import { getCustomerPortalPlans } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const PaywallContent = () => {
  const { role, session, subscriptionStatus } = useAuth();
  const location = useLocation();
  const readableRole = role ?? "member";
  const readableSubscriptionStatus = subscriptionStatus ?? "inactive";
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false);

  const { data: planData } = useQuery({
    queryKey: ["paywall-plans"],
    queryFn: getCustomerPortalPlans,
    staleTime: 5 * 60 * 1000,
  });

  const featuredPlan = useMemo(
    () => planData?.plans.find((plan) => plan.popular) ?? planData?.plans[0] ?? null,
    [planData]
  );
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const checkoutState = searchParams.get("checkout");
  const checkoutSessionId = searchParams.get("session_id");

  const handleCheckout = async () => {
    if (!session?.access_token) {
      setCheckoutError("Billing checkout requires an authenticated session.");
      return;
    }

    setCheckoutError(null);
    setIsStartingCheckout(true);

    try {
      if (!featuredPlan) {
        throw new Error("No subscription plan is currently available for checkout.");
      }

      const origin =
        typeof window === "undefined" ? "" : window.location.origin;
      const successUrl = new URL("/dashboard", origin);
      successUrl.searchParams.set("checkout", "success");
      successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

      const cancelUrl = new URL("/dashboard", origin);
      cancelUrl.searchParams.set("checkout", "cancelled");

      const checkoutSession = await createBillingCheckoutSession({
        accessToken: session.access_token,
        planId: featuredPlan.id,
        successUrl: successUrl.toString(),
        cancelUrl: cancelUrl.toString(),
      });

      if (typeof window !== "undefined") {
        window.location.assign(checkoutSession.checkoutUrl);
      }
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to start the checkout flow."
      );
      setIsStartingCheckout(false);
    }
  };

  useEffect(() => {
    if (
      !session?.access_token ||
      checkoutState !== "success" ||
      !checkoutSessionId ||
      isConfirmingCheckout
    ) {
      return;
    }

    let isCancelled = false;

    const confirmCheckout = async () => {
      setCheckoutError(null);
      setIsConfirmingCheckout(true);

      try {
        await confirmBillingCheckoutSession({
          accessToken: session.access_token,
          sessionId: checkoutSessionId,
        });

        if (isCancelled || typeof window === "undefined") {
          return;
        }

        const confirmedUrl = new URL("/dashboard", window.location.origin);
        confirmedUrl.searchParams.set("checkout", "confirmed");
        window.location.assign(confirmedUrl.toString());
      } catch (error) {
        if (!isCancelled) {
          setCheckoutError(
            error instanceof Error
              ? error.message
              : "Unable to confirm the completed checkout session."
          );
          setIsConfirmingCheckout(false);
        }
      }
    };

    void confirmCheckout();

    return () => {
      isCancelled = true;
    };
  }, [checkoutSessionId, checkoutState, isConfirmingCheckout, session?.access_token]);

  const isBusy = isStartingCheckout || isConfirmingCheckout;
  const statusMessage =
    checkoutState === "cancelled"
      ? "Checkout was cancelled before payment completed."
      : checkoutState === "success"
        ? "Verifying your completed checkout before reopening the dashboard."
        : checkoutState === "confirmed"
          ? "Checkout confirmed. Refreshing your subscription access."
          : null;
  const featuredPlanPrice = featuredPlan
    ? currencyFormatter.format(featuredPlan.monthlyPriceEquivalent)
    : null;

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand)/0.2),_transparent_46%),radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.14),_transparent_34%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--surface)))]" />
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="font-medium">Subscription required</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Access Control
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Your account is signed in, but your subscription access is not active yet.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Protected routes now stop on the paywall until your profile reports an active
                  subscription. Start checkout here, then the dashboard will reopen automatically
                  once the completed session is confirmed against Stripe.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Current account role</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <span className="inline-code-chip">
                      {readableRole}
                    </span>
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <Lock className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Subscription status</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <span className="inline-code-chip">
                      {readableSubscriptionStatus}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border/60 bg-card/95 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="space-y-1">
                  <CardTitle>
                    {featuredPlan ? featuredPlan.name : "Subscription checkout"}
                  </CardTitle>
                  <CardDescription>
                    {featuredPlan
                      ? `${featuredPlanPrice} / ${featuredPlan.billingPeriodLabel} for protected dashboard access.`
                      : "Load a subscription plan, then start checkout."}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                  {featuredPlan ? (
                    <>
                      {featuredPlan.description}
                      {featuredPlan.features.length ? (
                        <span className="mt-3 block">
                          Includes: {featuredPlan.features.join(", ")}.
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>Customer portal plan data is loading. Checkout will unlock once a plan is available.</>
                  )}
                </div>

                {statusMessage ? (
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                ) : null}

                {checkoutError ? (
                  <p className="text-sm text-destructive">{checkoutError}</p>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    void handleCheckout();
                  }}
                  disabled={!featuredPlan || isBusy}
                >
                  {isBusy ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {isConfirmingCheckout ? "Confirming checkout" : "Redirecting to Stripe"}
                    </>
                  ) : (
                    `Subscribe to ${featuredPlan?.name ?? "this workspace"}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

const Paywall = () => (
  // Keep the paywall inside the same theme system as the auth pages so token-based
  // colors and persisted light/dark preferences continue to apply outside the shell.
  <ThemeProvider>
    <PaywallContent />
  </ThemeProvider>
);

export default Paywall;
