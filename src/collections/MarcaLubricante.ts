import type { CollectionConfig } from "payload";

import { validarColor } from "../lib/fields/tipografiaTitulo";
import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
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
    read: lecturaContenido,
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
    {
      name: "imagenCabecera",
      type: "upload",
      relationTo: "media",
      label: "Imagen de cabecera",
      admin: {
        description:
          "Foto de fondo de la cabecera de la página. Opcional: sin ella, un fondo oscuro.",
      },
    },
    {
      name: "videoCabecera",
      type: "upload",
      relationTo: "videos",
      label: "Vídeo de la cabecera",
      admin: {
        description:
          "Vídeo de fondo de la cabecera (sin sonido, de hasta 4 MB: se carga primero en «Vídeos», con su póster). Se ve solo en pantallas grandes: en móvil, con ahorro de datos o con «reducir movimiento», queda solo la imagen de cabecera.",
      },
    },
    /*
     * Identidad de la marca (2026-10-19, cliente): la página de la marca de lubricantes es un
     * «sitio dentro del sitio» con los colores de la marca. Vacíos: amarillo y negro de ENI.
     */
    {
      name: "disenoPropio",
      type: "checkbox",
      label: "Diseño propio de Partequipos (no es de Andrés)",
      defaultValue: false,
      admin: {
        description:
          "Desmarcada (por defecto), la página es la PROVISIONAL sencilla. Marcada, el diseño propio con la identidad de la marca (colores, vídeo de cabecera…). En producción solo se publican plantillas de Andrés.",
      },
    },
    {
      name: "colorPrincipal",
      type: "text",
      label: "Color principal de la marca",
      validate: validarColor,
      admin: {
        placeholder: "#FFD100",
        components: { Field: "/components/admin/CampoColor" },
        description:
          "El color de acento de la página (botones, franjas, etiquetas): en ENI, el amarillo. El texto sobre él se pone solo en negro o blanco, el que mejor se lea.",
      },
    },
    {
      name: "colorOscuro",
      type: "text",
      label: "Color oscuro de la marca",
      validate: validarColor,
      admin: {
        placeholder: "#111111",
        components: { Field: "/components/admin/CampoColor" },
        description: "El fondo oscuro de la cabecera y de la zona de contacto: en ENI, el negro.",
      },
    },
    seoField(),
  ],
};
