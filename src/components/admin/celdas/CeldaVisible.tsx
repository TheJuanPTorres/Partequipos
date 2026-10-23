"use client";

import type { DefaultCellComponentProps } from "payload";

import { insigniaDe } from "@/lib/panel/insignias";

import { InsigniaEstado } from "./InsigniaEstado";

/** Celda de lista: «Mostrar en la web» como «Visible» u «Oculto» (con texto, no solo color). */
export default function CeldaVisible({ cellData }: DefaultCellComponentProps) {
  return <InsigniaEstado insignia={insigniaDe("visible", cellData)} />;
}
