// ksap-allow: documentation examples use source terminology, not product strings.
import { Slider } from "../../components/ui/slider";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function SliderStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="grid gap-2"><Label id="sl-1">Single value</Label><Slider aria-labelledby="sl-1" defaultValue={[40]} max={100} step={1} /></div>
      <div className="grid gap-2"><Label id="sl-2">Range</Label><Slider aria-label="Range" defaultValue={[20, 70]} max={100} step={5} /></div>
      <div className="grid gap-2"><Label id="sl-3">Disabled</Label><Slider aria-labelledby="sl-3" defaultValue={[50]} max={100} disabled /></div>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: arrows step, Page Up and Page Down jump, Home and End reach the limits.</p>
    <Guidelines items={["Use a slider for approximate values; show the exact value in text.","Range sliders render one thumb per value."]} />
  </div>;
}
