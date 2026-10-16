import type { Field, GlobalConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarRutas } from "../lib/revalidation";

/**
 * Las páginas ÍNDICE de repuestos y de maquinaria y la de CONTÁCTANOS (plantillas
 * de Andrés, docs/diseno/decisiones-indices-contacto.md): sus textos, sus seis
 * tarjetas con foto y enlace, y las fotos de Contáctanos.
 *
 * Todo opcional salvo el título y el enlace de cada tarjeta: una sección sin su
 * texto o sin imagen no se pinta o se pinta sin hueco. La migración que crea el
 * global siembra los textos y las tarjetas con SQL explícito (CLAUDE.md §3.5),
 * sin imágenes: las fotos las sube un script al preview y el panel en producción.
 *
 * Los teléfonos, el correo y la dirección de Contáctanos NO están aquí: salen del
 * global de la empresa (`seo`), una sola fuente.
 *
 * Al guardar se revalidan las tres páginas.
 */
const imagen = (name: string, label: string, description: string): Field => ({
  name,
  type: "upload",
  relationTo: "media",
  label,
  admin: { description },
});

const tarjetas = (): Field => ({
  name: "tarjetas",
  type: "array",
  label: "Tarjetas",
  labels: { singular: "Tarjeta", plural: "Tarjetas" },
  maxRows: 6,
  admin: {
    description:
      "Hasta seis, de tres en tres. Cada una lleva un título, la página a la que lleva y, si se quiere, una foto (sin foto, la tarjeta se pinta solo con el título).",
    initCollapsed: true,
  },
  fields: [
    { name: "titulo", type: "text", required: true, label: "Título" },
    {
      name: "enlace",
      type: "text",
      required: true,
      label: "Enlace",
      validate: validarEnlace,
      admin: { description: "Ruta del sitio (/…) o https://" },
    },
    imagen("imagen", "Foto", "Opcional. Horizontal, de unos 800 × 530 píxeles."),
  ],
});

export const PaginasIndice: GlobalConfig = {
  slug: "paginas-indice",
  label: "Páginas índice y contacto",
  admin: {
    group: "Partes del sitio",
    description:
      "Los textos y las tarjetas de «Repuestos para maquinaria pesada», «Maquinaria pesada» y «Contáctanos».",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarRutas(
          ["/repuestos-maquinaria-pesada-colombia", "/maquinaria-pesada", "/contactanos"],
          "global paginas-indice",
        );
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "repuestos",
      type: "group",
      label: "Página «Repuestos para maquinaria pesada»",
      fields: [
        { name: "antetitulo", type: "text", label: "Antetítulo" },
        { name: "titulo", type: "text", label: "Título" },
        { name: "texto", type: "textarea", label: "Texto de presentación" },
        imagen(
          "fondo",
          "Foto de fondo del encabezado",
          "Opcional. Foto de obra a todo el ancho; sin ella, el encabezado queda en un tono oscuro.",
        ),
        tarjetas(),
      ],
    },
    {
      name: "maquinaria",
      type: "group",
      label: "Página «Maquinaria pesada»",
      fields: [
        { name: "antetitulo", type: "text", label: "Antetítulo" },
        { name: "titulo", type: "text", label: "Título" },
        { name: "texto", type: "textarea", label: "Texto de presentación" },
        imagen(
          "fondo",
          "Foto de fondo del encabezado",
          "Opcional. Foto de obra a todo el ancho; sin ella, el encabezado queda en un tono oscuro.",
        ),
        tarjetas(),
      ],
    },
    {
      name: "contacto",
      type: "group",
      label: "Página «Contáctanos»",
      fields: [
        { name: "antetitulo", type: "text", label: "Antetítulo" },
        { name: "titulo", type: "text", label: "Título" },
        { name: "tituloCanales", type: "text", label: "Título de los canales adicionales" },
        { name: "etiquetaTelefono", type: "text", label: "Etiqueta del teléfono" },
        { name: "etiquetaCorreo", type: "text", label: "Etiqueta del correo" },
        { name: "etiquetaDireccion", type: "text", label: "Etiqueta de la dirección" },
        { name: "tituloHorario", type: "text", label: "Título del horario de atención" },
        imagen(
          "foto",
          "Foto junto al formulario",
          "Opcional. Vertical, en una tarjeta redondeada.",
        ),
        imagen(
          "imagenDecorativa",
          "Máquina decorativa",
          "Opcional. Máquina recortada (PNG o WebP con transparencia) que asoma tras las tarjetas de canales.",
        ),
      ],
    },
  ],
};
