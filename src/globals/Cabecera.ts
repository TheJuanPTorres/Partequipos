import type { GlobalConfig } from "payload";

import { enlaceDeFilaObligatorio, MAX_ENLACES_CABECERA } from "../lib/cabecera/enlaces";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { revalidarTodoElSitio } from "../lib/revalidation";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";

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
  access: { read: lecturaContenido, update: escrituraContenido },
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
      maxRows: MAX_ENLACES_CABECERA,
      admin: {
        description: `Hasta ${MAX_ENLACES_CABECERA}, en el orden de la barra (escritorio y móvil). Si en escritorio no caben todos, los últimos pasan a un desplegable «Más» al final de la barra; en el móvil salen todos en lista. Un enlace a otro sitio (https://), como la tienda, sale como botón oscuro en su sitio de la barra y se abre en una pestaña nueva. Desmarca «Mostrar» para quitarlo sin borrarlo, o para crearlo antes de tener su enlace: oculto, no ocupa sitio.`,
      },
      fields: [
        {
          name: "mostrar",
          type: "checkbox",
          label: "Mostrar en el menú",
          defaultValue: true,
        },
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
              // Obligatorio solo si la fila se muestra (2026-11-04): por eso no es
              // `required` (la columna admite NULL desde `…_cabecera_enlace_opcional`).
              name: "enlace",
              type: "text",
              label: "Enlace",
              validate: (valor: unknown, { siblingData }: { siblingData?: unknown }) => {
                const fila = (siblingData ?? {}) as { mostrar?: boolean | null };
                const presente = enlaceDeFilaObligatorio(valor, fila.mostrar);
                return presente === true ? validarEnlace(valor) : presente;
              },
              admin: {
                width: "60%",
                description:
                  "Una ruta del sitio (/…/) o https:// (otro sitio: pestaña nueva). Puede quedar vacío si la fila está oculta.",
              },
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
    {
      name: "politicaRepuestos",
      type: "group",
      label: "Menú de Repuestos: política de garantías",
      admin: {
        description:
          "Última entrada del menú desplegable de Repuestos (escritorio y móvil). Desmarca «Mostrar» para quitarla sin borrarla.",
      },
      fields: [
        {
          name: "mostrar",
          type: "checkbox",
          label: "Mostrar en el menú",
          defaultValue: true,
        },
        {
          type: "row",
          fields: [
            {
              name: "texto",
              type: "text",
              label: "Texto",
              defaultValue: "Política de garantías y repuestos",
              admin: { width: "40%" },
            },
            {
              name: "enlace",
              type: "text",
              label: "Enlace",
              defaultValue: "/politica-de-garantia-de-repuestos/",
              validate: validarEnlace,
              admin: {
                width: "60%",
                description:
                  "Una ruta del sitio (/…/) o https://. Hoy, la política de garantía publicada.",
              },
            },
          ],
        },
      ],
    },
  ],
};
