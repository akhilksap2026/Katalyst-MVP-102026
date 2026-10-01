// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { SortableList } from "../../components/ui/sortable-item";
import { Toaster, toast } from "../../components/ui/sonner";
import { Guidelines } from "../parts";

type Stop = { id: string; name: string };

// Fixture: three stops used to demonstrate reordering.
const initial: Stop[] = [
  { id: "stop-1", name: "Chicago cross dock" },
  { id: "stop-2", name: "St. Louis hub" },
  { id: "stop-3", name: "Dallas distribution center" },
];

const getId = (stop: Stop) => stop.id;

export default function SortableItemStory() {
  const [stops, setStops] = useState(initial);
  return <div className="ksap-story">
    <Toaster />
    <SortableList
      items={stops}
      getId={getId}
      getHandleLabel={(stop, position) => `Reorder ${stop.name}, position ${position}`}
      renderItem={(stop) => <span className="font-semibold">{stop.name}</span>}
      onReorder={(next, previous) => {
        setStops(next);
        toast("Stops reordered", { duration: 5000, action: { label: "Undo", onClick: () => setStops(previous) } });
      }}
    />
    <Guidelines items={[
      "Press Space on the handle to pick up, arrows to move, Space to drop and Esc to cancel.",
      "The source fades, the lifted overlay follows the pointer, and the list outlines as a drop zone.",
      "Every drop offers Undo for 5 seconds.",
    ]} />
  </div>;
}
