// ksap-allow: documentation examples use source terminology, not product strings.
import { Plus, Download, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Guidelines } from "../parts";

export default function ButtonStory() {
  return <div className="ksap-story">
    <div className="ksap-story-row">
      <Button><Plus aria-hidden="true" />Create shipment</Button>
      <Button variant="secondary">View shipment</Button>
      <Button variant="outline"><Download aria-hidden="true" />Export records</Button>
      <Button variant="ghost">Keep shipment</Button>
      <Button variant="link">Go to shipments</Button>
      <Button variant="destructive"><Trash2 aria-hidden="true" />Cancel shipment</Button>
    </div>
    <section><h2 className="ksap-section-title">Sizes</h2><div className="ksap-story-row">
      <Button size="sm">Add stop</Button><Button>Create shipment</Button><Button size="lg">Tender to carrier</Button>
      <Button size="icon" aria-label="Create shipment"><Plus aria-hidden="true" /></Button>
    </div></section>
    <section><h2 className="ksap-section-title">Honest working state</h2><div className="ksap-story-row">
      <Button loading>Export records</Button><Button disabled>Previous step</Button>
      <Button asChild variant="link"><a href="#inputs">Open input examples</a></Button>
    </div><p className="ksap-caption mt-3">Loading keeps the button’s width and accessible name. Repeat presses are ignored.</p></section>
    <Guidelines items={["One primary action per surface. Labels name outcomes, not “Submit” or “OK”.","Press feedback takes 100 ms and moves the control down 1 px.","Red palette uses outlined destructive buttons so a primary action cannot be mistaken for deletion."]} />
  </div>;
}