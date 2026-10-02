import { veredictoAlmacen } from "../../src/lib/blob/almacen";

/**
 * Para los scripts que suben ficheros: comprueba SIN ESCRIBIR que el token
 * activo es del almacén esperado (CLAUDE.md §10.37), imprime solo su id y, si
 * no coincide, sale con 1 antes de cargar Payload. La guarda de las
 * colecciones (`almacenEsperado`) lo vuelve a comprobar en cada escritura.
 */
export function exigirAlmacen(etiqueta: string): void {
  const v = veredictoAlmacen(process.env);
  if (!v.valido) {
    console.error(`${etiqueta} NO se hace nada: ${v.motivo}`);
    process.exit(1);
  }
  process.stdout.write(`${etiqueta} almacén de Blob: ${v.almacen} ✓\n`);
}
