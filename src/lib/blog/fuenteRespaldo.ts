/**
 * Nombre de la fuente de respaldo que next/font crea para Inter (Arial con
 * las métricas ajustadas a Inter). La usa la cabecera del artículo para fijar
 * su alto con una copia invisible del texto (`cabeceraArticulo.module.css`):
 * esa copia no cambia de fuente al llegar Inter, así que el alto tampoco.
 *
 * Es un detalle INTERNO de Next: en Turbopack lo genera su código en Rust
 * («<familia> Fallback»). Si cambia, la copia caería en otra fuente y el
 * salto volvería sin ningún error, así que `scripts/qa/fuente-respaldo.ts`
 * lo comprueba en el CSS de cada build y lo hace fallar.
 */
export const FUENTE_RESPALDO = "Inter Fallback";

/** ¿Declara este CSS un `@font-face` con la familia de respaldo? Con o sin comillas. */
export function declaraFuenteRespaldo(css: string): boolean {
  const familia = FUENTE_RESPALDO.replace(/ /g, "\\s+");
  return new RegExp(
    `@font-face\\s*\\{[^}]*font-family\\s*:\\s*(['"]?)${familia}\\1\\s*[;}]`,
    "i",
  ).test(css);
}
