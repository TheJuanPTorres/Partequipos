import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { marcaDelTipoCoincide } from "./hooks/marcaDelTipo";
import { revalidarModelo, revalidarModeloBorrado } from "./hooks/revalidateHooks";
import { mostrarEnWebField } from "../lib/fields/mostrarEnWeb";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { avisoField } from "../lib/fields/avisoField";
import { validarSerieDelModelo } from "../lib/repuestos/series";

/**
 * Modelo concreto dentro de un tipo de equipo (ej. "CAT 320D" en Excavadora).
 * Nivel más profundo de la jerarquía: Marca -> Tipo -> Modelo.
 */
export const ModeloRepuesto: CollectionConfig = {
  slug: "modelos-repuesto",
  labels: {
    singular: "Modelo",
    plural: "Modelos",
  },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "imagenes", "marca", "tipo", "slug", "mostrarEnWeb"],
    group: "Repuestos",
    // El código («320D») es como busca un comercial; el nombre solo no basta.
    listSearchableFields: ["nombre", "codigo"],
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // Unicidad del slug POR TIPO (el tipo ya implica una marca). Ver reporte.
  indexes: [{ fields: ["tipo", "slug"], unique: true }],
  // ISR: revalida la ficha y la página del tipo donde el modelo se lista.
  hooks: {
    // La marca desnormalizada tiene que ser la del tipo (ver el hook).
    beforeValidate: [marcaDelTipoCoincide("tipos-equipo")],
    afterChange: [revalidarModelo],
    afterDelete: [revalidarModeloBorrado],
  },
  fields: [
    // Aviso en vivo si la galería está vacía (F4).
    avisoField("avisoSinFotos", "AvisoSinFotos"),
    {
      name: "nombre",
      type: "text",
      required: true,
      label: "Nombre",
    },
    mostrarEnWebField({
      descripcion:
        "Desmarcado, el modelo desaparece de toda la web (listados del tipo y de la marca, buscador y sitemap) sin borrarse del panel, y su página lleva a la de su tipo. Vuelve al marcarlo.",
    }),
    slugField(),
    // `marca` va antes que `tipo` para poder filtrar los tipos por la marca
    // elegida. Desnormalizada a propósito (consultas y breadcrumbs).
    {
      name: "marca",
      type: "relationship",
      relationTo: "marcas",
      required: true,
      label: "Marca",
      admin: {
        description:
          "Tiene que ser la marca del tipo de equipo de abajo. Si la cambias, vuelve a elegir el tipo.",
      },
    },
    {
      name: "tipo",
      type: "relationship",
      relationTo: "tipos-equipo",
      required: true,
      label: "Tipo de equipo",
      admin: {
        description: "Solo aparecen los tipos de la marca elegida arriba.",
      },
      // Filtra el desplegable de tipos por la marca ya seleccionada.
      filterOptions: ({ siblingData }) => {
        const marca = (siblingData as { marca?: number | string | null }).marca;
        return marca ? { marca: { equals: marca } } : true;
      },
    },
    {
      name: "codigo",
      type: "text",
      label: "Código",
      admin: {
        description: "Código del modelo, ej. 320D.",
      },
    },
    {
      name: "serie",
      type: "text",
      label: "Serie",
      validate: validarSerieDelModelo,
      admin: {
        description:
          "Solo si su tipo de equipo tiene series: el nombre de una de ellas, ej. «EX» o «ZAXIS». Vacío: el modelo sale en «Otros modelos».",
      },
    },
    {
      name: "descripcion",
      type: "textarea",
      label: "Descripción",
      admin: {
        description:
          "El texto de presentación de la página del modelo, junto a su foto. Del WordPress, tal cual.",
      },
    },
    /*
     * El resto del contenido de la página de modelo de WordPress (decisión del
     * cliente, 2026-10-17: se migra todo tal cual, erratas incluidas). Un
     * `collapsible` no anida en la base: son columnas del modelo.
     */
    {
      type: "collapsible",
      label: "Textos de la página del modelo",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "antetitulo",
          type: "text",
          label: "Antetítulo",
          admin: { description: "Sobre el título, ej. «Repuestos para Maquinaria Pesada»." },
        },
        {
          name: "tituloPagina",
          type: "text",
          label: "Título de la página",
          admin: {
            description:
              "El título grande, ej. «HITACHI Excavadora ZX200». Vacío: «Repuestos» y el nombre del modelo.",
          },
        },
        {
          name: "tituloDisponibles",
          type: "text",
          label: "Título de las categorías",
          admin: {
            description:
              "Sobre las categorías, ej. «repuestos disponibles para excavadora hitachi zx200». Vacío: «Repuestos disponibles para» y el nombre.",
          },
        },
        {
          name: "piezas",
          type: "array",
          label: "Lista de piezas",
          labels: { singular: "Pieza", plural: "Piezas" },
          admin: {
            description:
              "La lista de WordPress («- Filtros para …»). Solo se ve si marcas la casilla de abajo.",
            initCollapsed: true,
          },
          fields: [{ name: "texto", type: "text", required: true, label: "Texto" }],
        },
        {
          name: "mostrarPiezas",
          type: "checkbox",
          label: "Mostrar la lista de piezas",
          defaultValue: false,
          admin: {
            description:
              "En WordPress la lista solo se ve en algunas páginas; en el resto está guardada pero oculta.",
          },
        },
      ],
    },
    {
      name: "imagenes",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      label: "Imágenes (galería)",
      admin: { components: { Cell: "/components/admin/celdas/CeldaMiniatura" } },
    },
    seoField(),
  ],
};
