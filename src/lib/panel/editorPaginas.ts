/**
 * EDITOR VISUAL DE PÁGINAS, ESQUELETO (tanda 26, tarea 8, fase 0; SIN Puck todavía).
 *
 * Una vista propia del panel a pantalla completa en `/admin/editor-paginas/<id>`. Payload 3.89
 * pinta las vistas propias con su propia ruta SIN plantilla (sin menú ni cabecera:
 * `getRouteData`, `templateType` vacío), que es lo que pide un editor a pantalla completa.
 *
 * OJO, leído en Payload 3.89 (`views/Root/index.js`): las vistas propias quedan FUERA de la
 * comprobación de «puede entrar en el panel» (`isCustomAdminView`), así que la vista decide ella
 * misma quién entra. Esa decisión es esta función pura, con pruebas: sin sesión, al acceso; con
 * sesión pero sin permiso de escritura de contenido (`escrituraContenido`), sin permiso; sin un
 * id válido, no encontrada.
 */

/** La ruta de la vista, relativa a `/admin` (la de `admin.components.views`). */
export const RUTA_EDITOR_PAGINAS = "/editor-paginas/:id" as const;

/** El prefijo de la ruta, para enlazar desde otras partes del panel. */
export const PREFIJO_EDITOR_PAGINAS = "/editor-paginas/";

/** El id de la página en la ruta (`/admin/editor-paginas/12` → 12), o `null`. */
export function idDeRutaEditor(segmentos: readonly string[] | string | undefined): number | null {
  const lista = Array.isArray(segmentos)
    ? segmentos
    : typeof segmentos === "string"
      ? [segmentos]
      : [];
  const i = lista.indexOf("editor-paginas");
  if (i < 0 || lista.length !== i + 2) return null;
  const valor = lista[i + 1] ?? "";
  return /^[1-9]\d{0,9}$/.test(valor) ? Number(valor) : null;
}

export type DecisionEditor =
  | { tipo: "acceso" }
  | { tipo: "sin-permiso" }
  | { tipo: "no-encontrada" }
  | { tipo: "entrar"; id: number };

/** Quién entra en el editor: sesión, permiso de escritura de contenido y un id válido. */
export function decisionEditor({
  conSesion,
  puedeEscribir,
  id,
}: {
  conSesion: boolean;
  puedeEscribir: boolean;
  id: number | null;
}): DecisionEditor {
  if (!conSesion) return { tipo: "acceso" };
  if (!puedeEscribir) return { tipo: "sin-permiso" };
  if (id === null) return { tipo: "no-encontrada" };
  return { tipo: "entrar", id };
}

/** Adónde va quien no tiene sesión: el acceso del panel, que le devuelve aquí al entrar. */
export function rutaDeAcceso(rutaPanel: string, rutaActual: string): string {
  return `${rutaPanel}/login?redirect=${encodeURIComponent(rutaActual)}`;
}
