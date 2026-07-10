import type { ReactNode } from "react";

import { color } from "../theme";
import { ErrorText, FieldGroup, Label } from "./FormControls";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <FieldGroup>
      {label != null && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span style={{ color: color.danger }}> *</span>}
        </Label>
      )}
      {children}
      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint ? (
        <span style={{ fontSize: 11, color: color.inkFaint }}>{hint}</span>
      ) : null}
    </FieldGroup>
  );
}
