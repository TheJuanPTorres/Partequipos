import type { Field, GlobalConfig } from "payload";

import {
  APARTADOS_POR_DEFECTO,
  TIPO_ENLACE,
  TIPOS_APARTADO,
  validarApartados,
  type Desplegable,
} from "../lib/cabecera/apartados";
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
 *
 * APARTADOS DE LOS DESPLEGABLES (tanda 24, tarea 1; Juan Pablo, 2026-11-25): una lista por
 * desplegable (`menuMaquinaria`, `menuRepuestos`, `menuLubricantes`) que se arrastra, con el
 * nombre, el tipo (lista automática o enlace fijo) y «Mostrar» de cada apartado. La migración
 * `…_menu_apartados` siembra el menú de siempre. La lógica, en `src/lib/cabecera/apartados.ts`.
 */

/** La lista de apartados de un desplegable del megamenú y del menú móvil. */
function apartadosDe(name: string, desplegable: Desplegable, titulo: string, nota: string): Field {
  return {
    name,
    type: "array",
    label: `Desplegable «${titulo}»: apartados`,
    labels: { singular: "Apartado", plural: "Apartados" },
    defaultValue: APARTADOS_POR_DEFECTO[desplegable].map((a) => ({ ...a })),
    validate: (valor: unknown) => validarApartados(valor, desplegable),
    admin: {
      description: `Lo que sale al desplegar «${titulo}», en escritorio y en el móvil. Arrastra las filas para ordenarlas y desmarca «Mostrar» para quitar una sin borrarla. Una «lista automática» se llena sola con el catálogo, en el orden de su colección; un «enlace fijo» lleva a la dirección que escribas. ${nota} Si borras todas las filas, vuelve el menú de siempre.`,
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
            name: "nombre",
            type: "text",
            required: true,
            label: "Nombre visible",
            admin: { width: "40%" },
          },
          {
            name: "tipo",
            type: "select",
            required: true,
            label: "Tipo",
            defaultValue: TIPO_ENLACE,
            options: TIPOS_APARTADO[desplegable].map((t) => ({ ...t })),
            admin: { width: "60%", isClearable: false },
          },
        ],
      },
      {
        name: "enlace",
        type: "text",
        label: "Enlace",
        validate: (valor: unknown, { siblingData }: { siblingData?: unknown }) => {
          const fila = (siblingData ?? {}) as { tipo?: string | null };
          if (fila.tipo !== TIPO_ENLACE) return true;
          return typeof valor === "string" && valor.trim()
            ? validarEnlace(valor)
            : "Escribe adónde lleva este enlace.";
        },
        admin: {
          condition: (_, fila) => fila?.tipo === TIPO_ENLACE,
          description: "Una ruta del sitio (/…/) o https://.",
        },
      },
    ],
  };
}

export const Cabecera: GlobalConfig = {
  slug: "cabecera",
  label: "Menú principal (cabecera)",
  admin: {
    group: "Configuración",
    description:
      "Menú y botón de la cabecera de todas las páginas: los enlaces de la barra y los apartados de cada desplegable.",
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
    apartadosDe(
      "menuMaquinaria",
      "maquinaria",
      "Maquinaria pesada",
      "«Aditamentos» solo sale si existe esa marca de maquinaria nueva.",
    ),
    apartadosDe(
      "menuRepuestos",
      "repuestos",
      "Repuestos",
      "La política de garantías es un enlace fijo: cambia aquí su texto o su enlace.",
    ),
    apartadosDe(
      "menuLubricantes",
      "lubricantes",
      "Lubricantes",
      "En «marcas de lubricantes» sale un apartado por marca, con el nombre de la marca: el «Nombre visible» de esa fila solo se ve aquí.",
    ),
    {
      // SIN USO desde la tanda 24 (2026-11-25): la política es un enlace fijo de `menuRepuestos`
      // (la migración `…_menu_apartados` copió su texto, su enlace y su «Mostrar»). Se queda,
      // oculto, hasta el borrado con migración de la limpieza del panel.
      name: "politicaRepuestos",
      type: "group",
      label: "Menú de Repuestos: política de garantías",
      admin: {
        hidden: true,
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
