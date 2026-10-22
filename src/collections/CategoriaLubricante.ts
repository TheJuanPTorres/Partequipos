import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import {
  revalidarCategoriaLubricante,
  revalidarCategoriaLubricanteBorrada,
} from "./hooks/lubricantesHooks";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

/**
 * Categoría de aplicación de una marca de lubricantes:
 * `/lubricantes/{marca}/{slug}/`.
 *
 * Son las 4 del rastreo (auto liviano, auto pesado, engranajes, motos &
 * scooter): agrupan por **uso**, no por producto. En el sitio actual no hay ni
 * una ficha de producto individual, así que no se modela ninguna: los productos
 * van dentro de su línea.
 *
 * Del 2026-10-14 al 2026-10-21 fueron secciones de la página de la marca, con un
 * 301 de su URL a su ancla. DESDE EL 2026-10-22 VUELVEN A TENER PÁGINA PROPIA, en
 * su URL de WordPress, con la plantilla de Andrés «Ficha producto lubricante»
 * (4039; dirección). Las anclas viejas (`#auto-liviano`) llevan a su página.
 */
// El desplegable «Lubricantes» del megamenú lista las categorías (2026-10-20).
const megamenu = revalidarMegamenu("categorias-lubricante");

export const CategoriaLubricante: CollectionConfig = {
  slug: "categorias-lubricante",
  labels: { singular: "Categoría de lubricante", plural: "Categorías de lubricante" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "orden", "slug"],
    group: "Lubricantes",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaLubricante, megamenu.afterChange],
    afterDelete: [revalidarCategoriaLubricanteBorrada, megamenu.afterDelete],
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
      name: "orden",
      type: "number",
      label: "Orden",
      admin: {
        position: "sidebar",
        description:
          "Posición de la línea en la página de la marca y en el menú «Lubricantes» (1, 2, 3…). Vacío, después de las que tienen orden, por nombre.",
      },
    },
    {
      name: "enlaceMenu",
      type: "text",
      label: "Enlace en el menú",
      validate: validarEnlace,
      admin: {
        description:
          "Opcional. A dónde lleva esta categoría en el menú «Lubricantes» de la cabecera. Vacío, a su página.",
      },
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: {
        description:
          "Texto de la cabecera de su página, bajo el título. Vacío, la entradilla de la marca.",
      },
    },
    { name: "descripcion", type: "richText", label: "Descripción" },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
      admin: {
        description:
          "Foto de su tarjeta en la página de la marca. También la de la cabecera de su página si «Imagen de cabecera» está vacía.",
      },
    },
    {
      name: "imagenCabecera",
      type: "upload",
      relationTo: "media",
      label: "Imagen de cabecera",
      admin: {
        description:
          "Opcional. Fondo de la cabecera de su página. Vacía, la «Imagen» de la línea; sin ninguna, fondo oscuro.",
      },
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
    seoField(),
  ],
};
