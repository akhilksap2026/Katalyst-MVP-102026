// ksap-allow: documentation examples use source terminology, not product strings.
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function SelectStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="grid gap-2"><Label htmlFor="sel-ph">Placeholder</Label>
        <Select><SelectTrigger id="sel-ph"><SelectValue placeholder="Choose a carrier" /></SelectTrigger>
          <SelectContent><SelectGroup><SelectLabel>Carriers</SelectLabel><SelectItem value="a">Northline</SelectItem><SelectItem value="b">Harbor Freight</SelectItem></SelectGroup><SelectSeparator /><SelectItem value="c" disabled>Archived carrier</SelectItem></SelectContent></Select></div>
      <div className="grid gap-2"><Label htmlFor="sel-val">Selected</Label>
        <Select defaultValue="b"><SelectTrigger id="sel-val"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="a">Northline</SelectItem><SelectItem value="b">Harbor Freight</SelectItem></SelectContent></Select></div>
      <div className="grid gap-2"><Label htmlFor="sel-inv">Invalid</Label>
        <Select><SelectTrigger id="sel-inv" aria-invalid="true"><SelectValue placeholder="Choose a lane" /></SelectTrigger>
          <SelectContent><SelectItem value="a">Lane 1</SelectItem></SelectContent></Select>
        <p className="text-danger text-caption">Choose a lane to continue.</p></div>
      <div className="grid gap-2"><Label htmlFor="sel-dis">Disabled</Label>
        <Select disabled><SelectTrigger id="sel-dis"><SelectValue placeholder="Unavailable" /></SelectTrigger><SelectContent><SelectItem value="a">None</SelectItem></SelectContent></Select></div>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Enter, Space or arrows open; arrows and type-ahead move; Enter selects; Esc closes.</p>
    <Guidelines items={["Use for choosing one option from a list of five or more.","Placeholder text describes the choice, never replaces the label."]} />
  </div>;
}
