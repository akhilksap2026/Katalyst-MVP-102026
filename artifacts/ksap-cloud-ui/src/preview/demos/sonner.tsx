// ksap-allow: documentation examples use source terminology, not product strings.
import { Toaster, toast } from "../../components/ui/sonner";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";

export default function SonnerStory() {
  const legacy = useToast();
  return <div className="ksap-story">
    <Toaster />
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="outline" onClick={() => toast("Shipment saved", { description: "SH-20418 updated." })}>Default</Button>
      <Button variant="outline" onClick={() => toast.success("Rates imported")}>Success</Button>
      <Button variant="outline" onClick={() => toast.warning("Carrier at risk")}>Warning (7s)</Button>
      <Button variant="outline" onClick={() => toast.error("Import failed")}>Error (sticky, dismiss)</Button>
      <Button variant="outline" onClick={() => toast("Load moved", { action: { label: "Undo", onClick: () => toast("Move undone") } })}>With undo</Button>
      <Button variant="secondary" onClick={() => legacy.toast({ title: "Legacy toast", description: "Forwarded to sonner." })}>Legacy adapter</Button>
      <Button variant="secondary" onClick={() => legacy.toast({ title: "Legacy failure", variant: "destructive" })}>Legacy destructive</Button>
      <Button variant="ghost" onClick={() => legacy.dismiss()}>Dismiss all</Button>
    </div>
    <p className="text-caption text-muted-foreground">Durations: 4s default and success, 7s warning, error stays until dismissed. Toaster follows the display theme. Prefer an Undo toast for reversible actions.</p>
  </div>;
}
