// Route guard that consumes the shared auth context instead of reading Supabase directly.
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Paywall from "@/components/Paywall";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const isSubscribed = useSubscription();

  // Step 1: while AuthProvider is still hydrating the current session, keep protected
  // content on hold so the UI does not flash before the auth state settles.
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Authenticating
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Checking your access
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Protected routes wait here briefly while AuthContext restores the current session and
            loads role/subscription details from Supabase.
          </p>
        </div>
      </div>
    );
  }

  // Step 2: once the context is ready, authenticated users can proceed and everyone
  // else gets sent to the public login page with their intended destination preserved.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Step 3: users with a valid session still need an active subscription before the
  // dashboard unlocks. Roles are fetched alongside subscription state in AuthProvider,
  // but access remains paywall-driven until role-specific authorization is added later.
  if (!isSubscribed) {
    return <Paywall />;
  }

  // Step 4: render the protected route only when a user exists and their subscription
  // status has resolved to `active` inside AuthContext.
  return <>{children}</>;
};

export default ProtectedRoute;
