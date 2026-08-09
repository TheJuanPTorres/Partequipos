import type { CollectionConfig } from "payload";

import { revalidarEquipoUsado, revalidarEquipoUsadoBorrado } from "./hooks/maquinariaHooks";

/**
 * Unidad del inventario de maquinaria USADA (el «marketplace»).
 *
 * **No tiene URL propia** — y es deliberado: el rastreo no muestra ni una sola
 * ficha individual de usada, solo las 9 categorías. Cada unidad se lista dentro
 * de la página de su categoría. Darle ruta propia inventaría URLs que hoy no
 * existen y que nadie ha indexado.
 *
 * Por eso tampoco lleva `slug` ni campos SEO: no es una página.
 *
 * El inventario de usada rota (una máquina se vende y desaparece), así que los
 * campos apuntan a lo que necesita quien compara unidades: qué es, de qué año,
 * cuánto ha trabajado y en qué estado está.
 */
export const EquipoUsado: CollectionConfig = {
  slug: "equipos-usados",
  labels: { singular: "Equipo usado", plural: "Equipos usados" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "categoria", "anio", "disponible"],
    group: "Maquinaria",
    description:
      "Inventario de maquinaria usada. Se muestra dentro de la página de su categoría; no genera URLs propias.",
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidarEquipoUsado], afterDelete: [revalidarEquipoUsadoBorrado] },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
      admin: { description: "Ej. «Excavadora Hitachi ZX200-3»." },
    },
    {
      name: "categoria",
      type: "relationship",
      relationTo: "categorias-usada",
      required: true,
      label: "Categoría",
      admin: { description: "Determina en qué página aparece la unidad." },
    },
    /*
     * `marca` y `modelo` son texto libre, no relaciones: en usada entra
     * cualquier marca, incluidas las que no distribuimos (Caterpillar, Komatsu,
     * Volvo…). Obligar a una relación con `MarcaMaquinaria` impediría cargar una
     * unidad de una marca que no está en la línea nueva.
     */
    { name: "marca", type: "text", label: "Marca" },
    { name: "modelo", type: "text", label: "Modelo" },
    {
      name: "anio",
      type: "number",
      label: "Año",
      admin: { description: "Año del equipo, no de la publicación." },
    },
    {
      name: "horometro",
      type: "number",
      label: "Horómetro (horas)",
      admin: {
        description: "Horas de trabajo acumuladas. Es el dato que más comparan los compradores.",
      },
    },
    {
      name: "ubicacion",
      type: "text",
      label: "Ubicación",
      admin: { description: "Ciudad donde está el equipo; condiciona el costo de traslado." },
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    {
      name: "imagenes",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Imágenes",
    },
    /*
     * Sin precio a propósito: la venta de maquinaria pesada es por cotización y
     * publicar una cifra desactualizada es peor que no publicarla. Si el negocio
     * decide mostrarlo, se añade entonces con su moneda y su vigencia.
     */
    {
      name: "disponible",
      type: "checkbox",
      defaultValue: true,
      label: "Disponible",
      admin: {
        position: "sidebar",
        description:
          "Al venderse, desmarcar en vez de borrar: conserva el historial y permite deshacer.",
      },
    },
  ],
};
