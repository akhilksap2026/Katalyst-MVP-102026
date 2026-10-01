// ksap-allow: documentation examples use source terminology, not product strings.
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function TextareaStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="grid gap-2"><Label htmlFor="notes">Delivery instructions</Label><Textarea id="notes" placeholder="Add instructions for the receiving team" /></div>
      <div className="grid gap-2"><Label htmlFor="notes-invalid">Exception details</Label><Textarea id="notes-invalid" aria-invalid="true" aria-describedby="notes-error" /><p id="notes-error" className="text-danger text-caption">Describe what changed and the next action.</p></div>
      <div className="grid gap-2"><Label htmlFor="notes-readonly">Saved instructions</Label><Textarea id="notes-readonly" readOnly value="Use dock 4. Contact the receiving team before arrival." /></div>
      <div className="grid gap-2"><Label htmlFor="notes-disabled">Archived instructions</Label><Textarea id="notes-disabled" disabled value="Instructions for this record are archived." /></div>
    </div>
    <Guidelines items={["Calm, precise, helpful copy. Sentence case and plain verbs.","Keep prose under 80 characters per line.","Help belongs directly beneath the field it explains."]} />
  </div>;
}