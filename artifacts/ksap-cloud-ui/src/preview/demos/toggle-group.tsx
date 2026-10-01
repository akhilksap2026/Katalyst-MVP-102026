// ksap-allow: documentation examples use source terminology, not product strings.
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { Toggle } from "../../components/ui/toggle";
import { Guidelines } from "../parts";

export default function ToggleGroupStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <ToggleGroup type="single" defaultValue="day" aria-label="Range">
        <ToggleGroupItem value="day">Day</ToggleGroupItem><ToggleGroupItem value="week">Week</ToggleGroupItem><ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" variant="outline" defaultValue={["left"]} aria-label="Alignment">
        <ToggleGroupItem value="left" aria-label="Left"><AlignLeft /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Center"><AlignCenter /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Right"><AlignRight /></ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="sm" disabled aria-label="Disabled">
        <ToggleGroupItem value="a">Small</ToggleGroupItem><ToggleGroupItem value="b">Disabled</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="lg" defaultValue="a" aria-label="Large">
        <ToggleGroupItem value="a">Large</ToggleGroupItem><ToggleGroupItem value="b">Target</ToggleGroupItem>
      </ToggleGroup>
      <Toggle aria-label="Single toggle" variant="outline">Pinned</Toggle>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Tab enters the group, arrows move focus, Space or Enter toggles.</p>
    <Guidelines items={["Use for view modes and filters with two to five options.","Icon-only items need an aria-label."]} />
  </div>;
}
