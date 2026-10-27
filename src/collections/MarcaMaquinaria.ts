import { campoColorMarca } from "@/lib/fields/colorMarca";
import { TEXTOS_ADITAMENTOS as T } from "@/lib/nueva/paginaAditamentos";
import type { CollectionConfig } from "payload";

import { seoField } from "../lib/fields/seoField";
import { slugField } from "../lib/fields/slugField";
import { revalidarMarcaMaquinaria, revalidarMarcaMaquinariaBorrada } from "./hooks/maquinariaHooks";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";
import { revalidarPortada } from "./hooks/portadaHooks";
import { revalidarMegamenu } from "./hooks/megamenuHooks";

const portada = revalidarPortada("marcas-maquinaria");

const menu = revalidarMegamenu("marcas-maquinaria");

/**
 * Marcas de la línea de maquinaria NUEVA (Case Construction, Dynapac, Hitachi,
 * Yanmar y Aditamentos).
 *
 * Separada de `Marca` (repuestos) a propósito: son entidades distintas con URLs
 * y contenido distintos, aunque algunos nombres coincidan. Ver ADR 0007.
 *
 * «Aditamentos» figura aquí como una marca más porque así está en producción,
 * con sus tipos hijos y sin fichas. Es una anomalía de catalogación del sitio
 * origen que se replica, no se corrige (mismo criterio que el ADR 0004).
 */
export const MarcaMaquinaria: CollectionConfig = {
  slug: "marcas-maquinaria",
  labels: { singular: "Marca de maquinaria nueva", plural: "Marcas de maquinaria nueva" },
  admin: {
    useAsTitle: "nombre",
    defaultColumns: ["nombre", "slug", "mostrarEnWeb"],
    group: "Maquinaria",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    afterChange: [revalidarMarcaMaquinaria, portada.afterChange, menu.afterChange],
    afterDelete: [revalidarMarcaMaquinariaBorrada, portada.afterDelete, menu.afterDelete],
  },
  fields: [
    { name: "nombre", type: "text", required: true, label: "Nombre" },
    // Ocultar sin borrar (2026-10-19, cliente: Ammann). `src/lib/nueva/visibilidad.ts`.
    {
      name: "mostrarEnWeb",
      type: "checkbox",
      defaultValue: true,
      label: "Mostrar en la web",
      admin: {
        position: "sidebar",
        description:
          "Desmarcada, la marca, sus tipos y sus equipos desaparecen de toda la web (menú, listados, filtros, portada, buscador y sitemap) sin borrarse del panel, y sus páginas llevan con un 301 a la página de abajo.",
      },
    },
    {
      name: "destinoOculta",
      type: "relationship",
      relationTo: "categorias-maquinaria",
      label: "Si está oculta, sus páginas llevan a",
      admin: {
        position: "sidebar",
        condition: (datos) => datos?.mostrarEnWeb === false,
        description:
          "Categoría de maquinaria nueva a la que redirigen (301) la página de la marca, las de sus tipos y sus fichas. Vacío: el índice de maquinaria nueva.",
      },
    },
    // Nivel superior de su rama: unicidad global del slug.
    slugField({ unique: true }),
    { name: "descripcion", type: "textarea", label: "Descripción" },
    { name: "logo", type: "upload", relationTo: "media", label: "Logo" },
    // Megamenú (2026-10-17): el submenú es blanco sólido desde el #205.
    campoColorMarca,
    {
      name: "logoOscuroEnMenu",
      type: "checkbox",
      defaultValue: false,
      label: "Pintar el logo en oscuro (menú y cabecera)",
      admin: {
        description:
          "Márcala si el logo es blanco o muy claro: en el menú de la cabecera y en la placa clara de la página de la marca se pintará en una sola tinta oscura para que se vea. Desmarcada, el logo sale con sus colores.",
      },
    },
    // Fase B de la home: fondo de la tarjeta de marca (sección 2). Opcional.
    {
      name: "imagenTarjeta",
      type: "upload",
      relationTo: "media",
      label: "Foto de la tarjeta en la portada",
      admin: {
        description:
          "Fondo de la tarjeta de esta marca en el inicio si no tiene «Foto de fondo de la cabecera» del «Kit de marca» (esa manda).",
      },
    },
    {
      name: "ordenPortada",
      type: "number",
      min: 1,
      label: "Posición en la portada",
      admin: {
        position: "sidebar",
        description:
          "1, 2, 3… es el orden de las tarjetas de «Maquinaria pesada nueva» de la portada. Todas las marcas visibles salen; las que no tienen número, al final por nombre.",
      },
    },
    // Plantilla de Andrés de la marca de aditamentos (2026-10-20): `src/lib/nueva/paginaAditamentos.ts`.
    {
      name: "disenoPagina",
      type: "select",
      defaultValue: "plantilla1",
      label: "Diseño de la página",
      options: [
        { label: "Plantilla 1 (tarjetas por tipo)", value: "plantilla1" },
        { label: "Aditamentos (productos por tipo, contacto y sedes)", value: "aditamentos" },
        {
          label: "Kit de marca (cabecera partida, píldora, cinta de tipos y secciones)",
          value: "kit",
        },
      ],
      admin: {
        position: "sidebar",
        description:
          "«Plantilla 1»: una tarjeta por tipo, como las demás marcas. «Aditamentos»: la plantilla de Andrés de la marca de aditamentos, con un bloque por tipo y sus productos, el contacto, la franja de servicios, «Nuestro compromiso» y las sedes. «Kit de marca»: el diseño nuevo del cliente (2026-10-25) con la cabecera partida en el color de la marca, la píldora de navegación, la cinta de tipos y una sección por tipo; usa el «Color de la marca», la foto de fondo y el emblema de abajo.",
      },
    },
    {
      name: "plantillaAditamentos",
      type: "group",
      label: "Textos de la plantilla «Aditamentos»",
      admin: {
        condition: (datos) => datos?.disenoPagina === "aditamentos",
        description: "Solo se usan con el diseño «Aditamentos». Vacío, el texto de siempre.",
      },
      fields: [
        { name: "antetitulo", type: "text", label: "Antetítulo", defaultValue: T.antetitulo },
        {
          name: "titulo",
          type: "text",
          label: "Título de la página",
          defaultValue: T.titulo,
          admin: { description: "El título principal (h1) de la página." },
        },
        {
          type: "row",
          fields: [
            { name: "franja1", type: "text", label: "Franja: texto 1", defaultValue: T.franja[0] },
            { name: "franja2", type: "text", label: "Franja: texto 2", defaultValue: T.franja[1] },
            { name: "franja3", type: "text", label: "Franja: texto 3", defaultValue: T.franja[2] },
          ],
        },
        {
          name: "compromisoTitulo",
          type: "textarea",
          label: "«Nuestro compromiso»: título",
          defaultValue: T.compromisoTitulo,
        },
        {
          name: "compromisoEntradilla",
          type: "text",
          label: "«Nuestro compromiso»: frase en negrita",
          defaultValue: T.compromisoEntradilla,
        },
        {
          name: "compromisoTexto",
          type: "textarea",
          label: "«Nuestro compromiso»: texto",
          defaultValue: T.compromisoTexto,
        },
        {
          name: "compromisoBoton",
          type: "text",
          label: "«Nuestro compromiso»: texto del botón",
          defaultValue: T.compromisoBoton,
          admin: { description: "El botón abre el formulario de contacto." },
        },
      ],
    },
    // Textos de la plantilla de Andrés de las marcas de nueva (2026-10-20): `src/lib/nueva/paginaMarcaAndres.ts`.
    {
      name: "plantillaLinea",
      type: "group",
      label: "Textos de la página de la marca",
      admin: {
        description:
          "Los textos fijos de la página de la marca (no sirve para Aditamentos, que tiene los suyos). Vacío, el texto de siempre.",
      },
      fields: [
        {
          name: "intro",
          type: "text",
          label: "Frase sobre la franja de tipos",
          admin: {
            placeholder: "Nuestra línea de equipos {marca} incluye:",
            description: "«{marca}» se sustituye por el nombre de la marca.",
          },
        },
        {
          name: "cierre",
          type: "textarea",
          label: "Frase de cierre bajo la franja",
          admin: {
            placeholder:
              "Tecnología de punta, bajo consumo, máxima productividad y respaldo oficial.",
            description: "Una línea nueva es un salto de línea.",
          },
        },
      ],
    },
    /*
     * «KIT DE MARCA» (2026-10-25, diseño del cliente): foto propia de la cabecera y emblema
     * de fondo. Solo los lee el diseño «Kit de marca»; el logo, el color y el texto salen de
     * los campos de arriba.
     */
    {
      name: "kit",
      type: "group",
      label: "Diseño «Kit de marca»",
      admin: {
        description:
          "Solo para el diseño «Kit de marca». El logo, el color de la marca y la descripción son los de arriba.",
      },
      fields: [
        {
          name: "fotoCabecera",
          type: "upload",
          relationTo: "media",
          label: "Foto de fondo de la cabecera",
          admin: {
            description:
              "La foto propia de la marca, horizontal y grande (1920 px o más de ancho). Se oscurece un poco para que el texto se lea. Vacía, la cabecera queda oscura lisa.",
          },
        },
        {
          name: "emblema",
          type: "upload",
          relationTo: "media",
          label: "Emblema de fondo",
          admin: {
            description:
              "El emblema o mascota de la marca: un grabado en tinta oscura sobre fondo claro o transparente (WebP o PNG). Se pinta enorme y casi transparente detrás de las secciones y gira despacio al bajar.",
          },
        },
        {
          name: "mostrarEmblema",
          type: "checkbox",
          defaultValue: false,
          label: "Mostrar el emblema de fondo",
          admin: {
            description:
              "Desmarcada, el emblema no se pinta aunque esté subido (por ejemplo, mientras el cliente no confirme el permiso de uso de la mascota).",
          },
        },
      ],
    },
    seoField(),
  ],
};
