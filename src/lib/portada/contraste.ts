/**
 * ¿SE LEERÁ EL TÍTULO SOBRE LA FOTO? (2026-10-17): el cálculo del aviso de
 * contraste de «Tipografía del título» (`AvisoContrasteTitulo`). Puro, para
 * probarlo. Es una ESTIMACIÓN para avisar, no una medición: se hace con una
 * miniatura de la foto, en la zona donde cae el título, y con el velo que el
 * hero pone encima (`--hero-velo`). No bloquea nada.
 */

/** Contraste mínimo para texto grande (WCAG 1.4.3 AA): el título siempre lo es. */
export const CONTRASTE_MINIMO = 3;

/** El velo del hero: `--color-texto` (#100F0F) con este alfa según la altura (0 = arriba). */
const VELO_RGB = [0x10, 0x0f, 0x0f] as const;
const VELO_PARADAS: readonly [number, number][] = [
  [0, 0.45],
  [0.35, 0.52],
  [0.55, 0.48],
  [0.75, 0.22],
  [1, 0.4],
];

export function alfaDelVelo(y: number): number {
  const f = Math.min(Math.max(y, 0), 1);
  for (let i = 1; i < VELO_PARADAS.length; i++) {
    const [y1, a1] = VELO_PARADAS[i]!;
    const [y0, a0] = VELO_PARADAS[i - 1]!;
    if (f <= y1) return a0 + ((a1 - a0) * (f - y0)) / (y1 - y0);
  }
  return VELO_PARADAS.at(-1)![1];
}

function canal(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa de WCAG. */
export function luminancia(r: number, g: number, b: number): number {
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/** `#rgb` o `#rrggbb` → [r, g, b]; `null` si no es un color así. */
export function rgbDeHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join("") : m[1]!;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Zona de la foto donde cae el título, en fracciones (0–1) de la tarjeta. */
export type Zona = { x0: number; y0: number; x1: number; y1: number };

/**
 * Dónde cae el título: con la posición del panel (en %), una caja de la mitad
 * del ancho y una quinta parte del alto alrededor de ese punto; sin ella,
 * arriba y centrado, como siempre.
 */
export function zonaDelTitulo(x: number | null, y: number | null): Zona {
  const cx = x === null ? 0.5 : x / 100;
  const cy = y === null ? 0.12 : y / 100;
  const ancho = 0.5;
  const alto = 0.2;
  const x0 = Math.min(Math.max(cx - ancho * cx, 0), 1 - ancho);
  const y0 = Math.min(Math.max(cy - alto * cy, 0), 1 - alto);
  return { x0, y0, x1: x0 + ancho, y1: y0 + alto };
}

/**
 * El PEOR contraste del color con la foto en la zona, ya con el velo: se mira
 * el fondo más claro (percentil 90) y el más oscuro (percentil 10) y se queda
 * el menor. `pixeles` es RGBA, como lo da un `<canvas>`.
 */
export function peorContraste(
  pixeles: Uint8ClampedArray | number[],
  ancho: number,
  alto: number,
  zona: Zona,
  color: [number, number, number],
): number | null {
  const lums: number[] = [];
  const xa = Math.floor(zona.x0 * ancho);
  const xb = Math.max(xa + 1, Math.ceil(zona.x1 * ancho));
  const ya = Math.floor(zona.y0 * alto);
  const yb = Math.max(ya + 1, Math.ceil(zona.y1 * alto));
  for (let y = ya; y < Math.min(yb, alto); y++) {
    const a = alfaDelVelo((y + 0.5) / alto);
    for (let x = xa; x < Math.min(xb, ancho); x++) {
      const i = (y * ancho + x) * 4;
      const [r, g, b] = [0, 1, 2].map(
        (k) => (pixeles[i + k] ?? 0) * (1 - a) + VELO_RGB[k as 0 | 1 | 2] * a,
      ) as [number, number, number];
      lums.push(luminancia(r, g, b));
    }
  }
  if (lums.length === 0) return null;
  lums.sort((p, q) => p - q);
  const claro = lums[Math.floor(lums.length * 0.9)] ?? lums.at(-1)!;
  const oscuro = lums[Math.floor(lums.length * 0.1)] ?? lums[0]!;
  const texto = luminancia(...color);
  return Math.min(contraste(texto, claro), contraste(texto, oscuro));
}
