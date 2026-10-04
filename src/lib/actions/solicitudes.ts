"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";

import type { EstadoFormulario } from "@/lib/actions/estadoFormulario";
import { procesarSolicitud } from "@/lib/actions/procesarSolicitud";
import { verificarTurnstile } from "@/lib/turnstile";

/**
 * Envío de los formularios públicos.
 *
 * Todo lo que importa pasa en el servidor: validación, comprobación del
 * captcha y persistencia. Lo que hace el navegador es cortesía para el usuario
 * y puede saltarse por completo enviando un POST a mano (CLAUDE.md §5).
 *
 * La decisión vive en `procesarSolicitud.ts`, con pruebas; aquí solo se le
 * dan la red (Turnstile) y la base (Payload).
 *
 * Este archivo NO puede exportar nada que no sea una función async — de ahí que
 * el estado inicial viva en `estadoFormulario.ts`. Ver la explicación allí.
 */
export async function enviarSolicitud(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const cabeceras = await headers();
  const ip =
    cabeceras.get("cf-connecting-ip") ??
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  return procesarSolicitud(formData, {
    ip,
    verificar: verificarTurnstile,
    // Persistencia por API local (CLAUDE.md §3.2), que ignora el control de
    // acceso: por eso la colección puede tener `create: false` y aun así
    // aceptar envíos desde aquí, sin exponer /api/solicitudes al público.
    guardar: async (datos) => {
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
    },
    // El detalle va al registro del servidor; al usuario, un mensaje neutro
    // (CLAUDE.md §8: no exponer trazas ni ids internos).
    registrarError: (error) => {
      console.error("[formularios] No se pudo guardar una solicitud:", error);
    },
  });
}
