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

/**
 * Cifrado de la conexión: `starttls` (587, obligatorio), `ssl` (TLS desde el principio, 465) o
 * `ninguno`. Las variables de Vercel solo dan los dos primeros (`SMTP_SECURE`); «ninguno» solo se
 * elige en el panel, con su aviso (la contraseña podría viajar sin cifrar).
 */
export type CifradoSmtp = "starttls" | "ssl" | "ninguno";

export type ConfigSmtp = {
  host: string;
  port: number;
  cifrado: CifradoSmtp;
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
      cifrado: leer(env, "SMTP_SECURE").toLowerCase() === "true" ? "ssl" : "starttls",
      user: leer(env, "SMTP_USER"),
      pass: leer(env, "SMTP_PASS"),
      fromAddress: leer(env, "SMTP_FROM_ADDRESS"),
      fromName: leer(env, "SMTP_FROM_NAME") || "Partequipos",
    },
  };
}

/**
 * A quién avisar. En producción: el «Correo para solicitudes» del panel (global
 * «Correo y formularios»), si no `SOLICITUDES_EMAIL_TO` y, si tampoco, el correo
 * de contacto de la empresa. Fuera de producción, SOLO `SOLICITUDES_EMAIL_TO`
 * (el buzón de pruebas): la base del preview es un clon de la de producción y
 * el correo del panel sería el real. `null` = no enviar.
 */
export function destinoAvisos(
  correoEmpresa: string,
  env: Entorno = process.env,
  correoDelPanel?: string | null,
): string | null {
  const delPanel = correoDelPanel?.trim() ?? "";
  if (env.VERCEL_ENV === "production" && delPanel) return delPanel;
  const propio = leer(env, "SOLICITUDES_EMAIL_TO");
  if (propio) return propio;
  return env.VERCEL_ENV === "production" ? correoEmpresa || null : null;
}

/**
 * Opciones de transporte de nodemailer. Con `ssl`, TLS desde el principio (`secure`); con
 * `starttls`, STARTTLS obligatorio (`requireTLS`); con `ninguno` (solo desde el panel), sin
 * exigirlo: nodemailer sigue subiendo a TLS si el servidor lo ofrece. Tiempos cortos: el aviso va
 * dentro de la petición del formulario.
 */
export function opcionesTransporte(c: ConfigSmtp) {
  return {
    host: c.host,
    port: c.port,
    secure: c.cifrado === "ssl",
    requireTLS: c.cifrado === "starttls",
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
}
