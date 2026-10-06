"use client";

import type { DefaultCellComponentProps } from "payload";

import { fechaExacta, fechaRelativa } from "@/lib/panel/fechas";

/**
 * Celda de fecha relativa («hace 2 días») con la exacta al pasar el ratón O al
 * enfocar con el teclado (F3, decisiones-panel.md §24). Se puede enfocar
 * (`tabIndex=0`) y la exacta va también en el texto para el lector de
 * pantalla, no solo en `title`.
 */
export default function CeldaFecha({ cellData }: DefaultCellComponentProps) {
  if (typeof cellData !== "string" && typeof cellData !== "number" && !(cellData instanceof Date)) {
    return null;
  }
  const fecha = new Date(cellData);
  if (Number.isNaN(fecha.getTime())) return null;
  const exacta = fechaExacta(fecha);
  return (
    <time className="pq-fecha" dateTime={fecha.toISOString()} tabIndex={0} title={exacta}>
      {fechaRelativa(fecha)}
      <span className="pq-fecha__exacta">{exacta}</span>
    </time>
  );
}
