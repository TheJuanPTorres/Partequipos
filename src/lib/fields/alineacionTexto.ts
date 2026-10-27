import type { Field } from "payload";

/**
 * ALINEACIÓN DE UN TEXTO EDITABLE de la portada (2026-10-27): izquierda, centrado, derecha o
 * justificado. Vacío o desconocido, izquierda. Los saltos de línea del panel salen como párrafos
 * separados (`lineasDeTexto`).
 */
export const ALINEACIONES = ["left", "center", "right", "justify"] as const;
export type AlineacionTexto = (typeof ALINEACIONES)[number];

export function alineacionTextoField(name: string, label: string): Field {
  return {
    name,
    type: "select",
    label,
    defaultValue: "left",
    options: [
      { label: "Izquierda", value: "left" },
      { label: "Centrado", value: "center" },
      { label: "Derecha", value: "right" },
      { label: "Justificado", value: "justify" },
    ],
    admin: { description: "Cómo se alinea este texto en la web. Por defecto, a la izquierda." },
  };
}

export function alineacionDeTexto(valor: unknown): AlineacionTexto {
  return (ALINEACIONES as readonly unknown[]).includes(valor) ? (valor as AlineacionTexto) : "left";
}

/** Un párrafo por cada línea escrita en el panel; las líneas vacías no cuentan. */
export function lineasDeTexto(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
