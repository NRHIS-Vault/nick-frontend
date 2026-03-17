import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabaseClient";

type FieldErrors = {
  email?: string;
  password?: string;
};

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
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
    return "Password is required to sign in.";
  }

  return undefined;
};

const formatAuthError = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }

  return message;
};

const getRedirectPath = (state: LoginLocationState | null) => {
  const fallbackPath = "/dashboard";
  const pathname = state?.from?.pathname || fallbackPath;
  const search = state?.from?.search || "";
  const hash = state?.from?.hash || "";

  return `${pathname}${search}${hash}`;
};

const buildRedirectTo = (path: string) => {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
};

const LoginContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const supabaseConfigured = hasSupabaseConfig();
  const redirectPath = getRedirectPath(location.state as LoginLocationState | null);
  const redirectTo = buildRedirectTo(redirectPath);

  // Step 1: keep the form fully controlled so validation, loading states, and auth actions
  // all read from a single source of truth.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicLinkMessage, setMagicLinkMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(supabaseConfigured);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  // Step 2: if the visitor already has a session, redirect them away from `/login`
  // immediately. This also handles the moment after Supabase consumes a magic-link URL.
  useEffect(() => {
    if (!supabaseConfigured) {
      setIsCheckingSession(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const finishSessionCheck = (hasSession: boolean) => {
      if (!isMounted) return;

      if (hasSession) {
        navigate(redirectPath, { replace: true });
        return;
      }

      setIsCheckingSession(false);
    };

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setAuthError(getErrorMessage(error));
        setIsCheckingSession(false);
        return;
      }

      finishSessionCheck(Boolean(data.session?.user));
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      finishSessionCheck(Boolean(session?.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectPath, supabaseConfigured]);

  // Step 3: validate fields on blur so users get quick feedback without waiting
  // for a full submit cycle.
  const validateField = (field: keyof FieldErrors, value: string) => {
    const nextError = field === "email" ? validateEmail(value) : validatePassword(value);
    setFieldErrors((current) => ({
      ...current,
      [field]: nextError,
    }));
  };

  // Step 4: validate the exact fields needed for each action before making any network call.
  const validateForSignIn = () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const validateForMagicLink = () => {
    const nextEmailError = validateEmail(email);

    setFieldErrors({
      email: nextEmailError,
      password: undefined,
    });

    return !nextEmailError;
  };

  // Step 5: password sign-in uses the shared Supabase client and redirects
  // to the originally requested protected route on success.
  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setMagicLinkMessage(null);

    if (!validateForSignIn()) {
      return;
    }

    if (!supabaseConfigured) {
      setAuthError(
        "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      );
      return;
    }

    setIsSigningIn(true);

    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        setAuthError(formatAuthError(error.message));
        return;
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  // Step 6: magic-link sign-in validates only the email field and sends the visitor
  // back to the same route after Supabase verifies the email link.
  const handleSendMagicLink = async () => {
    setAuthError(null);
    setMagicLinkMessage(null);

    if (!validateForMagicLink()) {
      return;
    }

    if (!supabaseConfigured) {
      setAuthError(
        "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      );
      return;
    }

    setIsSendingMagicLink(true);

    try {
      const { error } = await getSupabaseClient().auth.signInWithOtp({
        email: normalizeEmail(email),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setAuthError(formatAuthError(error.message));
        return;
      }

      setMagicLinkMessage(
        `Magic link sent to ${normalizeEmail(email)}. Use the email link to finish signing in.`
      );
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  // Step 7: preserve the auth screen while the current session is being restored
  // so users do not see a flash of the form before being redirected.
  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl items-center justify-center">
          <Card className="w-full max-w-lg border-border/60 bg-card/95 shadow-xl">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LoaderCircle className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-2">
                <CardTitle>Restoring your session</CardTitle>
                <CardDescription>
                  Supabase is checking whether you already have a valid sign-in session.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand)/0.26),_transparent_48%),radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.18),_transparent_34%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--surface)))]" />
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <section className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm shadow-sm backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="font-medium">RHNIS authentication</span>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Secure Access
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Sign in to reach the RHNIS Control Center.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Use your password for a direct login, or request a magic link that brings you
                  back to the route you originally tried to open.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <MailCheck className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Magic link fallback</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Email sign-in sends a one-time link to your inbox and returns you to
                    <span className="mx-1 rounded bg-primary/10 px-2 py-1 font-mono text-primary">
                      {redirectPath}
                    </span>
                    after verification.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  <KeyRound className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-lg font-semibold">Password sign-in</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Direct sign-in uses Supabase sessions, so protected dashboard routes unlock
                    immediately after authentication succeeds.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {supabaseConfigured ? (
                  <>
                    <span>After authentication you&apos;ll be returned to</span>
                    <span className="rounded-full border border-border/60 bg-card px-3 py-1 font-mono text-foreground">
                      {redirectPath}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Auth is disabled in this environment.</span>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary/80"
                    >
                      Open the dashboard scaffold
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </section>

            <Card className="border-border/60 bg-card/95 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="space-y-1">
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials or request a passwordless email link.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {!supabaseConfigured && (
                  <Alert variant="warning">
                    <AlertTitle>Supabase env vars are missing</AlertTitle>
                    <AlertDescription>
                      Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
                      to enable authentication on this route.
                    </AlertDescription>
                  </Alert>
                )}

                {authError && (
                  <Alert variant="destructive">
                    <AlertTitle>Authentication failed</AlertTitle>
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}

                {magicLinkMessage && (
                  <Alert variant="success">
                    <AlertTitle>Magic link sent</AlertTitle>
                    <AlertDescription>{magicLinkMessage}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-5" onSubmit={handleSignIn} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setAuthError(null);
                        setMagicLinkMessage(null);

                        if (fieldErrors.email) {
                          validateField("email", event.target.value);
                        }
                      }}
                      onBlur={() => validateField("email", email)}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="login-email-error" className="text-sm text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setAuthError(null);
                        setMagicLinkMessage(null);

                        if (fieldErrors.password) {
                          validateField("password", event.target.value);
                        }
                      }}
                      onBlur={() => validateField("password", password)}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                    />
                    {fieldErrors.password && (
                      <p id="login-password-error" className="text-sm text-destructive">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!supabaseConfigured || isSigningIn || isSendingMagicLink}
                    >
                      {isSigningIn ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Signing In
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleSendMagicLink}
                      disabled={!supabaseConfigured || isSigningIn || isSendingMagicLink}
                    >
                      {isSendingMagicLink ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Sending Link
                        </>
                      ) : (
                        "Send Magic Link"
                      )}
                    </Button>
                  </div>
                </form>

                <p className="text-sm leading-6 text-muted-foreground">
                  Password sign-in calls <code>signInWithPassword</code>. Magic-link sign-in calls
                  <code>signInWithOtp</code> with your email and a redirect back to
                  <code className="ml-1">{redirectPath}</code>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

const Login = () => (
  // Keep the auth route inside the same theme system as the dashboard so root CSS variables
  // and persisted light/dark preferences behave consistently on both public and protected pages.
  <ThemeProvider>
    <LoginContent />
  </ThemeProvider>
);

export default Login;
