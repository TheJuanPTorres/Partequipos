import type { CollectionConfig } from "payload";

import { slugField } from "../lib/fields/slugField";
import { revalidarMarca, revalidarMarcaBorrada } from "./hooks/revalidateHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

const menu = revalidarMegamenu("marcas");

/**
 * Marcas de maquinaria y repuestos (Caterpillar, CASE, etc.).
 */
export const Marca: CollectionConfig = {
  slug: "marcas",
  labels: {
    singular: "Marca",
    plural: "Marcas",
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
  // ISR: revalida la marca, los índices y su subárbol. Ver lib/revalidation.ts.
  hooks: {
    afterChange: [revalidarMarca, menu.afterChange],
    afterDelete: [revalidarMarcaBorrada, menu.afterDelete],
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    // Marca es de nivel superior: unicidad global del slug.
    slugField({ unique: true }),
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
    },
    /*
     * Página de marca de ux-9 (docs/diseno/decisiones-repuestos-marca.md).
     * La imagen es OPCIONAL: sin ella el encabezado se pinta sobre
     * un fondo liso (el logo de la marca, que ya existe, va sobre el título), sin hueco. Opcionales también para no romper el importador
     * de marcas (scripts/repuestos), que no la trae.
     */
    {
      name: "fondoHero",
      type: "upload",
      relationTo: "media",
      label: "Fondo del encabezado",
      admin: {
        description:
          "Opcional. Foto de obra a todo el ancho detrás del título de la página de la marca.",
      },
    },
  ],
};
