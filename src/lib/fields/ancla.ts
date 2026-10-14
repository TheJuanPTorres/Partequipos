/**
 * Anclas de los bloques de página (`/servicio-tecnico/#taller`). Sin alias
 * `@/`: lo importa una colección, que se carga con la config.
 *
 * Una letra y después letras, cifras, «-» o «_»: es un `id` de HTML válido y
 * un fragmento de URL que no hace falta codificar. Distingue mayúsculas, como
 * el sitio actual («Siniestros»).
 */
const ANCLA = /^[A-Za-z][A-Za-z0-9_-]{0,62}$/;

export function anclaValida(valor: string): boolean {
  return ANCLA.test(valor);
}

/** Validación del campo en el panel: vacío vale (el ancla es opcional). */
export function validarAncla(valor: unknown): true | string {
  if (valor === null || valor === undefined || valor === "") return true;
  return typeof valor === "string" && anclaValida(valor)
    ? true
    : "Escribe el ancla sin «#» ni espacios: letras, cifras, «-» o «_», empezando por una letra (p. ej. «taller»).";
}
