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
 * El `sizes` de una foto. Hasta 1024 px la caja es 4:3: una foto que la cubre y es más ancha
 * (3:2) se pinta más ancha que la caja, así que esos valores se multiplican por lo que sobresale.
 * El de escritorio (el primero, `min-width: 1025px`), tal cual: allí la caja tiene su alto fijo.
 */
export function sizesDeFoto(sizes: string, foto: FotoFicha): string {
  if (encajeDeFoto(foto) !== "cubrir") return sizes;
  const factor = foto.width / foto.height / PROPORCION_VISOR;
  if (factor <= 1.01) return sizes;
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
