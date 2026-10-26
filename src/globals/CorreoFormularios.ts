import type { GlobalConfig } from "payload";

import { enviarCorreoDePrueba } from "../lib/correo/prueba";
import { esAdministrador, soloAdmin, soloPersonal } from "../lib/seguridad/acceso";

/**
 * CORREO Y FORMULARIOS (2026-10-26, Juan Pablo no encontraba el correo de las hojas de vida ni
 * nada del SMTP): un solo sitio, en «Configuración», con
 *
 * - el ESTADO del SMTP (configurado o no, servidor, cifrado y remitente; nunca el usuario ni la
 *   contraseña): campo `ui` de servidor, sin columna;
 * - los DESTINATARIOS de los formularios: el correo de las solicitudes (contacto, cotización,
 *   «Avísame») y el de las hojas de vida, que antes estaba en «Páginas índice y contacto» →
 *   «Trabaja con nosotros» (la migración lo mueve con su valor);
 * - «ENVIAR CORREO DE PRUEBA» (campo `ui` de cliente → `POST /api/globals/correo-formularios/prueba/`).
 *
 * Privado: lo lee el personal del panel y lo cambia un administrador (decide adónde van los
 * leads). Los destinatarios solo cuentan en el sitio publicado: un preview avisa siempre al buzón
 * de pruebas (`SOLICITUDES_EMAIL_TO`), porque su base es un clon de la de producción.
 */
export const CorreoFormularios: GlobalConfig = {
  slug: "correo-formularios",
  label: "Correo y formularios",
  admin: {
    group: "Configuración",
    description:
      "Adónde llegan los formularios del sitio, si el correo de salida (SMTP) está configurado y un botón para enviar un correo de prueba.",
  },
  access: { read: soloPersonal, update: soloAdmin },
  endpoints: [
    {
      path: "/prueba",
      method: "post",
      handler: async (req) => {
        let destino: unknown;
        try {
          destino = ((await req.json?.()) as { destino?: unknown } | undefined)?.destino;
        } catch {
          destino = undefined;
        }
        const { status, cuerpo } = await enviarCorreoDePrueba(destino, {
          esAdministrador: esAdministrador(req.user),
          enviar: (correo) => req.payload.sendEmail(correo),
        });
        if (status === 502) console.error("[correo] el correo de prueba falló:", cuerpo.mensaje);
        return Response.json(cuerpo, { status, headers: { "cache-control": "no-store" } });
      },
    },
  ],
  fields: [
    {
      name: "estadoSmtp",
      type: "ui",
      admin: { components: { Field: "/components/admin/correo/EstadoSmtp" } },
    },
    {
      type: "collapsible",
      label: "Destinatarios",
      admin: { initCollapsed: false },
      fields: [
        {
          name: "correoSolicitudes",
          type: "email",
          label: "Correo para solicitudes",
          admin: {
            placeholder: "ventas@…",
            description:
              "A este correo llega el aviso de cada formulario de contacto, cotización y «Avísame cuando llegue una». Vacío, el correo de contacto de «SEO y datos de la empresa». Solo cuenta en el sitio publicado.",
          },
        },
        {
          name: "correoHojasDeVida",
          type: "email",
          label: "Correo para hojas de vida",
          admin: {
            placeholder: "seleccion@…",
            description:
              "A este correo llegan las hojas de vida de «Trabaja con nosotros» («Enviar HV»), con el PDF adjunto (no se guarda en el sitio). Vacío, el correo para solicitudes. Solo cuenta en el sitio publicado.",
          },
        },
      ],
    },
    {
      name: "pruebaCorreo",
      type: "ui",
      admin: { components: { Field: "/components/admin/correo/PruebaCorreo" } },
    },
  ],
};
