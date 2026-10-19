import type { Field, GlobalConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMarcasDeRepuestos } from "../lib/revalidation";

/**
 * Lo COMÚN a las páginas de marca de repuestos (ux-9,
 * docs/diseno/decisiones-repuestos-marca.md): los títulos de sus secciones.
 *
 * Las tarjetas «Maquinaria pesada usada» y «Aditamentos» ya NO se pintan en
 * las páginas de marca (cliente, 2026-10-17): sus campos quedan OCULTOS en el
 * panel, sin borrarlos de la base (no hace falta migración y el importador de
 * repuestos los sigue rellenando). Si vuelven, basta con quitar `hidden`.
 *
 * Todo opcional: una sección sin su título no se pinta. La migración que crea
 * el global siembra los textos de ux-9 con SQL explícito (CLAUDE.md §3.5).
 *
 * Al guardar se revalidan las páginas de marca.
 */
const tarjeta = (nombre: string, etiqueta: string): Field => ({
  name: nombre,
  type: "group",
  label: etiqueta,
  admin: { hidden: true },
  fields: [
    { name: "titulo", type: "text", label: "Título" },
    {
      name: "enlace",
      type: "text",
      label: "Enlace",
      validate: validarEnlace,
      admin: {
        description:
          "Ruta del sitio (/…) o https://. Vacío: la tarjeta no se pinta (no hay enlaces rotos).",
      },
    },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
      admin: { description: "Opcional. Sin imagen, la tarjeta se pinta solo con el título." },
    },
  ],
});

export const RepuestosMarca: GlobalConfig = {
  slug: "repuestos-marca",
  label: "Páginas de marca de repuestos",
  admin: {
    group: "Partes del sitio",
    description:
      "Títulos y tarjetas comunes a las páginas de cada marca de repuestos (Caterpillar, Case…).",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarMarcasDeRepuestos("global repuestos-marca");
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "tituloHero",
      type: "text",
      label: "Título del encabezado (primera línea)",
      admin: {
        description: "Ej.: «Repuestos para maquinaria pesada». La segunda línea es la marca.",
      },
    },
    {
      name: "subtituloHero",
      type: "text",
      label: "Segunda línea, tras el nombre de la marca",
      admin: { description: "Ej.: «En Colombia» → «CATERPILLAR En Colombia»." },
    },
    {
      name: "tituloCategorias",
      type: "text",
      label: "Título de las categorías",
      admin: { description: "Vacío: la franja de categorías no se pinta." },
    },
    {
      name: "tituloTipos",
      type: "text",
      label: "Título de los tipos de máquina",
      admin: {
        description: "Vacío: no se pintan las tarjetas de tipos de máquina.",
      },
    },
    {
      name: "verTodoTexto",
      type: "text",
      label: "Texto del enlace de cada tarjeta",
      admin: { description: "Ej.: «Ver todo»." },
    },
    tarjeta("tarjetaUsadas", "Tarjeta «Maquinaria pesada usada»"),
    tarjeta("tarjetaAditamentos", "Tarjeta «Aditamentos»"),
    { name: "contactoTitulo", type: "text", label: "Contacto: título" },
    {
      name: "contactoSubtitulo",
      type: "text",
      label: "Contacto: subtítulo",
      admin: { description: "Vacío: el formulario de contacto no se pinta." },
    },
    { name: "contactoBoton", type: "text", label: "Contacto: texto del botón" },
    {
      name: "testimoniosTitulo",
      type: "text",
      label: "Testimonios: título",
      admin: {
        description:
          "Vacío: los testimonios salen sin título (sin testimonios publicados, la sección no se pinta).",
      },
    },
    { name: "verVideoTexto", type: "text", label: "Testimonios: texto «Ver video»" },
    /*
     * «¿Por qué elegirnos?» de la plantilla de Andrés para las páginas de marca y de tipo de
     * repuestos (2026-10-19): una foto a la izquierda y a la derecha el título, unos puntos, el
     * cierre y el botón «Solicita asesoría» (baja al formulario de contacto).
     */
    {
      name: "porQueTitulo",
      type: "text",
      label: "¿Por qué elegirnos?: título",
      admin: { description: "Vacío: la sección no se pinta." },
    },
    {
      name: "porQueImagen",
      type: "upload",
      relationTo: "media",
      label: "¿Por qué elegirnos?: foto",
      admin: { description: "Foto de la columna izquierda. Sin ella, un fondo oscuro." },
    },
    {
      name: "porQuePuntos",
      type: "array",
      label: "¿Por qué elegirnos?: puntos",
      maxRows: 6,
      labels: { singular: "Punto", plural: "Puntos" },
      fields: [
        { name: "titulo", type: "text", required: true, label: "Título" },
        { name: "texto", type: "textarea", required: true, label: "Texto" },
      ],
    },
    {
      name: "porQueCierre",
      type: "text",
      label: "¿Por qué elegirnos?: frase de cierre",
      admin: { description: "«{marca}» se sustituye por el nombre de la marca de la página." },
    },
    { name: "porQueBoton", type: "text", label: "¿Por qué elegirnos?: texto del botón" },
  ],
};
