import type { CollectionConfig } from "payload";

import { slugField } from "../lib/fields/slugField";

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
    // Marca es de nivel superior: unicidad global del slug.
    slugField({ unique: true }),
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
