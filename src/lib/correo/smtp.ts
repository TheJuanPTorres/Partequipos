/**
 * CORREO DE LOS AVISOS DE SOLICITUDES — por SMTP (CLAUDE.md §10.11).
 *
 * Decide, solo con las variables de entorno, si hay correo y a quién va. Lo
 * usan `payload.config.ts` (para montar el adaptador de nodemailer) y el gancho
 * `notificarSolicitud` (para avisar o dejar constancia). Función pura: no
 * conecta con nada.
 *
 * VARIABLES (los valores los pone dirección o el cliente en Vercel; nunca en
 * el repositorio):
 *
 *   SMTP_HOST            servidor SMTP
 *   SMTP_PORT            puerto (por defecto 587)
 *   SMTP_SECURE          "true" = TLS desde el principio (465); si no, STARTTLS
 *                        OBLIGATORIO (587). Nunca sin cifrar.
 *   SMTP_USER            usuario
 *   SMTP_PASS            contraseña
 *   SMTP_FROM_ADDRESS    remitente (dirección)
 *   SMTP_FROM_NAME       remitente (nombre; por defecto «Partequipos»)
 *   SOLICITUDES_EMAIL_TO destinatarios, separados por comas
 *
 * GUARDA: fuera de producción, sin `SOLICITUDES_EMAIL_TO` NO se envía nada. Si
 * no, el aviso caería al correo de contacto real del cliente desde un preview
 * (§10.21).
 */

export type ConfigSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  fromName: string;
};

export type ModoCorreo =
  { modo: "smtp"; config: ConfigSmtp } | { modo: "sin-correo"; motivo: string };

type Entorno = Record<string, string | undefined>;

const leer = (env: Entorno, k: string) => env[k]?.trim() ?? "";

/** ¿Hay SMTP completo? Si falta algo, dice qué (solo NOMBRES de variables). */
export function modoCorreo(env: Entorno = process.env): ModoCorreo {
  const faltan = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM_ADDRESS"].filter(
    (k) => !leer(env, k),
  );
  if (faltan.length > 0) return { modo: "sin-correo", motivo: `faltan ${faltan.join(", ")}` };

  const puerto = leer(env, "SMTP_PORT");
  const port = puerto ? Number(puerto) : 587;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return { modo: "sin-correo", motivo: "SMTP_PORT no es un puerto válido" };
  }

  return {
    modo: "smtp",
    config: {
      host: leer(env, "SMTP_HOST"),
      port,
      secure: leer(env, "SMTP_SECURE").toLowerCase() === "true",
      user: leer(env, "SMTP_USER"),
      pass: leer(env, "SMTP_PASS"),
      fromAddress: leer(env, "SMTP_FROM_ADDRESS"),
      fromName: leer(env, "SMTP_FROM_NAME") || "Partequipos",
    },
  };
}

/**
 * A quién avisar. En producción, sin destino propio, el correo de contacto de
 * la empresa. Fuera de producción, SOLO el destino explícito: `null` = no
 * enviar.
 */
export function destinoAvisos(correoEmpresa: string, env: Entorno = process.env): string | null {
  const propio = leer(env, "SOLICITUDES_EMAIL_TO");
  if (propio) return propio;
  return env.VERCEL_ENV === "production" ? correoEmpresa || null : null;
}

/**
 * Opciones de transporte de nodemailer. Sin cifrar NUNCA: o TLS desde el
 * principio (`secure`) o STARTTLS obligatorio (`requireTLS`). Tiempos cortos:
 * el aviso va dentro de la petición del formulario.
 */
export function opcionesTransporte(c: ConfigSmtp) {
  return {
    host: c.host,
    port: c.port,
    secure: c.secure,
    requireTLS: !c.secure,
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
}
