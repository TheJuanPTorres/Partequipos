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
        "Forma la URL indexada. Se genera automáticamente desde el nombre al crear el registro. " +
        "Después queda de solo lectura: cambiarlo rompe la URL posicionada. " +
        "Si necesitas corregir una errata, pide el permiso «Puede editar slugs ya publicados»; " +
        "el sistema creará un redirect 301 automático desde la URL anterior (ADR 0005).",
    },
    access: {
      /**
       * Guardarraíl (ADR 0005, parte B): el slug solo se puede escribir al crear
       * el documento. Para modificarlo después hace falta el permiso explícito
       * `puedeEditarSlugs`.
       *
       * Al ser control de acceso de CAMPO (y no `admin.readOnly`), Payload
       * deshabilita el input en el panel automáticamente y además protege la API
       * REST, no solo la interfaz.
       *
       * La importación por script NO se ve afectada: la API local se ejecuta con
       * `overrideAccess: true` por defecto, así que `scripts/import` sigue
       * pudiendo actualizar slugs (es su trabajo).
       */
      update: ({ req, doc }) => {
        // Sin `doc` es una creación: el slug se puede establecer libremente.
        if (!doc) return true;
        return Boolean(req.user && "puedeEditarSlugs" in req.user && req.user.puedeEditarSlugs);
      },
    },
    hooks: {
      beforeValidate: [formatSlugHook(from)],
    },
  };
}
