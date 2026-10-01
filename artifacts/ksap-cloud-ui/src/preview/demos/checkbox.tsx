// ksap-allow: documentation examples use source terminology, not product strings.
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function CheckboxStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="flex items-center gap-2"><Checkbox id="cb-off" /><Label htmlFor="cb-off">Unchecked</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="cb-on" defaultChecked /><Label htmlFor="cb-on">Checked</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="cb-mixed" checked="indeterminate" /><Label htmlFor="cb-mixed">Indeterminate</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="cb-invalid" aria-invalid="true" /><Label htmlFor="cb-invalid">Invalid: accept the terms</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="cb-dis" disabled /><Label htmlFor="cb-dis">Disabled</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="cb-dis-on" disabled defaultChecked /><Label htmlFor="cb-dis-on">Disabled checked</Label></div>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Tab to focus, Space toggles. Pair every checkbox with a Label.</p>
    <Guidelines items={["Use a checkbox for independent choices and bulk selection.","Indeterminate shows partial selection of a group.","Invalid state pairs color with an explanation nearby."]} />
  </div>;
}
