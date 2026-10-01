// ksap-allow: documentation examples use source terminology, not product strings.
import { Kbd, KbdGroup } from "../../components/ui/kbd";
import { Row } from "../parts";

export default function KbdStory() {
  return <div className="ksap-story">
    <Row label="Single key"><Kbd aria-label="Question mark">?</Kbd><Kbd>Esc</Kbd></Row>
    <Row label="Combination">
      <KbdGroup aria-label="Control plus K"><Kbd>Ctrl</Kbd><span aria-hidden="true">+</span><Kbd>K</Kbd></KbdGroup>
    </Row>
    <Row label="Sequence">
      <KbdGroup aria-label="G then S"><Kbd>G</Kbd><span className="text-caption text-muted-foreground">then</span><Kbd>S</Kbd></KbdGroup>
    </Row>
  </div>;
}
