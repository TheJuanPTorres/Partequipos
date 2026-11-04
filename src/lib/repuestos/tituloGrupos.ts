/**
 * Título de la sección de grupos («Qué incluye» en el panel) de las páginas de categoría técnica
 * de repuestos y de Filtros Donaldson (dirección, 2026-11-04): «Elige el repuesto de {categoría}
 * que necesitas». El nombre va en minúsculas en las categorías («…de tren de rodaje…») y tal cual
 * en Filtros Donaldson. LAS SIGLAS se respetan en mayúsculas (aprobación de Juan Pablo, #421):
 * una palabra de dos o más letras escrita toda en mayúsculas («(GETS)») no se baja. Espacios de
 * sobra fuera; sin nombre, sin hueco doble.
 */
export function tituloEligeRepuesto(nombre: string, minusculas: boolean): string {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  const n = minusculas ? limpio.split(" ").map(enMinusculasSalvoSigla).join(" ") : limpio;
  return n ? `Elige el repuesto de ${n} que necesitas` : "Elige el repuesto que necesitas";
}

/** «(GETS)» → «(GETS)»; «Corte» → «corte»; «Y» → «y» (una letra no es sigla). */
function enMinusculasSalvoSigla(palabra: string): string {
  const letras = palabra.replace(/[^\p{L}]/gu, "");
  const esSigla =
    letras.length >= 2 && letras === letras.toUpperCase() && letras !== letras.toLowerCase();
  return esSigla ? palabra : palabra.toLowerCase();
}
