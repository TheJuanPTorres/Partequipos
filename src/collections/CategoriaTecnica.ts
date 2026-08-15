import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Categorías técnicas transversales del proyecto (Tren de Rodaje, Filtración,
 * GETS, Lubricantes, etc.). Independiente de la jerarquía Marca -> Tipo ->
 * Modelo: por ahora solo se modela, no se relaciona con Modelo.
 * La carga de las ~10 categorías reales es de la siguiente tarea (datos).
 */
export const CategoriaTecnica: CollectionConfig = {
  slug: "categorias-tecnicas",
  labels: {
    singular: "Categoría técnica",
    plural: "Categorías técnicas",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    // Colección de nivel superior e independiente: unicidad global del slug.
    slugField({ unique: true }),
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    seoField(),
  ],
};
