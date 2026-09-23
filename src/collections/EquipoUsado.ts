import type { CollectionConfig } from "payload";

import { revalidarEquipoUsado, revalidarEquipoUsadoBorrado } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("equipos-usados");

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
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarEquipoUsado, portada.afterChange],
    afterDelete: [revalidarEquipoUsadoBorrado, portada.afterDelete],
  },
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
    /*
     * FICHA TÉCNICA de la tarjeta de la portada (sección 3 de ux-9: «Peso
     * operativo: 8.4 t · Potencia: 64 hp · Motor: YANMAR 4TNV98CT»). Opcional:
     * las unidades ya cargadas no la tienen, y la tarjeta omite lo que falte.
     */
    {
      type: "row",
      fields: [
        {
          name: "pesoOperativo",
          type: "number",
          label: "Peso operativo (t)",
          min: 0,
          admin: { step: 0.1, width: "33%" },
        },
        {
          name: "potencia",
          type: "number",
          label: "Potencia (hp)",
          min: 0,
          admin: { width: "33%" },
        },
        {
          name: "motor",
          type: "text",
          label: "Motor",
          admin: { width: "34%", description: "Ej. YANMAR 4TNV98CT" },
        },
      ],
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
