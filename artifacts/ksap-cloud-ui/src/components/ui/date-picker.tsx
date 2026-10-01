import * as React from "react"
import { CalendarDays } from "lucide-react"
import { addDays, format, nextMonday, startOfDay } from "date-fns"

import { isSelectableDate } from "../../lib/table-logic"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

type DatePickerPreset = { label: string; resolve: (today: Date) => Date }

/** Source presets. Next Monday is always after today, so on a Monday it is the following week. */
const defaultDatePresets: DatePickerPreset[] = [
  { label: "Tomorrow", resolve: (today) => addDays(today, 1) },
  { label: "In 2 days", resolve: (today) => addDays(today, 2) },
  { label: "Next Monday", resolve: (today) => nextMonday(today) },
  { label: "In a week", resolve: (today) => addDays(today, 7) },
]

type DatePickerProps = {
  id?: string
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  /** Earliest selectable date. Earlier days are disabled. */
  minDate?: Date
  presets?: DatePickerPreset[]
  placeholder: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function DatePicker({ id, value, onValueChange, minDate, presets = defaultDatePresets, placeholder, disabled, ...aria }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const select = (date: Date | undefined) => {
    if (date && !isSelectableDate(date, minDate)) return
    onValueChange?.(date)
    setOpen(false)
  }
  const floor = minDate ? startOfDay(minDate) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled} className="w-full justify-start" {...aria}>
          <CalendarDays aria-hidden="true" />
          {value ? format(value, "PPP") : <span className="font-normal text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b p-3">
            {presets.map((preset) => (
              <Button key={preset.label} type="button" size="sm" variant="secondary" disabled={!isSelectableDate(preset.resolve(startOfDay(new Date())), minDate)} onClick={() => select(preset.resolve(startOfDay(new Date())))}>
                {preset.label}
              </Button>
            ))}
          </div>
        ) : null}
        <Calendar
          mode="single"
          numberOfMonths={2}
          selected={value}
          onSelect={select}
          defaultMonth={value ?? floor}
          disabled={floor ? { before: floor } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, defaultDatePresets }
export type { DatePickerProps, DatePickerPreset }
