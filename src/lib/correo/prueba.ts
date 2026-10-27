import type { SmtpEnVigor } from "./enVigor";
import { errorSinSecretos } from "./estado";

type Entorno = Record<string, string | undefined>;

export type ResultadoPrueba = { ok: boolean; mensaje: string };

export type CorreoDePrueba = { to: string; subject: string; text: string };

/** Una sola dirección, sin nombre ni lista (lo que escribe quien prueba). */
const CORREO = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

const ENTORNO: Record<string, string> = { production: "sitio publicado", preview: "preview" };

/**
 * «ENVIAR CORREO DE PRUEBA» del global «Correo y formularios» (2026-10-26). Decide y envía con
 * lo que se le da (función con pruebas; la ruta solo le pasa el usuario y `payload.sendEmail`):
 *
 * - solo un administrador (403);
 * - a UNA dirección válida (400);
 * - usa el SMTP EN VIGOR (`smtpEnVigor`: el del panel si está completo, si no el de Vercel);
 * - sin ninguno no intenta nada y dice qué falta, solo NOMBRES (409);
 * - si el servidor SMTP falla o rechaza, el motivo sin usuario ni contraseña (502).
 *
 * Los datos del panel cuentan en cuanto se guardan; las variables de Vercel, solo tras un
 * despliegue nuevo.
 */
export async function enviarCorreoDePrueba(
  destino: unknown,
  deps: {
    esAdministrador: boolean;
    enviar: (correo: CorreoDePrueba) => Promise<unknown>;
    enVigor: SmtpEnVigor;
    env?: Entorno;
    ahora?: Date;
  },
): Promise<{ status: number; cuerpo: ResultadoPrueba }> {
  const env = deps.env ?? process.env;
  if (!deps.esAdministrador) {
    return {
      status: 403,
      cuerpo: { ok: false, mensaje: "Solo un administrador puede enviar el correo de prueba." },
    };
  }
  const to = typeof destino === "string" ? destino.trim() : "";
  if (!to || to.length > 254 || !CORREO.test(to)) {
    return {
      status: 400,
      cuerpo: { ok: false, mensaje: "Escribe una sola dirección de correo válida." },
    };
  }
  const enVigor = deps.enVigor;
  if (enVigor.origen === "ninguno") {
    return {
      status: 409,
      cuerpo: {
        ok: false,
        mensaje: `No se envió: no hay correo de salida configurado (${enVigor.motivo}).${enVigor.aviso ? ` ${enVigor.aviso}` : ""} Rellena los datos del SMTP aquí, en el panel, o ponlos en Vercel y vuelve a desplegar.`,
      },
    };
  }
  const entorno = ENTORNO[env.VERCEL_ENV ?? ""] ?? "local";
  const hora = (deps.ahora ?? new Date()).toISOString().replace("T", " ").slice(0, 16);
  try {
    const r = (await deps.enviar({
      to,
      subject: `Correo de prueba de Partequipos (${entorno})`,
      text: [
        "Este es un correo de prueba enviado desde el panel de Partequipos",
        "(Configuración → «Correo y formularios»).",
        "",
        `Entorno: ${entorno}`,
        `SMTP: ${enVigor.origen === "panel" ? "el del panel" : "el de las variables de Vercel"}`,
        `Hora (UTC): ${hora}`,
        "",
        "Si te ha llegado, los avisos de los formularios pueden salir por este servidor.",
      ].join("\n"),
    })) as { messageId?: unknown } | undefined;
    const id = typeof r?.messageId === "string" ? ` (identificador ${r.messageId})` : "";
    return {
      status: 200,
      cuerpo: {
        ok: true,
        mensaje: `Enviado a ${to}${id}, con el SMTP ${enVigor.origen === "panel" ? "del panel" : "de Vercel"}. Si no llega en unos minutos, revisa la carpeta de spam.`,
      },
    };
  } catch (error) {
    return {
      status: 502,
      cuerpo: {
        ok: false,
        mensaje: `El servidor de correo no lo aceptó: ${errorSinSecretos(error, env, enVigor.config)}`,
      },
    };
  }
}
