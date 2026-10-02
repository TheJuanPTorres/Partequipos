import type { Block, Field } from "payload";

import { validarEnlace } from "../../lib/fields/reglasPortada";

/**
 * BLOQUES DE PÁGINA — los cinco tipos reutilizables del campo `bloques` de
 * `paginas` (decisión de dirección del 2026-10-02; docs/diseno/decisiones-nosotros.md).
 * Nacieron con Nosotros de ux-9, pero no llevan nada de esa página: sirven a
 * cualquier página institucional.
 *
 * La forma que reciben los componentes está en `src/lib/bloques/vista.ts`; la
 * traducción desde estos documentos, en `src/lib/bloques/desdePayload.ts`.
 */

/** Botón opcional: texto y enlace. Sin cualquiera de los dos, no se pinta. */
const boton = (etiqueta: string): Field => ({
  type: "row",
  fields: [
    {
      name: "botonTexto",
      type: "text",
      label: `Texto del ${etiqueta}`,
      admin: { width: "50%" },
    },
    {
      name: "botonEnlace",
      type: "text",
      label: `Enlace del ${etiqueta}`,
      validate: validarEnlace,
      admin: {
        width: "50%",
        description: "Una ruta del sitio (/…/) o una dirección https://. Vacío: sin botón.",
      },
    },
  ],
});

const antetitulo: Field = {
  name: "antetitulo",
  type: "text",
  label: "Antetítulo",
  admin: { description: "Texto corto encima del título. Opcional." },
};

export const BloqueCabeceraVideo: Block = {
  slug: "cabeceraVideo",
  interfaceName: "BloqueCabeceraVideo",
  labels: { singular: "Cabecera con vídeo", plural: "Cabeceras con vídeo" },
  fields: [
    antetitulo,
    {
      name: "titulo",
      type: "text",
      required: true,
      label: "Título",
      admin: {
        description:
          "Es el título principal de la página (su <h1>). Úsalo una sola vez por página.",
      },
    },
    {
      name: "video",
      type: "upload",
      relationTo: "videos",
      label: "Vídeo de fondo",
      admin: {
        description:
          "En bucle y sin sonido; su póster se ve mientras carga y con «reducir movimiento». Opcional.",
      },
    },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen de fondo",
      admin: { description: "Se usa si no hay vídeo. Con vídeo, manda el póster del vídeo." },
    },
  ],
};

export const BloquePresentacionImagen: Block = {
  slug: "presentacionImagen",
  interfaceName: "BloquePresentacionImagen",
  labels: { singular: "Presentación con imagen", plural: "Presentaciones con imagen" },
  fields: [
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
      admin: {
        description:
          "A un lado del texto (debajo en móvil). Si transmite información, como un mapa, cuida su texto alternativo.",
      },
    },
    antetitulo,
    { name: "titulo", type: "text", required: true, label: "Título" },
    { name: "texto", type: "richText", label: "Texto" },
    boton("botón"),
  ],
};

export const BloqueCifras: Block = {
  slug: "cifras",
  interfaceName: "BloqueCifras",
  labels: { singular: "Cifras", plural: "Cifras" },
  fields: [
    {
      name: "cifras",
      type: "array",
      label: "Cifras",
      labels: { singular: "Cifra", plural: "Cifras" },
      minRows: 1,
      maxRows: 4,
      admin: { description: "El número cuenta desde cero al llegar con el scroll." },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "prefijo",
              type: "text",
              label: "Prefijo",
              admin: { width: "25%", description: "Ej. «+»." },
            },
            {
              name: "numero",
              type: "number",
              required: true,
              min: 0,
              label: "Número",
              admin: { width: "50%", description: "Sin separadores: 10000." },
            },
            {
              name: "sufijo",
              type: "text",
              label: "Sufijo",
              admin: { width: "25%", description: "Ej. «%» o «+»." },
            },
          ],
        },
        { name: "etiqueta", type: "text", required: true, label: "Etiqueta" },
      ],
    },
  ],
};

export const BloqueFranjaMarquee: Block = {
  slug: "franjaMarquee",
  interfaceName: "BloqueFranjaMarquee",
  labels: { singular: "Franja con texto en movimiento", plural: "Franjas con texto en movimiento" },
  fields: [
    {
      name: "texto",
      type: "text",
      required: true,
      label: "Texto en movimiento",
      admin: { description: "Se repite de lado a lado, en mayúsculas. Ej. «Marcas aliadas»." },
    },
    {
      name: "imagenFondo",
      type: "upload",
      relationTo: "media",
      label: "Imagen de fondo",
      admin: { description: "Decorativa." },
    },
    {
      name: "imagenFrontal",
      type: "upload",
      relationTo: "media",
      label: "Máquina recortada (PNG transparente)",
      admin: { description: "Va delante del texto. Decorativa. Opcional." },
    },
  ],
};

export const BloqueTarjetasExpandibles: Block = {
  slug: "tarjetasExpandibles",
  /*
   * Nombre de tabla corto: con el del slug, la clave foránea de la imagen de
   * cada tarjeta mide 66 caracteres y Postgres la corta a 63, así que la base
   * no cuadra con el snapshot (falló «Migrar desde cero»). Así mide 58.
   */
  dbName: "paginas_blocks_tarjetas_exp",
  interfaceName: "BloqueTarjetasExpandibles",
  labels: { singular: "Tarjetas expandibles", plural: "Tarjetas expandibles" },
  fields: [
    antetitulo,
    { name: "titulo", type: "text", required: true, label: "Título" },
    {
      name: "tarjetas",
      type: "array",
      label: "Tarjetas",
      labels: { singular: "Tarjeta", plural: "Tarjetas" },
      minRows: 1,
      admin: {
        description:
          "Una abierta y las demás plegadas; rotan cada 4 s. Con más de 4 las plegadas quedan muy estrechas.",
      },
      fields: [
        { name: "titulo", type: "text", required: true, label: "Título" },
        {
          name: "texto",
          type: "textarea",
          label: "Texto",
          admin: { description: "Se ve con la tarjeta abierta." },
        },
        { name: "imagen", type: "upload", relationTo: "media", label: "Imagen de fondo" },
        {
          name: "enlace",
          type: "text",
          label: "Enlace",
          validate: validarEnlace,
          admin: { description: "Una ruta del sitio (/…/) o una dirección https://. Opcional." },
        },
      ],
    },
    boton("botón"),
  ],
};

export const BLOQUES_PAGINA: Block[] = [
  BloqueCabeceraVideo,
  BloquePresentacionImagen,
  BloqueCifras,
  BloqueFranjaMarquee,
  BloqueTarjetasExpandibles,
];
