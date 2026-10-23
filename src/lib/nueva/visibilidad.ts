import type { Where } from "payload";

import type { RedirectGuardado } from "../redirects/mapaConClave";
import { rutas } from "../routes";

/**
 * MARCAS DE MAQUINARIA NUEVA OCULTAS (2026-10-19, petición del cliente: Ammann).
 *
 * La casilla «Mostrar en la web» de `marcas-maquinaria` (marcada por defecto)
 * oculta la marca, sus tipos y sus equipos de TODA la web pública SIN
 * borrarlos: siguen en el panel. El sitio lee con la API local, que no pasa
 * por el control de acceso, así que el filtro va explícito en cada consulta
 * pública (`src/lib/queries/getMaquinaria.ts`, el megamenú, el buscador y el
 * listado de nueva); el guardarraíl `visibilidad.test.ts` lo vigila.
 *
 * `not_equals: false` deja pasar también las filas sin valor (el adaptador de
 * Postgres lo traduce a `IS NULL OR <> false`): solo se oculta lo desmarcado.
 *
 * Sus URL (marca, tipos y fichas) responden 301 al «destino» de la marca
 * (una categoría de nueva; vacío, el índice de nueva): `redirectsDeMarcasOcultas`,
 * que el mapa de redirects del proxy añade a los de la colección `redirects`.
 */
export const MARCA_VISIBLE: Where = { mostrarEnWeb: { not_equals: false } };

/** Para tipos y equipos, que guardan su marca en el campo `marca`. */
export const DE_MARCA_VISIBLE: Where = { "marca.mostrarEnWeb": { not_equals: false } };

/** `where` + que su marca se muestre. */
export const conMarcaVisible = (where?: Where): Where =>
  where ? { and: [where, DE_MARCA_VISIBLE] } : DE_MARCA_VISIBLE;

/**
 * PRODUCTOS OCULTOS (2026-10-23, dirección): la casilla «Mostrar en la web» de cada
 * PRODUCTO (equipos nuevos y usados, modelos de repuestos; los productos de
 * lubricantes la llevan en su fila, `agruparProductos`). Mismo criterio que la de
 * las marcas: solo se oculta lo desmarcado (`not_equals: false` deja pasar los
 * que no tienen valor). Una consulta pública NUEVA de esas colecciones tiene
 * que llevarlo (`visibilidadProductos.test.ts`).
 */
export const PRODUCTO_VISIBLE: Where = { mostrarEnWeb: { not_equals: false } };

/** `where` + que el equipo nuevo se muestre y su marca también. */
export const conEquipoVisible = (where?: Where): Where =>
  where
    ? { and: [where, DE_MARCA_VISIBLE, PRODUCTO_VISIBLE] }
    : { and: [DE_MARCA_VISIBLE, PRODUCTO_VISIBLE] };

/** `where` + que el producto se muestre (usados y modelos de repuestos). */
export const conProductoVisible = (where?: Where): Where =>
  where ? { and: [where, PRODUCTO_VISIBLE] } : PRODUCTO_VISIBLE;

/** Un producto ya leído se muestra salvo que tenga la casilla desmarcada. */
export const productoVisible = (p: { mostrarEnWeb?: boolean | null } | null | undefined) =>
  p?.mostrarEnWeb !== false;

/** Una marca ya leída (poblada) se muestra salvo que tenga la casilla desmarcada. */
export function marcaVisible(marca: unknown): boolean {
  return !(
    marca &&
    typeof marca === "object" &&
    (marca as { mostrarEnWeb?: boolean | null }).mostrarEnWeb === false
  );
}

export type MarcaOculta = { slug: string; destino: string | null };
export type HijoDeMarcaOculta = { marcaSlug: string; tipoSlug: string; equipoSlug?: string };

/**
 * Los 301 de las páginas de las marcas ocultas: la marca, cada tipo y cada
 * ficha llevan al destino de su marca (`destino`, el slug de una categoría de
 * nueva) o, sin él, al índice de tipos de maquinaria nueva
 * (la página principal de nueva desde el 2026-10-23). Con barra final, como las
 * URL del sitio. Los de la colección `redirects` mandan: si una de estas rutas
 * ya tiene uno, no se duplica.
 */
export function redirectsDeMarcasOcultas(
  marcas: MarcaOculta[],
  hijos: HijoDeMarcaOculta[],
  existentes: RedirectGuardado[] = [],
): RedirectGuardado[] {
  const destinoDe = new Map(
    marcas.map((m) => [
      m.slug,
      `${m.destino ? rutas.categoriaNueva(m.destino) : rutas.nuevaTipos()}/`,
    ]),
  );
  const sinBarra = (r: string) => r.replace(/\/+$/, "");
  const ocupadas = new Set(existentes.map((r) => sinBarra(r.desde)));
  const salida: RedirectGuardado[] = [];
  const anadir = (desde: string, marcaSlug: string) => {
    const hacia = destinoDe.get(marcaSlug);
    if (!hacia || ocupadas.has(desde)) return;
    ocupadas.add(desde);
    salida.push({ desde: `${desde}/`, hacia, tipo: "301" });
  };
  for (const m of marcas) anadir(rutas.marcaMaquinaria(m.slug), m.slug);
  for (const h of hijos) {
    anadir(
      h.equipoSlug
        ? rutas.equipoNuevo(h.marcaSlug, h.tipoSlug, h.equipoSlug)
        : rutas.tipoMaquinaria(h.marcaSlug, h.tipoSlug),
      h.marcaSlug,
    );
  }
  return salida;
}

/**
 * Un redirect guardado que apunta a una página oculta se reescribe hacia el
 * destino final: un solo salto, sin 301 encadenados.
 */
export function aplanarHaciaOcultas(
  guardados: RedirectGuardado[],
  ocultos: RedirectGuardado[],
): RedirectGuardado[] {
  const sinBarra = (r: string) => r.split("#")[0]!.replace(/\/+$/, "");
  const final = new Map(ocultos.map((o) => [sinBarra(o.desde), o.hacia]));
  return guardados.map((r) => {
    const hacia = final.get(sinBarra(r.hacia));
    return hacia ? { ...r, hacia } : r;
  });
}
