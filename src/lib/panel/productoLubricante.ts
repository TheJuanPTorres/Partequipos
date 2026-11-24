/**
 * EDICIÓN FÁCIL DE LOS PRODUCTOS DE LUBRICANTE (tanda 21, tarea 3, fase 2): no son una colección,
 * sino las filas de «Productos» de cada línea (`categorias-lubricante`). En lugar de «Producto 01»,
 * cada fila plegada dice qué producto es, si está oculto y qué le falta de lo que pinta la página
 * de la línea (foto y ficha técnica en PDF). Lógica pura, con pruebas; la usa `EtiquetaProducto`.
 */

export type FilaProducto = {
  nombre?: unknown;
  grado?: unknown;
  imagen?: unknown;
  ficha?: unknown;
  mostrarEnWeb?: unknown;
};

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const hay = (v: unknown) => v !== null && v !== undefined && v !== "";

export function etiquetaProducto(
  fila: FilaProducto | undefined,
  numero: number,
): { titulo: string; oculto: boolean; faltan: string[] } {
  const nombre = texto(fila?.nombre);
  const grado = texto(fila?.grado);
  const titulo = nombre
    ? `${nombre}${grado ? ` ${grado}` : ""}`
    : `Producto ${String(numero).padStart(2, "0")} (sin nombre)`;
  const faltan: string[] = [];
  if (!hay(fila?.imagen)) faltan.push("foto");
  if (!hay(fila?.ficha)) faltan.push("ficha técnica");
  return { titulo, oculto: fila?.mostrarEnWeb === false, faltan };
}
