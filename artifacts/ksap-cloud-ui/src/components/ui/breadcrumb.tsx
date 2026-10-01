import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, Ellipsis } from "lucide-react"

import { cn } from "../../lib/utils"
import { useUIString } from "../../lib/ui-strings"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & { separator?: React.ReactNode }
>(({ separator: _separator, "aria-label": ariaLabel, ...props }, ref) => {
  const label = useUIString("breadcrumb")
  return <nav ref={ref} data-slot="breadcrumb" aria-label={ariaLabel ?? label} {...props} />
})
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} data-slot="breadcrumb-list" className={cn("flex flex-wrap items-center gap-2 break-words text-body text-muted-foreground", className)} {...props} />
  )
)
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-2", className)} {...props} />
  )
)
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { asChild?: boolean }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      data-slot="breadcrumb-link"
      className={cn("rounded-sm text-primary-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span ref={ref} data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" className={cn("font-semibold text-foreground", className)} {...props} />
  )
)
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-icon-sm", className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => {
  const more = useUIString("more")
  return (
  <span data-slot="breadcrumb-ellipsis" role="presentation" aria-hidden="true" className={cn("flex size-6 items-center justify-center", className)} {...props}>
    <Ellipsis className="size-icon-sm" />
    <span className="sr-only">{more}</span>
  </span>
)}
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis }
