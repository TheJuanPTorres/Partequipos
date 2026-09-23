/**
 * IMÁGENES DEL PROTOTIPO — el único sitio con URLs y con su procedencia.
 *
 * ⚠ SOLO PARA EL PROTOTIPO. Se sustituyen por imágenes del cliente, subidas a
 * `Media`, antes de producción (ADR 0009). Ninguna de estas es contenido real.
 *
 * Cada imagen lleva su FUENTE y su LICENCIA al lado, porque la condición para
 * usar imágenes de ejemplo era que la licencia admitiera uso comercial y que
 * quedara anotada. Las de Wikimedia son CC0: dominio público, sin obligación de
 * atribución; se anota igual para poder comprobarlo.
 *
 * El efecto del hero pide DOS imágenes por diapositiva —fondo y máquina
 * recortada en PNG transparente—. Recortadas con licencia comercial NO se
 * encontraron: las candidatas de Wikimedia con licencia libre eran fotos
 * completas, sin canal alfa (comprobado con `sharp`: 0 % de píxeles
 * transparentes). Por eso Caterpillar y Komatsu van SOLO CON FONDO, que es
 * justo el caso que el componente tiene que aguantar sin romperse.
 */

export type ImagenHero = {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** Procedencia y licencia. Obligatorio: sin esto una imagen no entra. */
  fuente: string;
};

export const IMAGENES_HERO_PROTOTIPO = {
  hitachi: {
    /*
     * Del diseño de Andrés (`.../wp-content/uploads/2026/09/`), sin recomprimir.
     * Son material del proyecto, no de un banco de imágenes.
     */
    fondo: {
      url: "/prototipo/hero-fondo.jpg",
      /*
       * Decorativo: cielo y roca, sin máquina. Lo que informa es la imagen
       * frontal, que sí lleva `alt`. Un `alt` aquí solo haría ruido al lector.
       * En Caterpillar y Komatsu es al revés: la máquina ESTÁ en el fondo.
       */
      alt: "",
      width: 2048,
      height: 1360,
      fuente: "Diseño de Andrés — Fondo.jpg (593 kB JPEG)",
    },
    frontal: {
      url: "/prototipo/hero-frontal.png",
      alt: "Excavadora Hitachi vista de tres cuartos",
      width: 1476,
      height: 1057,
      fuente: "Diseño de Andrés — Hero-1.png (908 kB PNG con transparencia)",
    },
  },
  caterpillar: {
    fondo: {
      url: "/prototipo/hero-caterpillar-fondo.jpg",
      alt: "Excavadora hidráulica Caterpillar 318CL en una obra",
      width: 2048,
      height: 1366,
      fuente:
        "Wikimedia Commons, «Caterpillar 318CL hydraulic excavator +Spielvogel1.jpg», autor Spielvogel, CC0 — https://commons.wikimedia.org/wiki/File:Caterpillar_318CL_hydraulic_excavator_%2BSpielvogel1.jpg (reducida a 2048 px y recomprimida, 466 kB)",
    },
  },
  komatsu: {
    fondo: {
      url: "/prototipo/hero-komatsu-fondo.jpg",
      alt: "Excavadora Komatsu trabajando junto a una casa",
      width: 2048,
      height: 1361,
      fuente:
        "Wikimedia Commons, «Komatsu excavator - Arlington, MA.jpg», autor Daderot, CC0 — https://commons.wikimedia.org/wiki/File:Komatsu_excavator_-_Arlington,_MA.jpg (reducida a 2048 px y recomprimida, 617 kB)",
    },
  },
} as const satisfies Record<string, { fondo: ImagenHero; frontal?: ImagenHero }>;
