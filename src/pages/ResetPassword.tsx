import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

const normalizeEmail = (value: string) => value.trim();

const validateEmail = (email: string) => {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return "Enter a valid email address.";
  }

  return undefined;
};

const ResetPasswordContent = () => {
  const { isConfigured } = useAuth();

  // Step 1: keep the email field controlled so validation, server responses,
  // and loading state remain synchronized in one predictable place.
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: validate locally before sending the reset request to Supabase.
  const validateForm = () => {
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    return !nextEmailError;
  };

  // Step 3: request the reset email and surface either a failure or a delivery confirmation.
  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    if (!isConfigured) {
      setRequestError(
        "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
        normalizeEmail(email)
      );

      if (error) {
        setRequestError(error.message);
        return;
      }

      setSuccessMessage(
        `If an account exists for ${normalizeEmail(email)}, check that inbox for password reset instructions.`
      );
    } catch (error) {
      setRequestError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand)/0.22),_transparent_48%),radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.14),_transparent_34%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--surface)))]" />
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="font-medium">RHNIS recovery</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Password Reset
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Request a password reset email.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Enter your email address and Supabase will send reset instructions to the inbox
                  attached to that account.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <MailCheck className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Email delivery</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Reset requests are delivered by Supabase email, so users can recover access
                    without an active session.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <KeyRound className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Failure visibility</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Configuration problems or server-side failures are surfaced here directly so the
                    recovery flow does not fail silently.
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border/60 bg-card/95 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="space-y-1">
                  <CardTitle>Reset your password</CardTitle>
                  <CardDescription>
                    We&apos;ll send recovery instructions to the email you enter below.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {!isConfigured && (
                  <Alert variant="warning">
                    <AlertTitle>Supabase env vars are missing</AlertTitle>
                    <AlertDescription>
                      Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
                      to enable password reset on this route.
                    </AlertDescription>
                  </Alert>
                )}

                {requestError && (
                  <Alert variant="destructive">
                    <AlertTitle>Password reset failed</AlertTitle>
                    <AlertDescription>{requestError}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success">
                    <AlertTitle>Reset email sent</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-5" onSubmit={handleResetPassword} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setRequestError(null);
                        setSuccessMessage(null);

                        if (emailError) {
                          setEmailError(validateEmail(event.target.value));
                        }
                      }}
                      onBlur={() => setEmailError(validateEmail(email))}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "reset-email-error" : undefined}
                    />
                    {emailError && (
                      <p id="reset-email-error" className="text-sm text-destructive">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={!isConfigured || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Email
                      </>
                    ) : (
                      "Send Reset Email"
                    )}
                  </Button>
                </form>

                <p className="text-sm leading-6 text-muted-foreground">
                  Password recovery calls <code>supabase.auth.resetPasswordForEmail(email)</code>
                  and reports whether the request succeeded.
                </p>

                <div className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <p>
                    Remembered your password?{" "}
                    <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                      Back to sign in
                    </Link>
                  </p>
                  <p className="mt-2">
                    Need a new account instead?{" "}
                    <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
                      Create one here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

const ResetPassword = () => (
  // Keep the public password-reset route inside the same theme system as the rest of the auth surface.
  <ThemeProvider>
    <ResetPasswordContent />
  </ThemeProvider>
);

export default ResetPassword;
