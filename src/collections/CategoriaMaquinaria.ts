import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarCategoriaNueva, revalidarCategoriaNuevaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Categorías transversales de la línea NUEVA
 * (`/…/maquinaria-pesada-nueva/excavadoras/`, `cargadores`, `compactadores`).
 *
 * Son vistas por tipo que **cruzan marcas**: la de excavadoras reúne las de Case,
 * Hitachi y Yanmar. Están indexadas, así que se preservan como rutas (ADR 0007).
 *
 * Los tipos que agrega se declaran por RELACIÓN explícita en vez de deducirse del
 * nombre del slug. Deducirlo sería frágil: los tipos reales se llaman
 * `excavadoras-hitachi`, `minicargadores-case`, `compactador-de-suelo-dynapac`…
 * y no hay una regla de nombres fiable que los agrupe.
 */
export const CategoriaMaquinaria: CollectionConfig = {
  slug: "categorias-maquinaria",
  labels: { singular: "Categoría de maquinaria nueva", plural: "Categorías de maquinaria nueva" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Maquinaria",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [revalidarCategoriaNueva], afterDelete: [revalidarCategoriaNuevaBorrada] },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    {
      name: "tiposIncluidos",
      type: "relationship",
      relationTo: "tipos-maquinaria",
      hasMany: true,
      label: "Tipos que agrupa",
      admin: {
        description:
          "Tipos de distintas marcas que se listan en esta categoría. Es lo que define su contenido.",
      },
    },
    seoField(),
  ],
};
