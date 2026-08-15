import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarModelo, revalidarModeloBorrado } from "./hooks/revalidateHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Modelo concreto dentro de un tipo de equipo (ej. "CAT 320D" en Excavadora).
 * Nivel más profundo de la jerarquía: Marca -> Tipo -> Modelo.
 */
export const ModeloRepuesto: CollectionConfig = {
  slug: "modelos-repuesto",
  labels: {
    singular: "Modelo",
    plural: "Modelos",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "tipo", "slug"],
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // Unicidad del slug POR TIPO (el tipo ya implica una marca). Ver reporte.
  indexes: [{ fields: ["tipo", "slug"], unique: true }],
  // ISR: revalida la ficha y la página del tipo donde el modelo se lista.
  hooks: {
    afterChange: [revalidarModelo],
    afterDelete: [revalidarModeloBorrado],
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    slugField(),
    // `marca` va antes que `tipo` para poder filtrar los tipos por la marca
    // elegida. Desnormalizada a propósito (consultas y breadcrumbs).
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas",
      required: true,
      label: "Marca",
      admin: {
        description:
          "Desnormalizada para consultas y breadcrumbs. Debe coincidir con la marca del tipo elegido.",
      },
    },
    {
      name: "tipo",
      type: "relationship",
      relationTo: "tipos-equipo",
      required: true,
      label: "Tipo de equipo",
      admin: {
        description: "Se filtra por la marca seleccionada arriba.",
      },
      // Filtra el desplegable de tipos por la marca ya seleccionada.
      filterOptions: ({ siblingData }) => {
        const marca = (siblingData as { marca?: number | string | null }).marca;
        return marca ? { marca: { equals: marca } } : true;
      },
    },
    {
      name: "codigo",
      type: "text",
      label: "Código",
      admin: {
        description: "Código del modelo, ej. 320D.",
      },
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    {
      name: "imagenes",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Imágenes (galería)",
    },
    seoField(),
  ],
};
