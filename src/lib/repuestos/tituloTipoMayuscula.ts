/**
 * El tipo de máquina con mayúscula en el título de la página de un MODELO de repuestos
 * (petición del cliente, 2026-10-20). Ese título es texto guardado (el de WordPress, «tal
 * cual»: «LINK-BELT excavadora Link-Belt 210LX»), no se compone en el código, así que se
 * corrige en los datos con `scripts/repuestos/titulos-tipo-mayuscula.ts`.
 *
 * Solo toca la PRIMERA letra de la palabra del tipo y solo si está en minúscula y no es la
 * primera palabra del título (esa es la marca). Marca, número de modelo y el resto de la
 * frase quedan como están (incluidas las erratas de WordPress en la marca: «vOLVO»).
 */
const TIPOS = [
  "minexcavadora",
  "miniexcavadora",
  "excavadora",
  "minicargador",
  "cargador",
  "bulldozer",
  "motoniveladora",
  "retrocargadora",
  "martillo",
] as const;

const PALABRA = new RegExp(`(?<=\\S )\\b(${TIPOS.join("|")})\\b`);

/** El título con el tipo de máquina en mayúscula inicial; el mismo título si no hay nada que cambiar. */
export function mayusculaDelTipo(titulo: string): string {
  return titulo.replace(PALABRA, (p) => p.charAt(0).toUpperCase() + p.slice(1));
}
