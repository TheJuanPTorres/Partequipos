import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarMarcaMaquinaria, revalidarMarcaMaquinariaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("marcas-maquinaria");

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
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarMarcaMaquinaria, portada.afterChange],
    afterDelete: [revalidarMarcaMaquinariaBorrada, portada.afterDelete],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    // Nivel superior de su rama: unicidad global del slug.
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    { name: "logo", type: "upload", relationTo: "media", label: "Logo" },
    // Fase B de la home: fondo de la tarjeta de marca (sección 2). Opcional.
    {
      name: "imagenTarjeta",
      type: "upload",
      relationTo: "media",
      label: "Foto de la tarjeta en la portada",
      admin: { description: "Fondo de la tarjeta de esta marca en el inicio." },
    },
    seoField(),
  ],
};
