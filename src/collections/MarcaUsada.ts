import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarMarcaUsada, revalidarMarcaUsadaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

/**
 * Marcas de la línea USADA (paso b del marketplace; decisión D1 de dirección,
 * 2026-10-13). Crear una marca crea su página:
 * `/maquinaria-pesada/maquinaria-pesada-usada/marcas/<marca>/`, con las
 * unidades disponibles de esa marca y sus filtros.
 *
 * Colección propia, no una relación con las marcas de maquinaria nueva ni con
 * las de repuestos: en usada entra cualquier marca (Caterpillar, Komatsu,
 * LiuGong…), y cada línea tiene su URL y su intención de búsqueda. Los enlaces
 * opcionales a la marca de nueva y a la de repuestos son solo para enlazar
 * entre páginas.
 *
 * Sin unidades disponibles, la página no se indexa ni sale en el sitemap (D4).
 */
export const MarcaUsada: CollectionConfig = {
  slug: "marcas-usada",
  labels: { singular: "Marca de maquinaria usada", plural: "Marcas de maquinaria usada" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Maquinaria",
    description:
      "Cada marca tiene su página con las unidades usadas disponibles. Se crea sola al guardar una unidad con una marca nueva.",
  },
  access: {
    read: publico,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarMarcaUsada],
    afterDelete: [revalidarMarcaUsadaBorrada],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    slugField({ unique: true }),
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
      admin: {
        description:
          "Texto bajo el título de la página de la marca. También sirve de descripción en Google si no escribes una abajo.",
      },
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
      admin: {
        description:
          "Opcional. Todavía no sale en la página de la marca: se guarda para cuando tenga su diseño.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "marcaNueva",
          type: "relationship",
          relationTo: "marcas-maquinaria",
          label: "Misma marca en maquinaria nueva",
          admin: {
            width: "50%",
            description: "Opcional. Si la vendemos nueva, su página enlaza a la de nueva.",
          },
        },
        {
          name: "marcaRepuestos",
          type: "relationship",
          relationTo: "marcas",
          label: "Misma marca en repuestos",
          admin: {
            width: "50%",
            description: "Opcional. Si tenemos repuestos, su página enlaza a la de repuestos.",
          },
        },
      ],
    },
    seoField(),
  ],
};
