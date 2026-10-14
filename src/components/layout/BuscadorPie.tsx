import estilos from "./pie.module.css";

/**
 * BUSCADOR DEL PIE. El campo y el botón de ux-9 (export 2178 del 2026-10-05,
 * medidos en ux-9 publicado). Hasta el 2026-10-14 era PROVISIONAL (anunciaba
 * «Buscador disponible pronto» y no navegaba); desde la petición del cliente de
 * ese día es un formulario GET a `/buscar/?q=…`, la misma página de resultados
 * que usa el de la cabecera. Funciona sin JavaScript, así que es componente de
 * servidor (CLAUDE.md §3.1).
 */
export function BuscadorPie() {
  return (
    <form
      role="search"
      aria-label="Buscar en el sitio"
      action="/buscar/"
      method="get"
      className={estilos.buscador}
    >
      <div className={estilos.buscadorFila}>
        <label htmlFor="pie-buscar" className="sr-only">
          Buscar en el sitio
        </label>
        <input
          id="pie-buscar"
          name="q"
          type="search"
          className={estilos.buscadorCampo}
          placeholder="Escribe para comenzar a buscar..."
          autoComplete="off"
          maxLength={80}
        />
        <button type="submit" className={estilos.buscadorBoton}>
          Buscar
        </button>
      </div>
    </form>
  );
}
