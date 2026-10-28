import type { CollectionConfig, RelationshipFieldSingleValidation, Where } from "payload";

import { validarColor } from "../lib/fields/tipografiaTitulo";
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

/**
 * «Cuelga de» (2026-10-26): un solo nivel. La que cuelga no puede colgar de sí misma ni de
 * otra que ya cuelga; y una que ya tiene páginas dentro no puede pasar a colgar de otra.
 */
const validarPadreCategoria: RelationshipFieldSingleValidation = async (valor, { req, id }) => {
  const padre = typeof valor === "object" && valor !== null ? (valor as { id?: number }).id : valor;
  if (padre === null || padre === undefined || padre === "") return true;
  if (id !== undefined && String(padre) === String(id))
    return "Una categoría no puede colgar de sí misma.";
  const elegido = await req.payload.findByID({
    collection: "categorias-tecnicas",
    id: padre as number,
    depth: 0,
    select: { padre: true },
  });
  if (elegido?.padre) return "Esa categoría ya cuelga de otra: elige una categoría normal.";
  if (id !== undefined) {
    const { totalDocs } = await req.payload.count({
      collection: "categorias-tecnicas",
      where: { padre: { equals: id } },
    });
    if (totalDocs > 0) return "Esta categoría tiene páginas dentro: no puede colgar de otra.";
  }
  return true;
};
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
    /*
     * PÁGINA DENTRO DE OTRA CATEGORÍA (2026-10-26, dirección: Filtros Donaldson dentro de
     * Filtración, en su URL de WordPress). Su dirección es la de la categoría seguida de la
     * suya, y sale bajo esa categoría en el menú y en su página, no en el índice de categorías.
     * Un solo nivel: una categoría que cuelga de otra no puede tener las suyas.
     */
    {
      name: "padre",
      type: "relationship",
      relationTo: "categorias-tecnicas",
      label: "Cuelga de",
      filterOptions: ({ id }) => {
        const condiciones: Where[] = [{ padre: { exists: false } }];
        if (id) condiciones.push({ id: { not_equals: id } });
        return { and: condiciones };
      },
      validate: validarPadreCategoria,
      admin: {
        position: "sidebar",
        description:
          "Solo para una página dentro de otra categoría (p. ej. «Filtros Donaldson» dentro de «Filtración»). Su dirección web es la de esa categoría seguida de la suya, y sale bajo ella en el menú y en su página, no en el índice. Vacío: una categoría normal.",
      },
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      label: "Logo de la marca",
      admin: {
        description:
          "Opcional, para una página de MARCA dentro de una categoría (p. ej. Donaldson): va en la cabecera de su página y en su acceso desde la categoría.",
      },
    },
    {
      name: "iconoMarca",
      type: "upload",
      relationTo: "media",
      label: "Icono de la marca (menú)",
      admin: {
        description:
          "Opcional: el símbolo de la marca SIN su nombre, para el botón del menú (ahí el nombre va escrito al lado). Vacío, el botón lleva solo el nombre.",
      },
    },
    // El mismo selector de color que las marcas (`campoColorMarca`), con su propia ayuda.
    {
      name: "colorMarca",
      type: "text",
      label: "Color de la marca",
      validate: validarColor,
      admin: {
        placeholder: "#007CC4",
        components: { Field: "/components/admin/CampoColor" },
        description:
          "Opcional, con el logo: el color del botón de esta página en el menú y de su acceso desde la categoría. El texto se pone solo en blanco o negro, el que mejor se lea.",
      },
    },
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
          "Dibujo que acompaña a la categoría en la tarjeta de la portada y en «Nuestras categorías de repuestos» de las páginas de tipo y de modelo.",
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
    /*
     * FOTO DE LA PORTADA (diseño del cliente, 2026-10-26): la pieza recortada de la tarjeta de
     * «Venta de repuestos». Aparte de la «Imagen de la tarjeta», que usan el índice de categorías,
     * las páginas de marca y el megamenú. Vacía, la tarjeta de la portada usa esa.
     */
    {
      name: "imagenPortada",
      type: "upload",
      relationTo: "media",
      label: "Foto en la portada",
      admin: {
        description:
          "Opcional: la pieza recortada (PNG o WebP transparente) de la tarjeta de la portada. Vacía: la «Imagen de la tarjeta».",
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
      label: "Posición en las páginas de repuestos",
      admin: {
        position: "sidebar",
        description:
          "Orden en «Nuestras categorías de repuestos» de las páginas de tipo y de modelo, y en el menú. Vacío: al final, por nombre.",
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
          name: "descripcion",
          type: "textarea",
          label: "Descripción del grupo",
          admin: {
            description:
              "Opcional. Una o dos frases bajo el nombre, en su tarjeta (p. ej. para qué sirve ese tipo de filtro). Un grupo con descripción sale aunque no tenga productos.",
          },
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
    /*
     * SECCIONES PROPIAS DE UNA PÁGINA DE MARCA dentro de una categoría (Filtros Donaldson,
     * 2026-10-26, dirección): la presentación con su carrusel de fotos y un «¿Por qué
     * elegirnos?» propio, con el contenido de su página de WordPress. Todo opcional: vacío, la
     * página no pinta la presentación y usa el «¿Por qué elegirnos?» general.
     */
    {
      name: "paginaMarca",
      type: "group",
      label: "Secciones propias de la página de marca",
      admin: {
        condition: (datos) => Boolean(datos?.padre),
        description:
          "Solo para una página de marca dentro de otra categoría (p. ej. Filtros Donaldson). Todo opcional.",
      },
      fields: [
        {
          name: "bienvenidaAntetitulo",
          type: "text",
          label: "Presentación: antetítulo",
          admin: { description: "La línea pequeña sobre el título." },
        },
        { name: "bienvenidaTitulo", type: "text", label: "Presentación: título" },
        {
          name: "bienvenidaTexto",
          type: "textarea",
          label: "Presentación: texto",
          admin: {
            description:
              "El texto de bienvenida. Si lo hay, la cabecera de la página ya no repite la «Descripción» (que sigue sirviendo para buscadores).",
          },
        },
        {
          name: "bienvenidaFotos",
          type: "upload",
          relationTo: "media",
          hasMany: true,
          maxRows: 8,
          label: "Presentación: fotos del carrusel",
          admin: {
            description:
              "Se ven enteras, una a una, con flechas y puntos; pasan solas cada 5 segundos, con botón de pausa.",
          },
        },
        {
          name: "porQueTitulo",
          type: "text",
          label: "¿Por qué elegirnos?: título",
          admin: {
            description:
              "Con título y foto, la página lleva su propio «¿Por qué elegirnos?» en lugar del general del sitio.",
          },
        },
        { name: "porQueTexto", type: "textarea", label: "¿Por qué elegirnos?: texto" },
        {
          name: "porQueImagen",
          type: "upload",
          relationTo: "media",
          label: "¿Por qué elegirnos?: foto",
        },
        {
          name: "compromisoTitulo",
          type: "text",
          label: "¿Por qué elegirnos?: frase destacada",
          admin: { description: "En negrita bajo el texto (p. ej. «Nuestro compromiso es…»)." },
        },
        {
          name: "compromisoTexto",
          type: "text",
          label: "¿Por qué elegirnos?: complemento de la frase",
        },
      ],
    },
    // Tiene página propia desde el 2026-10-13 (provisional hasta el diseño de Andrés). Las URL
    // heredadas de segundo nivel y las duplicadas siguen sin decidir (docs/redirects-map.csv).
    seoField(),
  ],
};
