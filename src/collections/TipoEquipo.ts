import type { CollectionConfig, Where } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarTipo, revalidarTipoBorrado } from "./hooks/revalidateHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarMegamenu } from "./hooks/megamenuHooks";
import { validarSerieDeEntrada, validarSeries } from "../lib/repuestos/series";
import { slugPadreDelTipo, slugPadreDeLosHijos } from "./hooks/tipoPadre";

const menu = revalidarMegamenu("tipos-equipo");

/**
 * Tipo de equipo dentro de una marca (ej. "Excavadora" de CAT).
 * Nivel intermedio de la jerarquía de repuestos: Marca -> Tipo -> Modelo.
 */
export const TipoEquipo: CollectionConfig = {
  slug: "tipos-equipo",
  labels: {
    singular: "Tipo de equipo",
    plural: "Tipos de equipo",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "marca", "slug"],
    group: "Repuestos",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // Unicidad del slug POR MARCA (no global): "excavadora" puede existir bajo
  // CAT y bajo Komatsu sin chocar. Ver justificación en el reporte del sprint.
  indexes: [{ fields: ["marca", "slug"], unique: true }],
  // ISR: revalida el tipo, la página de su marca y las fichas de sus modelos.
  hooks: {
    beforeValidate: [slugPadreDelTipo],
    afterChange: [slugPadreDeLosHijos, revalidarTipo, menu.afterChange],
    afterDelete: [revalidarTipoBorrado, menu.afterDelete],
  },
  fields: [
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    // slug sin unicidad global; la unicidad la da el índice compuesto de arriba.
    slugField(),
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas",
      required: true,
      label: "Marca",
    },
    /*
     * «Cuelga de» (2026-10-17, dirección): SOLO para conservar una URL heredada
     * de WordPress donde un tipo colgaba de otro (la «Excavadora» de CASE, bajo
     * «Cargador frontal»). Ver `src/lib/repuestos/anidado.ts`.
     */
    {
      name: "tipoPadre",
      type: "relationship",
      relationTo: "tipos-equipo",
      label: "Cuelga de",
      admin: {
        description:
          "Casi siempre vacío. Solo para conservar una dirección web antigua en la que este tipo colgaba de otro tipo de la misma marca: la página del tipo quedará bajo la de ese tipo. Cambiarlo cambia la dirección web (se crea la redirección).",
      },
      filterOptions: ({ siblingData, id }) => {
        const marca = (siblingData as { marca?: number | string | null }).marca;
        const condiciones: Where[] = [{ tipoPadre: { exists: false } }];
        if (marca) condiciones.push({ marca: { equals: marca } });
        if (id) condiciones.push({ id: { not_equals: id } });
        return { and: condiciones };
      },
    },
    {
      name: "slugPadre",
      type: "text",
      label: "Dirección web del tipo del que cuelga",
      // La pone el servidor desde «Cuelga de» (`slugPadreDelTipo`); compone la URL.
      admin: { hidden: true, readOnly: true },
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
      admin: {
        description:
          "Texto bajo el título de la página del tipo. También sirve de descripción en Google si no hay otra.",
      },
    },
    /*
     * Foto de la tarjeta «Repuestos según tipo de máquina» de la página de la
     * marca. Opcional: sin ella la tarjeta se pinta solo con el título.
     */
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      label: "Imagen de la tarjeta",
      admin: {
        description: "Opcional. Foto del tipo de máquina para la tarjeta de la página de la marca.",
      },
    },
    /*
     * SERIES (2026-10-17, dirección): un tipo puede repartir sus modelos por
     * serie de fabricante, como Hitachi en WordPress (excavadora EX y ZAXIS).
     * Con series, la página de la marca pinta una tarjeta por serie (en vez de
     * la del tipo) que baja al ancla de su serie en la página del tipo, y esta
     * agrupa los modelos por serie. Sin URL propia ni SEO: WordPress tampoco
     * los tenía. Vacío, como siempre. El ORDEN es el de las filas (arrastrar).
     */
    {
      name: "series",
      type: "array",
      label: "Series",
      labels: { singular: "Serie", plural: "Series" },
      validate: validarSeries,
      admin: {
        description:
          "Opcional. Solo si los modelos de este tipo se reparten por serie del fabricante (ej. EX y ZAXIS). La página de la marca pinta una tarjeta por serie, en este orden, y la del tipo agrupa los modelos. Cada modelo elige su serie en su ficha.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "nombre",
          type: "text",
          required: true,
          label: "Nombre de la serie",
          admin: { description: "Como lo escribe el fabricante, ej. «EX» o «ZAXIS»." },
        },
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Foto de la tarjeta",
          admin: { description: "Opcional. Sin ella, la tarjeta usa la imagen del tipo." },
        },
      ],
    },
    /*
     * OTRAS ENTRADAS DE LA LISTA (2026-10-17, decisión del cliente: se migra
     * todo como está en WordPress, erratas incluidas). Lo que la lista de
     * modelos de WordPress nombra y NO es un modelo de este tipo: un modelo
     * sin página propia (Caterpillar 326D2), que va como texto sin enlace, o
     * un texto que enlaza a la ficha de otro modelo («EX450LC-5» → la
     * ZX450LC-5). Detalle en docs/repuestos-importacion.md §12.
     */
    {
      name: "otrasEntradas",
      type: "array",
      label: "Otras entradas de la lista de modelos",
      labels: { singular: "Entrada", plural: "Entradas" },
      admin: {
        description:
          "Opcional. Modelos que se nombran en la lista de la página del tipo sin ser modelos de este tipo: sin ficha (solo el texto) o con enlace a la ficha de otro modelo.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "texto",
          type: "text",
          required: true,
          label: "Texto",
          admin: { description: "Tal como sale en la lista, ej. «Excavadora Caterpillar 326D2»." },
        },
        {
          name: "serie",
          type: "text",
          label: "Serie",
          validate: validarSerieDeEntrada,
          admin: {
            description:
              "Solo si el tipo tiene series: en cuál sale. Vacía: en «Otros modelos» (o en la lista, si el tipo no tiene series).",
          },
        },
        {
          name: "modelo",
          type: "relationship",
          relationTo: "modelos-repuesto",
          label: "Enlaza a la ficha de",
          admin: { description: "Opcional. Vacío: el texto sale sin enlace." },
        },
      ],
    },
    /*
     * Las categorías que pinta la página de CADA MODELO de este tipo, en este
     * orden. En WordPress eran una plantilla por tipo de máquina (10 en
     * excavadoras y buldóceres, 4 en miniexcavadoras…): se eligen una vez aquí.
     */
    {
      name: "categoriasModelo",
      type: "relationship",
      relationTo: "categorias-tecnicas",
      hasMany: true,
      label: "Categorías en las páginas de sus modelos",
      admin: {
        description:
          "Las categorías de repuestos que se muestran en la página de cada modelo de este tipo, en este orden. Vacío: no se muestra ninguna.",
      },
    },
    seoField(),
  ],
};
