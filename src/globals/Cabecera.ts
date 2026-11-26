import type { Field, GlobalConfig } from "payload";

import {
  APARTADOS_POR_DEFECTO,
  TIPO_ENLACE,
  TIPOS_APARTADO,
  validarApartados,
  type Desplegable,
} from "../lib/cabecera/apartados";
import {
  APARTADO_ENLACE,
  APARTADO_GRUPO,
  APARTADO_LISTA,
  FILA_DESPLEGABLE,
  FILA_ENLACE,
  FUENTES,
  TIPOS_DE_APARTADO,
  TIPOS_FILA,
  validarApartadosDelArbol,
  validarBarra,
} from "../lib/cabecera/arbol";
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
 *
 * EL ÁRBOL (tanda 25, tarea 2; Juan Pablo, 2026-11-26): todo el menú se arma en «Enlaces del
 * menú». Cada fila de la barra es un enlace simple o un DESPLEGABLE con sus apartados anidados
 * (lista automática con su fuente, enlace fijo o grupo de enlaces). La migración `…_menu_arbol`
 * copia al árbol el menú publicado; las tres listas de la tanda 24 se quedan, OCULTAS, hasta su
 * borrado con migración. La lógica, en `src/lib/cabecera/arbol.ts`.
 */

/** «Enlace» obligatorio (apartado de enlace fijo). */
const enlaceObligatorio = (valor: unknown): true | string =>
  typeof valor === "string" && valor.trim() ? validarEnlace(valor) : "Escribe adónde lleva.";

/** Los apartados de un desplegable de la barra (nivel 2 del árbol) y los enlaces de un grupo (nivel 3). */
const apartadosDelArbol: Field = {
  name: "apartados",
  type: "array",
  label: "Apartados del desplegable",
  labels: { singular: "Apartado", plural: "Apartados" },
  validate: (valor: unknown) => validarApartadosDelArbol(valor),
  admin: {
    condition: (_, fila) => fila?.tipo === FILA_DESPLEGABLE,
    initCollapsed: true,
    components: { RowLabel: "/components/admin/menu/EtiquetaApartado" },
    description:
      "Lo que sale al desplegar, en escritorio y en el móvil. Arrastra para ordenar; desmarca «Mostrar» para quitar un apartado sin borrarlo. Sin ningún apartado que salga, la fila queda como enlace simple (en Maquinaria pesada, Repuestos y Lubricantes, sin ninguna fila vuelve el menú de siempre).",
  },
  fields: [
    { name: "mostrar", type: "checkbox", label: "Mostrar en el menú", defaultValue: true },
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
          defaultValue: APARTADO_ENLACE,
          options: TIPOS_DE_APARTADO.map((t) => ({ ...t })),
          admin: { width: "60%", isClearable: false },
        },
      ],
    },
    {
      name: "fuente",
      type: "select",
      label: "Fuente de la lista",
      options: FUENTES.map(({ value, label }) => ({ value, label })),
      validate: (valor: unknown, { siblingData }: { siblingData?: unknown }) => {
        const fila = (siblingData ?? {}) as { tipo?: string | null };
        return fila.tipo !== APARTADO_LISTA || valor ? true : "Elige de dónde sale la lista.";
      },
      admin: {
        condition: (_, fila) => fila?.tipo === APARTADO_LISTA,
        description:
          "Se llena sola con el catálogo, en el orden por arrastre de su colección. Cada fuente, una vez por desplegable. En «Marcas de lubricantes» sale un apartado por marca, con el nombre de la marca.",
      },
    },
    {
      name: "enlace",
      type: "text",
      label: "Enlace",
      validate: (valor: unknown, { siblingData }: { siblingData?: unknown }) => {
        const fila = (siblingData ?? {}) as { tipo?: string | null };
        return fila.tipo === APARTADO_ENLACE ? enlaceObligatorio(valor) : true;
      },
      admin: {
        condition: (_, fila) => fila?.tipo === APARTADO_ENLACE,
        description: "Una ruta del sitio (/…/) o https:// (otro sitio: pestaña nueva).",
      },
    },
    {
      name: "enlaces",
      type: "array",
      label: "Enlaces del grupo",
      labels: { singular: "Enlace", plural: "Enlaces" },
      admin: {
        condition: (_, fila) => fila?.tipo === APARTADO_GRUPO,
        initCollapsed: true,
        components: { RowLabel: "/components/admin/menu/EtiquetaEnlaceGrupo" },
        description:
          "Los enlaces que salen al desplegar el grupo, en este orden. Un grupo sin ningún enlace que se muestre no sale.",
      },
      fields: [
        { name: "mostrar", type: "checkbox", label: "Mostrar en el menú", defaultValue: true },
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
              label: "Enlace",
              validate: (valor: unknown, { siblingData }: { siblingData?: unknown }) => {
                const fila = (siblingData ?? {}) as { mostrar?: boolean | null };
                const presente = enlaceDeFilaObligatorio(valor, fila.mostrar);
                return presente === true ? validarEnlace(valor) : presente;
              },
              admin: {
                width: "60%",
                description: "Una ruta del sitio (/…/) o https:// (pestaña nueva).",
              },
            },
          ],
        },
      ],
    },
  ],
};

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
      // SIN USO desde la tanda 25 (el árbol de «Enlaces del menú»): oculta hasta su borrado.
      hidden: true,
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
      "Todo el menú de la cabecera, en un solo sitio: los enlaces de la barra y, dentro de cada desplegable, sus apartados.",
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
      validate: (valor: unknown) => validarBarra(valor),
      admin: {
        initCollapsed: true,
        components: { RowLabel: "/components/admin/menu/EtiquetaFilaBarra" },
        description: `Hasta ${MAX_ENLACES_CABECERA}, en el orden de la barra (escritorio y móvil); arrastra para ordenar. Cada fila es un «Enlace simple» o un «Desplegable» con sus apartados dentro. Si en escritorio no caben todos, los últimos pasan solos a «Más» al final de la barra; en el móvil salen todos en lista. Un enlace a otro sitio (https://), como la tienda, sale como botón oscuro y se abre en una pestaña nueva. Desmarca «Mostrar» para quitar una fila sin borrarla.`,
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
                  "Una ruta del sitio (/…/) o https:// (otro sitio: pestaña nueva). Puede quedar vacío si la fila está oculta. En un desplegable, la página de su sección.",
              },
            },
          ],
        },
        {
          name: "tipo",
          type: "select",
          required: true,
          label: "Tipo",
          defaultValue: FILA_ENLACE,
          options: TIPOS_FILA.map((t) => ({ ...t })),
          admin: {
            isClearable: false,
            description:
              "«Desplegable»: al pulsarlo se abre con los apartados de abajo; el enlace de la fila es la página de su sección.",
          },
        },
        apartadosDelArbol,
      ],
    },
    {
      // Vista previa en vivo (no guarda nada): el esquema de lo que saldrá en el menú.
      name: "esquemaDelMenu",
      type: "ui",
      admin: { components: { Field: "/components/admin/menu/EsquemaMenu" } },
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
