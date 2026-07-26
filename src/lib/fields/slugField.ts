import type { Field } from "payload";

import { formatSlugHook } from "../utils/formatSlug";

type SlugFieldOptions = {
  /** Campo del que se deriva el slug si está vacío. Por defecto "nombre". */
  from?: string;
  /**
   * Unicidad GLOBAL a nivel de campo. Úsalo solo en colecciones de nivel
   * superior (Marca, CategoriaTecnica). En colecciones anidadas la unicidad
   * se define como índice compuesto en la colección (ej. marca+slug), no aquí.
   */
  unique?: boolean;
};

/**
 * Campo `slug` reutilizable. Autogenera desde `from` (minúsculas, sin tildes,
 * con guiones) y queda editable manualmente. Comparte `formatSlugHook` con
 * todas las colecciones para no duplicar lógica (ver Marca, TipoEquipo, etc.).
 */
export function slugField({ from = "nombre", unique = false }: SlugFieldOptions = {}): Field {
  return {
    name: "slug",
    type: "text",
    required: true,
    unique,
    index: true,
    label: "Slug",
    admin: {
      position: "sidebar",
      description:
        "Se genera automáticamente desde el nombre (minúsculas, sin tildes, con guiones). Editable manualmente.",
    },
    hooks: {
      beforeValidate: [formatSlugHook(from)],
    },
  };
}
