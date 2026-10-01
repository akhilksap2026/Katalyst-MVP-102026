// ksap-allow: documentation examples use source terminology, not product strings.
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Guidelines } from "../parts";

export default function DropdownMenuStory() {
  return <div className="ksap-story">
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Shipment</DropdownMenuLabel>
        <DropdownMenuItem>Open<DropdownMenuShortcut>Enter</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem disabled>Tender to carrier</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked>Show stops</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value="a"><DropdownMenuRadioItem value="a">Standard</DropdownMenuRadioItem><DropdownMenuRadioItem value="b">Relaxed</DropdownMenuRadioItem></DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub><DropdownMenuSubTrigger>More</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>Export</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Delete shipment</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <p className="text-caption text-muted-foreground">Deletion is disabled in the component catalog. Product deletion requires typed record confirmation.</p>
    <p className="text-caption text-muted-foreground">Keyboard: Enter, Space or arrow opens; arrows and type-ahead move; Right opens a submenu; Esc closes.</p>
    <Guidelines items={["Every shortcut is shown next to its action."]} />
  </div>;
}
