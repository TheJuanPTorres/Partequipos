/**
 * Teléfonos publicados → enlaces `tel:` (tanda 22, punto 1; QA externo del
 * 2026-11-17). Un campo del panel puede traer VARIOS números («3176707071 /
 * (601)4926260»): con un solo enlace salían pegados en un `tel:` que no marca
 * nada. Aquí cada número es su enlace, con el prefijo del país.
 */

export type TelefonoEnlace = {
  /** El número como lo escribió el editor. */
  texto: string;
  /** `tel:+57…`; `null` si el trozo no es un número marcable (una extensión, una nota). */
  href: string | null;
};

/**
 * El número para marcar. Con «+» delante se respeta; un móvil (10 dígitos que
 * empiezan por 3) o un fijo con indicativo (10 que empiezan por 60) de Colombia
 * ganan el +57; uno que ya lo trae sin el «+» (57 y 10 dígitos), el «+». Otro
 * (un fijo antiguo de 7 dígitos, un número de otro país sin «+») se deja con sus
 * dígitos: adivinarle el prefijo sería inventarlo. Con menos de 7 dígitos, `null`.
 */
export function numeroParaMarcar(texto: string): string | null {
  const limpio = texto.replace(/[^\d+]/g, "");
  const digitos = limpio.replace(/\+/g, "");
  if (digitos.length < 7) return null;
  if (limpio.startsWith("+")) return `+${digitos}`;
  if (digitos.length === 12 && digitos.startsWith("57")) return `+${digitos}`;
  if (digitos.length === 10 && (digitos.startsWith("3") || digitos.startsWith("60"))) {
    return `+57${digitos}`;
  }
  return digitos;
}

/** `tel:` de UN número, o `null` si no es marcable. */
export function enlaceTel(texto: string): string | null {
  const numero = numeroParaMarcar(texto);
  return numero ? `tel:${numero}` : null;
}

/**
 * Los números de un campo, cada uno con su enlace. Separan «/», «;», «|», «,»
 * y las palabras «y» / «o» sueltas; un guion o un espacio no (van dentro de un
 * número: «448 58 78», «492-6260»).
 */
export function telefonosDeTexto(texto: string | null | undefined): TelefonoEnlace[] {
  return (texto ?? "")
    .split(/\s*[/;|,]\s*|\s+[yo]\s+/i)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ texto: t, href: enlaceTel(t) }));
}
