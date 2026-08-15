import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarCategoriaBlog, revalidarCategoriaBlogBorrada } from "./hooks/blogHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Categoría del blog: `/category/{slug}/`.
 *
 * Hoy solo existe **Noticias** — es la única taxonomía viva del rastreo (no hay
 * etiquetas ni autores). Se modela como colección igual: cuesta lo mismo que
 * quemar el valor y evita rehacerlo cuando aparezca la segunda.
 *
 * El segmento `category` es el de WordPress y se conserva porque
 * `/category/noticias/` está indexada (CLAUDE.md §3.3).
 */
export const CategoriaBlog: CollectionConfig = {
  slug: "categorias-blog",
  labels: { singular: "Categoría del blog", plural: "Categorías del blog" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Blog",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaBlog],
    afterDelete: [revalidarCategoriaBlogBorrada],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    seoField(),
  ],
};
