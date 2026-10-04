import type { CollectionConfig } from "payload";

import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { almacenEsperado } from "./hooks/almacenEsperado";
import { formatoDeAnimacionPermitido } from "./hooks/formatoDeAnimacionPermitido";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { sinRecorte } from "./hooks/sinRecorte";

/**
 * Animaciones Lottie (JSON): hoy, el mapa de sedes de Nosotros.
 *
 * COLECCIÓN APARTE, `Media` NO SE TOCA: `Media` está restringida a JPEG, PNG y
 * WebP por la mitigación del CVE de §10.28, y un JSON elegible en cualquier
 * campo de imagen rompería `next/image`. Aquí solo entra `application/json`, y
 * `formatoDeAnimacionPermitido` comprueba que sea una animación que la versión
 * ligera de lottie-web pueda pintar (sin expresiones ni imágenes externas).
 *
 * Se sirve desde el CDN del Blob, como los vídeos: el navegador la pide con
 * `fetch` solo cuando el bloque que la usa se acerca a la pantalla.
 */
export const Animacion: CollectionConfig = {
  slug: "animaciones",
  labels: { singular: "Animación", plural: "Animaciones" },
  // Sin esto, Payload deduce el tipo «Animacione» del slug.
  typescript: { interface: "Animacion" },
  admin: {
    useAsTitle: "descripcion",
    defaultColumns: ["filename", "descripcion", "ancho", "alto"],
    group: "Contenido",
    description:
      "Animaciones Lottie (.json exportado con Bodymovin, sin expresiones), máximo 4 MB. Se reproducen una vez al llegar con el scroll.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  upload: {
    mimeTypes: ["application/json"],
    // «Pegar URL» cerrado a propósito, como en Media y vídeos (CLAUDE.md §10.32).
    pasteURL: false,
    crop: false,
    focalPoint: false,
  },
  hooks: {
    beforeOperation: [almacenEsperado, sinDescargaRemota, sinRecorte, formatoDeAnimacionPermitido],
  },
  fields: [
    {
      name: "descripcion",
      type: "textarea",
      required: true,
      label: "Qué muestra la animación",
      admin: {
        description:
          "Para el panel. Lo que lee un lector de pantalla es el texto alternativo de la imagen fija del bloque.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "ancho",
          type: "number",
          label: "Ancho (px)",
          admin: { readOnly: true, width: "50%", description: "Lo lee del fichero al subirlo." },
        },
        {
          name: "alto",
          type: "number",
          label: "Alto (px)",
          admin: { readOnly: true, width: "50%" },
        },
      ],
    },
  ],
};
