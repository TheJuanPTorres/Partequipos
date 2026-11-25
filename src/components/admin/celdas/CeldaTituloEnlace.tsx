import type { DefaultServerCellComponentProps } from "payload";

import { hrefDeFicha } from "@/lib/panel/enlaceFicha";

/**
 * EL NOMBRE ABRE LA FICHA aunque no sea la primera columna (2026-11-24, urgente). En las listas
 * que empiezan por el logo o la imagen, Payload solo enlaza esa primera columna; el editor pulsa el
 * nombre y no pasaba nada. `conListados` pone esta celda en la columna del título (`useAsTitle`)
 * cuando no es la primera. Lo vigila `listadosAbrenFicha.test.ts`.
 */
export default function CeldaTituloEnlace(props: DefaultServerCellComponentProps) {
  const texto =
    typeof props.cellData === "string" && props.cellData.trim() ? props.cellData : "Sin nombre";
  const href = hrefDeFicha(props);
  return href ? <a href={href}>{texto}</a> : <span>{texto}</span>;
}
