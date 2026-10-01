// ksap-allow: documentation examples use source terminology, not product strings.
import { Badge } from "../../components/ui/badge";
import { Row } from "../parts";
import { Guidelines } from "../parts";

export default function BadgeStory() {
  return <div className="ksap-story">
    <Row label="Variants (icon and word)">
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="info">In transit</Badge>
      <Badge variant="success">On time</Badge>
      <Badge variant="warning">At risk</Badge>
      <Badge variant="danger">Breached</Badge>
    </Row>
    <Row label="Legacy aliases">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </Row>
    <Row label="asChild"><Badge variant="outline" asChild><a href="#">Linked badge</a></Badge></Row>
    <Row label="Without icon (word only)"><Badge variant="success" icon={false}>On time</Badge></Row>
    <Guidelines items={[
      { kind: "do", text: "Always pair status colour with its word and icon." },
      { kind: "dont", text: "Use a badge colour for decoration or as an accent." },
    ]} />
  </div>;
}
