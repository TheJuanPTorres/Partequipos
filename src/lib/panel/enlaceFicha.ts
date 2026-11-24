import type { DefaultServerCellComponentProps } from "payload";

/**
 * EL ENLACE A LA FICHA desde una celda de lista (2026-11-24, urgente: las listas que empiezan por
 * una imagen no abrían ninguna ficha). La URL que Payload pasa (`linkURL`, si la colección la
 * personaliza) o la de siempre: `<admin>/collections/<colección>/<id>`. `undefined` sin id.
 */
export function hrefDeFicha(
  props: Pick<
    DefaultServerCellComponentProps,
    "linkURL" | "rowData" | "collectionConfig" | "payload"
  >,
): string | undefined {
  if (props.linkURL) return props.linkURL;
  const id = (props.rowData as { id?: unknown } | undefined)?.id;
  if (typeof id !== "number" && typeof id !== "string") return undefined;
  const admin = props.payload.config.routes.admin;
  return `${admin}/collections/${props.collectionConfig.slug}/${encodeURIComponent(String(id))}`;
}

/** El título de la fila (su `useAsTitle`), para el texto del enlace. */
export function tituloDeFila(
  props: Pick<DefaultServerCellComponentProps, "rowData" | "collectionConfig">,
): string {
  const campo = props.collectionConfig.admin?.useAsTitle ?? "id";
  const valor = (props.rowData as Record<string, unknown> | undefined)?.[campo];
  return typeof valor === "string" && valor.trim() ? valor : "Abrir la ficha";
}
