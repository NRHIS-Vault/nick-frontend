import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, LoaderCircle, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { buildAppUrl } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

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
    return "A new password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return undefined;
};

const readRecoveryStateFromLocation = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const recoveryType = hashParams.get("type") ?? searchParams.get("type");

  return recoveryType === "recovery";
};

const ResetPasswordContent = () => {
  const navigate = useNavigate();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRecoveryMode, setIsRecoveryMode] = useState(readRecoveryStateFromLocation);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setRequestError(null);
        setSuccessMessage(null);
        setUpdateError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const validateResetRequest = () => {
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    return !nextEmailError;
  };

  const validateRecoveryForm = () => {
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError =
      !confirmPassword
        ? "Confirm your new password."
        : password !== confirmPassword
          ? "Passwords do not match."
          : undefined;

    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    return !nextPasswordError && !nextConfirmPasswordError;
  };

  const handleResetPasswordRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSuccessMessage(null);

    if (!validateResetRequest()) {
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
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: buildAppUrl("/reset-password"),
      });

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

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);

    if (!validateRecoveryForm()) {
      return;
    }

    if (!isConfigured) {
      setUpdateError(
        "Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
      );
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        password,
      });

      if (error) {
        setUpdateError(error.message);
        return;
      }

      navigate("/dashboard?passwordReset=success", { replace: true });
    } catch (error) {
      setUpdateError(getErrorMessage(error));
    } finally {
      setIsUpdatingPassword(false);
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
                  {isRecoveryMode ? "Set A New Password" : "Password Reset"}
                </p>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {isRecoveryMode
                    ? "Choose a new password to finish account recovery."
                    : "Request a password reset email."}
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  {isRecoveryMode
                    ? "Supabase has returned you to the dashboard app with a recovery session. Set the new password below to complete the flow."
                    : "Enter your email address and Supabase will send reset instructions to the inbox attached to that account."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                  {isRecoveryMode ? (
                    <LockKeyhole className="h-6 w-6 text-primary" />
                  ) : (
                    <MailCheck className="h-6 w-6 text-primary" />
                  )}
                  <h2 className="mt-4 text-lg font-semibold">
                    {isRecoveryMode ? "In-app completion" : "Email delivery"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {isRecoveryMode
                      ? "The recovery link now routes back to this page so the user can complete the password change inside the application."
                      : "Reset requests are delivered by Supabase email, so users can recover access without an active session."}
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
                  <CardTitle>
                    {isRecoveryMode ? "Create a new password" : "Reset your password"}
                  </CardTitle>
                  <CardDescription>
                    {isRecoveryMode
                      ? "Set the password you want to use the next time you sign in."
                      : "We&apos;ll send recovery instructions to the email you enter below."}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {!isConfigured && (
                  <Alert variant="warning">
                    <AlertTitle>Supabase env vars are missing</AlertTitle>
                    <AlertDescription>
                      Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
                      to enable password recovery on this route.
                    </AlertDescription>
                  </Alert>
                )}

                {!isRecoveryMode && requestError && (
                  <Alert variant="destructive">
                    <AlertTitle>Password reset failed</AlertTitle>
                    <AlertDescription>{requestError}</AlertDescription>
                  </Alert>
                )}

                {!isRecoveryMode && successMessage && (
                  <Alert variant="success">
                    <AlertTitle>Reset email sent</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                {isRecoveryMode && updateError && (
                  <Alert variant="destructive">
                    <AlertTitle>Password update failed</AlertTitle>
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}

                {isRecoveryMode ? (
                  <form className="space-y-5" onSubmit={handleUpdatePassword} noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="reset-password">New password</Label>
                      <Input
                        id="reset-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a new password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setUpdateError(null);

                          if (passwordError) {
                            setPasswordError(validatePassword(event.target.value));
                          }

                          if (confirmPasswordError && confirmPassword) {
                            setConfirmPasswordError(
                              event.target.value === confirmPassword
                                ? undefined
                                : "Passwords do not match."
                            );
                          }
                        }}
                        onBlur={() => setPasswordError(validatePassword(password))}
                        aria-invalid={Boolean(passwordError)}
                        aria-describedby={passwordError ? "reset-password-error" : undefined}
                      />
                      {passwordError && (
                        <p id="reset-password-error" className="text-sm text-destructive">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reset-password-confirm">Confirm password</Label>
                      <Input
                        id="reset-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter the new password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setUpdateError(null);

                          if (confirmPasswordError) {
                            setConfirmPasswordError(
                              event.target.value
                                ? event.target.value === password
                                  ? undefined
                                  : "Passwords do not match."
                                : "Confirm your new password."
                            );
                          }
                        }}
                        onBlur={() =>
                          setConfirmPasswordError(
                            !confirmPassword
                              ? "Confirm your new password."
                              : confirmPassword === password
                                ? undefined
                                : "Passwords do not match."
                          )
                        }
                        aria-invalid={Boolean(confirmPasswordError)}
                        aria-describedby={
                          confirmPasswordError ? "reset-password-confirm-error" : undefined
                        }
                      />
                      {confirmPasswordError && (
                        <p
                          id="reset-password-confirm-error"
                          className="text-sm text-destructive"
                        >
                          {confirmPasswordError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isConfigured || isUpdatingPassword}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password
                        </>
                      ) : (
                        "Save New Password"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleResetPasswordRequest} noValidate>
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
                )}

                <p className="text-sm leading-6 text-muted-foreground">
                  {isRecoveryMode ? (
                    <>
                      Password recovery now completes with <code>supabase.auth.updateUser</code>{" "}
                      after the recovery link returns the user to this route.
                    </>
                  ) : (
                    <>
                      Password recovery calls{" "}
                      <code>supabase.auth.resetPasswordForEmail(email, {"{ redirectTo }"})</code>{" "}
                      so the email link returns to this route.
                    </>
                  )}
                </p>

                <div className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <p>
                    Remembered your password?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
                    >
                      Back to sign in
                    </Link>
                  </p>
                  <p className="mt-2">
                    Need a new account instead?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary"
                    >
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
  <ThemeProvider>
    <ResetPasswordContent />
  </ThemeProvider>
);

export default ResetPassword;
