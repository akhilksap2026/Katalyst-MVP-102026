// ksap-allow: documentation examples use source terminology, not product strings.
import { Separator } from "../../components/ui/separator";

export default function SeparatorStory() {
  return <div className="ksap-story">
    <div className="flex flex-col gap-3"><span className="text-body">Shipments</span><Separator /><span className="text-body">Lanes</span></div>
    <div className="flex h-6 items-center gap-3"><span className="text-body">Rates</span><Separator orientation="vertical" /><span className="text-body">Invoices</span></div>
  </div>;
}
