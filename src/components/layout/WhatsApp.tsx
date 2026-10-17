import { enlaceWhatsApp } from "@/lib/whatsapp";
import { getEmpresa } from "@/lib/queries/getSeo";

import { WhatsAppFlotante } from "./WhatsAppFlotante";

/** Mensaje con el que se abre la conversación (dirección, 2026-10-17). */
export const MENSAJE_WHATSAPP = "Hola, vengo de la web de Partequipos y quiero más información.";

/**
 * Botón flotante de WhatsApp de todo el sitio público. El número es el del
 * global de la empresa (`getEmpresa`, el de «Habla con un experto»); sin
 * número válido no se pinta nada.
 */
export async function WhatsApp() {
  const empresa = await getEmpresa();
  const enlace = enlaceWhatsApp(empresa.whatsapp, MENSAJE_WHATSAPP);
  return enlace ? <WhatsAppFlotante href={enlace.href} /> : null;
}
