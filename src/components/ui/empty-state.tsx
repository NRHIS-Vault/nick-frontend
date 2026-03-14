import React from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

// Neutral empty state for lists/queries with no data.
// Provide optional icon and action (e.g., a button) to guide the user.
export function EmptyState({
  title = "Nothing to show yet",
  description = "Once data arrives, it will appear here.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 p-6 text-center",
        className
      )}
    >
      <div className="text-2xl text-muted-foreground">{icon ?? "🪶"}</div>
      <div>
        <p className="text-foreground font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
