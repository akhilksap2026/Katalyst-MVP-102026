// ksap-allow: documentation examples use source terminology, not product strings.
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Row } from "../parts";

export default function AvatarStory() {
  return <div className="ksap-story">
    <Row label="Initials">
      <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
      <Avatar className="size-8"><AvatarFallback>KS</AvatarFallback></Avatar>
      <Avatar className="size-6"><AvatarFallback>JD</AvatarFallback></Avatar>
    </Row>
    <Row label="Image and fallback">
      <Avatar><AvatarImage src="data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23DBEAFE%27/%3E%3Ctext x=%2720%27 y=%2726%27 font-size=%2716%27 text-anchor=%27middle%27 fill=%27%2310284A%27%3EAB%3C/text%3E%3C/svg%3E" alt="Alex Brown" /><AvatarFallback>AB</AvatarFallback></Avatar>
      <Avatar><AvatarImage alt="Kim Shaw" /><AvatarFallback>KS</AvatarFallback></Avatar>
    </Row>
  </div>;
}
