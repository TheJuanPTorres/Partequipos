import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";

import { slugField } from "../lib/fields/slugField";
import { revalidarMarca, revalidarMarcaBorrada } from "./hooks/revalidateHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

const menu = revalidarMegamenu("marcas");

/**
 * Marcas de maquinaria y repuestos (Caterpillar, CASE, etc.).
 */
export const Marca: CollectionConfig = {
  slug: "marcas",
  labels: {
    singular: "Marca de repuestos",
    plural: "Marcas de repuestos",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug"],
    group: "Repuestos",
  },
  access: {
    read: lecturaContenido,
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
      admin: {
        description:
          "Presentación bajo el título de la página de la marca. También sirve de descripción en Google si no hay otra.",
      },
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo",
      admin: {
        description:
          "Con fondo transparente (PNG o WebP). En la página de la marca va sobre una placa oscura, porque los logos actuales del cliente son blancos.",
      },
    },
    // Megamenú (2026-10-17): el submenú es blanco sólido desde el #205.
    {
      name: "logoOscuroEnMenu",
      type: "checkbox",
      defaultValue: false,
      label: "Pintar el logo en oscuro en el menú",
      admin: {
        description:
          "Márcala si el logo es blanco o muy claro: en el menú de la cabecera, que es blanco, se pintará en una sola tinta oscura para que se vea. Desmarcada, el logo sale con sus colores.",
      },
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
    // Buscadores y redes sociales (2026-10-13, aprobado por dirección): las
    // 13 páginas de marca del mapa de alcance no tenían título ni descripción
    // editables.
    seoField(),
  ],
};
