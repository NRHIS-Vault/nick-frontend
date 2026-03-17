// Session-aware route guard for dashboard pages that should require authentication
// whenever Supabase auth is configured for the environment.
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabaseClient";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig());
  const [isAuthenticated, setIsAuthenticated] = useState(!hasSupabaseConfig());

  useEffect(() => {
    // Keep the existing scaffold usable when Supabase isn't configured locally.
    if (!hasSupabaseConfig()) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    // Step 1: read the current session so refreshes and deep links can restore access.
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Failed to read the current Supabase session.", error);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(Boolean(data.session?.user));
      setIsLoading(false);
    };

    void loadSession();

    // Step 2: subscribe so sign-in, sign-out, and magic-link callbacks update the guard live.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session?.user));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Step 3: keep a neutral loading state on screen until we know whether the user has a session.
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Authenticating
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Checking your session
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Protected routes wait here briefly while Supabase restores the current session.
          </p>
        </div>
      </div>
    );
  }

  // Step 4: unauthenticated visitors get redirected to `/login`, along with the route they asked for.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Step 5: authenticated users can render the protected page normally.
  return <>{children}</>;
};

export default ProtectedRoute;
