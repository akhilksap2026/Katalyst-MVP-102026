// ksap-allow: documentation examples use source terminology, not product strings.
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "../../components/ui/context-menu";

export default function ContextMenuStory() {
  return <div className="ksap-story">
    <ContextMenu>
      <ContextMenuTrigger className="flex h-24 max-w-sheet items-center justify-center rounded-lg border border-dashed border-input text-body text-muted-foreground">Right click or long press</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Row</ContextMenuLabel>
        <ContextMenuItem>Open<ContextMenuShortcut>Enter</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem disabled>Cancel shipment</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>Selected</ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
    <p className="text-caption text-muted-foreground">Keyboard: Shift F10 or the Menu key opens; arrows move; Esc closes.</p>
  </div>;
}
