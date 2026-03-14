import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
};

// Standardized error presentation with an optional retry action.
// Use in react-query error branches to keep UI consistent.
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
  retryLabel = "Retry",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-left",
        className
      )}
      role="alert"
    >
      <div>
        <p className="text-destructive font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry ? (
          <Button variant="destructive" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
