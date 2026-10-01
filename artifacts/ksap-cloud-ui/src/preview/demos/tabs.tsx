// ksap-allow: documentation examples use source terminology, not product strings.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Guidelines } from "../parts";

export default function TabsStory() {
  return <div className="ksap-story">
    <Tabs defaultValue="details" className="max-w-sheet">
      <TabsList aria-label="Shipment sections">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="stops">Stops</TabsTrigger>
        <TabsTrigger value="docs" disabled>Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Active tab shows an ink underline and 600 weight.</TabsContent>
      <TabsContent value="stops">Inactive tabs use secondary text.</TabsContent>
    </Tabs>
    <p className="text-caption text-muted-foreground">Keyboard: arrows move between tabs; Home and End jump; Tab enters the panel.</p>
    <Guidelines items={["Tab switches replace history; state lives in the URL."]} />
  </div>;
}
