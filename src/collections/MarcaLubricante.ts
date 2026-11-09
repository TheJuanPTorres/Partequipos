import type { CollectionConfig } from "payload";

import { validarColor } from "../lib/fields/tipografiaTitulo";
import { DESTINO_EXTERNO, DESTINO_PAGINA } from "../lib/lubricantes/destino";
import { OPCIONES_PAIS } from "../lib/lubricantes/pais";
import { normalizarEnlaceExterno, validarEnlaceExterno } from "../lib/nueva/enlaceExterno";
import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import {
  revalidarMarcaLubricante,
  revalidarMarcaLubricanteBorrada,
} from "./hooks/lubricantesHooks";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

/**
 * Marca de lubricantes. Es la raíz de la sección: `/lubricantes/{slug}/`.
 *
 * DOS NIVELES, no tres. El rastreo encuentra marca → categoría de aplicación y
 * nada por debajo, así que no se copia la jerarquía de repuestos
 * (marca → tipo → modelo): forzarla dejaría un nivel vacío en todas las ramas.
 *
 * Eni tiene su página aquí; Dispel (2026-11-04) no: lleva a otra web («Destino»).
 */
// El desplegable «Lubricantes» del megamenú lleva cada marca (2026-10-20).
const megamenu = revalidarMegamenu("marcas-lubricante");

export const MarcaLubricante: CollectionConfig = {
  slug: "marcas-lubricante",
  labels: { singular: "Marca de lubricante", plural: "Marcas de lubricante" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Lubricantes",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarMarcaLubricante, megamenu.afterChange],
    afterDelete: [revalidarMarcaLubricanteBorrada, megamenu.afterDelete],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    /*
     * Marca sin página propia (2026-11-04, dirección: Dispel lleva a otra web) y su país, con la
     * bandera del menú. `src/lib/lubricantes/destino.ts` y `pais.ts`.
     */
    {
      name: "destino",
      type: "radio",
      label: "Destino",
      defaultValue: DESTINO_PAGINA,
      options: [
        { label: "Su página en este sitio", value: DESTINO_PAGINA },
        { label: "Otra web (sin página en este sitio)", value: DESTINO_EXTERNO },
      ],
      admin: {
        position: "sidebar",
        description:
          "«Otra web»: la marca no tiene página aquí (su dirección da «no encontrada» y no sale en el sitemap). En el menú de Lubricantes lleva a su «Enlace externo» en otra pestaña; mientras el enlace esté vacío, a la categoría «Lubricantes» (su panel dice «Muy pronto»).",
      },
    },
    {
      name: "enlaceExterno",
      type: "text",
      label: "Enlace externo",
      validate: validarEnlaceExterno,
      hooks: { beforeChange: [({ value }) => normalizarEnlaceExterno(value as string)] },
      admin: {
        position: "sidebar",
        placeholder: "https://…",
        description:
          "La web de la marca, completa y con https://. Con «Otra web»: adónde lleva en el menú (vacía, a la categoría «Lubricantes», donde dice «Muy pronto»). Con «Su página en este sitio»: «Ver todo» del menú y «Ver productos» del selector llevan a esta web en otra pestaña; su página de aquí sigue igual.",
      },
    },
    {
      name: "paisOrigen",
      type: "select",
      label: "País de origen",
      options: OPCIONES_PAIS,
      admin: {
        position: "sidebar",
        description:
          "Pinta su bandera junto al nombre en el menú de Lubricantes. Vacío, sin bandera.",
      },
    },
    slugField({ unique: true }),
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen de una o dos líneas, bajo el título." },
    },
    { name: "descripcion", type: "richText", label: "Descripción" },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
    },
    /*
     * Selector de marcas de la categoría técnica «Lubricantes» (2026-11-04, dirección): el panel
     * de esta marca. `src/lib/lubricantes/selector.ts`.
     */
    {
      name: "fotoSelector",
      type: "upload",
      relationTo: "media",
      label: "Foto del selector de marcas",
      admin: {
        description:
          "La foto del panel de esta marca en la página de la categoría técnica «Lubricantes», teñida con el color principal de la marca. Vacía, la imagen de cabecera; sin ninguna, el panel en su color.",
      },
    },
    {
      name: "textoSelector",
      type: "textarea",
      label: "Texto del selector de marcas",
      admin: {
        description:
          "Una o dos líneas bajo el nombre, en el panel de esta marca del selector. Vacío, la primera frase de la entradilla.",
      },
    },
    {
      name: "imagenCabecera",
      type: "upload",
      relationTo: "media",
      label: "Imagen de cabecera",
      admin: {
        description:
          "Foto de fondo de la cabecera de la página. Opcional: sin ella, un fondo oscuro.",
      },
    },
    {
      name: "videoCabecera",
      type: "upload",
      relationTo: "videos",
      label: "Vídeo de la cabecera",
      admin: {
        description:
          "Vídeo de fondo de la cabecera (sin sonido, de hasta 4 MB: se carga primero en «Vídeos», con su póster). Se ve solo en pantallas grandes: en móvil, con ahorro de datos o con «reducir movimiento», queda solo la imagen de cabecera.",
      },
    },
    /*
     * Identidad de la marca (2026-10-19, cliente): la página de la marca de lubricantes es un
     * «sitio dentro del sitio» con los colores de la marca. Vacíos: amarillo y negro de ENI.
     */
    {
      name: "disenoPropio",
      type: "checkbox",
      label: "Diseño propio de Partequipos (no es de Andrés)",
      defaultValue: false,
      admin: {
        description:
          "Desmarcada (por defecto), la página usa la plantilla de Andrés («Categoría Lubricantes»). Marcada, el diseño propio con la identidad de la marca (colores, vídeo de cabecera…). En producción solo se publican plantillas de Andrés.",
      },
    },
    {
      name: "colorPrincipal",
      type: "text",
      label: "Color principal de la marca",
      validate: validarColor,
      admin: {
        placeholder: "#FFD100",
        components: { Field: "/components/admin/CampoColor" },
        description:
          "El color de acento de la página (botones, franjas, etiquetas): en ENI, el amarillo. El texto sobre él se pone solo en negro o blanco, el que mejor se lea.",
      },
    },
    {
      name: "colorOscuro",
      type: "text",
      label: "Color oscuro de la marca",
      validate: validarColor,
      admin: {
        placeholder: "#111111",
        components: { Field: "/components/admin/CampoColor" },
        description: "El fondo oscuro de la cabecera y de la zona de contacto: en ENI, el negro.",
      },
    },
    seoField(),
  ],
};
