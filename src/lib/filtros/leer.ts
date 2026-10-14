import type { Catalogo, ParametrosURL, Seleccion } from "./tipos";

/** El parámetro del orden. Ninguna faceta puede llamarse así. */
export const CLAVE_ORDEN = "orden";

/**
 * Un valor válido en la URL: minúsculas, cifras y guiones (los slugs y los
 * años). Todo lo demás se descarta: así ningún valor necesita codificarse y
 * cada combinación tiene una sola forma escrita.
 */
const VALOR_VALIDO = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

/** Como mucho estos valores por faceta: una URL inventada no puede pedir mil. */
export const MAX_VALORES = 20;

function comoLista(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Lo elegido según la URL, SOLO por su forma: valores con la forma válida,
 * tramos que existen y un orden que existe (si no, el primero). Los valores de
 * lista que no tiene ningún registro los quita después `depurar`, que necesita
 * los datos.
 */
export function leerSeleccion<T>(parametros: ParametrosURL, catalogo: Catalogo<T>): Seleccion {
  const valores: Record<string, string[]> = {};
  for (const faceta of catalogo.facetas) {
    const permitidos = faceta.tipo === "tramos" ? new Set(faceta.tramos.map((t) => t.valor)) : null;
    const vistos = new Set<string>();
    for (const bruto of comoLista(parametros[faceta.clave])) {
      const v = bruto.trim().toLowerCase();
      if (!VALOR_VALIDO.test(v)) continue;
      if (permitidos && !permitidos.has(v)) continue;
      vistos.add(v);
      if (vistos.size >= MAX_VALORES) break;
    }
    if (vistos.size) valores[faceta.clave] = [...vistos];
  }
  const pedido = comoLista(parametros[CLAVE_ORDEN])[0]?.trim().toLowerCase();
  const orden = catalogo.ordenes.some((o) => o.valor === pedido)
    ? pedido!
    : catalogo.ordenes[0].valor;
  return { valores, orden };
}

/** Quita los valores de lista que no tiene ningún registro del listado. */
export function depurar<T>(
  seleccion: Seleccion,
  catalogo: Catalogo<T>,
  items: readonly T[],
): Seleccion {
  const valores: Record<string, string[]> = {};
  for (const faceta of catalogo.facetas) {
    const elegidos = seleccion.valores[faceta.clave];
    if (!elegidos?.length) continue;
    if (faceta.tipo === "tramos") {
      valores[faceta.clave] = [...elegidos];
      continue;
    }
    const existentes = new Set<string>();
    for (const item of items) {
      const o = faceta.de(item);
      if (o) existentes.add(o.valor);
    }
    const quedan = elegidos.filter((v) => existentes.has(v));
    if (quedan.length) valores[faceta.clave] = quedan;
  }
  return { valores, orden: seleccion.orden };
}

/**
 * Valores en su orden canónico, el mismo en que los pinta el panel: así lo
 * que envía su formulario ya es canónico y no hace falta redirigir. Tramos,
 * como están definidos; listas «valor-desc» (años), de mayor a menor; el
 * resto, alfabético.
 */
function enOrden<T>(catalogo: Catalogo<T>, clave: string, valores: readonly string[]): string[] {
  const faceta = catalogo.facetas.find((f) => f.clave === clave);
  if (faceta?.tipo === "tramos") {
    const posicion = new Map(faceta.tramos.map((t, i) => [t.valor, i]));
    return [...valores].sort((a, b) => (posicion.get(a) ?? 0) - (posicion.get(b) ?? 0));
  }
  if (faceta?.ordenOpciones === "valor-desc") {
    return [...valores].sort((a, b) => b.localeCompare(a, "es", { numeric: true }));
  }
  return [...valores].sort();
}

/**
 * La query canónica, sin «?» (vacía si no hay nada): facetas en el orden del
 * catálogo, una clave repetida por valor, valores ordenados, y el orden solo
 * si no es el de por defecto.
 */
export function consultaCanonica<T>(seleccion: Seleccion, catalogo: Catalogo<T>): string {
  const partes: string[] = [];
  for (const faceta of catalogo.facetas) {
    const elegidos = seleccion.valores[faceta.clave];
    if (!elegidos?.length) continue;
    for (const v of enOrden(catalogo, faceta.clave, elegidos)) partes.push(`${faceta.clave}=${v}`);
  }
  if (seleccion.orden !== catalogo.ordenes[0].valor)
    partes.push(`${CLAVE_ORDEN}=${seleccion.orden}`);
  return partes.join("&");
}

function claveConocida<T>(catalogo: Catalogo<T>, clave: string): boolean {
  return clave === CLAVE_ORDEN || catalogo.facetas.some((f) => f.clave === clave);
}

/**
 * Los parámetros CONOCIDOS tal como vienen en la URL, en su orden, sin «?».
 * Si no coincide con `consultaCanonica`, la página redirige a la canónica.
 */
export function consultaRecibida<T>(parametros: ParametrosURL, catalogo: Catalogo<T>): string {
  const partes: string[] = [];
  for (const [clave, v] of Object.entries(parametros)) {
    if (!claveConocida(catalogo, clave)) continue;
    for (const valor of comoLista(v)) partes.push(`${clave}=${valor}`);
  }
  return partes.join("&");
}

/**
 * Los parámetros DESCONOCIDOS (`utm_…`), codificados, para conservarlos en la
 * redirección a la forma canónica. No cuentan como filtro.
 */
export function otrosParametros<T>(parametros: ParametrosURL, catalogo: Catalogo<T>): string {
  const salida = new URLSearchParams();
  for (const [clave, v] of Object.entries(parametros)) {
    if (claveConocida(catalogo, clave)) continue;
    for (const valor of comoLista(v)) salida.append(clave, valor);
  }
  return salida.toString();
}

/** ¿Hay algún filtro o un orden distinto del de por defecto? */
export function hayFiltros<T>(seleccion: Seleccion, catalogo: Catalogo<T>): boolean {
  return consultaCanonica(seleccion, catalogo) !== "";
}

/** Une una ruta y una query (sin «?»): `/a/` + `x=1` → `/a/?x=1`. */
export function conConsulta(ruta: string, ...consultas: string[]): string {
  const q = consultas.filter(Boolean).join("&");
  return q ? `${ruta}?${q}` : ruta;
}
