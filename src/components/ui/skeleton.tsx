import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean
}

// Generic loading placeholder. Apply height/width via className
// (e.g., h-6 w-32) and toggle the pulse animation with `animated`.
function Skeleton({
  className,
  animated = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/70",
        animated && "animate-pulse",
        className
      )}
      aria-busy="true"
      {...props}
    />
  )
}

export { Skeleton }
