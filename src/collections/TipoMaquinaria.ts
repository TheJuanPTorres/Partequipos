import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarTipoMaquinaria, revalidarTipoMaquinariaBorrado } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Tipo de equipo dentro de una marca de maquinaria nueva
 * (ej. «Bulldozer» de Case Construction).
 */
export const TipoMaquinaria: CollectionConfig = {
  slug: "tipos-maquinaria",
  labels: { singular: "Tipo de maquinaria", plural: "Tipos de maquinaria" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
    group: "Maquinaria",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: { afterChange: [revalidarTipoMaquinaria], afterDelete: [revalidarTipoMaquinariaBorrado] },
  /*
   * Unicidad del slug POR MARCA, igual que en repuestos: `excavadoras` existe
   * bajo Case y bajo Hitachi, y la URL las distingue. Con unicidad global la
   * segunda no se podría crear.
   */
  indexes: [{ fields: ["marca", "slug"], unique: true }],
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas-maquinaria",
      required: true,
      label: "Marca",
    },
    { name: "descripcion", type: "textarea", label: "Descripción" },
    seoField(),
  ],
};
