import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-lg border p-4 text-body [&>svg]:size-icon-md [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        info: "border-info bg-info-subtle text-foreground [&>svg]:text-info",
        success: "border-success bg-success-subtle text-foreground [&>svg]:text-success",
        warning: "border-warning bg-warning-subtle text-foreground [&>svg]:text-warning",
        error: "border-danger bg-danger-subtle text-foreground [&>svg]:text-danger",
        destructive: "border-danger bg-danger-subtle text-foreground [&>svg]:text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const alertIcons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
  destructive: CircleAlert,
} as const

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const Icon = variant && variant !== "default" ? alertIcons[variant] : null
  return (
    <div ref={ref} role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} data-slot="alert-title" className={cn("text-subheading font-semibold", className)} {...props} />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="alert-description" className={cn("text-body text-muted-foreground", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
