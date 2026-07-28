import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarTipo, revalidarTipoBorrado } from "./hooks/revalidateHooks";

/**
 * Tipo de equipo dentro de una marca (ej. "Excavadora" de CAT).
 * Nivel intermedio de la jerarquía de repuestos: Marca -> Tipo -> Modelo.
 */
export const TipoEquipo: CollectionConfig = {
  slug: "tipos-equipo",
  labels: {
    singular: "Tipo de equipo",
    plural: "Tipos de equipo",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
  },
  access: {
    read: () => true,
  },
  // Unicidad del slug POR MARCA (no global): "excavadora" puede existir bajo
  // CAT y bajo Komatsu sin chocar. Ver justificación en el reporte del sprint.
  indexes: [{ fields: ["marca", "slug"], unique: true }],
  // ISR: revalida el tipo, la página de su marca y las fichas de sus modelos.
  hooks: {
    afterChange: [revalidarTipo],
    afterDelete: [revalidarTipoBorrado],
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    // slug sin unicidad global; la unicidad la da el índice compuesto de arriba.
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas",
      required: true,
      label: "Marca",
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    seoField(),
  ],
};
