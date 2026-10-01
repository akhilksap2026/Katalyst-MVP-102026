import * as React from "react"

import { cn } from "../../lib/utils"
import { Badge } from "../ui/badge"

export type StatusBadgeStatus = "neutral" | "info" | "success" | "warning" | "danger"

const statusWords: Record<StatusBadgeStatus, string> = {
  neutral: "Draft",
  info: "In transit",
  success: "On time",
  warning: "At risk",
  danger: "Breached",
}

export interface StatusBadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  status?: StatusBadgeStatus
  /** Indicator drawn before the word: the Badge icon or a dot. */
  indicator?: "icon" | "dot"
  /** Status word; defaults to the source word for the status. */
  children?: React.ReactNode
}

function StatusBadge({ status = "neutral", indicator = "icon", className, children, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={status} icon={indicator === "icon"} className={cn(className)} {...props}>
      {indicator === "dot" ? <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" /> : null}
      {children ?? statusWords[status]}
    </Badge>
  )
}

export { StatusBadge, statusWords }
