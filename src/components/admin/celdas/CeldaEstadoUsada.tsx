"use client";

import type { DefaultCellComponentProps } from "payload";

import { insigniaUsada } from "@/lib/panel/fichaUsada";

import { InsigniaEstado } from "./InsigniaEstado";

/** Celda de lista: «Publicada», «Oculta» o «Vendida», según los dos interruptores de la fila. */
export default function CeldaEstadoUsada({ rowData }: DefaultCellComponentProps) {
  const fila = (rowData ?? {}) as { mostrarEnWeb?: unknown; disponible?: unknown };
  return <InsigniaEstado insignia={insigniaUsada(fila)} />;
}
