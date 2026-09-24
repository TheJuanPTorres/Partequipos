import type { CollectionConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { seoField } from "../lib/fields/seoField";
import { revalidarPagina, revalidarPaginaBorrada } from "./hooks/revalidateHooks";
import { slugUnicoFrenteA } from "./hooks/slugUnicoEntreColecciones";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

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
    group: "Contenido",
    description:
      "Páginas fijas del sitio. El slug es la ruta completa y no debe cambiarse: son URLs indexadas.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
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
    /*
     * HERO DE LA PORTADA (ADR 0009, revisado el 2026-09-23): N diapositivas.
     * Solo aparece en la página con slug `inicio`; en las institucionales sería
     * un campo huérfano invitando a rellenarse.
     *
     * SIN `minRows`. El ADR proponía 1, pero la portada YA EXISTE sin hero: con
     * mínimo 1, el próximo guardado de `inicio` fallaría hasta que alguien
     * añadiera una diapositiva. Con 0 el hero simplemente no se pinta.
     */
    {
      name: "hero",
      type: "group",
      label: "Hero de la portada",
      admin: {
        condition: (data) => data?.slug === "inicio",
        description: "Carrusel del inicio. Con una sola diapositiva no se muestran las flechas.",
      },
      fields: [
        {
          name: "diapositivas",
          type: "array",
          label: "Diapositivas",
          labels: { singular: "Diapositiva", plural: "Diapositivas" },
          fields: [
            {
              name: "titulo",
              type: "text",
              required: true,
              label: "Título",
              admin: { description: "Ej. «Potencia Hitachi». Se pinta en mayúsculas por diseño." },
            },
            {
              name: "parrafo",
              type: "textarea",
              label: "Párrafo",
              admin: { description: "El texto del recuadro de vidrio. No se muestra en móvil." },
            },
            {
              name: "imagenFondo",
              type: "upload",
              relationTo: "media",
              required: true,
              label: "Imagen de fondo",
            },
            {
              name: "imagenFrontal",
              type: "upload",
              relationTo: "media",
              label: "Máquina recortada (PNG transparente)",
              admin: { description: "Opcional: va delante del título." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "enlace",
                  type: "text",
                  label: "Enlace del «+»",
                  validate: validarEnlace,
                  admin: { width: "50%", description: "Ruta del sitio (/…) o https://" },
                },
                {
                  name: "enlaceNombre",
                  type: "text",
                  label: "Nombre accesible del enlace",
                  validate: (
                    valor: unknown,
                    { siblingData }: { siblingData: { enlace?: string } },
                  ) =>
                    siblingData?.enlace && !valor
                      ? "El «+» no tiene texto visible: di adónde lleva (p. ej. «Ver maquinaria Hitachi»)."
                      : true,
                  admin: { width: "50%" },
                },
              ],
            },
          ],
        },
      ],
    },
    /*
     * SECCIÓN 3 DE LA PORTADA (fase D): la máquina recortada que asoma sobre la
     * sección 2. Es decorativa (`alt` vacío al pintarla) y OPCIONAL: sin ella la
     * columna se pinta igual, solo sin imagen. En Payload y no en el repositorio
     * porque la foto de ux-9 es de banco y su licencia está pendiente (L3).
     */
    {
      name: "seccionUsada",
      type: "group",
      label: "Sección «Maquinaria pesada usada» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Máquina recortada (PNG transparente)",
          admin: {
            description: "Decorativa: asoma sobre la sección anterior. Opcional.",
          },
        },
      ],
    },
    seoField(),
  ],
};
