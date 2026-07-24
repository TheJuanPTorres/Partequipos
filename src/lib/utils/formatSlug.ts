import type { FieldHook } from "payload";

/**
 * Convierte un texto en un slug conforme a CLAUDE.md §3.3:
 * minúsculas, sin tildes/diacríticos, separado por guiones.
 */
export function formatSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // elimina diacríticos (tildes, diéresis)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // cualquier no alfanumérico -> guion
    .replace(/^-+|-+$/g, ""); // recorta guiones al inicio/fin
}

/**
 * Field hook para un campo `slug`: si el usuario escribió un valor lo normaliza;
 * si lo dejó vacío, lo genera desde `fallbackField` (p. ej. `nombre`).
 * Resultado: autogenerado desde el nombre, pero editable manualmente.
 */
export const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === "string" && value.trim().length > 0) {
      return formatSlug(value);
    }

    const fallback = data?.[fallbackField] ?? originalDoc?.[fallbackField];
    if (typeof fallback === "string" && fallback.trim().length > 0) {
      return formatSlug(fallback);
    }

    return value;
  };
