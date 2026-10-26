import Link from "next/link";

import { Aviso } from "./Aviso";

/**
 * Nota en «Páginas índice y contacto» → «Trabaja con nosotros»: el correo al que llegan las
 * hojas de vida estaba aquí hasta el 2026-10-26 y pasó a Configuración → «Correo y formularios»,
 * junto con el resto de destinatarios y el estado del SMTP. Campo `ui` de servidor (F4).
 */
export default function AvisoCorreoHojasDeVida() {
  return (
    <Aviso titulo="¿Adónde llegan las hojas de vida?" tono="info">
      <p>
        El correo que recibe las hojas de vida de «Enviar HV» se elige en{" "}
        <Link href="/admin/globals/correo-formularios" prefetch={false}>
          Configuración → Correo y formularios
        </Link>
        .
      </p>
    </Aviso>
  );
}
