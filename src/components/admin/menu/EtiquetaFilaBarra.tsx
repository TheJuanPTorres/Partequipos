"use client";

import { useRowLabel } from "@payloadcms/ui";

import { etiquetaDeFilaBarra, type FilaBarra } from "@/lib/cabecera/arbol";

import { EtiquetaDeFila } from "./EtiquetaDeFila";

/**
 * La etiqueta de cada fila de «Enlaces del menú» (tanda 25, tarea 2): su texto, si es un enlace o
 * un desplegable (con cuántos apartados) y «Oculto». Se lee con la fila plegada.
 */
export default function EtiquetaFilaBarra() {
  const { data, rowNumber } = useRowLabel<FilaBarra>();
  return <EtiquetaDeFila {...etiquetaDeFilaBarra(data, (rowNumber ?? 0) + 1)} />;
}
