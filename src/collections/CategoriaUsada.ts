import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarCategoriaUsada, revalidarCategoriaUsadaBorrada } from "./hooks/maquinariaHooks";

/**
 * Categorías de la línea USADA: las 9 rutas indexadas bajo
 * `/maquinaria-pesada/maquinaria-pesada-usada/`.
 *
 * El documento del cliente describe la usada como «marketplace programático, no
 * páginas estáticas». Eso define cómo se GENERA el contenido, no que las URLs
 * desaparezcan: existen y están posicionadas. Aquí son rutas reales alimentadas
 * por el inventario de `EquipoUsado` (ADR 0007).
 */
export const CategoriaUsada: CollectionConfig = {
  slug: "categorias-usada",
  labels: { singular: "Categoría de usada", plural: "Categorías de usada" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Maquinaria",
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidarCategoriaUsada], afterDelete: [revalidarCategoriaUsadaBorrada] },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    seoField(),
  ],
};
