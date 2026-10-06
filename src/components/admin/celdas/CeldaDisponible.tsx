"use client";

import type { DefaultCellComponentProps } from "payload";

import { insigniaDe } from "@/lib/panel/insignias";

import { InsigniaEstado } from "./InsigniaEstado";

/** Celda de lista: «disponible» como insignia con texto (F3, decisiones-panel.md §24). */
export default function CeldaDisponible({ cellData }: DefaultCellComponentProps) {
  return <InsigniaEstado insignia={insigniaDe("disponible", cellData)} />;
}
