import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import {
  revalidarCategoriaLubricante,
  revalidarCategoriaLubricanteBorrada,
} from "./hooks/lubricantesHooks";

/**
 * Categoría de aplicación de una marca de lubricantes:
 * `/lubricantes/{marca}/{slug}/`.
 *
 * Son las 4 del rastreo (auto liviano, auto pesado, engranajes, motos &
 * scooter): agrupan por **uso**, no por producto. En el sitio actual no hay ni
 * una ficha de producto individual, así que no se modela ninguna.
 *
 * DESDE EL 2026-10-14 SON SECCIONES DE LA PÁGINA DE LA MARCA (decisión de
 * dirección): su ancla es su `slug` (`/lubricantes/lubricantes-eni/#auto-liviano`)
 * y su URL antigua lleva un 301 a esa ancla. Ya no tienen página propia.
 */
export const CategoriaLubricante: CollectionConfig = {
  slug: "categorias-lubricante",
  labels: { singular: "Categoría de lubricante", plural: "Categorías de lubricante" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
    group: "Lubricantes",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaLubricante],
    afterDelete: [revalidarCategoriaLubricanteBorrada],
  },
  // Unicidad por marca: dos marcas pueden tener una categoría "auto-liviano".
  indexes: [{ fields: ["marca", "slug"], unique: true }],
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas-lubricante",
      required: true,
      label: "Marca",
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen de una o dos líneas, bajo el título." },
    },
    { name: "descripcion", type: "richText", label: "Descripción" },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
      admin: { description: "Fondo de su tarjeta en la página de la marca." },
    },
    /*
     * Productos de la línea, como en el sitio actual: nombre comercial, grado
     * (viscosidad o variante), foto y ficha técnica en PDF del fabricante.
     * Nada de especificaciones inventadas: solo lo que publica el fabricante.
     * El grupo los agrupa bajo un subtítulo (p. ej. «Compresores»).
     */
    {
      name: "productos",
      type: "array",
      label: "Productos",
      labels: { singular: "Producto", plural: "Productos" },
      admin: {
        description:
          "En este orden en la página. Nombre y grado tal como los publica el fabricante; no inventes especificaciones.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "nombre",
              type: "text",
              required: true,
              label: "Nombre",
              admin: { width: "50%", description: "Ej. «I-SINT»." },
            },
            {
              name: "grado",
              type: "text",
              label: "Grado o variante",
              admin: { width: "50%", description: "Ej. «0W-20» o «DOT 4». Opcional." },
            },
          ],
        },
        {
          name: "grupo",
          type: "text",
          label: "Grupo",
          admin: {
            description:
              "Opcional. Los productos seguidos con el mismo grupo salen bajo ese subtítulo (p. ej. «Compresores»).",
          },
        },
        { name: "imagen", type: "upload", relationTo: "media", label: "Foto del producto" },
        {
          name: "ficha",
          type: "upload",
          relationTo: "documentos",
          label: "Ficha técnica (PDF)",
          admin: { description: "El PDF del fabricante. Sale como «Ficha técnica»." },
        },
        { name: "descripcion", type: "textarea", label: "Descripción" },
      ],
    },
    seoField({ sinPagina: true }),
  ],
};
