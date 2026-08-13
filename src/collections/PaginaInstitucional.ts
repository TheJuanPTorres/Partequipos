import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { revalidarPagina, revalidarPaginaBorrada } from "./hooks/revalidateHooks";
import { slugUnicoFrenteA } from "./hooks/slugUnicoEntreColecciones";

/**
 * Páginas institucionales y legales (nosotros, contacto, servicio técnico,
 * políticas…). Una fila por URL del sitio.
 *
 * Sobre el `slug`: aquí es la **ruta completa** relativa a la raíz, porque estas
 * páginas no cuelgan de una jerarquía como el catálogo y alguna está anidada
 * (`nosotros/trabaja-con-nosotros`). Se copia literal del rastreo: la jerarquía
 * de URLs es intocable (CLAUDE.md §3.3).
 */
export const PaginaInstitucional: CollectionConfig = {
  slug: "paginas",
  labels: {
    singular: "Página institucional",
    plural: "Páginas institucionales",
  },
  admin: {
    useAsTitle: "titulo",
    defaultColumns: ["titulo", "slug", "tipoPagina"],
    description:
      "Páginas fijas del sitio. El slug es la ruta completa y no debe cambiarse: son URLs indexadas.",
  },
  access: {
    read: () => true,
  },
  hooks: {
    // Lado inverso del guardarraiz: una pagina no puede tapar un articulo del
    // blog, que vive en el mismo espacio de nombres raiz.
    beforeValidate: [slugUnicoFrenteA("articulos", "un artículo del blog")],
    afterChange: [revalidarPagina],
    afterDelete: [revalidarPaginaBorrada],
  },
  fields: [
    {
      name: "titulo",
      type: "text",
      required: true,
      label: "Título",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Ruta (slug)",
      admin: {
        position: "sidebar",
        description:
          "Ruta completa sin barras al inicio ni al final. Ej: 'nosotros' o 'nosotros/trabaja-con-nosotros'. Para la portada, usar 'inicio'.",
      },
    },
    {
      name: "tipoPagina",
      type: "select",
      defaultValue: "institucional",
      label: "Tipo",
      options: [
        { label: "Institucional", value: "institucional" },
        { label: "Legal / cumplimiento", value: "legal" },
        { label: "Portada", value: "portada" },
      ],
      admin: {
        position: "sidebar",
        description: "Las legales no deberían despublicarse: son de cumplimiento.",
      },
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Párrafo introductorio bajo el título." },
    },
    {
      name: "contenido",
      type: "richText",
      label: "Contenido",
    },
    /*
     * Secciones con ancla. Las anclas (#taller, #GARANTIA…) NO son páginas:
     * son partes de ESTA página. Modelarlas como un array evita crear rutas de
     * más y permite que el editor añada o reordene secciones sin tocar código.
     */
    {
      name: "secciones",
      type: "array",
      label: "Secciones con ancla",
      labels: { singular: "Sección", plural: "Secciones" },
      admin: {
        description:
          "Bloques enlazables dentro de la página, p. ej. /servicio-tecnico/#taller. No generan URLs nuevas.",
      },
      fields: [
        {
          name: "titulo",
          type: "text",
          required: true,
          label: "Título de la sección",
        },
        {
          name: "ancla",
          type: "text",
          required: true,
          label: "Ancla",
          admin: {
            description:
              "Identificador del enlace, sin '#'. Debe copiarse EXACTO del sitio actual (distingue mayúsculas): 'taller', 'GARANTIA', 'Devoluciones'.",
          },
        },
        {
          name: "contenido",
          type: "richText",
          label: "Contenido de la sección",
        },
      ],
    },
    seoField(),
  ],
};
