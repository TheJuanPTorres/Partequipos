"use client";

import type { DefaultCellComponentProps } from "payload";

import { InsigniaEstado } from "./InsigniaEstado";

/**
 * Celda «Autorizó» de la bandeja de solicitudes (2026-11-27): «Sí» si marcó la casilla de
 * autorización del tratamiento de datos; «—» en las anteriores a la casilla (sin dato).
 */
export default function CeldaAutorizo({ cellData }: DefaultCellComponentProps) {
  if (cellData === true) return <InsigniaEstado insignia={{ texto: "Sí", tono: "exito" }} />;
  if (cellData === false) return <InsigniaEstado insignia={{ texto: "No", tono: "aviso" }} />;
  return <span aria-label="Sin dato">—</span>;
}
