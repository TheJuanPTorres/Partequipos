import { Aviso } from "./Aviso";

/**
 * Ayuda arriba de la lista de «Solicitudes» (`beforeList`). Solo texto: no lee
 * ninguna fila ni toca el acceso de la colección, que guarda datos personales
 * de terceros (F4, decisiones-panel.md §22).
 */
export default function AvisoSolicitudes() {
  return (
    <Aviso tono="info">
      <p>
        Atiende cada solicitud por tu canal habitual (teléfono, WhatsApp o correo) y cámbiale el
        estado a «Atendida». No la borres: así queda el historial.
      </p>
    </Aviso>
  );
}
