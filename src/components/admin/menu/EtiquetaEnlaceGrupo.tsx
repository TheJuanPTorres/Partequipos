"use client";

import { useRowLabel } from "@payloadcms/ui";

import { etiquetaDeEnlaceDeGrupo, type EnlaceDeGrupo } from "@/lib/cabecera/arbol";

import { EtiquetaDeFila } from "./EtiquetaDeFila";

/** La etiqueta de cada enlace de un grupo: su texto, su destino y «Oculto». */
export default function EtiquetaEnlaceGrupo() {
  const { data, rowNumber } = useRowLabel<EnlaceDeGrupo>();
  return <EtiquetaDeFila {...etiquetaDeEnlaceDeGrupo(data, (rowNumber ?? 0) + 1)} />;
}
