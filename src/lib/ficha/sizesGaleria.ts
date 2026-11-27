export type FotoFicha = {
  url: string;
  alt: string;
  width: number;
  height: number;
  /** `object-position` del punto focal del panel (`posicionFocal`); sin él, el centro. */
  posicion?: string;
};

/**
 * La caja de la foto grande hasta 1024 px (tanda 25, t5): 4:3, la proporción del 94 % de las
 * 1.569 fotos de usados (medido en el preview el 2026-11-26; 3 % en 3:2 y 2 % verticales).
 */
export const PROPORCION_VISOR = 4 / 3;

/**
 * Lo que se puede recortar de una foto con `cover` antes de pasar a verla entera. Una 3:2 en la
 * caja 4:3 pierde el 11 % del ancho y se recorta; una cuadrada, una 16:9 o una vertical perderían
 * el 25 % o más (la cuchara, el brazo o la pluma de la máquina), y van enteras.
 */
const RECORTE_MAXIMO = 0.15;

/** «cubrir»: llena la caja respetando el punto focal. «entera»: `contain` sobre su fondo. */
export function encajeDeFoto(foto: FotoFicha): "cubrir" | "entera" {
  if (!foto.width || !foto.height) return "cubrir";
  const r = foto.width / foto.height;
  const recorte = 1 - Math.min(r, PROPORCION_VISOR) / Math.max(r, PROPORCION_VISOR);
  return recorte > RECORTE_MAXIMO ? "entera" : "cubrir";
}

/**
 * El `sizes` de una foto. Hasta 1024 px la caja es 4:3 y lo pintado depende del encaje: una foto
 * que la cubre y es más ancha (3:2) sobresale de la caja, y una entera más estrecha (vertical,
 * cuadrada) ocupa solo su parte; esos valores se multiplican por esa fracción. El de escritorio
 * (el primero, `min-width: 1025px`), tal cual: allí la caja tiene su alto fijo.
 */
export function sizesDeFoto(sizes: string, foto: FotoFicha): string {
  if (!foto.width || !foto.height) return sizes;
  const relacion = foto.width / foto.height / PROPORCION_VISOR;
  const factor = encajeDeFoto(foto) === "cubrir" ? Math.max(1, relacion) : Math.min(1, relacion);
  if (Math.abs(factor - 1) <= 0.01) return sizes;
  const k = Math.ceil(factor * 1000) / 1000;
  return partesDeSizes(sizes)
    .map((parte) => {
      const p = parte.trim();
      if (/min-width:\s*1025px/.test(p)) return p;
      const corte = p.lastIndexOf(")");
      const media = p.startsWith("(") ? p.slice(0, corte + 1) : "";
      const valor = p.slice(media.length).trim();
      return `${media ? `${media} ` : ""}calc(${valor} * ${k})`;
    })
    .join(", ");
}

/** Las entradas de un `sizes`, cortando solo por las comas que no van dentro de `max(…)` o `calc(…)`. */
function partesDeSizes(sizes: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let desde = 0;
  for (let i = 0; i < sizes.length; i++) {
    const c = sizes[i];
    if (c === "(") nivel++;
    else if (c === ")") nivel--;
    else if (c === "," && nivel === 0) {
      partes.push(sizes.slice(desde, i));
      desde = i + 1;
    }
  }
  partes.push(sizes.slice(desde));
  return partes;
}

/**
 * La foto a la que lleva una tecla en la galería (y en la pantalla completa): ←/→ la anterior y la
 * siguiente (dando la vuelta), Inicio/Fin la primera y la última. `null`: la tecla no es de la
 * galería (sigue su curso), hay una sola foto o va con Alt, Ctrl o Cmd.
 */
export function teclaGaleria(
  tecla: string,
  actual: number,
  total: number,
  conModificador = false,
): number | null {
  if (total < 2 || conModificador) return null;
  if (tecla === "ArrowRight") return (actual + 1) % total;
  if (tecla === "ArrowLeft") return (actual - 1 + total) % total;
  if (tecla === "Home") return 0;
  if (tecla === "End") return total - 1;
  return null;
}
