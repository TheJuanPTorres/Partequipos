import { normalizar } from "./indice";

/**
 * Los títulos (h2 y h3) del cuerpo de un artículo, para el índice fijo «En
 * este artículo» y para dar a cada título su ancla. Sin Payload ni React.
 *
 * El `id` sale del texto del título (sin tildes, minúsculas, guiones) y se
 * hace único con un sufijo numérico; la lista y el pintado recorren el cuerpo
 * en el mismo orden, así que `idDeTitulo` y el pintado coinciden.
 */
export type TituloArticulo = { id: string; texto: string; nivel: 2 | 3 };

type Nodo = { type?: string; tag?: string; text?: string; children?: Nodo[]; root?: Nodo };

function textoDe(n: Nodo): string {
  if (typeof n.text === "string") return n.text;
  return (n.children ?? []).map(textoDe).join("");
}

export function slugDeTitulo(texto: string): string {
  return (
    normalizar(texto)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "seccion"
  );
}

/** Reparte ids únicos a una lista de textos en orden. */
export function idsUnicos(textos: readonly string[]): string[] {
  const usados = new Map<string, number>();
  return textos.map((t) => {
    const base = slugDeTitulo(t);
    const n = (usados.get(base) ?? 0) + 1;
    usados.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

/** Los h2 y h3 del cuerpo, en orden, con su ancla. */
export function titulosDeLexical(datos: unknown): TituloArticulo[] {
  const crudos: { texto: string; nivel: 2 | 3 }[] = [];
  const recorrer = (n: Nodo) => {
    if (n.type === "heading" && (n.tag === "h2" || n.tag === "h3")) {
      const texto = textoDe(n).replace(/\s+/g, " ").trim();
      if (texto) crudos.push({ texto, nivel: n.tag === "h2" ? 2 : 3 });
    }
    (n.children ?? []).forEach(recorrer);
  };
  const raiz = (datos as Nodo | null)?.root;
  if (raiz) recorrer(raiz);
  const ids = idsUnicos(crudos.map((c) => c.texto));
  return crudos.map((c, i) => ({ ...c, id: ids[i]! }));
}
