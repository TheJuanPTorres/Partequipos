/**
 * GEOMETRÍA DEL MARCO del megamenú (2026-10-25). El contorno se dibuja con PIEZAS
 * que solo se mueven y se estiran con `transform`: así el marco cambia de tamaño
 * (M3) sin que nada cambie de sitio en la maqueta (CLS 0) y el contorno es el
 * mismo en cada fotograma (las esquinas y las curvas no se deforman, las líneas
 * siguen midiendo 1 px).
 *
 *        curvaI                                curvaD
 *   ╯ ╭──┬────────────────────────────────┬──╮ ╰
 *     │  │                                │  │
 *   ladoI           fondo               ladoD      ← fondo: 1 × 1 escalado
 *     │  │                                │  │
 *     ╰──┴───────────── base ─────────────┴──╯     ← base y pie: 1 × 1 escalados
 *   esquinaI             pie             esquinaD  ← esquinas: tamaño fijo, solo se mueven
 *
 * Todo va en coordenadas del LIENZO, que tiene un ancho FIJO (`anchoLienzo`): el
 * panel de `ancho` × `alto` va centrado en él.
 */
export type PiezaMarco =
  "fondo" | "base" | "ladoI" | "ladoD" | "pie" | "esquinaI" | "esquinaD" | "curvaI" | "curvaD";

export const PIEZAS_MARCO: readonly PiezaMarco[] = [
  "fondo",
  "base",
  "ladoI",
  "ladoD",
  "pie",
  "esquinaI",
  "esquinaD",
  "curvaI",
  "curvaD",
];

export type Geometria = {
  /** El `transform` de cada pieza (con `transform-origin: 0 0`). */
  piezas: Record<PiezaMarco, string>;
  /** El recorte del contenido: `inset()` relativo al lienzo, con las esquinas de abajo redondeadas. */
  recorte: string;
};

/**
 * Las piezas para un panel de `ancho` × `alto` centrado en un lienzo de
 * `anchoLienzo` y `altoLienzo`. `radio`: esquinas de abajo; `curva`: las curvas
 * cóncavas de arriba (que salen del panel por los lados). Todo en píxeles
 * enteros: sin medios píxeles, sin líneas borrosas.
 */
export function geometriaMarco(
  anchoLienzo: number,
  altoLienzo: number,
  ancho: number,
  alto: number,
  radio = 30,
  curva = 20,
  /**
   * Dónde empieza el panel dentro del lienzo, MEDIDO en pantalla. Sin él, centrado. El
   * marco pasa siempre la medida real: así el contorno cae donde está el panel, sin
   * depender de cálculos de centrado.
   */
  izquierda?: number,
): Geometria {
  const w = Math.max(2 * radio, Math.round(ancho));
  const h = Math.max(radio, Math.round(alto));
  const x = Math.round(izquierda ?? (anchoLienzo - w) / 2);
  const recto = h - radio;
  const t = (dx: number, dy: number, sx?: number, sy?: number) =>
    `translate(${dx}px, ${dy}px)${sx === undefined ? "" : ` scale(${sx}, ${sy})`}`;
  return {
    piezas: {
      // Las piezas estiradas SE SOLAPAN 1 px con sus vecinas (`+ 1`, `- 1`): dos piezas que
      // solo se tocaran dejarían, con un escalado no entero (125 %), una costura de medio
      // píxel, como la de la máscara de antes. Lo solapado queda debajo de las esquinas y
      // las líneas, del mismo color.
      fondo: t(x, 0, w, recto + 1),
      base: t(x + radio - 1, recto, w - 2 * radio + 2, radio),
      ladoI: t(x, 0, 1, recto + 1),
      ladoD: t(x + w - 1, 0, 1, recto + 1),
      pie: t(x + radio - 1, h - 1, w - 2 * radio + 2, 1),
      esquinaI: t(x, recto),
      esquinaD: t(x + w - radio, recto),
      curvaI: t(x - curva, 0),
      curvaD: t(x + w - 1, 0),
    },
    recorte: `inset(0px ${anchoLienzo - x - w}px ${Math.round(altoLienzo) - h}px ${x}px round 0px 0px ${radio}px ${radio}px)`,
  };
}
