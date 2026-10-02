import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import type { BloquePagina, ImagenBloque } from "@/lib/bloques/vista";

/*
 * DATOS FIJOS de la ruta de pruebas: el contenido de ejemplo de Nosotros de
 * ux-9 (con las erratas corregidas) y los medios YA SUBIDOS a la Media del
 * preview con `npm run preview:nosotros:sembrar` (ids 76–82 y vídeo 3).
 * Desaparece con la ruta antes de fusionar: en la ventana, el contenido va a
 * Payload.
 */
const BLOB = "https://lsndnc29nh4ws7eh.public.blob.vercel-storage.com";
const img = (fichero: string, width: number, height: number, alt: string): ImagenBloque => ({
  url: `${BLOB}/${fichero}`,
  width,
  height,
  alt,
  posicion: "50% 50%",
});

const parrafos = (...textos: string[]): SerializedEditorState =>
  ({
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: textos.map((text) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [
          { type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 },
        ],
      })),
    },
  }) as unknown as SerializedEditorState;

const DYNAPAC =
  "Equipos DYNAPAC para compactación y pavimentación, desarrollados para lograr precisión y uniformidad en obras de infraestructura y construcción.";

export const BLOQUES_NOSOTROS: BloquePagina[] = [
  {
    blockType: "cabeceraVideo",
    antetitulo: "Partequipos",
    titulo: "Quiénes somos",
    video: {
      url: `${BLOB}/nosotros-cabecera.mp4`,
      poster: img("nosotros-cabecera-poster.jpg", 1122, 626, "Excavadora trabajando al atardecer"),
      decorativo: true,
      descripcion: "Excavadora trabajando al atardecer, en bucle",
    },
    imagen: null,
  },
  {
    blockType: "presentacionImagen",
    imagen: img(
      "nosotros-mapa-sedes.png",
      910,
      1302,
      "Mapa de Colombia con las sedes de Partequipos: Barranquilla, Montería, Antioquia (Caucasia, Guarne y Medellín), Bucaramanga, Istmina, Cali, Ibagué y Bogotá; filiales en Miami (Estados Unidos) y Lima (Perú)",
    ),
    antetitulo: "PARTEQUIPOS",
    titulo: "Ofrecemos Soluciones para tus Proyectos",
    texto: parrafos(
      "Somos una empresa que brinda soluciones integrales a los sectores de la construcción, infraestructura, agroindustria y agregados; especializándonos en la venta de maquinaria pesada, repuestos, servicio técnico y lubricantes.",
      "Trabajamos de la mano con nuestras filiales: Partequipos Express (Miami) y Partequipos Perú.",
    ),
    boton: { texto: "Conoce más", href: "/contactanos/" },
  },
  {
    blockType: "cifras",
    cifras: [
      { prefijo: "+", numero: 25, etiqueta: "Años de experiencia" },
      { numero: 100, sufijo: "%", etiqueta: "Cobertura nacional*" },
      { numero: 10000, sufijo: "+", etiqueta: "Repuestos disponibles" },
    ],
  },
  {
    blockType: "franjaMarquee",
    texto: "Marcas Aliadas",
    imagenFondo: img("nosotros-franja-fondo.jpg", 2376, 1326, "Carretera en obra al atardecer"),
    imagenFrontal: img("nosotros-franja-dynapac.png", 2556, 2312, "Compactador Dynapac"),
  },
  {
    blockType: "tarjetasExpandibles",
    antetitulo: "En Partequipos",
    titulo: "Ofrecemos soluciones para tus proyectos",
    tarjetas: [
      {
        titulo: "Maquinaria pesada nueva",
        texto: DYNAPAC,
        imagen: img(
          "nosotros-tarjeta-nueva.jpg",
          1920,
          1080,
          "Compactador de doble rodillo en una vía",
        ),
        href: "/maquinaria-pesada/maquinaria-pesada-nueva/",
      },
      {
        titulo: "Maquinaria pesada usada",
        texto: DYNAPAC,
        imagen: img("nosotros-tarjeta-usada.jpg", 640, 427, "Excavadora usada en una obra"),
        href: "/maquinaria-pesada/maquinaria-pesada-usada/",
      },
      {
        titulo: "Repuestos para maquinaria",
        texto: DYNAPAC,
        imagen: img("nosotros-tarjeta-repuestos.jpg", 1200, 670, "Llantas de maquinaria pesada"),
        href: "/repuestos-maquinaria-pesada-colombia/",
      },
    ],
    boton: { texto: "Ver todo", href: "/maquinaria-pesada/" },
  },
];
