// ksap-allow: documentation examples use source terminology, not product strings.
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function InputStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="grid gap-2"><Label htmlFor="input-default">Shipment reference</Label><Input id="input-default" placeholder="Enter a shipment reference" /></div>
      <div className="grid gap-2"><Label htmlFor="input-invalid">Purchase order</Label><Input id="input-invalid" aria-invalid="true" aria-describedby="input-error" defaultValue="48213" /><p id="input-error" className="text-danger text-caption">Use PO- followed by 4 to 8 digits, like PO-48213.</p></div>
      <div className="grid gap-2"><Label htmlFor="input-readonly">Record ID</Label><Input id="input-readonly" readOnly value="SHP-88214" className="font-mono" /></div>
      <div className="grid gap-2"><Label htmlFor="input-disabled">Archived record</Label><Input id="input-disabled" disabled value="SHP-22018" /></div>
    </div>
    <Guidelines items={["Validate on blur, then live after the field has been touched.","Control borders are stronger than decorative dividers. Error states pair color with a fix.","Use IBM Plex Mono only for record IDs, codes and logs."]} />
  </div>;
}