import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarArticulo, revalidarArticuloBorrado } from "./hooks/blogHooks";
import { slugUnicoFrenteA } from "./hooks/slugUnicoEntreColecciones";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Artículo del blog. Se sirve en `/{slug}/`, **en la raíz**.
 *
 * No hay prefijo `/blog/`, ni fecha, ni categoría en la ruta: el rastreo mide
 * los 51 artículos en profundidad 1 (permalink «nombre de la entrada» de
 * WordPress). Reproducirlo es obligatorio — son URLs posicionadas.
 *
 * CONSECUENCIA: comparte espacio de nombres con `paginas`. De ahí el hook
 * `slugUnicoFrenteA`, que impide que un artículo tape una página institucional
 * (ver `slugUnicoEntreColecciones.ts`).
 *
 * SLUGS LARGOS: 30 de los 51 pasan de 62 caracteres y el mayor llega a 118. Se
 * respetan tal cual; acortarlos costaría 30 redirects a cambio de nada.
 */
export const Articulo: CollectionConfig = {
  slug: "articulos",
  labels: { singular: "Artículo", plural: "Artículos" },
  admin: {
    useAsTitle: "titulo",
    defaultColumns: ["titulo", "categoria", "fechaPublicacion", "slug"],
    group: "Blog",
    description: "Se publican en la raíz del sitio: /{slug}/, sin prefijo.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // Lo más reciente primero: es un blog.
  defaultSort: "-fechaPublicacion",
  hooks: {
    beforeValidate: [slugUnicoFrenteA("paginas", "una página institucional")],
    afterChange: [revalidarArticulo],
    afterDelete: [revalidarArticuloBorrado],
  },
  fields: [
    { name: "titulo", type: "text", required: true, label: "Título" },
    slugField({ from: "titulo", unique: true }),
    {
      name: "categoria",
      type: "relationship",
      relationTo: "categorias-blog",
      label: "Categoría",
      admin: { description: "Determina en qué archivo aparece el artículo." },
    },
    {
      name: "fechaPublicacion",
      type: "date",
      required: true,
      label: "Fecha de publicación",
      admin: {
        position: "sidebar",
        description: "Alimenta el orden del índice y el JSON-LD del artículo.",
        date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" },
      },
    },
    /*
     * Autor en TEXTO LIBRE, no como relación a `users`.
     *
     * Los usuarios del panel son cuentas de administración, no firmas
     * editoriales: atarlos obligaría a crear un usuario con acceso al CMS por
     * cada persona que firme un artículo. Además el sitio actual no publica
     * páginas de autor (0 URLs `/author/`), así que no hay nada que enlazar.
     */
    {
      name: "autor",
      type: "text",
      label: "Autor",
      admin: { position: "sidebar", description: "Firma que aparece en el artículo." },
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen para el índice y para la descripción social." },
    },
    {
      name: "imagenDestacada",
      type: "upload",
      relationTo: "media",
      label: "Imagen destacada",
      admin: { description: "Se usa en el índice y como imagen social." },
    },
    { name: "contenido", type: "richText", label: "Contenido" },
    seoField(),
  ],
};
