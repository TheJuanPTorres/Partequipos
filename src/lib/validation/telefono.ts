/**
 * TELÉFONO DE LOS FORMULARIOS (2026-11-24, tanda 22 punto 20; informe de QA externo). UNA sola regla y
 * UN solo mensaje para la solicitud y la hoja de vida: dígitos, espacios, guiones, paréntesis y un
 * `+` inicial, con entre 7 y 15 DÍGITOS (el máximo del plan internacional E.164). Sin «+» ni «57»
 * delante, como mucho 10 (un número colombiano nacional). Laxo a propósito: rechazar un lead válido es peor que guardar un teléfono mal
 * escrito. Sin Zod: se puede usar también en el navegador.
 */
export const MIN_DIGITOS_TELEFONO = 7;
export const MAX_DIGITOS_TELEFONO = 15;
/** Sin «+» ni «57» delante, un número nacional: 10 dígitos como mucho (móvil colombiano). */
export const MAX_DIGITOS_NACIONAL = 10;
export const MENSAJE_TELEFONO = "Ese teléfono no parece válido. Ejemplo: +57 317 670 7071.";

const FORMA = /^[+]?[\d\s\-().]{7,25}$/;

export function telefonoValido(valor: string): boolean {
  const v = valor.trim();
  if (!FORMA.test(v)) return false;
  const digitos = v.replace(/\D/g, "").length;
  if (digitos < MIN_DIGITOS_TELEFONO || digitos > MAX_DIGITOS_TELEFONO) return false;
  // Con «+» o con «57» delante (el indicativo de Colombia) vale hasta 15; sin prefijo, es nacional.
  const conPrefijo = v.startsWith("+") || v.replace(/\D/g, "").startsWith("57");
  return conPrefijo || digitos <= MAX_DIGITOS_NACIONAL;
}
