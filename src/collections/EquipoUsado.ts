import type { CollectionConfig } from "payload";

import { revalidarEquipoUsado, revalidarEquipoUsadoBorrado } from "./hooks/maquinariaHooks";
import { mostrarEnWebField } from "../lib/fields/mostrarEnWeb";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";
import { avisoField } from "../lib/fields/avisoField";
import { marcaUsadaSincronizada } from "./hooks/marcaUsada";
import { slugUnidadUsada, validarSlugUnidadUsada } from "./hooks/slugUnidadUsada";
import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";

const portada = revalidarPortada("equipos-usados");

/**
 * Unidad del inventario de maquinaria USADA (el «marketplace»).
 *
 * **Tiene página propia desde el 2026-10-16** (decisión de dirección): la ficha
 * de producto V2 de nueva con los datos de la unidad, en
 * `/maquinaria-pesada/maquinaria-pesada-usada/<categoria>/<dirección web>/`.
 * La dirección web NO es la de WordPress (86 de las 128 llevaban el número de
 * serie): sale del nombre y las antiguas llevan un 301.
 *
 * El inventario de usada rota (una máquina se vende y desaparece), así que los
 * campos apuntan a lo que necesita quien compara unidades: qué es, de qué año,
 * cuánto ha trabajado y en qué estado está. Una unidad no disponible no sale en
 * el sitemap y su página redirige a su categoría.
 */
export const EquipoUsado: CollectionConfig = {
  slug: "equipos-usados",
  labels: { singular: "Equipo usado", plural: "Equipos usados" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: [
      "nombre",
      "imagenes",
      "categoria",
      "marcaUsada",
      "anio",
      "disponible",
      "mostrarEnWeb",
    ],
    group: "Maquinaria",
    listSearchableFields: ["nombre", "marca", "modelo"],
    description:
      "Inventario de maquinaria usada. Cada unidad sale en la página de su categoría y en la de su marca, con filtros, y tiene su propia página.",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // La dirección web es única dentro de la categoría (la ruta lleva categoría y unidad).
  indexes: [{ fields: ["categoria", "slug"], unique: true }],
  hooks: {
    beforeValidate: [slugUnidadUsada],
    beforeChange: [marcaUsadaSincronizada],
    afterChange: [revalidarEquipoUsado, portada.afterChange],
    afterDelete: [revalidarEquipoUsadoBorrado, portada.afterDelete],
  },
  fields: [
    // Avisos en vivo (F4): sin fotos, y «no sale en el sitio» si no está disponible.
    avisoField("avisoNoDisponible", "AvisoNoDisponible"),
    avisoField("avisoSinFotos", "AvisoSinFotos"),
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
      admin: { description: "Ej. «Excavadora Hitachi ZX200-3»." },
    },
    /*
     * `required: false` en el esquema a propósito: el gancho `slugUnidadUsada`
     * la rellena siempre y la validación exige que no esté vacía, pero así los
     * scripts de siembra que crean unidades (hasta cinco) no tienen que
     * conocer la dirección web para compilar.
     */
    slugField({ validate: validarSlugUnidadUsada, requerido: false }),
    {
      name: "categoria",
      type: "relationship",
      relationTo: "categorias-usada",
      required: true,
      label: "Categoría",
      admin: { description: "Determina en qué listado de categoría aparece la unidad." },
    },
    /*
     * MARCA (paso b del marketplace, 2026-10-13): relación con las marcas de
     * USADA, no con las de nueva ni las de repuestos (en usada entra cualquier
     * marca: Caterpillar, Komatsu, LiuGong…). Cada marca tiene su página.
     *
     * El texto `marca` se conserva oculto mientras lo escriba el importador de
     * WordPress: el gancho `marcaUsadaSincronizada` mantiene los dos de
     * acuerdo y, si solo llega el texto, busca o crea la marca. Se retirará
     * con su migración.
     */
    {
      name: "marcaUsada",
      type: "relationship",
      relationTo: "marcas-usada",
      label: "Marca",
      admin: {
        description:
          "Si la marca no está en la lista, créala aquí mismo: tendrá su propia página en el sitio.",
      },
    },
    {
      name: "marca",
      type: "text",
      label: "Marca",
      admin: { hidden: true },
    },
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
      admin: { components: { Cell: "/components/admin/celdas/CeldaMiniatura" } },
    },
    /*
     * PDF de la unidad (Home V2, sección «Maquinaria pesada usada»): la tarjeta
     * de la portada pinta «Ficha técnica» SOLO si lo hay. Los PDF van en
     * `documentos`, nunca en `Media` (CLAUDE.md §10.28).
     */
    {
      name: "fichaTecnicaPdf",
      type: "upload",
      relationTo: "documentos",
      label: "Ficha técnica (PDF)",
      admin: {
        description:
          "Opcional. Sale como «Ficha técnica» en la tarjeta de la portada. Sin documento, el botón no aparece. Súbelo aquí con «Crear» (PDF, máximo 30 MB) o elige uno ya subido en «Documentos».",
      },
    },
    /*
     * Sin precio a propósito: la venta de maquinaria pesada es por cotización y
     * publicar una cifra desactualizada es peor que no publicarla. Si el negocio
     * decide mostrarlo, se añade entonces con su moneda y su vigencia.
     */
    // Distinto de «Disponible» (vendida: su página lleva a la categoría con 308). Oculta: 307.
    mostrarEnWebField({
      descripcion:
        "Desmarcada, la unidad desaparece de toda la web (listados, portada, menú, buscador y sitemap) sin borrarse del panel, y su página lleva a su categoría de forma temporal. Para una unidad VENDIDA usa «Disponible».",
    }),
    {
      name: "disponible",
      type: "checkbox",
      defaultValue: true,
      label: "Disponible",
      admin: {
        components: { Cell: "/components/admin/celdas/CeldaDisponible" },
        position: "sidebar",
        description:
          "Al venderse, desmarcar en vez de borrar: conserva el historial y permite deshacer.",
      },
    },
    /*
     * FECHA DE PUBLICACIÓN (2026-10-17, dirección): ordena el carrusel de la
     * portada y los listados de usados, de la más reciente a la más antigua. Por
     * defecto, el momento de crear la unidad; en las importadas de WordPress, la
     * fecha original de cada anuncio (el importador la rellena). Editable.
     */
    {
      name: "fechaPublicacion",
      type: "date",
      label: "Fecha de publicación",
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime", displayFormat: "d MMM yyyy, HH:mm" },
        description:
          "Ordena la portada y los listados: primero la más reciente. Por defecto, hoy; se puede cambiar.",
      },
    },
    /*
     * PESTAÑA DE LA PORTADA (sección 3 de ux-9: «Excavadoras», «Otros» y
     * «Aditamentos»). En la línea usada no hay categoría de aditamentos —solo
     * existen en la nueva y en repuestos—, y crearla añadiría una URL que el
     * sitio actual no tiene (§3.3). Así que el equipo se marca aquí: por
     * defecto, la pestaña sale de su categoría (excavadoras u «Otros»).
     */
    {
      name: "pestanaPortada",
      type: "select",
      defaultValue: "categoria",
      label: "Pestaña en la portada",
      options: [
        { label: "Según su categoría (Excavadoras u Otros)", value: "categoria" },
        { label: "Aditamentos", value: "aditamentos" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Desde el 2026-10-20 la portada solo enseña excavadoras: una marcada como «Aditamentos» no sale en ella.",
      },
    },
    seoField(),
  ],
};
