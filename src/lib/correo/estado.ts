import { modoCorreo } from "./smtp";

type Entorno = Record<string, string | undefined>;

/**
 * ESTADO DEL CORREO PARA EL PANEL («Correo y formularios», 2026-10-26). Lo que se puede
 * enseñar a quien edita: si el SMTP está completo, el servidor, el puerto, el cifrado y el
 * remitente. NUNCA el usuario ni la contraseña: no salen de esta función.
 */
export type EstadoCorreo =
  | { configurado: false; motivo: string }
  | {
      configurado: true;
      servidor: string;
      puerto: number;
      cifrado: string;
      remitente: string;
    };

export function estadoCorreo(env: Entorno = process.env): EstadoCorreo {
  const m = modoCorreo(env);
  if (m.modo !== "smtp") return { configurado: false, motivo: m.motivo };
  const c = m.config;
  return {
    configurado: true,
    servidor: c.host,
    puerto: c.port,
    cifrado: c.secure ? "TLS desde el principio" : "STARTTLS obligatorio",
    remitente: `${c.fromName} <${c.fromAddress}>`,
  };
}

/**
 * El mensaje de un error de envío, para enseñarlo en el panel: sin el usuario ni la contraseña
 * del SMTP, aunque el servidor los repita, y corto.
 */
export function errorSinSecretos(error: unknown, env: Entorno = process.env): string {
  let texto = error instanceof Error ? error.message : String(error);
  for (const k of ["SMTP_USER", "SMTP_PASS"]) {
    const v = env[k]?.trim();
    if (v && v.length >= 3) texto = texto.split(v).join("[oculto]");
  }
  texto = texto.replace(/\s+/g, " ").trim();
  return texto.length > 300 ? `${texto.slice(0, 300)}…` : texto || "error desconocido";
}
