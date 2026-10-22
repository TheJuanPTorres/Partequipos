"use client";

import { ViewTransition, type ReactNode } from "react";

/**
 * El catálogo viejo se funde con el nuevo al cambiar de filtro, orden,
 * categoría o página (animación A2 del listado de usados,
 * `src/lib/listado/animaciones.ts`), con el `<ViewTransition>` de React: las
 * navegaciones del router son transiciones, así que se anima solo, en el
 * momento en que llega el catálogo nuevo. Sin View Transitions en el
 * navegador, no se anima y todo funciona igual. La curva, la duración y
 * «reducir movimiento», en `globals.css` (clase `listado-catalogo`).
 */
export function TransicionCatalogo({ children }: { children: ReactNode }) {
  return <ViewTransition default="listado-catalogo">{children}</ViewTransition>;
}
