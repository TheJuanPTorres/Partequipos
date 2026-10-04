import type { CollectionConfig } from "payload";

import { validarEnlace } from "../lib/fields/reglasPortada";
import { seoField } from "../lib/fields/seoField";
import { BLOQUES_PAGINA } from "./bloques/bloquesPagina";
import { validarYouTube } from "../lib/fields/youtube";
import { enlace, parrafo, texto } from "../lib/fields/textosPortada";
import { revalidarPagina, revalidarPaginaBorrada } from "./hooks/revalidateHooks";
import { slugEditable } from "../lib/fields/slugField";
import { slugUnicoFrenteA } from "./hooks/slugUnicoEntreColecciones";
import { borradoAdmin, escrituraContenido, publico } from "../lib/seguridad/acceso";

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
    group: "Contenido",
    description:
      "Páginas fijas del sitio (Nosotros, Contacto, textos legales…) y la portada. No cambies la ruta de una página publicada: Google ya conoce esa dirección.",
  },
  access: {
    read: publico,
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
      label: "Ruta (dirección web)",
      admin: {
        position: "sidebar",
        description:
          "La dirección de la página, sin barras al principio ni al final. Ej.: «nosotros» o «nosotros/trabaja-con-nosotros». La portada usa «inicio». " +
          "Después de crearla ya no se puede cambiar; si tiene una errata, pide a un administrador el permiso «Puede editar slugs ya publicados»: la dirección antigua seguirá llevando a la nueva.",
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
              name: "titulo",
              type: "text",
              required: true,
              label: "Título",
              admin: { description: "Ej. «Potencia Hitachi». Se pinta en mayúsculas por diseño." },
            },
            {
              name: "parrafo",
              type: "textarea",
              label: "Párrafo",
              admin: { description: "El texto del recuadro de vidrio. No se muestra en móvil." },
            },
            {
              name: "imagenFondo",
              type: "upload",
              relationTo: "media",
              required: true,
              label: "Imagen de fondo",
            },
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
          label: "Máquina recortada (PNG transparente)",
          admin: {
            description: "Decorativa: asoma sobre la sección anterior. Opcional.",
          },
        },
        texto("antetitulo", "Antetítulo", "Venta de maquinaria"),
        texto("titulo", "Título", "Maquinaria pesada usada"),
        texto(
          "pestanaExcavadoras",
          "Pestaña de excavadoras",
          "Excavadoras",
          "Vacío: el nombre de la categoría «excavadoras».",
        ),
        texto("pestanaOtros", "Pestaña del resto de categorías", "Otros"),
        texto("pestanaAditamentos", "Pestaña de aditamentos", "Aditamentos"),
        texto("verProductoTexto", "Texto del enlace de cada equipo", "Ver producto"),
        texto(
          "marcasTitulo",
          "Título de la columna izquierda",
          "Marcas que Respaldan Nuestro Trabajo",
        ),
        parrafo(
          "marcasTexto",
          "Frase de la columna izquierda",
          "Trabajamos con fabricantes líderes a nivel internacional para ofrecerle calidad, rendimiento y respaldo",
        ),
        texto(
          "botonTexto",
          "Texto del botón de excavadoras",
          "Ver todas las excavadoras",
          "El botón lleva a la categoría «excavadoras» de usados.",
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
        {
          name: "logos",
          type: "array",
          label: "Logos",
          labels: { singular: "Logo", plural: "Logos" },
          admin: {
            description:
              "En este orden en el carrusel. PNG transparente, con el logo centrado en su lienzo.",
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
        texto("verMasTexto", "Texto del enlace de cada tarjeta", "Ver más"),
        texto("botonTexto", "Texto del botón", "Ver todos los repuestos"),
        enlace("botonEnlace", "Enlace del botón", "/repuestos-maquinaria-pesada-colombia/"),
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
          label: "Máquina recortada (PNG transparente)",
          admin: { description: "Decorativa: asoma arriba a la izquierda. Opcional." },
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
