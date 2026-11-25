"use client";

import { useRowLabel } from "@payloadcms/ui";

import { InsigniaEstado } from "@/components/admin/celdas/InsigniaEstado";
import { etiquetaProducto, type FilaProducto } from "@/lib/panel/productoLubricante";

/**
 * La etiqueta de cada fila de «Productos» de una línea de lubricantes (tanda 21, tarea 3, fase 2):
 * nombre y grado, «Oculto» si no sale en la web, y lo que le falta (foto, ficha técnica). Así se
 * encuentra y se revisa un producto sin desplegar la fila.
 */
export default function EtiquetaProducto() {
  const { data, rowNumber } = useRowLabel<FilaProducto>();
  const { titulo, oculto, faltan } = etiquetaProducto(data, (rowNumber ?? 0) + 1);
  return (
    <span className="pq-etiqueta-producto">
      <span>{titulo}</span>
      {oculto ? <InsigniaEstado insignia={{ texto: "Oculto", tono: "aviso" }} /> : null}
      {faltan.length > 0 ? (
        <span className="pq-etiqueta-producto__falta">Falta: {faltan.join(" y ")}</span>
      ) : null}
    </span>
  );
}
