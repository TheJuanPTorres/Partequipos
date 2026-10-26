import { errorSinSecretos } from "./estado";
import { modoCorreo } from "./smtp";

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
 * - sin SMTP completo no intenta nada y dice qué variables faltan, solo sus NOMBRES (409);
 * - si el servidor SMTP falla o rechaza, el motivo sin usuario ni contraseña (502).
 *
 * Las variables SMTP solo cambian con un despliegue nuevo: el resultado es el del despliegue
 * que responde.
 */
export async function enviarCorreoDePrueba(
  destino: unknown,
  deps: {
    esAdministrador: boolean;
    enviar: (correo: CorreoDePrueba) => Promise<unknown>;
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
  const modo = modoCorreo(env);
  if (modo.modo !== "smtp") {
    return {
      status: 409,
      cuerpo: {
        ok: false,
        mensaje: `No se envió: el SMTP no está configurado (${modo.motivo}). Hay que ponerlas en Vercel y volver a desplegar.`,
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
        mensaje: `Enviado a ${to}${id}. Si no llega en unos minutos, revisa la carpeta de spam.`,
      },
    };
  } catch (error) {
    return {
      status: 502,
      cuerpo: {
        ok: false,
        mensaje: `El servidor de correo no lo aceptó: ${errorSinSecretos(error, env)}`,
      },
    };
  }
}
