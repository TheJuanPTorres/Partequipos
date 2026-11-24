"use client";

import type { DefaultCellComponentProps } from "payload";

import { configFicha, insigniaWeb, type DatosFicha } from "@/lib/panel/fichaProducto";

import { InsigniaEstado } from "./InsigniaEstado";

/**
 * Celda de lista «Estado» de las fichas de producto (tanda 21, tarea 3, fase 2): Publicada u Oculta
 * (y en usadas, Vendida), según los interruptores de la fila. Cada colección, en `FICHAS`.
 */
export default function CeldaEstadoFicha({ rowData, collectionSlug }: DefaultCellComponentProps) {
  const fila = (rowData ?? {}) as DatosFicha;
  const insignia = (configFicha(collectionSlug)?.insignia ?? insigniaWeb)(fila);
  return <InsigniaEstado insignia={insignia} />;
}
