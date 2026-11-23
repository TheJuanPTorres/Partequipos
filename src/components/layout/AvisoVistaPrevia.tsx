import { draftMode } from "next/headers";

/**
 * Aviso de la VISTA PREVIA DEL BORRADOR (PR 8b): solo lo ve quien la activó desde el panel
 * (`/api/borrador/`). Sin JavaScript: «Salir» es un formulario POST a `/api/borrador/salir/`,
 * que vuelve a la misma página (por la cabecera `Referer`, solo si es del propio sitio).
 * `draftMode()` no hace dinámica la página para los demás visitantes.
 */
export async function AvisoVistaPrevia() {
  if (!(await draftMode()).isEnabled) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-gray-900 px-4 py-2 text-sm text-white"
    >
      <p>
        <strong>Vista previa del borrador.</strong> Ves lo último guardado en el panel; los
        visitantes ven lo publicado.
      </p>
      <form action="/api/borrador/salir/" method="post">
        <button
          type="submit"
          className="rounded border border-white px-3 py-1 font-medium hover:bg-white hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Salir de la vista previa
        </button>
      </form>
    </div>
  );
}
