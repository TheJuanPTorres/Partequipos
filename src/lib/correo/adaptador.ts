import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import type { EmailAdapter, SendEmailOptions } from "payload";

import { leerSmtpEnVigor } from "./servidor";
import { modoCorreo, opcionesTransporte } from "./smtp";

/** Remitente por defecto cuando, al arrancar, no hay SMTP en las variables (se sustituye al enviar). */
const SIN_REMITENTE = "sin-configurar@partequipos.invalid";

/**
 * ADAPTADOR DE CORREO DEL SITIO (2026-10-27): decide EN CADA ENVÍO qué SMTP usar
 * (`leerSmtpEnVigor`: el del panel si está completo, si no el de Vercel) y delega en el adaptador
 * oficial de nodemailer con esas opciones (sin dependencias nuevas). Así un cambio en el panel
 * cuenta en el siguiente correo, sin desplegar.
 *
 * Sin ningún SMTP no envía: deja constancia SIN el asunto ni el cuerpo (pueden llevar datos de
 * la persona) y devuelve `undefined`. Quien necesita saberlo antes (avisos, hoja de vida, prueba)
 * lo comprueba con `leerSmtpEnVigor`. Antes del 2026-10-27, sin variables no había adaptador y
 * Payload escribía el correo entero en la consola.
 */
export const adaptadorCorreo: EmailAdapter = ({ payload }) => {
  const alArrancar = modoCorreo();
  const defaultFromAddress =
    alArrancar.modo === "smtp" ? alArrancar.config.fromAddress : SIN_REMITENTE;
  const defaultFromName = alArrancar.modo === "smtp" ? alArrancar.config.fromName : "Partequipos";
  return {
    name: "smtp-panel-o-vercel",
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message: SendEmailOptions) => {
      const enVigor = await leerSmtpEnVigor(payload);
      if (enVigor.origen === "ninguno") {
        payload.logger.warn(
          `[correo] No se envía un correo: no hay correo de salida configurado (${enVigor.motivo}).`,
        );
        return undefined;
      }
      const c = enVigor.config;
      const crear = await nodemailerAdapter({
        defaultFromAddress: c.fromAddress,
        defaultFromName: c.fromName,
        skipVerify: true,
        transportOptions: opcionesTransporte(c),
      });
      // El remitente por defecto de Payload (p. ej. «Olvidé mi contraseña») es el del arranque:
      // se quita para que salga el del SMTP en vigor.
      const { from, ...resto } = message;
      const delArranque = typeof from === "string" && from.includes(defaultFromAddress);
      return crear({ payload }).sendEmail(from && !delArranque ? message : resto);
    },
  };
};
