import { singular, terminos } from "./texto";

/** Las partes de un texto con lo buscado marcado, para resaltar: [{ texto, marca }]. */
export function resaltar(texto: string, consulta: string): { texto: string; marca: boolean }[] {
  const buscadas = terminos(consulta).filter((t) => t.length >= 2);
  if (buscadas.length === 0) return [{ texto, marca: false }];
  const partes: { texto: string; marca: boolean }[] = [];
  const re = /[A-Za-zÀ-ÿ0-9]+/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const trozos = plegarTrozos(m[0]);
    // La palabra del texto se marca si alguna parte suya (letras/números) casa con lo buscado.
    const casa = trozos.some((t) => buscadas.some((b) => t.startsWith(b) || singular(t) === b));
    if (!casa) continue;
    if (m.index > ultimo) partes.push({ texto: texto.slice(ultimo, m.index), marca: false });
    partes.push({ texto: m[0], marca: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push({ texto: texto.slice(ultimo), marca: false });
  return partes.length ? partes : [{ texto, marca: false }];
}

function plegarTrozos(palabra: string): string[] {
  return terminos(palabra);
}
