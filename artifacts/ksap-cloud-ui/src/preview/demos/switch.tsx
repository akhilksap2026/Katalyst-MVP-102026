// ksap-allow: documentation examples use source terminology, not product strings.
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Guidelines } from "../parts";

export default function SwitchStory() {
  return <div className="ksap-story">
    <div className="ksap-grid">
      <div className="flex items-center gap-2"><Switch id="sw-off" /><Label htmlFor="sw-off">Off</Label></div>
      <div className="flex items-center gap-2"><Switch id="sw-on" defaultChecked /><Label htmlFor="sw-on">On</Label></div>
      <div className="flex items-center gap-2"><Switch id="sw-dis" disabled /><Label htmlFor="sw-dis">Disabled off</Label></div>
      <div className="flex items-center gap-2"><Switch id="sw-dis-on" disabled defaultChecked /><Label htmlFor="sw-dis-on">Disabled on</Label></div>
    </div>
    <p className="text-caption text-muted-foreground">Keyboard: Tab to focus, Space toggles. Role is switch.</p>
    <Guidelines items={["A switch applies immediately; use a checkbox when a form needs saving.","Label names the setting, not the action."]} />
  </div>;
}
