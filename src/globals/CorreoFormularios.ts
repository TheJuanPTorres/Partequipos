import type { FieldAccess, GlobalBeforeChangeHook, GlobalConfig } from "payload";

import { cifrar, claveDeCifrado } from "../lib/correo/cifrado";
import { enviarCorreoDePrueba } from "../lib/correo/prueba";
import { leerSmtpEnVigor } from "../lib/correo/servidor";
import { esAdministrador, soloAdmin, soloPersonal } from "../lib/seguridad/acceso";

/**
 * CORREO Y FORMULARIOS (2026-10-26, Juan Pablo no encontraba el correo de las hojas de vida ni
 * nada del SMTP): un solo sitio, en «Configuración», con
 *
 * - el ESTADO del SMTP (cuál está en vigor, servidor, cifrado y remitente; nunca el usuario ni la
 *   contraseña): campo `ui` de servidor, sin columna;
 * - los DESTINATARIOS de los formularios: el correo de las solicitudes (contacto, cotización,
 *   «Avísame») y el de las hojas de vida, que antes estaba en «Páginas índice y contacto» →
 *   «Trabaja con nosotros» (la migración lo mueve con su valor);
 * - el SMTP DESDE EL PANEL (abajo);
 * - «ENVIAR CORREO DE PRUEBA» (campo `ui` de cliente → `POST /api/globals/correo-formularios/prueba/`).
 *
 * Privado: lo lee el personal del panel y lo cambia un administrador (decide adónde van los
 * leads). Los destinatarios solo cuentan en el sitio publicado: un preview avisa siempre al buzón
 * de pruebas (`SOLICITUDES_EMAIL_TO`), porque su base es un clon de la de producción.
 *
 * EL SMTP DESDE EL PANEL (2026-10-27, Juan Pablo: que la cliente ponga sus datos sin pasárselos a
 * nadie). Grupo `smtpPanel`, SOLO para administradores (los editores ni lo ven). Si está completo,
 * manda sobre las variables de Vercel (`smtpEnVigor`). La CONTRASEÑA:
 *
 * - se escribe en `contrasenaNueva` (virtual: no se guarda tal cual) y el gancho `guardarContrasena`
 *   la guarda CIFRADA (AES-256-GCM, `src/lib/correo/cifrado.ts`) en `contrasenaCifrada`;
 * - `contrasenaCifrada` no se lee NUNCA por la API ni el panel (`read: () => false`); solo el
 *   servidor, con `overrideAccess`. Sin `hidden: true` a propósito: el `originalDoc` de un global
 *   se lee sin los campos ocultos, y cada guardado la perdería;
 * - `contrasenaGuardada` dice «guardada / no guardada», y «Borrar la contraseña» la quita.
 */

const soloAdministradores: FieldAccess = ({ req }) => esAdministrador(req.user);

type Grupo = {
  contrasenaNueva?: string | null;
  borrarContrasena?: boolean | null;
  contrasenaCifrada?: string | null;
  contrasenaGuardada?: boolean | null;
};

/**
 * Cifra la contraseña nueva, o la borra, o conserva la guardada. Lo que llegue en
 * `contrasenaCifrada` desde fuera se ignora siempre: solo este gancho la escribe.
 */
const guardarContrasena: GlobalBeforeChangeHook = ({ data, originalDoc }) => {
  // Sin el grupo en la petición (un editor, o la API sin él), no se toca nada del SMTP.
  if (!data.smtpPanel) return data;
  const nuevo = data.smtpPanel as Grupo;
  const antes = ((originalDoc as { smtpPanel?: Grupo } | undefined)?.smtpPanel ?? {}) as Grupo;
  const escrita = nuevo.contrasenaNueva?.trim() ?? "";
  let cifrada = antes.contrasenaCifrada ?? null;
  if (escrita) {
    const c = claveDeCifrado();
    if (!c.clave) {
      throw new Error(
        `No se puede guardar la contraseña del SMTP en este entorno: ${c.motivo}. Avisa a quien administra el sitio en Vercel.`,
      );
    }
    cifrada = cifrar(escrita, c.clave);
  } else if (nuevo.borrarContrasena) {
    cifrada = null;
  }
  return {
    ...data,
    smtpPanel: {
      ...nuevo,
      contrasenaNueva: null,
      borrarContrasena: false,
      contrasenaCifrada: cifrada,
      contrasenaGuardada: Boolean(cifrada),
    },
  };
};

export const CorreoFormularios: GlobalConfig = {
  slug: "correo-formularios",
  label: "Correo y formularios",
  admin: {
    group: "Configuración",
    description:
      "Adónde llegan los formularios del sitio, el correo de salida (SMTP: el del panel o el de Vercel) y un botón para enviar un correo de prueba.",
  },
  access: { read: soloPersonal, update: soloAdmin },
  hooks: { beforeChange: [guardarContrasena] },
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
          // El SMTP en vigor: el del panel si está completo (lo guardado), si no el de Vercel.
          enVigor: await leerSmtpEnVigor(req.payload),
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
      type: "collapsible",
      label: "Correo de salida (SMTP) desde el panel",
      admin: {
        initCollapsed: false,
        description:
          "Solo para administradores. Si rellenas servidor, usuario, contraseña y correo del remitente, los correos salen con estos datos y no con los de Vercel, desde el siguiente envío. La contraseña se guarda cifrada y nadie puede volver a verla.",
      },
      fields: [
        {
          name: "smtpPanel",
          type: "group",
          label: false,
          access: { read: soloAdministradores, update: soloAdministradores },
          fields: [
            {
              name: "servidor",
              type: "text",
              label: "Servidor",
              admin: {
                placeholder: "smtp.office365.com",
                description: "El servidor de correo saliente (SMTP) de la cuenta.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "cifrado",
                  type: "select",
                  label: "Cifrado",
                  defaultValue: "starttls",
                  options: [
                    { label: "STARTTLS (recomendado, puerto 587)", value: "starttls" },
                    { label: "SSL/TLS (puerto 465)", value: "ssl" },
                    { label: "Ninguno (no recomendado)", value: "ninguno" },
                  ],
                  admin: {
                    width: "60%",
                    description:
                      "«Ninguno» solo si el proveedor no admite otro: la contraseña podría viajar sin cifrar.",
                  },
                },
                {
                  name: "puerto",
                  type: "number",
                  label: "Puerto",
                  min: 1,
                  max: 65535,
                  admin: {
                    width: "40%",
                    placeholder: "587",
                    description: "Vacío: 587 con STARTTLS, 465 con SSL/TLS y 25 sin cifrado.",
                  },
                },
              ],
            },
            {
              name: "usuario",
              type: "text",
              label: "Usuario",
              admin: {
                placeholder: "avisos@empresa.com",
                description: "Normalmente, el correo completo de la cuenta que envía.",
              },
            },
            {
              // Solo de escritura: no se guarda tal cual (ver `guardarContrasena`).
              name: "contrasenaNueva",
              type: "text",
              label: "Contraseña",
              virtual: true,
              admin: { components: { Field: "/components/admin/correo/ContrasenaSmtp" } },
            },
            {
              name: "borrarContrasena",
              type: "checkbox",
              virtual: true,
              admin: { hidden: true },
            },
            {
              name: "contrasenaGuardada",
              type: "checkbox",
              defaultValue: false,
              admin: { hidden: true },
            },
            {
              // Cifrada. Solo la lee el servidor (`overrideAccess`): ver la cabecera del fichero.
              name: "contrasenaCifrada",
              type: "text",
              access: { read: () => false },
              admin: { hidden: true },
            },
            {
              type: "row",
              fields: [
                {
                  name: "remitenteCorreo",
                  type: "email",
                  label: "Correo del remitente",
                  admin: {
                    width: "50%",
                    placeholder: "avisos@empresa.com",
                    description:
                      "Desde qué dirección salen los avisos (la cuenta tiene que poder enviar como ella).",
                  },
                },
                {
                  name: "remitenteNombre",
                  type: "text",
                  label: "Nombre del remitente",
                  admin: {
                    width: "50%",
                    placeholder: "Partequipos",
                    description: "Vacío: «Partequipos».",
                  },
                },
              ],
            },
          ],
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
