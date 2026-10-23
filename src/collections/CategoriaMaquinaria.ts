import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { slugCategoriaNuevaValido } from "../lib/nueva/slugsReservados";
import { revalidarCategoriaNueva, revalidarCategoriaNuevaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

const menu = revalidarMegamenu("categorias-maquinaria");

/**
 * Categorías transversales de la línea NUEVA
 * (`/…/maquinaria-pesada-nueva/excavadoras/`, `cargadores`, `compactadores`). Desde el
 * 2026-10-23 (tarea 9) son también la PÁGINA GENERAL de cada tipo, aunque solo tenga una marca
 * (bulldozers, motoniveladoras…): el menú y el índice de tipos llevan siempre aquí.
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
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaNueva, menu.afterChange],
    afterDelete: [revalidarCategoriaNuevaBorrada, menu.afterDelete],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    // «marcas», «tipos» y «pagina» están reservadas: son páginas fijas al mismo nivel. Y ninguna
    // redirección puede salir de su URL: la taparía (2026-10-23).
    slugField({ unique: true, validate: slugCategoriaNuevaValido }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    /*
     * Foto de la tarjeta de la categoría en el índice de tipos de maquinaria nueva (2026-10-23,
     * dirección: la misma de su tarjeta en WordPress). Vacía, la del primer equipo con foto.
     */
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen de la tarjeta",
      admin: {
        description:
          "Opcional. Foto de la categoría para su tarjeta en el índice de tipos de maquinaria nueva. Si la dejas vacía, se usa la primera foto del primer equipo de la categoría.",
      },
    },
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
