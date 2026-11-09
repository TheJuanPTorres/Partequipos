/**
 * TAMAÑO ÓPTICO DE UN LOGO EN UNA CAJA FIJA (selector de marcas de nueva, dirección 2026-11-09).
 *
 * Al cambiar de marca, la pastilla activa pasaba del logo de siempre al de la baldosa, con otra
 * proporción y otros márgenes transparentes, y la pastilla cambiaba de ancho. Ahora cada logo va
 * en una caja FIJA (mismo ancho y alto para todas las pastillas, activa e inactiva) y se pinta
 * con la MISMA ÁREA VISIBLE: un logo alargado sale más ancho y más bajo, uno compacto más alto y
 * más estrecho, y así se ven parejos (Hitachi con sus placas, Case, Yanmar).
 *
 * El área se mide sobre el CONTENIDO del logo, sin sus márgenes transparentes (`recorte`, que
 * mide el servidor con `recorteVisible`): los logos de siempre llevan márgenes grandes (Hitachi,
 * ~18 % por lado) y los de la baldosa vienen recortados, y sin quitarlos la activa salía mayor.
 */

/** La parte visible del fichero, en fracciones de su ancho y su alto (0–1). */
export type Recorte = { x: number; y: number; w: number; h: number };

/** Todo el fichero: sin medir (o la medida falló), los márgenes cuentan como logo. */
export const SIN_RECORTE: Recorte = { x: 0, y: 0, w: 1, h: 1 };

export type Caja = {
  /** Ancho y alto de la caja, en px CSS. */
  ancho: number;
  alto: number;
  /** El área visible que se busca, en px² CSS (antes de ajustar a la caja). */
  area: number;
};

/**
 * La caja de la barra de marcas grande (pastillas de 54 px): 132 × 32. El área es la de un logo
 * de proporción 3:1 a 29 px de alto; uno más alargado se ajusta al ancho y uno más compacto, al
 * alto.
 */
export const CAJA_GRANDE: Caja = { ancho: 132, alto: 32, area: 87 * 29 };

/** La caja de la barra normal (pastillas de 40 px), en la misma proporción. */
export const CAJA_NORMAL: Caja = { ancho: 96, alto: 23, area: 63 * 21 };

/**
 * Dónde y a qué tamaño va el logo: `visible` es la caja del contenido, centrada en la caja fija;
 * `imagen`, el fichero entero, desplazado para que su contenido caiga en `visible` (lo que sobra
 * son sus márgenes transparentes, que se recortan).
 */
export type Colocacion = {
  visible: { izquierda: number; arriba: number; ancho: number; alto: number };
  imagen: { izquierda: number; arriba: number; ancho: number; alto: number };
};

const redondear = (n: number) => Math.round(n * 100) / 100;

export function colocarLogo(
  logo: { width: number; height: number; recorte?: Recorte | null },
  caja: Caja,
): Colocacion {
  const r = valido(logo.recorte) ? logo.recorte : SIN_RECORTE;
  const anchoContenido = Math.max(1, logo.width * r.w);
  const altoContenido = Math.max(1, logo.height * r.h);
  const proporcion = anchoContenido / altoContenido;
  let alto = Math.sqrt(caja.area / proporcion);
  let ancho = alto * proporcion;
  const ajuste = Math.min(1, caja.ancho / ancho, caja.alto / alto);
  ancho *= ajuste;
  alto *= ajuste;
  const anchoImagen = ancho / r.w;
  const altoImagen = alto / r.h;
  return {
    visible: {
      izquierda: redondear((caja.ancho - ancho) / 2),
      arriba: redondear((caja.alto - alto) / 2),
      ancho: redondear(ancho),
      alto: redondear(alto),
    },
    imagen: {
      izquierda: redondear(-r.x * anchoImagen),
      arriba: redondear(-r.y * altoImagen),
      ancho: redondear(anchoImagen),
      alto: redondear(altoImagen),
    },
  };
}

function valido(r: Recorte | null | undefined): r is Recorte {
  if (!r) return false;
  const ok = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1;
  return (
    ok(r.x) &&
    ok(r.y) &&
    ok(r.w) &&
    ok(r.h) &&
    r.w > 0 &&
    r.h > 0 &&
    r.x + r.w <= 1.0001 &&
    r.y + r.h <= 1.0001
  );
}
