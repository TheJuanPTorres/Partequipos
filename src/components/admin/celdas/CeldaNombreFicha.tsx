import type { DefaultServerCellComponentProps } from "payload";

import CeldaMiniatura from "./CeldaMiniatura";

/**
 * Celda de lista con la MINIATURA y el NOMBRE juntos, y los dos abren la ficha (tanda 21, tarea 3,
 * punto 1). En la lista de Payload solo la primera columna enlaza; aquí el enlace es toda la celda,
 * con el nombre como texto del enlace (la miniatura es decorativa, `alt=""`).
 */
export default async function CeldaNombreFicha(props: DefaultServerCellComponentProps) {
  const { cellData, rowData, collectionConfig, payload } = props;
  const id = (rowData as { id?: unknown } | undefined)?.id;
  const nombre = typeof cellData === "string" && cellData.trim() ? cellData : "Sin nombre";
  const admin = payload.config.routes.admin;
  const href =
    typeof id === "number" || typeof id === "string"
      ? `${admin}/collections/${collectionConfig.slug}/${id}`
      : undefined;
  const imagenes = (rowData as { imagenes?: unknown } | undefined)?.imagenes;
  return (
    <a className="pq-celda-nombre" href={href}>
      <CeldaMiniatura {...props} cellData={imagenes} />
      <span className="pq-celda-nombre__texto">{nombre}</span>
    </a>
  );
}
