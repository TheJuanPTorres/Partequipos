import type { FacetaPintada } from "@/lib/filtros";

import estilos from "./filtros.module.css";

/**
 * El panel «Filtrar» de un listado (módulo común, `src/lib/filtros/`).
 *
 * Un formulario GET con casillas, SIN JavaScript: funciona con cualquier
 * navegador y con el teclado, y lo que envía ya está en la forma canónica de
 * la URL (las facetas y sus opciones van en ese orden). Envía siempre a la
 * página 1 (`accion`): con otra selección, la página en la que se estaba
 * puede no existir.
 *
 * En móvil va plegado («Filtrar»); en escritorio, abierto y sin el botón de
 * plegar (`filtros.module.css`).
 */
export function PanelFiltros({
  accion,
  facetas,
  orden,
  ordenPorDefecto,
  activos,
}: {
  accion: string;
  facetas: FacetaPintada[];
  orden: string;
  ordenPorDefecto: string;
  /** Cuántos valores hay elegidos, para el rótulo del panel plegado. */
  activos: number;
}) {
  if (!facetas.length) return null;
  return (
    <details className={estilos.panel}>
      <summary className={estilos.resumen}>Filtrar{activos ? ` (${activos})` : ""}</summary>
      <form method="get" action={accion} className="mt-3 space-y-5 lg:mt-0">
        {facetas.map((faceta) => (
          <fieldset key={faceta.clave}>
            <legend className="text-sm font-semibold text-gray-900">{faceta.etiqueta}</legend>
            <ul className="mt-2 space-y-1">
              {faceta.opciones.map((opcion) => (
                <li key={opcion.valor}>
                  <label className="flex min-h-6 cursor-pointer items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      name={faceta.clave}
                      value={opcion.valor}
                      defaultChecked={opcion.activa}
                      className="h-4 w-4"
                    />
                    <span>{opcion.etiqueta}</span>
                    <span className="text-gray-600" aria-hidden="true">
                      ({opcion.cuenta})
                    </span>
                    <span className="sr-only">
                      , {opcion.cuenta} {opcion.cuenta === 1 ? "unidad" : "unidades"}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
        {orden !== ordenPorDefecto ? <input type="hidden" name="orden" value={orden} /> : null}
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700"
        >
          Aplicar filtros
        </button>
      </form>
    </details>
  );
}
