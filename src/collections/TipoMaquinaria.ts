import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarTipoMaquinaria, revalidarTipoMaquinariaBorrado } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

const menu = revalidarMegamenu("tipos-maquinaria");

/**
 * Tipo de equipo dentro de una marca de maquinaria nueva
 * (ej. «Bulldozer» de Case Construction).
 */
export const TipoMaquinaria: CollectionConfig = {
  slug: "tipos-maquinaria",
  labels: { singular: "Tipo de maquinaria nueva", plural: "Tipos de maquinaria nueva" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
    group: "Maquinaria",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarTipoMaquinaria, menu.afterChange],
    afterDelete: [revalidarTipoMaquinariaBorrado, menu.afterDelete],
  },
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
    /*
     * Foto de la tarjeta del tipo en la página de su marca (2026-10-17). Vacía,
     * la tarjeta usa la primera foto del primer equipo del tipo.
     */
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen de la tarjeta",
      admin: {
        description:
          "Opcional. Foto del tipo para su tarjeta en la página de la marca. Si la dejas vacía, se usa la primera foto del primer equipo de este tipo.",
      },
    },
    seoField(),
  ],
};
