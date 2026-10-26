import { facetasConCuenta, filtrar, ordenar, paginar } from "./aplicar";
import {
  conConsulta,
  consultaCanonica,
  consultaRecibida,
  depurar,
  hayFiltros,
  leerSeleccion,
  otrosParametros,
} from "./leer";
import type { Catalogo, FacetaPintada, ParametrosURL, Seleccion } from "./tipos";

/** Lo que tiene que hacer la página con la URL recibida. */
export type ResultadoListado<T> =
  /** La query no está en su forma canónica: redirigir (308) aquí. */
  | { tipo: "redirigir"; destino: string }
  /** Esa página no existe con esta selección: 404. */
  | { tipo: "no-existe" }
  | {
      tipo: "listado";
      seleccion: Seleccion;
      /** Query canónica, sin «?» (vacía sin filtros). Va en la paginación. */
      consulta: string;
      filtrado: boolean;
      facetas: FacetaPintada[];
      elementos: T[];
      /** Con los filtros aplicados. */
      total: number;
      /** Sin filtros: lo que tiene el listado. */
      totalSinFiltros: number;
      paginas: number;
    };

/**
 * Todo lo que decide un listado con filtros, sin tocar Next: lee la URL,
 * descarta lo que no existe, decide si hay que redirigir a la forma canónica,
 * y filtra, cuenta, ordena y pagina. La página solo traduce el resultado
 * (`permanentRedirect`, `notFound` o pintar).
 *
 * `ruta`: la de la página pedida, con su barra final (la 2 incluye
 * `/pagina/2/`); a ella se redirige.
 */
export function resolverListado<T>({
  items,
  parametros,
  catalogo,
  pagina,
  porPagina,
  primeraPagina,
  ruta,
}: {
  items: readonly T[];
  parametros: ParametrosURL;
  catalogo: Catalogo<T>;
  pagina: number;
  porPagina: number;
  /**
   * Lo que cabe en la página 1 si es distinto de `porPagina` (puede depender de si hay filtros).
   * Por defecto, `porPagina`.
   */
  primeraPagina?: number | ((filtrado: boolean) => number);
  ruta: string;
}): ResultadoListado<T> {
  const seleccion = depurar(leerSeleccion(parametros, catalogo), catalogo, items);
  const consulta = consultaCanonica(seleccion, catalogo);
  if (consultaRecibida(parametros, catalogo) !== consulta) {
    return {
      tipo: "redirigir",
      destino: conConsulta(ruta, consulta, otrosParametros(parametros, catalogo)),
    };
  }
  const filtrados = ordenar(filtrar(items, catalogo, seleccion), catalogo, seleccion);
  const filtrado = hayFiltros(seleccion, catalogo);
  const primera =
    typeof primeraPagina === "function" ? primeraPagina(filtrado) : (primeraPagina ?? porPagina);
  const { elementos, total, paginas } = paginar(filtrados, pagina, porPagina, primera);
  if (pagina > paginas) return { tipo: "no-existe" };
  return {
    tipo: "listado",
    seleccion,
    consulta,
    filtrado,
    facetas: facetasConCuenta(items, catalogo, seleccion),
    elementos,
    total,
    totalSinFiltros: items.length,
    paginas,
  };
}
