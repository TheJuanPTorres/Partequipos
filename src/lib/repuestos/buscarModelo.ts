/**
 * BUSCAR UN MODELO por su nombre (mejoras R1 y R5 de repuestos, 2026-10-21): sin distinguir
 * mayúsculas, tildes, guiones ni espacios. «zx 200», «ZX-200» y «zx200» encuentran la
 * «ZX200-3»; se busca dentro del nombre y del código. Puro: lo usan el servidor (la clave de
 * cada tarjeta) y el navegador (lo que se escribe).
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

/**
 * Columna de inicio de la tarjeta `i` de `n` en ESCRITORIO (rejilla de 6, cada tarjeta ocupa
 * 2), igual que la regla de las tarjetas: 4, en 2 + 2; la última fila incompleta, centrada.
 * `null`: la colocación automática.
 */
export function columnaEscritorio(i: number, n: number): string | null {
  if (n === 4) return i % 2 === 0 ? "2 / span 2" : "4 / span 2";
  if (n % 3 === 1 && i === n - 1) return "3 / span 2";
  if (n % 3 === 2 && i === n - 2) return "2 / span 2";
  return null;
}

/** En TABLET (rejilla de 4): la última de un número impar, al centro. */
export function columnaTablet(i: number, n: number): string | null {
  return n % 2 === 1 && i === n - 1 ? "2 / span 2" : null;
}
