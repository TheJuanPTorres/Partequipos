"use client";

import { useConfig } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

import { insigniaDe } from "@/lib/panel/insignias";

import { InsigniaEstado } from "./InsigniaEstado";

/**
 * Celda de lista: «solicitud» como insignia con texto (F3, decisiones-panel.md §24).
 *
 * Es la PRIMERA columna de «Solicitudes», así que ENLAZA A LA FICHA cuando Payload le pasa `link`
 * (2026-11-24, urgente: una celda propia en la primera columna tiene que pintar el enlace ella; sin
 * esto, ninguna solicitud se podía abrir desde la lista). Lo vigila `listadosAbrenFicha.test.ts`.
 */
export default function CeldaSolicitud({
  cellData,
  link,
  linkURL,
  rowData,
  collectionSlug,
}: DefaultCellComponentProps) {
  const { config } = useConfig();
  const insignia = <InsigniaEstado insignia={insigniaDe("solicitud", cellData)} />;
  const id = (rowData as { id?: unknown } | undefined)?.id;
  const href =
    linkURL ??
    (typeof id === "number" || typeof id === "string"
      ? `${config.routes.admin}/collections/${collectionSlug}/${encodeURIComponent(String(id))}`
      : undefined);
  if (!link || !href) return insignia;
  return (
    <a href={href} className="pq-celda-enlace">
      {insignia}
      <span className="sr-only">Abrir la solicitud</span>
    </a>
  );
}
