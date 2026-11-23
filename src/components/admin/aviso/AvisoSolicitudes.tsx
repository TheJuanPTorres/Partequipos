import type { Payload } from "payload";

import { estadoCorreo } from "@/lib/correo/estado";
import { leerSmtpEnVigor } from "@/lib/correo/servidor";

import { Aviso } from "./Aviso";
import { BarraSolicitudes } from "./BarraSolicitudes";

/**
 * Ayuda arriba de la lista de «Solicitudes» (`beforeList`). No lee ninguna fila
 * ni toca el acceso de la colección, que guarda datos personales de terceros
 * (F4, decisiones-panel.md §22). La barra filtra por estado y exporta a Excel.
 */
export default async function AvisoSolicitudes({ payload }: { payload?: Payload }) {
  const correo = payload ? estadoCorreo(await leerSmtpEnVigor(payload)) : null;
  return (
    <>
      {correo && !correo.configurado ? (
        <Aviso tono="aviso" titulo="Los avisos por correo están apagados">
          <p>
            Las solicitudes llegan aquí, pero no se avisa al equipo ni se responde al visitante:{" "}
            {correo.motivo} Un administrador puede arreglarlo en «Correo y formularios».
          </p>
        </Aviso>
      ) : null}
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
