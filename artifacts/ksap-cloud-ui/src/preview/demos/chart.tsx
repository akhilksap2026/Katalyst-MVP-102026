// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../../components/ui/chart";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Guidelines } from "../parts";

// Fixture: small documented sample values, not product analytics.
const data = [
  { day: "Mon", tendered: 12, accepted: 9 },
  { day: "Tue", tendered: 15, accepted: 14 },
  { day: "Wed", tendered: 9, accepted: 4 },
  { day: "Thu", tendered: 14, accepted: 12 },
];

const config = {
  tendered: { label: "Tendered", color: "var(--color-chart-2)" },
  accepted: { label: "Accepted", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export default function ChartStory() {
  const [asTable, setAsTable] = useState(false);
  return <div className="ksap-story">
    {asTable ? (
      <Table>
        <TableCaption>Loads tendered and accepted per day, sample values.</TableCaption>
        <TableHeader><TableRow><TableHead>Day</TableHead><TableHead className="text-end">Tendered</TableHead><TableHead className="text-end">Accepted</TableHead></TableRow></TableHeader>
        <TableBody>{data.map((d) => <TableRow key={d.day}><TableCell>{d.day}</TableCell><TableCell className="text-end">{d.tendered}</TableCell><TableCell className="text-end">{d.accepted}</TableCell></TableRow>)}</TableBody>
      </Table>
    ) : (
      <ChartContainer config={config} className="max-w-page">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="tendered" fill="var(--color-tendered)" radius={3} />
          <Bar dataKey="accepted" fill="var(--color-accepted)" radius={3} />
        </BarChart>
      </ChartContainer>
    )}
    <div className="ksap-story-row">
      <Button variant="outline" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>{asTable ? "Show as chart" : "Show as table"}</Button>
    </div>
    <Guidelines items={[
      "Accent marks the one series the chart is about; the muted series gives context.",
      "Offer the same values as a table for screen readers and exact reading.",
    ]} />
  </div>;
}
