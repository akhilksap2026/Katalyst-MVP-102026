import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"

export interface PageHeaderCrumb {
  label: string
  href?: string
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  /** Ancestors; the last item is the current page. */
  breadcrumbs?: PageHeaderCrumb[]
  /** The single primary outcome action, placed at the top end. */
  action?: React.ReactNode
}

function PageHeader({ title, description, breadcrumbs, action, className, ...props }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("flex flex-col gap-2", className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1
              return (
                <React.Fragment key={`${c.label}-${i}`}>
                  <BreadcrumbItem>
                    {last || !c.href ? <BreadcrumbPage>{c.label}</BreadcrumbPage> : <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>}
                  </BreadcrumbItem>
                  {last ? null : <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-title text-foreground">{title}</h1>
          {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div data-slot="page-header-action" className="flex items-center gap-2">{action}</div> : null}
      </div>
    </header>
  )
}

export { PageHeader }
