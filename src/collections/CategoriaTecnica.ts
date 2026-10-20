import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import {
  revalidarCategoriasDeRepuestos,
  revalidarMarcasDeRepuestos,
  revalidarModelosDeRepuestos,
} from "../lib/revalidation";
import { revalidarMegamenu } from "./hooks/megamenuHooks";
import { revalidarPortada } from "./hooks/portadaHooks";

const portada = revalidarPortada("categorias-tecnicas");
// «Repuestos por categoría técnica» del megamenú (2026-10-20).
const megamenu = revalidarMegamenu("categorias-tecnicas");

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
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  // La portada y las páginas de marca (las categorías son comunes a las marcas).
  hooks: {
    afterChange: [
      portada.afterChange,
      megamenu.afterChange,
      ({ doc }) => {
        revalidarMarcasDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""}`);
        revalidarModelosDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""}`);
        revalidarCategoriasDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""}`);
        return doc;
      },
    ],
    afterDelete: [
      portada.afterDelete,
      megamenu.afterDelete,
      ({ doc }) => {
        revalidarMarcasDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""} borrada`);
        revalidarModelosDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""} borrada`);
        revalidarCategoriasDeRepuestos(`categorias-tecnicas ${doc?.id ?? ""} borrada`);
        return doc;
      },
    ],
  },
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
      label: "Imagen de la tarjeta",
      admin: {
        description:
          "La de su tarjeta en la portada, el menú, el índice de categorías técnicas y las páginas de tipo. También la cabecera de su página si no tiene «Fondo del encabezado».",
      },
    },
    {
      name: "fondoHero",
      type: "upload",
      relationTo: "media",
      label: "Fondo del encabezado",
      admin: {
        description:
          "Opcional. Foto horizontal de obra a todo el ancho para la cabecera de su página. Vacía, la imagen de la tarjeta (y sin ella, la de la primera marca de repuestos con foto).",
      },
    },
    {
      name: "icono",
      type: "select",
      label: "Icono",
      admin: {
        description:
          "Dibujo que acompaña a la categoría en la tarjeta de la portada y en «Nuestras categorías de repuestos» de las páginas de marca.",
      },
      options: [
        { label: "Corte (cuchillas, puntas)", value: "corte" },
        { label: "Llantas y rines", value: "llanta" },
        { label: "Lubricantes", value: "lubricante" },
        { label: "Filtración", value: "filtro" },
        { label: "Motor", value: "motor" },
        { label: "Tren de rodaje", value: "rodaje" },
        { label: "Misceláneos (herramientas)", value: "miscelaneos" },
        { label: "Componentes mayores", value: "componentes" },
        { label: "Motor diésel", value: "diesel" },
      ],
    },
    /*
     * Título de la tarjeta de la portada (2026-10-02): ux-9 dice «Blades y
     * corte» donde el catálogo dice «Herramienta de Corte (GETS)». Vacío, la
     * tarjeta usa el nombre real; así no hay que renombrar la categoría.
     */
    {
      name: "tituloPortada",
      type: "text",
      label: "Título en portada",
      admin: {
        description: "Opcional. Vacío: la tarjeta de la portada usa el nombre de la categoría.",
      },
    },
    {
      name: "enlace",
      type: "text",
      label: "Enlace de la tarjeta",
      validate: validarEnlace,
      admin: {
        description:
          "A dónde llevan la tarjeta de la portada y la categoría en las páginas de marca. Ruta del sitio (/…) o https://.",
      },
    },
    /*
     * Fase E: QUÉ categorías salen en la sección 5 de la portada y en qué
     * orden. Un solo campo para las dos cosas: vacío, no sale. Así el orden
     * de ux-9 (Blades, Llantas, Lubricantes, Filtración) no depende del nombre.
     */
    {
      name: "ordenPortada",
      type: "number",
      min: 1,
      label: "Posición en la portada",
      admin: {
        position: "sidebar",
        description:
          "Vacío: no sale en la portada. 1, 2, 3… es el orden de las tarjetas de «Venta de repuestos».",
      },
    },
    /*
     * Páginas de marca de repuestos: las categorías son COMUNES a todas las
     * marcas (decisión de dirección, 2026-10-13). Aquí solo el ORDEN: vacío,
     * van al final por nombre. Sin relación con la marca.
     */
    {
      name: "ordenMarca",
      type: "number",
      min: 1,
      label: "Posición en las páginas de marca",
      admin: {
        position: "sidebar",
        description:
          "Orden en «Nuestras categorías de repuestos» de cada página de marca. Vacío: al final, por nombre.",
      },
    },
    /*
     * «QUÉ INCLUYE» (2026-10-18, dirección): los grupos de productos de la categoría, como
     * en WordPress: una tarjeta por grupo con su foto, su nombre y la lista de productos
     * que despliega «Ver productos». Vacío: la página no pinta el apartado.
     */
    {
      name: "grupos",
      type: "array",
      label: "Qué incluye",
      labels: { singular: "Grupo", plural: "Grupos" },
      maxRows: 12,
      admin: {
        initCollapsed: true,
        description:
          "Los grupos de productos de la categoría (de 2 a 8 suelen bastar): cada uno con su foto, su nombre y la lista de lo que incluye. Salen en la página de la categoría bajo «Qué incluye».",
      },
      fields: [
        { name: "nombre", type: "text", required: true, label: "Nombre del grupo" },
        {
          name: "mostrar",
          type: "checkbox",
          defaultValue: true,
          label: "Mostrar en la web",
          admin: {
            description:
              "Desmarcada, el grupo se guarda pero no sale en la página. Sirve para tener listo un grupo y activarlo cuando se quiera.",
          },
        },
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Foto del grupo",
        },
        {
          name: "productos",
          type: "array",
          label: "Productos que incluye",
          labels: { singular: "Producto", plural: "Productos" },
          maxRows: 40,
          admin: { initCollapsed: true },
          fields: [{ name: "texto", type: "text", required: true, label: "Producto" }],
        },
      ],
    },
    // Tiene página propia desde el 2026-10-13 (provisional hasta el diseño de Andrés). Las URL
    // heredadas de segundo nivel y las duplicadas siguen sin decidir (docs/redirects-map.csv).
    seoField(),
  ],
};
