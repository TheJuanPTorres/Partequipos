import type { CheckboxField } from "payload";

/**
 * «MOSTRAR EN LA WEB» de un PRODUCTO (2026-10-23, dirección): oculta ese producto
 * de toda la web pública SIN borrarlo; sigue en el panel. Marcada por defecto.
 * Desmarcada, el producto no sale en listados, tarjetas, «otros», recomendaciones,
 * carruseles, menú, buscador, contadores, filtros, sitemap ni JSON-LD, y su página
 * redirige (307, temporal) a su página padre. Las lecturas del sitio filtran con
 * `PRODUCTO_VISIBLE` (`src/lib/nueva/visibilidad.ts`); `visibilidadProductos.test.ts`
 * vigila que ninguna se olvide.
 *
 * La lista del panel pinta la columna «Visible» y se filtra por este campo.
 */
export function mostrarEnWebField(
  opciones: { sidebar?: boolean; descripcion?: string } = {},
): CheckboxField {
  const { sidebar = true, descripcion } = opciones;
  return {
    name: "mostrarEnWeb",
    type: "checkbox",
    defaultValue: true,
    label: "Mostrar en la web",
    admin: {
      ...(sidebar ? { position: "sidebar" as const } : {}),
      components: { Cell: "/components/admin/celdas/CeldaVisible" },
      description:
        descripcion ??
        "Desmarcada, desaparece de toda la web (listados, menú, buscador, portada y sitemap) sin borrarse del panel, y su página lleva a la de su categoría. Vuelve al marcarla.",
    },
  };
}
