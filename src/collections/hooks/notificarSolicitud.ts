import type { CollectionAfterChangeHook } from "payload";

import { leerSmtpEnVigor } from "@/lib/correo/servidor";
import {
  correoAlEquipo,
  destinoRespuesta,
  respuestaAlVisitante,
} from "@/lib/correo/avisoSolicitud";
import { destinoAvisos } from "@/lib/correo/smtp";
import { getSiteUrl } from "@/lib/seo/config";
import { datosEmpresa } from "@/lib/seo/empresa";

/**
 * Avisa por correo cuando entra una solicitud nueva (SMTP, `src/lib/correo/smtp.ts`).
 *
 * DEGRADACIÓN CONTROLADA — es la regla de esta función y lo que hay que
 * preservar al tocarla: **el aviso nunca puede costar un lead**. Si no hay SMTP
 * configurado, si el servidor está caído o rechaza el envío, la solicitud YA
 * está guardada (esto es un `afterChange`) y aquí solo se deja constancia.
 * Nunca se relanza el error: hacerlo devolvería un fallo al usuario por algo
 * que, desde su punto de vista, salió bien.
 *
 * Solo avisa al crear: cambiar el estado de una solicitud no vuelve a notificar.
 * Tarea 2 (2026-11-23): el aviso lleva el enlace al panel y hay respuesta automática al visitante.
 */
export const notificarSolicitud: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== "create") return doc;
  // La hoja de vida («Enviar HV») avisa ella misma, con el PDF adjunto: aquí no se repite.
  if (context.sinAviso) return doc;

  // En producción, el «Correo para solicitudes» del panel («Correo y formularios») y, vacío,
  // el correo de contacto de la empresa (global `seo`, con respaldo en `seoConfig`). Fuera de
  // producción, solo el destino explícito: un preview no escribe al cliente (§10.21).
  const [seo, correoFormularios] = await Promise.all([
    req.payload.findGlobal({ slug: "seo", depth: 0, req }),
    req.payload.findGlobal({ slug: "correo-formularios", depth: 0, req }),
  ]);
  const destino = destinoAvisos(
    datosEmpresa(seo.empresa).correo,
    process.env,
    correoFormularios.correoSolicitudes,
  );

  /*
   * Sin SMTP o sin destino no hay envío. Se comprueba de forma explícita en vez
   * de dejar que `sendEmail` lo registre por su cuenta: así el mensaje dice qué
   * solicitud quedó sin avisar y qué falta para arreglarlo. Solo NOMBRES de
   * campos y variables, nunca valores.
   */
  // El SMTP en vigor: el del panel si está completo, si no el de las variables de Vercel.
  const correo = await leerSmtpEnVigor(req.payload);
  if (correo.origen === "ninguno") {
    req.payload.logger.warn(
      { solicitud: doc.id },
      `Solicitud guardada SIN aviso por correo: ${correo.motivo}. El lead está en /admin y no se ha perdido.`,
    );
    return doc;
  }

  // 1. Aviso al equipo (con el enlace a la solicitud en el panel).
  if (!destino) {
    req.payload.logger.warn(
      { solicitud: doc.id },
      "Solicitud guardada SIN aviso al equipo: falta SOLICITUDES_EMAIL_TO (fuera de producción no se avisa al cliente). El lead está en /admin.",
    );
  } else {
    try {
      const { subject, text, replyTo } = correoAlEquipo(doc, getSiteUrl());
      const enviado = (await req.payload.sendEmail({ to: destino, subject, text, replyTo })) as
        { messageId?: string } | undefined;
      // El identificador del mensaje, para seguirlo si no llega (sin datos personales).
      req.payload.logger.info(
        { solicitud: doc.id, messageId: enviado?.messageId },
        "[avisos] Aviso de solicitud enviado por SMTP.",
      );
    } catch (error) {
      req.payload.logger.error(
        { err: error, solicitud: doc.id },
        "Solicitud guardada pero el aviso por correo FALLÓ. El lead está en /admin.",
      );
    }
  }

  // 2. Respuesta automática al visitante (editable; apagable). Un fallo aquí tampoco cuesta el lead.
  try {
    const respuesta = respuestaAlVisitante(doc, correoFormularios);
    const salida = respuesta && destinoRespuesta(doc.correo, respuesta.subject);
    if (respuesta && salida) {
      const enviado = (await req.payload.sendEmail({
        to: salida.to,
        subject: salida.subject,
        text: respuesta.text,
      })) as { messageId?: string } | undefined;
      req.payload.logger.info(
        { solicitud: doc.id, messageId: enviado?.messageId },
        "[avisos] Respuesta automática enviada por SMTP.",
      );
    }
  } catch (error) {
    req.payload.logger.error(
      { err: error, solicitud: doc.id },
      "[avisos] La respuesta automática al visitante FALLÓ. La solicitud está guardada.",
    );
  }

  return doc;
};
