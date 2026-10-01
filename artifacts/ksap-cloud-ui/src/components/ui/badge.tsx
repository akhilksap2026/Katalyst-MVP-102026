import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, CircleCheck, Info, Minus, TriangleAlert } from "lucide-react"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-caption font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring [&_svg]:size-icon-sm [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-transparent bg-muted text-muted-foreground",
        info: "border-transparent bg-info-subtle text-info",
        success: "border-transparent bg-success-subtle text-success",
        warning: "border-transparent bg-warning-subtle text-warning",
        danger: "border-transparent bg-danger-subtle text-danger",
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-danger bg-transparent text-danger",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

const badgeIcons = {
  neutral: Minus,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Semantic status variants show an icon by default so status is never colour-only. */
  icon?: boolean
  /** Render the single child as the badge element (Slot); no icon is added. */
  asChild?: boolean
}

function Badge({ className, variant, icon = true, asChild = false, children, ...props }: BadgeProps) {
  const cls = cn(badgeVariants({ variant }), className)
  const common = { "data-slot": "badge", "data-variant": variant ?? "neutral", className: cls, ...props }
  if (asChild) return <Slot {...common}>{children}</Slot>
  const Icon = variant && variant in badgeIcons ? badgeIcons[variant as keyof typeof badgeIcons] : variant ? null : badgeIcons.neutral
  return (
    <div {...common}>
      {icon && Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
