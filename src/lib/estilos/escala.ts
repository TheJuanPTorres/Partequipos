/**
 * La escala de las pantallas grandes vista desde JavaScript (la del CSS es `--escala-px`, `globals.css`):
 * 1 hasta 1600 px de ventana y, desde ahí, `ancho / 1600`. Para las medidas en píxeles que viven
 * en el código (márgenes al desplazar, recorridos de una animación…) y que tienen que crecer como
 * el resto de la página. Las que se miden en el DOM ya vienen escaladas: no se tocan.
 */
export const ANCHO_DISENO = 1600;

export function factorEscala(
  ancho: number = typeof window === "undefined" ? 0 : window.innerWidth,
) {
  return Math.max(1, ancho / ANCHO_DISENO);
}

/** `px` del diseño a píxeles de la pantalla actual. */
export function escalaPx(px: number, ancho?: number): number {
  return px * factorEscala(ancho);
}

/**
 * El `sizes` de una foto que se pinta a `px` en el diseño: lo mismo hasta 1600 y, desde ahí, en
 * proporción (`max(400px, 25vw)` = 400 px a 1600 y 960 a 3840).
 */
export function sizesEscalado(px: number): string {
  const vw = Math.round((px / ANCHO_DISENO) * 100 * 1000) / 1000;
  return `max(${px}px, ${vw}vw)`;
}

/**
 * Un `sizes` multiplicado por un factor, valor a valor y sin tocar las condiciones de `@media`:
 * `("(max-width: 767px) 30vw, 200px", 1.5)` → `"(max-width: 767px) calc(30vw * 1.5), calc(200px * 1.5)"`.
 * Para una foto que se pinta mayor que su caja (el logo de `LogoOptico`, ampliado para recortar
 * sus márgenes transparentes).
 */
export function sizesPorFactor(sizes: string, factor: number): string {
  if (!Number.isFinite(factor) || Math.abs(factor - 1) < 0.01) return sizes;
  const f = Math.round(factor * 1000) / 1000;
  const partes: string[] = [];
  let nivel = 0;
  let actual = "";
  for (const c of sizes) {
    if (c === "(") nivel++;
    if (c === ")") nivel--;
    if (c === "," && nivel === 0) {
      partes.push(actual);
      actual = "";
    } else actual += c;
  }
  partes.push(actual);
  return partes
    .map((parte) => {
      const p = parte.trim();
      let condicion = "";
      let valor = p;
      if (p.startsWith("(")) {
        let n = 0;
        for (let i = 0; i < p.length; i++) {
          if (p[i] === "(") n++;
          if (p[i] === ")" && --n === 0) {
            condicion = p.slice(0, i + 1) + " ";
            valor = p.slice(i + 1).trim();
            break;
          }
        }
      }
      return `${condicion}calc(${valor} * ${f})`;
    })
    .join(", ");
}
