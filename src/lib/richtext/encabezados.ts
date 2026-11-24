/**
 * ENCABEZADOS SIN SALTOS en un texto del panel que se pinta DENTRO de una ficha (informe de QA del
 * 2026-11-17, punto 32). La ficha ya tiene su `<h1>`; si la descripción trae un «Título 3» (o un
 * «Título 1»), la página salta de h1 a h3, o repite h1. Aquí los niveles que use el texto se
 * renumeran, en su orden, a partir de `desde` (h2): {h3, h4} → {h2, h3}; {h1, h2} → {h2, h3};
 * {h2, h4} → {h2, h3}. El texto del panel no se toca: solo cómo se pinta.
 */

type Nodo = { type?: string; tag?: string; children?: Nodo[]; [k: string]: unknown };
type Estado = { root?: Nodo; [k: string]: unknown };

const NIVEL = /^h([1-6])$/;

function niveles(n: Nodo | undefined, acc: Set<number>): Set<number> {
  if (!n) return acc;
  const m = n.type === "heading" && typeof n.tag === "string" ? NIVEL.exec(n.tag) : null;
  if (m) acc.add(Number(m[1]));
  for (const h of n.children ?? []) niveles(h, acc);
  return acc;
}

function renumerar(n: Nodo, mapa: Map<number, number>): Nodo {
  const m = n.type === "heading" && typeof n.tag === "string" ? NIVEL.exec(n.tag) : null;
  const tag = m ? `h${mapa.get(Number(m[1])) ?? Number(m[1])}` : n.tag;
  return {
    ...n,
    ...(m ? { tag } : {}),
    ...(n.children ? { children: n.children.map((h) => renumerar(h, mapa)) } : {}),
  };
}

/** Copia del estado de Lexical con los encabezados renumerados desde `desde`; sin encabezados, igual. */
export function encabezadosDesde<T>(datos: T, desde = 2): T {
  const estado = datos as Estado | null;
  if (!estado || typeof estado !== "object" || !estado.root) return datos;
  const usados = [...niveles(estado.root, new Set())].sort((a, b) => a - b);
  if (usados.length === 0) return datos;
  const mapa = new Map(usados.map((nivel, i) => [nivel, Math.min(6, desde + i)]));
  if (usados.every((nivel) => mapa.get(nivel) === nivel)) return datos;
  return { ...estado, root: renumerar(estado.root, mapa) } as T;
}
