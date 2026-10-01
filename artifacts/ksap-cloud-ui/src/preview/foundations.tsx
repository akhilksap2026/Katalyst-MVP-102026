// ksap-allow: source-backed documentation is not a product localization surface.
import source from "../../tokens.json";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Field, FieldLabel, FieldDescription } from "../components/ui/field";
import { useDisplay } from "../hooks/use-display";
import { Guidelines } from "./parts";
import { Plus, Download } from "lucide-react";

const extension = source.$extensions["com.ksap.cloud"];
function useCurrentTokens() {
  const display = useDisplay();
  const dark = display.theme === "dark" || (display.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const mode = dark ? "dark" : "light";
  const values: Record<string, string> = Object.fromEntries(Object.entries(source.color[mode]).map(([name, token]) => [name, token.$value]));
  const p = extension.palettes[display.palette][mode];
  const root = getComputedStyle(document.documentElement);
  Object.assign(values, { primary: p.fill, primaryForeground: p.onFill, ring: p.ink, sidebar: p.rail, sidebarForeground: display.palette === "yellow" && !dark ? "#010D43" : "#FFFFFF", accent: root.getPropertyValue("--ksap-selected").trim(), accentForeground: root.getPropertyValue("--ksap-selected-fg").trim() });
  return values;
}
function Swatch({ name, value }: { name: string; value: string }) {
  return <div><div className={`ksap-swatch ksap-swatch-${name}`} /><p className="font-semibold text-body">{name}</p><p className="ksap-caption">{value}</p></div>;
}
export function OverviewPage() {
  const colors = useCurrentTokens();
  return <div className="ksap-story">
    <div className="ksap-pilot-grid">
      <section className="ksap-story">
        <div className="ksap-prose"><h2 className="text-heading font-semibold mb-3">An operations console, not a marketing page</h2><p>Dispatchers, planners, finance analysts and administrators need speed, density, accuracy and calm. Every visible decision comes from the supplied KSAP specification.</p></div>
        <section className="ksap-panel"><h3 className="ksap-section-title">Core palette</h3><div className="ksap-swatches">{["primary", "secondary", "accent"].map((name) => <Swatch key={name} name={name} value={colors[name]} />)}</div></section>
        <div className="ksap-grid">
          <section className="ksap-panel"><h3 className="ksap-section-title">Typography</h3><p className="text-heading font-semibold mb-2">Montserrat</p><p>400 for body. 600 for emphasis.</p><p className="ksap-caption mt-3">12 px minimum. Tabular figures.</p></section>
          <section className="ksap-panel"><h3 className="ksap-section-title">Shape and structure</h3><p>4 px spacing grid.</p><p>3, 6 and 12 px corners.</p><p className="ksap-caption mt-3">Bordered panels. No card shadows.</p></section>
        </div>
        <Guidelines items={["Do it right the first time. Constrain inputs and explain the fix.","One meaning, one look. Status colors never become the accent.","Fewest clicks. Prefer keyboard paths, bulk actions and sensible defaults."]} />
      </section>
      <section className="ksap-panel">
        <h2 className="ksap-section-title">The first five families, together</h2>
        <p className="ksap-caption mb-6">Button, Input, Textarea, Label and Field. These are the shared components, not copies in a demo.</p>
        <div className="grid gap-6">
          <section><h3 className="ksap-caption mb-2">Field with Input</h3><Field><FieldLabel htmlFor="overview-ref">Shipment reference</FieldLabel><Input id="overview-ref" placeholder="Enter a shipment reference" /><FieldDescription>Use the reference supplied by your customer.</FieldDescription></Field></section>
          <section><h3 className="ksap-caption mb-2">Label with Textarea</h3><div className="grid gap-2"><Label htmlFor="overview-notes">Delivery instructions</Label><Textarea id="overview-notes" placeholder="Add instructions for the receiving team" /></div></section>
          <section><h3 className="ksap-caption mb-2">Button</h3><div className="ksap-story-row"><Button variant="outline"><Download aria-hidden="true" />Export records</Button><Button><Plus aria-hidden="true" />Create shipment</Button></div></section>
        </div>
      </section>
    </div>
    <section className="ksap-panel"><h2 className="ksap-section-title">Source and current scope</h2><p className="ksap-prose">Built from KSAP Cloud UI DESIGN.md version 6.1 using the approved shadcn and Radix implementations. The five-family pilot is shipped; 36 remaining families are documented but intentionally not exported. Catalyst migration follows approval of this initial set.</p><p className="ksap-caption mt-3">Official wordmark files were not supplied. This preview uses a plain-text title, not a reconstructed logo.</p></section>
  </div>;
}
export function ColorsPage() {
  const values = useCurrentTokens();
  const display = useDisplay();
  const dark = display.theme === "dark" || (display.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const palette = extension.palettes[display.palette][dark ? "dark" : "light"];
  return <div className="ksap-story">
    <section><h2 className="ksap-section-title">Core palette</h2><div className="ksap-swatches">{["primary", "secondary", "accent"].map(name => <Swatch key={name} name={name} value={values[name]} />)}</div></section>
    <section className="ksap-panel"><h2 className="ksap-section-title">Fill is not always ink</h2><p>Button fill: {palette.fill}. Links, focus and indicators: {palette.ink}. Yellow uses a darker ink so links and focus remain legible.</p></section>
    <section><h2 className="ksap-section-title">Supporting roles</h2><div className="ksap-swatches">{Object.entries(values).filter(([name]) => !["primary", "secondary", "accent"].includes(name)).map(([name, value]) => <Swatch key={name} name={name} value={value} />)}</div></section>
    <section className="ksap-panel"><h2 className="ksap-section-title">Statuses stay fixed</h2><div className="ksap-story-row"><span className="text-info">Info: in transit</span><span className="text-success">Success: on time</span><span className="text-warning">Warning: at risk</span><span className="text-danger">Danger: breached</span></div></section>
    <section><h2 className="ksap-section-title">Column groups</h2><div className="ksap-grid">{(["a", "b", "c"] as const).map(group => <div key={group} className={`ksap-panel ksap-group-${group}`}><h3 className="font-semibold">Group {group.toUpperCase()}</h3><p>Named column groups only. Never a status or a second accent.</p></div>)}</div></section>
    <Guidelines items={["The active palette changes actions, ink, selection and the navigation rail. It never changes status colors or neutral surfaces.","Brand Vivid Blue #0253E9 is reserved for official logo contexts and marketing. Product action Blue is #1258B5.","No gradients on buttons, cards, charts, headers or product components."]} />
  </div>;
}
export function FontsPage() {
  return <div className="ksap-story">
    <section className="ksap-panel"><h2 className="ksap-section-title">Montserrat, 400 and 600 only</h2>
      <p className="text-display font-semibold mb-4">Display, 36 / 44</p><p className="text-title font-semibold mb-4">Title, 28 / 36</p><p className="text-heading font-semibold mb-4">Heading, 20 / 28</p><p className="text-subheading font-semibold mb-4">Subheading, 16 / 24</p><p className="text-body mb-4">Body follows density: 13 / 20, 14 / 22, or 16 / 26.</p><p className="text-caption">Caption, 12 / 16</p>
    </section>
    <section className="ksap-panel"><h2 className="ksap-section-title">IBM Plex Mono for identifiers</h2><p className="font-mono text-body">SHP-88214</p><p className="ksap-caption mt-3">Record IDs, SCACs, lane numbers, trace codes and logs. Never labels or decoration.</p></section>
    <Guidelines items={["Nothing below 12 px. No weights 300, 500, 700 or 800.","Use sentence case, not all-caps labels.","Keep prose under 80 characters per line. Tabular figures are enabled globally."]} />
  </div>;
}
export function LayoutPage() {
  const display = useDisplay();
  const density = extension.densities[display.density];
  return <div className="ksap-story">
    <section className="ksap-panel"><h2 className="ksap-section-title">Density is a preference, not a breakpoint</h2><p className="mb-4">Current: {display.density}. Body {density.body}px. Rows {density.row}px. Controls {density.control}px. Panel padding {density.pad}px.</p><div className="ksap-foundation-row">Shipment SHP-88214</div><div className="ksap-foundation-row">Shipment SHP-88215</div><div className="ksap-foundation-row">Shipment SHP-88216</div></section>
    <Guidelines items={["Use the 4 px spacing grid and named layout utilities. Never arbitrary values in markup.","Use 3 px corners for small marks, 6 px for controls and 12 px for panels.","Cards and panels use a 1 px border and no shadow. Overlays alone use overlay elevation.","Desktop has a persistent left rail; smaller screens use compact navigation. Effective touch targets stay at least 44 px."]} />
  </div>;
}
export function ContentPage() {
  return <Guidelines items={["Calm, precise, helpful. Plain verbs and sentence case.","Labels name outcomes: “Create shipment”, “Tender to carrier (3)”. Never “Submit” or “OK”.","Errors explain the fix. Say “Select a carrier certified for hazardous loads”, not “Invalid carrier”.","Status indicators use an icon or dot and a word; color is never the only signal.","No spaced em-dash labels, middle-dot metadata strings or trailing arrows."]} />;
}
export function MotionPage() {
  return <Guidelines items={["Feedback: 100 ms. Exit: 180 ms. Entrance: 240 ms. Continuous loading: 1.6 s.","Movement uses transform and opacity. Color and border changes are feedback only.","No entrance animations on page sections and no hover lifts on cards.","Reduced motion collapses transitions and animation to instant.","Loading is honest: matching skeletons for known shapes, inline activity for unknown short waits, counts for determinate progress."]} />;
}