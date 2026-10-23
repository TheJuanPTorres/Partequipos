import { revalidarCachesDelSitio } from "../../lib/revalidation";
import { productoVisible } from "../../lib/nueva/visibilidad";

/**
 * Mostrar u ocultar un PRODUCTO (casilla «Mostrar en la web», 2026-10-23) cambia
 * todo lo que lo lista: tarjetas, «Otros/Otras», carruseles, menú, buscador,
 * contadores, filtros y sitemap. Esos sitios son muchos (y las cachés de datos,
 * varias), así que, solo cuando la casilla CAMBIA, se vacía la caché entera
 * (`revalidarCachesDelSitio`: todas las etiquetas y todas las páginas). Guardar
 * un producto sin tocar la casilla no pasa por aquí. No relanza.
 */
export function cambiaLaVisibilidad(
  doc: { mostrarEnWeb?: boolean | null } | null | undefined,
  anterior: { mostrarEnWeb?: boolean | null } | null | undefined,
): boolean {
  if (!doc || !anterior) return false;
  return productoVisible(doc) !== productoVisible(anterior);
}

export function revalidarSiCambiaLaVisibilidad(
  doc: { id?: unknown; mostrarEnWeb?: boolean | null },
  anterior: { mostrarEnWeb?: boolean | null } | null | undefined,
  coleccion: string,
): void {
  if (!cambiaLaVisibilidad(doc, anterior)) return;
  try {
    revalidarCachesDelSitio(
      `${coleccion} ${doc.id ?? ""} (${productoVisible(doc) ? "mostrado" : "oculto"})`,
    );
  } catch (error) {
    console.error("[revalidación] visibilidad de producto falló:", error);
  }
}
