import type { CollectionConfig, Field, FieldHook } from "payload";

/**
 * ÚLTIMO EDITOR (decisiones-panel.md §25, aprobado por dirección el
 * 2026-10-06): quién guardó un documento por última vez, para «Lo último
 * modificado» de la portada del panel.
 *
 * Lo pone SOLO el servidor:
 * - el acceso de escritura del campo está cerrado, así que Payload descarta lo
 *   que mande el cliente (en 3.89 el acceso de campo se aplica en
 *   `beforeValidate`, antes que los ganchos de `beforeChange`);
 * - el gancho `beforeChange` escribe el usuario de la sesión. Sin sesión (un
 *   script de datos), conserva el valor anterior: un script no se apunta como
 *   editor ni borra al último.
 *
 * Nunca en Solicitudes ni Usuarios. Oculto en el formulario: solo lo enseña la
 * portada. Solo registra las ediciones desde que existe (antes: «—»).
 */
export const CAMPO_ULTIMO_EDITOR = "actualizadoPor";
export const SIN_ULTIMO_EDITOR = new Set(["solicitudes", "users"]);

/** Valor que se guarda: el usuario de la sesión o, sin sesión, el anterior. */
export function ultimoEditor(
  usuario: { id: number | string; collection?: string } | null | undefined,
  anterior: unknown,
): number | string | null {
  if (usuario && (usuario.collection === undefined || usuario.collection === "users")) {
    return usuario.id;
  }
  if (typeof anterior === "number" || typeof anterior === "string") return anterior;
  if (anterior && typeof anterior === "object" && "id" in anterior) {
    const id = (anterior as { id: unknown }).id;
    return typeof id === "number" || typeof id === "string" ? id : null;
  }
  return null;
}

const ponerUltimoEditor: FieldHook = ({ req, previousValue }) =>
  ultimoEditor(req.user as { id: number | string; collection?: string } | null, previousValue);

export const campoUltimoEditor: Field = {
  name: CAMPO_ULTIMO_EDITOR,
  type: "relationship",
  relationTo: "users",
  label: "Último editor",
  // Nadie lo escribe desde fuera: lo pone el gancho.
  access: { create: () => false, update: () => false },
  hooks: { beforeChange: [ponerUltimoEditor] },
  admin: { hidden: true, disableBulkEdit: true },
};

/** Añade el campo a todas las colecciones de contenido (no a Solicitudes ni Usuarios). */
export function conUltimoEditor(colecciones: CollectionConfig[]): CollectionConfig[] {
  return colecciones.map((c) =>
    SIN_ULTIMO_EDITOR.has(c.slug) ? c : { ...c, fields: [...c.fields, campoUltimoEditor] },
  );
}
