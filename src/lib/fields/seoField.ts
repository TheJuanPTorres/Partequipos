import type { Field } from "payload";

/**
 * Grupo de campos SEO reutilizable (CLAUDE.md §3.4).
 * `metaTitle` / `metaDescription` alimentan `generateMetadata`; `ogImage` la
 * imagen social (Open Graph). La construcción de la metadata real se hará en
 * las páginas públicas (fuera del alcance de este sprint).
 */
export function seoField(): Field {
  return {
    name: "seo",
    type: "group",
    label: "Buscadores y redes sociales",
    fields: [
      {
        name: "metaTitle",
        type: "text",
        label: "Título para buscadores",
      },
      {
        name: "metaDescription",
        type: "textarea",
        label: "Descripción para buscadores",
      },
      {
        name: "ogImage",
        type: "upload",
        relationTo: "media",
        label: "Imagen al compartir en redes",
      },
    ],
  };
}
