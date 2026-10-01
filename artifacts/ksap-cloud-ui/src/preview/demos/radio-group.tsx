// ksap-allow: documentation examples use source terminology, not product strings.
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function RadioGroupStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <RadioGroup defaultValue="ltl" aria-label="Service level">
        <div className="flex items-center gap-2"><RadioGroupItem value="ltl" id="rg-ltl" /><Label htmlFor="rg-ltl">Less than truckload</Label></div>
        <div className="flex items-center gap-2"><RadioGroupItem value="ftl" id="rg-ftl" /><Label htmlFor="rg-ftl">Full truckload</Label></div>
        <div className="flex items-center gap-2"><RadioGroupItem value="par" id="rg-par" /><Label htmlFor="rg-par">Parcel</Label></div>
      </RadioGroup>
      <RadioGroup defaultValue="b" disabled aria-label="Disabled group">
        <div className="flex items-center gap-2"><RadioGroupItem value="a" id="rg-da" /><Label htmlFor="rg-da">Unselected disabled</Label></div>
        <div className="flex items-center gap-2"><RadioGroupItem value="b" id="rg-db" /><Label htmlFor="rg-db">Selected disabled</Label></div>
      </RadioGroup>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Tab enters the group, arrow keys move and select, Tab leaves.</p>
    <Guidelines items={["Use radios for one choice among a short, visible list.","Preselect the sensible default."]} />
  </div>;
}
