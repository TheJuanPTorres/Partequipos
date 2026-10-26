import type { CollectionConfig } from "payload";

import { avisoField } from "../lib/fields/avisoField";
import { validarEnlace } from "../lib/fields/reglasPortada";
import { seoField } from "../lib/fields/seoField";
import { SLUG_POLITICA_GARANTIA } from "../lib/politica/animaciones";
import { tipografiaTituloField } from "../lib/fields/tipografiaTitulo";
import { BLOQUES_PAGINA } from "./bloques/bloquesPagina";
import { validarYouTube } from "../lib/fields/youtube";
import { enlace, parrafo, texto } from "../lib/fields/textosPortada";
import { revalidarPagina, revalidarPaginaBorrada } from "./hooks/revalidateHooks";
import { slugEditable } from "../lib/fields/slugField";
import { slugUnicoFrenteA } from "./hooks/slugUnicoEntreColecciones";
import { borradoAdmin, escrituraContenido, lecturaContenido } from "../lib/seguridad/acceso";

/**
 * Páginas institucionales y legales (nosotros, contacto, servicio técnico,
 * políticas…). Una fila por URL del sitio.
 *
 * Sobre el `slug`: aquí es la **ruta completa** relativa a la raíz, porque estas
 * páginas no cuelgan de una jerarquía como el catálogo y alguna está anidada
 * (`nosotros/trabaja-con-nosotros`). Se copia literal del rastreo: la jerarquía
 * de URLs es intocable (CLAUDE.md §3.3).
 */
/** Descripción con aviso si la página tiene bloques (`src/components/admin/AvisoBloques`). */
/**
 * Una imagen del KIT DE LA PORTADA del cliente (2026-10-26): render recortado, su reflejo o la foto
 * de una tarjeta. Decorativa (`alt` vacío al pintarla) y opcional: sin ella, la sección se pinta sin
 * ese adorno, sin hueco. En Payload y no en el repositorio (assets nunca en `public/`).
 */
const imagenKit = (name: string, label: string, description: string) => ({
  name,
  type: "upload" as const,
  relationTo: "media" as const,
  label,
  admin: { description },
});

const AVISO_BLOQUES = (texto?: string) => ({
  path: "/components/admin/AvisoBloques",
  clientProps: texto ? { texto } : {},
});

export const PaginaInstitucional: CollectionConfig = {
  slug: "paginas",
  labels: {
    singular: "Página institucional",
    plural: "Páginas institucionales",
  },
  admin: {
    useAsTitle: "titulo",
    defaultColumns: ["titulo", "slug", "tipoPagina"],
    group: "Páginas y blog",
    description:
      "Páginas fijas del sitio (Nosotros, Contacto, textos legales…) y la portada. No cambies la ruta de una página publicada: Google ya conoce esa dirección.",
  },
  access: {
    read: lecturaContenido,
    create: escrituraContenido,
    update: escrituraContenido,
    delete: borradoAdmin,
  },
  hooks: {
    // Lado inverso del guardarraiz: una pagina no puede tapar un articulo del
    // blog, que vive en el mismo espacio de nombres raiz.
    beforeValidate: [slugUnicoFrenteA("articulos", "un artículo del blog")],
    afterChange: [revalidarPagina],
    afterDelete: [revalidarPaginaBorrada],
  },
  fields: [
    {
      name: "titulo",
      type: "text",
      required: true,
      label: "Título",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Dirección web",
      admin: {
        position: "sidebar",
        description:
          "La dirección de la página, sin barras al principio ni al final. Ej.: «nosotros» o «nosotros/trabaja-con-nosotros». La portada usa «inicio». " +
          "Después de crearla ya no se puede cambiar; si tiene una errata, pide a un administrador el permiso «Puede cambiar direcciones web ya publicadas»: la dirección antigua seguirá llevando a la nueva.",
      },
      // Igual que el resto de slugs (ADR 0005, parte B): solo al crear, o con el
      // permiso. El 301 desde la ruta anterior ya lo crea `revalidarPagina`.
      access: { update: slugEditable },
    },
    {
      name: "tipoPagina",
      type: "select",
      defaultValue: "institucional",
      label: "Tipo",
      options: [
        { label: "Institucional", value: "institucional" },
        { label: "Legal / cumplimiento", value: "legal" },
        { label: "Portada", value: "portada" },
      ],
      admin: {
        position: "sidebar",
        description:
          "«Legal / cumplimiento» para tratamiento de datos, términos y similares: tienen que estar siempre en el sitio, así que no se borran.",
      },
    },
    {
      name: "entradilla",
      type: "textarea",
      label: "Entradilla",
      admin: { description: "Párrafo introductorio bajo el título." },
    },
    /*
     * FOTO DE LA CABECERA de la página de garantías (dirección, 2026-10-23): Juan Pablo cambia el
     * fondo del encabezado él mismo. Con foto, el velo de las páginas índice para que el título
     * se lea; sin ella, la tarjeta oscura de siempre. Solo se ve en esa página: es la única
     * plantilla que la pinta (`PaginaPolitica`).
     */
    {
      name: "fotoCabecera",
      type: "upload",
      relationTo: "media",
      label: "Foto de fondo del encabezado",
      admin: {
        condition: (data) => data?.slug === SLUG_POLITICA_GARANTIA,
        description:
          "Opcional. Foto a todo el ancho detrás del título, con un velo oscuro para que se lea. Sin ella, el encabezado queda en un tono oscuro.",
      },
    },
    {
      name: "contenido",
      type: "richText",
      label: "Contenido",
      admin: { components: { Description: AVISO_BLOQUES() } },
    },
    /*
     * Secciones con ancla. Las anclas (#taller, #GARANTIA…) NO son páginas:
     * son partes de ESTA página. Modelarlas como un array evita crear rutas de
     * más y permite que el editor añada o reordene secciones sin tocar código.
     */
    {
      name: "secciones",
      type: "array",
      label: "Secciones con ancla",
      labels: { singular: "Sección", plural: "Secciones" },
      admin: {
        components: {
          Description: AVISO_BLOQUES(
            "Bloques enlazables dentro de la página, p. ej. /servicio-tecnico/#taller. No generan URLs nuevas.",
          ),
        },
      },
      fields: [
        {
          name: "titulo",
          type: "text",
          required: true,
          label: "Título de la sección",
        },
        {
          name: "ancla",
          type: "text",
          required: true,
          label: "Ancla",
          admin: {
            description:
              "Identificador del enlace, sin '#'. Debe copiarse EXACTO del sitio actual (distingue mayúsculas): 'taller', 'GARANTIA', 'Devoluciones'.",
          },
        },
        {
          name: "contenido",
          type: "richText",
          label: "Contenido de la sección",
        },
      ],
    },
    /*
     * BLOQUES DE PÁGINA (decisión de dirección, 2026-10-02): si una página los
     * tiene, se compone SOLO con ellos (más migas y JSON-LD); su «Contenido» y
     * sus «Secciones con ancla» no se pintan, y el panel lo avisa en esos dos
     * campos. Sin bloques, la página se pinta como siempre. No en la portada,
     * que tiene sus propias secciones. Ver docs/diseno/decisiones-nosotros.md.
     */
    {
      /*
       * DISEÑO (2026-10-19): cómo se pintan los bloques. «Bloques» los pone uno
       * tras otro, como siempre; «Servicio técnico» los compone con su plantilla
       * propia (`PlantillaServicioTecnico`), que toma cada bloque por su ancla
       * (taller, alistamiento, posventa, siniestros y contacto).
       */
      name: "diseno",
      type: "select",
      label: "Diseño",
      defaultValue: "bloques",
      options: [
        { label: "Bloques, uno tras otro", value: "bloques" },
        { label: "Servicio técnico", value: "servicioTecnico" },
      ],
      admin: {
        condition: (data) => data?.slug !== "inicio",
        description:
          "«Servicio técnico» compone los bloques con su diseño propio, por su ancla: taller, alistamiento, posventa, Siniestros y contacto.",
      },
    },
    {
      name: "bloques",
      type: "blocks",
      label: "Bloques de la página",
      labels: { singular: "Bloque", plural: "Bloques" },
      blocks: BLOQUES_PAGINA,
      admin: {
        condition: (data) => data?.slug !== "inicio",
        description:
          "Opcional. Si añades bloques, la página se compone con ellos y dejan de mostrarse «Contenido» y «Secciones con ancla».",
      },
    },
    /*
     * HERO DE LA PORTADA (ADR 0009, revisado el 2026-09-23): N diapositivas.
     * Solo aparece en la página con slug `inicio`; en las institucionales sería
     * un campo huérfano invitando a rellenarse.
     *
     * SIN `minRows`. El ADR proponía 1, pero la portada YA EXISTE sin hero: con
     * mínimo 1, el próximo guardado de `inicio` fallaría hasta que alguien
     * añadiera una diapositiva. Con 0 el hero simplemente no se pinta.
     */
    {
      name: "hero",
      type: "group",
      label: "Hero de la portada",
      admin: {
        condition: (data) => data?.slug === "inicio",
        description: "Carrusel del inicio. Con una sola diapositiva no se muestran las flechas.",
      },
      fields: [
        {
          name: "diapositivas",
          type: "array",
          label: "Diapositivas",
          labels: { singular: "Diapositiva", plural: "Diapositivas" },
          fields: [
            {
              /*
               * SOLO LA IMAGEN DE FONDO (dirección, 2026-10-15): cada pieza de
               * texto de la diapositiva se puede quitar. MARCADAS por defecto:
               * las diapositivas que ya existían no cambian (la migración rellena
               * `true`). El título oculto se queda en el HTML para lectores de
               * pantalla (lo pintado reserva su sitio, invisible, para que nada salte
               * entre diapositivas); el texto circular y el recuadro, fuera del HTML.
               */
              type: "row",
              fields: [
                {
                  name: "mostrarTitulo",
                  type: "checkbox",
                  label: "Mostrar título",
                  defaultValue: true,
                  admin: {
                    width: "33%",
                    description:
                      "Desmárcalo para dejar la foto limpia. El título sigue siendo obligatorio: no se ve, pero lo leen los lectores de pantalla y nombra la diapositiva.",
                  },
                },
                {
                  name: "mostrarTextoCircular",
                  type: "checkbox",
                  label: "Mostrar texto circular",
                  defaultValue: true,
                  admin: {
                    width: "33%",
                    description: "El texto que gira. Desmarcado, no se pinta aunque esté escrito.",
                  },
                },
                {
                  name: "mostrarDescripcion",
                  type: "checkbox",
                  label: "Mostrar recuadro de descripción",
                  defaultValue: true,
                  admin: {
                    width: "33%",
                    description:
                      "El recuadro de vidrio con el párrafo y el «+». Desmarcado, no se pinta ninguno de los dos.",
                  },
                },
              ],
            },
            {
              name: "titulo",
              type: "textarea",
              required: true,
              label: "Título",
              admin: {
                rows: 2,
                description:
                  "Ej. «Potencia Hitachi». Se pinta en mayúsculas por diseño. Un salto de línea parte el título en varias líneas. Obligatorio aunque esté oculto: lo usan los lectores de pantalla.",
              },
            },
            {
              /*
               * TÍTULO PARTIDO EN ESCRITORIO (hero de sliders de Andrés, 2026-10-14):
               * en la diapositiva de CASE, a ≥ 1025 px el título va en dos piezas,
               * una arriba y otra abajo, sobre la máquina. Por debajo, el «Título».
               * Lo que lee un lector de pantalla es siempre el «Título».
               */
              type: "row",
              admin: {
                condition: (_: unknown, hermanos: { mostrarTitulo?: boolean }) =>
                  hermanos?.mostrarTitulo !== false,
              },
              fields: [
                {
                  name: "tituloArriba",
                  type: "text",
                  label: "Escritorio: parte de arriba",
                  admin: {
                    width: "50%",
                    description: "Opcional. Solo a 1025 px o más, encima de la máquina.",
                  },
                },
                {
                  name: "tituloAbajo",
                  type: "text",
                  label: "Escritorio: parte de abajo",
                  admin: {
                    width: "50%",
                    description: "Opcional. Solo a 1025 px o más, abajo, sobre la máquina.",
                  },
                },
              ],
            },
            // Fuente, tamaños, color, posición… del título (2026-10-17). Todo opcional.
            tipografiaTituloField,
            {
              name: "parrafo",
              type: "textarea",
              label: "Párrafo",
              admin: {
                condition: (_: unknown, hermanos: { mostrarDescripcion?: boolean }) =>
                  hermanos?.mostrarDescripcion !== false,
                description: "El texto del recuadro de vidrio. No se muestra en móvil.",
              },
            },
            {
              name: "imagenFondo",
              type: "upload",
              relationTo: "media",
              required: true,
              label: "Imagen de fondo",
            },
            // Aviso en vivo si hay fondo y falta el recorte para móvil (2026-10-14).
            avisoField("avisoRecorteMovil", "AvisoRecorteMovil"),
            {
              /*
               * RECORTE VERTICAL PARA MÓVIL (CLAUDE.md §10.36): por debajo de
               * 768 px el fondo ocupa todo el alto del hero y el navegador pedía
               * la foto de escritorio a 1920 px. Con un recorte vertical pide
               * ~750 px. Opcional: sin él se usa la de escritorio, como antes.
               */
              name: "imagenFondoMovil",
              type: "upload",
              relationTo: "media",
              label: "Imagen de fondo para móvil (vertical)",
              admin: {
                description:
                  "Opcional. Recorte vertical (p. ej. 1080 × 1620) que se usa por debajo de 768 px. Si se deja vacío, se usa la de escritorio con su punto focal.",
              },
            },
            {
              name: "imagenFrontal",
              type: "upload",
              relationTo: "media",
              label: "Máquina recortada (PNG transparente)",
              admin: { description: "Opcional: va delante del título." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "posicionMaquina",
                  type: "select",
                  label: "Posición de la máquina",
                  defaultValue: "debajo",
                  options: [
                    { label: "Debajo del título", value: "debajo" },
                    { label: "Sobre el título (lo cruza, en escritorio)", value: "sobre" },
                  ],
                  admin: {
                    width: "50%",
                    description:
                      "«Sobre» cruza el título a 1025 px o más; en tablet y móvil va debajo. El título sigue en el texto de la página.",
                  },
                },
                {
                  name: "textoCircular",
                  type: "text",
                  label: "Texto circular",
                  maxLength: 60,
                  admin: {
                    condition: (_: unknown, hermanos: { mostrarTextoCircular?: boolean }) =>
                      hermanos?.mostrarTextoCircular !== false,
                    width: "50%",
                    description:
                      "Opcional. Gira despacio (quieto con «reducir movimiento» o al pausar). Decorativo: los lectores de pantalla no lo leen.",
                  },
                },
              ],
            },
            {
              type: "row",
              admin: {
                condition: (_: unknown, hermanos: { mostrarDescripcion?: boolean }) =>
                  hermanos?.mostrarDescripcion !== false,
              },
              fields: [
                {
                  name: "enlace",
                  type: "text",
                  label: "Enlace del «+»",
                  validate: validarEnlace,
                  admin: { width: "50%", description: "Ruta del sitio (/…) o https://" },
                },
                {
                  name: "enlaceNombre",
                  type: "text",
                  label: "Nombre accesible del enlace",
                  validate: (
                    valor: unknown,
                    { siblingData }: { siblingData: { enlace?: string } },
                  ) =>
                    siblingData?.enlace && !valor
                      ? "El «+» no tiene texto visible: di adónde lleva (p. ej. «Ver maquinaria Hitachi»)."
                      : true,
                  admin: { width: "50%" },
                },
              ],
            },
          ],
        },
      ],
    },
    /*
     * SECCIÓN 2 DE LA PORTADA: textos. Las tarjetas salen de
     * `marcas-maquinaria` (las que tienen posición en la portada y foto).
     */
    {
      name: "seccionNueva",
      type: "group",
      label: "Sección «Maquinaria pesada nueva» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto("antetitulo", "Antetítulo", "Venta de maquinaria"),
        texto("titulo", "Título", "Maquinaria pesada nueva"),
        texto("botonTexto", "Texto del botón", "Ver todo"),
        enlace(
          "botonEnlace",
          "Enlace del botón",
          "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/",
        ),
      ],
    },
    /*
     * SECCIÓN 3 DE LA PORTADA (fase D): la máquina recortada que asoma sobre la
     * sección 2. Es decorativa (`alt` vacío al pintarla) y OPCIONAL: sin ella la
     * columna se pinta igual, solo sin imagen. En Payload y no en el repositorio
     * porque la foto de ux-9 es de banco y su licencia está pendiente (L3).
     */
    {
      name: "seccionUsada",
      type: "group",
      label: "Sección «Maquinaria pesada usada» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Máquina de la cabecera (PNG o WebP transparente)",
          admin: {
            description:
              "Decorativa: la máquina sobre el piso, con su reflejo (la misma imagen volteada). Opcional.",
          },
        },
        texto("antetitulo", "Antetítulo", "Venta de maquinaria"),
        texto("titulo", "Título", "Maquinaria pesada usada"),
        parrafo(
          "descripcion",
          "Texto de la cabecera",
          "Encuentra excavadoras, retrocargadoras, cargadores, minicargadores, motoniveladoras y más para construcción, infraestructura y movimiento de tierra en Colombia.",
        ),
        imagenKit(
          "imagenExcavadoras",
          "Imagen del filtro «Excavadora»",
          "La máquina recortada (PNG o WebP transparente) de la tarjeta del filtro. Opcional.",
        ),
        imagenKit(
          "imagenOtros",
          "Imagen del filtro «Otros»",
          "La máquina recortada (PNG o WebP transparente) de la tarjeta del filtro. Opcional.",
        ),
        imagenKit(
          "imagenAditamentos",
          "Imagen del filtro de los aditamentos",
          "El aditamento recortado (PNG o WebP transparente) de la tarjeta del filtro. Opcional.",
        ),
        texto(
          "pestanaExcavadoras",
          "Filtro «Excavadora»",
          // El valor por defecto sigue en plural: cambiarlo cambia el DEFAULT de la columna y pide
          // migración. El texto se pone en el panel (runbook del singular, 2026-10-23).
          "Excavadoras",
          "Tarjeta del filtro sobre el carrusel; «Ver todo» lleva a la categoría «Excavadora» de usados. Vacío: «Excavadora».",
        ),
        texto(
          "pestanaOtros",
          "Filtro «Otros»",
          "Otros",
          "Tarjeta del filtro; «Ver todo» lleva a la página «Otros» de usados. Vacío: «Otros».",
        ),
        texto(
          "pestanaAditamentos",
          "Filtro de los aditamentos",
          "Aditamentos",
          "Tarjeta del filtro; «Ver todo» lleva a la categoría «Aditamentos» de usados. Vacío: «Aditamentos».",
        ),
        texto(
          "verProductoTexto",
          "Texto del botón de cada equipo (ya no se usa)",
          "Ver más",
          "Sin efecto desde el 2026-10-20: cada equipo lleva «Ver producto» y «Cotizar».",
        ),
        texto(
          "marcasTitulo",
          "Subtítulo de la cabecera (ya no se usa)",
          "Marcas que Respaldan Nuestro Trabajo",
          "Sin efecto desde el 2026-10-26 (diseño del cliente): la cabecera lleva el «Texto de la cabecera».",
        ),
        {
          name: "marcasTexto",
          type: "textarea",
          label: "Frase de la cabecera",
          defaultValue:
            "Trabajamos con fabricantes líderes a nivel internacional para ofrecerle calidad, rendimiento y respaldo",
          admin: {
            description:
              "Bajo el título, antes del «Texto de la cabecera». Respeta los saltos de línea. Vacía, no se pinta.",
          },
        },
        texto(
          "botonTexto",
          "Texto del botón de la cabecera",
          "Ver todo",
          "El botón baja al carrusel de la categoría elegida.",
        ),
      ],
    },
    /*
     * SECCIÓN 4 DE LA PORTADA (fase E): carrusel de logos. Lista PROPIA y no
     * `marcas` ni `marcas-maquinaria`: ux-9 mezcla fabricantes de las dos y
     * uno que no está en ninguna (Donaldson), y meterlos en `marcas` crearía
     * URLs de repuestos. Sin logos, la sección no se pinta.
     */
    {
      name: "seccionLogos",
      type: "group",
      label: "Sección «Logos de marcas» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto("titulo", "Título", "Marcas que mueven"),
        texto("tituloResaltado", "Final del título, en rojo", "tu operación"),
        imagenKit(
          "maquina",
          "Máquina (PNG o WebP transparente)",
          "Decorativa: la máquina sobre el piso, por delante de la banda de logos. Opcional.",
        ),
        imagenKit(
          "maquinaReflejo",
          "Reflejo de la máquina",
          "La imagen del reflejo, del kit del cliente (más alta que la máquina). Opcional.",
        ),
        {
          name: "logos",
          type: "array",
          label: "Logos",
          labels: { singular: "Logo", plural: "Logos" },
          admin: {
            description:
              "En este orden en el carrusel. PNG transparente, con el logo centrado en su lienzo. Si el nombre es el de una marca de repuestos, la portada usa el logo de esa marca (uno solo en todo el sitio).",
          },
          fields: [
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
              required: true,
              label: "Logo",
            },
            {
              name: "nombre",
              type: "text",
              required: true,
              label: "Nombre de la marca",
              admin: { description: "Es el texto alternativo del logo." },
            },
          ],
        },
      ],
    },
    /*
     * SECCIÓN 5 DE LA PORTADA: textos. Las tarjetas salen de
     * `categorias-tecnicas` (las que tienen posición en la portada).
     */
    {
      name: "seccionRepuestos",
      type: "group",
      label: "Sección «Venta de repuestos» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto("antetitulo", "Antetítulo", "Venta de repuestos"),
        texto("titulo", "Título", "Encuentra Maquinaria y Repuestos Rápido y Fácil"),
        texto("verMasTexto", "Texto del botón de cada tarjeta", "Ver más"),
        texto(
          "botonTexto",
          "Texto del botón (ya no se usa)",
          "Ver todos los repuestos",
          "Sin efecto desde el 2026-10-26 (diseño del cliente): cada tarjeta lleva su botón.",
        ),
        enlace(
          "botonEnlace",
          "Enlace del botón (ya no se usa)",
          "/repuestos-maquinaria-pesada-colombia/",
        ),
        imagenKit(
          "maquina",
          "Máquina (PNG o WebP transparente)",
          "Decorativa: la máquina sobre el piso, junto a las categorías. Opcional.",
        ),
        imagenKit(
          "maquinaReflejo",
          "Reflejo de la máquina",
          "La imagen del reflejo, del kit del cliente (más alta que la máquina). Opcional.",
        ),
      ],
    },
    /*
     * SECCIÓN 7 DE LA PORTADA (fase F): «Nuestra Compañía». El vídeo de fondo
     * y el de YouTube del botón de reproducir. Los dos opcionales: sin vídeo,
     * la tarjeta se pinta en oscuro con su texto; sin YouTube, sin botón.
     */
    {
      name: "seccionCompania",
      type: "group",
      label: "Sección «Nuestra Compañía» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        {
          name: "video",
          type: "upload",
          relationTo: "videos",
          label: "Vídeo de fondo",
          admin: { description: "En bucle y sin sonido. MP4 H.264 de 8 bits, máximo 4 MB." },
        },
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Imagen de fondo (si no hay vídeo)",
          admin: {
            description:
              "Se ve solo cuando no hay vídeo. Una foto horizontal; se recorta para llenar la tarjeta.",
          },
        },
        {
          name: "youtube",
          type: "text",
          label: "Vídeo de YouTube del botón «reproducir»",
          validate: validarYouTube,
          admin: {
            description:
              "Opcional. Se abre en una ventana, desde youtube-nocookie.com, solo al pulsar.",
          },
        },
        texto("titulo", "Título", "Nuestra Compañía"),
        parrafo(
          "texto",
          "Texto",
          "En Partequipos somos expertos en repuestos y maquinaria pesada, con asesores en todo el país que marcan la diferencia en Colombia",
        ),
        texto("marquesina", "Texto en movimiento", "MAQUINARIA PESADA EN COLOMBIA"),
        enlace("marquesinaEnlace", "Enlace del texto en movimiento", "/nosotros/"),
      ],
    },
    /* SECCIÓN 8 DE LA PORTADA: la llamada a la acción sobre la tarjeta de la 7. */
    {
      name: "seccionCatalogo",
      type: "group",
      label: "Sección «Catálogo» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto("titulo", "Título", "Encuentra la maquinaria que tu operación necesita"),
        texto("catalogoTexto", "Texto del botón de catálogo", "Catálogo"),
        enlace("catalogoEnlace", "Enlace del botón de catálogo", "/maquinaria-pesada/"),
        texto(
          "whatsappTexto",
          "Texto del botón de WhatsApp",
          "WhatsApp",
          "El número sale de la configuración de la empresa.",
        ),
      ],
    },
    /* SECCIÓN 9 DE LA PORTADA: las sedes salen de la colección `sedes`. */
    {
      name: "seccionSedes",
      type: "group",
      label: "Sección «Sedes» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto(
          "titulo",
          "Título (solo para lectores de pantalla)",
          "Nuestras sedes",
          "ux-9 no pinta título en esta sección; este lo leen los lectores de pantalla.",
        ),
      ],
    },
    /* SECCIÓN 10 DE LA PORTADA: los testimonios salen de la colección `testimonios`. */
    {
      name: "seccionTestimonios",
      type: "group",
      label: "Sección «Testimonios» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        texto("titulo", "Título", "La confianza de nuestros clientes habla por nosotros"),
        texto("verVideoTexto", "Texto del botón de vídeo", "Ver Video"),
      ],
    },
    /*
     * SECCIÓN 11 DE LA PORTADA (fase H): la máquina decorativa junto a las
     * preguntas frecuentes. Opcional y decorativa (`alt` vacío); sin ella la
     * sección se pinta igual. En Payload y no en el repositorio porque la foto
     * de ux-9 tiene la licencia pendiente (L3).
     */
    {
      name: "seccionFaq",
      type: "group",
      label: "Sección «Preguntas frecuentes» de la portada",
      admin: { condition: (data) => data?.slug === "inicio" },
      fields: [
        {
          name: "imagen",
          type: "upload",
          relationTo: "media",
          label: "Imagen de la tarjeta",
          admin: {
            description:
              "La foto de fondo de la tarjeta de la izquierda, con el título, el texto y el botón encima (un velo oscuro asegura que se lean). Una foto, no un recorte; se ajusta a la tarjeta con su punto focal. Sin foto, la tarjeta va en oscuro.",
          },
        },
        texto("titulo", "Título", "Preguntas frecuentes"),
        parrafo(
          "intro",
          "Introducción",
          "Resuelve tus dudas sobre nuestros equipos, repuestos y servicios. En Partequipos estamos para ayudarte a encontrar las mejores soluciones para mantener tu maquinaria trabajando.",
        ),
        texto("botonTexto", "Texto del botón", "Solicita asesoría"),
        enlace("botonEnlace", "Enlace del botón", "/contactanos/"),
      ],
    },
    seoField(),
  ],
};
