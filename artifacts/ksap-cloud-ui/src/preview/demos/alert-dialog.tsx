// ksap-allow: documentation examples use source terminology, not product strings.
import { useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const RECORD = "SH-20418";

export default function AlertDialogStory() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reset = (next: boolean) => { setOpen(next); if (!next) { setValue(""); setInvalid(false); } };
  return <div className="ksap-story">
    <AlertDialog open={open} onOpenChange={reset}>
      <AlertDialogTrigger asChild><Button variant="destructive">Delete shipment</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete shipment {RECORD}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone. The shipment, its stops and its documents are removed permanently.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="ad-confirm">Type {RECORD} to confirm</Label>
          <Input id="ad-confirm" ref={inputRef} value={value} aria-invalid={invalid || undefined} autoComplete="off"
            onChange={(e) => { setValue(e.target.value); setInvalid(false); }} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep shipment</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
            if (value !== RECORD) { e.preventDefault(); setInvalid(true); inputRef.current?.focus(); return; }
            // No server in the story: the dialog only closes; nothing is reported as deleted.
            reset(false);
          }}>Delete shipment</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <p className="text-caption text-muted-foreground">The confirm button stays live. A wrong entry keeps the dialog open and focuses the field. Reserve this for irreversible actions.</p>
  </div>;
}
