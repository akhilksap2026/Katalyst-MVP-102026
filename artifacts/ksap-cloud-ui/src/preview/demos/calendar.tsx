// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "../../components/ui/calendar";
import { DatePicker, defaultDatePresets } from "../../components/ui/date-picker";
import { Row, Stack } from "../parts";
import { Guidelines } from "../parts";

export default function CalendarStory() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [pickup, setPickup] = useState<Date | undefined>(undefined);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const today = startOfDay(new Date());
  return <div className="ksap-story">
    <Row label="Calendar">
      <Stack label="Controlled">
        <Calendar mode="single" selected={selected} onSelect={setSelected} />
      </Stack>
      <Stack label="Uncontrolled with a minimum date">
        <Calendar mode="single" disabled={{ before: today }} />
      </Stack>
    </Row>
    <Stack label="Range, controlled">
      <Calendar mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />
      <p className="text-caption text-muted-foreground" aria-live="polite">
        {range?.from ? `Start ${format(range.from, "PPP")}. End ${range.to ? format(range.to, "PPP") : "not chosen"}.` : "Choose a start and an end date."}
      </p>
    </Stack>
    <Stack label="Date picker with minimum date and presets">
      <div className="max-w-sheet">
        <DatePicker id="pickup" value={pickup} onValueChange={setPickup} minDate={today} presets={defaultDatePresets} placeholder="Choose a pickup date" />
      </div>
    </Stack>
    <Guidelines items={[
      "Constrain the earliest date instead of validating after the fact.",
      "Arrow keys move by day and week, Page Up and Page Down by month, Enter selects.",
      "Two months show side by side on desktop and stack on small screens.",
    ]} />
  </div>;
}
