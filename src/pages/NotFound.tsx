// Accessible 404 experience with clear recovery paths for lost users.
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <section
        className="w-full max-w-xl text-center space-y-6 rounded-2xl border border-border bg-card p-10 shadow-lg"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">
          Error 404 · Page Not Found
        </p>
        <h1 className="text-4xl font-bold text-foreground">
          We can&apos;t find that page
        </h1>
        <p className="text-lg text-muted-foreground">
          The link{" "}
          <span className="font-mono break-all text-foreground">
            {location.pathname || "/"}
          </span>{" "}
          may be outdated or you might not have access to it yet.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto rounded-lg bg-primary px-5 py-3 text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            to="/chat"
            className="w-full sm:w-auto rounded-lg border border-border px-5 py-3 font-semibold text-foreground hover:bg-surface-muted transition-colors"
          >
            Ask Nick for help
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          If you believe this is a mistake, double-check the address or reach out to your
          administrator for access.
        </p>
      </section>
    </main>
  );
};

export default NotFound;
