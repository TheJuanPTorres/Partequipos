import type { Block } from "payload";

import { validarEnlace } from "../../lib/fields/reglasPortada";

/**
 * Las DOS clases de fila de «Marcas de la banda» (portada → «Marcas de repuestos», 2026-11-08,
 * dirección), en la misma lista ordenable:
 * - `bandaMarca`: una marca de repuestos existente, con su logo y su página (el #429);
 * - `bandaLogo`: un LOGO LIBRE de un fabricante de repuestos que no es marca de maquinaria
 *   (Donaldson, Berco, ESCO…). No se crea como marca de repuestos, porque tendría página, índice,
 *   sitemap y menú. Solo imagen, nombre y enlace opcional.
 * La decisión de qué se pinta está en `src/lib/portada/marcasBanda.ts`. Sin SVG (dirección,
 * 2026-11-08): «Imágenes» no lo admite (`Media.ts`); un SVG se convierte a PNG antes de subirlo.
 */
export const BLOQUE_BANDA_MARCA: Block = {
  slug: "bandaMarca",
  labels: { singular: "Marca de repuestos", plural: "Marcas de repuestos" },
  fields: [
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas",
      required: true,
      // Solo el id: la portada ya tiene las marcas con su logo (`getMarcasRepuestosDePortada`).
      maxDepth: 0,
      label: "Marca",
      admin: {
        allowCreate: false,
        description: "Sale con su logo de siempre y lleva a la página de la marca.",
      },
    },
  ],
};

export const BLOQUE_BANDA_LOGO: Block = {
  slug: "bandaLogo",
  labels: { singular: "Logo libre", plural: "Logos libres" },
  fields: [
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      required: true,
      label: "Logo (PNG o WebP con fondo transparente)",
      // Un JPEG lleva su fondo blanco: en la banda saldría un rectángulo.
      filterOptions: { mimeType: { in: ["image/png", "image/webp"] } },
      admin: {
        description:
          "Súbelo antes en «Archivos → Imágenes». Sale a la misma altura que los demás logos de la banda. Si el fabricante te lo da en SVG, conviértelo antes a PNG transparente: «Imágenes» no admite SVG.",
      },
    },
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre del fabricante",
      admin: {
        description:
          "Por ejemplo, «Donaldson». Es el texto alternativo del logo: lo leen los lectores de pantalla y los buscadores.",
      },
    },
    {
      name: "enlace",
      type: "text",
      label: "Enlace (opcional)",
      validate: validarEnlace,
      admin: {
        description:
          "Una ruta del sitio (p. ej. /repuestos-maquinaria-pesada-colombia/…/) o una dirección https:// de otro sitio, que se abre en otra pestaña. Vacío: el logo no es un enlace.",
      },
    },
  ],
};
