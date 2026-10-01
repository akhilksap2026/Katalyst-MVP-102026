// ksap-allow: documentation examples use source terminology, not product strings.
import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet, FieldLegend, FieldContent, FieldTitle, FieldSeparator } from "../../components/ui/field";
import { Guidelines } from "../parts";

export default function FieldStory() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = /^PO-\d{4,8}$/.test(value);
  const invalid = touched && !valid;
  return <div className="ksap-story">
    <FieldSet>
      <FieldLegend>Shipment details</FieldLegend>
      <FieldGroup>
        <Field data-invalid={invalid || undefined}>
          <FieldLabel htmlFor="field-po">Purchase order</FieldLabel>
          <Input id="field-po" value={value} aria-invalid={invalid || undefined} aria-describedby={invalid ? "field-po-error" : "field-po-help"} onBlur={() => setTouched(true)} onChange={(e) => setValue(e.target.value)} placeholder="PO-48213" />
          <FieldDescription id="field-po-help">Use PO- followed by 4 to 8 digits.</FieldDescription>
          {invalid && <FieldError id="field-po-error"><TriangleAlert aria-hidden="true" />Use PO- followed by 4 to 8 digits, like PO-48213.</FieldError>}
          {touched && valid && <p className="ksap-success-message" role="status"><Check aria-hidden="true" />Purchase order format is correct.</p>}
        </Field>
        <FieldSeparator>Receiving</FieldSeparator>
        <Field orientation="horizontal"><FieldLabel htmlFor="field-dock">Dock door</FieldLabel><FieldContent><Input id="field-dock" defaultValue="Dock 4" /><FieldDescription>Assigned receiving door.</FieldDescription></FieldContent></Field>
        <Field orientation="responsive"><FieldLabel htmlFor="field-contact">Receiving contact</FieldLabel><FieldContent><Input id="field-contact" placeholder="Enter the contact name" /></FieldContent></Field>
        <FieldTitle>Validation messages</FieldTitle>
        <FieldError errors={[{ message: "Select a carrier certified for hazardous loads." }, { message: "Choose an arrival date after today." }]} />
      </FieldGroup>
    </FieldSet>
    <Button variant="outline" onClick={() => { setValue(""); setTouched(false); }}>Reset example</Button>
    <Guidelines items={["Validate on blur, then live after a field has been touched.","Explain the fix using an icon and words. Confirm valid input in place, not in a toast.","Horizontal and responsive layouts follow the same accessible label and description contract."]} />
  </div>;
}