// ksap-allow: documentation examples use source terminology, not product strings.
import { StatusBadge } from "../../components/patterns/status-badge";
import { Row } from "../parts";

export default function StatusBadgeStory() {
  return <div className="ksap-story">
    <Row label="Icon and word">
      <StatusBadge status="neutral" /><StatusBadge status="info" /><StatusBadge status="success" /><StatusBadge status="warning" /><StatusBadge status="danger" />
    </Row>
    <Row label="Dot and word">
      <StatusBadge status="neutral" indicator="dot" /><StatusBadge status="info" indicator="dot" /><StatusBadge status="success" indicator="dot" /><StatusBadge status="warning" indicator="dot" /><StatusBadge status="danger" indicator="dot" />
    </Row>
  </div>;
}
