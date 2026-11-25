"use client";

import { useSyncExternalStore, ViewTransition, type ReactNode } from "react";

import { hayVentanaAbierta, suscribirVentanas } from "@/lib/formularios/ventanaAbierta";

/**
 * El catálogo viejo se funde con el nuevo al cambiar de filtro, orden,
 * categoría o página (animación A2 del listado de usados,
 * `src/lib/listado/animaciones.ts`), con el `<ViewTransition>` de React: las
 * navegaciones del router son transiciones, así que se anima solo, en el
 * momento en que llega el catálogo nuevo. Sin View Transitions en el
 * navegador, no se anima y todo funciona igual. La curva, la duración y
 * «reducir movimiento», en `globals.css` (clase `listado-catalogo`).
 *
 * CON UNA VENTANA DE FORMULARIO ABIERTA no anima su «cambio» (t8, 2026-11-25): el envío del
 * formulario también es una transición de React, y el navegador sustituía la página por una foto
 * fija ~280 ms, sin el fondo oscuro de la ventana (ver `ventanaAbierta.ts`).
 */
export function TransicionCatalogo({ children }: { children: ReactNode }) {
  const conVentana = useSyncExternalStore(suscribirVentanas, hayVentanaAbierta, () => false);
  return (
    <ViewTransition default="listado-catalogo" update={conVentana ? "none" : "listado-catalogo"}>
      {children}
    </ViewTransition>
  );
}
