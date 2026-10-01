// ksap-allow: documentation examples use source terminology, not product strings.
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Guidelines } from "../parts";

export default function LabelStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="grid gap-2"><Label htmlFor="label-reference">Shipment reference</Label><Input id="label-reference" placeholder="Click the label to focus this field" /></div>
      <div className="grid gap-2"><Label htmlFor="label-required">Carrier code (required)</Label><Input id="label-required" required placeholder="Enter a carrier code" /></div>
      <div className="grid gap-2"><Input id="label-disabled" disabled value="Archived carrier" className="peer" /><Label htmlFor="label-disabled">Archived carrier</Label></div>
    </div>
    <Guidelines items={["Labels use Montserrat 600 and sentence case. Never all caps.","Associate every field with its label. A placeholder is not a label.","Required fields use words as well as programmatic required semantics."]} />
  </div>;
}