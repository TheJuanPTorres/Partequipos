/**
 * ESCALA PROPORCIONAL EN PANTALLAS GRANDES (opción 2 de Juan Pablo, 2026-11-18).
 *
 * Plugin de PostCSS propio (sin dependencias): en el CSS del SITIO pasa cada longitud en `px` a
 * `calc(N * var(--escala-px, 1px))` (1 px si `--escala-px` no existe, p. ej. dentro del panel). `--escala-px` vale `max(1px, 100vw / 1600)` (`globals.css`): 1 px hasta 1600 px de
 * ventana, así que por debajo el resultado es el mismo número de píxeles que hoy (390 y 1440 sin
 * cambios), y desde 1600 todo —contenedores, letra, botones, iconos y huecos— crece en proporción,
 * como si el diseño de 1600 se ampliara. Con CSS y no con `zoom`: lo que mide con JavaScript ve las
 * medidas reales.
 *
 * Qué NO toca:
 * - las condiciones de `@media` y `@container` (no son declaraciones);
 * - `0px`, y lo que va dentro de `url(…)` o de una cadena;
 * - el panel de Payload (`(payload)`, `components/admin`) y todo lo de `node_modules`;
 * - un fichero con el comentario `escala: no`.
 */

const EXCLUIDOS = [/node_modules/, /[\\/]\(payload\)[\\/]/, /[\\/]components[\\/]admin[\\/]/];

/** Un número seguido de `px` que no forma parte de otra palabra. */
const PX = /(^|[^\w.#-])(-?(?:\d+\.?\d*|\.\d+))px(?![\w-])/g;

function convertirTramo(tramo) {
  return tramo.replace(PX, (todo, antes, numero) => {
    if (Number(numero) === 0) return `${antes}0px`;
    return `${antes}calc(${numero} * var(--escala-px, 1px))`;
  });
}

/** Pasa los `px` de un valor, sin entrar en `url(…)` ni en cadenas. */
export function escalarValor(valor) {
  if (!valor.includes("px")) return valor;
  let salida = "";
  let tramo = "";
  let i = 0;
  while (i < valor.length) {
    const c = valor[i];
    if (c === '"' || c === "'") {
      salida += convertirTramo(tramo);
      tramo = "";
      const fin = valor.indexOf(c, i + 1);
      const hasta = fin === -1 ? valor.length : fin + 1;
      salida += valor.slice(i, hasta);
      i = hasta;
      continue;
    }
    if (valor.slice(i, i + 4).toLowerCase() === "url(") {
      salida += convertirTramo(tramo);
      tramo = "";
      const fin = valor.indexOf(")", i);
      const hasta = fin === -1 ? valor.length : fin + 1;
      salida += valor.slice(i, hasta);
      i = hasta;
      continue;
    }
    tramo += c;
    i += 1;
  }
  return salida + convertirTramo(tramo);
}

export function ficheroExcluido(fichero) {
  return EXCLUIDOS.some((r) => r.test(fichero ?? ""));
}

export default function escalaPostcss() {
  return {
    postcssPlugin: "partequipos-escala",
    Once(raiz) {
      if (ficheroExcluido(raiz.source?.input?.file)) return;
      let sinEscala = false;
      raiz.walkComments((c) => {
        if (/escala:\s*no\b/.test(c.text)) sinEscala = true;
      });
      if (sinEscala) return;
      raiz.walkDecls((d) => {
        if (d.prop === "--escala-px") return;
        const nuevo = escalarValor(d.value);
        if (nuevo !== d.value) d.value = nuevo;
      });
    },
  };
}
escalaPostcss.postcss = true;
