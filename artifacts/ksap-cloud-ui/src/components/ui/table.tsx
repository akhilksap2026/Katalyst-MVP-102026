import * as React from "react"

import { cn } from "../../lib/utils"

type TableGroup = "a" | "b" | "c"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div data-slot="table-container" className="relative w-full overflow-auto">
      <table ref={ref} data-slot="table" className={cn("w-full caption-bottom text-body", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} data-slot="table-header" className={cn("bg-surface [&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} data-slot="table-footer" className={cn("border-t bg-surface font-semibold [&>tr]:last:border-b-0", className)} {...props} />
  )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} data-slot="table-row" className={cn("border-b transition-colors hover:bg-muted", className)} {...props} />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { group?: TableGroup }
>(({ className, group, ...props }, ref) => (
  <th
    ref={ref}
    data-slot="table-head"
    data-group={group}
    className={cn("px-3 text-start align-middle text-body font-semibold text-muted-foreground [&:has([role=checkbox])]:pe-0", className)}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { group?: TableGroup }
>(({ className, group, ...props }, ref) => (
  <td
    ref={ref}
    data-slot="table-cell"
    data-group={group}
    className={cn("px-3 align-middle [&:has([role=checkbox])]:pe-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} data-slot="table-caption" className={cn("mt-4 text-caption text-muted-foreground", className)} {...props} />
  )
)
TableCaption.displayName = "TableCaption"

const TableColGroup = React.forwardRef<
  HTMLTableColElement,
  React.ColHTMLAttributes<HTMLTableColElement> & { group?: TableGroup }
>(({ group, ...props }, ref) => <colgroup ref={ref} data-slot="table-colgroup" data-group={group} {...props} />)
TableColGroup.displayName = "TableColGroup"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, TableColGroup }
