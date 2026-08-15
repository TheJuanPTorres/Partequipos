import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import {
  revalidarCategoriaLubricante,
  revalidarCategoriaLubricanteBorrada,
} from "./hooks/lubricantesHooks";

/**
 * Categoría de aplicación de una marca de lubricantes:
 * `/lubricantes/{marca}/{slug}/`.
 *
 * Son las 4 del rastreo (auto liviano, auto pesado, engranajes, motos &
 * scooter): agrupan por **uso**, no por producto. En el sitio actual no hay ni
 * una ficha de producto individual, así que no se modela ninguna.
 */
export const CategoriaLubricante: CollectionConfig = {
  slug: "categorias-lubricante",
  labels: { singular: "Categoría de lubricante", plural: "Categorías de lubricante" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
    group: "Lubricantes",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaLubricante],
    afterDelete: [revalidarCategoriaLubricanteBorrada],
  },
  // Unicidad por marca: dos marcas pueden tener una categoría "auto-liviano".
  indexes: [{ fields: ["marca", "slug"], unique: true }],
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas-lubricante",
      required: true,
      label: "Marca",
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Resumen de una o dos líneas, bajo el título." },
    },
    { name: "descripcion", type: "richText", label: "Descripción" },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen",
      admin: { description: "Se usa también como imagen social." },
    },
    /*
     * Líneas de producto, en texto libre y OPCIONALES.
     *
     * Queda vacío en los datos de demostración a propósito: no tenemos el
     * catálogo real de Eni y publicar viscosidades o especificaciones API/ACEA
     * inventadas sobre un lubricante real sería peor que no publicar nada. El
     * campo existe para que el cliente lo rellene con su catálogo.
     */
    {
      name: "productos",
      type: "array",
      label: "Líneas de producto",
      labels: { singular: "Producto", plural: "Productos" },
      admin: {
        description:
          "Nombre comercial y descripción tal como los publica el fabricante. No inventar especificaciones.",
      },
      fields: [
        { name: "nombre", type: "text", required: true, label: "Nombre" },
        { name: "descripcion", type: "textarea", label: "Descripción" },
      ],
    },
    seoField(),
  ],
};
