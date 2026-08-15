import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import {
  revalidarMarcaLubricante,
  revalidarMarcaLubricanteBorrada,
} from "./hooks/lubricantesHooks";

/**
 * Marca de lubricantes. Es la raíz de la sección: `/lubricantes/{slug}/`.
 *
 * DOS NIVELES, no tres. El rastreo encuentra marca → categoría de aplicación y
 * nada por debajo, así que no se copia la jerarquía de repuestos
 * (marca → tipo → modelo): forzarla dejaría un nivel vacío en todas las ramas.
 *
 * Hoy solo existe Eni en el sitio, pero su propia página menciona **Dispel**
 * como segunda marca, de ahí que sea una colección y no un valor fijo.
 */
export const MarcaLubricante: CollectionConfig = {
  slug: "marcas-lubricante",
  labels: { singular: "Marca de lubricante", plural: "Marcas de lubricante" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Lubricantes",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarMarcaLubricante],
    afterDelete: [revalidarMarcaLubricanteBorrada],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField({ unique: true }),
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen de una o dos líneas, bajo el título." },
    },
    { name: "descripcion", type: "richText", label: "Descripción" },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
    },
    seoField(),
  ],
};
