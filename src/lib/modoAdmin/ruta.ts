/**
 * MODO ADMINISTRACIÓN: la `ruta` que llega a `GET /api/modo-admin/mapa/`. Viene de la URL, así que
 * se valida ANTES de consultar nada (dirección, 2026-11-24):
 * - es una ruta del sitio, no una URL: empieza por `/`, sin esquema, host, query ni ancla;
 * - solo minúsculas, números, guiones y barras, como los slugs del sitio (§3.3): sin `..`, `\`,
 *   `%`, espacios ni barras dobles;
 * - como mucho 200 caracteres;
 * - y se CLASIFICA contra las rutas que el modo administración conoce. Lo que no casa con ninguna
 *   es «otra»: no se consulta la base por ella.
 */
export const LARGO_MAXIMO_RUTA = 200;

const FORMA = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/;

/** La ruta normalizada (con barra final), o `null` si no es una ruta válida del sitio. */
export function rutaValida(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length === 0 || valor.length > LARGO_MAXIMO_RUTA) {
    return null;
  }
  const conBarra = valor.endsWith("/") ? valor : `${valor}/`;
  if (conBarra.length > LARGO_MAXIMO_RUTA) return null;
  return FORMA.test(conBarra) ? conBarra : null;
}

export type RutaConocida =
  { tipo: "portada" } | { tipo: "usada"; categoria: string; slug: string } | { tipo: "otra" };

const BASE_USADA = "/maquinaria-pesada/maquinaria-pesada-usada/";
/** Segmentos de usados que NO son una categoría con unidades debajo. */
const RESERVADAS_USADA = new Set(["marcas", "otros", "pagina"]);

/** Qué página del sitio es una ruta YA validada (`rutaValida`). */
export function clasificarRuta(ruta: string): RutaConocida {
  if (ruta === "/") return { tipo: "portada" };
  if (ruta.startsWith(BASE_USADA)) {
    const [categoria, slug, ...resto] = ruta.slice(BASE_USADA.length).split("/").filter(Boolean);
    if (categoria && slug && resto.length === 0) {
      if (!RESERVADAS_USADA.has(categoria) && slug !== "pagina") {
        return { tipo: "usada", categoria, slug };
      }
    }
  }
  return { tipo: "otra" };
}
