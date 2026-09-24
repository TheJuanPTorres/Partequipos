import type { GlobalConfig } from "payload";

import { escrituraContenido, publico } from "../lib/seguridad/acceso";
import { validarDestinoPie } from "../lib/pie";
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
    group: "Contenido",
    description:
      "Texto y enlaces del pie de todas las páginas. Las redes y el contacto se editan en la configuración de la empresa, no aquí.",
  },
  access: { read: publico, update: escrituraContenido },
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
          "Opcional. Máquina recortada (PNG transparente) que asoma girada sobre la tarjeta roja, solo en escritorio. Vacío: la tarjeta sin imagen.",
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
                    condition: (_, siblingData) => siblingData?.tipo !== "telefono",
                    description: "Ruta del sitio (/…) o https://",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
