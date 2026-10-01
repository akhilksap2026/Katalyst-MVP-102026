// ksap-allow: documentation examples use source terminology, not product strings.
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableColGroup, TableFooter, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Guidelines } from "../parts";

export default function TableStory() {
  return <div className="ksap-story">
    <Table>
      <TableCaption>Lane rates with column groups A, B and C. Compact, standard and relaxed densities (32, 40 and 48 px rows) follow the global density selection in the toolbar.</TableCaption>
      <TableColGroup span={2} />
      <TableColGroup group="a" span={2} />
      <TableColGroup group="b" span={1} />
      <TableColGroup group="c" span={2} />
      <TableHeader>
        <TableRow>
          <TableHead colSpan={2} />
          <TableHead group="a" colSpan={2} scope="colgroup">Spot quote</TableHead>
          <TableHead group="b" scope="colgroup">Contract rate</TableHead>
          <TableHead group="c" colSpan={2} scope="colgroup">Forecast</TableHead>
        </TableRow>
        <TableRow>
          <TableHead>Lane</TableHead>
          <TableHead>Status</TableHead>
          <TableHead group="a" className="text-end">Rate</TableHead>
          <TableHead group="a">Valid</TableHead>
          <TableHead group="b" className="text-end">Rate</TableHead>
          <TableHead group="c" className="text-end">Volume</TableHead>
          <TableHead group="c">Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>CHI to DAL</TableCell>
          <TableCell><Badge variant="success">On time</Badge></TableCell>
          <TableCell group="a" className="text-end">1,240</TableCell>
          <TableCell group="a"><Badge variant="warning">At risk</Badge></TableCell>
          <TableCell group="b" className="text-end">1,180</TableCell>
          <TableCell group="c" className="text-end">320</TableCell>
          <TableCell group="c">Peak season</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell>LAX to PHX</TableCell>
          <TableCell><Badge variant="danger">Breached</Badge></TableCell>
          <TableCell group="a" className="text-end">860</TableCell>
          <TableCell group="a"><Badge variant="info">Tendered</Badge></TableCell>
          <TableCell group="b" className="text-end">820</TableCell>
          <TableCell group="c" className="text-end">145</TableCell>
          <TableCell group="c">Review</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter><TableRow><TableCell colSpan={4}>Average</TableCell><TableCell className="text-end">1,000</TableCell><TableCell colSpan={2} /></TableRow></TableFooter>
    </Table>
    <Guidelines items={[
      { kind: "do", text: "Name every column group with a header spanning its columns." },
      { kind: "dont", text: "Use groups for status, single cells or rows." },
    ]} />
  </div>;
}
