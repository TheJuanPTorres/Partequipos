import type { Payload } from "payload";

import { claveDeCifrado } from "./cifrado";
import { smtpEnVigor, type DatosSmtpPanel, type SmtpEnVigor } from "./enVigor";

type Entorno = Record<string, string | undefined>;

/**
 * El SMTP EN VIGOR leído en el SERVIDOR: el grupo `smtpPanel` del global «Correo y formularios»
 * con su contraseña cifrada (`overrideAccess`: el campo no se lee por la API), la clave de
 * cifrado del entorno y, si el panel no manda, las variables de Vercel. Si la base no responde,
 * las variables de Vercel (y se registra, sin datos).
 */
export async function leerSmtpEnVigor(
  payload: Payload,
  env: Entorno = process.env,
): Promise<SmtpEnVigor> {
  let panel: DatosSmtpPanel | null = null;
  try {
    const global = await payload.findGlobal({
      slug: "correo-formularios",
      depth: 0,
      overrideAccess: true,
    });
    panel = (global as { smtpPanel?: DatosSmtpPanel | null }).smtpPanel ?? null;
  } catch (error) {
    console.error(
      "[correo] no se pudo leer el SMTP del panel; se usan las variables de Vercel:",
      error instanceof Error ? error.message : error,
    );
  }
  return smtpEnVigor(panel, claveDeCifrado(env), env);
}
