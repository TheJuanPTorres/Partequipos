/**
 * BUSCAR UN MODELO por su nombre (R5 de repuestos, el buscador del panel «Ver todo»; 2026-10-21): sin distinguir
 * mayúsculas, tildes, guiones ni espacios. «zx 200», «ZX-200» y «zx200» encuentran la
 * «ZX200-3»; se busca dentro del nombre. Puro.
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** ¿La clave de un modelo (ya normalizada) contiene lo escrito? Vacío, todos. */
export function coincideModelo(clave: string, consulta: string): boolean {
  const q = normalizarBusqueda(consulta);
  return q === "" || clave.includes(q);
}

const ORDEN = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/**
 * ORDEN NATURAL (R5): EX100, EX120, EX200, EX1200… y no EX100, EX1200, EX120 como el orden
 * de texto. Estable: los iguales conservan su orden.
 */
export function enOrdenNatural<T extends { nombre: string }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => ORDEN.compare(a.nombre, b.nombre));
}
