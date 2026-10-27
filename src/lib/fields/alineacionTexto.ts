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

/**
 * ANCHO DE UN TEXTO EDITABLE (2026-10-27): cuánto se estira hacia la derecha dentro de su columna.
 * Estrecho 36 rem, medio 48, ancho 60 o toda la columna. La columna manda: un texto nunca pasa de
 * ella aunque el ancho elegido sea mayor.
 */
export const ANCHOS_TEXTO = ["estrecho", "medio", "ancho", "columna"] as const;
export type AnchoTexto = (typeof ANCHOS_TEXTO)[number];

export function anchoTextoField(name: string, label: string, defaultValue: AnchoTexto): Field {
  return {
    name,
    type: "select",
    label,
    defaultValue,
    options: [
      { label: "Estrecho (36 rem)", value: "estrecho" },
      { label: "Medio (48 rem)", value: "medio" },
      { label: "Ancho (60 rem)", value: "ancho" },
      { label: "Toda la columna", value: "columna" },
    ],
    admin: {
      description:
        "Hasta dónde se estira el texto hacia la derecha. Nunca pasa del borde de su columna; en el teléfono no cambia nada.",
    },
  };
}

export function anchoDeTexto(valor: unknown, porDefecto: AnchoTexto): AnchoTexto {
  return (ANCHOS_TEXTO as readonly unknown[]).includes(valor) ? (valor as AnchoTexto) : porDefecto;
}

/** Tamaño de la máquina de «Venta de repuestos»: porcentaje de su tamaño de diseño, entre 60 y 100. */
export const TAMANO_MAQUINA = { min: 60, max: 100, porDefecto: 78 } as const;

export function escalaDeMaquina(valor: unknown): number {
  const n = typeof valor === "number" && Number.isFinite(valor) ? valor : TAMANO_MAQUINA.porDefecto;
  return Math.min(TAMANO_MAQUINA.max, Math.max(TAMANO_MAQUINA.min, n)) / 100;
}

export function tamanoMaquinaField(): Field {
  return {
    name: "tamanoMaquina",
    type: "number",
    label: "Tamaño de la máquina (%)",
    min: TAMANO_MAQUINA.min,
    max: TAMANO_MAQUINA.max,
    defaultValue: TAMANO_MAQUINA.porDefecto,
    admin: {
      description:
        "Entre 60 y 100. 100 es el tamaño del diseño original; por defecto, 78. Solo desde portátil: en el teléfono no cambia. Se encoge apoyada en el piso.",
    },
  };
}
