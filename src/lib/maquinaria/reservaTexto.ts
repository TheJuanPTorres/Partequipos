/**
 * TEXTO DE LA RESERVA de la cabecera de la ficha nueva (2026-10-21): el texto
 * plano de la descripción, para la copia invisible que fija su alto
 * (`.reserva` de `fichaNueva.module.css`, la misma idea que la cabecera del
 * artículo). Sin ella, al llegar Inter la descripción ganaba o perdía una
 * línea y todo lo de debajo se movía (CLS 0,12 a 1010 en el 1150M).
 *
 * Un bloque por párrafo, separados por una línea en blanco (`\n\n`): en la
 * ficha los párrafos se separan exactamente una línea, así que la copia y el
 * texto ocupan las mismas líneas. Un salto de línea dentro de un párrafo, `\n`;
 * cada elemento de una lista, una línea.
 */

type Nodo = { type?: string; text?: string; children?: Nodo[]; root?: Nodo };

function textoDe(n: Nodo): string {
  if (n.type === "linebreak") return "\n";
  if (typeof n.text === "string") return n.text;
  if (n.type === "list") return (n.children ?? []).map(textoDe).join("\n");
  return (n.children ?? []).map(textoDe).join("");
}

export function textoPlanoLexical(datos: unknown): string {
  const raiz = (datos as Nodo | null)?.root;
  if (!raiz) return "";
  return (raiz.children ?? [])
    .map((b) =>
      textoDe(b)
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");
}

/** La reserva de toda la descripción: la entradilla y la descripción comercial. */
export function reservaDescripcion(entradilla: string, descripcion: unknown): string {
  return [entradilla.trim(), textoPlanoLexical(descripcion)].filter(Boolean).join("\n\n");
}
