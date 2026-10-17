"use client";

import { TextField, useField } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";

/** `#RGB` → `#RRGGBB`: lo que acepta `<input type="color">`. Otro valor, `null`. */
export function aSeisCifras(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${[...v.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  }
  return null;
}

/**
 * Campo «Color» del título del hero: el texto de siempre (`#RRGGBB`, lo que se
 * guarda y se valida) con un selector de color del navegador al lado, para no
 * tener que saberse el código. Sin dependencias: `<input type="color">`.
 */
export default function CampoColor(props: TextFieldClientProps) {
  const { value, setValue } = useField<string>({ path: props.path });
  const actual = aSeisCifras(value);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <TextField {...props} />
      </div>
      <input
        type="color"
        aria-label="Elegir el color del título"
        title="Elegir color"
        value={actual ?? "#ffffff"}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        disabled={props.readOnly}
        // Alineado con la caja del texto (bajo la etiqueta); 32 px como los campos (§10, fase 2).
        style={{ width: 40, height: 32, marginTop: 26, padding: 2, cursor: "pointer" }}
      />
    </div>
  );
}
