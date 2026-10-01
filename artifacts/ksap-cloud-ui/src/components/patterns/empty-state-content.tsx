import * as React from "react"

import { Button } from "../ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty"

export interface EmptyStateContentProps extends Omit<React.ComponentProps<typeof Empty>, "title"> {
  icon?: React.ReactNode
  title: React.ReactNode
  /** Explanation of why the area is empty. */
  description: React.ReactNode
  /** Single outcome action. */
  actionLabel?: string
  onAction?: () => void
}

function EmptyStateContent({ icon, title, description, actionLabel, onAction, ...props }: EmptyStateContentProps) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel ? <EmptyContent><Button onClick={onAction}>{actionLabel}</Button></EmptyContent> : null}
    </Empty>
  )
}

export { EmptyStateContent }
