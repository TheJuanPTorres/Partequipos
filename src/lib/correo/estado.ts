import type { SmtpEnVigor } from "./enVigor";
import type { CifradoSmtp, ConfigSmtp } from "./smtp";

type Entorno = Record<string, string | undefined>;

/**
 * ESTADO DEL CORREO PARA EL PANEL («Correo y formularios», 2026-10-26; con el SMTP del panel,
 * 2026-10-27). Lo que se puede enseñar a quien edita: de dónde sale el SMTP en vigor (el panel o
 * las variables de Vercel), el servidor, el puerto, el cifrado y el remitente, y por qué el panel
 * no manda si tiene algo escrito. NUNCA el usuario ni la contraseña: no salen de esta función.
 */
export type EstadoCorreo =
  | { configurado: false; motivo: string; aviso?: string }
  | {
      configurado: true;
      origen: "panel" | "vercel";
      servidor: string;
      puerto: number;
      cifrado: string;
      remitente: string;
      aviso?: string;
    };

export const NOMBRE_CIFRADO: Record<CifradoSmtp, string> = {
  starttls: "STARTTLS obligatorio",
  ssl: "SSL/TLS desde el principio",
  ninguno: "ninguno (no recomendado: la contraseña puede viajar sin cifrar)",
};

export function estadoCorreo(enVigor: SmtpEnVigor): EstadoCorreo {
  const aviso = enVigor.aviso ? { aviso: enVigor.aviso } : {};
  if (enVigor.origen === "ninguno") return { configurado: false, motivo: enVigor.motivo, ...aviso };
  const c = enVigor.config;
  return {
    configurado: true,
    origen: enVigor.origen,
    servidor: c.host,
    puerto: c.port,
    cifrado: NOMBRE_CIFRADO[c.cifrado],
    remitente: `${c.fromName} <${c.fromAddress}>`,
    ...aviso,
  };
}

/**
 * El mensaje de un error de envío, para enseñarlo en el panel: sin el usuario ni la contraseña
 * del SMTP (los de Vercel y los del panel en vigor), aunque el servidor los repita, y corto.
 */
export function errorSinSecretos(
  error: unknown,
  env: Entorno = process.env,
  config?: Pick<ConfigSmtp, "user" | "pass"> | null,
): string {
  let texto = error instanceof Error ? error.message : String(error);
  const secretos = [env.SMTP_USER, env.SMTP_PASS, config?.user, config?.pass];
  for (const s of secretos) {
    const v = s?.trim();
    if (v && v.length >= 3) texto = texto.split(v).join("[oculto]");
  }
  texto = texto.replace(/\s+/g, " ").trim();
  return texto.length > 300 ? `${texto.slice(0, 300)}…` : texto || "error desconocido";
}
