import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react"

import { cn } from "../../lib/utils"
import { isInteractiveTarget, pruneSelection, selectionRange } from "../../lib/table-logic"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Input } from "./input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

type DataTableGroup = "a" | "b" | "c"

declare module "@tanstack/react-table" {
  // Column meta names the KSAP column group (DESIGN.md 3.10) a column belongs to.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    group?: DataTableGroup
    align?: "end"
  }
}

type DataTableLabels = {
  filter: string
  selectAll: string
  selectRow: string
  empty: string
  error: string
  retry: string
  previous: string
  next: string
  selected: (selected: number, total: number) => string
  page: (page: number, pages: number) => string
  sort: (column: string) => string
}

const defaultLabels: DataTableLabels = {
  filter: "Filter rows",
  selectAll: "Select all rows on this page",
  selectRow: "Select row",
  empty: "No results match the current filter.",
  error: "The table could not be loaded.",
  retry: "Retry",
  previous: "Previous page",
  next: "Next page",
  selected: (selected, total) => `${selected} of ${total} rows selected`,
  page: (page, pages) => `Page ${page} of ${pages}`,
  sort: (column) => `Sort by ${column}`,
}

function DataTableColumnHeader({
  column,
  title,
  label,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void; getCanSort: () => boolean }
  title: string
  label?: string
}) {
  if (!column.getCanSort()) return <span>{title}</span>
  const sorted = column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label ?? title}
      className="-ms-3"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <Icon aria-hidden="true" className={cn("size-icon-sm", sorted ? "text-primary-ink" : "text-muted-foreground")} />
    </Button>
  )
}

function selectColumn<TData extends RowData>(labels: DataTableLabels = defaultLabels): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAll}
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(event) => event.stopPropagation()}
      />
    ),
    enableSorting: false,
  }
}

type DataTableProps<TData extends RowData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  caption: string
  /** Stable record identifier. Required so selection survives sorting, filtering and data changes. */
  getRowId: (row: TData) => string
  /** Column id the filter input searches. Omit to hide the filter. */
  filterColumn?: string
  pageSize?: number
  onOpenRow?: (row: Row<TData>) => void
  /** Load-failure state with a retry action. */
  error?: boolean
  onRetry?: () => void
  labels?: Partial<DataTableLabels>
  /** Optional group header row, for example named column groups. */
  groupHeader?: React.ReactNode
  className?: string
}

/** shadcn Data Table pattern on TanStack Table. Enter opens the focused row, X toggles its selection. */
function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  caption,
  getRowId,
  filterColumn,
  pageSize = 5,
  onOpenRow,
  error,
  onRetry,
  labels: labelOverrides,
  groupHeader,
  className,
}: DataTableProps<TData, TValue>) {
  const labels = { ...defaultLabels, ...labelOverrides }
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useReactTable<TData>({
    data,
    columns: columns as ColumnDef<TData, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize } },
    getRowId: (original) => getRowId(original),
    state: { sorting, columnFilters, rowSelection },
  })

  const rows = table.getRowModel().rows
  const anchorRef = React.useRef<string | null>(null)

  // Reconcile selection when records are removed from the data.
  const idKey = data.map((item) => getRowId(item)).join("\u0000")
  React.useEffect(() => {
    const ids = idKey === "" ? [] : idKey.split("\u0000")
    setRowSelection((current) => pruneSelection(current, ids))
  }, [idKey])

  const onRowClickCapture = (event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => {
    const onCheckbox = event.target instanceof Element && event.target.closest("[data-slot=checkbox]")
    if (!onCheckbox) return
    if (event.shiftKey && anchorRef.current !== null) {
      // Shift+click selects the displayed range from the anchor; the checkbox itself does not toggle.
      event.preventDefault()
      event.stopPropagation()
      const range = selectionRange(rows.map((r) => r.id), anchorRef.current, row.id)
      setRowSelection((current) => ({ ...current, ...Object.fromEntries(range.map((id) => [id, true])) }))
    }
    anchorRef.current = row.id
  }
  const colCount = columns.length

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: Row<TData>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" && onOpenRow) {
      event.preventDefault()
      onOpenRow(row)
    } else if (event.key.toLowerCase() === "x") {
      event.preventDefault()
      anchorRef.current = row.id
      row.toggleSelected()
    }
  }

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-3", className)}>
      {filterColumn ? (
        <Input
          aria-label={labels.filter}
          placeholder={labels.filter}
          className="max-w-sheet"
          value={(table.getColumn(filterColumn)?.getFilterValue() as string | undefined) ?? ""}
          onChange={(event) => table.getColumn(filterColumn)?.setFilterValue(event.target.value)}
        />
      ) : null}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            {groupHeader}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      group={meta?.group}
                      className={cn("h-control", meta?.align === "end" && "text-end")}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <div role="alert" className="flex flex-wrap items-center gap-3 py-4 text-danger">
                    <TriangleAlert aria-hidden="true" className="size-icon-md" />
                    <span>{labels.error}</span>
                    {onRetry ? (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        {labels.retry}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="h-control cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-accent data-[state=selected]:text-accent-foreground"
                  onKeyDown={(event) => onRowKeyDown(event, row)}
                  onClickCapture={(event) => onRowClickCapture(event, row)}
                  onDoubleClick={onOpenRow ? (event) => { if (!isInteractiveTarget(event.target, event.currentTarget)) onOpenRow(row) } : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <TableCell key={cell.id} group={meta?.group} className={cn(meta?.align === "end" && "text-end")}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="py-6 text-center text-muted-foreground">
                  {labels.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground">
        <span aria-live="polite">
          {labels.selected(table.getFilteredSelectedRowModel().rows.length, table.getFilteredRowModel().rows.length)}
        </span>
        <div className="flex items-center gap-2">
          <span>{labels.page(table.getState().pagination.pageIndex + 1, Math.max(table.getPageCount(), 1))}</span>
          <Button variant="outline" size="icon" aria-label={labels.previous} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft aria-hidden="true" className="size-icon-md" />
          </Button>
          <Button variant="outline" size="icon" aria-label={labels.next} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight aria-hidden="true" className="size-icon-md" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DataTable, DataTableColumnHeader, selectColumn }
export type { DataTableProps, DataTableLabels, DataTableGroup }
