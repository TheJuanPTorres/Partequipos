/**
 * IMÁGENES DEL PROTOTIPO — el único sitio con URLs, para poder cambiarlas de
 * una línea cuando vivan en Payload.
 *
 * ORIGEN: descargadas del diseño de Andrés
 * (`.../wp-content/uploads/2026/09/`), tal cual, sin recomprimir:
 *
 * | Fichero      | Dimensiones | Peso original |
 * | ------------ | ----------- | ------------- |
 * | Fondo.jpg    | 2048 × 1360 | 593,4 kB JPEG |
 * | Hero-1.png   | 1476 × 1057 | 908,2 kB PNG  |
 *
 * El PNG pesa 908 kB porque lleva transparencia (RGBA). Vercel lo reoptimiza a
 * WebP al servirlo por `next/image` (§10.13: eso NO pasa en local), así que el
 * peso que paga el visitante es otro — y está medido en el informe.
 *
 * POR QUÉ ESTÁN EN `public/` Y NO EN `Media`: es el paso intermedio para que el
 * preview se pueda ver antes de tener sesión en su `/admin`. Al subirlas a
 * `Media` en preview, aquí solo cambian las dos `url` por las del Blob; el
 * componente no se toca porque recibe las imágenes por props.
 */

export const IMAGENES_HERO_PROTOTIPO = {
  fondo: {
    url: "/prototipo/hero-fondo.jpg",
    alt: "Excavadora Hitachi trabajando en un frente de roca",
  },
  frontal: {
    url: "/prototipo/hero-frontal.png",
    alt: "Excavadora Hitachi vista de tres cuartos",
    width: 1476,
    height: 1057,
  },
} as const;
