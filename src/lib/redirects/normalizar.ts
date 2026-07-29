/**
 * Normaliza una ruta para comparar y almacenar redirects de forma consistente:
 * siempre con «/» inicial, sin barra final (salvo la raíz), sin query ni hash.
 * Así `/a/b/`, `a/b` y `/a/b?x=1` se tratan como la misma ruta de origen.
 */
export function normalizarRuta(ruta: string): string {
  let valor = (ruta ?? "").trim();
  if (valor.length === 0) return "";

  // Descarta query y fragmento: el redirect se decide por la ruta.
  valor = valor.split("?")[0] ?? "";
  valor = valor.split("#")[0] ?? "";

  if (!valor.startsWith("/")) valor = `/${valor}`;
  valor = valor.replace(/\/{2,}/g, "/");
  if (valor.length > 1) valor = valor.replace(/\/+$/, "");

  return valor;
}

/**
 * Convierte una ruta interna a su forma CANÓNICA servida por el sitio, que
 * lleva barra final (`trailingSlash: true`, ADR 0006).
 *
 * `normalizarRuta` quita la barra para **comparar** (así `/a/b` y `/a/b/` son la
 * misma clave, se escriba como se escriba en el panel). Pero al **emitir** un
 * redirect hay que devolver la forma canónica: si no, el 301 apunta a la versión
 * sin barra y Next encadena un 308 detrás — dos saltos donde debería haber uno.
 *
 * Las rutas que terminan en archivo con extensión no llevan barra.
 */
export function aRutaCanonica(ruta: string): string {
  const base = normalizarRuta(ruta);
  if (base === "/" || base === "") return "/";

  const ultimo = base.split("/").pop() ?? "";
  if (/\.[a-z0-9]{2,5}$/i.test(ultimo)) return base;

  return `${base}/`;
}

export type RedirectSimple = { desde: string; hacia: string };

/**
 * Comprueba si añadir `nuevo` crearía un bucle con los redirects existentes.
 *
 * Casos cubiertos:
 *  - A → A (bucle inmediato).
 *  - A → B cuando ya existe B → A (bucle de dos saltos).
 *  - Cualquier ciclo más largo, siguiendo la cadena desde el destino.
 */
export function creaBucle(nuevo: RedirectSimple, existentes: RedirectSimple[]): boolean {
  const desde = normalizarRuta(nuevo.desde);
  const hacia = normalizarRuta(nuevo.hacia);

  if (desde === hacia) return true;

  const mapa = new Map(existentes.map((r) => [normalizarRuta(r.desde), normalizarRuta(r.hacia)]));
  mapa.set(desde, hacia);

  // Sigue la cadena desde el nuevo destino; si vuelve al origen, hay ciclo.
  const visitados = new Set<string>([desde]);
  let actual = hacia;

  while (mapa.has(actual)) {
    if (visitados.has(actual)) return true;
    visitados.add(actual);
    actual = mapa.get(actual) as string;
    if (actual === desde) return true;
  }

  return false;
}

/**
 * Dado un nuevo redirect B → C, devuelve los redirects existentes que apuntaban
 * a B (A → B) y que deben aplanarse a A → C.
 *
 * Motivo: los buscadores no siguen cadenas largas y cada salto diluye la señal;
 * conviene que todo apunte directo al destino final.
 */
export function cadenasAAplanar(
  nuevo: RedirectSimple,
  existentes: RedirectSimple[],
): RedirectSimple[] {
  const desde = normalizarRuta(nuevo.desde);
  const hacia = normalizarRuta(nuevo.hacia);

  return existentes.filter((r) => {
    const rDesde = normalizarRuta(r.desde);
    const rHacia = normalizarRuta(r.hacia);
    // Apunta al origen del nuevo redirect y no es el propio registro ni el destino.
    return rHacia === desde && rDesde !== desde && rDesde !== hacia;
  });
}
