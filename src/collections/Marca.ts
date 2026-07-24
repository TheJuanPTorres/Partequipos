import type { CollectionConfig } from "payload";

import { formatSlugHook } from "../lib/utils/formatSlug";

/**
 * Marcas de maquinaria y repuestos (Caterpillar, CASE, etc.).
 */
export const Marca: CollectionConfig = {
  slug: "marcas",
  labels: {
    singular: "Marca",
    plural: "Marcas",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Slug",
      admin: {
        position: "sidebar",
        description:
          "Se genera automáticamente desde el nombre (minúsculas, sin tildes, con guiones). Editable manualmente.",
      },
      hooks: {
        beforeValidate: [formatSlugHook("nombre")],
      },
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
    },
  ],
};
