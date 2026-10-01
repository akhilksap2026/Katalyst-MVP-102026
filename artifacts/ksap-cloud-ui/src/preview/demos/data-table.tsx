// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../components/ui/badge";
import { DataTable, DataTableColumnHeader, selectColumn } from "../../components/ui/data-table";
import { TableHead, TableRow } from "../../components/ui/table";
import { Toaster, toast } from "../../components/ui/sonner";
import { Button } from "../../components/ui/button";
import { Guidelines } from "../parts";

type Lane = { id: string; lane: string; status: "success" | "warning" | "danger" | "info"; label: string; spot: number; contract: number };

// Fixture: small documented sample values used only to show table states.
const data: Lane[] = [
  { id: "1", lane: "CHI to DAL", status: "success", label: "On time", spot: 1240, contract: 1180 },
  { id: "2", lane: "LAX to PHX", status: "danger", label: "Breached", spot: 860, contract: 820 },
  { id: "3", lane: "ATL to MIA", status: "warning", label: "At risk", spot: 990, contract: 940 },
  { id: "4", lane: "SEA to PDX", status: "info", label: "Tendered", spot: 410, contract: 395 },
  { id: "5", lane: "DEN to SLC", status: "success", label: "On time", spot: 720, contract: 690 },
  { id: "6", lane: "HOU to MEM", status: "info", label: "In transit", spot: 780, contract: 760 },
  { id: "7", lane: "BOS to NYC", status: "warning", label: "Expiring", spot: 350, contract: 330 },
];

const columns: ColumnDef<Lane, any>[] = [
  selectColumn<Lane>(),
  { accessorKey: "lane", header: ({ column }) => <DataTableColumnHeader column={column} title="Lane" label="Sort by lane" /> },
  { accessorKey: "status", enableSorting: false, header: "Status", cell: ({ row }) => <Badge variant={row.original.status}>{row.original.label}</Badge> },
  { accessorKey: "spot", meta: { group: "a", align: "end" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" label="Sort by spot rate" /> },
  { accessorKey: "contract", meta: { group: "b", align: "end" }, header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" label="Sort by contract rate" /> },
];

export default function DataTableStory() {
  const [failed, setFailed] = useState(false);
  return <div className="ksap-story">
    <Toaster />
    <DataTable
      columns={columns}
      data={failed ? [] : data}
      caption="Lane rates with sorting, filter, selection and pagination."
      getRowId={(row) => row.id}
      filterColumn="lane"
      pageSize={4}
      error={failed}
      onRetry={() => setFailed(false)}
      onOpenRow={(row) => toast(`Opened ${row.original.lane}`)}
      groupHeader={<TableRow>
        <TableHead colSpan={3} />
        <TableHead group="a" scope="colgroup">Spot quote</TableHead>
        <TableHead group="b" scope="colgroup">Contract rate</TableHead>
      </TableRow>}
    />
    <div className="ksap-story-row">
      <Button variant="outline" onClick={() => setFailed(true)}>Show load failure</Button>
    </div>
    <Guidelines items={[
      "Focus a row, then press Enter to open it or X to select it.",
      "Sorting, filter and pagination change state in place and keep the header sticky within the grid.",
      { kind: "dont", text: "Hide a load failure inside an empty table. Name it and offer Retry." },
    ]} />
  </div>;
}
