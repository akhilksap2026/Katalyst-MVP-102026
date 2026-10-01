import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import { cn } from "../../lib/utils"

type SortableItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
  id: UniqueIdentifier
  disabled?: boolean
  /** Accessible name of the drag handle, for example "Reorder stop 2". */
  handleLabel: string
}

const itemClass =
  "flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-body text-foreground"

/** Geometry computed at runtime by dnd-kit is the only inline style, per DESIGN.md section 5. */
const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  ({ id, disabled, handleLabel, className, children, ...props }, forwardedRef) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
      isOver,
    } = useSortable({ id, disabled })

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node)
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      },
      [setNodeRef, forwardedRef]
    )

    return (
      <div
        ref={setRefs}
        data-slot="sortable-item"
        data-dragging={isDragging || undefined}
        data-over={(isOver && !isDragging) || undefined}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          itemClass,
          "data-[dragging=true]:opacity-40 data-[over=true]:border-primary-ink data-[over=true]:bg-accent",
          className
        )}
        {...props}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={handleLabel}
          disabled={disabled}
          className="hit-44 grid size-control shrink-0 cursor-grab place-content-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-icon-md" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    )
  }
)
SortableItem.displayName = "SortableItem"

type SortableListProps<T> = {
  items: T[]
  getId: (item: T) => UniqueIdentifier
  renderItem: (item: T) => React.ReactNode
  getHandleLabel: (item: T, position: number) => string
  onReorder: (next: T[], previous: T[]) => void
  announcements?: Announcements
  screenReaderInstructions?: DndContextProps["accessibility"] extends infer A
    ? A extends { screenReaderInstructions?: infer S }
      ? S
      : never
    : never
  className?: string
}

/** Pointer and keyboard sorting (Space lifts, arrows move, Space drops, Esc cancels) with overlay. */
function SortableList<T>({
  items,
  getId,
  renderItem,
  getHandleLabel,
  onReorder,
  announcements,
  screenReaderInstructions,
  className,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = React.useMemo(() => items.map(getId), [items, getId])
  const active = items.find((item) => getId(item) === activeId)

  const handleEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active: from, over } = event
    if (!over || from.id === over.id) return
    const oldIndex = ids.indexOf(from.id)
    const newIndex = ids.indexOf(over.id)
    onReorder(arrayMove(items, oldIndex, newIndex), items)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={(event) => setActiveId(event.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div data-slot="sortable-list" data-active={activeId !== null || undefined} className={cn("flex flex-col gap-2 rounded-lg border border-dashed border-transparent p-2 data-[active=true]:border-primary-ink", className)}>
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)} handleLabel={getHandleLabel(item, index + 1)}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {active ? (
          <div data-slot="sortable-overlay" className={cn(itemClass, "cursor-grabbing shadow-overlay")}>
            <GripVertical aria-hidden="true" className="size-icon-md text-muted-foreground" />
            <div className="min-w-0 flex-1">{renderItem(active)}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export { SortableItem, SortableList }
export type { SortableItemProps, SortableListProps }
