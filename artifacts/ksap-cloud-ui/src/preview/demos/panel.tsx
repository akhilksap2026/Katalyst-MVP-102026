// ksap-allow: documentation examples use source terminology, not product strings.
import { Button } from "../../components/ui/button";
import {
  Panel, PanelHeader, PanelTitle, PanelDescription, PanelAction, PanelContent, PanelFooter,
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter,
} from "../../components/patterns/panel";

export default function PanelStory() {
  return <div className="ksap-story">
    <Panel>
      <PanelHeader>
        <PanelTitle>Carrier details</PanelTitle>
        <PanelDescription>Contact and service levels.</PanelDescription>
        <PanelAction><Button variant="outline">Edit</Button></PanelAction>
      </PanelHeader>
      <PanelContent>Preferred on lanes in the Midwest.</PanelContent>
      <PanelFooter><Button>Save changes</Button></PanelFooter>
    </Panel>
    <Card>
      <CardHeader>
        <CardTitle>Card alias</CardTitle>
        <CardDescription>Same surface for existing consumers.</CardDescription>
        <CardAction><Button variant="outline">Edit</Button></CardAction>
      </CardHeader>
      <CardContent>Body content.</CardContent>
      <CardFooter><Button>Save changes</Button></CardFooter>
    </Card>
  </div>;
}
