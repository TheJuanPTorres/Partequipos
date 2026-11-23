/**
 * La escala de las pantallas grandes vista desde JavaScript (la del CSS es `--escala-px`, `globals.css`):
 * 1 hasta 1600 px de ventana y, desde ahí, `ancho / 1600`. Para las medidas en píxeles que viven
 * en el código (márgenes al desplazar, recorridos de una animación…) y que tienen que crecer como
 * el resto de la página. Las que se miden en el DOM ya vienen escaladas: no se tocan.
 */
export const ANCHO_DISENO = 1600;

/**
 * La escala máxima de un monitor de `pantalla` px de ancho (`screen.width`). El ancho de la
 * ventana crece al alejar el zoom del navegador; el del monitor, no (Chrome, Edge y Safari): con
 * este techo, alejar el zoom encoge la página en vez de dejarla igual.
 */
export function techoEscala(pantalla: number): number {
  return pantalla > 0 ? Math.max(1, pantalla / ANCHO_DISENO) : Infinity;
}

export function factorEscala(
  ancho: number = typeof window === "undefined" ? 0 : window.innerWidth,
  pantalla: number = typeof window === "undefined" ? 0 : (window.screen?.width ?? 0),
) {
  return Math.min(Math.max(1, ancho / ANCHO_DISENO), techoEscala(pantalla));
}

/**
 * El script en línea del `<head>` que pone `--escala-techo` (`globals.css`) antes del primer
 * pintado, y otra vez si la ventana cambia de monitor. La misma cuenta que `techoEscala`.
 */
export const SCRIPT_TECHO_ESCALA = `(function(){var d=document.documentElement;function t(){var s=window.screen&&screen.width;if(s>0)d.style.setProperty("--escala-techo",String(Math.max(1,s/${ANCHO_DISENO})))}t();addEventListener("resize",t)})()`;

/** `px` del diseño a píxeles de la pantalla actual. */
export function escalaPx(px: number, ancho?: number, pantalla?: number): number {
  return px * factorEscala(ancho, pantalla);
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
