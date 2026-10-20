import type { Field, GlobalConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarRutas } from "../lib/revalidation";

/**
 * Las páginas ÍNDICE de repuestos, de maquinaria y de usados y la de CONTÁCTANOS (plantillas
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
      "Hasta seis, de tres en tres (la última fila, centrada). Cada una lleva un título, la página a la que lleva y, si se quiere, una foto (sin foto, la tarjeta se pinta solo con el título).",
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
    /*
     * Ocultar sin borrar (cliente, 2026-10-19: el índice de Repuestos solo con
     * las dos primeras). Marcada por defecto: las que ya existían siguen igual.
     */
    {
      name: "mostrar",
      type: "checkbox",
      label: "Mostrar en la web",
      defaultValue: true,
      admin: {
        description:
          "Desmarcada, la tarjeta no se pinta, pero se conserva para volver a mostrarla.",
      },
    },
  ],
});

export const PaginasIndice: GlobalConfig = {
  slug: "paginas-indice",
  label: "Páginas índice y contacto",
  admin: {
    group: "Partes del sitio",
    description:
      "Los textos y las tarjetas de «Repuestos para maquinaria pesada», «Maquinaria pesada» y «Contáctanos», y los textos de «Maquinaria pesada usada».",
  },
  access: { read: lecturaContenido, update: escrituraContenido },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidarRutas(
          [
            "/repuestos-maquinaria-pesada-colombia",
            "/maquinaria-pesada",
            "/maquinaria-pesada/maquinaria-pesada-usada",
            "/contactanos",
          ],
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
      // Sin tarjetas: las de este índice salen solas de las categorías y las
      // marcas con unidades disponibles (2026-10-18, petición del cliente).
      name: "usada",
      type: "group",
      label: "Página «Maquinaria pesada usada»",
      admin: {
        description:
          "Solo el encabezado: las tarjetas salen solas, una por categoría y una por marca con unidades disponibles.",
      },
      fields: [
        { name: "antetitulo", type: "text", label: "Antetítulo" },
        { name: "titulo", type: "text", label: "Título" },
        { name: "texto", type: "textarea", label: "Texto de presentación" },
        imagen(
          "fondo",
          "Foto de fondo del encabezado",
          "Opcional. Foto de obra a todo el ancho; sin ella, la misma de respaldo que «Maquinaria pesada».",
        ),
        /*
         * Dirección, 2026-10-19: en el sitio publicado solo van diseños de
         * Andrés. El estado vacío diseñado del #257/#258 se queda en el
         * código, apagado. Las categorías vacías se siguen viendo (índice,
         * pestañas y menú); su página, con un aviso sencillo.
         */
        {
          name: "estadoVacio",
          type: "select",
          label: "Página de una categoría o marca sin unidades",
          defaultValue: "provisional",
          required: true,
          options: [
            { label: "Provisional (aviso sencillo)", value: "provisional" },
            { label: "Diseño propio (excepción aprobada por dirección)", value: "propio" },
          ],
          admin: {
            description:
              "«Provisional»: «Por ahora no hay unidades disponibles», con enlace a Contáctanos y WhatsApp. «Diseño propio»: el nuestro, con alternativas y «Avísame»; aprobado por dirección como excepción (2026-10-19), es el elegido en el sitio publicado.",
          },
        },
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
