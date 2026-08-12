"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";

import type { EstadoFormulario } from "@/lib/actions/estadoFormulario";
import { verificarTurnstile } from "@/lib/turnstile";
import { desdeFormData, validarSolicitud } from "@/lib/validation/solicitud";

/**
 * Envío de los formularios públicos.
 *
 * Todo lo que importa pasa AQUÍ, en el servidor: validación, comprobación del
 * captcha y persistencia. Lo que hace el navegador es cortesía para el usuario
 * y puede saltarse por completo enviando un POST a mano (CLAUDE.md §5).
 *
 * Este archivo NO puede exportar nada que no sea una función async — de ahí que
 * el estado inicial viva en `estadoFormulario.ts`. Ver la explicación allí.
 */

/** Mensaje único para los fallos del servidor: no se filtran detalles al usuario. */
const ERROR_GENERICO =
  "No pudimos registrar tu solicitud. Vuelve a intentarlo en un momento o escríbenos por WhatsApp.";

export async function enviarSolicitud(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  // 1. Validación. Primero, porque es barata y no toca la red.
  const resultado = validarSolicitud(desdeFormData(formData));
  if (!resultado.ok) {
    return {
      estado: "error",
      mensaje: "Revisa los campos marcados.",
      errores: resultado.errores,
    };
  }
  const datos = resultado.datos;

  // 2. Captcha. Antes de escribir nada.
  const token = formData.get("cf-turnstile-response");
  const cabeceras = await headers();
  const ip =
    cabeceras.get("cf-connecting-ip") ??
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  const humano = await verificarTurnstile(typeof token === "string" ? token : undefined, ip);
  if (!humano) {
    return {
      estado: "error",
      mensaje: "No pudimos comprobar que eres una persona. Recarga la página e inténtalo de nuevo.",
    };
  }

  // 3. Persistencia por API local (CLAUDE.md §3.2), que ignora el control de
  //    acceso: por eso la colección puede tener `create: false` y aun así
  //    aceptar envíos desde aquí, sin exponer /api/solicitudes al público.
  try {
    const payload = await getPayload({ config });

    await payload.create({
      collection: "solicitudes",
      data: {
        tipo: datos.tipo,
        estado: "nueva",
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono,
        empresa: datos.empresa,
        mensaje: datos.mensaje,
        referenciaTexto: datos.referenciaTexto,
        origen: datos.origen,
        ...(datos.referenciaTipo && datos.referenciaId
          ? { referencia: { relationTo: datos.referenciaTipo, value: datos.referenciaId } }
          : {}),
      },
    });
  } catch (error) {
    // El detalle va al registro del servidor; al usuario, un mensaje neutro
    // (CLAUDE.md §8: no exponer trazas ni ids internos).
    const payload = await getPayload({ config });
    payload.logger.error({ err: error }, "No se pudo guardar una solicitud");
    return { estado: "error", mensaje: ERROR_GENERICO };
  }

  return {
    estado: "ok",
    mensaje: "Recibimos tu solicitud. Te responderemos por correo o teléfono.",
  };
}
