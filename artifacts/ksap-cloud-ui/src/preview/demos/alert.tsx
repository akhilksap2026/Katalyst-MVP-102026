// ksap-allow: documentation examples use source terminology, not product strings.
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Guidelines } from "../parts";

export default function AlertStory() {
  return <div className="ksap-story">
    <Alert><AlertTitle>Default</AlertTitle><AlertDescription>Neutral note without status.</AlertDescription></Alert>
    <Alert variant="info"><AlertTitle>Information</AlertTitle><AlertDescription>Tender sent to the carrier.</AlertDescription></Alert>
    <Alert variant="success"><AlertTitle>Saved</AlertTitle><AlertDescription>Rates were published.</AlertDescription></Alert>
    <Alert variant="warning"><AlertTitle>Expiring</AlertTitle><AlertDescription>Contract ends in 5 days.</AlertDescription></Alert>
    <Alert variant="error"><AlertTitle>Sync failed</AlertTitle><AlertDescription>Check the integration and retry.</AlertDescription></Alert>
    <Guidelines items={[{ kind: "do", text: "Explain the fix in the description." }]} />
  </div>;
}
