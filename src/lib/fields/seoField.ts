import type { Field } from "payload";

/**
 * Grupo SEO reutilizable (CLAUDE.md §3.4).
 * `metaTitle` / `metaDescription` alimentan `generateMetadata`; `ogImage` la
 * imagen social (Open Graph). Lo que se usa cuando quedan vacíos está en
 * `src/lib/seo/porDefecto.ts` y `seoPanel.ts`.
 *
 * `vistaBuscadores` es un campo `ui`: no guarda nada ni tiene columna. Pinta
 * el SEO guiado (vista de Google, contadores y valores por defecto).
 */
export function seoField(): Field {
  return {
    name: "seo",
    type: "group",
    label: "Buscadores y redes sociales",
    admin: {
      description: "Opcional. Debajo ves cómo saldrá en Google y qué se usa si lo dejas vacío.",
    },
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
      {
        name: "vistaBuscadores",
        type: "ui",
        admin: { components: { Field: "/components/admin/SeoGuiado" } },
      },
    ],
  };
}
