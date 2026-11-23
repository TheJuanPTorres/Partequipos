import type { CollectionConfig } from "payload";
import { ocultoSinUso } from "../lib/fields/ocultoSinUso";
import { conPestanas } from "../lib/fields/pestanasFicha";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarCategoriaUsada, revalidarCategoriaUsadaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";
import { slugCategoriaUsadaNoReservado } from "../lib/usados/slugsReservados";

const menu = revalidarMegamenu("categorias-usada");

/**
 * Categorías de la línea USADA: las 9 rutas indexadas bajo
 * `/maquinaria-pesada/maquinaria-pesada-usada/`.
 *
 * El documento del cliente describe la usada como «marketplace programático, no
 * páginas estáticas». Eso define cómo se GENERA el contenido, no que las URLs
 * desaparezcan: existen y están posicionadas. Aquí son rutas reales alimentadas
 * por el inventario de `EquipoUsado` (ADR 0007).
 */
export const CategoriaUsada: CollectionConfig = {
  slug: "categorias-usada",
  labels: { singular: "Categoría de maquinaria usada", plural: "Categorías de maquinaria usada" },
  admin: {
    useAsTitle: "nombre",
    group: "Maquinaria",
  },
  /*
   * ORDEN POR ARRASTRE (2026-11-19, dirección; informe del panel §6): `_order` oculto de Payload,
   * con el orden inicial de hoy puesto por la migración `orden_resto`. Lo nuevo entra al final. La
   * web lo usa cuando se pasen sus consultas a `_order` (§6.3).
   */
  orderable: true,
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarCategoriaUsada, menu.afterChange],
    afterDelete: [revalidarCategoriaUsadaBorrada, menu.afterDelete],
  },
  // Pestañas Contenido · Fotos · Buscadores y redes · Avanzado (fase 2 del panel, sin esquema).
  fields: conPestanas(
    [
      { name: "nombre", type: "text", required: true, label: "Nombre" },
      // «marcas» y «otros» están reservadas: las usan las páginas de marca (D1) y «Otros».
      slugField({ unique: true, validate: slugCategoriaUsadaNoReservado }),
      { name: "descripcion", type: "textarea", label: "Descripción" },
      {
        name: "imagen",
        type: "upload",
        relationTo: "media",
        label: "Imagen de la tarjeta",
        admin: {
          description:
            "Opcional. La foto de la tarjeta de esta categoría en la página «Maquinaria pesada usada». Vacía, sale la primera foto de su unidad más reciente.",
        },
      },
      /*
       * Primer nivel u «Otros» (cliente, 2026-10-19, como en WordPress): en el
       * menú y en el índice de usados solo salen las categorías de primer nivel y
       * la entrada «Otros», cuya página lista las agrupadas. Una categoría nueva
       * va a «Otros» por defecto. Su página y sus fichas no cambian.
       */
      {
        name: "enOtros",
        type: "checkbox",
        label: "Agrupar en «Otros»",
        defaultValue: true,
        admin: {
          description:
            "Marcada, la categoría sale dentro de «Otros» (menú e índice de usados). Desmarcada, sale sola en el primer nivel, como Excavadora y Aditamentos. Su página no cambia.",
        },
      },
      // Ocultar sin borrar (2026-10-20, dirección: Compactadores). Ver `getCategoriasUsada`.
      {
        name: "mostrarEnWeb",
        type: "checkbox",
        defaultValue: true,
        label: "Mostrar en la web",
        admin: {
          position: "sidebar",
          description:
            "Desmarcada, la categoría y sus unidades desaparecen de toda la web (menú, índice, «Otros», pestañas, listados y sitemap) sin borrarse del panel, y su dirección da «página no encontrada». Para llevarla a otra página, crear una redirección en «Redirecciones».",
        },
      },
      /*
       * La web ya no lo lee (manda el orden arrastrando de la lista): OCULTO sin tocar el esquema
       * (tanda 21, PR-4, 2026-11-23), hasta su borrado con migración.
       */
      ocultoSinUso({
        name: "orden",
        type: "number",
        label: "Orden en el primer nivel",
        admin: {
          description:
            "Solo para las que NO van en «Otros»: el número más bajo sale primero (vacío, al final, por nombre). «Otros» va siempre detrás.",
          condition: (datos) => datos?.enOtros === false,
        },
      }),
      seoField(),
    ],
    { fotos: { imagen: "tarjeta" } },
  ),
};
