// ksap-allow: documentation examples use source terminology, not product strings.
import { Progress } from "../../components/ui/progress";
import { Stack } from "../parts";

export default function ProgressStory() {
  return <div className="ksap-story">
    <Stack label="0%"><Progress value={0} aria-label="Import progress" /></Stack>
    <Stack label="6,400 of 10,000 rows"><Progress value={64} aria-label="Rows imported" /></Stack>
    <Stack label="Unknown">
      <span id="progress-loading-label" className="text-body">Loading rows…</span>
      <Progress value={null} aria-labelledby="progress-loading-label" />
    </Stack>
    <Stack label="Complete"><Progress value={100} aria-label="Complete" /></Stack>
  </div>;
}
