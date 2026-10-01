// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "../../components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Button } from "../../components/ui/button";

const carriers = [
  { value: "maersk", label: "Maersk" },
  { value: "msc", label: "MSC" },
  { value: "hapag", label: "Hapag-Lloyd" },
  { value: "cma", label: "CMA CGM" },
];

export default function CommandStory() {
  const [palette, setPalette] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const selected = carriers.find((c) => c.value === value);
  return <div className="ksap-story">
    <div className="grid gap-4 md:grid-cols-split">
      <Command className="rounded-lg border border-border">
        <CommandInput placeholder="Search actions" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Recent">
            <CommandItem>SH-20418<CommandShortcut>Shipment</CommandShortcut></CommandItem>
            <CommandItem>SH-20397<CommandShortcut>Shipment</CommandShortcut></CommandItem>
            <CommandItem>LN-0042<CommandShortcut>Lane</CommandShortcut></CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            <CommandItem>Shipments<CommandShortcut>G S</CommandShortcut></CommandItem>
            <CommandItem>Dispatch board<CommandShortcut>G B</CommandShortcut></CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions"><CommandItem>New shipment<CommandShortcut>N</CommandShortcut></CommandItem><CommandItem disabled>Archive</CommandItem></CommandGroup>
        </CommandList>
      </Command>
      <div className="flex flex-col items-start gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={open}>{selected ? selected.label : "Select carrier"}<ChevronsUpDown className="size-icon-md" /></Button></PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search carriers" />
              <CommandList><CommandEmpty>No carrier found.</CommandEmpty>
                <CommandGroup>{carriers.map((c) => <CommandItem key={c.value} value={c.value} keywords={[c.label]}
                  onSelect={(v) => { setValue(v === value ? "" : v); setOpen(false); }}>
                  <Check className={value === c.value ? "size-icon-md" : "size-icon-md invisible"} />{c.label}</CommandItem>)}</CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button variant="secondary" onClick={() => setPalette(true)}>Open command dialog</Button>
      </div>
    </div>
    <CommandDialog open={palette} onOpenChange={setPalette} title="Command dialog" description="Search destinations; title and description are read by screen readers only.">
      <CommandInput placeholder="Type a command" />
      <CommandList><CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to"><CommandItem onSelect={() => setPalette(false)}>Shipments</CommandItem><CommandItem onSelect={() => setPalette(false)}>Dispatch board</CommandItem></CommandGroup>
      </CommandList>
    </CommandDialog>
    <p className="text-caption text-muted-foreground">Keyboard: arrows move, Enter selects, Esc closes. The combobox is controlled and built from Command inside Popover.</p>
  </div>;
}
