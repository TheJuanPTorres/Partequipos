import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";

/**
 * Marcas de la línea de maquinaria NUEVA (Case Construction, Dynapac, Hitachi,
 * Yanmar y Aditamentos).
 *
 * Separada de `Marca` (repuestos) a propósito: son entidades distintas con URLs
 * y contenido distintos, aunque algunos nombres coincidan. Ver ADR 0007.
 *
 * «Aditamentos» figura aquí como una marca más porque así está en producción,
 * con sus tipos hijos y sin fichas. Es una anomalía de catalogación del sitio
 * origen que se replica, no se corrige (mismo criterio que el ADR 0004).
 */
export const MarcaMaquinaria: CollectionConfig = {
  slug: "marcas-maquinaria",
  labels: { singular: "Marca de maquinaria", plural: "Marcas de maquinaria" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Maquinaria",
  },
  access: { read: () => true },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    // Nivel superior de su rama: unicidad global del slug.
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    { name: "logo", type: "upload", relationTo: "media", label: "Logo" },
    seoField(),
  ],
};
