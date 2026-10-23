import { destinoAvisos } from "@/lib/correo/smtp";

type Entorno = Record<string, string | undefined>;

/**
 * A QUIÉN LLEGA LA HOJA DE VIDA. En producción: el «Correo para hojas de vida» del panel y, vacío,
 * el correo general de la empresa. Fuera de producción: SOLO `SOLICITUDES_EMAIL_TO` (el buzón de
 * pruebas de dirección), aunque el panel tenga un correo —la base del preview es un clon de la de
 * producción y llevaría el correo real de selección—. `null` = no se envía.
 */
export function destinoHojasDeVida(
  correoDelPanel: string | null | undefined,
  correoEmpresa: string,
  env: Entorno = process.env,
): string | null {
  const propio = correoDelPanel?.trim() ?? "";
  if (env.VERCEL_ENV === "production" && propio) return propio;
  return destinoAvisos(correoEmpresa, env);
}
