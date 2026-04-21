import { Lock, Sparkles } from "lucide-react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PaywallContent = () => {
  const { role, subscriptionStatus } = useAuth();
  const readableRole = role ?? "member";
  const readableSubscriptionStatus = subscriptionStatus ?? "inactive";

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
                  Your account is signed in, but this workspace is still behind the paywall.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Protected routes now check the shared subscription state from AuthContext before
                  rendering the dashboard. Until checkout ships in Week 4, inactive accounts stop
                  here instead of loading product pages they cannot use yet.
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
                  <CardTitle>Subscription checkout is coming next</CardTitle>
                  <CardDescription>
                    This button is intentionally a placeholder for Week 4 while billing is still
                    being wired into Supabase and Stripe.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                  Once the billing flow lands, this screen will redirect subscribed users back into
                  the dashboard automatically as soon as `subscription_status` becomes
                  <code className="mx-1 inline-code-chip">active</code>.
                </div>

                <Button type="button" className="w-full" disabled>
                  Subscribe (Week 4 Placeholder)
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
