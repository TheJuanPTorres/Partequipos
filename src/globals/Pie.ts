import type { GlobalConfig } from "payload";

import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { validarDestinoPie, validarDocumentoPie } from "../lib/pie";
import { revalidarTodoElSitio } from "../lib/revalidation";

/**
 * PIE DEL SITIO, editable (docs/diseno/decisiones-home-ux9.md §13).
 *
 * Lo que NO está aquí, a propósito: las redes sociales y los datos de contacto
 * (dirección, teléfono, correo). Salen de `seoConfig`, fuente única del JSON-LD
 * `Organization`: duplicarlos permitiría que el pie y el JSON-LD dijeran cosas
 * distintas. Un enlace de tipo «teléfono» usa el teléfono de `seoConfig`.
 *
 * Al guardar se revalida TODO el sitio: el pie está en cada página.
 */
export const Pie: GlobalConfig = {
  slug: "pie",
  label: "Pie de página",
  admin: {
    group: "Partes del sitio",
    description:
      "Texto y enlaces del pie de todas las páginas. Las redes y el contacto se editan en la configuración de la empresa, no aquí.",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarTodoElSitio("pie");
        return doc;
      },
    ],
  },
  fields: [
    { name: "lema", type: "text", required: true, label: "Lema de la tarjeta roja" },
    {
      name: "textoBoton",
      type: "text",
      required: true,
      label: "Texto del botón de WhatsApp",
      admin: { description: "El número sale de la configuración de la empresa." },
    },
    {
      name: "imagenDecorativa",
      type: "upload",
      relationTo: "media",
      label: "Imagen decorativa",
      admin: {
        description:
          "Opcional. Máquina recortada (PNG transparente) que asoma sobre la esquina derecha de la tarjeta roja, solo en escritorio. Vacío: la tarjeta sin imagen.",
      },
    },
    { name: "empresaTitulo", type: "text", label: "Frase destacada de la empresa" },
    { name: "empresaTexto", type: "textarea", label: "Texto de la empresa" },
    {
      name: "columnas",
      type: "array",
      label: "Columnas de enlaces",
      labels: { singular: "Columna", plural: "Columnas" },
      maxRows: 4,
      fields: [
        { name: "titulo", type: "text", required: true, label: "Título" },
        {
          name: "enlaces",
          type: "array",
          label: "Enlaces",
          labels: { singular: "Enlace", plural: "Enlaces" },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "etiqueta",
                  type: "text",
                  required: true,
                  label: "Texto",
                  admin: { width: "35%" },
                },
                {
                  name: "tipo",
                  type: "select",
                  required: true,
                  defaultValue: "pagina",
                  label: "Tipo",
                  options: [
                    { label: "Página o dirección", value: "pagina" },
                    { label: "Teléfono de la empresa", value: "telefono" },
                    { label: "Documento en el visor", value: "documento" },
                  ],
                  admin: { width: "25%" },
                },
                {
                  name: "destino",
                  type: "text",
                  label: "Destino",
                  validate: validarDestinoPie,
                  admin: {
                    width: "40%",
                    condition: (_, siblingData) => (siblingData?.tipo ?? "pagina") === "pagina",
                    description:
                      "Ruta del sitio (/…) o https://. Una dirección https:// de otro sitio se abre en una pestaña nueva.",
                  },
                },
                {
                  /*
                   * «Documento en el visor» (2026-10-22, «Línea Ética»): el PDF se abre en la
                   * ventana emergente con el visor tipo libro, si tiene sus «Páginas como
                   * imágenes»; sin ellas o sin JavaScript, el enlace abre el PDF.
                   */
                  name: "documento",
                  type: "upload",
                  relationTo: "documentos",
                  label: "Documento",
                  validate: validarDocumentoPie,
                  admin: {
                    width: "40%",
                    condition: (_, siblingData) => siblingData?.tipo === "documento",
                    description:
                      "El PDF de «Documentos». Se abre en el visor si tiene sus páginas como imágenes.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    /*
     * Enlaces de la franja legal (Ley 1581 de 2012). Antes, `navegacionLegal`
     * en el código; la migración `20261002_*_home_panel` los siembra. El de
     * tratamiento de datos va el primero.
     */
    {
      name: "legales",
      type: "array",
      label: "Enlaces legales",
      labels: { singular: "Enlace", plural: "Enlaces" },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "etiqueta",
              type: "text",
              required: true,
              label: "Texto",
              admin: { width: "40%" },
            },
            {
              name: "enlace",
              type: "text",
              required: true,
              label: "Enlace",
              validate: validarEnlace,
              admin: { width: "60%" },
            },
          ],
        },
      ],
    },
  ],
};
