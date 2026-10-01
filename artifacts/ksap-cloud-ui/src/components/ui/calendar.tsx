import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      data-slot="calendar"
      className={cn("bg-popover p-3 text-body", className)}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
        month: cn("flex flex-col gap-3", d.month),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", d.nav),
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "p-0 aria-disabled:opacity-40", d.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "p-0 aria-disabled:opacity-40", d.button_next),
        month_caption: cn("flex h-control items-center justify-center font-semibold", d.month_caption),
        caption_label: cn("select-none font-semibold", d.caption_label),
        month_grid: cn("w-full border-collapse", d.month_grid),
        weekdays: cn("flex", d.weekdays),
        weekday: cn("size-control flex-1 select-none text-caption font-normal text-muted-foreground", d.weekday),
        week: cn("mt-1 flex w-full", d.week),
        day: cn("group/day relative size-control flex-1 p-0 text-center", d.day),
        day_button: cn(
          "size-control w-full rounded-md font-normal hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[disabled=true]/day:cursor-not-allowed group-data-[disabled=true]/day:text-disabled group-data-[disabled=true]/day:hover:bg-transparent",
          d.day_button
        ),
        selected: cn("[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary", d.selected),
        today: cn("[&>button]:shadow-hairline [&>button]:font-semibold", d.today),
        outside: cn("text-muted-foreground", d.outside),
        disabled: cn("text-disabled", d.disabled),
        hidden: cn("invisible", d.hidden),
        range_start: cn("rounded-s-md", d.range_start),
        range_end: cn("rounded-e-md", d.range_end),
        range_middle: cn("bg-accent text-accent-foreground [&>button]:bg-transparent [&>button]:text-accent-foreground", d.range_middle),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? (
            <ChevronLeft aria-hidden="true" className={cn("size-icon-md rtl:rotate-180", c)} />
          ) : (
            <ChevronRight aria-hidden="true" className={cn("size-icon-md rtl:rotate-180", c)} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
