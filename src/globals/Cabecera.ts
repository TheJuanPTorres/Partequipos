import type { GlobalConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { revalidarTodoElSitio } from "../lib/revalidation";
import { escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * CABECERA DEL SITIO, editable (ux-9, export 2162: el «megamenú» de Unlimited
 * Elements son cuatro enlaces simples, sin desplegables). Antes estaba escrita
 * en `src/lib/navegacion.ts`. La migración `20261002_*_home_panel` siembra los
 * valores de ux-9.
 *
 * Al guardar se revalida TODO el sitio: la cabecera está en cada página.
 */
export const Cabecera: GlobalConfig = {
  slug: "cabecera",
  label: "Cabecera",
  admin: {
    group: "Partes del sitio",
    description: "Menú y botón de la cabecera de todas las páginas.",
  },
  access: { read: publico, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarTodoElSitio("cabecera");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "enlaces",
      type: "array",
      label: "Enlaces del menú",
      labels: { singular: "Enlace", plural: "Enlaces" },
      maxRows: 6,
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
              admin: { width: "60%", description: "Una ruta del sitio (/…/) o https://." },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "botonTexto",
          type: "text",
          label: "Texto del botón",
          defaultValue: "Contáctanos",
          admin: { width: "40%" },
        },
        {
          name: "botonEnlace",
          type: "text",
          label: "Enlace del botón",
          defaultValue: "/contactanos/",
          validate: validarEnlace,
          admin: { width: "60%" },
        },
      ],
    },
  ],
};
