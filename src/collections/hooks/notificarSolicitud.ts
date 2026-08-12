import type { CollectionAfterChangeHook } from "payload";

import { seoConfig } from "@/lib/seo/config";

/**
 * Avisa por correo cuando entra una solicitud nueva (Resend).
 *
 * DEGRADACIÓN CONTROLADA — es la regla de esta función y lo que hay que
 * preservar al tocarla: **el aviso nunca puede costar un lead**. Si no hay clave
 * configurada, si Resend está caído o si la cuota se agotó, la solicitud YA está
 * guardada (esto es un `afterChange`) y aquí solo se deja constancia. Nunca se
 * relanza el error: hacerlo devolvería un fallo al usuario por algo que, desde
 * su punto de vista, salió bien.
 *
 * Solo avisa al crear: marcar una solicitud como atendida no vuelve a notificar.
 */
export const notificarSolicitud: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== "create") return doc;

  const destino = process.env.SOLICITUDES_EMAIL_TO?.trim() || seoConfig.contact.email;

  /*
   * Sin clave no hay adaptador (ver payload.config.ts). Se comprueba de forma
   * explícita en vez de dejar que `sendEmail` lo registre por su cuenta: así el
   * mensaje dice qué solicitud quedó sin avisar y qué falta para arreglarlo, en
   * vez de un aviso genérico de Payload que no permite recuperar el lead.
   */
  if (!process.env.RESEND_API_KEY) {
    req.payload.logger.warn(
      { solicitud: doc.id, destino },
      "Solicitud guardada SIN aviso por correo: falta RESEND_API_KEY. " +
        "El lead está en /admin y no se ha perdido.",
    );
    return doc;
  }

  try {
    await req.payload.sendEmail({
      to: destino,
      subject: `Nueva solicitud (${doc.tipo}) de ${doc.nombre}`,
      text: [
        `Tipo:     ${doc.tipo}`,
        `Nombre:   ${doc.nombre}`,
        `Correo:   ${doc.correo}`,
        `Teléfono: ${doc.telefono ?? "—"}`,
        `Empresa:  ${doc.empresa ?? "—"}`,
        `Producto: ${doc.referenciaTexto ?? "—"}`,
        `Origen:   ${doc.origen ?? "—"}`,
        "",
        "Mensaje:",
        doc.mensaje,
      ].join("\n"),
    });
  } catch (error) {
    req.payload.logger.error(
      { err: error, solicitud: doc.id, destino },
      "Solicitud guardada pero el aviso por correo FALLÓ. El lead está en /admin.",
    );
  }

  return doc;
};
