import type { Field, GlobalConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMarcasDeRepuestos } from "../lib/revalidation";

/**
 * Lo COMÚN a las páginas de marca de repuestos (ux-9,
 * docs/diseno/decisiones-repuestos-marca.md): los títulos de sus secciones y
 * las dos tarjetas que no salen de los datos de la marca (maquinaria usada y
 * aditamentos, que llevan al marketplace).
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
        description:
          "Vacío: no se pintan las tarjetas de tipos de máquina, ni las de usada y aditamentos (van en la misma sección).",
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
  ],
};
