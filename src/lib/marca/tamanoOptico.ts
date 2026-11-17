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
 * La caja de la barra de marcas grande (pastillas de 54 px): 140 × 38. El área es la de un logo
 * de proporción 3:1 a 29 px de alto; uno más alargado se ajusta al ancho y uno más compacto, al
 * alto. Medido en el preview (2026-11-09): con 132 × 32, el Hitachi de tres líneas y el Yanmar
 * alargado topaban con la caja y se veían más pequeños que Case.
 */
export const CAJA_GRANDE: Caja = { ancho: 140, alto: 38, area: 87 * 29 };

/** La caja de la barra normal (pastillas de 40 px), en la misma proporción. */
export const CAJA_NORMAL: Caja = { ancho: 102, alto: 27, area: 63 * 21 };

/**
 * El logo sobre la forma de color del BANNER DE MARCA (escritorio, 2026-11-09): hasta 170 × 48,
 * como antes, con el área de un logo 3:1 a 38 px de alto.
 */
export const CAJA_BANNER: Caja = { ancho: 170, alto: 48, area: 114 * 38 };

/** El logo del banner en MÓVIL (la tarjeta blanca): en su bloque de ~96 px de ancho. */
export const CAJA_BANNER_MOVIL: Caja = { ancho: 96, alto: 34, area: 72 * 24 };

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

/**
 * UNA CAJA QUE CAMBIA DE TAMAÑO (logos de repuestos, ronda 19, 2026-11-15): la caja tiene una
 * PROPORCIÓN fija (ancho / alto) y el área visible que se busca es una FRACCIÓN de la suya. Así
 * la misma regla vale en una baldosa del 30 % de la pantalla o en una tarjeta de 152 px.
 */
export type CajaRelativa = {
  /** Ancho / alto de la caja. */
  proporcion: number;
  /** El área visible que se busca, en fracción del área de la caja (0–1). */
  area: number;
  /**
   * Lo más que puede ocupar el logo de la caja, a lo ancho y a lo alto (0–1; por defecto 1). Un
   * logo muy alargado (Caterpillar) se queda en ese ancho, SIN TOCAR EL BORDE, y sale algo menor
   * que los demás; el resto sigue con la misma área (2026-11-16, Juan Pablo: logos más grandes).
   */
  tope?: number;
};

/**
 * `colocarLogo` en PORCENTAJES: `visible` en % de la caja y `imagen` en % de `visible` (el fichero
 * entero, desplazado para que su contenido caiga en `visible`). Lo pinta `LogoOptico`.
 */
export function colocarLogoRelativo(
  logo: { width: number; height: number; recorte?: Recorte | null },
  caja: CajaRelativa,
): Colocacion {
  const alto = 1000;
  const ancho = alto * caja.proporcion;
  const tope = Math.min(1, Math.max(0.1, caja.tope ?? 1));
  // Se coloca en la caja reducida por el tope y se centra en la caja entera.
  const colocado = colocarLogo(logo, {
    ancho: ancho * tope,
    alto: alto * tope,
    area: caja.area * ancho * alto,
  });
  const { imagen } = colocado;
  const visible = {
    ...colocado.visible,
    izquierda: colocado.visible.izquierda + (ancho * (1 - tope)) / 2,
    arriba: colocado.visible.arriba + (alto * (1 - tope)) / 2,
  };
  const pct = (n: number, de: number) => redondear((n / de) * 100);
  return {
    visible: {
      izquierda: pct(visible.izquierda, ancho),
      arriba: pct(visible.arriba, alto),
      ancho: pct(visible.ancho, ancho),
      alto: pct(visible.alto, alto),
    },
    imagen: {
      izquierda: pct(imagen.izquierda, visible.ancho),
      arriba: pct(imagen.arriba, visible.alto),
      ancho: pct(imagen.ancho, visible.ancho),
      alto: pct(imagen.alto, visible.alto),
    },
  };
}
