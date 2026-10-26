/**
 * GEOMETRÍA DEL MARCO del megamenú (2026-10-26). El contorno es UN SOLO
 * elemento real (`.forma`): fondo, filete de 1 px y esquinas de abajo con
 * `border` y `border-radius` nativos, y las dos curvas cóncavas de arriba como
 * pseudoelementos de tamaño fijo, que van pegados a sus lados. Cambia de ancho y
 * de alto DE VERDAD (`width`/`height`), siguiendo la caja MEDIDA del panel.
 *
 *   ╯ ╭───────────────────────────────────╮ ╰    ← ::before y ::after (tamaño fijo)
 *     │                                   │
 *     │              .forma               │      ← width × height reales
 *     ╰───────────────────────────────────╯      ← border-radius nativo
 *
 * POR QUÉ (fallo del #357, reproducido el 2026-10-26 en Chrome con ventana y
 * GPU, Intel D3D11): las piezas de 1 × 1 px estiradas con `scale()` y con
 * transición CSS se quedaban, tras cambiar de menú, con el tamaño de OTRO panel
 * en pantalla, aunque su `transform` ya era el bueno: el fondo no cubría el
 * panel. Sin pantalla (las capturas de siempre) no pasaba nunca.
 *
 * Por eso tampoco hay transiciones CSS: el cambio de tamaño (M3) lo interpola el
 * marco fotograma a fotograma (`interpolarCaja`), con valores fijos en cada uno.
 * La posición va en `translate` (no cuenta como desplazamiento: CLS 0); el
 * tamaño, en `width` y `height`, que no mueven el punto de inicio.
 */
export type CajaMarco = {
  /** Dónde empieza el panel dentro del lienzo (px). */
  x: number;
  ancho: number;
  alto: number;
};

/**
 * La caja del contorno para un panel de `ancho` × `alto` que empieza en
 * `izquierda` (MEDIDO en pantalla; sin él, centrado en `anchoLienzo`). Todo en
 * píxeles enteros: sin medios píxeles, sin líneas borrosas. Nunca más estrecha
 * que las dos esquinas ni más baja que una.
 */
export function cajaMarco(
  anchoLienzo: number,
  ancho: number,
  alto: number,
  radio = 30,
  izquierda?: number,
): CajaMarco {
  const w = Math.max(2 * radio, Math.round(ancho));
  return {
    x: Math.round(izquierda ?? (anchoLienzo - w) / 2),
    ancho: w,
    alto: Math.max(radio, Math.round(alto)),
  };
}

/** El recorte del contenido: la misma caja, con las esquinas de abajo redondeadas. */
export function recorteMarco(
  caja: CajaMarco,
  anchoLienzo: number,
  altoLienzo: number,
  radio = 30,
): string {
  const der = Math.max(0, Math.round(anchoLienzo) - caja.x - caja.ancho);
  const abajo = Math.max(0, Math.round(altoLienzo) - caja.alto);
  return `inset(0px ${der}px ${abajo}px ${caja.x}px round 0px 0px ${radio}px ${radio}px)`;
}

/** De `desde` a `hacia` en el punto `t` (0–1, ya suavizado), en píxeles enteros. */
export function interpolarCaja(desde: CajaMarco, hacia: CajaMarco, t: number): CajaMarco {
  const k = Math.min(1, Math.max(0, t));
  const m = (a: number, b: number) => Math.round(a + (b - a) * k);
  return {
    x: m(desde.x, hacia.x),
    ancho: m(desde.ancho, hacia.ancho),
    alto: m(desde.alto, hacia.alto),
  };
}

/**
 * La curva de M3, `cubic-bezier(0.33, 0, 0.2, 1)` (la del fundido de los
 * paneles), para `t` de 0 a 1.
 */
export function suavizadoMarco(t: number): number {
  const x1 = 0.33;
  const x2 = 0.2;
  const y1 = 0;
  const y2 = 1;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s ** 2 * (1 - s) + s ** 3;
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s ** 2 * (1 - s) + s ** 3;
  // Bisección: x(s) es monótona en [0, 1].
  let a = 0;
  let b = 1;
  for (let i = 0; i < 30; i++) {
    const s = (a + b) / 2;
    if (bx(s) < t) a = s;
    else b = s;
  }
  return by((a + b) / 2);
}
