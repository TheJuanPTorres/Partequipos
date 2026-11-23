import type {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
} from "payload";

import { ICONOS_FICHA } from "../lib/maquinaria/fichaTecnica";
import { TIPOS_VALOR, UNIDADES_SUGERIDAS } from "../lib/maquinaria/atributosFicha";
import { ETIQUETAS_DATOS, revalidarDatos } from "../lib/cacheDatos";
import { revalidarCategoriasNueva, revalidarFichasDeProducto } from "../lib/revalidation";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";

/**
 * CATÁLOGO «ATRIBUTOS DE FICHA» (2026-11-23, tanda 21 tarea 4, Juan Pablo): los datos que la ficha
 * de una máquina nueva enseña junto al título (potencia, peso, motor…), con su nombre, su icono,
 * su unidad y el tipo de valor. Cada máquina elige hasta 5 en «Atributos destacados» y solo
 * escribe el valor (`atributosFicha.ts`). Se ordena arrastrando. El nombre de uso en el panel
 * lleva la unidad («Potencia neta (hp)») porque una misma magnitud puede darse en dos unidades.
 */
const titulo: CollectionBeforeChangeHook = ({ data }) => {
  const nombre = String(data.nombre ?? "").trim();
  const unidad = String(data.unidad ?? "").trim();
  return { ...data, titulo: unidad ? `${nombre} (${unidad})` : nombre };
};

const refrescar: CollectionAfterChangeHook = ({ doc }) => {
  try {
    revalidarDatos(ETIQUETAS_DATOS.nueva, `atributo de ficha ${doc.id}`);
    revalidarFichasDeProducto(`atributo de ficha ${doc.id}`);
    revalidarCategoriasNueva(`atributo de ficha ${doc.id}`);
  } catch (error) {
    console.error("[revalidación] hook de AtributoFicha falló:", error);
  }
  return doc;
};

export const AtributoFicha: CollectionConfig = {
  slug: "atributos-ficha",
  labels: { singular: "Atributo de ficha", plural: "Atributos de ficha" },
  admin: {
    useAsTitle: "titulo",
    defaultColumns: ["titulo", "icono", "unidad", "tipoValor"],
    group: "Maquinaria",
    description:
      "Los datos que salen junto al título de cada máquina nueva (potencia, peso, motor…). Aquí se define cómo se llama, su icono, su unidad y si es número o texto; en cada máquina, «Atributos destacados» elige hasta 5 y escribe el valor. Arrastra para cambiar el orden en que se ofrecen.",
  },
  orderable: true,
  defaultSort: "_order",
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { beforeChange: [titulo], afterChange: [refrescar] },
  fields: [
    { name: "titulo", type: "text", admin: { hidden: true } },
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
      admin: { description: "Cómo se llama en la ficha: «Potencia neta», «Peso operativo»…" },
    },
    {
      type: "row",
      fields: [
        {
          name: "icono",
          type: "select",
          label: "Icono",
          required: true,
          defaultValue: "otro",
          options: ICONOS_FICHA.map((i) => ({ value: i.value, label: i.label })),
          admin: { width: "40%" },
        },
        {
          name: "unidad",
          type: "text",
          label: "Unidad",
          admin: {
            width: "30%",
            placeholder: "hp",
            description: `Se escribe después del valor. Por ejemplo: ${UNIDADES_SUGERIDAS.join(", ")}. Vacía, sin unidad.`,
          },
        },
        {
          name: "tipoValor",
          type: "select",
          label: "Tipo de valor",
          required: true,
          defaultValue: "numero",
          options: TIPOS_VALOR.map((t) => ({ value: t.value, label: t.label })),
          admin: {
            width: "30%",
            description: "«Número»: en la máquina solo se puede escribir un número.",
          },
        },
      ],
    },
  ],
};
