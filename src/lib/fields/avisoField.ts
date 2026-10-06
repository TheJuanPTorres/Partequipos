import type { Field } from "payload";

/**
 * Campo `ui` que pinta un aviso del panel (F4, decisiones-panel.md §22,
 * `src/components/admin/aviso/`). No guarda nada ni crea columna: es solo
 * interfaz, así que no cambia el esquema.
 */
export function avisoField(
  name: string,
  componente:
    | "AvisoSinFotos"
    | "AvisoNoDisponible"
    | "AvisoAutorizacion"
    | "AvisoBuscadores"
    | "AvisoRedirecciones",
  { sidebar = false }: { sidebar?: boolean } = {},
): Field {
  return {
    name,
    type: "ui",
    admin: {
      ...(sidebar ? { position: "sidebar" as const } : {}),
      components: { Field: `/components/admin/aviso/${componente}` },
    },
  };
}
