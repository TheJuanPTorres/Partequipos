"use client";

import { useRowLabel } from "@payloadcms/ui";

import { etiquetaDeApartado, type ApartadoArbol } from "@/lib/cabecera/arbol";

import { EtiquetaDeFila } from "./EtiquetaDeFila";

/** La etiqueta de cada apartado de un desplegable: nombre, tipo (con su fuente o su destino) y «Oculto». */
export default function EtiquetaApartado() {
  const { data, rowNumber } = useRowLabel<ApartadoArbol>();
  return <EtiquetaDeFila {...etiquetaDeApartado(data, (rowNumber ?? 0) + 1)} />;
}
