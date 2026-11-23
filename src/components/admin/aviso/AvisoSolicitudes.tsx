import { Aviso } from "./Aviso";
import { BarraSolicitudes } from "./BarraSolicitudes";

/**
 * Ayuda arriba de la lista de «Solicitudes» (`beforeList`). No lee ninguna fila
 * ni toca el acceso de la colección, que guarda datos personales de terceros
 * (F4, decisiones-panel.md §22). La barra filtra por estado y exporta a Excel.
 */
export default function AvisoSolicitudes() {
  return (
    <>
      <Aviso tono="info">
        <p>
          Atiende cada solicitud por tu canal habitual (teléfono, WhatsApp o correo), apunta quién
          la lleva y pásala a «Contactada» y luego a «Cerrada». No la borres: así queda el
          historial.
        </p>
      </Aviso>
      <BarraSolicitudes />
    </>
  );
}
