import type { CollectionConfig } from "payload";
import { conPestanas } from "../lib/fields/pestanasFicha";
import { ocultoSinUso } from "../lib/fields/ocultoSinUso";

import { revalidarEquipoUsado, revalidarEquipoUsadoBorrado } from "./hooks/maquinariaHooks";
import { mostrarEnWebField } from "../lib/fields/mostrarEnWeb";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";
import { avisoField } from "../lib/fields/avisoField";
import { marcaUsadaSincronizada } from "./hooks/marcaUsada";
import { slugUnidadUsada, validarSlugUnidadUsada } from "./hooks/slugUnidadUsada";
import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { MAX_DESCRIPCION_CORTA, MAX_SERIAL } from "../lib/usados/aditamentos";
import { validarAnio, validarHorometro } from "../lib/panel/fichaUsada";

/** «Mostrar en la web» con interruptor directo en la lista (tarea 3, punto 2). */
const conInterruptor = <T extends { admin?: Record<string, unknown> }>(c: T): T => ({
  ...c,
  admin: { ...c.admin, components: { Cell: "/components/admin/celdas/CeldaInterruptor" } },
});

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
    group: "Maquinaria",
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
  // Pestañas Contenido · Fotos · Buscadores y redes · Avanzado (fase 2 del panel, sin esquema).
  fields: conPestanas(
    [
      /*
       * EDICIÓN FÁCIL (tanda 21, tarea 3, fase 1: PROTOTIPO en el preview, sin esquema): arriba, «Así
       * se ve hoy en la web» con el indicador de ficha completa, y en la lista la columna «Estado»
       * (Publicada · Oculta · Vendida). Los dos son campos `ui`: no guardan nada.
       */
      {
        name: "resumenWeb",
        type: "ui",
        admin: {
          components: { Field: "/components/admin/ResumenWebUsada" },
          disableListColumn: true,
        },
      },
      {
        name: "estadoWeb",
        type: "ui",
        label: "Estado",
        admin: {
          components: {
            Field: "/components/admin/Nada",
            Cell: "/components/admin/celdas/CeldaEstadoUsada",
          },
        },
      },
      // Avisos en vivo (F4): sin fotos, y «no sale en el sitio» si no está disponible.
      avisoField("avisoNoDisponible", "AvisoNoDisponible"),
      avisoField("avisoSinFotos", "AvisoSinFotos"),
      {
        name: "nombre",
        type: "text",
        required: true,
        label: "Nombre",
        admin: {
          description:
            "Como sale en el título de la ficha y en la tarjeta: tipo, marca, modelo y año. Ej. «Excavadora Hitachi ZX200-3 2016».",
          components: { Cell: "/components/admin/celdas/CeldaNombreFicha" },
        },
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
      {
        name: "modelo",
        type: "text",
        label: "Modelo",
        admin: {
          description:
            "Como lo escribe el fabricante, con guiones y mayúsculas. Ej. «ZX200-3». Debajo salen los que ya usan otras unidades de esta marca.",
          components: { Field: "/components/admin/CampoModeloUsada" },
        },
      },
      {
        name: "anio",
        type: "number",
        label: "Año",
        validate: (v: unknown) => validarAnio(v),
        admin: {
          step: 1,
          placeholder: "2016",
          description: "Año de fabricación de la máquina, no de la publicación. Cuatro cifras.",
        },
      },
      {
        name: "horometro",
        type: "number",
        label: "Horómetro (horas)",
        validate: (v: unknown) => validarHorometro(v),
        admin: {
          step: 1,
          placeholder: "8450",
          description:
            "Horas de trabajo acumuladas, sin puntos. Es el dato que más comparan los compradores.",
        },
      },
      {
        name: "ubicacion",
        type: "text",
        label: "Ubicación",
        admin: {
          placeholder: "Bogotá",
          description: "Ciudad donde está la máquina; condiciona el costo de traslado.",
        },
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
          // Sin uso en la web desde el 2026-11-09 (limpieza, paso 1).
          ocultoSinUso({
            name: "potencia",
            type: "number",
            label: "Potencia (hp)",
            min: 0,
            admin: { width: "33%" },
          }),
          ocultoSinUso({
            name: "motor",
            type: "text",
            label: "Motor",
            admin: { width: "34%", description: "Ej. YANMAR 4TNV98CT" },
          }),
        ],
      },
      /*
       * ADITAMENTOS (2026-10-23, dirección): «Serial» y «Descripción corta»,
       * visibles en el panel SOLO si la categoría es Aditamentos
       * (`CampoSoloAditamentos`), y pintados solo en esa categoría
       * (`camposDeAditamento`, `src/lib/usados/aditamentos.ts`). El serial es la
       * excepción, solo de aditamentos, a «el número de serie no sale».
       */
      {
        name: "serial",
        type: "text",
        label: "Serial",
        maxLength: MAX_SERIAL,
        admin: {
          components: { Field: "/components/admin/CampoSoloAditamentos" },
          description:
            "Solo aditamentos. Opcional. Sale en la ficha, con sus datos, y en la tarjeta del listado.",
        },
      },
      {
        name: "descripcionCorta",
        type: "textarea",
        label: "Descripción corta",
        maxLength: MAX_DESCRIPCION_CORTA,
        admin: {
          components: { Field: "/components/admin/CampoSoloAditamentos" },
          description: `Solo aditamentos. Opcional, hasta ${MAX_DESCRIPCION_CORTA} caracteres. Sale en la tarjeta del listado (como mucho 3 líneas). Vacía, la tarjeta queda como siempre.`,
        },
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
        label: "Fotos",
        admin: {
          components: { Cell: "/components/admin/celdas/CeldaMiniatura" },
          description:
            "Puedes elegir o subir varias a la vez. Arrastra para ordenarlas: la PRIMERA es la portada (la de la tarjeta del listado y la de arriba de la ficha).",
        },
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
      conInterruptor(
        mostrarEnWebField({
          descripcion:
            "Desmarcada, la unidad desaparece de toda la web (listados, portada, menú, buscador y sitemap) sin borrarse del panel, y su página lleva a su categoría de forma temporal. Para una unidad VENDIDA usa «Disponible».",
        }),
      ),
      {
        name: "disponible",
        type: "checkbox",
        defaultValue: true,
        label: "Disponible",
        admin: {
          // En la lista, interruptor directo (tarea 3, punto 2): desmarcada = «Vendida».
          components: { Cell: "/components/admin/celdas/CeldaInterruptor" },
          position: "sidebar",
          description:
            "Al venderse, desmarcar en vez de borrar: conserva el historial y permite deshacer.",
        },
      },
      /*
       * FECHA DE PUBLICACIÓN (2026-10-17, dirección): ordena los listados (y,
       * hasta el 2026-11-09, el carrusel de la portada) de usados, de la más reciente a la más antigua. Por
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
            "Ordena los listados: primero la más reciente. Por defecto, hoy; se puede cambiar.",
        },
      },
      /*
       * PESTAÑA DE LA PORTADA (sección 3 de ux-9: «Excavadoras», «Otros» y
       * «Aditamentos»). En la línea usada no hay categoría de aditamentos —solo
       * existen en la nueva y en repuestos—, y crearla añadiría una URL que el
       * sitio actual no tiene (§3.3). Así que el equipo se marca aquí: por
       * defecto, la pestaña sale de su categoría (excavadoras u «Otros»).
       */
      ocultoSinUso({
        name: "pestanaPortada",
        type: "select",
        defaultValue: "categoria",
        label: "Pestaña en la portada (ya no se usa)",
        options: [
          { label: "Según su categoría (Excavadora u Otros)", value: "categoria" },
          { label: "Aditamentos", value: "aditamentos" },
        ],
        admin: {
          position: "sidebar",
          description:
            "Sin efecto desde el 2026-11-09: la portada ya no enseña unidades (se quitó el carrusel). Se conserva el dato.",
        },
      }),
      seoField(),
    ],
    { fotos: { imagenes: "galeria" } },
  ),
};
