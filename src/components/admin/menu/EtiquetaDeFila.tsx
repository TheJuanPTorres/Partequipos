import { InsigniaEstado } from "@/components/admin/celdas/InsigniaEstado";

/** Lo común de las etiquetas de fila del menú: título, detalle atenuado y la insignia «Oculto». */
export function EtiquetaDeFila({
  titulo,
  detalle,
  oculto,
}: {
  titulo: string;
  detalle: string;
  oculto: boolean;
}) {
  return (
    <span className="pq-etiqueta-menu">
      <span>{titulo}</span>
      <span className="pq-etiqueta-menu__detalle">{detalle}</span>
      {oculto ? <InsigniaEstado insignia={{ texto: "Oculto", tono: "aviso" }} /> : null}
    </span>
  );
}
