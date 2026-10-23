import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { modoCorreo } from "@/lib/correo/smtp";
import { destinoHojasDeVida } from "@/lib/hojaDeVida/destino";
import { procesarHojaDeVida } from "@/lib/hojaDeVida/procesar";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { datosEmpresa } from "@/lib/seo/empresa";
import { verificarTurnstile } from "@/lib/turnstile";

/**
 * «ENVIAR HV» (`/nosotros/trabaja-con-nosotros/`, 2026-10-23): recibe el formulario con la hoja de
 * vida en PDF. Es una RUTA y no una Server Action porque las acciones tienen un tope de cuerpo de
 * 1 MB. La decisión vive en `procesarHojaDeVida` (con pruebas); aquí solo se le dan Turnstile,
 * el correo (con el PDF adjunto) y la base.
 *
 * El PDF NO se guarda: va solo de adjunto en el correo. Nada del cuerpo se escribe en el registro
 * del servidor (datos personales): los errores llevan el contexto, no la solicitud.
 */
export const dynamic = "force-dynamic";

const SIN_CACHE = { "cache-control": "no-store" };

export async function POST(peticion: Request) {
  let formData: FormData;
  try {
    formData = await peticion.formData();
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "No pudimos leer el formulario. Vuelve a intentarlo." },
      { status: 400, headers: SIN_CACHE },
    );
  }

  const ip =
    peticion.headers.get("cf-connecting-ip") ??
    peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  const respuesta = await procesarHojaDeVida(formData, {
    ip,
    verificar: verificarTurnstile,
    destino: async () => {
      const [indice, payload] = await Promise.all([getPaginasIndice(), getPayload({ config })]);
      const seo = await payload.findGlobal({ slug: "seo", depth: 0 });
      return destinoHojasDeVida(
        indice.trabaja?.correoHojasDeVida,
        datosEmpresa(seo.empresa).correo,
      );
    },
    enviarCorreo: async (correo) => {
      if (modoCorreo().modo !== "smtp") throw new Error("sin SMTP configurado");
      const payload = await getPayload({ config });
      await payload.sendEmail({
        to: correo.to,
        replyTo: correo.replyTo,
        subject: correo.subject,
        text: correo.text,
        attachments: correo.attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content),
          contentType: a.contentType,
        })),
      });
    },
    guardar: async (datos) => {
      const payload = await getPayload({ config });
      await payload.create({
        collection: "solicitudes",
        // Sin `notificarSolicitud`: el aviso ya salió, con la hoja de vida adjunta.
        context: { sinAviso: true },
        data: {
          tipo: "contacto",
          estado: "nueva",
          perfil: "empleado",
          nombre: datos.nombre,
          correo: datos.correo,
          telefono: datos.telefono,
          mensaje: [
            datos.mensaje ?? "(sin mensaje)",
            "",
            "Hoja de vida enviada por correo al equipo de selección (PDF adjunto, no guardado aquí).",
            "Autorizó el tratamiento de sus datos personales.",
          ].join("\n"),
          referenciaTexto: `Vacante: ${datos.vacante}`,
          origen: datos.origen,
        },
      });
    },
    registrarError: (contexto, error) => {
      console.error(`[hoja-de-vida] ${contexto}:`, error instanceof Error ? error.message : error);
    },
  });

  return NextResponse.json(respuesta, {
    status: respuesta.ok ? 200 : "errores" in respuesta && respuesta.errores ? 422 : 400,
    headers: SIN_CACHE,
  });
}
