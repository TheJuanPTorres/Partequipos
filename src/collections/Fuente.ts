import type { CollectionConfig } from "payload";

import { revalidarRutas } from "../lib/revalidation";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { almacenEsperado } from "./hooks/almacenEsperado";
import { formatoDeFuentePermitido } from "./hooks/formatoDeFuentePermitido";
import { sinDescargaRemota } from "./hooks/sinDescargaRemota";
import { sinRecorte } from "./hooks/sinRecorte";

/**
 * FUENTES PROPIAS DEL CLIENTE (2026-10-17): las que se pueden elegir en
 * «Tipografía del título» de cada diapositiva del hero, además de Inter.
 *
 * COLECCIÓN APARTE, como las animaciones: `Media` sigue solo con imágenes
 * (§10.28). Entra WOFF2, WOFF o TTF, comprobado por su contenido
 * (`formatoDeFuentePermitido`, que deja el formato para el `@font-face`).
 *
 * Se sirve desde el CDN del Blob (que responde con
 * `Access-Control-Allow-Origin: *`, necesario para una fuente de otro
 * origen). El sitio NO las carga todas: solo declara las del hero, y el
 * navegador descarga una cuando pinta el título de una diapositiva que la usa
 * (`src/lib/portada/tipografia.ts`).
 */
export const Fuente: CollectionConfig = {
  slug: "fuentes",
  labels: { singular: "Fuente", plural: "Fuentes" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "filename", "formato"],
    group: "Archivos",
    description:
      "Tipos de letra propios para el título del hero (WOFF2, o WOFF/TTF; máximo 4 MB). Después se eligen en «Tipografía del título» de cada diapositiva. Comprueba que la licencia permite usarla en una web.",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  upload: {
    mimeTypes: [
      "font/woff2",
      "font/woff",
      "font/ttf",
      "font/sfnt",
      "application/font-woff",
      "application/font-woff2",
      "application/x-font-ttf",
      "application/font-sfnt",
    ],
    // «Pegar URL» cerrado a propósito, como en Media y vídeos (CLAUDE.md §10.32).
    pasteURL: false,
    crop: false,
    focalPoint: false,
  },
  hooks: {
    beforeOperation: [almacenEsperado, sinDescargaRemota, sinRecorte, formatoDeFuentePermitido],
    // Solo la portada usa fuentes propias (el hero).
    afterChange: [
      ({ doc }) => {
        revalidarRutas(["/"], `fuente ${doc.nombre}`);
        return doc;
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidarRutas(["/"], `fuente borrada ${doc.nombre}`);
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      unique: true,
      label: "Nombre",
      admin: {
        description:
          "Cómo aparece en la lista de fuentes del hero (p. ej. «Helvetica Neue Bold»). Solo para el panel.",
      },
    },
    {
      name: "formato",
      type: "select",
      label: "Formato",
      options: [
        { label: "WOFF2", value: "woff2" },
        { label: "WOFF", value: "woff" },
        { label: "TTF", value: "truetype" },
      ],
      admin: { readOnly: true, description: "Lo lee del fichero al subirlo." },
    },
  ],
};
