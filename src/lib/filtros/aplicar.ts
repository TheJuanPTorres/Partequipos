import type { Catalogo, Faceta, FacetaPintada, OpcionConCuenta, Seleccion } from "./tipos";

/** ¿Cumple el registro lo elegido en ESTA faceta? Sin nada elegido, sí. */
export function cumple<T>(
  item: T,
  faceta: Faceta<T>,
  elegidos: readonly string[] | undefined,
): boolean {
  if (!elegidos?.length) return true;
  if (faceta.tipo === "lista") {
    const o = faceta.de(item);
    return o !== null && elegidos.includes(o.valor);
  }
  const n = faceta.de(item);
  // Sin el dato, no entra en ningún tramo: no se puede afirmar que cumpla.
  if (n === null || !Number.isFinite(n)) return false;
  return faceta.tramos.some(
    (t) =>
      elegidos.includes(t.valor) &&
      (t.desde === undefined || n >= t.desde) &&
      (t.hasta === undefined || n < t.hasta),
  );
}

/** Los registros que cumplen todas las facetas (menos `salvo`, si se da). */
export function filtrar<T>(
  items: readonly T[],
  catalogo: Catalogo<T>,
  seleccion: Seleccion,
  salvo?: string,
): T[] {
  const activas = catalogo.facetas.filter(
    (f) => f.clave !== salvo && seleccion.valores[f.clave]?.length,
  );
  return items.filter((item) => activas.every((f) => cumple(item, f, seleccion.valores[f.clave])));
}

/**
 * Las facetas con el recuento de cada opción. Cada faceta cuenta con los
 * demás filtros aplicados pero no con el suyo: así «Hitachi (27)» dice
 * cuántas habría al añadir Hitachi a lo elegido. Se pintan las opciones con
 * algo que contar y las elegidas (aunque se queden en 0, para poder quitarlas).
 * Una faceta sin ninguna opción no se pinta.
 */
export function facetasConCuenta<T>(
  items: readonly T[],
  catalogo: Catalogo<T>,
  seleccion: Seleccion,
): FacetaPintada[] {
  const salida: FacetaPintada[] = [];
  for (const faceta of catalogo.facetas) {
    const elegidos = seleccion.valores[faceta.clave] ?? [];
    const base = filtrar(items, catalogo, seleccion, faceta.clave);
    let opciones: OpcionConCuenta[];
    if (faceta.tipo === "lista") {
      // Etiquetas de TODO el listado: una opción elegida que hoy cuenta 0
      // sigue teniendo su nombre.
      const etiquetas = new Map<string, string>();
      for (const item of items) {
        const o = faceta.de(item);
        if (o && !etiquetas.has(o.valor)) etiquetas.set(o.valor, o.etiqueta);
      }
      const cuentas = new Map<string, number>();
      for (const item of base) {
        const o = faceta.de(item);
        if (o) cuentas.set(o.valor, (cuentas.get(o.valor) ?? 0) + 1);
      }
      opciones = [...etiquetas]
        .map(([valor, etiqueta]) => ({
          valor,
          etiqueta,
          cuenta: cuentas.get(valor) ?? 0,
          activa: elegidos.includes(valor),
        }))
        .filter((o) => o.cuenta > 0 || o.activa);
      opciones.sort(
        faceta.ordenOpciones === "valor-desc"
          ? (a, b) => b.valor.localeCompare(a.valor, "es", { numeric: true })
          : (a, b) => a.etiqueta.localeCompare(b.etiqueta, "es"),
      );
    } else {
      opciones = faceta.tramos
        .map((t) => ({
          valor: t.valor,
          etiqueta: t.etiqueta,
          cuenta: base.filter((item) => cumple(item, faceta, [t.valor])).length,
          activa: elegidos.includes(t.valor),
        }))
        .filter((o) => o.cuenta > 0 || o.activa);
    }
    if (opciones.length) salida.push({ clave: faceta.clave, etiqueta: faceta.etiqueta, opciones });
  }
  return salida;
}

/** Ordena según lo elegido (sin tocar la lista recibida). */
export function ordenar<T>(items: readonly T[], catalogo: Catalogo<T>, seleccion: Seleccion): T[] {
  const orden = catalogo.ordenes.find((o) => o.valor === seleccion.orden) ?? catalogo.ordenes[0];
  return [...items].sort(orden.comparar);
}

/** Una página de una lista ya filtrada y ordenada. */
export function paginar<T>(
  items: readonly T[],
  pagina: number,
  porPagina: number,
): { elementos: T[]; total: number; paginas: number } {
  const total = items.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;
  return { elementos: items.slice(inicio, inicio + porPagina), total, paginas };
}

/**
 * Compara dos números que pueden faltar: los que faltan, siempre al final
 * (en los dos sentidos). Para los `comparar` de los adaptadores.
 */
export function compararNumeros(
  a: number | null | undefined,
  b: number | null | undefined,
  sentido: "asc" | "desc",
): number {
  const fa = typeof a !== "number" || !Number.isFinite(a);
  const fb = typeof b !== "number" || !Number.isFinite(b);
  if (fa || fb) return fa === fb ? 0 : fa ? 1 : -1;
  return sentido === "asc" ? a - b : b - a;
}
