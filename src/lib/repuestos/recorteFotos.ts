/**
 * RECORTE DEL BLANCO de las fotos de «Qué incluye» (dirección, 2026-11-03): las fotos de los
 * grupos de las categorías técnicas son ficheros cuadrados con la pieza dentro y mucho blanco
 * propio (mediana: 45 % arriba + abajo y 24 % a los lados; medido en las 71 del preview), así que
 * la pieza sale pequeña aunque el recuadro sea cuadrado (#409). Aquí, la parte pura: dónde está
 * la pieza y qué cuadrado recortar, con el MISMO margen en todas. La usa
 * `scripts/repuestos/recortar-fotos-grupos.ts`.
 *
 * Nunca corta la pieza: el cuadrado contiene siempre su caja entera más el margen, y lo que se
 * salga del fichero se rellena de blanco. Una foto sin fondo blanco (la pieza «llena» el
 * fichero, como las de Donaldson) o que ya toca un borde no se toca.
 */

/** Un canal por encima de esto cuenta como blanco (el JPEG nunca da 255 limpio). */
export const UMBRAL_BLANCO = 238;

/** Margen que deja el recorte a cada lado, como fracción del lado del cuadrado nuevo. */
export const MARGEN_RECORTE = 0.04;

/** Prefijo de los ficheros recortados: `<nombre original>-recorte.webp`. */
export const SUFIJO_RECORTE = "-recorte";

export type Caja = { x: number; y: number; ancho: number; alto: number };

/**
 * La caja de la pieza: filas y columnas con algún píxel que no es casi blanco. Una fila o columna
 * solo cuenta si tiene al menos `minimo` píxeles así (por defecto, el 0,2 % del lado), para que
 * una mota de compresión no agrande la caja. `datos` es RGB o RGBA en crudo (sin transparencia:
 * aplanar sobre blanco antes). `null` si es todo blanco.
 */
export function cajaDeLaPieza(
  datos: Uint8Array,
  ancho: number,
  alto: number,
  canales: number,
  umbral = UMBRAL_BLANCO,
): Caja | null {
  const porFila = new Array<number>(alto).fill(0);
  const porColumna = new Array<number>(ancho).fill(0);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * canales;
      if (datos[i]! < umbral || datos[i + 1]! < umbral || datos[i + 2]! < umbral) {
        porFila[y]!++;
        porColumna[x]!++;
      }
    }
  }
  const minFila = Math.max(1, Math.round(ancho * 0.002));
  const minColumna = Math.max(1, Math.round(alto * 0.002));
  const y0 = porFila.findIndex((n) => n >= minFila);
  const x0 = porColumna.findIndex((n) => n >= minColumna);
  if (y0 < 0 || x0 < 0) return null;
  const y1 = alto - 1 - [...porFila].reverse().findIndex((n) => n >= minFila);
  const x1 = ancho - 1 - [...porColumna].reverse().findIndex((n) => n >= minColumna);
  return { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

export type Recorte =
  | { accion: "conservar"; motivo: string }
  | {
      accion: "recortar";
      /** El cuadrado en coordenadas del fichero original (puede salirse: se rellena de blanco). */
      cuadrado: Caja;
      /** Lo que hay que añadir de blanco por cada lado al salir del fichero. */
      relleno: { arriba: number; abajo: number; izq: number; der: number };
      /** Qué parte del lado del cuadrado ocupa la pieza (su lado mayor). */
      ocupacion: number;
    };

/**
 * El cuadrado que recorta: centrado en la pieza, de lado = lado mayor de la pieza / (1 − 2·margen).
 * Se conserva el fichero si no hay pieza, si la pieza toca algún borde (sin fondo blanco, como
 * Donaldson, o ya cortada por ese lado) o si recortar no ganaría casi nada (el cuadrado sería
 * ≥ 95 % del fichero).
 */
export function recorteCuadrado(
  ancho: number,
  alto: number,
  pieza: Caja | null,
  margen = MARGEN_RECORTE,
): Recorte {
  if (!pieza) return { accion: "conservar", motivo: "todo blanco" };
  // La pieza toca un borde: o no hay fondo blanco (Donaldson) o la foto ya viene cortada por ese
  // lado; rellenar de blanco dejaría la pieza «flotando» con el corte a la vista.
  const toca =
    pieza.x <= 1 ||
    pieza.y <= 1 ||
    pieza.x + pieza.ancho >= ancho - 1 ||
    pieza.y + pieza.alto >= alto - 1;
  if (toca) return { accion: "conservar", motivo: "la pieza toca el borde del fichero" };
  const lado = Math.ceil(Math.max(pieza.ancho, pieza.alto) / (1 - 2 * margen));
  if (lado >= 0.95 * Math.max(ancho, alto)) {
    return { accion: "conservar", motivo: "ya tiene poco blanco" };
  }
  const cx = pieza.x + pieza.ancho / 2;
  const cy = pieza.y + pieza.alto / 2;
  const x = Math.round(cx - lado / 2);
  const y = Math.round(cy - lado / 2);
  return {
    accion: "recortar",
    cuadrado: { x, y, ancho: lado, alto: lado },
    relleno: {
      izq: Math.max(0, -x),
      arriba: Math.max(0, -y),
      der: Math.max(0, x + lado - ancho),
      abajo: Math.max(0, y + lado - alto),
    },
    ocupacion: Math.max(pieza.ancho, pieza.alto) / lado,
  };
}

/** El nombre del fichero recortado: `wp-grupo-tren-1-AbC.jpg` → `wp-grupo-tren-1-AbC-recorte.webp`. */
export function ficheroRecortado(original: string): string {
  return `${original.replace(/\.[a-z0-9]+$/i, "")}${SUFIJO_RECORTE}.webp`;
}
