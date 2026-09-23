import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("categorias-tecnicas");

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
    group: "Repuestos",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [portada.afterChange], afterDelete: [portada.afterDelete] },
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
    /*
     * Fase B de la home: tarjeta apilada de la sección 5 de ux-9. Opcional.
     *
     * El ICONO es un SELECT, no una subida: `Media` no admite SVG (un SVG
     * subido puede llevar script, §10.28), así que los iconos viven en el
     * código y aquí se elige cuál. Qué juego de iconos, depende de la licencia
     * L2 (Flaticon): los valores nombran el PAPEL, no el fichero.
     */
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen de la tarjeta en la portada",
    },
    {
      name: "icono",
      type: "select",
      label: "Icono",
      options: [
        { label: "Corte (cuchillas, puntas)", value: "corte" },
        { label: "Llantas y rines", value: "llanta" },
        { label: "Lubricantes", value: "lubricante" },
        { label: "Filtración", value: "filtro" },
        { label: "Motor", value: "motor" },
        { label: "Tren de rodaje", value: "rodaje" },
      ],
    },
    {
      name: "enlace",
      type: "text",
      label: "Enlace de la tarjeta",
      validate: validarEnlace,
      admin: { description: "Ruta del sitio (/…) o https://" },
    },
    seoField(),
  ],
};
