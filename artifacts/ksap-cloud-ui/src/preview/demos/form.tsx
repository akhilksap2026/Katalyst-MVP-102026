// ksap-allow: documentation examples use source terminology, not product strings.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form";
import { Toaster, toast } from "../../components/ui/sonner";
import { Guidelines } from "../parts";

const schema = z.object({
  po: z.string().regex(/^PO-\d{4,8}$/, "Use PO- followed by 4 to 8 digits, like PO-48213."),
  contact: z.string().min(2, "Enter the receiving contact name."),
});
type Values = z.infer<typeof schema>;

export default function FormStory() {
  const form = useForm<Values>({ resolver: zodResolver(schema), mode: "onTouched", shouldFocusError: true, defaultValues: { po: "", contact: "" } });
  return <div className="ksap-story">
    <Toaster />
    <Form {...form}>
      <form className="flex max-w-sheet flex-col gap-4" onSubmit={form.handleSubmit(() => toast.success("Shipment created"))} noValidate>
        <FormField control={form.control} name="po" render={({ field }) => (
          <FormItem>
            <FormLabel>Purchase order</FormLabel>
            <FormControl><Input placeholder="PO-48213" {...field} /></FormControl>
            <FormDescription>Use PO- followed by 4 to 8 digits.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contact" render={({ field }) => (
          <FormItem>
            <FormLabel>Receiving contact</FormLabel>
            <FormControl><Input placeholder="Enter the contact name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-2">
          <Button type="submit">Create shipment</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>Reset example</Button>
        </div>
      </form>
    </Form>
    <p className="text-caption text-muted-foreground">Submit with empty fields: focus moves to the first field with an error, so the fix starts where the problem is. Create shipment stays enabled; it never hides the reason.</p>
    <Guidelines items={[
      "Validate on blur, then live after a field has been touched.",
      "Each message is tied to its field by id and shown with an icon and words.",
    ]} />
  </div>;
}
