import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, MailCheck, ShieldCheck, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

type FieldErrors = {
  email?: string;
  password?: string;
};

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

const validatePassword = (password: string) => {
  if (!password) {
    return "Password is required.";
  }

  return undefined;
};

const formatAuthError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered")) {
    return "An account with that email already exists.";
  }

  if (normalized.includes("password")) {
    return message;
  }

  return message;
};

const SignUpContent = () => {
  const { isConfigured, isE2EMockAuthEnabled, signUpWithE2EMockAccount } = useAuth();

  // Step 1: keep every field controlled so validation, submission state, and
  // Supabase responses stay synchronized inside a single component.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: validate fields individually on blur so the user gets quick feedback
  // before the form ever reaches Supabase.
  const validateField = (field: keyof FieldErrors, value: string) => {
    const nextError = field === "email" ? validateEmail(value) : validatePassword(value);
    setFieldErrors((current) => ({
      ...current,
      [field]: nextError,
    }));
  };

  // Step 3: run the full validation pass before calling `signUp`.
  const validateForm = () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  // Step 4: send the registration request through Supabase and show either
  // a server-side error (for example weak passwords) or the email-confirmation success state.
  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    if (isE2EMockAuthEnabled) {
      setIsSubmitting(true);

      try {
        const result = await signUpWithE2EMockAccount(normalizeEmail(email), password);

        if (result.error) {
          setAuthError(result.error);
          return;
        }

        setPassword("");
        setSuccessMessage(
          result.message ?? "Mock account created. Continue to login to finish the E2E flow."
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!isConfigured) {
      setAuthError(
        "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await getSupabaseClient().auth.signUp({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        setAuthError(formatAuthError(error.message));
        return;
      }

      setPassword("");
      setSuccessMessage(
        "Account created. Check your email for a confirmation link before signing in."
      );
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand)/0.24),_transparent_48%),radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.16),_transparent_34%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--surface)))]" />
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="font-medium">RHNIS registration</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Account Creation
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Create your RHNIS account.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Sign-up creates your Supabase account and sends a confirmation email before you
                  continue into the protected dashboard.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <MailCheck className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Email confirmation</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    After registration, Supabase sends a confirmation link so the new account can
                    be verified before the first sign-in.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <UserPlus className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Server-side validation</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Weak-password or duplicate-account errors come directly from Supabase and are
                    surfaced here without losing the form state.
                  </p>
                </div>
              </div>
            </section>

            <Card className="border-border/60 bg-card/95 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="space-y-1">
                  <CardTitle>Start your account</CardTitle>
                  <CardDescription>
                    Enter your email and a password to register with Supabase.
                  </CardDescription>
                </div>
              </CardHeader>

                <CardContent className="space-y-5">
                {!isConfigured && !isE2EMockAuthEnabled && (
                  <Alert variant="warning">
                    <AlertTitle>Supabase env vars are missing</AlertTitle>
                    <AlertDescription>
                      Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
                      to enable account creation on this route.
                    </AlertDescription>
                  </Alert>
                )}

                {isE2EMockAuthEnabled && (
                  <Alert variant="success">
                    <AlertTitle>E2E mock auth is enabled</AlertTitle>
                    <AlertDescription>
                      This sign-up form is writing to the local E2E auth harness so browser tests
                      can register disposable accounts without a live Supabase project.
                    </AlertDescription>
                  </Alert>
                )}

                {authError && (
                  <Alert variant="destructive">
                    <AlertTitle>Registration failed</AlertTitle>
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success">
                    <AlertTitle>Check your inbox</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-5" onSubmit={handleSignUp} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setAuthError(null);
                        setSuccessMessage(null);

                        if (fieldErrors.email) {
                          validateField("email", event.target.value);
                        }
                      }}
                      onBlur={() => validateField("email", email)}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="signup-email-error" className="text-sm text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setAuthError(null);
                        setSuccessMessage(null);

                        if (fieldErrors.password) {
                          validateField("password", event.target.value);
                        }
                      }}
                      onBlur={() => validateField("password", password)}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "signup-password-error" : undefined}
                    />
                    {fieldErrors.password && (
                      <p id="signup-password-error" className="text-sm text-destructive">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={(!isConfigured && !isE2EMockAuthEnabled) || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <p className="text-sm leading-6 text-muted-foreground">
                  {isE2EMockAuthEnabled ? (
                    <>
                      In E2E mock mode this route creates a disposable local account that can sign
                      in immediately, which keeps the signup flow testable without a live email loop.
                    </>
                  ) : (
                    <>
                      Account creation calls <code>supabase.auth.signUp</code> with your email and
                      password, then waits for email confirmation before sign-in.
                    </>
                  )}
                </p>

                <div className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <p>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
                    >
                      Sign in
                    </Link>
                  </p>
                  <p className="mt-2">
                    Need to recover an account instead?{" "}
                    <Link
                      to="/reset-password"
                      className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
                    >
                      Send a reset email
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

const SignUp = () => (
  // Keep the public sign-up route inside the same theme system as the rest of the auth surface.
  <ThemeProvider>
    <SignUpContent />
  </ThemeProvider>
);

export default SignUp;
